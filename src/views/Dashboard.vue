<script setup lang="ts">
  import { computed, ref, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { useAuthStore } from '@/stores/auth';
  import { useCompanySettingsStore } from '@/stores/companySettings';
  import {
    ClipboardDocumentCheckIcon,
    CurrencyDollarIcon,
    UserGroupIcon,
    TruckIcon,
    Cog6ToothIcon,
    UserCircleIcon,
    ArrowRightOnRectangleIcon,
    MoonIcon,
    SunIcon,
    ListBulletIcon,
    Squares2X2Icon,
  } from '@heroicons/vue/24/outline';

  const router = useRouter();
  const authStore = useAuthStore();
  const companySettingsStore = useCompanySettingsStore();

  const userName = computed(() => authStore.getFirstName() || authStore.user?.name || 'Użytkowniku');
  const userRole = computed(() => authStore.user?.role || 'Użytkownik');

  const appName = computed(() => companySettingsStore.appInfo?.appName || 'GasManager Pro');
  const appVersion = computed(() => companySettingsStore.appInfo?.appVersion || '2.4.0');

  const modules = [
    {
      id: 'tasks',
      title: 'Zadania',
      description: 'Harmonogram prac, statusy realizacji przyłączy oraz delegowanie zadań zespołom.',
      icon: ClipboardDocumentCheckIcon,
      color: 'bg-blue-500',
      route: '/tasks',
    },
    {
      id: 'customers',
      title: 'Klienci',
      description: 'Zarządzanie klientami, adresami, umowami i fakturami.',
      icon: UserGroupIcon,
      color: 'bg-green-500',
      route: '/customers',
      listRoute: '/customers/list',
      gridRoute: '/customers/grid',
      listIcon: ListBulletIcon,
      gridIcon: Squares2X2Icon,
    },
    {
      id: 'finance',
      title: 'Finanse',
      description: 'Fakturowanie, kosztorysy, płatności i monitorowanie rentowności inwestycji.',
      icon: CurrencyDollarIcon,
      color: 'bg-green-500',
      route: '/finance',
    },
    {
      id: 'hr',
      title: 'Kadry i HR',
      description: 'Ewidencja pracowników, zarządzanie urlopami, szkolenia BHP i uprawnienia.',
      icon: UserGroupIcon,
      color: 'bg-purple-500',
      route: '/hr',
    },
    {
      id: 'fleet',
      title: 'Flota',
      description: 'Zarządzanie pojazdami służbowymi, serwis, ubezpieczenia i karty paliwowe.',
      icon: TruckIcon,
      color: 'bg-orange-500',
      route: '/fleet',
    },
    {
      id: 'settings',
      title: 'Ustawienia',
      description: 'Konfiguracja systemu, szablony dokumentów, powiadomienia i preferencje.',
      icon: Cog6ToothIcon,
      color: 'bg-gray-500',
      route: '/settings',
    },
    {
      id: 'admin',
      title: 'Panel Administracyjny',
      description: 'Zarządzanie użytkownikami, logi systemowe, kopie zapasowe i bezpieczeństwo.',
      icon: UserCircleIcon,
      color: 'bg-yellow-400',
      textColor: 'text-black',
      route: '/admin',
      isAdmin: true,
    },
  ];

  const handleLogout = () => {
    authStore.logout();
    router.push('/login');
  };

  const handleModuleClick = (route: string) => {
    router.push(route);
  };

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
</script>

<template>
  <div class="min-h-screen bg-surface-0 dark:bg-surface-950">
    <!-- Header -->
    <header class="bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 px-6 py-4">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <!-- Logo i wersja -->
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
            <span class="text-black font-bold text-lg">G</span>
          </div>
          <div>
            <h1 class="text-xl font-bold text-surface-700 dark:text-surface-300">{{ appName }}</h1>
            <p class="text-xs text-surface-600 dark:text-surface-400">Wersja {{ appVersion }}</p>
          </div>
        </div>

        <!-- Informacje o użytkowniku -->
        <div class="flex items-center gap-4">
          <div class="text-right">
            <p class="text-surface-700 dark:text-surface-300 font-medium">{{ authStore.user?.name || 'Użytkownik' }}</p>
            <p class="text-sm text-surface-600 dark:text-surface-400">{{ userRole }}</p>
          </div>
          <div
            class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center"
          >
            <span class="text-white font-semibold text-sm">
              {{ userName.charAt(0).toUpperCase() }}
            </span>
          </div>
          <button
            @click="toggleDarkMode"
            class="p-2 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-lg transition-colors"
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
          <button
            @click="handleLogout"
            class="p-2 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-lg transition-colors"
            title="Wyloguj się"
          >
            <ArrowRightOnRectangleIcon
              class="w-5 h-5 text-surface-600 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300"
            />
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-6 py-12">
      <!-- Powitanie -->
      <div class="text-center mb-12">
        <h2 class="text-4xl md:text-5xl font-bold text-surface-700 dark:text-surface-300 mb-4">
          Witaj, {{ userName }}
        </h2>
        <p class="text-lg text-surface-600 dark:text-surface-400">Wybierz moduł, którym chcesz dzisiaj zarządzać.</p>
      </div>

      <!-- Karty modułów -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <div
          v-for="module in modules"
          :key="module.id"
          class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6 hover:border-surface-300 dark:hover:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all text-left relative group"
        >
          <button
            type="button"
            class="absolute inset-0 rounded-xl text-left"
            aria-label="Otwórz moduł"
            @click="handleModuleClick(module.route)"
          />
          <!-- Badge ADMIN -->
          <span
            v-if="module.isAdmin"
            class="absolute top-4 right-4 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded"
          >
            ADMIN
          </span>

          <!-- Lista / Kafelki (Klienci) -->
          <div
            v-if="module.listRoute && module.gridRoute && module.listIcon && module.gridIcon"
            class="absolute top-4 right-4 flex gap-1 z-10"
          >
            <button
              type="button"
              class="p-1.5 rounded-lg bg-surface-200 dark:bg-surface-700 hover:bg-surface-300 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-300 transition-colors"
              title="Lista"
              @click.stop="handleModuleClick(module.listRoute)"
            >
              <component :is="module.listIcon" class="w-5 h-5" />
            </button>
            <button
              type="button"
              class="p-1.5 rounded-lg bg-surface-200 dark:bg-surface-700 hover:bg-surface-300 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-300 transition-colors"
              title="Kafelki"
              @click.stop="handleModuleClick(module.gridRoute)"
            >
              <component :is="module.gridIcon" class="w-5 h-5" />
            </button>
          </div>

          <!-- Ikona -->
          <div class="mb-4 relative">
            <div :class="[module.color, 'w-12 h-12 rounded-lg flex items-center justify-center']">
              <component :is="module.icon" :class="[module.textColor || 'text-white', 'w-6 h-6']" />
            </div>
          </div>

          <!-- Tytuł i opis -->
          <h3 class="text-xl font-bold text-surface-700 dark:text-surface-300 mb-2">{{ module.title }}</h3>
          <p class="text-surface-600 dark:text-surface-400 text-sm leading-relaxed">{{ module.description }}</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="text-center space-y-4">
        <!-- Copyright -->
        <p class="text-surface-500 dark:text-surface-500 text-sm">
          © 2026 {{ appName }}. System zarządzania instalacjami gazowymi.
        </p>
      </div>
    </main>
  </div>
</template>

<style scoped>
  /* Dodatkowe style jeśli potrzebne */
</style>
