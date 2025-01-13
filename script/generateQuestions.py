# Gemini API referenced from: https://ai.google.dev/gemini-api/docs
# Getting youtube transcript refrenced from: https://www.youtube.com/watch?v=9WrZc0Jy8sA

# imports youtube script api and gemini api
from youtube_transcript_api import YouTubeTranscriptApi as yta
import google.generativeai as genai

# gets my gemini api key
genai.configure(api_key="AIzaSyBY9k0tUWzHUF0iH3ARJJUrYRQ_vbniG34")

# sets videoID for the video you want
vidID = "WWf3MnQ1SwU&t"

# fetches transcript data
data = yta.get_transcript(vidID)

transcript = ""

# loops through each subtitle segement

for value in data:
    # loops through keys and values
    for key, val in value.items():
        # if key is text add to transcript and add spaces
        if key == "text":
            transcript += val + " "

# prints transcript to check subtitles if need be          
# print(transcript)

# pick what model to use
model = genai.GenerativeModel("gemini-1.5-flash")

# ask gemini question based on the subtitles
response = model.generate_content("Read these subtitles " + transcript + " Generate me 5 multilpe choice questions on this video. Make sure answer key is written with the answers written(letter and what the answer said beside it).  also please remove ** dont make anything bold in the title " )

# prints response text
print(response.text)


