<template>
    <div>
        <nav class="navbar navbar-expand-lg custom-navbar">
            <div class="container-fluid">
                <a class="navbar-brand" href="#">Logo</a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" 
                data-bs-target="#navbarNav" aria-controls="navbarNav" 
                aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav ms-auto">
                        <li class="nav-item dropdown">
                            <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                {{ username }}
                            </a>
                            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                                <li><a class="dropdown-item" href="#" @click="logout">Log out</a></li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>

        <!-- Main content -->
        <main class="container-fluid mt-4 px-3">
            <h5 class="text-start">Generate Questions</h5>

            <!-- Input Container -->
            <div class="input-group mt-3">
                <input
                    v-model="youtubeLink"
                    class="form-control custom-input"
                    type="text"
                    placeholder="Enter YouTube Link"
                />
                <button @click="fetchQuestions" class="btn custom-btn">
                    Generate
                </button>
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
                        <button
                            v-for="(type, index) in questionTypes"
                            :key="index"
                            @click="toggleQuestionType(type.value)"
                            :class="['btn', 'custom-toggle-btn', selectedQuestionTypes.includes(type.value) ? 'active' : '']"
                        >
                            {{ type.label }}
                        </button>
                    </div>
                </div>
            </div>

            <h5 class="text-start mt-4">Generated Questions</h5>
            
            <!-- Loader Animation -->
            <div v-if="loading" class="loader"></div>

            <div v-if="questions.length" class="shadow-lg p-4 mb-4 bg-white rounded">
                <template v-if="!quizFinished">
                    <p>{{ questions[currentQuestion].question }}</p>
                    <div class="d-flex flex-column">
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
                    <p v-if="feedback" :class="{'text-success': feedback === 'Correct!', 'text-danger': feedback !== 'Correct!'}">
                        {{ feedback }}
                    </p>
                </template>

                <template v-if="quizFinished">
                    <h2>Quiz Complete!</h2>
                    <h3>Your score: {{ score }} / {{ questions.length }}</h3>
                    <div v-for="(question, index) in questions" :key="index" class="mb-4">
                        <p><strong>Q{{ index + 1 }}: {{ question.question }}</strong></p>
                        <p><strong>Your Answer:</strong> {{ answers[index] }}</p>
                        <p :class="{'text-success': answers[index] === question.answer, 'text-danger': answers[index] !== question.answer}">
                            <strong>Correct Answer:</strong> {{ question.answer }}
                        </p>
                    </div>
                </template>

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
        </main>
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

            numQuestions: 5,
            timeLimit: 120,
            selectedQuestionTypes: ["multiple-choice"],
            questionTypes: [
                { value: "multiple-choice", label: "Multiple Choice" },
                { value: "true-false", label: "True / False" },
                { value: "short-answer", label: "Short Answer" }
            ]
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
                const response = await axios.get('http://localhost:5000/generate-questions', {
                    params: { 
                        videoUrl: this.youtubeLink,
                        numQuestions: this.numQuestions
                    },
                });

                let cleanedResponse = response.data.questions.replace(/```json|```/g, '').trim();
                this.questions = JSON.parse(cleanedResponse);
            } catch (error) {
                this.errorMessage = error.response?.data?.error || 'An error occurred while generating questions.';
            } finally {
                this.loading = false;
            }
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
            this.answers[this.currentQuestion] = option;
            this.feedback = option === this.questions[this.currentQuestion].answer ? 'Correct!' : 'Incorrect!';
            if (this.feedback === 'Correct!') this.score++;
        },
        // moves to the next question or finishes the quiz
        nextQuestion() {
    
        // saves the current answer before moving to the next question
        if (this.selectedOption) {
        this.answers[this.currentQuestion] = this.selectedOption;
        }
  
        if (this.currentQuestion < this.questions.length - 1) {
        this.currentQuestion++;
        this.feedback = '';
        // loads the previously saved answer for the next question (if any)
        this.selectedOption = this.answers[this.currentQuestion] || '';
        // display feedback if an answer exists
        if (this.selectedOption) {
            const correctAnswer = this.questions[this.currentQuestion].answer.trim().toLowerCase();
            this.feedback = this.selectedOption.trim().toLowerCase() === correctAnswer
            ? 'Correct!'
            : 'Incorrect!';
        }
        } else {
        this.quizFinished = true;
        }
    },
    
  // moves to the previous question
  prevQuestion() {
    if (this.currentQuestion > 0) {
      // save the current answer before moving to the previous question
      if (this.selectedOption) {
        this.answers[this.currentQuestion] = this.selectedOption;
      }
  
      this.currentQuestion--;
      this.feedback = '';
      // load the previously saved answer for the previous question (if any)
      this.selectedOption = this.answers[this.currentQuestion] || '';
      // display feedback if an answer exists
      if (this.selectedOption) {
        const correctAnswer = this.questions[this.currentQuestion].answer.trim().toLowerCase();
        this.feedback = this.selectedOption.trim().toLowerCase() === correctAnswer
          ? 'Correct!'
          : 'Incorrect!';
      }
    }
  }
}
};
</script>


<style scoped>
/* Navbar */
.custom-navbar {
    background-color: rgb(138, 0, 183) !important;
}

.navbar-brand, .nav-link {
    color: white !important;
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
    border: 16px solid #f3f3f3; /* border for the circle */
    border-top: 16px solid rgb(138, 0, 183); /* spinning part */
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
