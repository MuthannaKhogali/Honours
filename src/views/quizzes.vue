<template>
    <div class="quizzes-container">
      <!-- Full-width Purple Header -->
      <section class="hero">
        <div class="hero-content">
          <h1>My Quizzes</h1>
          <p>View and manage your saved quizzes.</p>
          <div class="header-buttons">
            <router-link to="/account" class="back-button">Home</router-link>
          </div>
        </div>
      </section>
  
      <div class="content-wrapper">
        <div class="left-content">
          <!-- Saved Quizzes Section -->
          <section class="saved-quizzes">
            <h2>Saved Quizzes</h2>
            <div v-if="loading" class="loader">Loading...</div>
            <div v-else-if="savedQuizzes.length === 0" class="empty-state">No saved quizzes yet.</div>
            <div class="quiz-grid">
              <div class="quiz-card" v-for="quiz in savedQuizzes" :key="quiz.quizID">
                <h4>{{ quiz.quizName }}</h4>
                <p>{{ quiz.questions.length }} Questions</p>
                <button @click="openQuizModal(quiz)" class="btn btn-purple">View</button>
              </div>
            </div>
          </section>
  
          <!-- Received Quizzes Section -->
          <section class="received-quizzes">
            <h2>Received Quizzes</h2>
            <div v-if="receivedQuizzes.length === 0" class="empty-state">No received quizzes.</div>
            <div class="quiz-grid">
              <div class="quiz-card" v-for="quiz in receivedQuizzes" :key="quiz.quizID">
                <h4>{{ quiz.quizName }}</h4>
                <p><strong>From:</strong> {{ quiz.senderUsername }}</p>
                <button @click="openQuizModal(quiz)" class="btn btn-purple">Start Quiz</button>
              </div>
            </div>
          </section>
        </div>
      </div>
  
      <!-- Quiz Modal (From Home Page) -->
      <div v-if="showQuizModal" class="modal-overlay">
        <div class="modal-box">
          <span class="close-modal" @click="closeQuizModal">&times;</span>
          <div v-if="!quizStarted">
            <h2>{{ selectedQuiz.quizName }}</h2>
            <p><strong>Questions:</strong> {{ selectedQuiz.questions.length }}</p>
            <p><strong>Types:</strong> {{ getQuestionTypes(selectedQuiz.questions) }}</p>
            <div class="modal-buttons">
              <button class="btn btn-purple" @click="reattemptQuiz(selectedQuiz)">Reattempt</button>
              <button class="btn btn-purple" @click="openSendToFriendModal(selectedQuiz)">Send to Friend</button>
              <button class="btn btn-purple" @click="deleteQuiz(selectedQuiz)">Delete</button>
            </div>
          </div>
          <div v-if="showQuizModal" class="modal-overlay">
        <div class="modal-box">
          <span class="close-modal" @click="closeQuizModal">&times;</span>
          <!-- Quiz Details Before Starting -->
          <div v-if="!quizStarted">
            <h2 class="modal-title">{{ selectedQuiz.quizName }}</h2>
            <p>
              <strong>Number of Questions:</strong> {{ selectedQuiz.questions.length }}
            </p>
            <p>
              <strong>Types of Questions:</strong> {{ getQuestionTypes(selectedQuiz.questions) }}
            </p>
            <div class="modal-buttons">
              <button class="btn btn-purple" @click="reattemptQuiz(selectedQuiz)">Reattempt Quiz</button>
              <button class="btn btn-purple" @click="openSendToFriendModal(selectedQuiz)">Send to Friend</button>
              <button class="btn btn-purple" @click="deleteQuiz(selectedQuiz)">Delete</button>
            </div>
            <p v-if="quizError" class="text-danger mt-2">{{ quizError }}</p>
          </div>
          <!-- If quiz has started, show questions -->
          <div v-else>
            <div v-if="!quizFinished">
              <p>
                <strong>Question:</strong> {{ activeQuiz.questions[currentQuestion].question }}
              </p>
              <!-- Multiple Choice -->
              <div v-if="activeQuiz.questions[currentQuestion].type === 'multiple-choice'">
                <button v-for="(option, index) in activeQuiz.questions[currentQuestion].options" :key="index" class="btn m-1 btn-secondary" :class="{
                    'btn-success': feedback !== '' && option === activeQuiz.questions[currentQuestion].answer, // Correct answer is always green
                    'btn-danger': feedback !== '' && answers[currentQuestion] === option && option !== activeQuiz.questions[currentQuestion].answer // Incorrect selection turns red
                  }" :disabled="answers[currentQuestion] !== undefined" @click="selectAnswer(option)">
                  {{ option }}
                </button>
              </div>
              <!-- True/False -->
              <div v-if="activeQuiz.questions[currentQuestion].type === 'true-false'">
                <button class="btn m-1 btn-secondary" :class="{
                  'btn-success': feedback !== '' && 'True' === activeQuiz.questions[currentQuestion].answer,
                  'btn-danger': feedback !== '' && answers[currentQuestion] === 'True' && 'True' !== activeQuiz.questions[currentQuestion].answer
                }" :disabled="answers[currentQuestion] !== undefined" @click="selectAnswer('True')"> True </button>
                <button class="btn m-1 btn-secondary" :class="{
                  'btn-success': feedback !== '' && 'False' === activeQuiz.questions[currentQuestion].answer,
                  'btn-danger': feedback !== '' && answers[currentQuestion] === 'False' && 'False' !== activeQuiz.questions[currentQuestion].answer
                }" :disabled="answers[currentQuestion] !== undefined" @click="selectAnswer('False')"> False </button>
              </div>
              <!-- Short Answer -->
              <div v-if="activeQuiz.questions[currentQuestion].type === 'short-answer'">
                <input v-model="selectedAnswer" class="form-control" placeholder="Type your answer here" :disabled="answers[currentQuestion] || checkingAnswer" />
                <button class="btn btn-success mt-2" @click="submitShortAnswer" :disabled="answers[currentQuestion] !== undefined || checkingAnswer">
                  {{ checkingAnswer ? "Checking..." : "Submit" }}
                </button>
                <p v-if="answers[currentQuestion]?.feedback" :class="{
                    'text-success': answers[currentQuestion].feedback === 'Correct!',
                    'text-danger': answers[currentQuestion].feedback !== 'Correct!'
                  }">
                  {{ answers[currentQuestion].feedback }}
                </p>
              </div>
              <!-- Navigation Buttons -->
              <div class="d-flex justify-content-between mt-3">
                <button class="btn btn-secondary" @click="prevQuestion" :disabled="currentQuestion === 0">Previous</button>
                <button class="btn btn-purple" @click="nextQuestion">
                  {{ currentQuestion === activeQuiz.questions.length - 1 ? 'Finish' : 'Next' }}
                </button>
              </div>
            </div>
            <!-- Quiz Completion -->
            <div v-if="quizFinished">
              <h2>Quiz Complete!</h2>
              <h4>Your Score: {{ score }} / {{ activeQuiz.questions.length }}</h4>
              <button class="btn btn-purple mt-3" @click="closeQuizModal">Close</button>
            </div>
          </div>
        </div>
        <div v-if="showSendToFriendModal" class="modal-overlay">
          <div class="modal-box">
            <h3>Select a Friend to Send Quiz</h3>
            <ul>
              <li v-for="friend in friends" :key="friend.friendID">
                <label>
                  <input type="radio" :value="friend.friendID" v-model="selectedFriendID" />
                  {{ friend.username }}
                </label>
              </li>
            </ul>
            <div class="modal-buttons">
              <button class="btn btn-purple" @click="confirmSendQuiz">Confirm</button>
              <button class="btn btn-secondary" @click="showSendToFriendModal = false">Cancel</button>
            </div>
            <p v-if="sendQuizError" class="text-danger mt-2">{{ sendQuizError }}</p>
          </div>
        </div>
      </div>
      </div>
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    data() {
      return {
        userID: Number(localStorage.getItem('userID')),
        savedQuizzes: [],
        receivedQuizzes: [],
        loading: false,
        showQuizModal: false,
        quizStarted: false,
        quizFinished: false,
        selectedQuiz: null,
        activeQuiz: null,
        currentQuestion: 0,
        answers: [],
        selectedAnswer: '',
        feedback: '',
        score: 0,
      };
    },
    mounted() {
    this.fetchSavedQuizzes();
    this.fetchReceivedQuizzes();
    },
    methods: {
      async fetchSavedQuizzes() {
        this.loading = true;
        const response = await axios.get("http://localhost:5000/get-saved-quizzes", { params: { userID: this.userID } });
        this.savedQuizzes = response.data.savedQuizzes;
        this.loading = false;
      },
      async fetchReceivedQuizzes() {
        const response = await axios.get("http://localhost:5000/get-received-quizzes", { params: { userID: this.userID } });
        this.receivedQuizzes = response.data.receivedQuizzes;
      },
 openQuizModal(quiz) {
      this.selectedQuiz = quiz;
      this.activeQuiz = quiz;
      this.quizStarted = false;
      this.quizFinished = false;
      this.currentQuestion = 0;
      this.answers = [];
      this.selectedAnswer = '';
      this.feedback = '';
      this.showQuizModal = true;
    },
    closeQuizModal() {
      this.showQuizModal = false;
    },
    reattemptQuiz(quiz) {
      this.activeQuiz = quiz;
      this.quizStarted = true;
      this.quizFinished = false;
      this.currentQuestion = 0;
      this.answers = [];
      this.selectedAnswer = '';
      this.feedback = '';
      this.score = 0;
    },
    selectAnswer(option) {
      if (this.answers[this.currentQuestion]) return;
      this.answers[this.currentQuestion] = option;
      const correctAnswer = this.activeQuiz.questions[this.currentQuestion].answer;
      this.feedback = option === correctAnswer ? 'Correct!' : 'Incorrect!';
      if (this.feedback === 'Correct!') this.score++;
    },
    async submitShortAnswer() {
      if (!this.selectedAnswer.trim()) return;
      this.checkingAnswer = true;

      const currentQuestion = this.activeQuiz.questions[this.currentQuestion];
      try {
        const response = await axios.post('http://localhost:5000/validate-answer', {
          userAnswer: this.selectedAnswer.trim(),
          question: currentQuestion.question,
          correctAnswer: currentQuestion.answer
        });
        const feedback = response.data.feedback;

        this.answers[this.currentQuestion] = {
          userAnswer: this.selectedAnswer.trim(),
          feedback
        };
        this.feedback = feedback;

        if (feedback === 'Correct!') this.score++;
      } catch (error) {
        this.feedback = 'Error validating answer.';
      } finally {
        this.checkingAnswer = false;
      }
    },
    nextQuestion() {
      if (this.currentQuestion < this.activeQuiz.questions.length - 1) {
        this.currentQuestion++;
        this.restoreQuestionState();
      } else {
        this.quizFinished = true;
      }
    },
    prevQuestion() {
      if (this.currentQuestion > 0) {
        this.currentQuestion--;
        this.restoreQuestionState();
      }
    },
    restoreQuestionState() {
      const savedAnswer = this.answers[this.currentQuestion];
      this.selectedAnswer = savedAnswer?.userAnswer || '';
      this.feedback = savedAnswer?.feedback || '';
    },
    async deleteQuiz(quiz) {
      try {
        await axios.delete('http://localhost:5000/delete-quiz', {
          data: { userID: this.userID, quizID: quiz.quizID }
        });
        this.fetchSavedQuizzes();
        this.closeQuizModal();
      } catch (error) {
        this.quizError = 'Failed to delete quiz.';
      }
    },
    openSendToFriendModal(quiz) {
      this.selectedQuiz = quiz;
      this.showSendToFriendModal = true;
      this.selectedFriendID = null;
      this.sendQuizError = '';
    },
    async confirmSendQuiz() {
      if (!this.selectedFriendID) {
        this.sendQuizError = 'Please select a friend.';
        return;
      }
      try {
        await axios.post('http://localhost:5000/send-quiz-to-friend', {
          userID: this.userID,
          senderUsername: this.username,
          friendID: this.selectedFriendID,
          ...this.selectedQuiz
        });
        this.showSendToFriendModal = false;
      } catch (error) {
        this.sendQuizError = error.response?.data?.error || 'Failed to send quiz.';
      }
    },
    logout() {
      localStorage.removeItem('username');
      localStorage.removeItem('userID');
      this.$router.push('/');
    },
    getQuestionTypes(questions) {
      return [...new Set(questions.map(q => q.type))].join(', ');
    }
  }
};
  </script>
  
  <style scoped>
  /* Full-width Hero Section */
  .hero {
    background: rgb(138, 0, 183);
    color: white;
    width: 100vw;
    padding: 4rem 2rem;
    box-sizing: border-box;
    text-align: center;
    margin: 0;
  }
  
  .hero-content {
    max-width: 800px;
    margin: 0 auto;
  }

