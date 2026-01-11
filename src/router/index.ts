import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../components/LoginForm.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../views/Dashboard.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/tasks',
      name: 'tasks-dashboard',
      component: () => import('../views/tasks/TasksDashboard.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/tasks/gas-connections/new',
      name: 'new-gas-connection',
      component: () => import('../views/tasks/NewGasConnection.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/tasks/gas-connections',
      name: 'gas-connections-list',
      component: () => import('../views/tasks/GasConnectionsList.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/tasks/gas-connections/details',
      name: 'gas-connection-details',
      component: () => import('../views/tasks/GasConnectionDetails.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/');
  } else {
    next();
  }
});

export default router;
