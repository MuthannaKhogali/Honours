require('dotenv').config(); // loads environment variables from the .env file
const axios = require('axios'); // library for making HTTP requests
const express = require('express'); // web server framework
const cors = require('cors'); // added cors
const {
    exec
} = require("child_process"); // used to run yt-dlp commands
const fs = require("fs"); // used to read transcript files
const path = require("path"); // used for handling file paths
const crypto = require("crypto"); // used for generating unique file names
const app = express();
const port = 5000; // port where the server is
const {
    registerUser,
    loginUser
} = require('./auth');
const { saveQuiz } = require("./saveQuestions");
const { getSavedQuizzes } = require("./saveQuestions");
// enables CORS for all routes
app.use(cors());
app.use(express.json()); // parses incoming JSON requests
app.use(express.urlencoded({
    extended: true
}));

// gets the youtube transcript using yt-dlp
const getYouTubeTranscript = async (videoUrl) => {
    return new Promise((resolve, reject) => {
        // generate a unique
        const uniqueId = crypto.randomBytes(6).toString("hex");
        const transcriptFile = `transcript_${uniqueId}.en.vtt`;

        // escape the videoUrl by wrapping it in double quotes
        exec(`yt-dlp --skip-download --write-auto-sub --sub-lang en --sub-format vtt -o "transcript_${uniqueId}.%(ext)s" "${videoUrl}"`, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`yt-dlp error: ${error.message}`));
                return;
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
            }

            // wait for the file to be written before reading it
            setTimeout(() => {
                fs.readFile(transcriptFile, "utf8", (err, data) => {
                    if (err) {
                        reject(new Error("Failed to read transcript file."));
                        return;
                    }

                    // convert .vtt to plain text
                    const transcriptText = data
                        .split("\n")
                        .filter(line => !line.startsWith("WEBVTT") && !line.match(/^\d+$/) && !line.includes("-->"))
                        .join(" ")
                        .replace(/\s+/g, " ")
                        .trim();

                    // delete the temporary transcript file
                    fs.unlink(transcriptFile, (unlinkErr) => {
                        if (unlinkErr) {
                            console.error(`Failed to delete transcript file: ${unlinkErr.message}`);
                        } else {}
                    });

                    resolve(transcriptText);
                });
            }, 2000); // delay to ensure file is saved
        });
    });
};

