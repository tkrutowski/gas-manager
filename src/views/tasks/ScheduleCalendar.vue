<script setup lang="ts">
  import SidebarMenu from '@/components/SidebarMenu.vue';
  import { CalendarIcon } from '@heroicons/vue/24/outline';
</script>

<template>
  <div class="flex h-screen bg-surface-0 dark:bg-surface-950 overflow-hidden">
    <!-- Sidebar Menu -->
    <SidebarMenu />

    <!-- Main Content -->
    <div class="flex-1 overflow-y-auto p-6">
      <div class="max-w-7xl mx-auto">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-12 h-12 bg-primary-400/20 rounded-lg flex items-center justify-center">
            <CalendarIcon class="w-6 h-6 text-primary-400" />
          </div>
          <h1 class="text-3xl font-bold text-surface-700 dark:text-surface-300">Terminarz</h1>
        </div>

        <!-- Placeholder dla przyszłego komponentu kalendarza -->
        <div
          class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-12 text-center"
        >
          <CalendarIcon class="w-16 h-16 text-surface-400 dark:text-surface-600 mx-auto mb-4" />
          <h2 class="text-xl font-semibold text-surface-700 dark:text-surface-300 mb-2">Kalendarz zadań brygad</h2>
          <p class="text-surface-600 dark:text-surface-400">
            Komponent kalendarza zostanie tutaj dodany w przyszłości.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
