<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import {
  ClipboardDocumentCheckIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  TruckIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()

const userName = computed(() => authStore.getFirstName() || authStore.user?.name || 'Użytkowniku')
const userRole = computed(() => authStore.user?.role || 'Użytkownik')

const modules = [
  {
    id: 'tasks',
    title: 'Zadania i Projekty',
    description: 'Harmonogram prac, statusy realizacji przyłączy oraz delegowanie zadań zespołom.',
    icon: ClipboardDocumentCheckIcon,
    color: 'bg-blue-500',
    route: '/tasks',
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
]

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

const handleModuleClick = (route: string) => {
  // TODO: Implementacja nawigacji do modułu
  console.log('Nawigacja do:', route)
}
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0a] text-white">
    <!-- Header -->
    <header class="bg-[#1a1a1a] border-b border-[#2a2a2a] px-6 py-4">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <!-- Logo i wersja -->
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
            <span class="text-black font-bold text-lg">G</span>
          </div>
          <div>
            <h1 class="text-xl font-bold text-white">GasManager</h1>
            <p class="text-xs text-white/60">Wersja Pro v2.4</p>
          </div>
        </div>

        <!-- Informacje o użytkowniku -->
        <div class="flex items-center gap-4">
          <div class="text-right">
            <p class="text-white font-medium">{{ authStore.user?.name || 'Użytkownik' }}</p>
            <p class="text-sm text-white/60">{{ userRole }}</p>
          </div>
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
            <span class="text-white font-semibold text-sm">
              {{ userName.charAt(0).toUpperCase() }}
            </span>
          </div>
          <button
            @click="handleLogout"
            class="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors"
            title="Wyloguj się"
          >
            <ArrowRightOnRectangleIcon class="w-5 h-5 text-white/70 hover:text-white" />
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-6 py-12">
      <!-- Powitanie -->
      <div class="text-center mb-12">
        <h2 class="text-4xl md:text-5xl font-bold text-white mb-4">
          Witaj, {{ userName }}
        </h2>
        <p class="text-lg text-white/70">
          Wybierz moduł, którym chcesz dzisiaj zarządzać.
        </p>
      </div>

      <!-- Karty modułów -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <button
          v-for="module in modules"
          :key="module.id"
          @click="handleModuleClick(module.route)"
          class="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 hover:border-[#3a3a3a] hover:bg-[#1f1f1f] transition-all text-left relative group"
        >
          <!-- Badge ADMIN -->
          <span
            v-if="module.isAdmin"
            class="absolute top-4 right-4 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded"
          >
            ADMIN
          </span>

          <!-- Ikona -->
          <div class="mb-4">
            <div :class="[module.color, 'w-12 h-12 rounded-lg flex items-center justify-center']">
              <component :is="module.icon" :class="[module.textColor || 'text-white', 'w-6 h-6']" />
            </div>
          </div>

          <!-- Tytuł i opis -->
          <h3 class="text-xl font-bold text-white mb-2">{{ module.title }}</h3>
          <p class="text-white/60 text-sm leading-relaxed">{{ module.description }}</p>
        </button>
      </div>

      <!-- Footer -->
      <div class="text-center space-y-4">
        <!-- Link do pomocy -->
        <div>
          <a
            href="#"
            class="inline-flex items-center gap-2 text-white/60 hover:text-yellow-400 transition-colors text-sm"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Potrzebujesz pomocy? Przejdź do centrum wsparcia
          </a>
        </div>

        <!-- Copyright -->
        <p class="text-white/40 text-sm">
          © 2024 GasManager Pro. System zarządzania instalacjami gazowymi.
        </p>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Dodatkowe style jeśli potrzebne */
</style>