/* Back Button */
.back-button {
    color: white;
    text-decoration: none;
    font-size: 1.2rem;
    font-weight: bold;
    display: inline-block;
    margin-bottom: 10px;
    transition: opacity 0.3s ease;
  }
  
  .back-button:hover {
    opacity: 0.8;
  }
  
  /* Header Buttons */
  .header-buttons {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-top: 10px;
  }
  
  /* Content Wrapper */
  .content-wrapper {
    display: flex;
    justify-content: flex-start;
    padding: 2rem;
    width: 100%;
    max-width: 1200px;
    margin: 0;
  }
  
  .left-content {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  
  /* Saved & Received Quizzes */
  .saved-quizzes,
  .received-quizzes {
    width: 100%;
    margin-bottom: 2rem;
  }
  
  /* Quiz Grid */
  .quiz-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-top: 1rem;
  }
  
  /* Quiz Card */
  .quiz-card {
    background: white;
    padding: 1rem;
    border-radius: 8px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    width: 200px;
  }
  
  .quiz-card h4 {
    margin: 0 0 0.5rem;
    font-size: 1.1rem;
  }
  
  .modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-box {
  background: white;
  width: 60%;
  max-width: 700px;
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  text-align: center;
  height: 350px;
  position: relative;
}

.modal-box ul {
  list-style-type: none;
  padding: 0;
  margin: 5;
}

