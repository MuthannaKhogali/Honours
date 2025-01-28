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
    <h6 class="text-muted">Quiz yourself on any YouTube video with VideoToQuestion!</h6>
    
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
        <button type="submit" class="btn btn-dark">Generate</button>
      </form>
    </div>

    <!-- Loader Animation -->
    <div v-if="loading" class="loader"></div>

    <!-- Error Message -->
    <p v-if="errorMessage" class="text-danger">{{ errorMessage }}</p>

    <!-- Questions Section -->
    <div v-if="questions.length" class="mt-3 text-start">
      <!-- Shadow box for displaying questions and results -->
      <div class="shadow-lg p-4 mb-4 bg-white rounded">
        <!-- If quiz is not finished, show current question -->
        <template v-if="!quizFinished">
          <p>{{ questions[currentQuestion].question }}</p>
          <div class="d-flex flex-column">
            <!-- Display answer -->
            <button 
              v-for="(option, index) in questions[currentQuestion].options" 
              :key="index"
              class="btn m-1 btn-secondary"
              :class="{
                'btn-success': answers[currentQuestion] === option && feedback === 'Correct!',
                'btn-danger': feedback && answers[currentQuestion] === option && feedback !== 'Correct!',
                'btn-success': feedback !== '' && option === questions[currentQuestion].answer
              }"
              :disabled="feedback !== ''"
              @click="selectAnswer(option)">
              {{ option }}
            </button>
          </div>
          <!-- Display feedback -->
          <p v-if="feedback" :class="{'text-success': feedback === 'Correct!', 'text-danger': feedback !== 'Correct!'}">
            {{ feedback }}
          </p>
        </template>

        <!-- If quiz is finished, display score and answers -->
        <template v-if="quizFinished">
          <h2>Quiz Complete!</h2>
          <h3>Your score: {{ score }} / {{ questions.length }}</h3>
          <h4>Review your answers:</h4>
          <div v-for="(question, index) in questions" :key="index" class="mb-4">
            <p><strong>Q{{ index + 1 }}: {{ question.question }}</strong></p>
            <p><strong>Your Answer:</strong> {{ answers[index] }}</p>
            <p :class="{'text-success': answers[index] === question.answer, 'text-danger': answers[index] !== question.answer}">
              <strong>Correct Answer:</strong> {{ question.answer }}
            </p>
          </div>
        </template>
      </div>

      <!-- Navigation Buttons -->
      <div class="d-flex justify-content-between mt-3" v-if="!quizFinished">
        <button class="btn btn-secondary" @click="prevQuestion" :disabled="currentQuestion === 0">
          Previous
        </button>
        <button class="btn btn-secondary" @click="nextQuestion">
          {{ currentQuestion === questions.length - 1 ? 'Finish' : 'Next' }}
        </button>
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
      questions: [],         // stores generated questions
      errorMessage: '',      // holds error messages
      loading: false,        // for loader visibility
      currentQuestion: 0,    // keeps track of the current question index
      feedback: '',          // holds feedback for the user's answer
      score: 0,              // tracks the user's score
      selectedOption: '',    // stores the current selected option
      answers: [],           // array to store user's answers
      quizFinished: false    // tracks if the quiz is finished
    };
  },
  methods: {
    // fetches questions from the backend
    async fetchQuestions() {
      this.loading = true;
      this.errorMessage = '';
      this.questions = [];
      this.currentQuestion = 0;
      this.feedback = '';
      this.score = 0;
      this.quizFinished = false;
      this.answers = [];
      try {
        // send GET request to backend with the YouTube link as a parameter
        const response = await axios.get('http://localhost:3000/generate-questions', {
          params: { videoUrl: this.youtubeLink }
        });

        // clean the received JSON data and 
        let cleanedResponse = response.data.questions.replace(/```json|```/g, '').trim();
        this.questions = JSON.parse(cleanedResponse);
      } catch (error) {
        // display error message if an error
        this.errorMessage = error.response?.data?.error || 'An error occurred while generating questions.';
      } finally {
        this.loading = false;
      }
    },

    // handles answer selection and scoring
    selectAnswer(option) {
      this.answers[this.currentQuestion] = option;
      this.selectedOption = option;
      const correctAnswer = this.questions[this.currentQuestion].answer.trim().toLowerCase();
      if (option.trim().toLowerCase() === correctAnswer) {
        this.feedback = 'Correct!';
        this.score++;
      } else {
        this.feedback = 'Incorrect!';
      }
    },

    // moves to the next question or finishes the quiz
    nextQuestion() {
      if (this.currentQuestion < this.questions.length - 1) {
        this.currentQuestion++;
        this.feedback = '';
        this.selectedOption = this.answers[this.currentQuestion] || '';
      } else {
        this.quizFinished = true;
      }
    },

    // moves to the previous question
    prevQuestion() {
      if (this.currentQuestion > 0) {
        this.currentQuestion--;
        this.feedback = ''; // error maybe here?
        this.selectedOption = this.answers[this.currentQuestion] || '';
        if (this.answers[this.currentQuestion]) {
          const correctAnswer = this.questions[this.currentQuestion].answer.trim().toLowerCase();
          this.feedback = this.answers[this.currentQuestion].trim().toLowerCase() === correctAnswer
            ? 'Correct!'
            : 'Incorrect!';
        }
      }
    }
  }
};
</script>

<style scoped>
div {
  font-family: 'Lato', sans-serif;
}
/* loader for the spinning circle animation taken from w3 school https://www.w3schools.com/howto/howto_css_loader.asp*/
.loader {
  border: 16px solid #f3f3f3; /* border for the circle */
  border-top: 16px solid #000000; /* spinning part */
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