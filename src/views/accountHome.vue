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
                <p class="card-text"><strong>Questions:</strong> {{ quiz.questions.length }}</p>
                <p class="card-text"><strong>Types:</strong> {{ getQuestionTypes(quiz.questions) }}</p>
                <button @click="openQuizModal(quiz)" class="btn btn-success">View</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quiz Modal -->
      <div v-if="showQuizModal" class="modal-overlay">
        <div class="modal-box">
          <span class="close-modal" @click="closeQuizModal">&times;</span>

          <!-- Quiz Details Before Starting -->
          <div v-if="!quizStarted">
            <h2 class="modal-title">{{ selectedQuiz.quizName }}</h2>
            <p><strong>Number of Questions:</strong> {{ selectedQuiz.questions.length }}</p>
            <p><strong>Types of Questions:</strong> {{ getQuestionTypes(selectedQuiz.questions) }}</p>

            <div class="modal-buttons">
              <button class="btn btn-primary" @click="reattemptQuiz(selectedQuiz)">Reattempt Quiz</button>
              <button class="btn btn-warning">Send to Friend</button>
              <button @click="deleteQuiz(selectedQuiz)" class="btn btn-danger">Delete</button>
            </div>
            <p v-if="quizError" class="text-danger mt-2">{{ quizError }}</p>
          </div>

          <!-- If quiz has started, show questions -->
          <div v-else>
            <div v-if="!quizFinished">
              <p><strong>Question:</strong> {{ activeQuiz.questions[currentQuestion].question }}</p>

              <!-- Multiple Choice -->
              <div v-if="activeQuiz.questions[currentQuestion].type === 'multiple-choice'">
                <button
                  v-for="(option, index) in activeQuiz.questions[currentQuestion].options"
                  :key="index"
                  class="btn m-1 btn-secondary"
                  :class="{
                    'btn-success': feedback !== '' && option === activeQuiz.questions[currentQuestion].answer, // Correct answer is always green
                    'btn-danger': feedback !== '' && answers[currentQuestion] === option && option !== activeQuiz.questions[currentQuestion].answer // Incorrect selection turns red
                  }"
                  :disabled="answers[currentQuestion] !== undefined" 
                  @click="selectAnswer(option)"
                  >
                    {{ option }}
                </button>
              </div>

              <!-- True/False -->
              <div v-if="activeQuiz.questions[currentQuestion].type === 'true-false'">
                <button 
                class="btn m-1 btn-secondary"
                :class="{
                  'btn-success': feedback !== '' && 'True' === activeQuiz.questions[currentQuestion].answer,
                  'btn-danger': feedback !== '' && answers[currentQuestion] === 'True' && 'True' !== activeQuiz.questions[currentQuestion].answer
                }"
                :disabled="answers[currentQuestion] !== undefined"
                @click="selectAnswer('True')"
                >
                  True
                </button>
                <button 
                class="btn m-1 btn-secondary"
                :class="{
                  'btn-success': feedback !== '' && 'False' === activeQuiz.questions[currentQuestion].answer,
                  'btn-danger': feedback !== '' && answers[currentQuestion] === 'False' && 'False' !== activeQuiz.questions[currentQuestion].answer
                }"
                :disabled="answers[currentQuestion] !== undefined"
                @click="selectAnswer('False')"
                >
                  False
                </button>
              </div>
              <!-- Short Answer -->
              <div v-if="activeQuiz.questions[currentQuestion].type === 'short-answer'">
                <input 
                v-model="selectedAnswer" 
                class="form-control" 
                placeholder="Type your answer here" 
                :disabled="answers[currentQuestion] || checkingAnswer" 
                />
                <button 
                  class="btn btn-success mt-2" 
                  @click="submitShortAnswer" 
                  :disabled="answers[currentQuestion] !== undefined || checkingAnswer"
                >
                  {{ checkingAnswer ? "Checking..." : "Submit" }}
                </button>
                <p 
                  v-if="answers[currentQuestion]?.feedback" 
                  :class="{
                    'text-success': answers[currentQuestion].feedback === 'Correct!',
                    'text-danger': answers[currentQuestion].feedback !== 'Correct!'
                  }"
                >
                  {{ answers[currentQuestion].feedback }}
                </p>
              </div>

              <!-- Navigation Buttons -->
              <div class="d-flex justify-content-between mt-3">
                <button class="btn btn-secondary" @click="prevQuestion" :disabled="currentQuestion === 0">Previous</button>
                <button class="btn btn-secondary" @click="nextQuestion">
                  {{ currentQuestion === activeQuiz.questions.length - 1 ? 'Finish' : 'Next' }}
                </button>
              </div>
            </div>

            <!-- Quiz Completion -->
            <div v-if="quizFinished">
              <h2>Quiz Complete!</h2>
              <h4>Your Score: {{ score }} / {{ activeQuiz.questions.length }}</h4>
              <button class="btn btn-secondary mt-3" @click="closeQuizModal">Close</button>
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
      selectedQuiz: null,
      quizStarted: false,
      activeQuiz: null,
      currentQuestion: 0,
      selectedAnswer: '',
      answers: [],
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
    console.log("Updated quiz list after deletion:", this.savedQuizzes);
  } catch (error) {
    console.error("Error fetching quizzes:", error);
  } finally {
    this.loading = false;
  }
},
async deleteQuiz(quiz) {
  console.log("Trying to delete quiz:", quiz); // Debugging

  if (!quiz || !quiz.quizID) {
    this.quizError = "Error: Quiz ID is missing";
    return;
  }

  try {
    const userID = localStorage.getItem('userID');

    console.log("Sending DELETE request with:", { userID, quizID: quiz.quizID });

    const response = await axios.delete("http://localhost:5000/delete-quiz", {
      data: { userID, quizID: quiz.quizID }, // Ensure correct data is sent
    });

    console.log("Delete response:", response.data);

    if (response.data.success) {
      this.closeQuizModal(); // Close the modal on successful deletion
      this.fetchSavedQuizzes(); // Refresh the quiz list
      this.quizError = ""; // Clear any previous errors
    } else {
      this.quizError = "Error deleting quiz.";
    }
  } catch (error) {
    console.error("Error deleting quiz:", error);
    this.quizError = "Failed to delete quiz.";
  }
},


    openQuizModal(quiz) {
      this.selectedQuiz = quiz;
      this.showQuizModal = true;
      this.quizStarted = false;
    },
    closeQuizModal() {
      this.showQuizModal = false;
      this.quizStarted = false;
    },
    getQuestionTypes(questions) {
      return [...new Set(questions.map(q => q.type))].join(", ");
    },
    reattemptQuiz(quiz) {
      this.activeQuiz = quiz;
      this.currentQuestion = 0;
      this.quizStarted = true;
      this.quizFinished = false;
      this.score = 0;
      this.answers = [];
      this.feedback = '';
      this.selectedAnswer = '';
    },
    selectAnswer(option) {
  if (!this.answers[this.currentQuestion]) { // Prevent changing answer after selecting
    this.answers[this.currentQuestion] = option;
    this.feedback = option === this.activeQuiz.questions[this.currentQuestion].answer ? 'Correct!' : 'Incorrect!';
    if (this.feedback === 'Correct!') this.score++;
  }
},
nextQuestion() {
  if (this.currentQuestion < this.activeQuiz.questions.length - 1) {
    this.currentQuestion++;

    // Load stored answer if available
    this.selectedAnswer = this.answers[this.currentQuestion]?.userAnswer || '';
    this.feedback = this.answers[this.currentQuestion]?.feedback || '';
  } else {
    this.quizFinished = true;
  }
},

prevQuestion() {
  if (this.currentQuestion > 0) {
    this.currentQuestion--;

    // Load stored answer if available
    this.selectedAnswer = this.answers[this.currentQuestion]?.userAnswer || '';
    this.feedback = this.answers[this.currentQuestion]?.feedback || '';
  }
},

    logout() {
      localStorage.removeItem('username');
      localStorage.removeItem('userID');
      this.$router.push('/');
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

/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5); /* Darkened background */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: 0;
  animation: fadeIn 0.3s ease-in-out forwards;
}

/* Centered Modal Box */
.modal-box {
  background: white;
  width: 60%;
  max-width: 700px;
  height: 60%;
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  text-align: center;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

/* Close Button */
.close-modal {
  position: absolute;
  top: 15px;
  right: 20px;
  font-size: 28px;
  cursor: pointer;
  color: #777;
}

.close-modal:hover {
  color: #000;
}

/* Modal Title */
.modal-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
}

/* Buttons */
.modal-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.btn {
  padding: 10px 20px;
  font-size: 16px;
  border-radius: 5px;
}

/* Fade-in effect */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .modal-box {
    width: 80%;
    height: 70%;
  }
}
</style>
