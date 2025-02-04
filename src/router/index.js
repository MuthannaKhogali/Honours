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
    component: AccountView
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
