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
function generateEmail(firstName: string, lastName: string): string {
  const name = `${firstName}${lastName}`.toLowerCase().replace(/\s+/g, '');
  return `${name}@${['gmail.com', 'wp.pl', 'o2.pl', 'interia.pl', 'company.pl', 'design.pl'][Math.floor(Math.random() * 6)]}`;
}

// Generowanie 30 mockowanych projektantów
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
    const name = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const phone = generatePhone();
    const phone2 = Math.random() > 0.4 ? generatePhone() : undefined; // 60% ma drugi telefon
    const email = generateEmail(name, lastName);
    const info = infoOptions[Math.floor(Math.random() * infoOptions.length)];
    const address = generateMockAddress(addressId++);
    const employee = Math.random() > 0.3; // 70% to pracownicy firmy

    designers.push({
      id: id++,
      name,
      lastName,
      phone,
      phone2,
      email,
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
  const designers = ref<Designer[]>(generateMockDesigners());
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

      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas usuwania projektanta';
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Wyszukuje projektantów po frazie (imię, nazwisko, email, telefon, miasto, ulica)
   */
  function searchDesigners(query: string): Designer[] {
    if (!query.trim()) {
      return getAllDesigners();
    }

    const lowerQuery = query.toLowerCase();
    return designers.value.filter(d => {
      return (
        d.name.toLowerCase().includes(lowerQuery) ||
        d.lastName.toLowerCase().includes(lowerQuery) ||
        d.email.toLowerCase().includes(lowerQuery) ||
        d.phone.includes(query) ||
        d.phone2?.includes(query) ||
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
