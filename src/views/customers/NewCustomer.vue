<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import SidebarMenu from '@/components/tasks/SidebarMenu.vue';
  import CustomerFormDialog from '@/components/CustomerFormDialog.vue';
  import {
    HomeIcon,
    UserGroupIcon,
    ListBulletIcon,
    Squares2X2Icon,
    PlusIcon,
  } from '@heroicons/vue/24/outline';

  const router = useRouter();
  const showFormDialog = ref(false);

  const customersMenuItems = [
    { id: 'modules-dashboard', label: 'Moduły', icon: HomeIcon, route: '/', children: null },
    { id: 'customers-dashboard', label: 'Pulpit klientów', icon: UserGroupIcon, route: '/customers', children: null },
    { id: 'customers-new', label: 'Nowy klient', icon: PlusIcon, route: '/customers/new', children: null },
    { id: 'customers-list', label: 'Lista', icon: ListBulletIcon, route: '/customers/list', children: null },
    { id: 'customers-grid', label: 'Kafelki', icon: Squares2X2Icon, route: '/customers/grid', children: null },
  ];

  function onFormClose() {
    showFormDialog.value = false;
    router.push('/customers/list');
  }

  function onCustomerAdded() {
    showFormDialog.value = false;
    router.push('/customers/list');
  }

  onMounted(() => {
    showFormDialog.value = true;
  });
</script>

<template>
  <div class="flex h-screen bg-surface-0 dark:bg-surface-950 overflow-hidden">
    <SidebarMenu :menu-items="customersMenuItems" />

    <div class="flex-1 overflow-y-auto p-6">
      <div class="max-w-7xl mx-auto">
        <h1 class="text-3xl font-bold text-surface-700 dark:text-surface-300 mb-2">Nowy klient</h1>
        <p class="text-surface-600 dark:text-surface-400 text-sm mb-6">
          Wypełnij formularz w oknie dialogowym. Po zapisaniu zostaniesz przekierowany do listy klientów.
        </p>
      </div>
    </div>

    <CustomerFormDialog
      v-if="showFormDialog"
      @close="onFormClose"
      @customer-added="onCustomerAdded"
    />
  </div>
</template>
