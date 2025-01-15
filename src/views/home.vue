<template>
  <!-- Navbar -->
  <nav class="navbar navbar-expand-lg navbar-light bg-light">
    <div class="container-fluid">
      <a class="navbar-brand" href="#">Logo</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" 
              data-bs-target="#navbarNav" aria-controls="navbarNav" 
              aria-expanded="false" aria-label="Toggle navigation">
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

  <!-- Main Content -->
  <div class="container mt-5 text-center">
    <h1>Video Question Generator</h1>
    <h6 class="text-muted">Quiz yourself on any YouTube video with VideoToQuestion for free!</h6>
    
    <!-- Link Form -->
    <div class="mb-3 d-flex justify-content-center">
      <form @submit.prevent="fetchQuestions" 
            class="d-flex shadow-lg p-5 rounded" 
            style="max-width: 800px; width: 100%;">
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

    <!-- Loader Animation -->
    <div v-if="loading" class="loader"></div>

    <!-- Error Message -->
    <p v-if="errorMessage" class="text-danger">{{ errorMessage }}</p>

    <!-- Questions -->
    <div v-if="questions.length" class="mt-3 text-start">
      <h4>Questions:</h4>
      <div v-for="(question, index) in questions" :key="index" class="mb-4">
        <p>{{ question.question }}</p>
        <ul>
          <li v-for="(option, optIndex) in question.options" :key="optIndex">
            {{ option }}
          </li>
        </ul>
        <p>Answer: {{ question.answer }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'; // import Axios for HTTP requests

export default {
  name: "HomeView",
  data() {
    return {
      youtubeLink: "",      // holds the YouTube link input
      questions: [],        // stores generated questions
      errorMessage: '',     // holds error messages
      loading: false        // for loader visability
    };
  },
  methods: {
    // fetch questions from the backend
    async fetchQuestions() {
      this.loading = true; // show loader
      this.errorMessage = '';  // clear previous errors
      this.questions = []; // clear previous questions
      try {
        // send GET request to backend with the YouTube link as a parameter
        const response = await axios.get('http://localhost:3000/generate-questions', {
          params: { videoUrl: this.youtubeLink }
        });

        // clean the received JSON data and pass it
        let cleanedResponse = response.data.questions.replace(/```json|```/g, '').trim();
        this.questions = JSON.parse(cleanedResponse);
      } catch (error) {
        // display error message if one of the errors occured
        this.errorMessage = error.response?.data?.error || 'An error occurred while generating questions.';
      } finally {
        this.loading = false; // hide loader
      }
    }
  }
};
</script>

<style scoped>
/* loader for the spinning circle animation gotten from : https://www.w3schools.com/howto/howto_css_loader.asp */
.loader {
  border: 16px solid #f3f3f3; /* border for the circle */
  border-top: 16px solid #008000; /* spinning part */
  border-radius: 50%; /* makes it a circle */
  width: 120px;
  height: 120px;
  animation: spin 2s linear infinite; /* continuous spin animation */
  margin: 30px auto;
}

/* keyframes for the spinning animation */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
