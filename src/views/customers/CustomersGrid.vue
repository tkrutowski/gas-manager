<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import SidebarMenu from '@/components/tasks/SidebarMenu.vue';
  import CustomerFormDialog from '@/components/CustomerFormDialog.vue';
  import CustomerInfoDialog from '@/components/customers/CustomerInfoDialog.vue';
  import CustomerTableSettingsDialog from '@/components/customers/CustomerTableSettingsDialog.vue';
  import CustomersToolbar from '@/components/customers/CustomersToolbar.vue';
  import DataView from 'primevue/dataview';
  import Button from 'primevue/button';
  import ConfirmPopup from 'primevue/confirmpopup';
  import { useConfirm } from 'primevue/useconfirm';
  import type { CustomerTableFilter } from '@/types/Settings';
  import { useCustomersStore } from '@/stores/customers';
  import { useSettingsStore } from '@/stores/settings';
  import { getCustomerName, formatAddress } from '@/utils/tableFormatters';
  import type { Customer } from '@/types/Customer';
  import {
    MapPinIcon,
    PhoneIcon,
    EnvelopeIcon,
    PlusIcon,
    HomeIcon,
    UserGroupIcon,
    ListBulletIcon,
    Squares2X2Icon,
  } from '@heroicons/vue/24/outline';

  const router = useRouter();
  const customersStore = useCustomersStore();
  const settingsStore = useSettingsStore();
  const confirm = useConfirm();

  const customersMenuItems = [
    { id: 'modules-dashboard', label: 'Moduły', icon: HomeIcon, route: '/', children: null },
    { id: 'customers-dashboard', label: 'Pulpit klientów', icon: UserGroupIcon, route: '/customers', children: null },
    { id: 'customers-new', label: 'Nowy klient', icon: PlusIcon, route: '/customers/new', children: null },
    { id: 'customers-list', label: 'Lista', icon: ListBulletIcon, route: '/customers/list', children: null },
    { id: 'customers-grid', label: 'Kafelki', icon: Squares2X2Icon, route: '/customers/grid', children: null },
  ];

  const selectedFilter = ref<CustomerTableFilter>('all');
  const selectedCustomerId = ref<number | null>(null);
  const defaultSortField = ref<string | undefined>(undefined);
  const defaultSortOrder = ref<number | undefined>(undefined);
  const autoSaveSettings = ref(false);
  const showSettingsDialog = ref(false);
  const showFormDialog = ref(false);
  const showInfoDialog = ref(false);
  const customerForEdit = ref<Customer | null>(null);
  const customers = ref<Customer[]>([]);
  const globalSearchQuery = ref('');

  const COLUMNS = [
    { field: 'name', header: 'Nazwa', sortable: true },
    { field: 'address', header: 'Adres', sortable: true },
    { field: 'customerType', header: 'Typ', sortable: true },
    { field: 'email', header: 'Email', sortable: true },
    { field: 'phone', header: 'Telefon', sortable: true },
    { field: 'nip', header: 'NIP', sortable: true },
    { field: 'regon', header: 'REGON', sortable: true },
    { field: 'status', header: 'Status', sortable: true },
    { field: 'info', header: 'Info', sortable: true },
  ] as const;

  const filteredCustomers = computed(() => {
    let list = [...customers.value];
    switch (selectedFilter.value) {
      case 'active':
        list = list.filter((c) => c.status);
        break;
      case 'inactive':
        list = list.filter((c) => !c.status);
        break;
      case 'favorites':
        list = list.filter((c) => settingsStore.favoriteCustomerIds.includes(c.id));
        break;
      default:
        break;
    }
    const q = globalSearchQuery.value.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => {
        return COLUMNS.some((col) =>
          formatCellValue(c, col.field).toLowerCase().includes(q)
        );
      });
    }
    return list;
  });

  function formatCellValue(row: Customer, field: string): string {
    switch (field) {
      case 'name':
        return getCustomerName(row);
      case 'address':
        return formatAddress(row.address);
      case 'customerType':
        return row.customerType === 'person' ? 'Osoba' : 'Firma';
      case 'email':
        return row.email ?? '';
      case 'phone':
        return row.phone ?? '';
      case 'nip':
        return row.nip ?? '';
      case 'regon':
        return row.regon ?? '';
      case 'status':
        return row.status ? 'Tak' : 'Nie';
      case 'info':
        return row.info ?? '';
      default:
        return '';
    }
  }

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
    if (autoSaveSettings.value) {
      settingsStore.saveCustomerTableSettings(defaultSortField.value, defaultSortOrder.value, filter);
    }
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
    const row = selectedRow.value;
    return row ? settingsStore.favoriteCustomerIds.includes(row.id) : false;
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

  function handleEdit() {
    if (!selectedRow.value) return;
    customerForEdit.value = selectedRow.value;
    showFormDialog.value = true;
  }

  function handleDelete(event: Event) {
    if (!selectedRow.value) return;
    const c = selectedRow.value;
    const name = getCustomerName(c);
    confirm.require({
      target: event.currentTarget as HTMLElement,
      message: `Czy na pewno chcesz usunąć klienta "${name}"?`,
      icon: 'pi pi-exclamation-triangle',
      rejectProps: { label: 'Anuluj', severity: 'secondary', outlined: true },
      acceptProps: { label: 'Usuń', severity: 'danger' },
      accept: () => {
        customersStore.deleteCustomer(c.id, true);
        customers.value = customersStore.getAllCustomers();
        selectedCustomerId.value = null;
      },
    });
  }

  function handleOpenInfo() {
    showInfoDialog.value = true;
  }

  function handleOpenSettings() {
    showSettingsDialog.value = true;
  }

  function handleSettingsSaved(
    sortField?: string,
    sortOrder?: number,
    filter?: CustomerTableFilter,
    autoSave?: boolean
  ) {
    defaultSortField.value = sortField;
    defaultSortOrder.value = sortOrder ?? undefined;
    if (filter != null) {
      selectedFilter.value = filter;
    }
    if (autoSave !== undefined) {
      autoSaveSettings.value = autoSave;
    }
  }

  function handleResetConfig(event: Event) {
    confirm.require({
      target: event.currentTarget as HTMLElement,
      message:
        'Czy na pewno chcesz zresetować konfigurację (sortowanie, filtr, ulubieni)?',
      icon: 'pi pi-exclamation-triangle',
      rejectProps: { label: 'Anuluj', severity: 'secondary', outlined: true },
      acceptProps: { label: 'Resetuj', severity: 'warning' },
      accept: () => {
        settingsStore.resetCustomerTableSettings();
        defaultSortField.value = undefined;
        defaultSortOrder.value = undefined;
        selectedFilter.value = 'all';
        autoSaveSettings.value = false;
      },
    });
  }

  function handleToggleFavorite() {
    if (!selectedRow.value) return;
    const id = selectedRow.value.id;
    if (isSelectedFavorite.value) settingsStore.removeFavoriteCustomer(id);
    else settingsStore.addFavoriteCustomer(id);
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

  function clearFilter() {
    globalSearchQuery.value = '';
  }

  function loadConfig() {
    const cfg = settingsStore.getCustomerTableSettings;
    if (cfg) {
      defaultSortField.value = cfg.defaultSortField;
      defaultSortOrder.value = cfg.defaultSortOrder ?? undefined;
      selectedFilter.value = (cfg.defaultFilter as CustomerTableFilter) ?? 'all';
      autoSaveSettings.value = cfg.autoSaveSettings ?? false;
    } else {
      defaultSortField.value = undefined;
      defaultSortOrder.value = undefined;
      selectedFilter.value = 'all';
      autoSaveSettings.value = false;
    }
  }

  onMounted(() => {
    customers.value = customersStore.getAllCustomers();
    loadConfig();
  });
</script>

<template>
  <div class="flex h-screen bg-surface-0 dark:bg-surface-950 overflow-hidden">
    <ConfirmPopup />
    <SidebarMenu :menu-items="customersMenuItems" />

    <div class="flex-1 overflow-hidden p-6">
      <div class="max-w-full mx-auto space-y-6">
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold text-surface-700 dark:text-surface-300">Klienci</h1>
            <p class="text-sm text-surface-600 dark:text-surface-400">
              Wybierz klienta z listy. Lista i kafelki.
            </p>
          </div>
          <div class="flex items-center gap-2">
            <router-link to="/customers/list">
              <Button
                icon="pi pi-list"
                text
                severity="primary"
                title="Przełącz na widok listy"
              />
            </router-link>
          </div>
        </div>

        <div
          class="bg-surface-0 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-xl p-6"
        >
          <CustomersToolbar
            :selected-filter="selectedFilter"
            :selected-row="selectedRow"
            :is-selected-favorite="isSelectedFavorite"
            :global-search-query="globalSearchQuery"
            :show-search="true"
            :show-settings="true"
            @filter-click="handleFilterChange"
            @new="openDialogNew"
            @edit="handleEdit"
            @delete="handleDelete"
            @info="handleOpenInfo"
            @toggle-favorite="handleToggleFavorite"
            @clear-filter="clearFilter"
            @open-settings="handleOpenSettings"
            @reset-config="handleResetConfig"
            @update:global-search-query="globalSearchQuery = $event"
          />

          <DataView :value="filteredCustomers" layout="grid" :data-key="'id'">
            <template #grid="slotProps">
              <div class="overflow-y-auto" style="max-height: calc(100vh - 320px);">
                <div class="grid gap-4" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
                <button
                  v-for="c in slotProps.items"
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
                      class="mt-auto pt-3 border-t border-surface-200 dark:border-surface-700 flex items-center justify-end gap-1.5"
                    >
                      <button
                        type="button"
                        class="w-8 h-8 inline-flex items-center justify-center rounded-lg text-xs font-medium transition-colors"
                        :class="[
                          c.phone
                            ? 'bg-green-700 text-white hover:bg-green-600 cursor-pointer'
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
                            ? 'bg-sky-700 text-white hover:bg-sky-600 cursor-pointer'
                            : 'bg-surface-200 dark:bg-surface-800 text-surface-400 cursor-not-allowed',
                        ]"
                        :disabled="!c.email"
                        @click.stop="handleEmail(c)"
                      >
                        <EnvelopeIcon class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </button>
              </div>
              </div>
            </template>
          </DataView>
        </div>
      </div>
    </div>

    <CustomerTableSettingsDialog
      :visible="showSettingsDialog"
      :default-sort-field="defaultSortField"
      :default-sort-order="defaultSortOrder"
      :default-filter="selectedFilter"
      :auto-save-settings="autoSaveSettings"
      @update:visible="showSettingsDialog = $event"
      @saved="handleSettingsSaved"
      @close="showSettingsDialog = false"
    />

    <CustomerFormDialog
      v-if="showFormDialog"
      :customer="customerForEdit"
      @close="onFormClose"
      @customer-added="onCustomerAdded"
      @customer-updated="onCustomerUpdated"
    />

    <CustomerInfoDialog
      :visible="showInfoDialog"
      :customer="selectedRow"
      @update:visible="showInfoDialog = $event"
      @close="showInfoDialog = false"
    />
  </div>
</template>
