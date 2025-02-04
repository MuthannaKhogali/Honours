<template>
  <div class="no-scroll">
    <div class="purple-box" v-if="!isSmallScreen">
      <h2 class="purple-text">{{ isRegistering ? 'Welcome Aboard' : 'Welcome Back' }}</h2>
      <p class="purple-text">
        {{ isRegistering ? "Already have an account?" : "Don't have an account?" }}
        <a href="#" @click.prevent="toggleMode" class="text-link">{{ isRegistering ? 'Login Now' : 'Register Now' }}</a>
      </p>
    </div>
    <div :class="['form-box', { 'adjust-left': !isSmallScreen }]">
      <h2>{{ isRegistering ? 'Register' : 'Log in' }}</h2>
      <form @submit.prevent="isRegistering ? handleRegister() : handleLogin()">
        <div class="input-group centered-group">
          <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label is-dirty">
            <input class="mdl-textfield__input" type="text" v-model="username" required />
            <label class="mdl-textfield__label">Username</label>
          </div>
        </div>
        <div class="input-group centered-group">
          <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label is-dirty">
            <input class="mdl-textfield__input" type="password" v-model="password" required />
            <label class="mdl-textfield__label">Password</label>
          </div>
        </div>
        <div v-if="isRegistering" class="input-group centered-group">
          <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label is-dirty">
            <input class="mdl-textfield__input" type="password" v-model="confirmPassword" required />
            <label class="mdl-textfield__label">Confirm Password</label>
          </div>
        </div>
        <p v-if="errorMessage" class="text-danger">{{ errorMessage }}</p>
        <button type="submit" class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored">
          {{ isRegistering ? 'Register' : 'Login' }}
        </button>
        <p v-if="isSmallScreen" class="mobile-text">
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
    toggleMode() {
      this.isRegistering = !this.isRegistering;
      this.errorMessage = '';
    },
    async handleLogin() {
      try {
        const response = await axios.post('http://localhost:3000/login', {
          username: this.username,
          password: this.password
        });
        localStorage.setItem('userID', response.data.userID);
        this.errorMessage = 'LOGGED IN';
      } catch (error) {
        this.errorMessage = error.response?.data?.error || 'Login failed.';
      }
    },
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
    handleResize() {
      this.isSmallScreen = window.innerWidth <= 1150 || window.innerHeight <= 780;
    }
  },
  mounted() {
    window.addEventListener('resize', this.handleResize);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize);
  }
};
</script>

<style scoped>
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
.purple-text {
  margin-left: 100px;
}
.form-box {
  width: 50vw;

  background: white;
  padding: 50px;
  border-radius: 40px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
  text-align: center;
  transition: width 0.3s ease-in-out;
}
@media (max-width: 768px) {
  .form-box {
    width: 90vw;
    padding: 30px;
  }
}
.adjust-left {
  margin-left: -40vw;
}
.input-group {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}
.centered-group {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  width: 100%;
}
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
.text-danger {
  color: red;
  margin-top: 10px;
}
.mobile-text {
  margin-top: 15px;
}

button.mdl-button {
  background-color: rgb(138, 0, 183) !important; 
  color: white !important;
}

button.mdl-button:hover {
  background-color: rgb(115, 0, 152) !important;
}

</style>
