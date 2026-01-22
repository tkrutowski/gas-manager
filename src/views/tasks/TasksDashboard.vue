<script setup lang="ts">
  import { computed } from 'vue';
  import SidebarMenu from '@/components/tasks/SidebarMenu.vue';
  import { useGasConnectionsStore } from '@/stores/gasConnections';
  import { Phase } from '@/types/GasConnection';
  import {
    MapIcon,
    WrenchScrewdriverIcon,
    CurrencyDollarIcon,
    ExclamationTriangleIcon,
  } from '@heroicons/vue/24/outline';

  const gasConnectionsStore = useGasConnectionsStore();

  // Etap Projektowania - Phase.PROJECT
  const designProjects = computed(() => {
    return gasConnectionsStore.byPhase[Phase.PROJECT];
  });

  const designActiveCount = computed(() => designProjects.value.length);

  const designProgress = computed(() => {
    if (designProjects.value.length === 0) return 0;
    // Liczymy projekty które mają zudpReceiptDate (otrzymały zgodę urzędu)
    const withApproval = designProjects.value.filter(gc => gc.gasConnectionDesign.zudpReceiptDate !== undefined).length;
    return Math.round((withApproval / designProjects.value.length) * 100);
  });

  const designAwaitingApproval = computed(() => {
    // Projekty które mają zudpSubmissionDate ale nie mają zudpReceiptDate
    return designProjects.value.filter(
      gc =>
        gc.gasConnectionDesign.zudpSubmissionDate !== undefined && gc.gasConnectionDesign.zudpReceiptDate === undefined
    ).length;
  });

  // Etap Wykonawstwa - Phase.WORK
  const executionProjects = computed(() => {
    return gasConnectionsStore.byPhase[Phase.WORK];
  });

  const executionActiveCount = computed(() => executionProjects.value.length);

  const executionProgress = computed(() => {
    if (executionProjects.value.length === 0) return 0;
    // Liczymy projekty które mają realizationEndDate (zakończone)
    const finished = executionProjects.value.filter(
      gc => gc.gasConnectionBuild.realizationEndDate !== undefined
    ).length;
    return Math.round((finished / executionProjects.value.length) * 100);
  });

  const delayedProjects = computed(() => {
    const now = new Date();
    return executionProjects.value.filter(gc => {
      if (!gc.finishDeadline) return false;
      const deadline = new Date(gc.finishDeadline);
      return deadline < now && !gc.gasConnectionBuild.realizationEndDate;
    });
  });

  const delayedProjectAddress = computed(() => {
    if (delayedProjects.value.length > 0 && delayedProjects.value[0].address) {
      return delayedProjects.value[0].address.street;
    }
    return '';
  });

  // Finanse i Faktury - Phase.FINANSE
  const financeProjects = computed(() => {
    return gasConnectionsStore.byPhase[Phase.FINANSE];
  });

  const pendingInvoices = computed(() => {
    // Liczymy wszystkie koszty które nie mają paymentDate lub są w przyszłości
    let count = 0;
    financeProjects.value.forEach(gc => {
      gc.gasConnectionFinance.costList.forEach(cost => {
        if (!cost.paymentDate) {
          count++;
        }
      });
    });
    return count;
  });

  const financeProgress = computed(() => {
    if (financeProjects.value.length === 0) return 0;
    let totalCosts = 0;
    let paidCosts = 0;
    financeProjects.value.forEach(gc => {
      gc.gasConnectionFinance.costList.forEach(cost => {
        totalCosts++;
        if (cost.paymentDate) {
          paidCosts++;
        }
      });
    });
    if (totalCosts === 0) return 0;
    return Math.round((paidCosts / totalCosts) * 100);
  });

  const overdueInvoices = computed(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    let count = 0;
    financeProjects.value.forEach(gc => {
      gc.gasConnectionFinance.costList.forEach(cost => {
        // Faktura jest przeterminowana jeśli nie ma paymentDate i minęło więcej niż 7 dni od daty projektu finansowego
        if (!cost.paymentDate && gc.gasConnectionFinance.financeProjectDate) {
          const projectDate = new Date(gc.gasConnectionFinance.financeProjectDate);
          if (projectDate < sevenDaysAgo) {
            count++;
          }
        }
      });
    });
    return count;
  });
</script>

