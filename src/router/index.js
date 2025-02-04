import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/home.vue';
import LoginView from '@/views/login.vue';
import AccountView from '@/views/account.vue';

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
    path: '/account', 
    name: 'account', 
    component: AccountView,
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
