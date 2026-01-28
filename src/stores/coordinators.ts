import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import type { Coordinator } from '../types/Coordinator';

// Funkcja pomocnicza do generowania losowych numerów telefonów
function generatePhone(): string {
  return `+48 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 900) + 100}`;
}

// Funkcja pomocnicza do generowania losowych emaili
function generateEmail(firstName: string, lastName: string): string {
  const name = `${firstName}${lastName}`.toLowerCase().replace(/\s+/g, '');
  return `${name}@${['gmail.com', 'wp.pl', 'o2.pl', 'interia.pl', 'company.pl'][Math.floor(Math.random() * 5)]}`;
}

// Klucz localStorage dla koordynatorów
const STORAGE_KEY = 'gas-manager:coordinators';

// Funkcja pomocnicza do ładowania danych z localStorage
function loadFromLocalStorage(): Coordinator[] | null {
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
    console.warn('Błąd podczas ładowania koordynatorów z localStorage:', err);
    return null;
  }
}

// Funkcja pomocnicza do zapisywania danych do localStorage
function saveToLocalStorage(data: Coordinator[]): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Błąd podczas zapisywania koordynatorów do localStorage:', err);
  }
}

// Generowanie 20 mockowanych koordynatorów
function generateMockCoordinators(): Coordinator[] {
  const coordinators: Coordinator[] = [];
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
  ];
  const infoOptions = [
    'Koordynator z wieloletnim doświadczeniem',
    'Specjalizuje się w projektach gazowych',
    'Odpowiedzialny za region centralny',
    'Ekspert w zakresie instalacji przemysłowych',
    'Koordynator ds. klientów biznesowych',
    'Doświadczenie w zarządzaniu dużymi projektami',
    'Specjalista od projektów mieszkaniowych',
    'Koordynator regionalny - województwo mazowieckie',
    undefined, // część bez dodatkowych informacji
    undefined,
  ];

  let id = 1;

  for (let i = 0; i < 20; i++) {
    const name = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const phones = [generatePhone(), ...(Math.random() > 0.5 ? [generatePhone()] : [])].filter(Boolean);
    const emails = [generateEmail(name, lastName)];
    const info = infoOptions[Math.floor(Math.random() * infoOptions.length)];

    coordinators.push({
      id: id++,
      name,
      lastName,
      phones,
      emails,
      info,
      status: Math.random() > 0.15, // 85% aktywnych
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  return coordinators;
}

export const useCoordinatorsStore = defineStore('coordinators', () => {
  // Ładowanie danych z localStorage lub generowanie nowych
  const loadedData = loadFromLocalStorage();
  const initialData = loadedData ?? generateMockCoordinators();
  const coordinators = ref<Coordinator[]>(initialData);

  // Zapisanie wygenerowanych danych do localStorage jeśli nie były tam wcześniej
  if (!loadedData) {
    saveToLocalStorage(coordinators.value);
  }

  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed properties
  const activeCoordinators = computed(() => coordinators.value.filter(c => c.status));
  const inactiveCoordinators = computed(() => coordinators.value.filter(c => !c.status));
  const totalCount = computed(() => coordinators.value.length);

  // Funkcje CRUD (na razie z mockowaniem, później będą używać API)

  /**
   * Pobiera wszystkich koordynatorów
   * @param filters - opcjonalne filtry (status)
   */
  function getAllCoordinators(filters?: { status?: boolean }): Coordinator[] {
    loading.value = true;
    error.value = null;

    try {
      let result = [...coordinators.value];

      if (filters?.status !== undefined) {
        result = result.filter(c => c.status === filters.status);
      }

      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas pobierania koordynatorów';
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * Pobiera koordynatora po ID
   */
  function getCoordinator(id: number): Coordinator | undefined {
    loading.value = true;
    error.value = null;

    try {
      return coordinators.value.find(c => c.id === id);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas pobierania koordynatora';
      return undefined;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Dodaje nowego koordynatora
   */
  function addCoordinator(coordinator: Omit<Coordinator, 'id' | 'createdAt' | 'updatedAt'>): Coordinator {
    loading.value = true;
    error.value = null;

    try {
      const newId = Math.max(...coordinators.value.map(c => c.id), 0) + 1;
      const newCoordinator: Coordinator = {
        ...coordinator,
        id: newId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      coordinators.value.push(newCoordinator);
      saveToLocalStorage(coordinators.value);
      return newCoordinator;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas dodawania koordynatora';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Aktualizuje istniejącego koordynatora
   */
  function updateCoordinator(id: number, updates: Partial<Omit<Coordinator, 'id' | 'createdAt'>>): Coordinator | null {
    loading.value = true;
    error.value = null;

    try {
      const index = coordinators.value.findIndex(c => c.id === id);
      if (index === -1) {
        error.value = 'Koordynator nie został znaleziony';
        return null;
      }

      coordinators.value[index] = {
        ...coordinators.value[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      saveToLocalStorage(coordinators.value);
      return coordinators.value[index];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas aktualizacji koordynatora';
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Usuwa koordynatora (lub oznacza jako nieaktywnego)
   */
  function deleteCoordinator(id: number, hardDelete: boolean = false): boolean {
    loading.value = true;
    error.value = null;

    try {
      const index = coordinators.value.findIndex(c => c.id === id);
      if (index === -1) {
        error.value = 'Koordynator nie został znaleziony';
        return false;
      }

      if (hardDelete) {
        coordinators.value.splice(index, 1);
      } else {
        // Soft delete - tylko zmiana statusu
        coordinators.value[index].status = false;
        coordinators.value[index].updatedAt = new Date().toISOString();
      }

      saveToLocalStorage(coordinators.value);
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas usuwania koordynatora';
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Wyszukuje koordynatorów po frazie (imię, nazwisko, email, telefon)
   */
  function searchCoordinators(query: string): Coordinator[] {
    if (!query.trim()) {
      return getAllCoordinators();
    }

    const lowerQuery = query.toLowerCase();
    return coordinators.value.filter(c => {
      return (
        c.name.toLowerCase().includes(lowerQuery) ||
        c.lastName.toLowerCase().includes(lowerQuery) ||
        c.emails?.some(e => e.toLowerCase().includes(lowerQuery)) ||
        c.phones?.some(p => p.includes(query))
      );
    });
  }

  return {
    // State
    coordinators,
    loading,
    error,
    // Computed
    activeCoordinators,
    inactiveCoordinators,
    totalCount,
    // Methods
    getAllCoordinators,
    getCoordinator,
    addCoordinator,
    updateCoordinator,
    deleteCoordinator,
    searchCoordinators,
  };
});
