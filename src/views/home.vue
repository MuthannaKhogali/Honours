<template>
  <div class="container mt-5 text-center">
    <h1>QUESTION GENERATION PROTOTYPE</h1>
    <div class="mb-3">
      <form @submit.prevent="extractVideoId">
        <input 
          v-model="youtubeLink" 
          type="text" 
          class="form-control" 
          id="exampleLink" 
          placeholder="Enter YouTube link"
        />
        <button type="submit" class="btn btn-success mt-3">Generate</button>
      </form>
      <div v-if="videoId" class="mt-3">
        <p>Video ID: {{ videoId }}</p>
      </div>
    </div>
  </div>
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
    //uses regex and match to find a youtube video and extracts vid id
    extractVideoId() {
      const regex = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/.*v=([^&\s]+)|youtu\.be\/([^&\s]+)/;
      const match = this.youtubeLink.match(regex);
      if (match) {
        this.videoId = match[1] || match[2];
      } else {
        this.videoId = null;
        alert("wrong youtube link");
      }
    },
  },
};
</script>

<style scoped>
</style>
