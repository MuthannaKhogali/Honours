require('dotenv').config(); //gets from env file
const axios = require('axios'); // for http requests
const express = require('express'); //for setting up the server
const cors = require('cors'); // adds cors
const { getTranscript } = require('youtube-transcript-api'); // imports youtube transcript api
const app = express();
const port = 3000; // set port to 3000

// enables cors on all routes
app.use(cors());

// this functino extracts the transcript from a youtube video
const getYouTubeTranscript = async (videoUrl) => {
    try {
        // gets video ID by retriving value from v, gets the transcript and joins them together
        const videoId = new URL(videoUrl).searchParams.get('v');
        const transcriptData = await getTranscript(videoId);
        const transcript = transcriptData.map(item => item.text).join(' ');
        console.log(`Extracted transcript from: ${videoUrl}`);
        return transcript;
    } catch (error) {
        console.error('Error extracting transcript:', error);
        return "";
    }
};

// sends transcript to gemiini
const generateQuestions = async (transcript) => {
    try {
        const response = await axios.post(
            `${process.env.GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, // sends the api key 
            {
                //prompt to gemini
                contents: [{ parts: [{ text: `Read these subtitles: ${transcript}. Generate 5 multiple-choice questions. Return the questions as a JSON array where each question has 'question', 'options', and 'answer' keys.
                     I only want you to do this not to say something like "Here is your generated questions"` }] }]
            },
            {
                headers: {
                    'Content-Type': 'application/json' // sets the request headers
                }
            }
        );
        // returns the generated questions
        return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('Error generating questions:', error.response ? error.response.data : error.message);
        return [];
    }
};

// endpoint for handling video url and generating questions
app.get('/generate-questions', async (req, res) => {
    // getst video id, fetches transcript and generates questions 
    const { videoUrl } = req.query;
    if (!videoUrl) {
        return res.status(400).send('Video URL is required.');
    }
    const transcript = await getYouTubeTranscript(videoUrl);
    const questions = await generateQuestions(transcript);
    res.json({ transcript, questions });
});

// starts server
app.listen(port, () => {
    console.log(`server up http://localhost:${port}`);
});

// exports functions
module.exports = { getYouTubeTranscript, generateQuestions };
