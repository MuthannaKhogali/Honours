const { exec } = require("child_process");
const fs = require("fs");

function getTranscript(videoUrl) {
    exec(`yt-dlp --skip-download --write-auto-sub --sub-lang en --sub-format vtt -o "transcript.%(ext)s" ${videoUrl}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
        }

        // Read the saved .vtt file
        fs.readFile("transcript.en.vtt", "utf8", (err, data) => {
            if (err) {
                console.error("Failed to read transcript file:", err.message);
                return;
            }

            // Convert .vtt to plain text
            const transcriptText = data
                .split("\n")
                .filter(line => !line.startsWith("WEBVTT") && !line.match(/^\d+$/) && !line.includes("-->"))
                .join(" ")
                .replace(/\s+/g, " ")
                .trim();

            console.log("Transcript:", transcriptText);
        });
    });
}

// Replace with your YouTube URL
const videoUrl = "https://www.youtube.com/watch?v=7sup2lUZ5IY";
getTranscript(videoUrl);
