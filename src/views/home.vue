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
    <h6 class="text-muted">Quiz yourself on any YouTube video with VideoToQuestion for free!</h6>
    <div class="mb-3 d-flex justify-content-center">
        <form @submit.prevent="fetchQuestions" class="d-flex shadow-lg p-5 rounded" style="max-width: 800px; width: 100%;">
          <input 
            v-model="youtubeLink" 
            type="text" 
            class="form-control me-2" 
            id="exampleLink" 
            placeholder="Enter YouTube link"
            autocomplete="off"
          />
          <button type="submit" class="btn btn-success">Generate</button>
        </form>
      </div>
      <div v-if="questions.length" class="mt-3 text-start">
        <h4>Questions</h4>
        <p>{{ questions }}</p>
      </div>
    </div>
    <p class="position-absolute bottom-0 start-0 ms-3 mb-3 text-muted">Powered by Gemini</p>
</template>

<script>
import axios from 'axios';

export default {
  name: "HomeView",
  data() {
    return {
      youtubeLink: "",
      questions: []
    };
  },
  methods: {
    async fetchQuestions() {
      try {
        const response = await axios.get('http://localhost:3000/generate-questions', {
          params: { videoUrl: this.youtubeLink }
        });
        this.questions = response.data.questions;
      } catch (error) {
        console.error('Error fetching questions:', error);
      }
    }
  }
};
</script>

<style scoped>
</style>
