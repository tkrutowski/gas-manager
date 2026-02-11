import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import type { Invoice, PaymentMethod, Vat, InvoiceItem } from '@/types/Invoice';
import type { Customer } from '@/types/Customer';
import type { Address } from '@/types/Address';
import type { TaskType } from '@/types/TaskType';

const STORAGE_KEY = 'gas-manager:invoices';

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 1, name: 'Przelew (14 dni)' },
  { id: 2, name: 'Przelew (30 dni)' },
  { id: 3, name: 'Gotówka' },
  { id: 4, name: 'Karta' },
];

const VAT_RATES: Vat[] = [
  { id: 1, rate: '23%', multiplier: 0.23 },
  { id: 2, rate: '8%', multiplier: 0.08 },
  { id: 3, rate: '5%', multiplier: 0.05 },
  { id: 4, rate: '0%', multiplier: 0 },
];

const TASK_TYPES: TaskType[] = [
  { name: 'ALL', viewName: 'Wszystkie' },
  { name: 'GAS_CONNECTION', viewName: 'przylacze' },
  { name: 'GAS_PIPELINE', viewName: 'gazociag' },
  { name: 'GAS_INTERNAL', viewName: 'wewnetrzna' },
];

function mockAddress(id: number): Address {
  return {
    id,
    commune: 'Poznań',
    city: 'Poznań',
    street: `ul. Przykładowa ${id}`,
    zip: '61-001',
    coordinates: { id, latitude: '52.40', longitude: '16.93' },
  };
}

function createMockCustomers(): Customer[] {
  return [
    {
      id: 1,
      customerType: 'company',
      companyName: 'Wielkopolska Spółka Gazownictwa Sp. z o.o.',
      nip: '778-13-87-479',
      address: mockAddress(1),
      status: true,
    },
    {
      id: 2,
      customerType: 'company',
      companyName: 'Northern Storage',
      nip: '123-456-78-90',
      address: mockAddress(2),
      status: true,
    },
    {
      id: 3,
      customerType: 'company',
      companyName: 'Energia Plus Sp. z o.o.',
      nip: '111-222-33-44',
      address: mockAddress(3),
      status: true,
    },
    {
      id: 4,
      customerType: 'company',
      companyName: 'Instalacje Gazowe Sp. z o.o.',
      nip: '555-666-77-88',
      address: mockAddress(4),
      status: true,
    },
    {
      id: 5,
      customerType: 'company',
      companyName: 'Tech Solutions Sp. z o.o.',
      nip: '999-888-77-66',
      address: mockAddress(5),
      status: true,
    },
  ];
}

function randomDate(fromYear: number, toYear: number): Date {
  const y = fromYear + Math.floor(Math.random() * (toYear - fromYear + 1));
  const m = Math.floor(Math.random() * 12);
  const d = 1 + Math.floor(Math.random() * 28);
  return new Date(y, m, d);
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

function generateMockInvoices(customers: Customer[]): Invoice[] {
  const list: Invoice[] = [];
  const years = [2022, 2023, 2024, 2025, 2026];
  let num = 1;

  years.forEach(year => {
    const count = year === 2026 ? 3 : 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const invoiceDate = randomDate(year, year);
      const paymentMethod = PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)];
      const days = paymentMethod.id <= 2 ? (paymentMethod.id === 1 ? 14 : 30) : 0;
      const paymentDate = days > 0 ? addDays(invoiceDate, days) : invoiceDate;
      const paid = Math.random() > 0.35;
      const vat = VAT_RATES[0];
      const amountNet = Math.round((500 + Math.random() * 15000) * 100) / 100;

      const itemCount = 1 + Math.floor(Math.random() * 3);
      const items: InvoiceItem[] = [];
      let itemNet = 0;
      let itemVat = 0;
      for (let j = 0; j < itemCount; j++) {
        const priceNet = Math.round((amountNet / itemCount) * 100) / 100;
        const priceVat = Math.round(priceNet * vat.multiplier * 100) / 100;
        const qty = j === itemCount - 1 ? 1 : 1;
        const amountNetItem = Math.round(priceNet * qty * 100) / 100;
        const amountVatItem = Math.round(priceVat * qty * 100) / 100;
        const amountGrossItem = Math.round((amountNetItem + amountVatItem) * 100) / 100;
        itemNet += amountNetItem;
        itemVat += amountVatItem;
        items.push({
          idInvoiceItem: num * 10 + j,
          idInvoiceNumber: num,
          idInvoiceYear: year,
          name: ['Przegląd szczelności instalacji', 'Wymiana uszczelki kryzy', 'Usługa serwisowa stacji redukcyjn'][j % 3],
          pkwiu: '43.22.20.0',
          unit: 'szt.',
          quantity: qty,
          priceNet,
          amountNet: amountNetItem,
          amountVat: amountVatItem,
          amountGross: amountGrossItem,
          vat,
        });
      }

      list.push({
        idInvoiceNumber: num,
        idInvoiceYear: year,
        customer,
        paymentMethod,
        sellDate: invoiceDate,
        paymentDate: paid ? paymentDate : undefined,
        amountNet: itemNet,
        amountVat: itemVat,
        amountGross: Math.round((itemNet + itemVat) * 100) / 100,
        paid,
        invoiceDate,
        taskType: TASK_TYPES[Math.floor(Math.random() * TASK_TYPES.length)],
        idTask: Math.random() > 0.6 ? 100 + num : undefined,
        invoiceItems: items,
      });
      num += 1;
    }
  });

  return list.sort((a, b) => {
    const da = a.invoiceDate ? new Date(a.invoiceDate).getTime() : 0;
    const db = b.invoiceDate ? new Date(b.invoiceDate).getTime() : 0;
    return db - da;
  });
}

