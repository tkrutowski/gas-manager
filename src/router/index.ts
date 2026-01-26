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
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsDashboard.vue'),
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
      path: '/tasks/designers/grid',
      name: 'designers-grid',
      component: () => import('../views/tasks/designers/DesignersGrid.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/tasks/designers/list',
      name: 'designers-list',
      component: () => import('../views/tasks/designers/DesignersList.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/tasks/designers',
      redirect: '/tasks/designers/grid',
    },
    {
      path: '/tasks/designers/new',
      name: 'new-designer',
      component: () => import('../views/tasks/designers/DesignersGrid.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/tasks/designers-traffic/grid',
      name: 'designers-traffic-grid',
      component: () => import('../views/tasks/designerTraffic/DesignerTrafficGrid.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/tasks/designers-traffic/list',
      name: 'designers-traffic-list',
      component: () => import('../views/tasks/designerTraffic/DesignerTrafficList.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/tasks/designers-traffic',
      redirect: '/tasks/designers-traffic/grid',
    },
    {
      path: '/tasks/designers-traffic/new',
      name: 'new-designer-traffic',
      component: () => import('../views/tasks/designerTraffic/DesignerTrafficGrid.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/tasks/coordinators/grid',
      name: 'coordinators-grid',
      component: () => import('../views/tasks/coordinators/CoordinatorsGrid.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/tasks/coordinators/list',
      name: 'coordinators-list',
      component: () => import('../views/tasks/coordinators/CoordinatorsList.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/tasks/coordinators',
      redirect: '/tasks/coordinators/grid',
    },
    {
      path: '/tasks/coordinators/new',
      name: 'new-coordinator',
      component: () => import('../views/tasks/coordinators/CoordinatorsGrid.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/tasks/surveyors/grid',
      name: 'surveyors-grid',
      component: () => import('../views/tasks/surveyors/SurveyorsGrid.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/tasks/surveyors/list',
      name: 'surveyors-list',
      component: () => import('../views/tasks/surveyors/SurveyorsList.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/tasks/surveyors',
      redirect: '/tasks/surveyors/grid',
    },
    {
      path: '/tasks/surveyors/new',
      name: 'new-surveyor',
      component: () => import('../views/tasks/surveyors/SurveyorsGrid.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/tasks/gas-connections/details',
      name: 'gas-connection-details',
      component: () => import('../views/tasks/GasConnectionDetails.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/customers',
      name: 'customers-dashboard',
      component: () => import('../views/customers/CustomersDashboard.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/customers/new',
      name: 'new-customer',
      component: () => import('../views/customers/NewCustomer.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/customers/list',
      name: 'customers-list',
      component: () => import('../views/customers/CustomersList.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/customers/grid',
      name: 'customers-grid',
      component: () => import('../views/customers/CustomersGrid.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
});

router.beforeEach((to, _from, next) => {
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
