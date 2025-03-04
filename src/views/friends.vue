<template>
    <div class="friends-container">
      <!-- Full-width Purple Header (Centered) -->
      <section class="hero">
        <div class="hero-content">
          <h1>Friends</h1>
          <p>Manage your friends, requests, and connections.</p>
          <router-link to="/account" class="back-button">Home</router-link>
        </div>
      </section>
  
      <div class="content-wrapper">
        <div class="left-content">
          <!-- Add Friend Section -->
          <section class="add-friend">
            <h2>Add a Friend</h2>
            <div class="add-friend-box">
              <input v-model="friendUsername" placeholder="Enter Username" class="form-control large-input">
              <button @click="sendFriendRequest" class="btn btn-purple">Add Friend</button>
            </div>
            <p v-if="friendError" class="text-danger mt-2">{{ friendError }}</p>
          </section>
  
          <!-- Pending Friend Requests -->
          <section class="pending-requests">
            <h2>Pending Requests</h2>
            <div v-if="pendingRequests.length === 0" class="empty-state">No pending requests.</div>
            <div class="friend-grid">
              <div v-for="request in pendingRequests" :key="request.friendID" class="friend-card small-card">
                <h4>{{ request.username }}</h4>
                <div v-if="request.sentBy !== userID" class="button-group">
                  <button @click="acceptFriend(request.friendID)" class="btn btn-success btn-sm">Accept</button>
                  <button @click="removeFriend(request.friendID)" class="btn btn-danger btn-sm">Reject</button>
                </div>
                <span v-else class="text-muted">Waiting for them to accept...</span>
              </div>
            </div>
          </section>
  
          <!-- Friends List -->
          <section class="friends-list">
            <h2>Friends List</h2>
            <div v-if="friends.length === 0" class="empty-state">You have no friends yet.</div>
            <div class="friend-grid">
              <div v-for="friend in friends" :key="friend.friendID" class="friend-card small-card">
                <h4 class="mb-4 mt-3">{{ friend.username }}</h4>
                <button @click="removeFriend(friend.friendID)" class="btn btn-purple btn-sm">Remove</button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    data() {
      return {
        userID: Number(localStorage.getItem('userID')),
        friendUsername: '',
        friendError: '',
        pendingRequests: [],
        friends: []
      };
    },
    mounted() {
      this.getFriends();
    },
    methods: {
      async sendFriendRequest() {
        if (!this.friendUsername) {
          this.friendError = "Enter a valid username.";
          return;
        }
        try {
          await axios.post("http://localhost:5000/send-friend-request", {
            userID: this.userID,
            friendUsername: this.friendUsername,
          });
          this.friendUsername = "";
          this.getFriends();
        } catch (error) {
          this.friendError = error.response?.data?.error || "Failed to send request.";
        }
      },
      async getFriends() {
        try {
          const response = await axios.get("http://localhost:5000/get-friends", { params: { userID: this.userID } });
          this.friends = response.data.friends;
          this.pendingRequests = response.data.pendingRequests;
        } catch (error) {
          console.error(error);
        }
      },
      async acceptFriend(friendID) {
        await axios.post("http://localhost:5000/accept-friend-request", { userID: this.userID, friendID });
        this.getFriends();
      },
      async removeFriend(friendID) {
        await axios.post("http://localhost:5000/remove-friend", { userID: this.userID, friendID });
        this.getFriends();
      }
    }
  };
  </script>
  
  <style scoped>
  /* Full-width Hero Section */
  .hero {
    background: rgb(138, 0, 183);
    color: white;
    width: 100vw;
    padding: 4rem 2rem;
    box-sizing: border-box;
    text-align: center;
    margin: 0;
  }
  
  .hero-content {
    max-width: 800px;
    margin: 0 auto;
  }
  
  /* Back Button */
  .back-button {
    color: white;
    text-decoration: none;
    font-size: 1.2rem;
    font-weight: bold;
    display: inline-block;
    margin-bottom: 10px;
    transition: opacity 0.3s ease;
  }
  
  .back-button:hover {
    opacity: 0.8;
  }
  
  /* Content Wrapper */
  .content-wrapper {
    display: flex;
    justify-content: flex-start;
    padding: 2rem;
    width: 100%;
    max-width: 1200px;
    margin: 0;
  }
  
  /* Left Content (Everything moves left) */
  .left-content {
    width: 100%;
    max-width: 600px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  
  /* Add Friend Section */
  .add-friend {
    width: 100%;
    margin-bottom: 2rem;
  }
  
  .add-friend-box {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
  }
  
  .large-input {
    flex: 1;
    padding: 9px;
    font-size: 1rem;
    border: 1px solid rgb(0, 0, 0);
    border-radius: 5px;
  }
  
  /* Pending Requests & Friends List */
  .pending-requests,
  .friends-list {
    width: 100%;
    margin-bottom: 2rem;
  }
  
  /* Friend Grid */
  .friend-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-top: 1rem;
  }
  
  /* Friend Card */
  .friend-card {
    background: white;
    border: 1px solid rgb(138, 0, 183);
    padding: 1rem;
    border-radius: 8px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  /* Align buttons side by side */
  .button-group {
    display: flex;
    justify-content: center;
    gap: 5px;
    margin-top: 15px;
  }
  
  /* Smaller Friend Cards */
  .small-card {
    width: 160px;
    height: 140px;
    padding: 0.8rem;
  }
  
  /* Empty State */
  .empty-state {
    color: #888;
    font-style: italic;
    margin-top: 1rem;
  }
  
  /* Buttons */
  .btn {
    padding: 10px 14px;
    border: none;
    cursor: pointer;
    border-radius: 6px;
    text-decoration: none;
    font-size: 1rem;
    transition: background 0.3s ease, transform 0.2s ease;
  }
  
  .btn-purple {
    background: rgb(138, 0, 183);
    color: white;
  }
  
  .btn-purple:hover {
    background: rgb(118, 0, 160);
    transform: translateY(-2px);
    color: white;
  }

    
  .friend-card h4 {
    margin: 0 0 0.5rem;
    font-size: 1.3rem;
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .hero {
      padding: 3rem 1rem;
    }
  
    .hero h1 {
      font-size: 2rem;
    }
  
    .content-wrapper {
      align-items: flex-start;
      padding-left: 1rem;
    }
  
    .add-friend-box {
      flex-direction: column;
      align-items: flex-start;
      max-width: 100%;
    }
  
    .large-input {
      width: 100%;
    }
  
    .friend-grid {
      justify-content: flex-start;
    }
  
  }
  </style>
  