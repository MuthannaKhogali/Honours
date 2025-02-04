<template>
  <div class="no-scroll">
    <!-- Purple Box for Desktop -->
    <div class="purple-box" v-if="!isSmallScreen">
      <h2 class="purple-text">{{ isRegistering ? 'Welcome Aboard' : 'Welcome Back' }}</h2>
      <p class="purple-text">
        {{ isRegistering ? "Already have an account?" : "Don't have an account?" }}
        <a href="#" @click.prevent="toggleMode" class="text-link">{{ isRegistering ? 'Login Now' : 'Register Now' }}</a>
      </p>
    </div>

    <!-- Form Box -->
    <div :class="['form-box', { 'adjust-left': !isSmallScreen }]">
      <h2 class="text-start mb-3">{{ isRegistering ? 'Register' : 'Log in' }}</h2>
      <form @submit.prevent="isRegistering ? handleRegister() : handleLogin()">
        
        <!-- Username Input Field -->
        <div class="mb-3 text-start">
          <label class="form-label">Username</label>
          <input type="text" class="form-control" v-model="username" required />
        </div>

        <!-- Password Input Field -->
        <div class="mb-3 text-start">
          <label class="form-label">Password</label>
          <input type="password" class="form-control" v-model="password" required />
        </div>

        <!-- Confirm Password Field -->
        <div v-if="isRegistering" class="mb-3 text-start">
          <label class="form-label">Confirm Password</label>
          <input type="password" class="form-control" v-model="confirmPassword" required />
        </div>

        <!-- Error Message -->
        <p v-if="errorMessage" class="text-danger">{{ errorMessage }}</p>

        <!-- Bigger Purple Button (Fixed Text Color) -->
        <button type="submit" class="btn custom-btn">
          {{ isRegistering ? 'Register' : 'Login' }}
        </button>

        <!-- Switch Between Login and Register -->
        <p v-if="isSmallScreen" class="mt-3">
          {{ isRegistering ? "Already have an account?" : "Don't have an account?" }}
          <a href="#" @click.prevent="toggleMode" class="text-link">{{ isRegistering ? 'Login Now' : 'Register Now' }}</a>
        </p>
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      username: '',
      password: '',
      confirmPassword: '',
      errorMessage: '',
      isRegistering: false,
      isSmallScreen: window.innerWidth <= 1150 || window.innerHeight <= 780
    };
  },
  methods: {
    // toggle between login and register
    toggleMode() {
      this.isRegistering = !this.isRegistering;
      this.errorMessage = '';
    },

    // handle login request
    async handleLogin() {
      try {
        const response = await axios.post('http://localhost:3000/login', {
          username: this.username,
          password: this.password
        });
        localStorage.setItem('userID', response.data.userID);
        this.$router.push('/account');
      } catch (error) {
        this.errorMessage = error.response?.data?.error || 'Login failed.';
      }
    },

    // handle register request
    async handleRegister() {
      if (this.password !== this.confirmPassword) {
        this.errorMessage = 'Passwords do not match!';
        return;
      }
      try {
        await axios.post('http://localhost:3000/register', {
          username: this.username,
          password: this.password
        });
        this.isRegistering = false;
        this.errorMessage = '';
      } catch (error) {
        this.errorMessage = error.response?.data?.error || 'Registration failed.';
      }
    },

    // responsiveness
    handleResize() {
      this.isSmallScreen = window.innerWidth <= 1150 || window.innerHeight <= 780;
    }
  },

  // event listener for different sized screen
  mounted() {
    window.addEventListener('resize', this.handleResize);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize);
  }
};
</script>

<style scoped>
/* General Page Styles */
html, body {
  overflow: hidden;
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100vh;
}
.no-scroll {
  position: fixed;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

/* Purple Box */
.purple-box {
  width: 55vw;
  height: 100vh;
  background: rgb(138, 0, 183);
  border-radius: 80px 0 0 80px;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  text-align: left;
  right: -15vw;
  position: absolute;
  padding-left: 50px;
}

/* Form Box Styles */
.form-box {
  width: 50vw;
  background: white;
  padding: 50px;
  text-align: center;
  transition: width 0.3s ease-in-out;
}
@media (max-width: 1150px) {
  .form-box {
    width: 90vw;
    padding: 30px;
    border-radius: 40px;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
  }
}

/* Move Form Left When Purple Box */
.adjust-left {
  margin-left: -40vw;
}

/* Input Field Styles */
.input-group {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

/* Centered Form Fields */
.centered-group {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  width: 100%;
}

/* Bigger Purple Button */
.custom-btn {
  background-color: rgb(138, 0, 183) !important;
  color: white !important; 
  font-size: 13px;
  padding: 10px 20px;
  border-radius: 30px;
  border: none;
  transition: background-color 0.3s ease, transform 0.2s ease;
  width: 100%;
  font-weight: bold; 
}

.custom-btn:hover {
  background-color: rgb(115, 0, 160) !important;
  transform: scale(1.05);
}

.custom-btn:active {
  background-color: rgb(90, 0, 130) !important;
  transform: scale(0.95);
}

/* Text Link Styling */
.text-link {
  color: white;
  text-decoration: underline;
  cursor: pointer;
  margin-left: 5px;
  transition: color 0.3s ease-in-out;
}
@media (max-width: 1150px) {
  .text-link {
    color: rgb(62, 101, 255);
  }
}
</style>
