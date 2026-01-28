<script setup lang="ts">
  import { computed } from 'vue';
  import { useRouter } from 'vue-router';
  import SidebarMenu from '@/components/SidebarMenu.vue';
  import { useCustomersStore } from '@/stores/customers';
  import {
    UserGroupIcon,
    UserIcon,
    BuildingOffice2Icon,
    CalendarDaysIcon,
    PhoneXMarkIcon,
    ListBulletIcon,
    Squares2X2Icon,
    HomeIcon,
    PlusIcon,
  } from '@heroicons/vue/24/outline';

  const router = useRouter();
  const customersStore = useCustomersStore();

  const customersMenuItems = [
    { id: 'modules-dashboard', label: 'Moduły', icon: HomeIcon, route: '/', children: null },
    { id: 'customers-dashboard', label: 'Pulpit klientów', icon: UserGroupIcon, route: '/customers', children: null },
    { id: 'customers-new', label: 'Nowy klient', icon: PlusIcon, route: '/customers/new', children: null },
    { id: 'customers-list', label: 'Lista', icon: ListBulletIcon, route: '/customers/list', children: null },
    { id: 'customers-grid', label: 'Kafelki', icon: Squares2X2Icon, route: '/customers/grid', children: null },
  ];

  const totalCount = computed(() => customersStore.totalCount);
  const activeCount = computed(() => customersStore.activeCustomers.length);
  const personCount = computed(() => customersStore.personCustomers.length);
  const companyCount = computed(() => customersStore.companyCustomers.length);

  const newLast30Days = computed(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return customersStore.customers.filter(c => {
      const created = c.createdAt ? new Date(c.createdAt) : null;
      return created && created >= cutoff;
    }).length;
  });

  const noContactCount = computed(() => {
    return customersStore.customers.filter(c => !c.phones?.length && !c.emails?.length).length;
  });

  const goToList = () => router.push('/customers/list');
  const goToGrid = () => router.push('/customers/grid');
</script>

<template>
  <div class="flex h-screen bg-surface-0 dark:bg-surface-950 overflow-hidden">
    <SidebarMenu :menu-items="customersMenuItems" />

    <div class="flex-1 overflow-y-auto p-6">
      <div class="max-w-7xl mx-auto">
        <h1 class="text-3xl font-bold text-surface-700 dark:text-surface-300 mb-6">Klienci</h1>

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

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6"
          >
            <div class="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
              <UserGroupIcon class="w-6 h-6 text-green-500" />
            </div>
            <h3 class="text-surface-700 dark:text-surface-300 font-semibold text-lg mb-2">Całkowita liczba klientów</h3>
            <p class="text-4xl font-bold text-surface-700 dark:text-surface-300">{{ totalCount }}</p>
          </div>

          <div
            class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6"
          >
            <div class="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4">
              <UserIcon class="w-6 h-6 text-emerald-500" />
            </div>
            <h3 class="text-surface-700 dark:text-surface-300 font-semibold text-lg mb-2">Aktywni klienci</h3>
            <p class="text-4xl font-bold text-surface-700 dark:text-surface-300">{{ activeCount }}</p>
          </div>

          <div
            class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6"
          >
            <div class="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
              <UserIcon class="w-6 h-6 text-blue-500" />
            </div>
            <h3 class="text-surface-700 dark:text-surface-300 font-semibold text-lg mb-2">Osoby fizyczne</h3>
            <p class="text-4xl font-bold text-surface-700 dark:text-surface-300">{{ personCount }}</p>
          </div>

          <div
            class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6"
          >
            <div class="w-12 h-12 bg-violet-500/20 rounded-lg flex items-center justify-center mb-4">
              <BuildingOffice2Icon class="w-6 h-6 text-violet-500" />
            </div>
            <h3 class="text-surface-700 dark:text-surface-300 font-semibold text-lg mb-2">Firmy</h3>
            <p class="text-4xl font-bold text-surface-700 dark:text-surface-300">{{ companyCount }}</p>
          </div>

          <div
            class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6"
          >
            <div class="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center mb-4">
              <CalendarDaysIcon class="w-6 h-6 text-amber-500" />
            </div>
            <h3 class="text-surface-700 dark:text-surface-300 font-semibold text-lg mb-2">Nowi (ostatnie 30 dni)</h3>
            <p class="text-4xl font-bold text-surface-700 dark:text-surface-300">{{ newLast30Days }}</p>
          </div>

          <div
            class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6"
          >
            <div class="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-4">
              <PhoneXMarkIcon class="w-6 h-6 text-red-500" />
            </div>
            <h3 class="text-surface-700 dark:text-surface-300 font-semibold text-lg mb-2">Bez kontaktu</h3>
            <p class="text-4xl font-bold text-surface-700 dark:text-surface-300">{{ noContactCount }}</p>
          </div>
        </div>

        <p
          class="mt-10 text-center text-xl md:text-2xl font-medium text-surface-600 dark:text-surface-400 max-w-3xl mx-auto leading-relaxed"
        >
          To są przykładowe kafelki. Niektóre zostaną usunięte, pojawią się również nowe.
        </p>
      </div>
    </div>
  </div>
</template>
