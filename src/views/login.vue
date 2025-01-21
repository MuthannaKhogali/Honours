<template>
    <div class="container d-flex justify-content-center align-items-center vh-100">
      <div class="card shadow-lg" style="width: 100%; max-width: 400px;">
        <div class="card-body">
          <h5 class="card-title text-center mb-4">Login</h5>
  
          <!-- Login Form -->
          <form @submit.prevent="handleLogin">
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
  
            <!-- Error Message -->
            <p v-if="errorMessage" class="text-danger">{{ errorMessage }}</p>
  
            <div class="d-grid gap-2">
              <button type="submit" class="btn btn-dark">Login</button>
            </div>
          </form>
          
          <!-- Register Link -->
          <div class="mt-3 text-center">
            <p>Don't have an account? <a href="#">Sign Up</a></p>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  </script>
  
  <style scoped>

  </style>
  