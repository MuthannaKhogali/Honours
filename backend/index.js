require('dotenv').config(); // loads environment variables from the .env file
const axios = require('axios'); // library for making HTTP requests
const express = require('express'); // web server framework
const cors = require('cors'); // added cors
const { exec } = require("child_process"); // used to run yt-dlp commands
const fs = require("fs"); // used to read transcript files
const path = require("path"); // used for handling file paths
const crypto = require("crypto"); // used for generating unique file names
const app = express();
const port = 5000; // port where the server is
const { registerUser, loginUser } = require('./auth');

// enables CORS for all routes
app.use(cors());
app.use(express.json()); // parses incoming JSON requests
app.use(express.urlencoded({ extended: true }));

// gets the youtube transcript using yt-dlp and saves it as a uniquely named file
const getYouTubeTranscript = async (videoUrl) => {
    return new Promise((resolve, reject) => {
        // Generate a unique filename based on timestamp and random bytes
        const uniqueId = crypto.randomBytes(6).toString("hex");
        const transcriptFile = `transcript_${uniqueId}.en.vtt`;

        exec(`yt-dlp --skip-download --write-auto-sub --sub-lang en --sub-format vtt -o "transcript_${uniqueId}.%(ext)s" ${videoUrl}`, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`yt-dlp error: ${error.message}`));
                return;
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
            }

            // Wait for the file to be written before reading it
            setTimeout(() => {
                fs.readFile(transcriptFile, "utf8", (err, data) => {
                    if (err) {
                        reject(new Error("Failed to read transcript file."));
                        return;
                    }

                    // Convert .vtt to plain text
                    const transcriptText = data
                        .split("\n")
                        .filter(line => !line.startsWith("WEBVTT") && !line.match(/^\d+$/) && !line.includes("-->"))
                        .join(" ")
                        .replace(/\s+/g, " ")
                        .trim();

                    // Cleanup: Delete the temporary transcript file
                    fs.unlink(transcriptFile, (unlinkErr) => {
                        if (unlinkErr) {
                            console.error(`Failed to delete transcript file: ${unlinkErr.message}`);
                        } else {
                            console.log(`Deleted temporary file: ${transcriptFile}`);
                        }
                    });

                    resolve(transcriptText);
                });
            }, 2000); // delay to ensure file is saved
        });
    });
};

// generates the questions
const generateQuestions = async (transcriptText) => {
    try {
        if (!transcriptText) {
            throw new Error('Transcript is empty.');
        }
        const response = await axios.post(
            `${process.env.GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, // sends the API key along with the request
            {
                // question to gemini
                contents: [{
                    parts: [{ 
                        text: `Make sure to read these subtitles: ${transcriptText}. Generate 5 multiple-choice questions.
                        The first thing you must do is find out what the general topic the video is talking about.
                        If the person making the video makes an obscure reference or example you must NOT ask about it.
                        You must also NOT ask questions about background knowledge and must be relevant to the general topic of the video.
                        Although these questions SHOULD relate to a video I do not want example questions that the video has went over to be generated.
                        If the video goes over an example question or example solution I want you to generate a new question similar to how it was done in the video.
                        Of course this only relates to questions, sometimes people want to memorize content from a video.
                        Make your own judgment for now whether to generate example questions that are similar to the video or questions that may test users' memory from the video content. 
                        You may also include both types of questions.
                        Return a JSON list of multiple-choice questions. 
                        Each question should have a 'question' string, an 'options' array with four full-text answer choices, 
                        and an 'answer' string containing the exact matching full-text choice from the options array.` 
                    }] 
                }]
            },
            {
                headers: { 'Content-Type': 'application/json' } // specifies the request payload format
            }
        );
        return response.data.candidates[0].content.parts[0].text; // returns the questions generated by the Gemini API
    } catch (error) {
        throw new Error('Error generating questions from Gemini API.');
    }
};

// endpoint to generate questions based on a YouTube video URL.
// fetches the transcript and sends it to the Gemini API for generating questions.
app.get('/generate-questions', async (req, res) => {
    const { videoUrl } = req.query;
    if (!videoUrl) {
        return res.status(400).json({ error: 'Video URL is required.' });
    }
    try {
        const transcript = await getYouTubeTranscript(videoUrl);
        const questions = await generateQuestions(transcript);
        res.json({ transcript, questions });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/register', registerUser);
app.post('/login', loginUser);

// starts the server and listens on the specified port
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// exports functions for external use or testing purposes
module.exports = { getYouTubeTranscript, generateQuestions };