.close-modal {
  position: absolute;
  top: 8px; 
  right: 15px; 
  font-size: 24px;
  color: #555;
  cursor: pointer;
  z-index: 10;
}

.close-modal:hover {
  color: #000;
}

.modal-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
}

@media (max-width: 768px) {
  .modal-box {
    width: 90%;
  }
}

  /* Empty State */
  .empty-state {
    color: #888;
    font-style: italic;
    margin-top: 1rem;
  }
  
  /* Buttons */
  .btn {
    padding: 10px 14px;
    border: none;
    cursor: pointer;
    border-radius: 6px;
    text-decoration: none;
    font-size: 1rem;
    transition: background 0.3s ease, transform 0.2s ease;
  }
  
  .btn-purple {
    background: rgb(138, 0, 183);
    color: white;
  }
  
  .btn-purple:hover {
    background: rgb(118, 0, 160);
    transform: translateY(-2px);
    color: white;
  }
  
  .btn-danger {
    background: #dc3545;
    color: white;
  }
  
  .btn-danger:hover {
    background: #c82333;
  }
  
  .btn-outline-light {
    border: 2px solid white;
    color: white;
    background: transparent;
  }
  
  .btn-outline-light:hover {
    background: white;
    color: rgb(138, 0, 183);
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .hero {
      padding: 3rem 1rem;
    }
  
    .hero h1 {
      font-size: 2rem;
    }
  
    .content-wrapper {
      align-items: flex-start;
      padding-left: 1rem;
    }
  
    .quiz-grid {
      justify-content: flex-start;
    }
  }
  </style>
  