<template>
  <div class="flex h-screen bg-surface-0 dark:bg-surface-950 overflow-hidden">
    <!-- Sidebar Menu -->
    <SidebarMenu />

    <!-- Main Content -->
    <div class="flex-1 overflow-y-auto p-6">
      <div class="max-w-7xl mx-auto">
        <h1 class="text-3xl font-bold text-surface-700 dark:text-surface-300 mb-6">Pulpit</h1>

        <!-- Dashboard Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Card 1: Etap Projektowania -->
          <div
            class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6 relative"
          >
            <!-- Badge -->
            <div
              class="absolute top-4 right-4 bg-green-900/50 dark:bg-green-900/50 text-green-400 text-xs font-medium px-2 py-1 rounded"
            >
              +2 od wczoraj
            </div>

            <!-- Icon -->
            <div class="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
              <MapIcon class="w-6 h-6 text-blue-400" />
            </div>

            <!-- Title -->
            <h3 class="text-surface-700 dark:text-surface-300 font-semibold text-lg mb-4">Etap Projektowania</h3>

            <!-- Main Metric -->
            <div class="mb-4">
              <span class="text-4xl font-bold text-surface-700 dark:text-surface-300">{{ designActiveCount }}</span>
              <span class="text-surface-600 dark:text-surface-400 ml-2">aktywnych</span>
            </div>

            <!-- Progress Bar -->
            <div class="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2 mb-4">
              <div
                class="bg-blue-500 h-2 rounded-full transition-all duration-300"
                :style="{ width: `${designProgress}%` }"
              ></div>
            </div>

            <!-- Additional Info -->
            <p class="text-surface-600 dark:text-surface-400 text-sm">
              {{ designAwaitingApproval }} oczekuje na zgodę urzędu
            </p>
          </div>

          <!-- Card 2: Etap Wykonawstwa -->
          <div
            class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6 relative"
          >
            <!-- Badge -->
            <div
              class="absolute top-4 right-4 bg-green-900/50 dark:bg-green-900/50 text-green-400 text-xs font-medium px-2 py-1 rounded"
            >
              Bez zmian
            </div>

            <!-- Icon -->
            <div class="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-4">
              <WrenchScrewdriverIcon class="w-6 h-6 text-yellow-400" />
            </div>

            <!-- Title -->
            <h3 class="text-surface-700 dark:text-surface-300 font-semibold text-lg mb-4">Etap Wykonawstwa</h3>

            <!-- Main Metric -->
            <div class="mb-4">
              <span class="text-4xl font-bold text-surface-700 dark:text-surface-300">{{ executionActiveCount }}</span>
              <span class="text-surface-600 dark:text-surface-400 ml-2">w toku</span>
            </div>

            <!-- Progress Bar -->
            <div class="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2 mb-4">
              <div
                class="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                :style="{ width: `${executionProgress}%` }"
              ></div>
            </div>

            <!-- Additional Info -->
            <div v-if="delayedProjects.length > 0" class="flex items-center gap-2 text-sm">
              <ExclamationTriangleIcon class="w-4 h-4 text-red-400 shrink-0" />
              <p class="text-red-400">
                1 projekt opóźniony{{ delayedProjectAddress ? ` (${delayedProjectAddress})` : '' }}
              </p>
            </div>
            <p v-else class="text-surface-600 dark:text-surface-400 text-sm">Wszystkie projekty w terminie</p>
          </div>

          <!-- Card 3: Finanse i Faktury -->
          <div
            class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6 relative"
          >
            <!-- Badge -->
            <div
              class="absolute top-4 right-4 bg-green-900/50 dark:bg-green-900/50 text-green-400 text-xs font-medium px-2 py-1 rounded"
            >
              +3 opłacone
            </div>

            <!-- Icon -->
            <div class="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
              <CurrencyDollarIcon class="w-6 h-6 text-green-400" />
            </div>

            <!-- Title -->
            <h3 class="text-surface-700 dark:text-surface-300 font-semibold text-lg mb-4">Finanse i Faktury</h3>

            <!-- Main Metric -->
            <div class="mb-4">
              <span class="text-4xl font-bold text-surface-700 dark:text-surface-300">{{ pendingInvoices }}</span>
              <span class="text-surface-600 dark:text-surface-400 ml-2">oczekujące</span>
            </div>

            <!-- Progress Bar -->
            <div class="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2 mb-4">
              <div
                class="bg-green-500 h-2 rounded-full transition-all duration-300"
                :style="{ width: `${financeProgress}%` }"
              ></div>
            </div>

            <!-- Additional Info -->
            <p class="text-surface-600 dark:text-surface-400 text-sm">
              {{ overdueInvoices }} faktury przeterminowane > 7 dni
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
