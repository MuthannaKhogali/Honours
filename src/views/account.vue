<template>
    <div>
        <nav class="navbar navbar-expand-lg navbar-light bg-light">
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
                        <a class="nav-link" href="#">USERNAME</a>
                    </li>
                </ul>
            </div>
        </div>
        </nav>
      <!-- Main content -->
      <main class="container mt-4">
        <h6 class="text-left">Generate Questions</h6>
  
        <!-- Input Container -->
        <div class="input-group mt-3">
          <input
            v-model="questionInput"
            class="form-control custom-input"
            type="text"
            placeholder="Enter YouTube Link"
          />
          <button @click="generateQuestion" class="btn btn-dark">
            Generate
          </button>
        </div>
  
        <h5 class="mt-4">Recent</h5>
      </main>
    </div>
  </template>
  
  <script>
  </script>
  
  <style scoped>

  
  </style>
  