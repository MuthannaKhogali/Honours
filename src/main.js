import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index.js';

// Import Bootstrap to Vue
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';

// Import MDL to Vue
// import 'material-design-lite/material.min.css';
// import 'material-design-lite/material.min.js';

const app = createApp(App);
app.use(router);
app.mount('#app');
