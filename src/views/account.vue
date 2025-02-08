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
                    v-model="questionInput"
                    class="form-control custom-input"
                    type="text"
                    placeholder="Enter YouTube Link"
                />
                <button @click="generateQuestion" class="btn custom-btn">
                    Generate
                </button>
            </div>

            <!-- Customise Questions -->
            <h5 class="text-start mt-4">Customise Questions</h5>
            <div class="row mt-3">
                <!-- Number of Questions -->
                <div class="col-md-3">
                    <label for="numQuestions" class="form-label">Questions</label>
                    <select v-model="numQuestions" id="numQuestions" class="form-select">
                        <option :value="5">5 Questions</option>
                        <option :value="10">10 Questions</option>
                        <option :value="15">15 Questions</option>
                        <option :value="20">20 Questions</option>
                    </select>
                </div>

                <!-- Time Limit -->
                <div class="col-md-3">
                    <label for="timeLimit" class="form-label">Time</label>
                    <select v-model="timeLimit" id="timeLimit" class="form-select">
                        <option :value="120">2 Minutes</option>
                        <option :value="300">5 Minutes</option>
                        <option :value="600">10 Minutes</option>
                        <option :value="0">No Timer</option>
                    </select>
                </div>

                <!-- Type of Questions (Multi-Select) -->
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

            <h5 class="text-start mt-4">Recent</h5>
            <p class="text-start">Here will show all your recent generated questions</p>
        </main>
    </div>
</template>

<script>
export default {
    data() {
        return {
            username: 'USERNAME', // default username before login
            questionInput: "",
            numQuestions: 5,
            timeLimit: 120,
            selectedQuestionTypes: ["multiple-choice"],

            // Available Question Types
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
            const storedUsername = localStorage.getItem('username');
            this.username = storedUsername ? storedUsername : 'USERNAME';
        },
        logout() {
            localStorage.removeItem('username');
            localStorage.removeItem('userID');
            this.username = "USERNAME";
            this.$router.push('/');
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
        generateQuestion() {
            console.log("Generating questions with:", {
                numQuestions: this.numQuestions,
                timeLimit: this.timeLimit,
                selectedQuestionTypes: this.selectedQuestionTypes
            });
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
</style>
