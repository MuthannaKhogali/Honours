  <template>
    <div>
      <section class="hero">
        <div class="hero-content">
          <h1>Generate Questions</h1>
          <p>Enter a YouTube video and customise your quiz.</p>
          <router-link to="/account" class="back-button">Home</router-link>
        </div>
      </section>
      <!-- Main content -->
      <main class="container-fluid mt-4 px-3">
        <h5 class="text-start">Generate Questions</h5>
        <!-- Input Container -->
        <div class="input-group mt-3">
          <input v-model="youtubeLink" class="form-control custom-input" type="text" placeholder="Enter YouTube Link" />
          <button @click="fetchQuestions" class="btn custom-btn"> Generate </button>
        </div>
        <!-- Error Message -->
        <p v-if="errorMessage" class="text-danger">{{ errorMessage }}</p>
        <!-- Customise Questions -->
        <h5 class="text-start mt-4">Customise Questions</h5>
        <div class="row mt-3">
          <div class="col-md-3">
            <label for="numQuestions" class="form-label">Questions</label>
            <select v-model="numQuestions" id="numQuestions" class="form-select">
              <option :value="5">5 Questions</option>
              <option :value="10">10 Questions</option>
              <option :value="15">15 Questions</option>
              <option :value="20">20 Questions</option>
            </select>
          </div>
          <div class="col-md-3">
            <label for="timeLimit" class="form-label">Time</label>
            <select v-model="timeLimit" id="timeLimit" class="form-select">
              <option :value="120">2 Minutes</option>
              <option :value="300">5 Minutes</option>
              <option :value="600">10 Minutes</option>
              <option :value="0">No Timer</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Type of Questions</label>
            <div class="btn-group w-100" role="group">
              <button v-for="(type, index) in questionTypes" :key="index" @click="toggleQuestionType(type.value)" :class="['btn', 'custom-toggle-btn', selectedQuestionTypes.includes(type.value) ? 'active' : '']">
                {{ type.label }}
              </button>
            </div>
          </div>
        </div>
        <h5 class="text-start mt-4">Generated Questions</h5>
        <!-- Loader Animation -->
        <div v-if="loading" class="loader"></div>
        <div v-if="questions.length" class="shadow-lg p-4 mb-4 bg-white rounded position-relative">
          <!-- Play Section Button -->
          <button class="btn btn-secondary play-btn" @click="playVideo" v-if="!quizFinished">
            Play Section
          </button>
          <!-- Time Remaining -->
          <template v-if="!quizFinished">
            <p>{{ questions[currentQuestion].question }}
              <span v-if="timeLimit > 0" class="badge bg-secondary"> Time Remaining: {{ timeRemaining }}s </span>
            </p>
            <!-- Multiple Choice Buttons -->
            <div v-if="questions[currentQuestion].type === 'multiple-choice'" class="d-flex flex-column">
            <button 
            v-for="(option, index) in questions[currentQuestion].options" 
            :key="index" 
            class="btn m-1 btn-secondary"
            :class="{
              'btn-success': feedback !== '' && option === questions[currentQuestion].answer, // Correct answer always green
              'btn-danger': feedback !== '' && answers[currentQuestion]?.userAnswer === option && option !== questions[currentQuestion].answer, // Incorrect selected answer turns red
              'btn-secondary': feedback === '' // Default state
            }"
            :disabled="feedback !== ''"
            @click="selectAnswer(option)">
            {{ option }}
            </button>
            </div>
            <!-- True/False Buttons -->
            <div v-if="questions[currentQuestion].type === 'true-false'" class="d-flex flex-column">
              <button 
                class="btn m-1 btn-secondary" 
                :class="{
                  'btn-success': feedback !== '' && 'True' === questions[currentQuestion].answer, // Correct answer green
                  'btn-danger': feedback !== '' && answers[currentQuestion]?.userAnswer === 'True' && 'True' !== questions[currentQuestion].answer, // Incorrect selection turns red
                  'btn-secondary': feedback === '' // Default state
                }"
              :disabled="feedback !== ''"
              @click="selectAnswer('True')"> 
              True 
            </button>
            <button 
              class="btn m-1 btn-secondary" 
              :class="{
                'btn-success': feedback !== '' && 'False' === questions[currentQuestion].answer, // Correct answer green
                'btn-danger': feedback !== '' && answers[currentQuestion]?.userAnswer === 'False' && 'False' !== questions[currentQuestion].answer, // Incorrect selection turns red
                'btn-secondary': feedback === '' // Default state
              }"
              :disabled="feedback !== ''"
              @click="selectAnswer('False')"> 
              False 
            </button>
            </div>
            <!-- Short Answer Input -->
            <div v-if="questions[currentQuestion].type === 'short-answer'">
              <input v-model="selectedOption" class="form-control" type="text" placeholder="Type your answer here" :disabled="answeredQuestions.includes(currentQuestion) || checkingAnswer" />
              <button class="btn btn-success mt-2" @click="submitShortAnswer" :disabled="answeredQuestions.includes(currentQuestion) || checkingAnswer">
                {{ checkingAnswer ? "Checking answer..." : "Submit" }}
              </button>
              <p v-if="answers[currentQuestion]?.feedback" :class="{'text-success': answers[currentQuestion].feedback === 'Correct!', 
            'text-danger': answers[currentQuestion].feedback !== 'Correct!'}">
                {{ answers[currentQuestion].feedback }}
              </p>
            </div>
          </template>
          <template v-if="quizFinished">
            <h2>Quiz Complete!</h2>
            <h3>Your score: {{ score }} / {{ questions.length }}</h3>
            <div v-for="(question, index) in questions" :key="index" class="mb-4">
              <p>
                <strong>Q{{ index + 1 }}: {{ question.question }}</strong>
              </p>
              <p>
                <strong>Your Answer:</strong> {{ answers[index]?.userAnswer ? answers[index]?.userAnswer : "N/A" }}
              </p>
              <p :class="{
              'text-success': (
              answers[index] && 
              ((typeof answers[index] === 'object' && answers[index].feedback === 'Correct!') || 
              (typeof answers[index] === 'string' && answers[index] === question.answer))
              ),
              'text-danger': (
              !answers[index] || // unanswered questions should be red
              (answers[index] && typeof answers[index] === 'object' && answers[index].feedback !== 'Correct!') || 
              (typeof answers[index] === 'string' && answers[index] !== question.answer)
              )
              }">
                <strong>Correct Answer:</strong> {{ question.answer }}
              </p>
            </div>
            <button @click="openSaveModal" class="btn btn-success" :disabled="quizSaved">Save Quiz</button>
            <!-- Save Quiz Modal -->
            <div v-if="showSaveModal" class="modal-overlay">
              <div class="modal-content">
                <span class="close-modal" @click="showSaveModal = false">&times;</span>
                <h4>Save Quiz</h4>
                <input v-model="quizName" class="form-control mt-2" placeholder="Enter quiz name" />
                <button @click="saveQuiz" class="btn btn-success mt-3" :disabled="quizSaved">Save</button>
                <p v-if="saveMessage" :class="{'text-success': saveSuccess, 'text-danger': !saveSuccess}">
                  {{ saveMessage }}
                </p>
              </div>
            </div>
          </template>
          <!-- Navigation Buttons -->
          <div class="d-flex justify-content-between mt-3" v-if="!quizFinished">
            <button class="btn btn-secondary" @click="prevQuestion" :disabled="currentQuestion === 0"> Previous </button>
            <button class="btn btn-secondary" @click="nextQuestion">
              {{ currentQuestion === questions.length - 1 ? 'Finish' : 'Next' }}
            </button>
          </div>
        </div>
      </main>
    </div>
    <!-- Video Modal -->
    <div v-if="showVideoModal" class="video-modal">
      <div class="video-modal-content">
        <span class="video-close" @click="showVideoModal = false">&times;</span>
        <iframe
          width="100%"
          height="400"
          :src="videoUrlWithTimestamp"
          frameborder="0"
          allow="autoplay; encrypted-media"
          allowfullscreen
        ></iframe>
      </div>
    </div>
  </template>
  <script>
    import axios from 'axios';
    export default {
      data() {
        return {
          username: localStorage.getItem('username') || 'USERNAME',
          youtubeLink: "",
          questions: [],
          errorMessage: '',
          loading: false,
          currentQuestion: 0,
          feedback: '',
          score: 0,
          selectedOption: '',
          answers: [],
          quizFinished: false,
          timer: null,
          timeRemaining: 0,
          checkingAnswer: false,
          answeredQuestions: [],
          numQuestions: 5,
          timeLimit: 120,
          showVideoModal: false,
          showSaveModal: false,
          quizName: "",
          saveMessage: "",
          saveSuccess: false,
          quizSaved: false,
          videoUrlWithTimestamp: "",
          selectedQuestionTypes: ["multiple-choice"],
          questionTypes: [{
            value: "multiple-choice",
            label: "Multiple Choice"
          }, {
            value: "true-false",
            label: "True / False"
          }, {
            value: "short-answer",
            label: "Short Answer"
          }]
        };
      },
      mounted() {
        this.getUsername();
        window.addEventListener("storage", this.getUsername);
      },
      beforeDestroy() {
        window.removeEventListener("storage", this.getUsername);
      },
      methods: {
        getUsername() {
          this.username = localStorage.getItem('username') || 'USERNAME';
        },
        logout() {
          localStorage.removeItem('username');
          localStorage.removeItem('userID');
          this.username = "USERNAME";
          this.$router.push('/');
        },
        async submitShortAnswer() {
          const userAnswer = this.selectedOption.trim();
          const question = this.questions[this.currentQuestion].question;
          const correctAnswer = this.questions[this.currentQuestion].answer.trim();
          if (!userAnswer) return;
          this.checkingAnswer = true;
          try {
            const response = await axios.post('http://18.133.180.64:3000/validate-answer', {
              userAnswer,
              question,
              correctAnswer
            });
            const geminiFeedback = response.data.feedback; // store Gemini's response
            if (geminiFeedback === 'Correct!') {
              this.score++;
            }
            console.log(geminiFeedback);
            this.answers[this.currentQuestion] = {
              userAnswer,
              feedback: geminiFeedback, // Store Gemini's response
              correctAnswer // Store correct answer for display
            };
            console.log("Updated answers array:", JSON.stringify(this.answers, null, 2));
            this.answeredQuestions.push(this.currentQuestion);
            // update feedback immediately
            this.feedback = geminiFeedback;
          } catch (error) {
            this.feedback = 'Error checking answer.';
          } finally {
            this.checkingAnswer = false;
          }
        },
        async fetchQuestions() {
          this.loading = true;
          this.errorMessage = '';
          this.questions = [];
          this.currentQuestion = 0;
          this.feedback = '';
          this.score = 0;
          this.quizFinished = false;
          this.answers = [];
          this.answeredQuestions = [];
          this.quizSaved = false;
          const userID = localStorage.getItem('userID');
          if (!userID) {
          this.errorMessage = "User ID not found. Please log in.";
          this.loading = false;
          return;
          }
          try {
            const response = await axios.get('http://18.133.180.64:3000/generate-questions', {
              params: {
                videoUrl: this.youtubeLink,
                numQuestions: this.numQuestions,
                questionTypes: JSON.stringify(this.selectedQuestionTypes),
                userID: userID
              },
            });
            if (this.timeLimit > 0) {
              this.startTimer();
            }
            let cleanedResponse = response.data.questions.replace(/```json|```/g, '').trim();
            this.questions = JSON.parse(cleanedResponse);
          } catch (error) {
            this.errorMessage = 'An error occurred while generating questions.';
          } finally {
            this.loading = false;
          }
        },
        async saveQuiz() {
          if (!this.quizName.trim()) {
              this.saveMessage = "Quiz name is required";
              this.saveSuccess = false;
              return;
          }

          const userID = localStorage.getItem('userID');
          if (!userID) {
              this.saveMessage = "User ID not found. Please log in.";
              this.saveSuccess = false;
              return;
          }

          try {
              const response = await axios.post('http://18.133.180.64:3000/save-quiz', {
                  userID: userID,
                  youtubeLink: this.youtubeLink,
                  questions: this.questions,
                  quizName: this.quizName
              });

              this.saveMessage = "Successfully saved!";
              this.saveSuccess = true;
              this.quizSaved = true;
          } catch (error) {
              this.saveMessage = "Error saving quiz.";
              this.saveSuccess = false;
          }
      },
        openSaveModal() {
          this.showSaveModal = true;
          this.quizName = "";
          this.saveMessage = "";
          this.saveSuccess = false;
        },
        toggleQuestionType(type) {
          if (this.selectedQuestionTypes.includes(type)) {
            if (this.selectedQuestionTypes.length > 1) {
              this.selectedQuestionTypes = this.selectedQuestionTypes.filter(t => t !== type);
            }
          } else {
            this.selectedQuestionTypes.push(type);
          }
        },
        selectAnswer(option) {
          this.selectedOption = option; // Store selected option
          this.answers[this.currentQuestion] = {
          userAnswer: option, // Save user answer
          feedback: option === this.questions[this.currentQuestion].answer ? 'Correct!' : 'Incorrect!',
          correctAnswer: this.questions[this.currentQuestion].answer
          };
          this.feedback = this.answers[this.currentQuestion].feedback; // Show feedback

          if (this.feedback === 'Correct!') this.score++;
        },
        startTimer() {
          this.timeRemaining = this.timeLimit;
          if (this.timer) clearInterval(this.timer);
          if (this.timeLimit > 0) {
            this.timer = setInterval(() => {
              if (this.timeRemaining > 0) {
                this.timeRemaining--;
              } else {
                this.quizFinished = true;
                clearInterval(this.timer);
              }
            }, 1000);
          }
        },
        stopTimer() {
          if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
          }
        },
        playVideo() {
          if (!this.youtubeLink || !this.questions[this.currentQuestion]?.time) {
            console.error("wrong link or timestamp.");
            return;
          }
          // extract the timestamp from the question and remove "s"
          let seconds = this.questions[this.currentQuestion].time.replace("s", "");
          // extract video ID
          let videoIdMatch = this.youtubeLink.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/|.*embed\/|.*v\/|.*watch\?.*v=))([^&?#]+)/);
          if (!videoIdMatch) {
            console.error("wrong link");
          return;
          }
          let videoId = videoIdMatch[1]; // Extract the video ID
          // makes the embed URL
          this.videoUrlWithTimestamp = `https://www.youtube.com/embed/${videoId}?autoplay=1&start=${seconds}`;
          // show the modal
          this.showVideoModal = true;
          console.log("Opening video", this.videoUrlWithTimestamp, "at", this.questions[this.currentQuestion].time);
        },
        // moves to the next question or finishes the quiz
        nextQuestion() {
          console.log("Answers before moving to next question:", JSON.stringify(this.answers, null, 2));
          // saves the current answer before moving to the next question
          this.answers[this.currentQuestion] = {
          userAnswer: this.selectedOption,
          feedback: this.feedback,  
          correctAnswer: this.questions[this.currentQuestion].answer 
          };
          if (this.currentQuestion < this.questions.length - 1) {
            this.currentQuestion++;
            this.feedback = '';
            // loads the previously saved answer for the next question (if any)
            this.selectedOption = this.answers[this.currentQuestion]?.userAnswer || '';
            this.feedback = this.answers[this.currentQuestion]?.feedback || '';
            // display feedback if an answer exists
            if (this.selectedOption) {
              const correctAnswer = this.questions[this.currentQuestion].answer.trim().toLowerCase();
              this.feedback = this.selectedOption.trim().toLowerCase() === correctAnswer ? 'Correct!' : 'Incorrect!';
            }
          } else {
            console.log("Final Answers before finishing quiz:", JSON.stringify(this.answers, null, 2));
            this.quizFinished = true;
          }
        },
        // moves to the previous question
        prevQuestion() {
          if (this.currentQuestion > 0) {
            // save the current answer before moving to the previous question
            this.answers[this.currentQuestion] = {
              userAnswer: this.selectedOption,
              feedback: this.feedback,  
              correctAnswer: this.questions[this.currentQuestion].answer 
            };
            this.currentQuestion--;
            this.feedback = '';
            // load the previously saved answer for the previous question (if any)
            this.selectedOption = this.answers[this.currentQuestion]?.userAnswer || '';
            this.feedback = this.answers[this.currentQuestion]?.feedback || '';
            // display feedback if an answer exists
            if (this.selectedOption) {
              const correctAnswer = this.questions[this.currentQuestion].answer.trim().toLowerCase();
              this.feedback = this.selectedOption.trim().toLowerCase() === correctAnswer ? 'Correct!' : 'Incorrect!';
            }
          }
        }
      }
    };
  </script>
  <style scoped>
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
    .hero {
    background: rgb(138, 0, 183);
    color: white;
    padding: 4rem 1rem;
    text-align: center;
    margin-bottom: 2rem;
  }

  .hero-content h1 {
    font-size: 2.5rem;
    margin: 0;
  }

  .hero-content p {
    margin: 0.5rem 0 0;
  }

    /* Input */
    .custom-input {
      max-width: 1000px;
    }

    /* Select Box */
    .form-label {
      font-weight: bold;
      display: block;
    }

    .form-select {
      width: 50%;
    }

    /* Custom Buttons */
    .custom-btn {
      background-color: rgb(138, 0, 183) !important;
      color: white !important;
      font-size: 14px;
      padding: 8px 15px;
      border-radius: 5px;
      border: none;
      transition: background-color 0.3s ease, transform 0.2s ease;
    }

    .custom-btn:hover {
      background-color: rgb(110, 0, 150) !important;
      transform: scale(1.0);
    }

    .custom-toggle-btn {
      background-color: transparent;
      border: 1px solid rgb(138, 0, 183);
      color: rgb(138, 0, 183);
    }

    .custom-toggle-btn:hover {
      background-color: rgba(138, 0, 183, 0.2);
      color: rgb(138, 0, 183);
    }

    .custom-toggle-btn.active {
      background-color: rgb(138, 0, 183);
      color: white;
    }

    /* loader for the spinning circle animation taken from w3 school https://www.w3schools.com/howto/howto_css_loader.asp*/
    .loader {
      border: 16px solid #f3f3f3;
      /* border for the circle */
      border-top: 16px solid rgb(138, 0, 183);
      /* spinning part */
      border-radius: 50%;
      /* makes it a circle */
      width: 120px;
      height: 120px;
      animation: spin 2s linear infinite;
      /* continuous spin animation */
      margin: 30px auto;
    }

    /* keyframes for the spinning animation */
    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }

      100% {
        transform: rotate(360deg);
      }
    }

    /* Video Modal Style */
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

  .play-btn {
    margin-bottom: -30px;
    margin-left: auto; /* Pushes the button to the right */
    display: flex;
    align-items: center; /* Align with the text */
    white-space: nowrap; /* Prevents text wrapping */
  }

  /* Adjust layout for smaller screens */
  @media (max-width: 900px) {
    .play-btn {
      margin-bottom: 0px;
      width: 100%; /* Make the button full-width on small screens */
      justify-content: center; /* Center the button */
      margin-top: 10px; /* Adds spacing from the question */
    }
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

  .modal-content {
      background: white;
      padding: 20px;
      border-radius: 8px;
      width: 400px;
      text-align: center;
      position: relative;
  }

  .close-modal {
      position: absolute;
      top: 10px;
      right: 15px;
      font-size: 24px;
      cursor: pointer;
  }

  </style>