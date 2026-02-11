<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import SidebarMenu from '@/components/SidebarMenu.vue';
  import InvoicesToolbar from '@/components/invoices/InvoicesToolbar.vue';
  import InvoiceTableSettingsDialog from '@/components/invoices/InvoiceTableSettingsDialog.vue';
  import DataTable from 'primevue/datatable';
  import Column from 'primevue/column';
  import Button from 'primevue/button';
  import ConfirmPopup from 'primevue/confirmpopup';
  import { useConfirm } from 'primevue/useconfirm';
  import { useInvoicesStore } from '@/stores/invoices';
  import { useSettingsStore } from '@/stores/settings';
  import { getCustomerName } from '@/utils/tableFormatters';
  import type { Invoice } from '@/types/Invoice';
  import type { InvoiceTableFilter } from '@/types/Settings';
  import type { DataTableSortEvent } from 'primevue/datatable';
  import { financeMenuItems } from '@/views/finance/financeMenu';
  import { BanknotesIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline';

  const router = useRouter();
  const invoicesStore = useInvoicesStore();
  const settingsStore = useSettingsStore();
  const confirm = useConfirm();

  const invoices = ref<Invoice[]>([]);
  const loading = ref(false);
  const selectedRow = ref<Invoice & { _id?: string } | null>(null);
  const selectedFilter = ref<InvoiceTableFilter>('all');
  const defaultSortField = ref<string | undefined>(undefined);
  const defaultSortOrder = ref<number | undefined>(undefined);
  const autoSaveSettings = ref(false);
  const showSettingsDialog = ref(false);
  const globalSearchQuery = ref('');

  const COLUMNS = [
    { field: 'number', header: 'Nr faktury', sortable: true },
    { field: 'customer', header: 'Nabywca', sortable: true },
    { field: 'invoiceDate', header: 'Data wystawienia', sortable: true },
    { field: 'paymentDate', header: 'Termin płatności', sortable: true },
    { field: 'amountGross', header: 'Kwota brutto', sortable: true },
    { field: 'paid', header: 'Status', sortable: true },
  ] as const;

  const rowsWithId = computed(() =>
    invoices.value.map(inv => ({
      ...inv,
      _id: `${inv.idInvoiceYear}-${inv.idInvoiceNumber}`,
      numberSort: inv.idInvoiceYear * 100000 + inv.idInvoiceNumber,
    }))
  );

  const filteredInvoices = computed(() => {
    let list = [...rowsWithId.value];
    switch (selectedFilter.value) {
      case 'paid':
        list = list.filter(i => i.paid);
        break;
      case 'unpaid':
        list = list.filter(i => !i.paid);
        break;
      default:
        break;
    }
    const q = globalSearchQuery.value.trim().toLowerCase();
    if (q) {
      list = list.filter(i => {
        const num = `#INV-${i.idInvoiceYear}-${String(i.idInvoiceNumber).padStart(3, '0')}`;
        const customer = getCustomerName(i.customer);
        const date = i.invoiceDate ? new Date(i.invoiceDate).toLocaleDateString('pl-PL') : '';
        const amount = i.amountGross.toFixed(2);
        const status = i.paid ? 'Zapłacona' : 'Niezapłacona';
        return [num, customer, date, amount, status].some(s => s.toLowerCase().includes(q));
      });
    }
    const field = defaultSortField.value;
    const order = defaultSortOrder.value ?? 1;
    if (!field) return list;
    list = [...list].sort((a, b) => {
      let av: string | number;
      let bv: string | number;
      switch (field) {
        case 'number':
        case 'numberSort':
          return order === 1
            ? (a as any).numberSort - (b as any).numberSort
            : (b as any).numberSort - (a as any).numberSort;
        case 'customer':
          av = getCustomerName(a.customer);
          bv = getCustomerName(b.customer);
          break;
        case 'invoiceDate':
          av = a.invoiceDate ? new Date(a.invoiceDate).getTime() : 0;
          bv = b.invoiceDate ? new Date(b.invoiceDate).getTime() : 0;
          return order === 1 ? av - bv : bv - av;
        case 'paymentDate': {
          const ad = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
          const bd = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;
          return order === 1 ? ad - bd : bd - ad;
        }
        case 'amountGross':
          return order === 1 ? a.amountGross - b.amountGross : b.amountGross - a.amountGross;
        case 'paid':
          av = a.paid ? 1 : 0;
          bv = b.paid ? 1 : 0;
          return order === 1 ? av - bv : bv - av;
        default:
          return 0;
      }
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return order === 1 ? cmp : -cmp;
    });
    return list;
  });

  type InvoiceStatusType = 'paid' | 'pending' | 'overdue';

  function getInvoiceStatus(inv: Invoice): InvoiceStatusType {
    if (inv.paid) return 'paid';
    const term = inv.paymentDate ? new Date(inv.paymentDate) : inv.invoiceDate ? new Date(inv.invoiceDate) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (term) {
      term.setHours(0, 0, 0, 0);
      if (term < today) return 'overdue';
    }
    return 'pending';
  }

  function formatCellValue(row: Invoice & { _id?: string }, field: string): string {
    switch (field) {
      case 'number':
        return `#INV-${row.idInvoiceYear}-${String(row.idInvoiceNumber).padStart(3, '0')}`;
      case 'customer':
        return getCustomerName(row.customer);
      case 'invoiceDate':
        return row.invoiceDate ? new Date(row.invoiceDate).toLocaleDateString('pl-PL') : '—';
      case 'paymentDate':
        return row.paymentDate ? new Date(row.paymentDate).toLocaleDateString('pl-PL') : '—';
      case 'amountGross':
        return row.amountGross.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' zł';
      case 'paid': {
        const status = getInvoiceStatus(row);
        return status === 'paid' ? 'Zapłacona' : status === 'overdue' ? 'Przeterminowana' : 'Oczekująca';
      }
      default:
        return '';
    }
  }

  const totalReceivables = computed(() =>
    invoices.value.reduce((sum, i) => sum + i.amountGross, 0)
  );

  const paidThisMonth = computed(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    return invoices.value
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
    return invoices.value
      .filter(i => !i.paid)
      .filter(i => {
        const term = i.paymentDate ? new Date(i.paymentDate) : i.invoiceDate ? new Date(i.invoiceDate) : null;
        if (!term) return false;
        term.setHours(0, 0, 0, 0);
        return term < today;
      })
      .reduce((sum, i) => sum + i.amountGross, 0);
  });

  function handleFilterClick(f: InvoiceTableFilter) {
    selectedFilter.value = f;
    if (autoSaveSettings.value) {
      settingsStore.saveInvoiceTableSettings(defaultSortField.value, defaultSortOrder.value, f);
    }
  }

  function handleNew() {
    router.push('/finance/invoices/new');
  }

  function handleEdit() {
    if (!selectedRow.value) return;
    router.push(
      `/finance/invoices/edit/${selectedRow.value.idInvoiceNumber}/${selectedRow.value.idInvoiceYear}`
    );
  }

  function handlePreview() {
    if (!selectedRow.value) return;
    router.push(
      `/finance/invoices/preview/${selectedRow.value.idInvoiceNumber}/${selectedRow.value.idInvoiceYear}`
    );
  }

  function handleDelete(event: Event) {
    if (!selectedRow.value) return;
    const inv = selectedRow.value;
    const num = `#INV-${inv.idInvoiceYear}-${String(inv.idInvoiceNumber).padStart(3, '0')}`;
    confirm.require({
      target: event.currentTarget as HTMLElement,
      message: `Czy na pewno chcesz usunąć fakturę ${num}?`,
      icon: 'pi pi-exclamation-triangle',
      rejectProps: { label: 'Anuluj', severity: 'secondary', outlined: true },
      acceptProps: { label: 'Usuń', severity: 'danger' },
      accept: () => {
        invoicesStore.deleteInvoice(inv.idInvoiceNumber, inv.idInvoiceYear);
        invoices.value = invoicesStore.getAllInvoices();
        selectedRow.value = null;
      },
    });
  }

  function handleOpenSettings() {
    showSettingsDialog.value = true;
  }

  function handleSettingsSaved(
    sortField?: string,
    sortOrder?: number,
    filter?: InvoiceTableFilter,
    autoSave?: boolean
  ) {
    defaultSortField.value = sortField;
    defaultSortOrder.value = sortOrder ?? undefined;
    if (filter != null) selectedFilter.value = filter;
    if (autoSave !== undefined) autoSaveSettings.value = autoSave;
  }

  function onSort(event: DataTableSortEvent) {
    const field = typeof event.sortField === 'string' ? event.sortField : undefined;
    const order = event.sortOrder === 1 || event.sortOrder === -1 ? event.sortOrder : undefined;
    defaultSortField.value = field;
    defaultSortOrder.value = order;
    if (autoSaveSettings.value) {
      settingsStore.saveInvoiceTableSettings(field, order, selectedFilter.value);
    }
  }

  function handleResetConfig(event: Event) {
    confirm.require({
      target: event.currentTarget as HTMLElement,
      message: 'Czy na pewno chcesz zresetować konfigurację (sortowanie, filtr)?',
      icon: 'pi pi-exclamation-triangle',
      rejectProps: { label: 'Anuluj', severity: 'secondary', outlined: true },
      acceptProps: { label: 'Resetuj', severity: 'warning' },
      accept: () => {
        settingsStore.resetInvoiceTableSettings();
        defaultSortField.value = undefined;
        defaultSortOrder.value = undefined;
        selectedFilter.value = 'all';
        autoSaveSettings.value = false;
      },
    });
  }

  function clearFilter() {
    globalSearchQuery.value = '';
  }

  function loadConfig() {
    const cfg = settingsStore.getInvoiceTableSettings;
    if (cfg) {
      defaultSortField.value = cfg.defaultSortField ?? undefined;
      defaultSortOrder.value = cfg.defaultSortOrder ?? undefined;
      selectedFilter.value = (cfg.defaultFilter as InvoiceTableFilter) ?? 'all';
      autoSaveSettings.value = cfg.autoSaveSettings ?? false;
    } else {
      defaultSortField.value = undefined;
      defaultSortOrder.value = undefined;
      selectedFilter.value = 'all';
      autoSaveSettings.value = false;
    }
  }

  onMounted(() => {
    loading.value = true;
    invoices.value = invoicesStore.getAllInvoices();
    loadConfig();
    loading.value = false;
  });
