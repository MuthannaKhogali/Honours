const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function getTranscript(videoUrl) {
    // Generate a unique filename based on timestamp
    const uniqueId = crypto.randomBytes(6).toString("hex");
    const transcriptFile = `transcript_${uniqueId}.en.vtt`;

    exec(`yt-dlp --skip-download --write-auto-sub --sub-lang en --sub-format vtt -o "transcript_${uniqueId}.%(ext)s" ${videoUrl}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
        }

        // Read the unique transcript file
        fs.readFile(transcriptFile, "utf8", (err, data) => {
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

            // Cleanup: Delete the temporary transcript file
            fs.unlink(transcriptFile, (unlinkErr) => {
                if (unlinkErr) {
                    console.error(`Failed to delete transcript file: ${unlinkErr.message}`);
                } else {
                    console.log(`Deleted temporary file: ${transcriptFile}`);
                }
            });
        });
    });
}

// Replace with your YouTube URL
const videoUrl = "https://www.youtube.com/watch?v=7sup2lUZ5IY";
getTranscript(videoUrl);
