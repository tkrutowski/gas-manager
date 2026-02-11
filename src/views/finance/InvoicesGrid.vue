<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import SidebarMenu from '@/components/SidebarMenu.vue';
  import InvoicesToolbar from '@/components/invoices/InvoicesToolbar.vue';
  import InvoiceTableSettingsDialog from '@/components/invoices/InvoiceTableSettingsDialog.vue';
  import DataView from 'primevue/dataview';
  import Button from 'primevue/button';
  import ConfirmPopup from 'primevue/confirmpopup';
  import { useConfirm } from 'primevue/useconfirm';
  import { useInvoicesStore } from '@/stores/invoices';
  import { useSettingsStore } from '@/stores/settings';
  import { getCustomerName } from '@/utils/tableFormatters';
  import type { Invoice } from '@/types/Invoice';
  import type { InvoiceTableFilter } from '@/types/Settings';
  import { financeMenuItems } from '@/views/finance/financeMenu';
  import { UserGroupIcon, CalendarIcon } from '@heroicons/vue/24/outline';

  const router = useRouter();
  const invoicesStore = useInvoicesStore();
  const settingsStore = useSettingsStore();
  const confirm = useConfirm();

  const selectedFilter = ref<InvoiceTableFilter>('all');
  const selectedInvoiceId = ref<string | null>(null);
  const defaultSortField = ref<string | undefined>(undefined);
  const defaultSortOrder = ref<number | undefined>(undefined);
  const autoSaveSettings = ref(false);
  const showSettingsDialog = ref(false);
  const globalSearchQuery = ref('');
  const invoices = ref<Invoice[]>([]);

  const rowsWithId = computed(() =>
    invoices.value.map(inv => ({ ...inv, _id: `${inv.idInvoiceYear}-${inv.idInvoiceNumber}` }))
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
        return num.toLowerCase().includes(q) || customer.toLowerCase().includes(q);
      });
    }
    const field = defaultSortField.value;
    const order = defaultSortOrder.value ?? 1;
    if (field) {
      list = [...list].sort((a, b) => {
        const cmpNum = (x: number, y: number) => (order === 1 ? x - y : y - x);
        const cmpStr = (x: string, y: string) =>
          order === 1 ? x.localeCompare(y, undefined, { numeric: true }) : y.localeCompare(x, undefined, { numeric: true });
        if (field === 'number' || field === 'numberSort') {
          const an = a.idInvoiceYear * 100000 + a.idInvoiceNumber;
          const bn = b.idInvoiceYear * 100000 + b.idInvoiceNumber;
          return cmpNum(an, bn);
        }
        if (field === 'customer') return cmpStr(getCustomerName(a.customer), getCustomerName(b.customer));
        if (field === 'invoiceDate') {
          const ad = a.invoiceDate ? new Date(a.invoiceDate).getTime() : 0;
          const bd = b.invoiceDate ? new Date(b.invoiceDate).getTime() : 0;
          return cmpNum(ad, bd);
        }
        if (field === 'amountGross') return cmpNum(a.amountGross, b.amountGross);
        if (field === 'paid') return cmpNum(a.paid ? 1 : 0, b.paid ? 1 : 0);
        return 0;
      });
    }
    return list;
  });

  const selectedRow = computed(() => {
    if (!selectedInvoiceId.value) return null;
    return rowsWithId.value.find(i => i._id === selectedInvoiceId.value) || null;
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

  function getStatusLabel(status: InvoiceStatusType): string {
    return status === 'paid' ? 'ZAPŁACONA' : status === 'overdue' ? 'PRZETERMINOWANA' : 'OCZEKUJĄCA';
  }

  function getInitials(inv: Invoice): string {
    const name = getCustomerName(inv.customer);
    return name
      .split(/\s+/)
      .map(w => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '—';
  }

  function toggleSelection(inv: Invoice & { _id: string }) {
    if (selectedInvoiceId.value === inv._id) selectedInvoiceId.value = null;
    else selectedInvoiceId.value = inv._id;
  }

  function handleFilterChange(f: InvoiceTableFilter) {
    selectedFilter.value = f;
    if (autoSaveSettings.value) {
      settingsStore.saveInvoiceTableSettings(defaultSortField.value, defaultSortOrder.value, f);
    }
    if (selectedInvoiceId.value && !filteredInvoices.value.some(i => i._id === selectedInvoiceId.value)) {
      selectedInvoiceId.value = null;
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
        selectedInvoiceId.value = null;
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
    invoices.value = invoicesStore.getAllInvoices();
    loadConfig();
  });
</script>

<template>
  <div class="flex h-screen bg-surface-0 dark:bg-surface-950 overflow-hidden">
    <ConfirmPopup />
    <SidebarMenu :menu-items="financeMenuItems" />

    <div class="flex-1 overflow-hidden p-1 md:p-6">
      <div class="max-w-full mx-auto space-y-6">
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold text-surface-700 dark:text-surface-300">Faktury</h1>
            <p class="text-sm text-surface-600 dark:text-surface-400">Widok kafelków. Wybierz fakturę z listy.</p>
          </div>
          <div class="hidden md:flex items-center gap-2">
            <router-link to="/finance/invoices/list">
              <Button icon="pi pi-list" text severity="primary" title="Przełącz na widok listy" />
            </router-link>
          </div>
        </div>

        <div
          class="bg-surface-0 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-xl p-1 md:p-6"
        >
          <InvoicesToolbar
            :selected-filter="selectedFilter"
            :selected-row="selectedRow"
            :global-search-query="globalSearchQuery"
            @filter-click="handleFilterChange"
            @new="handleNew"
            @edit="handleEdit"
            @preview="handlePreview"
            @delete="handleDelete"
            @clear-filter="clearFilter"
            @open-settings="handleOpenSettings"
            @reset-config="handleResetConfig"
            @update:global-search-query="globalSearchQuery = $event"
          />

          <DataView :value="filteredInvoices" layout="grid" data-key="_id">
            <template #grid="slotProps">
              <div class="overflow-y-auto" style="max-height: calc(100vh - 320px)">
                <div class="grid gap-4" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))">
                  <button
                    v-for="inv in slotProps.items"
                    :key="inv._id"
                    type="button"
                    class="text-left rounded-xl border border-surface-200 dark:border-surface-700 transition-all duration-200 focus:outline-none"
                    :class="[
                      selectedInvoiceId === inv._id
                        ? 'ring-2 ring-primary-400/40 bg-surface-200 dark:bg-surface-700 border-primary-400'
                        : 'bg-surface-100 dark:bg-surface-800 hover:border-primary-400/60 hover:bg-surface-100 dark:hover:bg-surface-800',
                      getInvoiceStatus(inv) === 'paid' && 'border-l-8 border-l-green-500 dark:border-l-green-400',
                      getInvoiceStatus(inv) === 'pending' && 'border-l-8 border-l-yellow-500 dark:border-l-yellow-400',
                      getInvoiceStatus(inv) === 'overdue' && 'border-l-8 border-l-red-500 dark:border-l-red-400',
                    ]"
                    @click="toggleSelection(inv)"
                  >
                    <div class="p-4 flex flex-col h-full">
                      <div class="flex items-start justify-between mb-4">
                        <div
                          class="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                          :class="{
                            'bg-green-600 dark:bg-green-700': getInvoiceStatus(inv) === 'paid',
                            'bg-yellow-600 dark:bg-yellow-700': getInvoiceStatus(inv) === 'pending',
                            'bg-red-600 dark:bg-red-700': getInvoiceStatus(inv) === 'overdue',
                          }"
                        >
                          {{ getInitials(inv) }}
                        </div>
                        <div class="text-right">
                          <div
                            class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border"
                            :class="{
                              'bg-green-700 dark:bg-green-800 text-green-100 border-green-600 dark:border-green-700':
                                getInvoiceStatus(inv) === 'paid',
                              'bg-yellow-600 dark:bg-yellow-700 text-yellow-100 border-yellow-500 dark:border-yellow-600':
                                getInvoiceStatus(inv) === 'pending',
                              'bg-red-700 dark:bg-red-800 text-red-100 border-red-600 dark:border-red-700':
                                getInvoiceStatus(inv) === 'overdue',
                            }"
                          >
                            {{ getStatusLabel(getInvoiceStatus(inv)) }}
                          </div>
                          <div class="mt-1 text-[10px] text-surface-500 dark:text-surface-400">
                            #INV-{{ inv.idInvoiceYear }}-{{ String(inv.idInvoiceNumber).padStart(3, '0') }}
                          </div>
                        </div>
                      </div>

                      <div class="mb-3">
                        <div class="text-sm font-semibold text-surface-900 dark:text-surface-50 mb-1">
                          {{ getCustomerName(inv.customer) }}
                        </div>
                        <div class="text-xs text-surface-500 dark:text-surface-400">
                          #INV-{{ inv.idInvoiceYear }}-{{ String(inv.idInvoiceNumber).padStart(3, '0') }}
                        </div>
                      </div>

                      <div class="mb-3">
                        <div class="text-xs text-surface-600 dark:text-surface-400">Całkowita kwota</div>
                        <div class="text-lg font-bold text-surface-700 dark:text-surface-300">
                          {{ inv.amountGross.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} zł
                        </div>
                      </div>

                      <div
                        class="mt-auto pt-3 border-t border-surface-200 dark:border-surface-700 flex items-center gap-2 text-xs text-surface-500 dark:text-surface-400"
                      >
                        <UserGroupIcon class="w-4 h-4 shrink-0" />
                        <span>{{ inv.idTask != null ? 'Zadanie' : '—' }}</span>
                        <span class="ml-auto flex items-center gap-1">
                          <CalendarIcon class="w-4 h-4" />
                          {{ inv.paymentDate ? new Date(inv.paymentDate).toLocaleDateString('pl-PL') : (inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString('pl-PL') : '—') }}
                        </span>
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
