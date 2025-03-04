<template>
  <div class="home-container">
    <!-- Full-width Purple Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <h1>Welcome back, {{ username }}!</h1>
        <p>Your personal quiz and study hub.</p>
        <div class="hero-buttons">
          <button @click="logout" class="btn btn-outline-purple">Log Out</button>
        </div>
      </div>
    </section>

    <!-- Quick Links Section -->
    <section class="quick-links">
      <h2>Quick Access</h2>
      <div class="quick-links-grid">
        <router-link to="/generateQuestions" class="quick-card">
          <h4>Generate Quiz</h4>
          <p>Create a new quiz from a YouTube video</p>
        </router-link>
        <router-link to="/quizzes" class="quick-card">
          <h4>Saved Quizzes</h4>
          <p>View all your saved quizzes</p>
        </router-link>
        <router-link to="/friends" class="quick-card">
          <h4>Friends</h4>
          <p>Manage your friends and requests</p>
        </router-link>
      </div>
    </section>

    <!-- Recently Saved Quizzes -->
    <section class="recent-quizzes">
      <h2>Recently Saved Quizzes</h2>
      <div v-if="loading" class="loader">Loading...</div>
      <div v-else-if="savedQuizzes.length === 0" class="empty-state">No saved quizzes yet. Time to create one!</div>
      <div class="quiz-grid">
        <div class="quiz-card" v-for="quiz in savedQuizzes.slice(0, 3)" :key="quiz.quizID">
          <h5>{{ quiz.quizName }}</h5>
          <p>{{ quiz.questions.length }} Questions - {{ getQuestionTypes(quiz.questions) }}</p>
          <button @click="openQuizModal(quiz)" class="btn btn-purple">View Quiz</button>
        </div>
      </div>
    </section>

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
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      username: localStorage.getItem('username') || 'USERNAME',
      savedQuizzes: [],
      receivedQuizzes: [],
      friends: [],
      pendingRequests: [],
      loading: false,
      showQuizModal: false,
      showSendToFriendModal: false,
      selectedQuiz: null,
      activeQuiz: null,
      quizStarted: false,
      quizFinished: false,
      currentQuestion: 0,
      answers: [],
      selectedAnswer: '',
      feedback: '',
      score: 0,
      friendUsername: '',
      friendError: '',
      quizError: '',
      sendQuizError: '',
      selectedFriendID: null,
      checkingAnswer: false,
      userID: Number(localStorage.getItem('userID')) || null
    };
  },
  mounted() {
    this.getUsername();
    this.fetchSavedQuizzes();
    this.getFriends();
    this.fetchReceivedQuizzes();
  },
  methods: {
    getUsername() {
      this.username = localStorage.getItem('username') || 'USERNAME';
    },
    async fetchSavedQuizzes() {
      this.loading = true;
      try {
        const response = await axios.get('http://localhost:5000/get-saved-quizzes', {
          params: { userID: this.userID }
        });
        this.savedQuizzes = response.data.savedQuizzes;
      } catch (error) {
        console.error('Error fetching saved quizzes:', error);
      } finally {
        this.loading = false;
      }
    },
    async fetchReceivedQuizzes() {
      try {
        const response = await axios.get('http://localhost:5000/get-received-quizzes', {
          params: { userID: this.userID }
        });
        this.receivedQuizzes = response.data.receivedQuizzes;
      } catch (error) {
        console.error('Error fetching received quizzes:', error);
      }
    },
    async getFriends() {
      try {
        const response = await axios.get('http://localhost:5000/get-friends', {
          params: { userID: this.userID }
        });
        this.friends = response.data.friends;
        this.pendingRequests = response.data.pendingRequests;
      } catch (error) {
        console.error('Error fetching friends:', error);
      }
    },
    async sendFriendRequest() {
      if (!this.friendUsername.trim()) {
        this.friendError = 'Please enter a valid username.';
        return;
      }
      try {
        await axios.post('http://localhost:5000/send-friend-request', {
          userID: this.userID,
          friendUsername: this.friendUsername.trim()
        });
        this.friendUsername = '';
        this.getFriends();
      } catch (error) {
        this.friendError = error.response?.data?.error || 'Failed to send friend request.';
      }
    },
    async acceptFriend(friendID) {
      await axios.post('http://localhost:5000/accept-friend-request', {
        userID: this.userID,
        friendID
      });
      this.getFriends();
    },
    async removeFriend(friendID) {
      await axios.post('http://localhost:5000/remove-friend', {
        userID: this.userID,
        friendID
      });
      this.getFriends();
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
.home-container {
  font-family: 'Inter', sans-serif;
  color: #333;
  padding: 0;
}

.hero {
  background: rgb(138, 0, 183);
  color: white;
  width: 100vw;
  padding: 5rem 1rem;
  box-sizing: border-box;
  text-align: center;
  margin: 0;
  position: relative;
  top: 0;
  left: 0;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero h1 {
  font-size: 2.8rem;
  margin: 0;
}

.hero p {
  margin: 0.5rem 0 1.5rem;
}

.hero-buttons .btn {
  margin: 0 0.5rem;
}

.quick-links {
  padding: 2rem;
}

.quick-links h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.quick-links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.quick-card {
  background-color: #ffffff;
  padding: 1rem;
  border: 1px solid rgb(138, 0, 183);
  border-radius: 8px;
  text-align: center;
  text-decoration: none;
  color: rgb(0, 0, 0);
  font-weight: 600;
  transition: transform 0.2s ease, background 0.3s ease;
}

.quick-card:hover {
  background: rgb(138, 0, 183);
  color: white;
  transform: translateY(-5px);
}

/* Recently Saved Quizzes */
.recent-quizzes {
  padding: 2rem;
}

.recent-quizzes h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.quiz-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.quiz-card {
  background-color: white;
  border: 1px solid #ddd;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.quiz-card h5 {
  margin: 0 0 0.5rem;
}

.quiz-card p {
  color: #666;
  font-size: 0.9rem;
  margin: 0.5rem 0;
}

.quiz-card button {
  margin-top: 0.5rem;
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

/* Buttons */
.btn {
  padding: 10px 16px;
  border: none;
  cursor: pointer;
  border-radius: 6px;
  text-decoration: none;
  display: inline-block;
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

.btn-outline-purple {
  background: white;
  color: rgb(138, 0, 183);
  border: 2px solid rgb(138, 0, 183);
}

.btn-outline-purple:hover {
  background: rgb(138, 0, 183);
  color: white;
}

/* Responsive */
@media (max-width: 768px) {
  .hero {
    padding: 3rem 1rem;
  }

  .hero h1 {
    font-size: 2rem;
  }
}
</style>
