<script setup lang="ts">
  import { ref, computed, watch } from 'vue';
  import { useRouter } from 'vue-router';
  import SidebarMenu from '@/components/SidebarMenu.vue';
  import AutoComplete from 'primevue/autocomplete';
  import Select from 'primevue/select';
  import DatePicker from 'primevue/datepicker';
  import InputText from 'primevue/inputtext';
  import InputNumber from 'primevue/inputnumber';
  import Button from 'primevue/button';
  import { financeMenuItems } from '@/views/finance/financeMenu';
  import { useCustomersStore } from '@/stores/customers';
  import { useInvoicesStore, PAYMENT_METHODS, VAT_RATES, TASK_TYPES } from '@/stores/invoices';
  import { getCustomerName, formatAddress } from '@/utils/tableFormatters';
  import type { Customer } from '@/types/Customer';
  import type { PaymentMethod, Vat, InvoiceItem } from '@/types/Invoice';
  import type { TaskType } from '@/types/TaskType';
  import {
    DocumentTextIcon,
    UserCircleIcon,
    CalendarDaysIcon,
    ShoppingCartIcon,
  } from '@heroicons/vue/24/outline';

  const router = useRouter();
  const customersStore = useCustomersStore();
  const invoicesStore = useInvoicesStore();

  const invoiceYear = ref(new Date().getFullYear());
  const invoiceMonth = ref(new Date().getMonth() + 1);
  const selectedCustomer = ref<Customer | null>(null);
  const customerSuggestions = ref<Customer[]>([]);
  const paymentMethod = ref<PaymentMethod | null>(PAYMENT_METHODS[0] ?? null);
  const invoiceDate = ref<Date>(new Date());
  const paymentDueDate = ref<Date | null>(null);
  const contractNo = ref('');

  interface DraftItem {
    name: string;
    pkwiu: string;
    unit: string;
    quantity: number;
    priceNet: number;
    vat: Vat;
  }

  const UNITS = [
    { label: 'szt.', value: 'szt.' },
    { label: 'usł.', value: 'usł.' },
    { label: 'm', value: 'm' },
    { label: 'm²', value: 'm²' },
    { label: 'kg', value: 'kg' },
  ];

  const draftItems = ref<DraftItem[]>([]);
  const newItem = ref<DraftItem>({
    name: '',
    pkwiu: '43.22.20.0',
    unit: 'szt.',
    quantity: 1,
    priceNet: 0,
    vat: VAT_RATES[0],
  });

  watch(
    paymentMethod,
    (method) => {
      if (method && invoiceDate.value) {
        const d = new Date(invoiceDate.value);
        if (method.id === 1) d.setDate(d.getDate() + 14);
        else if (method.id === 2) d.setDate(d.getDate() + 30);
        paymentDueDate.value = d;
      }
    },
    { immediate: true }
  );

  watch(invoiceDate, d => {
    if (d && paymentMethod.value) {
      const next = new Date(d);
      if (paymentMethod.value.id === 1) next.setDate(next.getDate() + 14);
      else if (paymentMethod.value.id === 2) next.setDate(next.getDate() + 30);
      else next.setDate(next.getDate());
      paymentDueDate.value = next;
    }
  });

  function searchCustomers(event: { query: string }) {
    const q = event.query;
    if (!q.trim()) {
      customerSuggestions.value = customersStore.getAllCustomers({ status: true }).slice(0, 50);
    } else {
      customerSuggestions.value = customersStore.searchCustomers(q).filter(c => c.status).slice(0, 50);
    }
  }

  function getCustomerLabel(c: Customer) {
    const name = getCustomerName(c);
    const nip = c.nip ? ` / NIP ${c.nip}` : '';
    return `${name}${nip}`;
  }

  const sumNet = computed(() =>
    draftItems.value.reduce(
      (acc, it) => acc + Math.round(it.priceNet * it.quantity * 100) / 100,
      0
    )
  );
  const sumVat = computed(() =>
    draftItems.value.reduce(
      (acc, it) =>
        acc + Math.round(it.priceNet * it.quantity * it.vat.multiplier * 100) / 100,
      0
    )
  );
  const sumGross = computed(() =>
    Math.round((sumNet.value + sumVat.value) * 100) / 100
  );

  function addDraftItem() {
    const item = newItem.value;
    if (!item.name.trim()) return;
    draftItems.value.push({
      name: item.name,
      pkwiu: item.pkwiu,
      unit: item.unit,
      quantity: item.quantity,
      priceNet: item.priceNet,
      vat: item.vat,
    });
    newItem.value = {
      name: '',
      pkwiu: '43.22.20.0',
      unit: 'szt.',
      quantity: 1,
      priceNet: 0,
      vat: VAT_RATES[0],
    };
  }

  function removeDraftItem(index: number) {
    draftItems.value.splice(index, 1);
  }

  function getItemAmounts(item: DraftItem) {
    const net = Math.round(item.priceNet * item.quantity * 100) / 100;
    const vat = Math.round(net * item.vat.multiplier * 100) / 100;
    const gross = Math.round((net + vat) * 100) / 100;
    return { net, vat, gross };
  }

  function cancel() {
    router.push('/finance/invoices/list');
  }

  function submit() {
    if (!selectedCustomer.value || !paymentMethod.value || draftItems.value.length === 0) return;
    const taskType: TaskType = TASK_TYPES[0];
    const items: InvoiceItem[] = draftItems.value.map((it, idx) => {
      const { net, vat, gross } = getItemAmounts(it);
      return {
        idInvoiceItem: idx + 1,
        idInvoiceNumber: 0,
        idInvoiceYear: 0,
        name: it.name,
        pkwiu: it.pkwiu,
        unit: it.unit,
        quantity: it.quantity,
        priceNet: it.priceNet,
        amountNet: net,
        amountVat: vat,
        amountGross: gross,
        vat: it.vat,
      };
    });
    const totalNet = sumNet.value;
    const totalVat = sumVat.value;
    const totalGross = sumGross.value;
    const invDate = invoiceDate.value instanceof Date ? invoiceDate.value : new Date(invoiceDate.value);
    const dueDate = paymentDueDate.value
      ? paymentDueDate.value instanceof Date
        ? paymentDueDate.value
        : new Date(paymentDueDate.value)
      : undefined;

    invoicesStore.addInvoice({
      customer: selectedCustomer.value,
      paymentMethod: paymentMethod.value,
      sellDate: invDate,
      paymentDate: dueDate,
      amountNet: totalNet,
      amountVat: totalVat,
      amountGross: totalGross,
      paid: false,
      contractNo: contractNo.value || undefined,
      invoiceDate: invDate,
      taskType,
      invoiceItems: items,
    });
    router.push('/finance/invoices/list');
  }

  const paymentMethodOptions = computed(() =>
    PAYMENT_METHODS.map(p => ({ label: p.name, value: p }))
  );
  const vatOptions = computed(() => VAT_RATES.map(v => ({ label: v.rate, value: v })));
  const unitOptions = computed(() => UNITS);
