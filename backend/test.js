const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');
const crypto = require('crypto');

// 👇 Function to parse VTT into timestamped entries
const parseVTT = (vttContent) => {
    const lines = vttContent.split('\n');
    const entries = [];

    let timeRegex = /(\d{2}):(\d{2}):(\d{2})\.(\d{3}) -->/;
    let currentTime = null;
    let currentText = [];

    for (let line of lines) {
        if (timeRegex.test(line)) {
            const match = line.match(timeRegex);
            if (match) {
                const [ , hh, mm, ss ] = match;
                const totalSeconds = parseInt(hh) * 3600 + parseInt(mm) * 60 + parseInt(ss);
                currentTime = `${totalSeconds}s`;
            }
        } else if (line.trim() === '') {
            if (currentTime && currentText.length) {
                entries.push({
                    time: currentTime,
                    text: currentText.join(' ').trim()
                });
                currentTime = null;
                currentText = [];
            }
        } else if (currentTime) {
            currentText.push(line.trim());
        }
    }

    if (currentTime && currentText.length) {
        entries.push({
            time: currentTime,
            text: currentText.join(' ').trim()
        });
    }

    return entries;
};

const videoUrl = "https://www.youtube.com/watch?v=CnHgqfBSgco";
const uniqueId = crypto.randomBytes(6).toString('hex');
const baseName = `transcript_${uniqueId}`;
const transcriptVttFile = path.resolve(`${baseName}.en.vtt`);
const transcriptJsonFile = path.resolve(`${baseName}.json`);

const ytDlpCommand = `yt-dlp --write-auto-sub --sub-lang en --sub-format vtt --skip-download -o "${baseName}" "${videoUrl}"`;

console.log("📥 Downloading subtitles from:", videoUrl);

exec(ytDlpCommand, (error, stdout, stderr) => {
    if (error) {
        console.error(`❌ yt-dlp failed: ${error.message}`);
        return;
    }

    console.log("✅ Subtitles downloaded. Looking for VTT file...");

    const checkFile = setInterval(() => {
        if (fs.existsSync(transcriptVttFile)) {
            clearInterval(checkFile);

            const vttContent = fs.readFileSync(transcriptVttFile, 'utf8');
            const parsed = parseVTT(vttContent);

            console.log(`✅ Parsed ${parsed.length} subtitle segments.`);

            fs.writeFileSync(transcriptJsonFile, JSON.stringify(parsed, null, 2));
            console.log(`💾 Saved parsed transcript to: ${transcriptJsonFile}`);

            // Optional: keep the .vtt file if needed
            // fs.unlinkSync(transcriptVttFile);
        }
    }, 500);
});