function loadFromLocalStorage(): Invoice[] | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return null;
    return parsed.map((p: any) => ({
      ...p,
      invoiceDate: p.invoiceDate ? new Date(p.invoiceDate) : undefined,
      sellDate: p.sellDate ? new Date(p.sellDate) : undefined,
      paymentDate: p.paymentDate ? new Date(p.paymentDate) : undefined,
      invoiceItems: (p.invoiceItems || []).map((it: any) => ({
        ...it,
      })),
    })) as Invoice[];
  } catch {
    return null;
  }
}

function saveToLocalStorage(data: Invoice[]): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export const useInvoicesStore = defineStore('invoices', () => {
  const mockCustomers = createMockCustomers();
  const loadedData = loadFromLocalStorage();
  const initialData = loadedData ?? generateMockInvoices(mockCustomers);
  const invoices = ref<Invoice[]>(initialData);

  if (!loadedData) {
    saveToLocalStorage(invoices.value);
  }

  const loading = ref(false);
  const error = ref<string | null>(null);

  const totalCount = computed(() => invoices.value.length);
  const paidInvoices = computed(() => invoices.value.filter(i => i.paid));
  const unpaidInvoices = computed(() => invoices.value.filter(i => !i.paid));

  function getAllInvoices(filters?: { paid?: boolean }): Invoice[] {
    loading.value = true;
    error.value = null;
    try {
      let result = [...invoices.value];
      if (filters?.paid !== undefined) {
        result = result.filter(i => i.paid === filters.paid);
      }
      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas pobierania faktur';
      return [];
    } finally {
      loading.value = false;
    }
  }

  function getInvoice(idNumber: number, idYear: number): Invoice | undefined {
    return invoices.value.find(i => i.idInvoiceNumber === idNumber && i.idInvoiceYear === idYear);
  }

  function addInvoice(invoice: Omit<Invoice, 'idInvoiceNumber' | 'idInvoiceYear'>): Invoice {
    loading.value = true;
    error.value = null;
    try {
      const maxNum = Math.max(0, ...invoices.value.map(i => i.idInvoiceNumber));
      const year = invoice.invoiceDate ? new Date(invoice.invoiceDate).getFullYear() : new Date().getFullYear();
      const num = maxNum + 1;
      const items: InvoiceItem[] = (invoice.invoiceItems || []).map((it, idx) => ({
        ...it,
        idInvoiceItem: idx + 1,
        idInvoiceNumber: num,
        idInvoiceYear: year,
      }));
      const newInvoice: Invoice = {
        ...invoice,
        idInvoiceNumber: num,
        idInvoiceYear: year,
        invoiceItems: items,
      };
      invoices.value.push(newInvoice);
      saveToLocalStorage(invoices.value);
      return newInvoice;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas dodawania faktury';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function updateInvoice(
    idNumber: number,
    idYear: number,
    updates: Partial<Omit<Invoice, 'idInvoiceNumber' | 'idInvoiceYear'>>
  ): Invoice | null {
    loading.value = true;
    error.value = null;
    try {
      const idx = invoices.value.findIndex(i => i.idInvoiceNumber === idNumber && i.idInvoiceYear === idYear);
      if (idx === -1) return null;
      
      // Aktualizuj invoiceItems z poprawnymi ID
      const updatedItems = updates.invoiceItems?.map((it, itemIdx) => ({
        ...it,
        idInvoiceItem: itemIdx + 1,
        idInvoiceNumber: idNumber,
        idInvoiceYear: idYear,
      })) || invoices.value[idx].invoiceItems;
      
      invoices.value[idx] = {
        ...invoices.value[idx],
        ...updates,
        invoiceItems: updatedItems,
      };
      saveToLocalStorage(invoices.value);
      return invoices.value[idx];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas aktualizacji faktury';
      return null;
    } finally {
      loading.value = false;
    }
  }

  function deleteInvoice(idNumber: number, idYear: number): boolean {
    loading.value = true;
    error.value = null;
    try {
      const idx = invoices.value.findIndex(i => i.idInvoiceNumber === idNumber && i.idInvoiceYear === idYear);
      if (idx === -1) return false;
      invoices.value.splice(idx, 1);
      saveToLocalStorage(invoices.value);
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas usuwania faktury';
      return false;
    } finally {
      loading.value = false;
    }
  }

  return {
    invoices,
    loading,
    error,
    totalCount,
    paidInvoices,
    unpaidInvoices,
    getAllInvoices,
    getInvoice,
    addInvoice,
    updateInvoice,
    deleteInvoice,
  };
});

export { PAYMENT_METHODS, VAT_RATES, TASK_TYPES };
