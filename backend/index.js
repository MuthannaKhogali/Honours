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
                            - For multiple-choice and true/false, the 'answer' field MUST match one of the provided options exactly.  
                            - The 'type' field MUST be one of ONLY these exact strings: "multiple-choice", "true-false", or "short-answer".  
                            - Do NOT use variations like "true_false" or any other format.
                            - Have a roughly equal mix of each requested question type.  
                            - Do not generate explanations—only questions, answer choices, and correct answers.
                            - If you struggle to create ${numQuestions} generate relevant ones.
                            - The questions should be spread evenly throughout the entire video.
                            - Avoid clustering all questions near the beginning — distribute them across the full video duration.
                            - Ensure that some questions are based on early content, some from the middle, and some from the end.
                            - If the video has an obscure reference or sponsor do not bring it up in the question, questions should be relevant to the topic.
                            - You should NOT generate an example that has been gone over in the video but you should create your own examples that are similar.
                            - When making the question please generate when in the video the question occurs in seconds like "60s" or "115s", the time should be from the transcript.
                            - Even if you generate relevant questions, you must say where in the video they are useful.
                            - You MUST carefully match each question to the exact portion of the transcript it relates to.
                            - The 'time' field MUST be as accurate as possible to the moment in the transcript the content is discussed.
                            - DO NOT estimate or guess the time — only assign a time if its directly connected to the transcript.
                            - YOU must NOT include the time in the question text.
                        Return a JSON list where each question contains:
                            - 'question' (string),
                            - 'type' ('multiple-choice', 'true-false', or 'short-answer'),
                            - THE TYPE MUST BE ('multiple-choice', 'true-false', or 'short-answer') ONLY — use this exact spelling and format,
                            - 'options' (array of choices, empty for short-answer),
                            - 'answer' (the correct answer as a string — MUST match one of the options for non-short-answer questions),
                            - 'time' (time in seconds as a string, e.g., "120s" for 2 minutes). 
                            - DO NOT ADD ANY ADDITIONAL PARAGRAPHS
                        Tips for designing a good question I RECOMMEND you should follow:
                            - Make sure they are clear, concise, and relevant to the video.
                            - For true/false questions, make false statements subtly incorrect, not obviously wrong.
                            - Short answer questions SHOULD start with State, Describe, or Explain.
                            - Of course, if State, Describe, or Explain doesn't fit the nature of the question, do not force it in — for example, in a math question.
                            - Each question should test understanding or application, not just recall.
                            - Don't repeat the same wording used in the transcript word-for-word — rephrase where possible.
                            - Use real-world or practical examples to make questions more engaging, but avoid referencing things not mentioned in the video.
                            - Vary difficulty — include a mix of simple and more thought-provoking questions.
                            - Do not use overly complex phrasing; keep the language age-appropriate and accessible.
                            - If the video includes step-by-step processes, ask questions that test understanding of those steps (e.g., "What is the first step in...?")
                            - Never create trick questions — be fair and informative.
                            - Avoid ambiguity — make sure only one answer is clearly correct.`
                        
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
        res.json({
            transcript,
            questions
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
                        text: `Compare the following two responses from this question: "${question}"
                        User Answer: "${userAnswer}"
                        Correct Answer: "${correctAnswer}"

                        Mark the user answer as either:
                        - "Correct!" (if their answer conveys the same meaning or key ideas)
                        - "Incorrect!" (if it's wrong or incomplete)

                        Guidelines:
                        - If the question starts with "State", a short specific fact is sufficient.
                        - If the question starts with "Describe" or "Explain", the user must show deeper understanding — a longer answer may be required.
                        - For example style questions, accept any valid example — not just ones from the correct answer.
                        - Spelling mistakes should NOT affect correctness unless they change the meaning or make the answer unreadable.
                        - Minor differences in wording are fine as long as the meaning matches.
                        - If the user gives a vague or partially correct answer, consider it "Incorrect!" unless it clearly covers the main idea.

                        If your response is "Incorrect!", explain briefly why the user got it wrong using this format:
                        "Your answer didn't show [missing idea]. The correct answer is: [correct answer]"

                        However, if the answer is "Correct!", do NOT add any explanation — just return "Correct!".`
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