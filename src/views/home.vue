<template>
  <div class="home-page">
    <nav class="navbar navbar-expand-lg navbar-dark bg-purple">
      <div class="container-fluid">
        <a class="navbar-brand" href="#">Logo</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" 
                data-bs-target="#navbarNav" aria-controls="navbarNav" 
                aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto">
            <li class="nav-item">
              <router-link class="nav-link" to="/login">Login</router-link>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <div class="content text-center">
      <h1>Study Easier Using NAME</h1>
      <p class="text-muted">Generate questions from videos, and test your knowledge</p>
      <router-link to="/login">
        <button class="custom-btn">Sign Up Now</button>
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: "HomePage",
};
</script>

<style scoped>
.bg-purple {
  background-color: rgb(138, 0, 183) !important;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  text-align: center;
}

.custom-btn {
  background-color: rgb(138, 0, 183) !important;
  color: white !important; 
  font-size: 13px;
  padding: 10px 20px;
  border-radius: 30px;
  border: none;
  transition: background-color 0.3s ease, transform 0.2s ease;
  font-weight: bold; 
  margin-top: 15px;
}

.custom-btn:hover {
  background-color: rgb(120, 0, 160) !important;
  transform: scale(1.05);
}
</style>
