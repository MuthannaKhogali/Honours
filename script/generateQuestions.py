# imports youtube script api
from youtube_transcript_api import YouTubeTranscriptApi as yta

# sets videoID for the video you want
vidID = "arj7oStGLkU"

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

# prints transcript           
print(transcript)
        
