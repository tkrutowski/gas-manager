<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import SidebarMenu from '@/components/tasks/SidebarMenu.vue';
  import CustomerFormDialog from '@/components/CustomerFormDialog.vue';
  import CustomersToolbar from '@/components/customers/CustomersToolbar.vue';
  import type { CustomerTableFilter } from '@/types/Settings';
  import { useCustomersStore } from '@/stores/customers';
  import { getCustomerName, formatAddress } from '@/utils/tableFormatters';
  import type { Customer } from '@/types/Customer';
  import {
    MapPinIcon,
    PhoneIcon,
    EnvelopeIcon,
    PencilIcon,
    PlusIcon,
    HomeIcon,
    UserGroupIcon,
    ListBulletIcon,
    Squares2X2Icon,
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

  const selectedFilter = ref<CustomerTableFilter>('all');
  const selectedCustomerId = ref<number | null>(null);
  const showFormDialog = ref(false);
  const customerForEdit = ref<Customer | null>(null);
  const customers = ref<Customer[]>([]);

  const filteredCustomers = computed(() => {
    const base =
      selectedFilter.value === 'active'
        ? customersStore.getAllCustomers({ status: true })
        : customersStore.getAllCustomers();
    return base;
  });

  function getInitials(c: Customer): string {
    if (c.customerType === 'person') {
      const first = c.firstName?.[0] ?? '';
      const last = c.lastName?.[0] ?? '';
      return `${first}${last}`.toUpperCase();
    }
    const name = c.companyName ?? '';
    return name.slice(0, 2).toUpperCase();
  }

  function handleFilterChange(filter: CustomerTableFilter) {
    selectedFilter.value = filter;
    if (
      selectedCustomerId.value != null &&
      !filteredCustomers.value.some((c) => c.id === selectedCustomerId.value)
    ) {
      selectedCustomerId.value = null;
    }
  }

  const selectedRow = computed(() => {
    if (selectedCustomerId.value == null) return null;
    return customers.value.find((c) => c.id === selectedCustomerId.value) || null;
  });

  const isSelectedFavorite = computed(() => {
    // TODO: Implement favorite logic if needed
    return false;
  });

  function toggleCustomerSelection(id: number) {
    if (selectedCustomerId.value === id) selectedCustomerId.value = null;
    else selectedCustomerId.value = id;
  }

  function handleCall(c: Customer) {
    if (!c.phone) return;
    window.location.href = `tel:${c.phone.replace(/\s+/g, '')}`;
  }

  function handleEmail(c: Customer) {
    if (!c.email) return;
    window.location.href = `mailto:${c.email}`;
  }

  function openDialogNew() {
    customerForEdit.value = null;
    showFormDialog.value = true;
  }

  function openDialogEdit(c: Customer) {
    customerForEdit.value = c;
    showFormDialog.value = true;
  }

  function onFormClose() {
    showFormDialog.value = false;
    customerForEdit.value = null;
  }

  function onCustomerAdded() {
    customers.value = customersStore.getAllCustomers();
    onFormClose();
  }

  function onCustomerUpdated() {
    customers.value = customersStore.getAllCustomers();
    onFormClose();
  }

  onMounted(() => {
    customers.value = customersStore.getAllCustomers();
  });
</script>

<template>
  <div class="flex h-screen bg-surface-0 dark:bg-surface-950 overflow-hidden">
    <SidebarMenu :menu-items="customersMenuItems" />

    <div class="flex-1 overflow-y-auto p-6">
      <div class="max-w-7xl mx-auto space-y-6">
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold text-surface-700 dark:text-surface-300">Klienci</h1>
            <p class="text-sm text-surface-600 dark:text-surface-400">
              Wybierz klienta z listy. Lista i kafelki.
            </p>
          </div>

          <div class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
            <CustomersToolbar
              :selected-filter="selectedFilter"
              :selected-row="selectedRow"
              :is-selected-favorite="isSelectedFavorite"
              :show-search="false"
              :show-settings="false"
              :show-view-toggle="true"
              @filter-click="handleFilterChange"
              @new="openDialogNew"
              @edit="() => selectedRow && openDialogEdit(selectedRow)"
              @delete="() => {}"
              @info="() => {}"
              @toggle-favorite="() => {}"
              @view-toggle="() => router.push('/customers/list')"
            />
          </div>
        </div>

        <div class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-4">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-surface-700 dark:text-surface-300">Karty klientów</h2>
            <p class="text-xs text-surface-500 dark:text-surface-400">Kliknij kartę, aby zaznaczyć klienta.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <button
              v-for="c in filteredCustomers"
              :key="c.id"
              type="button"
              class="text-left rounded-2xl border transition-all duration-200 focus:outline-none"
              :class="[
                selectedCustomerId === c.id
                  ? 'border-primary-400 ring-2 ring-primary-400/40 bg-surface-200 dark:bg-surface-700'
                  : 'border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 hover:border-primary-400/60 hover:bg-surface-100 dark:hover:bg-surface-800',
              ]"
              @click="toggleCustomerSelection(c.id)"
            >
              <div class="p-4 flex flex-col h-full">
                <div class="flex items-start justify-between mb-4">
                  <div
                    class="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                    :class="c.status ? 'bg-green-600' : 'bg-red-600'"
                  >
                    {{ getInitials(c) }}
                  </div>
                  <div class="text-right">
                    <div
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide"
                      :class="
                        c.status
                          ? 'bg-green-900/60 text-green-400 border border-green-700/60'
                          : 'bg-red-800/20 text-red-400 border border-red-700/60'
                      "
                    >
                      {{ c.status ? 'AKTYWNY' : 'NIEAKTYWNY' }}
                    </div>
                    <div class="mt-1 text-[10px] text-surface-500 dark:text-surface-400">
                      {{ c.customerType === 'person' ? 'Osoba' : 'Firma' }}
                    </div>
                  </div>
                </div>

                <div class="mb-3">
                  <div class="text-sm font-semibold text-surface-900 dark:text-surface-50 mb-1">
                    {{ getCustomerName(c) }}
                  </div>
                  <div class="flex items-center gap-1 text-xs text-surface-500 dark:text-surface-400">
                    <MapPinIcon class="w-3.5 h-3.5" />
                    <span>{{ formatAddress(c.address) || '—' }}</span>
                  </div>
                </div>

                <div class="space-y-1.5 text-xs text-surface-500 dark:text-surface-400 mb-4">
                  <div class="flex items-center gap-2">
                    <PhoneIcon class="w-4 h-4" />
                    <span class="truncate">{{ c.phone || 'Brak telefonu' }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <EnvelopeIcon class="w-4 h-4" />
                    <span class="truncate">{{ c.email || 'Brak email' }}</span>
                  </div>
                </div>

                <div
                  class="mt-auto pt-3 border-t border-surface-200 dark:border-surface-700 flex items-center justify-between gap-2"
                >
                  <button
                    type="button"
                    class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-400 text-black hover:bg-primary-500 transition-colors"
                    @click.stop="openDialogEdit(c)"
                  >
                    <PencilIcon class="w-4 h-4" />
                    <span>Edytuj</span>
                  </button>
                  <div class="flex items-center gap-1.5">
                    <button
                      type="button"
                      class="w-8 h-8 inline-flex items-center justify-center rounded-lg text-xs font-medium transition-colors"
                      :class="[
                        c.phone
                          ? 'bg-green-700 text-white hover:bg-green-600'
                          : 'bg-surface-200 dark:bg-surface-800 text-surface-400 cursor-not-allowed',
                      ]"
                      :disabled="!c.phone"
                      @click.stop="handleCall(c)"
                    >
                      <PhoneIcon class="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      class="w-8 h-8 inline-flex items-center justify-center rounded-lg text-xs font-medium transition-colors"
                      :class="[
                        c.email
                          ? 'bg-sky-700 text-white hover:bg-sky-600'
                          : 'bg-surface-200 dark:bg-surface-800 text-surface-400 cursor-not-allowed',
                      ]"
                      :disabled="!c.email"
                      @click.stop="handleEmail(c)"
                    >
                      <EnvelopeIcon class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <CustomerFormDialog
      v-if="showFormDialog"
      :customer="customerForEdit"
      @close="onFormClose"
      @customer-added="onCustomerAdded"
      @customer-updated="onCustomerUpdated"
    />
  </div>
</template>
