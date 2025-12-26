import { ref } from 'vue';
import { defineStore } from 'pinia';
import type { User } from '../types/User';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const isAuthenticated = ref(false);

  function login(userData: User) {
    user.value = userData;
    isAuthenticated.value = true;
  }

  function logout() {
    user.value = null;
    isAuthenticated.value = false;
  }

  function getFirstName(): string {
    if (!user.value) return '';
    return user.value.firstName || user.value.name.split(' ')[0] || '';
  }

  return {
    user,
    isAuthenticated,
    login,
    logout,
    getFirstName,
  };
});
