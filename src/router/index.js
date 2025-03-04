import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/home.vue';
import LoginView from '@/views/login.vue';
import GenerateView from '@/views/generateQuestion.vue';
import  QuestionView from '@/views/QuestionTest.vue';
import ProfileView from '@/views/accountHome.vue';
import RealAccountHome from '@/views/account.vue';
import friends from '@/views/friends.vue';
import quizzes from '@/views/quizzes.vue';

const routes = [
  {
    path: '/',
    redirect: { name: 'home' },
  },
  { 
    path: '/home', 
    name: 'home', 
    component: HomeView
  },
  { 
    path: '/login', 
    name: 'login', 
    component: LoginView
  },
  { 
    path: '/QuestionTest', 
    name: 'QuestionTest', 
    component: QuestionView
  },
  { 
    path: '/generateQuestions', 
    name: 'generateQuestions', 
    component: GenerateView,
    meta: { requiresAuth: true }
  },
  { 
    path: '/accountHome', 
    name: 'accountHome', 
    component: ProfileView,
    meta: { requiresAuth: true }
  },
  { 
    path: '/account', 
    name: 'account', 
    component: RealAccountHome,
    meta: { requiresAuth: true }
  },
  { 
    path: '/friends', 
    name: 'friends', 
    component: friends,
    meta: { requiresAuth: true }
  },
  { 
    path: '/quizzes', 
    name: 'quizzes', 
    component: quizzes,
    meta: { requiresAuth: true }
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// protects routes
router.beforeEach((to, from, next) => {
  const isLoggedIn = !!localStorage.getItem('userID'); // check if userID exists in localStorage

  if (to.meta.requiresAuth && !isLoggedIn) {
    // redirect to login if trying to access a protected route while not logged in
    next({ name: 'login' });
  } else {
    next(); // allow navigation
  }
});

export default router;
