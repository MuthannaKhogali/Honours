const { getTranscript } = require('youtube-transcript-api');

(async () => {
    try {
        console.log("Fetching transcript...");
        const transcript = await getTranscript('G8HrT6HBqwI'); // Test with a known working video
        console.log("Transcript:", transcript);
    } catch (error) {
        console.error("Error:", error.message);
    }
})();
