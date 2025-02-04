<template>
    <div>
      <!-- Navbar -->
      <header class="mdl-layout__header">
        <div class="mdl-layout__header-row">
          <span class="mdl-layout-title">LOGO</span>
          <div class="mdl-layout-spacer"></div>
          <span class="mdl-navigation__link">USERNAME</span>
        </div>
      </header>
  
      <!-- Main content -->
      <main class="mdl-layout__content">
        <div class="page-content">
          <h4>Generate Questions</h4>
          <div class="input-container">
            <input
              v-model="questionInput"
              class="mdl-textfield__input custom-input"
              type="text"
              placeholder="Enter YouTube Link"
            />
            <button @click="generateQuestion" class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored">
              Generate
            </button>
          </div>
  
          <h5>Recent</h5>
        </div>
      </main>
    </div>
  </template>
  
  <script>
  </script>
  
  <style scoped>
  /* Navbar */
  .mdl-layout__header {
    background-color: rgb(138, 0, 183);
    color: white;
  }
  
  /* Main Content */
  .page-content {
    padding: 20px;
  }
  
  /* Input Container */
  .input-container {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    max-width: 600px;
    margin-top: 10px;
  }
  
  .custom-input {
    flex: 1;
    padding: 10px;
    font-size: 16px;
    border: 2px solid #ccc;
    border-radius: 15px;
    outline: none;
    transition: border 0.3s ease;
  }
  
  .custom-input:focus {
    border-color: #3f51b5;
  }
  
  /* Button */
  .mdl-button {
    white-space: nowrap;
  }
  </style>
  