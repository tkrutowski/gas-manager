<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { EyeIcon, EyeSlashIcon, MoonIcon, SunIcon } from '@heroicons/vue/24/outline';
  import { useAuthStore } from '../stores/auth';
  import type { User } from '../types/User';

  const router = useRouter();
  const authStore = useAuthStore();

  const email = ref('');
  const password = ref('');
  const rememberMe = ref(false);
  const showPassword = ref(false);

  // Dark mode management
  const getInitialTheme = (): boolean => {
    const saved = localStorage.getItem('theme');
    if (saved === null) {
      return false;
    }
    return saved === 'dark';
  };

  const isDarkMode = ref<boolean>(getInitialTheme());

  const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value;
    updateTheme();
  };

  const updateTheme = () => {
    if (isDarkMode.value) {
      document.documentElement.classList.add('p-dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('p-dark');
      localStorage.setItem('theme', 'light');
    }
  };

  onMounted(() => {
    updateTheme();
  });

  const handleLogin = () => {
    // TODO: Implementacja prawdziwego logowania z API
    // Na razie symulujemy zalogowanie
    const mockUser: User = {
      id: 1,
      login: email.value,
      email: email.value,
      name:
        email.value
          .split('@')[0]
          .split('.')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ') || 'Użytkownik',
      firstName: email.value.split('@')[0].split('.')[0] || 'Użytkownik',
      lastName: email.value.split('@')[0].split('.')[1] || '',
      role: 'Administrator Systemu',
      isActive: true,
    };

    authStore.login(mockUser);
    router.push('/');
  };
</script>

<template>
  <div class="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center p-4">
    <div
      class="w-full max-w-6xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-2xl overflow-hidden shadow-2xl"
    >
      <div class="flex flex-col lg:flex-row min-h-[600px]">
        <!-- Lewa sekcja z tłem -->
        <div
          class="lg:w-1/2 relative bg-gradient-to-br from-surface-100 to-surface-200 dark:from-surface-800 dark:to-surface-900 p-8 lg:p-12 flex flex-col justify-between border-r border-surface-200 dark:border-surface-700"
        >
          <!-- Tło przemysłowe - placeholder dla obrazu -->
          <div class="absolute inset-0 opacity-20">
            <div
              class="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIj48cGF0aCBkPSJNMCAwaDQwdjQwSDB6IiBmaWxsPSIjNDA0MDQwIi8+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNjY2NjY2IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')]"
            ></div>
          </div>

          <!-- Logo i tekst -->
          <div class="relative z-10 mt-auto">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-10 h-10 bg-primary-400 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 01.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
                  />
                </svg>
              </div>
              <h1 class="text-2xl font-bold text-surface-700 dark:text-surface-300">GasFlow</h1>
            </div>
            <h2 class="text-3xl font-bold text-surface-700 dark:text-surface-300 mb-4">
              Zarządzaj infrastrukturą bezpiecznie.
            </h2>
            <p class="text-surface-600 dark:text-surface-400 text-lg">
              System dla profesjonalistów i projektantów instalacji gazowych.
            </p>
          </div>
        </div>

        <!-- Prawa sekcja z formularzem -->
        <div class="lg:w-1/2 bg-surface-50 dark:bg-surface-900 p-8 lg:p-12 flex flex-col justify-center relative">
          <!-- Przycisk przełączania trybu -->
          <button
            @click="toggleDarkMode"
            class="absolute top-4 right-4 p-2 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-lg transition-colors"
            title="Przełącz tryb jasny/ciemny"
          >
            <MoonIcon
              v-if="!isDarkMode"
              class="w-5 h-5 text-surface-600 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300"
            />
            <SunIcon
              v-else
              class="w-5 h-5 text-surface-600 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300"
            />
          </button>

          <div class="max-w-md mx-auto w-full">
            <h3 class="text-3xl font-bold text-surface-700 dark:text-surface-300 mb-2">Witaj ponownie</h3>
            <p class="text-surface-600 dark:text-surface-400 mb-8">Zaloguj się do swojego konta menadżera</p>

            <form @submit.prevent="handleLogin" class="space-y-6">
              <!-- Pole email -->
              <div>
                <label for="email" class="block text-surface-700 dark:text-surface-300 text-sm font-medium mb-2">
                  Adres e-mail
                </label>
                <input
                  id="email"
                  v-model="email"
                  type="email"
                  placeholder="wpisz.email@firma.pl"
                  class="w-full px-4 py-3 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-700 dark:text-surface-300 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
                />
              </div>

              <!-- Pole hasła -->
              <div>
                <label for="password" class="block text-surface-700 dark:text-surface-300 text-sm font-medium mb-2">
                  Hasło
                </label>
                <div class="relative">
                  <input
                    id="password"
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="••••••••"
                    class="w-full px-4 py-3 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-700 dark:text-surface-300 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all pr-12"
                  />
                  <button
                    type="button"
                    @click="showPassword = !showPassword"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300 transition-colors"
                  >
                    <EyeIcon v-if="!showPassword" class="w-5 h-5" />
                    <EyeSlashIcon v-else class="w-5 h-5" />
                  </button>
                </div>
              </div>

              <!-- Checkbox i link -->
              <div class="flex items-center justify-between">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    v-model="rememberMe"
                    type="checkbox"
                    class="w-4 h-4 rounded border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-primary-400 focus:ring-primary-400 focus:ring-2"
                  />
                  <span class="text-surface-600 dark:text-surface-400 text-sm">Zapamiętaj mnie</span>
                </label>
                <a href="#" class="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors">
                  Zapomniałeś hasła?
                </a>
              </div>

              <!-- Przycisk logowania -->
              <button
                type="submit"
                class="w-full bg-primary-400 hover:bg-primary-300 text-black font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
              >
                <span>Zaloguj się</span>
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </form>

            <!-- Tekst na dole -->
            <p class="text-surface-500 dark:text-surface-500 text-sm mt-8 text-center">
              Masz problem z logowaniem?
              <a href="#" class="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                Skontaktuj się z administratorem IT
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  /* Dodatkowe style jeśli potrzebne */
</style>
