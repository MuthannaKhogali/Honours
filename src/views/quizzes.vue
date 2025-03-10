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
              <p>
                <strong>From:</strong> {{ quiz.senderUsername }}
              </p>
              <button @click="openQuizModal(quiz)" class="btn btn-purple">Start Quiz</button>
            </div>
          </div>
        </section>
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
            <button @click="openEditModal(selectedQuiz)" class="btn btn-purple">Edit</button>
            <button class="btn btn-purple" @click="deleteQuiz(selectedQuiz)">Delete</button>
          </div>
          <div v-if="showEditModal" class="modal-overlay">
            <div class="modal-box scrollable-modal">
              <span class="close-modal" @click="closeEditModal">&times;</span>
              <h2>Edit Quiz - {{ selectedQuiz.quizName }}</h2>
              <div class="edit-questions">
                <div v-for="(question, index) in editableQuestions" :key="index" class="question-box">
                  <!-- Clickable box with shadow -->
                  <div class="question-header" @click="toggleQuestionVisibility(index)">
                    <p>{{ question.question }}</p>
                  </div>
                  <!-- Expanded area for editing -->
                  <div v-if="question.expanded" class="question-editor">
                    <input v-model="question.question" placeholder="Edit question text" class="form-control" />
                    <select v-model="question.type" @change="changeQuestionType(index, question.type)" class="form-control mt-2">
                      <option value="multiple-choice">Multiple Choice</option>
                      <option value="true-false">True/False</option>
                      <option value="short-answer">Short Answer</option>
                    </select>
                    <!-- Multiple Choice Editing -->
                    <div v-if="question.type === 'multiple-choice'">
                      <div v-for="(option, i) in question.options" :key="i" class="option-item">
                        <input v-model="question.options[i]" placeholder="Option" class="form-control option-input" />
                        <input type="radio" :value="option" v-model="question.answer" /> Correct
                      </div>
                    </div>
                    <!-- True/False Editing -->
                    <div v-if="question.type === 'true-false'">
                      <label>
                        <input type="radio" value="True" v-model="question.answer" /> True </label>
                      <label>
                        <input type="radio" value="False" v-model="question.answer" /> False </label>
                    </div>
                    <!-- Short Answer Editing -->
                    <div v-if="question.type === 'short-answer'">
                      <input v-model="question.answer" placeholder="Correct Answer" class="form-control" />
                    </div>
                    <button class="btn btn-danger btn-sm mt-2" @click="deleteQuestion(index)">Delete Question</button>
                  </div>
                </div>
                <button class="btn btn-purple m-2" @click="addNewQuestion">Add New Question</button>
                <button class="btn btn-purple m-2" @click="saveQuizChanges">Save Changes</button>
                <button class="btn btn-secondary m-2" @click="closeEditModal">Cancel</button>
              </div>
              <p v-if="editError" class="text-danger">{{ editError }}</p>
            </div>
          </div>
          <p v-if="quizError" class="text-danger mt-2">{{ quizError }}</p>
        </div>
        <!-- If quiz has started, show questions -->
        <div v-else>
          <div v-if="!quizFinished">
            <p>
              <strong>Question:</strong> {{ activeQuiz.questions[currentQuestion].question }}
            </p>
            <button class="btn btn-secondary m-1" @click="openVideoModal">
              Play Section
            </button>
            <!-- Multiple Choice -->
            <div v-if="activeQuiz.questions[currentQuestion].type === 'multiple-choice'" class="multiple-choice-options">
              <button v-for="(option, index) in activeQuiz.questions[currentQuestion].options" :key="index" class="btn btn-secondary" :class="{
    'btn-success': feedback !== '' && option === activeQuiz.questions[currentQuestion].answer,
    'btn-danger': feedback !== '' && answers[currentQuestion] === option && option !== activeQuiz.questions[currentQuestion].answer
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
            <div class="nav-buttons">
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
      <div v-if="showVideoModal" class="video-modal">
        <div class="video-modal-content">
          <span class="video-close" @click="showVideoModal = false">&times;</span>
          <iframe width="100%" height="400" :src="videoUrlWithTimestamp" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
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
        showEditModal: false,
        editableQuestions: [],
        editError: '',
        selectedFriendID: null,
        userID: Number(localStorage.getItem('userID')) || null,
        showVideoModal: false,
        videoUrlWithTimestamp: ""
      };
    },
    mounted() {
      this.getUsername();
      this.fetchSavedQuizzes();
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
            params: {
              userID: this.userID
            }
          });
          this.savedQuizzes = response.data.savedQuizzes;
        } catch (error) {
          console.error('Error fetching saved quizzes:', error);
        } finally {
          this.loading = false;
        }
      },
      async fetchReceivedQuizzes() {
        const response = await axios.get("http://localhost:5000/get-received-quizzes", {
          params: {
            userID: this.userID
          }
        });
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
        if (this.receivedQuizzes.some(q => q.quizID === quiz.quizID)) {
          this.quizStarted = true; 
        } else {
          this.quizStarted = false;
        }
          this.showQuizModal = true;
      },
      closeQuizModal() {
        this.showQuizModal = false;
      },
      openVideoModal() {
        if (!this.activeQuiz || !this.activeQuiz.questions[this.currentQuestion]) {
          console.error("No active quiz or question found.");
          return;
        }
        let youtubeLink = this.activeQuiz.youtubeLink;
        let time = this.activeQuiz.questions[this.currentQuestion]?.time;
        if (!youtubeLink || !time) {
          console.error("Invalid YouTube link or time data.");
          return;
        }
        let videoIdMatch = youtubeLink.match(/(?:youtu\.be\/|youtube\.com\/.*[?&]v=|youtube\.com\/embed\/|youtube\.com\/v\/)([^&?#]+)/);
        if (!videoIdMatch) {
          console.error("Invalid YouTube URL:", youtubeLink);
          return;
        }
        let videoId = videoIdMatch[1];
        let seconds = parseInt(time.replace("s", ""), 10);
        this.videoUrlWithTimestamp = `https://www.youtube.com/embed/${videoId}?autoplay=1&start=${seconds}`;
        this.showVideoModal = true;
        console.log("Opening video:", this.videoUrlWithTimestamp);
      },
      closeVideoModal() {
        this.showVideoModal = false;
      },
      openEditModal(quiz) {
        this.showEditModal = true;
        this.editableQuestions = quiz.questions.map(q => ({
          questionID: q.questionID,
          question: q.question,
          type: q.type,
          options: q.options ? [...q.options] : [],
          answer: q.answer,
          time: q.time,
          expanded: false
        }));
      },
      closeEditModal() {
        this.showEditModal = false;
        this.editableQuestions = [];
      },
      async saveQuizChanges() {
        try {
          const payload = {
            userID: this.userID,
            quizID: this.selectedQuiz.quizID,
            questions: this.editableQuestions
          };
          const response = await axios.post('http://localhost:5000/update-quiz', payload);
          console.log("Quiz updated:", response.data);
          this.closeEditModal();
          this.fetchSavedQuizzes();
          this.closeQuizModal();
        } catch (error) {
          console.error("Error updating quiz:", error);
          this.editError = 'Failed to save changes. Please try again.';
        }
      },
      toggleQuestionVisibility(index) {
        this.editableQuestions[index].expanded = !this.editableQuestions[index].expanded;
      },
      addOption(index) {
        this.editableQuestions[index].options.push('');
      },
      deleteQuestion(index) {
        this.editableQuestions.splice(index, 1);
      },
      addNewQuestion() {
        const newQuestion = {
          questionID: Date.now(),
          question: '',
          type: 'multiple-choice', // default type
          options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'], // Default 4 options for MCQ
          answer: 'Option 1',
          expanded: true
        };
        newQuestion.answer = newQuestion.options[0];
        this.editableQuestions.push(newQuestion);
      },
      changeQuestionType(index, newType) {
        const question = this.editableQuestions[index];
        question.type = newType;
        if (newType === 'multiple-choice') {
          question.options = ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
          question.answer = 'Option 1';
        } else if (newType === 'true-false') {
          question.options = [];
          question.answer = 'True';
        } else if (newType === 'short-answer') {
          question.options = [];
          question.answer = '';
        }
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
            data: {
              userID: this.userID,
              quizID: quiz.quizID
            }
          });
          this.fetchSavedQuizzes();
          this.closeQuizModal();
        } catch (error) {
          this.quizError = 'Failed to delete quiz.';
        }
      },
      async openSendToFriendModal(quiz) {
        this.selectedQuiz = quiz;
        this.showSendToFriendModal = true;
        this.selectedFriendID = null;
        this.sendQuizError = '';
        try {
          const response = await axios.get("http://localhost:5000/get-friends", {
            params: {
              userID: this.userID
            }
          });
          this.friends = response.data.friends || [];
          this.pendingRequests = response.data.pendingRequests || [];
        } catch (error) {
          console.error("Failed to fetch friends:", error);
          this.sendQuizError = "Failed to fetch friends. Please try again.";
        }
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

  .quick-card:hover {
    background: rgb(138, 0, 183);
    color: white;
    transform: translateY(-5px);
  }

  /* Recently Saved Quizzes */
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
    height: 450px;
    overflow-y: auto; 
    overflow-x: hidden;
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

  .scrollable-modal {
    overflow-y: auto;
    max-height: 80vh;
  }

  .video-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .video-modal-content {
    position: relative;
    background: #fff;
    padding: 35px;
    border-radius: 5px;
    width: 100%;
    max-width: 800px;
  }

  .video-close {
    position: absolute;
    top: 0px;
    right: 15px;
    font-size: 30px;
    cursor: pointer;
  }

  /* Ensure the options are stacked vertically and same width */
  .multiple-choice-options {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    /* spacing between options */
    width: 100%;
  }

  .multiple-choice-options button {
    width: 100%;
    text-align: left;
    padding: 12px;
    box-sizing: border-box;
  }

  /* Ensure navigation buttons are inside the modal and don't overflow */
  .nav-buttons {
    display: flex;
    justify-content: space-between;
    margin-top: 16px;
    width: 100%;
  }

  .nav-buttons button {
    padding: 12px 20px;
  }

  .question-box {
    border: 1px solid #ddd;
    border-radius: 8px;
    margin-bottom: 10px;
    padding: 10px;
    background: #f9f9f9;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: background 0.3s ease;
  }

  .question-box:hover {
    background: #f1f1f1;
  }

  .question-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .question-editor {
    background: white;
    padding: 10px;
    margin-top: 8px;
    border: 1px solid #ddd;
    border-radius: 5px;
  }

  .option-item {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 5px;
  }

  .option-input {
    flex: 1;
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