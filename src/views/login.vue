<template>
  <div class="container d-flex justify-content-center align-items-center vh-100">
    <div class="card shadow-lg" style="width: 100%; max-width: 400px;">
      <div class="card-body">
        <h5 class="card-title text-center mb-4">{{ isRegistering ? 'Register' : 'Login' }}</h5>

        <!-- Login / Register Form -->
        <form @submit.prevent="isRegistering ? handleRegister() : handleLogin()">
          <div class="mb-3">
            <label for="username" class="form-label">Username</label>
            <input
              v-model="username"
              type="text"
              class="form-control"
              id="username"
              placeholder="Enter your username"
              required
            />
          </div>

          <div class="mb-3">
            <label for="password" class="form-label">Password</label>
            <input
              v-model="password"
              type="password"
              class="form-control"
              id="password"
              placeholder="Enter your password"
              required
            />
          </div>

          <!-- Confirm Password (Only for Register) -->
          <div v-if="isRegistering" class="mb-3">
            <label for="confirmPassword" class="form-label">Confirm Password</label>
            <input
              v-model="confirmPassword"
              type="password"
              class="form-control"
              id="confirmPassword"
              placeholder="Confirm your password"
              required
            />
          </div>

          <!-- Error Message -->
          <p v-if="errorMessage" class="text-danger">{{ errorMessage }}</p>

          <div class="d-grid gap-2">
            <button type="submit" class="btn btn-dark">
              {{ isRegistering ? 'Register' : 'Login' }}
            </button>
          </div>
        </form>

        <!-- Toggle Login/Register -->
        <div class="mt-3 text-center">
          <p v-if="!isRegistering">
            Don't have an account? <a href="#" @click.prevent="isRegistering = true">Sign Up</a>
          </p>
          <p v-if="isRegistering">
            Already have an account? <a href="#" @click.prevent="isRegistering = false">Login</a>
          </p>
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
      username: '',
      password: '',
      confirmPassword: '',
      errorMessage: '',
      isRegistering: false
    };
  },
  methods: {
    async handleLogin() {
      try {
        const response = await axios.post('http://localhost:3000/login', {
          username: this.username,
          password: this.password
        });

        localStorage.setItem('userID', response.data.userID);  // Store token
        alert('Login successful');
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
        const response = await axios.post('http://localhost:3000/register', {
          username: this.username,
          password: this.password
        });

        this.isRegistering = false; // Switch back to login
        this.errorMessage = ''; // Clear error message
      } catch (error) {
        this.errorMessage = error.response?.data?.error || 'Registration failed.';
      }
    }
  }
};
</script>

<style scoped>
</style>
