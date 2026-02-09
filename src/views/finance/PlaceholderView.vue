<script setup lang="ts">
  import { computed } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import SidebarMenu from '@/components/SidebarMenu.vue';
  import { financeMenuItems } from '@/views/finance/financeMenu';
  import { ArrowLeftIcon } from '@heroicons/vue/24/outline';

  const route = useRoute();
  const router = useRouter();

  const title = computed(() => {
    if (route.path.startsWith('/finance/corrections')) return 'Korekty';
    if (route.path.startsWith('/finance/offers')) return 'Oferty';
    return 'Moduł';
  });

  function goToDashboard() {
    router.push('/finance');
  }
</script>

<template>
  <div class="flex h-screen bg-surface-0 dark:bg-surface-950 overflow-hidden">
    <SidebarMenu :menu-items="financeMenuItems" />

    <div class="flex-1 overflow-y-auto p-6">
      <div class="max-w-2xl mx-auto text-center">
        <h1 class="text-3xl font-bold text-surface-700 dark:text-surface-300 mb-4">{{ title }}</h1>
        <p class="text-surface-600 dark:text-surface-400 mb-8">Moduł w przygotowaniu.</p>
        <button
          type="button"
          @click="goToDashboard"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
        >
          <ArrowLeftIcon class="w-5 h-5" />
          <span>Powrót do pulpitu</span>
        </button>
      </div>
    </div>
  </div>
</template>
