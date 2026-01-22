import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import type { DesignerTraffic } from '../types/Designer';

// Klucz localStorage dla projektantów ruchu
const STORAGE_KEY = 'gas-manager:designer-traffic';

// Funkcja pomocnicza do generowania losowych numerów telefonów
function generatePhone(): string {
  return `+48 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 900) + 100} ${
    Math.floor(Math.random() * 900) + 100
  }`;
}

// Funkcja pomocnicza do generowania losowych emaili
function generateEmail(firstName: string, lastName: string): string {
  const name = `${firstName}${lastName}`.toLowerCase().replace(/\s+/g, '');
  const domains = ['gmail.com', 'wp.pl', 'o2.pl', 'interia.pl', 'company.pl', 'traffic.pl'];
  return `${name}@${domains[Math.floor(Math.random() * domains.length)]}`;
}

// Funkcja pomocnicza do ładowania danych z localStorage
function loadFromLocalStorage(): DesignerTraffic[] | null {
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
    console.warn('Błąd podczas ładowania projektantów ruchu z localStorage:', err);
    return null;
  }
}

// Funkcja pomocnicza do zapisywania danych do localStorage
function saveToLocalStorage(data: DesignerTraffic[]): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Błąd podczas zapisywania projektantów ruchu do localStorage:', err);
  }
}

// Generowanie mockowanych projektantów ruchu
function generateMockDesignerTraffic(): DesignerTraffic[] {
  const result: DesignerTraffic[] = [];
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
    'Projektant ruchu z wieloletnim doświadczeniem',
    'Specjalizuje się w projektach gazowych',
    'Ekspert w zakresie bezpieczeństwa instalacji',
    'Doświadczenie w projektach mieszkaniowych',
    'Specjalista od projektów komercyjnych',
    'Projektant z uprawnieniami budowlanymi',
    'Ekspert w zakresie organizacji ruchu',
    'Doświadczenie w zarządzaniu projektami',
    undefined,
    undefined,
  ];

  let id = 1;

  for (let i = 0; i < 25; i++) {
    const name = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const phone = generatePhone();
    const phone2 = Math.random() > 0.4 ? generatePhone() : undefined;
    const email = generateEmail(name, lastName);
    const info = infoOptions[Math.floor(Math.random() * infoOptions.length)];

    result.push({
      id: id++,
      name,
      lastName,
      phone,
      phone2,
      email,
      info,
      status: Math.random() > 0.15, // 85% aktywnych
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  return result;
}

// Store projektantów ruchu (mockowane dane, później do podpięcia pod API)
export const useDesignerTrafficStore = defineStore('designerTraffic', () => {
  const loadedData = loadFromLocalStorage();
  const initialData = loadedData ?? generateMockDesignerTraffic();
  const designerTraffic = ref<DesignerTraffic[]>(initialData);

  // Zapisanie wygenerowanych danych do localStorage jeśli nie były tam wcześniej
  if (!loadedData) {
    saveToLocalStorage(designerTraffic.value);
  }

  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const activeDesignerTraffic = computed(() => designerTraffic.value.filter(d => d.status));
  const inactiveDesignerTraffic = computed(() => designerTraffic.value.filter(d => !d.status));
  const totalCount = computed(() => designerTraffic.value.length);

  /**
   * Pobiera wszystkich projektantów ruchu
   * @param filters - opcjonalne filtry (status)
   */
  function getAllDesignerTraffic(filters?: { status?: boolean }): DesignerTraffic[] {
    loading.value = true;
    error.value = null;

    try {
      let result = [...designerTraffic.value];

      if (filters?.status !== undefined) {
        result = result.filter(d => d.status === filters.status);
      }

      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas pobierania projektantów ruchu';
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * Pobiera projektanta ruchu po ID
   */
  function getDesignerTraffic(id: number): DesignerTraffic | undefined {
    loading.value = true;
    error.value = null;

    try {
      return designerTraffic.value.find(d => d.id === id);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas pobierania projektanta ruchu';
      return undefined;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Dodaje nowego projektanta ruchu
   */
  function addDesignerTraffic(data: Omit<DesignerTraffic, 'id' | 'createdAt' | 'updatedAt'>): DesignerTraffic {
    loading.value = true;
    error.value = null;

    try {
      const newId = Math.max(...designerTraffic.value.map(d => d.id), 0) + 1;
      const newDesignerTraffic: DesignerTraffic = {
        ...data,
        id: newId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      designerTraffic.value.push(newDesignerTraffic);
      saveToLocalStorage(designerTraffic.value);
      return newDesignerTraffic;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas dodawania projektanta ruchu';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Aktualizuje istniejącego projektanta ruchu
   */
  function updateDesignerTraffic(
    id: number,
    updates: Partial<Omit<DesignerTraffic, 'id' | 'createdAt'>>
  ): DesignerTraffic | null {
    loading.value = true;
    error.value = null;

    try {
      const index = designerTraffic.value.findIndex(d => d.id === id);
      if (index === -1) {
        error.value = 'Projektant ruchu nie został znaleziony';
        return null;
      }

      designerTraffic.value[index] = {
        ...designerTraffic.value[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      saveToLocalStorage(designerTraffic.value);
      return designerTraffic.value[index];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas aktualizacji projektanta ruchu';
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Usuwa projektanta ruchu (lub oznacza jako nieaktywnego)
   */
  function deleteDesignerTraffic(id: number, hardDelete: boolean = false): boolean {
    loading.value = true;
    error.value = null;

    try {
      const index = designerTraffic.value.findIndex(d => d.id === id);
      if (index === -1) {
        error.value = 'Projektant ruchu nie został znaleziony';
        return false;
      }

      if (hardDelete) {
        designerTraffic.value.splice(index, 1);
      } else {
        designerTraffic.value[index].status = false;
        designerTraffic.value[index].updatedAt = new Date().toISOString();
      }

      saveToLocalStorage(designerTraffic.value);
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas usuwania projektanta ruchu';
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Wyszukuje projektantów ruchu po frazie (imię, nazwisko, email, telefon)
   */
  function searchDesignerTraffic(query: string): DesignerTraffic[] {
    if (!query.trim()) {
      return getAllDesignerTraffic();
    }

    const lowerQuery = query.toLowerCase();
    return designerTraffic.value.filter(d => {
      return (
        d.name.toLowerCase().includes(lowerQuery) ||
        d.lastName.toLowerCase().includes(lowerQuery) ||
        d.email.toLowerCase().includes(lowerQuery) ||
        d.phone.includes(query) ||
        d.phone2?.includes(query)
      );
    });
  }

  return {
    // State
    designerTraffic,
    loading,
    error,
    // Computed
    activeDesignerTraffic,
    inactiveDesignerTraffic,
    totalCount,
    // Methods
    getAllDesignerTraffic,
    getDesignerTraffic,
    addDesignerTraffic,
    updateDesignerTraffic,
    deleteDesignerTraffic,
    searchDesignerTraffic,
  };
});
