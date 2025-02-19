<template>
  <div>
    <!-- Navbar -->
    <nav class="navbar navbar-expand-lg custom-navbar">
      <div class="container-fluid">
        <a class="navbar-brand" href="#">Logo</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto">
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown">
                {{ username }}
              </a>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><a class="dropdown-item" href="#" @click="logout">Log out</a></li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="container mt-4">
      <h3>Welcome Back, {{ username }}!</h3>
      <p class="mt-3">
        Want to generate questions?
        <router-link to="/account" class="btn btn-success">Generate Now</router-link>
      </p>

      <!-- Saved Quizzes Section -->
      <div class="mt-5">
        <h3>Saved Quizzes</h3>
        <div v-if="loading" class="loader"></div>
        <div v-if="savedQuizzes.length === 0 && !loading" class="text-muted">No saved quizzes found.</div>

        <div class="row mt-3">
          <div class="col-md-4" v-for="quiz in savedQuizzes" :key="quiz.quizID">
            <div class="card shadow-sm">
              <div class="card-body">
                <h5 class="card-title">{{ quiz.quizName }}</h5>
                <p class="card-text"><strong>Video:</strong> <a :href="quiz.youtubeLink" target="_blank">View</a></p>
                <button @click="reattemptQuiz(quiz)" class="btn btn-primary">Reattempt Quiz</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quiz Modal -->
      <div v-if="showQuizModal" class="modal-overlay">
        <div class="modal-content">
          <span class="close-modal" @click="showQuizModal = false">&times;</span>
          <h4>{{ activeQuiz.quizName }}</h4>

          <div v-if="quizFinished">
            <h3>Quiz Complete!</h3>
            <h4>Your Score: {{ score }} / {{ activeQuiz.questions.length }}</h4>
            <button class="btn btn-secondary mt-3" @click="showQuizModal = false">Close</button>
          </div>

          <div v-else>
            <p><strong>Question:</strong> {{ activeQuiz.questions[currentQuestion].question }}</p>

            <!-- Multiple Choice -->
            <div v-if="activeQuiz.questions[currentQuestion].type === 'multiple-choice'">
              <button
                v-for="(option, index) in activeQuiz.questions[currentQuestion].options"
                :key="index"
                class="btn btn-secondary m-1"
                @click="selectAnswer(option)"
              >
                {{ option }}
              </button>
            </div>

            <!-- True/False -->
            <div v-if="activeQuiz.questions[currentQuestion].type === 'true-false'">
              <button class="btn btn-secondary m-1" @click="selectAnswer('True')">True</button>
              <button class="btn btn-secondary m-1" @click="selectAnswer('False')">False</button>
            </div>

            <!-- Short Answer -->
            <div v-if="activeQuiz.questions[currentQuestion].type === 'short-answer'">
              <input v-model="selectedAnswer" class="form-control" placeholder="Type your answer here" />
              <button class="btn btn-success mt-2" @click="submitShortAnswer">Submit</button>
            </div>

            <p v-if="feedback" class="mt-2">{{ feedback }}</p>

            <!-- Navigation Buttons -->
            <div class="d-flex justify-content-between mt-3">
              <button class="btn btn-secondary" @click="prevQuestion" :disabled="currentQuestion === 0">Previous</button>
              <button class="btn btn-primary" @click="nextQuestion">
                {{ currentQuestion === activeQuiz.questions.length - 1 ? 'Finish' : 'Next' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      username: localStorage.getItem('username') || 'USERNAME',
      savedQuizzes: [],
      loading: false,
      showQuizModal: false,
      activeQuiz: null,
      currentQuestion: 0,
      selectedAnswer: '',
      feedback: '',
      score: 0,
      quizFinished: false
    };
  },
  mounted() {
    this.getUsername();
    this.fetchSavedQuizzes();
  },
  methods: {
    getUsername() {
      this.username = localStorage.getItem('username') || 'USERNAME';
    },
    async fetchSavedQuizzes() {
      this.loading = true;
      try {
        const userID = localStorage.getItem('userID');
        const response = await axios.get('http://localhost:5000/get-saved-quizzes', { params: { userID } });
        this.savedQuizzes = response.data.savedQuizzes;
      } catch (error) {
        console.error("Error fetching quizzes:", error);
      } finally {
        this.loading = false;
      }
    },
    reattemptQuiz(quiz) {
      this.activeQuiz = quiz;
      this.currentQuestion = 0;
      this.quizFinished = false;
      this.showQuizModal = true;
    },
    selectAnswer(option) {
      this.selectedAnswer = option;
      this.feedback = option === this.activeQuiz.questions[this.currentQuestion].answer ? 'Correct!' : 'Incorrect!';
      if (this.feedback === 'Correct!') this.score++;
    },
    nextQuestion() {
      this.currentQuestion++;
      if (this.currentQuestion >= this.activeQuiz.questions.length) {
        this.quizFinished = true;
      }
    },
    prevQuestion() {
      if (this.currentQuestion > 0) this.currentQuestion--;
    }
  }
};
</script>
  
<style scoped>
/* Navbar */
.custom-navbar {
  background-color: rgb(138, 0, 183) !important;
}

.navbar-brand,
.nav-link {
  color: white !important;
}

</style>
