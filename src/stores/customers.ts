import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import type { Customer } from '../types/Customer';
import type { Address } from '../types/Address';

// Funkcja pomocnicza do generowania losowych adresów
function generateMockAddress(id: number): Address {
  const cities = [
    'Warszawa',
    'Kraków',
    'Gdańsk',
    'Wrocław',
    'Poznań',
    'Łódź',
    'Katowice',
    'Lublin',
    'Szczecin',
    'Bydgoszcz',
  ];
  const streets = [
    'ul. Główna',
    'ul. Słoneczna',
    'ul. Polna',
    'ul. Leśna',
    'ul. Kwiatowa',
    'ul. Parkowa',
    'ul. Ogrodowa',
    'ul. Spacerowa',
  ];
  const communes = ['Mokotów', 'Śródmieście', 'Praga', 'Żoliborz', 'Wola', 'Ochota', 'Bielany', 'Bemowo'];

  return {
    id: id,
    commune: communes[Math.floor(Math.random() * communes.length)],
    city: cities[Math.floor(Math.random() * cities.length)],
    street: `${streets[Math.floor(Math.random() * streets.length)]} ${Math.floor(Math.random() * 100) + 1}`,
    zip: `${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 900) + 100}`,
    coordinates: {
      id: id,
      latitude: (50 + Math.random() * 4).toFixed(6),
      longitude: (19 + Math.random() * 4).toFixed(6),
    },
  };
}

// Funkcja pomocnicza do generowania losowych numerów telefonów
function generatePhone(): string {
  return `+48 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 900) + 100}`;
}

// Funkcja pomocnicza do generowania losowych emaili
function generateEmail(firstName?: string, lastName?: string, companyName?: string): string {
  if (companyName) {
    const domain = companyName.toLowerCase().replace(/\s+/g, '');
    return `${domain}@${['example.com', 'firma.pl', 'business.pl', 'company.com'][Math.floor(Math.random() * 4)]}`;
  }
  const name = `${firstName || ''}${lastName || ''}`.toLowerCase().replace(/\s+/g, '');
  return `${name}@${['gmail.com', 'wp.pl', 'o2.pl', 'interia.pl'][Math.floor(Math.random() * 4)]}`;
}

// Funkcja pomocnicza do generowania NIP
function generateNIP(): string {
  return Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('');
}

// Funkcja pomocnicza do generowania REGON
function generateREGON(): string {
  return Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('');
}

// Funkcja pomocnicza do generowania KRS
function generateKRS(): string {
  return Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('');
}

