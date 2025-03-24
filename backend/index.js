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
const {
    registerUser,
    loginUser
} = require('./auth');
const { saveQuiz } = require("./saveQuestions");
const { getSavedQuizzes } = require("./saveQuestions");
const { deleteQuiz } = require("./saveQuestions"); 
const { updateQuiz } = require("./saveQuestions");
const { sendFriendRequest, acceptFriendRequest, getFriends, removeFriend } = require('./friend');
const { sendQuizToFriend, getReceivedQuizzes } = require('./receivedQuestions');
// enables CORS for all routes
app.use(cors());
app.use(express.json()); // parses incoming JSON requests
app.use(express.urlencoded({
    extended: true
}));


const getYouTubeTranscript = async (videoUrl) => {
    return new Promise((resolve, reject) => {
        const uniqueId = crypto.randomBytes(6).toString("hex");
        const transcriptFile = path.resolve(__dirname, `transcript_${uniqueId}.en.vtt`); // Ensure absolute path
        const cookiesFile = "/home/ec2-user/youtube-cookies.txt";

        console.log(` Running yt-dlp for video: ${videoUrl}`);
        console.log(`Expected transcript file path: ${transcriptFile}`);
        

        const ytDlpCommand = `yt-dlp --cookies "${cookiesFile}" --skip-download --write-auto-sub --sub-lang en --sub-format vtt -o "transcript_${uniqueId}" "${videoUrl}"`;

        exec(ytDlpCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`yt-dlp error: ${error.message}`);
                reject(new Error(`yt-dlp error: ${error.message}`));
                return;
            }
            console.error(`stderr: ${stderr}`);

            console.log("Waiting for transcript file to be saved...");

            let attempts = 0;
            const checkFileExists = setInterval(() => {
                if (fs.existsSync(transcriptFile)) {
                    clearInterval(checkFileExists);
                    console.log(`Transcript file found: ${transcriptFile}`);

                    fs.readFile(transcriptFile, "utf8", (err, data) => {
                        if (err) {
                            reject(new Error("Failed to read transcript file."));
                            return;
                        }

                        resolve(data);
                    });
                } else if (attempts >= 20) {
                    clearInterval(checkFileExists);
                    reject(new Error(`Transcript file not found after 10 seconds: ${transcriptFile}`));
                } else {
                    attempts++;
                }
            }, 500);
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
                            - THE TYPE MUST BE ('multiple-choice', 'true-false', or 'short-answer'),
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
    console.log("Generate Questions API Hit", req.query);
    const {
        videoUrl,
        numQuestions = 5,
        questionTypes = ["multiple-choice"],
        userID
    } = req.query;
    if (!videoUrl || !userID) {
        console.error("Missing parameters:", { videoUrl, userID });
        return res.status(400).json({ error: 'Video URL and userID are required.' });
    }
    try {
        console.log("Fetching transcript for video:", videoUrl);
        const transcript = await getYouTubeTranscript(videoUrl);
        console.log("Sending to Gemini API...");
        const questions = await generateQuestions(transcript, parseInt(numQuestions), JSON.parse(questionTypes), userID, videoUrl);
        console.log("Questions Generated Successfully!");
        const normalizedQuestions = JSON.parse(questions).map(q => ({
            ...q,
            type: q.type
                .replace(/_/g, "-")
                .toLowerCase()
        }));  
        res.json({
            transcript,
            questions: normalizedQuestions
        });        
    } catch (error) {
        console.error("Error in /generate-questions:", error);
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
                        If the user does minor spelling mistake do not mark them wrong however if there is multiple spelling mistakes within one answer from the user YOU mark it with "Incorrect!".
                        If the response is incorrect or missing critical details, respond with "Incorrect!".

                        
                        YOU MUST INCLUDE an explanations on why a user got it incorerct if you respond with "Incorrect!" 
                        Format it like this "Your answer didn't show ect ect ect, the correct answer is"
                        HOWEVER Do NOT include any explanations, examples, or additional text. If you respond with  "Correct!".`
  
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

app.delete("/delete-quiz", async (req, res) => {
    try {
      console.log("DELETE request received:", req.body);
  
      const { userID, quizID } = req.body;
      if (!userID || !quizID) {
        return res.status(400).json({ success: false, message: "Missing userID or quizID" });
      }
  
      const result = await deleteQuiz(userID, quizID);
      res.json(result);
    } catch (error) {
      console.error("Error deleting quiz:", error);
      res.status(500).json({ success: false, message: "Failed to delete quiz." });
    }
  });

  app.post('/update-quiz', async (req, res) => {
    const { userID, quizID, questions } = req.body;

    if (!userID || !quizID || !Array.isArray(questions)) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }

    try {
        const result = await updateQuiz(userID, quizID, questions);
        res.json(result);
    } catch (error) {
        console.error("Error updating quiz:", error.message);
        res.status(500).json({ error: 'Failed to update quiz.' });
    }
});


app.post("/send-friend-request", sendFriendRequest);
app.post("/accept-friend-request", acceptFriendRequest);
app.get("/get-friends", getFriends);
app.post("/remove-friend", removeFriend);

app.post('/register', registerUser);
app.post('/login', async (req, res) => {
    try {
        console.log("Login request received:", req.body); // logs incoming requests clearly
        await loginUser(req, res);
    } catch (error) {
        console.error("Login route caught error explicitly:", error);  // logs clearly
        res.status(500).json({ error: error.message });
    }
});


app.post('/send-quiz-to-friend', sendQuizToFriend);
app.get('/get-received-quizzes', getReceivedQuizzes);

app.get("/", (req, res) => {
    res.status(200).send("OK");
});
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// exports functions for external use or testing purposes
module.exports = {
    getYouTubeTranscript,
    generateQuestions
};