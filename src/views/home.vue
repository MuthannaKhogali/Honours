<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-light">
    <div class="container-fluid">
      <a class="navbar-brand" href="#">Logo</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto">
          <li class="nav-item">
            <a class="nav-link" href="#">Login</a>
          </li>
        </ul>
      </div>
    </div>
  </nav>

  <div class="container mt-5 text-center">
    <h1>Video Question Generator</h1>
    <h6 class ="text-muted">Quiz yourself on any YouTube video with VideoToQuestion for free!</h6>
    <div class="mb-3 d-flex justify-content-center">
        <form @submit.prevent="extractVideoId" class="d-flex shadow-lg p-5 rounded" style="max-width: 800px; width: 100%;">
          <input 
            v-model="youtubeLink" 
            type="text" 
            class="form-control me-2" 
            id="exampleLink" 
            placeholder="Enter YouTube link"
          />
          <button type="submit" class="btn btn-success">Generate</button>
        </form>
      </div>
      <div v-if="videoId" class="mt-3">
        <p>Video ID: {{ videoId }}</p>
      </div>
    </div>
    <p class="position-absolute bottom-0 start-0 ms-3 mb-3 text-muted">Powered by Gemini</p>
</template>

<script>
// Refrenced from: https://stackoverflow.com/questions/3452546/how-do-i-get-the-youtube-video-id-from-a-url & https://www.labnol.org/code/19797-regex-youtube-id/
export default {
  name: "HomeView",
  data() {
    return {
      youtubeLink: "",
      videoId: null,
    };
  },
  methods: {
    // uses regex and match to find a youtube video and extracts vid id
    extractVideoId() {
      const regex = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/.*v=([^&\s]+)|youtu\.be\/([^&\s]+)/;
      const match = this.youtubeLink.match(regex);
      if (match) {
        this.videoId = match[1] || match[2];
      } else {
        this.videoId = null;
      }
    },
  },
};
</script>

<style scoped>
</style>