</script>

<template>
  <div class="flex h-screen bg-surface-0 dark:bg-surface-950 overflow-hidden">
    <SidebarMenu :menu-items="financeMenuItems" />

    <div class="flex-1 overflow-y-auto p-6">
      <div class="max-w-7xl mx-auto space-y-6">
        <!-- Header -->
        <div
          class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6"
        >
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <DocumentTextIcon class="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h1 class="text-2xl font-bold text-surface-700 dark:text-surface-300">Nowa Faktura VAT</h1>
              <p class="text-sm text-surface-600 dark:text-surface-400">System Zarządzania Infrastrukturą Gazową</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-surface-700 dark:text-surface-300">NR FAKTURY:</span>
            <InputNumber v-model="invoiceYear" :min="2020" :max="2030" class="w-20" />
            <span class="text-surface-500">/</span>
            <InputNumber v-model="invoiceMonth" :min="1" :max="12" class="w-16" />
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Left column -->
          <div class="space-y-6">
            <!-- Nabywca -->
            <div
              class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6"
            >
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold text-surface-700 dark:text-surface-300 flex items-center gap-2">
                  <UserCircleIcon class="w-5 h-5 text-primary-500" />
                  Nabywca
                </h2>
                <Button label="Nowy klient" icon="pi pi-plus" size="small" outlined @click="() => {}" />
              </div>
              <AutoComplete
                v-model="selectedCustomer"
                :suggestions="customerSuggestions"
                @complete="searchCustomers"
                placeholder="Szukaj klienta (Nazwa / NIP)"
                class="w-full"
                dropdown
                force-selection
                :option-label="getCustomerLabel"
              >
                <template #option="{ option }">
                  <div>{{ getCustomerLabel(option) }}</div>
                </template>
              </AutoComplete>
              <div
                v-if="selectedCustomer"
                class="mt-4 p-4 rounded-lg bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 text-sm space-y-1"
              >
                <p class="font-medium">{{ getCustomerName(selectedCustomer) }}</p>
                <p class="text-surface-600 dark:text-surface-400">{{ formatAddress(selectedCustomer.address) }}</p>
                <p v-if="selectedCustomer.nip" class="text-surface-600 dark:text-surface-400">NIP: {{ selectedCustomer.nip }}</p>
              </div>
            </div>

            <!-- Płatność i Daty -->
            <div
              class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6"
            >
              <h2 class="text-lg font-semibold text-surface-700 dark:text-surface-300 flex items-center gap-2 mb-4">
                <CalendarDaysIcon class="w-5 h-5 text-primary-500" />
                Płatność i Daty
              </h2>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Rodzaj płatności</label>
                  <Select
                    v-model="paymentMethod"
                    :options="paymentMethodOptions"
                    option-label="label"
                    option-value="value"
                    placeholder="Wybierz..."
                    class="w-full"
                  />
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Data wystawienia</label>
                    <DatePicker v-model="invoiceDate" dateFormat="dd/mm/yy" class="w-full" showIcon />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Termin płatności</label>
                    <DatePicker v-model="paymentDueDate" dateFormat="dd/mm/yy" class="w-full" showIcon />
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Dotyczy umowy nr</label>
                  <InputText v-model="contractNo" placeholder="Wpisz numer umowy..." class="w-full" />
                </div>
              </div>
            </div>
          </div>

          <!-- Right column - Towar / Usługa -->
          <div
            class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6"
          >
            <h2 class="text-lg font-semibold text-surface-700 dark:text-surface-300 flex items-center gap-2 mb-4">
              <ShoppingCartIcon class="w-5 h-5 text-primary-500" />
              Towar / Usługa
            </h2>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <div class="col-span-2">
                <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Nazwa towaru/usługi</label>
                <InputText v-model="newItem.name" placeholder="Nazwa towaru lub usługi" class="w-full" />
              </div>
              <div>
                <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">VAT (%)</label>
                <Select v-model="newItem.vat" :options="vatOptions" option-label="rate" option-value="value" class="w-full" />
              </div>
              <div>
                <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">JM</label>
                <Select v-model="newItem.unit" :options="unitOptions" option-label="label" option-value="value" class="w-full" />
              </div>
              <div>
                <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Cena netto (zł)</label>
                <InputNumber v-model="newItem.priceNet" mode="decimal" :min-fraction-digits="2" :max-fraction-digits="2" class="w-full" />
              </div>
              <div>
                <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Ilość</label>
                <InputNumber v-model="newItem.quantity" :min="0.01" class="w-full" />
              </div>
              <div class="flex items-end">
                <Button label="Dodaj" icon="pi pi-plus" size="small" @click="addDraftItem" />
              </div>
            </div>

            <div class="border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden">
              <table class="w-full text-sm text-surface-700 dark:text-surface-300">
                <thead class="bg-surface-100 dark:bg-surface-800">
                  <tr>
                    <th class="text-left p-2">LP</th>
                    <th class="text-left p-2">NAZWA</th>
                    <th class="text-right p-2">ILOŚĆ</th>
                    <th class="text-right p-2">NETTO</th>
                    <th class="text-center p-2">VAT</th>
                    <th class="text-right p-2">BRUTTO</th>
                    <th class="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(item, idx) in draftItems"
                    :key="idx"
                    class="border-t border-surface-200 dark:border-surface-700"
                  >
                    <td class="p-2">{{ idx + 1 }}</td>
                    <td class="p-2">{{ item.name }}</td>
                    <td class="p-2 text-right">{{ item.quantity }} {{ item.unit }}</td>
                    <td class="p-2 text-right">{{ getItemAmounts(item).net.toLocaleString('pl-PL', { minimumFractionDigits: 2 }) }} zł</td>
                    <td class="p-2 text-center">{{ item.vat.rate }}</td>
                    <td class="p-2 text-right">{{ getItemAmounts(item).gross.toLocaleString('pl-PL', { minimumFractionDigits: 2 }) }} zł</td>
                    <td class="p-2">
                      <Button icon="pi pi-trash" text severity="danger" size="small" @click="removeDraftItem(idx)" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-if="draftItems.length === 0" class="text-sm text-surface-500 dark:text-surface-400 mt-2">
              Wprowadź pozycje powyżej, aby pojawiły się na liście.
            </p>
          </div>
        </div>

        <!-- Footer - sums and buttons -->
        <div
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6"
        >
          <div class="flex flex-wrap items-center gap-6">
            <div>
              <span class="text-sm text-surface-600 dark:text-surface-400">SUMA NETTO</span>
              <p class="text-lg font-semibold text-surface-700 dark:text-surface-300">
                {{ sumNet.toLocaleString('pl-PL', { minimumFractionDigits: 2 }) }} zł
              </p>
            </div>
            <div>
              <span class="text-sm text-surface-600 dark:text-surface-400">SUMA VAT</span>
              <p class="text-lg font-semibold text-surface-700 dark:text-surface-300">
                {{ sumVat.toLocaleString('pl-PL', { minimumFractionDigits: 2 }) }} zł
              </p>
            </div>
            <div class="border-l border-surface-200 dark:border-surface-700 pl-6">
              <span class="text-sm text-surface-600 dark:text-surface-400">DO ZAPŁATY (BRUTTO)</span>
              <p class="text-xl font-bold text-primary-600 dark:text-primary-400">
                {{ sumGross.toLocaleString('pl-PL', { minimumFractionDigits: 2 }) }} zł
              </p>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <Button label="Anuluj" icon="pi pi-times" severity="secondary" outlined @click="cancel" />
            <Button label="Podgląd PDF" icon="pi pi-file-pdf" severity="secondary" outlined disabled />
            <Button
              label="Zatwierdź i Wyślij"
              icon="pi pi-check"
              :disabled="!selectedCustomer || !paymentMethod || draftItems.length === 0"
              @click="submit"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