// Generowanie 100 mockowanych klientów
function generateMockCustomers(): Customer[] {
  const customers: Customer[] = [];
  const firstNames = [
    'Jan',
    'Anna',
    'Piotr',
    'Maria',
    'Krzysztof',
    'Katarzyna',
    'Tomasz',
    'Magdalena',
    'Paweł',
    'Agnieszka',
    'Marcin',
    'Joanna',
    'Michał',
    'Ewa',
    'Łukasz',
  ];
  const lastNames = [
    'Kowalski',
    'Nowak',
    'Wiśniewski',
    'Wójcik',
    'Kowalczyk',
    'Kamiński',
    'Lewandowski',
    'Zieliński',
    'Szymański',
    'Woźniak',
    'Dąbrowski',
    'Kozłowski',
    'Jankowski',
    'Mazur',
    'Kwiatkowski',
  ];
  const companyNames = [
    'Tech Solutions Sp. z o.o.',
    'Budowa i Remonty',
    'Energia Plus',
    'Instalacje Gazowe',
    'Przedsiębiorstwo Wielobranżowe',
    'Firma Handlowa',
    'Usługi Techniczne',
    'Inwestycje i Nieruchomości',
    'Produkcja i Dystrybucja',
    'Consulting Group',
    'Systemy Informatyczne',
    'Logistyka i Transport',
    'Energetyka Odnawialna',
    'Inżynieria i Projektowanie',
    'Handel Detaliczny',
  ];

  let id = 1;

  // Generowanie 50 osób fizycznych
  for (let i = 0; i < 50; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const phone = generatePhone();
    const email = generateEmail(firstName, lastName);

    customers.push({
      id: id++,
      customerType: 'person',
      firstName,
      lastName,
      phone,
      email,
      info:
        Math.random() > 0.5
          ? `Klient indywidualny, preferowany kontakt: ${Math.random() > 0.5 ? 'telefon' : 'email'}`
          : undefined,
      address: generateMockAddress(id),
      status: Math.random() > 0.2, // 80% aktywnych
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  // Generowanie 50 firm
  for (let i = 0; i < 50; i++) {
    const companyName = companyNames[Math.floor(Math.random() * companyNames.length)];
    const phone = generatePhone();
    const email = generateEmail(undefined, undefined, companyName);
    const nip = generateNIP();
    const regon = generateREGON();

    customers.push({
      id: id++,
      customerType: 'company',
      companyName,
      nip,
      regon,
      krs: Math.random() > 0.4 ? generateKRS() : undefined, // 60% ma KRS
      phone,
      email,
      info: Math.random() > 0.4 ? `Firma działająca od ${2000 + Math.floor(Math.random() * 24)} roku` : undefined,
      address: generateMockAddress(id),
      status: Math.random() > 0.15, // 85% aktywnych
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  // Mieszanie kolejności
  return customers.sort(() => Math.random() - 0.5);
}

export const useCustomersStore = defineStore('customers', () => {
  const customers = ref<Customer[]>(generateMockCustomers());
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed properties
  const activeCustomers = computed(() => customers.value.filter(c => c.status));
  const inactiveCustomers = computed(() => customers.value.filter(c => !c.status));
  const personCustomers = computed(() => customers.value.filter(c => c.customerType === 'person'));
  const companyCustomers = computed(() => customers.value.filter(c => c.customerType === 'company'));
  const totalCount = computed(() => customers.value.length);

  // Funkcje CRUD (na razie z mockowaniem, później będą używać API)

  /**
   * Pobiera wszystkich klientów
   * @param filters - opcjonalne filtry (status, customerType)
   */
  function getAllCustomers(filters?: { status?: boolean; customerType?: 'person' | 'company' }): Customer[] {
    loading.value = true;
    error.value = null;

    try {
      let result = [...customers.value];

      if (filters?.status !== undefined) {
        result = result.filter(c => c.status === filters.status);
      }

      if (filters?.customerType) {
        result = result.filter(c => c.customerType === filters.customerType);
      }

      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas pobierania klientów';
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * Pobiera klienta po ID
   */
  function getCustomer(id: number): Customer | undefined {
    loading.value = true;
    error.value = null;

    try {
      return customers.value.find(c => c.id === id);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas pobierania klienta';
      return undefined;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Dodaje nowego klienta
   */
  function addCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Customer {
    loading.value = true;
    error.value = null;

    try {
      const newId = Math.max(...customers.value.map(c => c.id), 0) + 1;
      const newCustomer: Customer = {
        ...customer,
        id: newId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      customers.value.push(newCustomer);
      return newCustomer;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas dodawania klienta';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Aktualizuje istniejącego klienta
   */
  function updateCustomer(id: number, updates: Partial<Omit<Customer, 'id' | 'createdAt'>>): Customer | null {
    loading.value = true;
    error.value = null;

    try {
      const index = customers.value.findIndex(c => c.id === id);
      if (index === -1) {
        error.value = 'Klient nie został znaleziony';
        return null;
      }

      customers.value[index] = {
        ...customers.value[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      return customers.value[index];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas aktualizacji klienta';
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Usuwa klienta (lub oznacza jako nieaktywnego)
   */
  function deleteCustomer(id: number, hardDelete: boolean = false): boolean {
    loading.value = true;
    error.value = null;

    try {
      const index = customers.value.findIndex(c => c.id === id);
      if (index === -1) {
        error.value = 'Klient nie został znaleziony';
        return false;
      }

      if (hardDelete) {
        customers.value.splice(index, 1);
      } else {
        // Soft delete - tylko zmiana statusu
        customers.value[index].status = false;
        customers.value[index].updatedAt = new Date().toISOString();
      }

      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas usuwania klienta';
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Wyszukuje klientów po frazie (imię, nazwisko, nazwa firmy, email, telefon)
   */
  function searchCustomers(query: string): Customer[] {
    if (!query.trim()) {
      return getAllCustomers();
    }

    const lowerQuery = query.toLowerCase();
    return customers.value.filter(c => {
      if (c.customerType === 'person') {
        return (
          c.firstName?.toLowerCase().includes(lowerQuery) ||
          c.lastName?.toLowerCase().includes(lowerQuery) ||
          c.email.toLowerCase().includes(lowerQuery) ||
          c.phone.includes(query)
        );
      } else {
        return (
          c.companyName?.toLowerCase().includes(lowerQuery) ||
          c.email.toLowerCase().includes(lowerQuery) ||
          c.phone.includes(query) ||
          c.nip?.includes(query) ||
          c.regon?.includes(query)
        );
      }
    });
  }

  return {
    // State
    customers,
    loading,
    error,
    // Computed
    activeCustomers,
    inactiveCustomers,
    personCustomers,
    companyCustomers,
    totalCount,
    // Methods
    getAllCustomers,
    getCustomer,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    searchCustomers,
  };
});
