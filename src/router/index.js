import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/home.vue';
import LoginView from '@/views/login.vue';
import AccountView from '@/views/account.vue';
import  QuestionView from '@/views/QuestionTest.vue';
import  TeacherLogin from '@/views/teacherLogin.vue';
import TeacherAccount from '@/views/teacherAccount.vue';
import QuizView from '@/views/quiz.vue';
import ProfileView from '@/views/accountHome.vue';

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
    path: '/quiz', 
    name: 'quiz', 
    component: QuizView
  },
  { 
    path: '/QuestionTest', 
    name: 'QuestionTest', 
    component: QuestionView
  },
  { 
    path: '/teacherLogin', 
    name: 'teacherLogin', 
    component: TeacherLogin
  },
  { 
    path: '/teacherAccount', 
    name: 'teacherAccount', 
    component: TeacherAccount
  },
  { 
    path: '/account', 
    name: 'account', 
    component: AccountView,
    meta: { requiresAuth: true }
  },
  { 
    path: '/accountHome', 
    name: 'accountHome', 
    component: ProfileView,
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