</script>

<template>
  <div class="flex h-screen bg-surface-0 dark:bg-surface-950 overflow-hidden">
    <ConfirmPopup />
    <SidebarMenu :menu-items="financeMenuItems" />

    <div class="flex-1 overflow-y-auto p-1 md:p-6">
      <div class="max-w-full mx-auto">
        <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold text-surface-700 dark:text-surface-300 mb-2">Lista faktur</h1>
            <p class="text-sm text-surface-600 dark:text-surface-400">Zarządzanie fakturami VAT</p>
          </div>
          <div class="hidden md:flex items-center gap-2">
            <router-link to="/finance/invoices/grid">
              <Button icon="pi pi-th-large" text severity="primary" title="Przełącz na widok kafelków" />
            </router-link>
          </div>
        </div>

        <!-- Info tiles -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div
            class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-5"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-surface-600 dark:text-surface-400 uppercase tracking-wide">Należności ogółem</p>
                <p class="text-xl font-bold text-surface-700 dark:text-surface-300 mt-1">
                  {{ totalReceivables.toLocaleString('pl-PL', { minimumFractionDigits: 2 }) }} PLN
                </p>
              </div>
              <div class="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                <BanknotesIcon class="w-5 h-5 text-primary-500" />
              </div>
            </div>
          </div>
          <div
            class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-5"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-surface-600 dark:text-surface-400 uppercase tracking-wide">Zapłacone w tym miesiącu</p>
                <p class="text-xl font-bold text-surface-700 dark:text-surface-300 mt-1">
                  {{ paidThisMonth.toLocaleString('pl-PL', { minimumFractionDigits: 2 }) }} PLN
                </p>
              </div>
              <div class="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircleIcon class="w-5 h-5 text-green-500" />
              </div>
            </div>
          </div>
          <div
            class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-5"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-surface-600 dark:text-surface-400 uppercase tracking-wide">Zaległe płatności</p>
                <p
                  class="text-xl font-bold mt-1"
                  :class="overdueAmount > 0 ? 'text-red-600 dark:text-red-400' : 'text-surface-700 dark:text-surface-300'"
                >
                  {{ overdueAmount.toLocaleString('pl-PL', { minimumFractionDigits: 2 }) }} PLN
                </p>
                <span
                  v-if="overdueAmount > 0"
                  class="inline-flex mt-1 px-2 py-0.5 rounded text-xs font-semibold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                >
                  WYMAGA UWAGI
                </span>
              </div>
              <div class="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <ExclamationTriangleIcon class="w-5 h-5 text-red-500" />
              </div>
            </div>
          </div>
        </div>

        <div
          class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-1 md:p-6"
        >
          <InvoicesToolbar
            :selected-filter="selectedFilter"
            :selected-row="selectedRow"
            :global-search-query="globalSearchQuery"
          @filter-click="handleFilterClick"
          @new="handleNew"
          @edit="handleEdit"
          @preview="handlePreview"
          @delete="handleDelete"
            @clear-filter="clearFilter"
            @open-settings="handleOpenSettings"
            @reset-config="handleResetConfig"
            @update:global-search-query="globalSearchQuery = $event"
          />

          <DataTable
            :value="filteredInvoices"
            :loading="loading"
            v-model:selection="selectedRow"
            selection-mode="single"
            data-key="_id"
            striped-rows
            show-gridlines
            class="p-datatable-sm"
            scrollable
            scroll-height="calc(100vh - 420px)"
            sort-mode="single"
            :sort-field="defaultSortField === 'number' ? 'numberSort' : defaultSortField"
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
            <Column v-for="col in COLUMNS" :key="col.field" :field="col.field" :header="col.header" sortable>
              <template #body="{ data }">
                <template v-if="col.field === 'paid'">
                  <span
                    class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide border"
                    :class="{
                      'bg-green-700 dark:bg-green-800 text-green-100 border-green-600 dark:border-green-700':
                        getInvoiceStatus(data) === 'paid',
                      'bg-yellow-600 dark:bg-yellow-700 text-yellow-100 border-yellow-500 dark:border-yellow-600':
                        getInvoiceStatus(data) === 'pending',
                      'bg-red-700 dark:bg-red-800 text-red-100 border-red-600 dark:border-red-700':
                        getInvoiceStatus(data) === 'overdue',
                    }"
                  >
                    {{
                      getInvoiceStatus(data) === 'paid'
                        ? 'ZAPŁACONA'
                        : getInvoiceStatus(data) === 'overdue'
                          ? 'PRZETERMINOWANA'
                          : 'OCZEKUJĄCA'
                    }}
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

    <InvoiceTableSettingsDialog
      :visible="showSettingsDialog"
      :default-sort-field="defaultSortField"
      :default-sort-order="defaultSortOrder"
      :default-filter="selectedFilter"
      :auto-save-settings="autoSaveSettings"
      @update:visible="showSettingsDialog = $event"
      @saved="handleSettingsSaved"
      @close="showSettingsDialog = false"
    />
  </div>
</template>

<style scoped>
  .grid-view-button :deep(.p-button-icon) {
    font-size: 1.5rem;
  }
</style>
