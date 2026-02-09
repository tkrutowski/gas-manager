<script setup lang="ts">
  import { computed, ref, onMounted, onUnmounted } from 'vue';
  import { useRouter } from 'vue-router';
  import SidebarMenu from '@/components/SidebarMenu.vue';
  import { financeMenuItems } from '@/views/finance/financeMenu';
  import { useInvoicesStore } from '@/stores/invoices';
  import {
    ListBulletIcon,
    Squares2X2Icon,
    BanknotesIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
  } from '@heroicons/vue/24/outline';
  import { Chart } from 'chart.js/auto';
  import type { Chart as ChartType } from 'chart.js';

  const router = useRouter();
  const invoicesStore = useInvoicesStore();

  const chartCanvasRef = ref<HTMLCanvasElement | null>(null);
  let chartInstance: ChartType | null = null;

  const MONTH_LABELS = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];

  const totalReceivables = computed(() => {
    return invoicesStore.invoices.reduce((sum, i) => sum + i.amountGross, 0);
  });

  const paidThisMonth = computed(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    return invoicesStore.invoices
      .filter(i => i.paid && i.paymentDate)
      .filter(i => {
        const d = new Date(i.paymentDate!);
        return d.getFullYear() === y && d.getMonth() === m;
      })
      .reduce((sum, i) => sum + i.amountGross, 0);
  });

  const overdueAmount = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return invoicesStore.invoices
      .filter(i => !i.paid)
      .filter(i => {
        if (!i.invoiceDate) return false;
        const term = i.paymentDate ? new Date(i.paymentDate) : new Date(i.invoiceDate);
        term.setHours(0, 0, 0, 0);
        return term < today;
      })
      .reduce((sum, i) => sum + i.amountGross, 0);
  });

  const chartData = computed(() => {
    const years = [2022, 2023, 2024, 2025, 2026];
    const byYearMonth: Record<number, Record<number, number>> = {};
    years.forEach(y => {
      byYearMonth[y] = {};
      for (let m = 0; m < 12; m++) byYearMonth[y][m] = 0;
    });
    invoicesStore.invoices.forEach(inv => {
      const d = inv.invoiceDate ? new Date(inv.invoiceDate) : inv.sellDate ? new Date(inv.sellDate) : null;
      if (!d) return;
      const y = d.getFullYear();
      const m = d.getMonth();
      if (byYearMonth[y] != null) {
        byYearMonth[y][m] = (byYearMonth[y][m] || 0) + inv.amountGross;
      }
    });
    const yearTotals: Record<number, number> = {};
    const datasets = years.map((year, idx) => {
      const values = MONTH_LABELS.map((_, m) => byYearMonth[year]?.[m] ?? 0);
      const total = values.reduce((a, b) => a + b, 0);
      yearTotals[year] = total;
      const hue = 220 + idx * 60;
      return {
        label: `${year} (${total.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł)`,
        data: values,
        borderColor: `hsl(${hue}, 60%, 50%)`,
        backgroundColor: `hsla(${hue}, 60%, 50%, 0.1)`,
        tension: 0.2,
      };
    });
    return { labels: MONTH_LABELS, datasets };
  });

  function buildChart() {
    if (!chartCanvasRef.value) return;
    chartInstance?.destroy();
    const isDark = document.documentElement.classList.contains('p-dark');
    const textColor = isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    chartInstance = new Chart(chartCanvasRef.value, {
      type: 'line',
      data: {
        labels: chartData.value.labels,
        datasets: chartData.value.datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: textColor },
          },
          title: {
            display: true,
            text: 'Statystyki według lat',
            color: textColor,
          },
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: textColor },
          },
          y: {
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              callback(value) {
                return typeof value === 'number' ? `${Number(value).toLocaleString('pl-PL')} zł` : value;
              },
            },
          },
        },
      },
    });
  }

  onMounted(() => {
    buildChart();
  });

  onUnmounted(() => {
    chartInstance?.destroy();
    chartInstance = null;
  });

  const goToList = () => router.push('/finance/invoices/list');
  const goToGrid = () => router.push('/finance/invoices/grid');
</script>

<template>
  <div class="flex h-screen bg-surface-0 dark:bg-surface-950 overflow-hidden">
    <SidebarMenu :menu-items="financeMenuItems" />

    <div class="flex-1 overflow-y-auto p-6">
      <div class="max-w-7xl mx-auto">
        <h1 class="text-3xl font-bold text-surface-700 dark:text-surface-300 mb-6">Finanse</h1>

        <div class="flex flex-wrap gap-4 mb-8">
          <button
            type="button"
            @click="goToList"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            <ListBulletIcon class="w-5 h-5" />
            <span>Lista</span>
          </button>
          <button
            type="button"
            @click="goToGrid"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            <Squares2X2Icon class="w-5 h-5" />
            <span>Kafelki</span>
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div
            class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6"
          >
            <div class="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center mb-4">
              <BanknotesIcon class="w-6 h-6 text-primary-500" />
            </div>
            <h3 class="text-surface-700 dark:text-surface-300 font-semibold text-lg mb-2">Należności ogółem</h3>
            <p class="text-2xl font-bold text-surface-700 dark:text-surface-300">
              {{ totalReceivables.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} PLN
            </p>
          </div>

          <div
            class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6"
          >
            <div class="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
              <CheckCircleIcon class="w-6 h-6 text-green-500" />
            </div>
            <h3 class="text-surface-700 dark:text-surface-300 font-semibold text-lg mb-2">Zapłacone w tym miesiącu</h3>
            <p class="text-2xl font-bold text-surface-700 dark:text-surface-300">
              {{ paidThisMonth.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} PLN
            </p>
          </div>

          <div
            class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6"
          >
            <div class="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-4">
              <ExclamationTriangleIcon class="w-6 h-6 text-red-500" />
            </div>
            <h3 class="text-surface-700 dark:text-surface-300 font-semibold text-lg mb-2">Zaległe płatności</h3>
            <p
              class="text-2xl font-bold"
              :class="overdueAmount > 0 ? 'text-red-600 dark:text-red-400' : 'text-surface-700 dark:text-surface-300'"
            >
              {{ overdueAmount.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} PLN
            </p>
          </div>
        </div>

        <div
          class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6"
        >
          <div class="h-[360px]">
            <canvas ref="chartCanvasRef"></canvas>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
