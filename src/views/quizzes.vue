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
                <button @click="startQuiz(quiz)" class="btn btn-purple">Start Quiz</button>
              </div>
            </div>
          </section>
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
      };
    },
    mounted() {
      this.fetchSavedQuizzes();
      this.fetchReceivedQuizzes();
    },
    methods: {
      async fetchSavedQuizzes() {
        this.loading = true;
        try {
          const response = await axios.get("http://localhost:5000/get-saved-quizzes", { params: { userID: this.userID } });
          this.savedQuizzes = response.data.savedQuizzes;
        } catch (error) {
          console.error("Error fetching saved quizzes:", error);
        } finally {
          this.loading = false;
        }
      },
      async fetchReceivedQuizzes() {
        try {
          const response = await axios.get("http://localhost:5000/get-received-quizzes", { params: { userID: this.userID } });
          this.receivedQuizzes = response.data.receivedQuizzes;
        } catch (error) {
          console.error("Error fetching received quizzes:", error);
        }
      },
      async deleteQuiz(quizID) {
        try {
          await axios.delete("http://localhost:5000/delete-quiz", { data: { userID: this.userID, quizID } });
          this.fetchSavedQuizzes();
        } catch (error) {
          console.error("Error deleting quiz:", error);
        }
      },
      logout() {
        localStorage.removeItem('username');
        localStorage.removeItem('userID');
        this.$router.push('/');
      },
      startQuiz(quiz) {
        alert(`Starting quiz: ${quiz.quizName}`); // Replace with actual quiz start logic
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
    border: 1px solid rgb(138, 0, 183);
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
  