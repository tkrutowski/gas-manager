<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import SidebarMenu from '@/components/SidebarMenu.vue';
  import CustomerTableSettingsDialog from '@/components/customers/CustomerTableSettingsDialog.vue';
  import CustomerFormDialog from '@/components/customers/CustomerFormDialog.vue';
  import CustomerInfoDialog from '@/components/customers/CustomerInfoDialog.vue';
  import CustomersToolbar from '@/components/customers/CustomersToolbar.vue';
  import DataTable from 'primevue/datatable';
  import type { DataTableSortEvent } from 'primevue/datatable';
  import Column from 'primevue/column';
  import Button from 'primevue/button';
  import ConfirmPopup from 'primevue/confirmpopup';
  import { useConfirm } from 'primevue/useconfirm';
  import { useCustomersStore } from '@/stores/customers';
  import { useSettingsStore } from '@/stores/settings';
  import { getCustomerName, formatAddress } from '@/utils/tableFormatters';
  import type { Customer } from '@/types/Customer';
  import type { CustomerTableFilter } from '@/types/Settings';
  import { HomeIcon, UserGroupIcon, ListBulletIcon, Squares2X2Icon, PlusIcon } from '@heroicons/vue/24/outline';

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

  const customers = ref<Customer[]>([]);
  const loading = ref(false);
  const selectedRow = ref<Customer | null>(null);
  const selectedFilter = ref<CustomerTableFilter>('all');
  const defaultSortField = ref<string | undefined>(undefined);
  const defaultSortOrder = ref<number | undefined>(undefined);
  const autoSaveSettings = ref(false);
  const showSettingsDialog = ref(false);
  const showFormDialog = ref(false);
  const showInfoDialog = ref(false);
  const formEditCustomer = ref<Customer | null>(null);
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
    const field = defaultSortField.value;
    const order = defaultSortOrder.value ?? 1;
    if (!field) return list;
    list = [...list].sort((a, b) => {
      const av = formatCellValue(a, field);
      const bv = formatCellValue(b, field);
      const cmp = av.localeCompare(bv, undefined, { numeric: true });
      return order === 1 ? cmp : -cmp;
    });
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

  const isSelectedFavorite = computed(() => {
    const row = selectedRow.value;
    return row ? settingsStore.favoriteCustomerIds.includes(row.id) : false;
  });

  function handleFilterClick(f: CustomerTableFilter) {
    selectedFilter.value = f;
    if (autoSaveSettings.value) {
      settingsStore.saveCustomerTableSettings(defaultSortField.value, defaultSortOrder.value, f);
    }
  }

  function handleNew() {
    formEditCustomer.value = null;
    showFormDialog.value = true;
  }

  function handleEdit() {
    if (!selectedRow.value) return;
    formEditCustomer.value = selectedRow.value;
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
        selectedRow.value = null;
      },
    });
  }

  function handleToggleFavorite() {
    if (!selectedRow.value) return;
    const id = selectedRow.value.id;
    if (isSelectedFavorite.value) settingsStore.removeFavoriteCustomer(id);
    else settingsStore.addFavoriteCustomer(id);
  }

  function handleOpenSettings() {
    showSettingsDialog.value = true;
  }

  function handleOpenInfo() {
    showInfoDialog.value = true;
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

  function onSort(event: DataTableSortEvent) {
    const field = typeof event.sortField === 'string' ? event.sortField : undefined;
    const order = event.sortOrder === 1 || event.sortOrder === -1 ? event.sortOrder : undefined;
    defaultSortField.value = field;
    defaultSortOrder.value = order;
    if (autoSaveSettings.value) {
      settingsStore.saveCustomerTableSettings(field, order, selectedFilter.value);
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

  function refreshCustomers() {
    customers.value = customersStore.getAllCustomers();
  }

  function onFormClose() {
    showFormDialog.value = false;
    formEditCustomer.value = null;
  }

  function onCustomerAdded() {
    refreshCustomers();
    onFormClose();
  }

  function onCustomerUpdated() {
    refreshCustomers();
    if (selectedRow.value && formEditCustomer.value && selectedRow.value.id === formEditCustomer.value.id) {
      const updated = customersStore.getCustomer(selectedRow.value.id);
      if (updated) selectedRow.value = updated;
    }
    onFormClose();
  }

  function clearFilter() {
    globalSearchQuery.value = '';
  }

  onMounted(() => {
    loading.value = true;
    refreshCustomers();
    loadConfig();
    loading.value = false;
  });
</script>

<template>
  <div class="flex h-screen bg-surface-0 dark:bg-surface-950 overflow-hidden">
    <ConfirmPopup />
    <SidebarMenu :menu-items="customersMenuItems" />

    <div class="flex-1 overflow-y-auto p-6">
      <div class="max-w-full mx-auto">
        <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold text-surface-700 dark:text-surface-300 mb-2">Lista klientów</h1>
            <p class="text-sm text-surface-600 dark:text-surface-400">Zarządzanie klientami</p>
          </div>
          <div class="hidden md:flex items-center gap-2">
            <router-link to="/customers/grid">
              <Button
                icon="pi pi-th-large"
                text
                severity="primary"
                title="Przełącz na widok kafelków"
              />
            </router-link>
          </div>
        </div>

        <div
          class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6"
        >
          <CustomersToolbar
            :selected-filter="selectedFilter"
            :selected-row="selectedRow"
            :is-selected-favorite="isSelectedFavorite"
            :global-search-query="globalSearchQuery"
            @filter-click="handleFilterClick"
            @new="handleNew"
            @edit="handleEdit"
            @delete="handleDelete"
            @info="handleOpenInfo"
            @toggle-favorite="handleToggleFavorite"
            @clear-filter="clearFilter"
            @open-settings="handleOpenSettings"
            @reset-config="handleResetConfig"
            @update:global-search-query="globalSearchQuery = $event"
          />

          <DataTable
            :value="filteredCustomers"
            :loading="loading"
            v-model:selection="selectedRow"
            selection-mode="single"
            data-key="id"
            striped-rows
            show-gridlines
            class="p-datatable-sm"
            scrollable
            scroll-height="calc(100vh - 320px)"
            sort-mode="single"
            :sort-field="defaultSortField"
            :sort-order="defaultSortOrder"
            @sort="onSort"
            :pt="{
              root: { class: 'bg-surface-0 dark:bg-surface-900' },
              header: {
                class: 'bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700',
              },
              thead: { class: '[&>tr>th]:text-center [&>tr>th]:align-middle' },
              tbody: { class: '[&>tr>td]:text-center [&>tr>td]:align-middle' },
            }"
          >
            <Column
              v-for="col in COLUMNS"
              :key="col.field"
              :field="col.field"
              :header="col.header"
              sortable
            >
              <template #body="{ data }">
                <template v-if="col.field === 'customerType'">
                  <span
                    class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="
                      data.customerType === 'person'
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200'
                        : 'bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-200'
                    "
                  >
                    {{ data.customerType === 'person' ? 'Osoba' : 'Firma' }}
                  </span>
                </template>
                <template v-else-if="col.field === 'status'">
                  <span
                    class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="
                      data.status
                        ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200'
                        : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200'
                    "
                  >
                    {{ data.status ? 'Aktywny' : 'Nieaktywny' }}
                  </span>
                </template>
                <template v-else>
                  {{ formatCellValue(data, col.field) }}
                </template>
              </template>
            </Column>
          </DataTable>
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
      :customer="formEditCustomer"
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
