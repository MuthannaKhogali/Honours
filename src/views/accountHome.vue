<template>
    <div>
      <!-- Navbar -->
      <nav class="navbar navbar-expand-lg custom-navbar">
        <div class="container-fluid">
          <a class="navbar-brand" href="#">Logo</a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav ms-auto">
              <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                  {{ username }}
                </a>
                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                  <li>
                    <a class="dropdown-item" href="#" @click="logout">Log out</a>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </nav>
  
      <!-- Main Content -->
      <main class="container mt-4">
        <h3>Welcome Back, {{ username }}!</h3>
        <p class="mt-3">Want to generate questions?  
            <router-link to="/account" class="btn btn-success">Generate Now</router-link>
        </p>


          <div class="col-md-3 mb-5 mt-5">
            <h3>Friends</h3>
          </div>
          <div class="col-md-3 mb-5 mt-5">
            <h3>Saved Questions</h3>
          </div>
          <div class="col-md-3 mb-5 mt-5">
            <h3>Recieved Questions</h3>
          </div>
      </main>
    </div>
</template>
  
<script>
export default {
  data() {
    return {
      username: localStorage.getItem('username') || 'USERNAME',
    };
  },
  mounted() {
    this.getUsername();
  },
  methods: {
    getUsername() {
      this.username = localStorage.getItem('username') || 'USERNAME';
    },
    logout() {
      localStorage.removeItem('username');
      localStorage.removeItem('userID');
      this.$router.push('/');
    }
  }
};
</script>
  
<style scoped>
/* Navbar */
.custom-navbar {
  background-color: rgb(138, 0, 183) !important;
}

.navbar-brand,
.nav-link {
  color: white !important;
}

</style>