// generates the questions
const generateQuestions = async (transcriptText, numQuestions, questionTypes, userID, youtubeLink) => {
    try {
        if (!transcriptText) {
            throw new Error('Transcript is empty.');
        }

        let questionTypeInstruction = [];

        if (questionTypes.includes("multiple-choice")) {
            questionTypeInstruction.push(`multiple-choice questions with four distinct answer choices.`);
        }
        if (questionTypes.includes("true-false")) {
            questionTypeInstruction.push(`true/false questions that can only be answered as "True" or "False".`);
        }
        if (questionTypes.includes("short-answer")) {
            questionTypeInstruction.push(`short-answer questions where the user must type the correct answer.`);
        }

        // combine into a single instruction
        let formattedInstruction = questionTypeInstruction.join(" Also include ");

        // make sure only generates specific questions
        let strictFilter = `You must ONLY generate the requested types of questions: ${questionTypes.join(", ")}. DO NOT generate any other question type NO MATTER WHAT.`;

        console.log("sending request to Gemini API...", { numQuestions, questionTypes });

        const response = await axios.post(
            `${process.env.GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
            {
                contents: [{
                    parts: [{
                        text: `Read the transcript carefully: ${transcriptText}.  
                        Generate exactly ${numQuestions} questions that are strictly ${formattedInstruction}.  
                        ${strictFilter}  
                        Rules:
                        - If generating multiple-choice questions, provide exactly four answer choices.  
                        - If generating true/false questions, provide only two answer choices: ["True", "False"].  
                        - Have a roughly equal mix of each requested question type.  
                        - Do not generate explanations—only questions, answer choices, and correct answers.
                        - If you struggle to create ${numQuestions} generate relevant ones
                        - If the video has an obscure reference do not bring it up in the question, questions should be relevant to the topic
                        - You should NOT generate an example that has been gone over in the video but you shoulde create your own examples that are similar
                        - When making the question please generate when in the video the question in seconds like "60s" or "115s", the time should be in the transcript.
                        - Even if you generate relevant questions you should say where in the video it would help to answer these questions.
                        - Try to keep the time it was taken from as accurate as possible 
                        - YOU must NOT include the time in the question itself
                        Return a JSON list where each question contains:
                            - 'question' (string),
                            - 'type' ('multiple-choice', 'true-false', or 'short-answer'),
                            - 'options' (array of choices, empty for short-answer),
                            - 'answer' (the correct answer as a string),    
                            - 'time' (time in seconds as a string, e.g., "120s" for 2 minutes). 
                            - DO NOT ADD ANY ADDITIONAL PARAGRAPHS
                        Tips for designing a good question I RECCOMEND you should follow:
                            - Make they are clear, concise and relevant to the video
                            - For true and false questions make false statements subtly incorrect, not obviously wrong.
                            - Short answer questions SHOULD start with State, Describe or Explain
                            - Ofcourse if state, describe or explain does not fit the nature of the question do not force it in for example a maths question`
                        
                    }]
                }]
            },
            { headers: { 'Content-Type': 'application/json' } }
        );

        console.log("response from Gemini:", response.data);

        // Ensure response structure is valid
        if (!response.data.candidates || !response.data.candidates[0] || !response.data.candidates[0].content) {
            throw new Error("invalid response from Gemini API.");
        }

        console.log(response.data.candidates[0].content.parts[0].text); 
        return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("error in generateQuestions:", error.message);
        throw new Error('Error generating questions from Gemini API.');
    }
};


// endpoint to generate questions based on a YouTube video URL.
// fetches the transcript and sends it to the Gemini API for generating questions.
app.get('/generate-questions', async (req, res) => {
    const {
        videoUrl,
        numQuestions = 5,
        questionTypes = ["multiple-choice"],
        userID
    } = req.query;
    if (!videoUrl || !userID) {
        return res.status(400).json({ error: 'Video URL and userID are required.' });
    }
    try {
        const transcript = await getYouTubeTranscript(videoUrl);
        const questions = await generateQuestions(transcript, parseInt(numQuestions), JSON.parse(questionTypes), userID, videoUrl);
        res.json({
            transcript,
            questions
        });
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
});

app.post('/validate-answer', async (req, res) => {
    const { userAnswer, question, correctAnswer } = req.body;

    if (!userAnswer || !question || !correctAnswer) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }

    try {
        const response = await axios.post(
            `${process.env.GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, 
            {
                contents: [{
                    parts: [{
                        text: `Compare the following two responses from this question, "${question}":
                        User Answer: "${userAnswer}"
                        Correct Answer: "${correctAnswer}"
                        
                        If the question starts with state, the user would just need to put in a short answer
                        If the questions starts with describe or explain the user must go a little more in depth with it

                        If it doesn't start with either 3 use your own judgement.

                        The user does NOT need to say the exact same answer even if its related enough mark it correct.
                        If the is something question like give an example, mark the user correct if they give any correct example not just one in the correct answer.
      
                        If the meaning is similar and the user's response conveys the same key idea, respond with "Correct!".
                        If the response is incorrect or missing critical details, respond with "Incorrect!".
                        
                         Do NOT include any explanations, examples, or additional text. only respond with "Incorrect!" or "Correct".`

                        
                    }]
                }]
            }, 
            { headers: { 'Content-Type': 'application/json' } }
        );

        if (!response.data.candidates || !response.data.candidates[0]?.content?.parts[0]?.text) {
            throw new Error("Invalid Gemini response format.");
        }

        const feedback = response.data.candidates[0].content.parts[0].text.trim();

        // debugging log to check response from Gemini
        console.log("Gemini validation response:", feedback); 

        // send feedback correctly
        res.json({ feedback });

    } catch (error) {
        res.status(500).json({ error: 'Error validating answer with Gemini.' });
    }
});

app.post('/save-quiz', async (req, res) => {
    const { userID, youtubeLink, questions, quizName } = req.body;

    if (!userID || !youtubeLink || !questions || !Array.isArray(questions) || !quizName) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }

    try {
        const quizID = await saveQuiz(userID, youtubeLink, questions, quizName);
        res.json({ message: 'Quiz saved successfully!', quizID });
    } catch (error) {
        console.error("Error saving quiz:", error.message);
        res.status(500).json({ error: 'Error saving quiz to database.' });
    }
});

app.get('/get-saved-quizzes', async (req, res) => {
    const { userID } = req.query;

    if (!userID) {
        return res.status(400).json({ error: "User ID is required." });
    }

    try {
        const savedQuizzes = await getSavedQuizzes(userID);
        res.json({ savedQuizzes });
    } catch (error) {
        console.error("Error fetching saved quizzes:", error.message);
        res.status(500).json({ error: "Error fetching saved quizzes." });
    }
});

app.post('/register', registerUser);
app.post('/login', loginUser);

// starts the server and listens on the specified port
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// exports functions for external use or testing purposes
module.exports = {
    getYouTubeTranscript,
    generateQuestions
};