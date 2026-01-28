import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import type { Designer } from '../types/Designer';
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
    'ul. Projektowa',
    'ul. Inżynierska',
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
function generateEmailFromPerson(firstName: string, lastName: string): string {
  const name = `${firstName}${lastName}`.toLowerCase().replace(/\s+/g, '');
  return `${name}@${['gmail.com', 'wp.pl', 'o2.pl', 'interia.pl', 'design.pl'][Math.floor(Math.random() * 5)]}`;
}

function generateEmailFromCompany(companyName: string): string {
  const normalized = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const base = normalized || 'company';
  return `${base}@${['company.pl', 'biuro.pl', 'firma.pl'][Math.floor(Math.random() * 3)]}`;
}

// Klucz localStorage dla projektantów
const STORAGE_KEY = 'gas-manager:designers';

// Funkcja pomocnicza do ładowania danych z localStorage
function loadFromLocalStorage(): Designer[] | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : null;
  } catch (err) {
    console.warn('Błąd podczas ładowania projektantów z localStorage:', err);
    return null;
  }
}

// Funkcja pomocnicza do zapisywania danych do localStorage
function saveToLocalStorage(data: Designer[]): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Błąd podczas zapisywania projektantów do localStorage:', err);
  }
}

// Generowanie 30 mockowanych projektantów (osoby i firmy)
function generateMockDesigners(): Designer[] {
  const designers: Designer[] = [];
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
    'Monika',
    'Robert',
    'Barbara',
    'Andrzej',
    'Aleksandra',
    'Wojciech',
    'Natalia',
    'Jakub',
    'Karolina',
    'Mateusz',
    'Paulina',
    'Bartosz',
    'Sylwia',
    'Dawid',
    'Justyna',
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
    'Krawczyk',
    'Piotrowski',
    'Grabowski',
    'Nowakowski',
    'Pawłowski',
    'Michalski',
    'Nowicki',
    'Adamczyk',
    'Dudek',
    'Zając',
    'Wieczorek',
    'Jabłoński',
    'Król',
    'Majewski',
    'Olszewski',
  ];
  const companyNames = [
    'Projekt-Gaz Sp. z o.o.',
    'Instal-Projekt S.A.',
    'GazDesign Studio',
    'Inż-Projekt Sp. z o.o.',
    'InfraProjekt Sp. z o.o.',
    'TechGaz Sp. z o.o.',
    'Projekt-System S.A.',
    'GazBud Projekt',
  ];

  const infoOptions = [
    'Projektant z wieloletnim doświadczeniem',
    'Specjalizuje się w projektach gazowych',
    'Ekspert w zakresie instalacji przemysłowych',
    'Doświadczenie w projektach mieszkaniowych',
    'Specjalista od projektów komercyjnych',
    'Projektant z uprawnieniami budowlanymi',
    'Ekspert w zakresie bezpieczeństwa instalacji',
    'Doświadczenie w zarządzaniu projektami',
    undefined, // część bez dodatkowych informacji
    undefined,
  ];

  let id = 1;
  let addressId = 1;

  for (let i = 0; i < 30; i++) {
    // Około 2/3 to osoby fizyczne, 1/3 firmy
    const isPerson = Math.random() > 0.35;
    const designerType: Designer['designerType'] = isPerson ? 'person' : 'company';

    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const companyName = companyNames[Math.floor(Math.random() * companyNames.length)];
    const phones = [generatePhone(), ...(Math.random() > 0.4 ? [generatePhone()] : [])].filter(Boolean);
    const emails = [isPerson ? generateEmailFromPerson(firstName, lastName) : generateEmailFromCompany(companyName)];
    const info = infoOptions[Math.floor(Math.random() * infoOptions.length)];
    const address = generateMockAddress(addressId++);
    const employee = Math.random() > 0.3; // 70% to pracownicy firmy

    const nip = !isPerson ? `${Math.floor(Math.random() * 9000000000) + 1000000000}` : undefined;
    const regon = !isPerson && Math.random() > 0.4 ? `${Math.floor(Math.random() * 900000000) + 100000000}` : undefined;
    const krs = !isPerson && Math.random() > 0.6 ? `${Math.floor(Math.random() * 900000) + 100000}` : undefined;

    designers.push({
      id: id++,
      designerType,
      // dane osoby
      firstName: isPerson ? firstName : undefined,
      lastName: isPerson ? lastName : undefined,
      // dane firmy
      companyName: !isPerson ? companyName : undefined,
      nip,
      regon,
      krs,
      // kompatybilność wsteczna (stare pola name/lastName)
      name: isPerson ? firstName : companyName,
      phones,
      emails,
      info,
      address,
      status: Math.random() > 0.15, // 85% aktywnych
      employee,
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  return designers;
}

export const useDesignersStore = defineStore('designers', () => {
  // Ładowanie danych z localStorage lub generowanie nowych
  const loadedData = loadFromLocalStorage();
  const initialData = loadedData ?? generateMockDesigners();
  const designers = ref<Designer[]>(initialData);

  // Zapisanie wygenerowanych danych do localStorage jeśli nie były tam wcześniej
  if (!loadedData) {
    saveToLocalStorage(designers.value);
  }

  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed properties
  const activeDesigners = computed(() => designers.value.filter(d => d.status));
  const inactiveDesigners = computed(() => designers.value.filter(d => !d.status));
  const employeeDesigners = computed(() => designers.value.filter(d => d.employee));
  const externalDesigners = computed(() => designers.value.filter(d => !d.employee));
  const totalCount = computed(() => designers.value.length);

  // Funkcje CRUD (na razie z mockowaniem, później będą używać API)

  /**
   * Pobiera wszystkich projektantów
   * @param filters - opcjonalne filtry (status, employee)
   */
  function getAllDesigners(filters?: { status?: boolean; employee?: boolean }): Designer[] {
    loading.value = true;
    error.value = null;

    try {
      let result = [...designers.value];

      if (filters?.status !== undefined) {
        result = result.filter(d => d.status === filters.status);
      }

      if (filters?.employee !== undefined) {
        result = result.filter(d => d.employee === filters.employee);
      }

      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas pobierania projektantów';
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * Pobiera projektanta po ID
   */
  function getDesigner(id: number): Designer | undefined {
    loading.value = true;
    error.value = null;

    try {
      return designers.value.find(d => d.id === id);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas pobierania projektanta';
      return undefined;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Dodaje nowego projektanta
   */
  function addDesigner(designer: Omit<Designer, 'id' | 'createdAt' | 'updatedAt'>): Designer {
    loading.value = true;
    error.value = null;

    try {
      const newId = Math.max(...designers.value.map(d => d.id), 0) + 1;
      const newDesigner: Designer = {
        ...designer,
        id: newId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      designers.value.push(newDesigner);
      saveToLocalStorage(designers.value);
      return newDesigner;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas dodawania projektanta';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Aktualizuje istniejącego projektanta
   */
  function updateDesigner(id: number, updates: Partial<Omit<Designer, 'id' | 'createdAt'>>): Designer | null {
    loading.value = true;
    error.value = null;

    try {
      const index = designers.value.findIndex(d => d.id === id);
      if (index === -1) {
        error.value = 'Projektant nie został znaleziony';
        return null;
      }

      designers.value[index] = {
        ...designers.value[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      saveToLocalStorage(designers.value);
      return designers.value[index];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas aktualizacji projektanta';
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Usuwa projektanta (lub oznacza jako nieaktywnego)
   */
  function deleteDesigner(id: number, hardDelete: boolean = false): boolean {
    loading.value = true;
    error.value = null;

    try {
      const index = designers.value.findIndex(d => d.id === id);
      if (index === -1) {
        error.value = 'Projektant nie został znaleziony';
        return false;
      }

      if (hardDelete) {
        designers.value.splice(index, 1);
      } else {
        // Soft delete - tylko zmiana statusu
        designers.value[index].status = false;
        designers.value[index].updatedAt = new Date().toISOString();
      }

      saveToLocalStorage(designers.value);
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas usuwania projektanta';
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Wyszukuje projektantów po frazie (imię, nazwisko, nazwa firmy, NIP, email, telefon, miasto, ulica)
   */
  function searchDesigners(query: string): Designer[] {
    if (!query.trim()) {
      return getAllDesigners();
    }

    const lowerQuery = query.toLowerCase();
    return designers.value.filter(d => {
      return (
        (d.firstName && d.firstName.toLowerCase().includes(lowerQuery)) ||
        (d.lastName && d.lastName.toLowerCase().includes(lowerQuery)) ||
        (d.companyName && d.companyName.toLowerCase().includes(lowerQuery)) ||
        (d.nip && d.nip.toLowerCase().includes(lowerQuery)) ||
        d.emails?.some(e => e.toLowerCase().includes(lowerQuery)) ||
        d.phones?.some(p => p.includes(query)) ||
        d.address.city.toLowerCase().includes(lowerQuery) ||
        d.address.street.toLowerCase().includes(lowerQuery) ||
        d.address.commune.toLowerCase().includes(lowerQuery)
      );
    });
  }

  return {
    // State
    designers,
    loading,
    error,
    // Computed
    activeDesigners,
    inactiveDesigners,
    employeeDesigners,
    externalDesigners,
    totalCount,
    // Methods
    getAllDesigners,
    getDesigner,
    addDesigner,
    updateDesigner,
    deleteDesigner,
    searchDesigners,
  };
});
