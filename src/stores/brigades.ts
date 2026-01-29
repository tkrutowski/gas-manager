import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import type { Brigade } from '../types/Brigade';

// Klucz localStorage dla brygad
const STORAGE_KEY = 'gas-manager:brigades';

// Funkcja pomocnicza do ładowania danych z localStorage
function loadFromLocalStorage(): Brigade[] | null {
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
    console.warn('Błąd podczas ładowania brygad z localStorage:', err);
    return null;
  }
}

// Funkcja pomocnicza do zapisywania danych do localStorage
function saveToLocalStorage(data: Brigade[]): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Błąd podczas zapisywania brygad do localStorage:', err);
  }
}

// Generowanie 3 mockowanych brygad
function generateMockBrigades(): Brigade[] {
  return [
    {
      id: 1,
      name: 'Brygada 1',
      isActive: true,
    },
    {
      id: 2,
      name: 'Brygada 2',
      isActive: true,
    },
    {
      id: 3,
      name: 'Brygada 3',
      isActive: true,
    },
  ];
}

export const useBrigadesStore = defineStore('brigades', () => {
  // Ładowanie danych z localStorage lub generowanie nowych
  const loadedData = loadFromLocalStorage();
  const initialData = loadedData ?? generateMockBrigades();
  const brigades = ref<Brigade[]>(initialData);

  // Zapisanie wygenerowanych danych do localStorage jeśli nie były tam wcześniej
  if (!loadedData) {
    saveToLocalStorage(brigades.value);
  }

  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed properties
  const activeBrigades = computed(() => brigades.value.filter(b => b.isActive));
  const inactiveBrigades = computed(() => brigades.value.filter(b => !b.isActive));
  const totalCount = computed(() => brigades.value.length);

  /**
   * Pobiera wszystkie brygady
   * @param filters - opcjonalne filtry (isActive)
   */
  function getAllBrigades(filters?: { isActive?: boolean }): Brigade[] {
    loading.value = true;
    error.value = null;

    try {
      let result = [...brigades.value];

      if (filters?.isActive !== undefined) {
        result = result.filter(b => b.isActive === filters.isActive);
      }

      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas pobierania brygad';
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * Pobiera brygadę po ID
   */
  function getBrigade(id: number): Brigade | undefined {
    loading.value = true;
    error.value = null;

    try {
      return brigades.value.find(b => b.id === id);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas pobierania brygady';
      return undefined;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Dodaje nową brygadę
   */
  function addBrigade(brigade: Omit<Brigade, 'id'>): Brigade {
    loading.value = true;
    error.value = null;

    try {
      const newId = Math.max(...brigades.value.map(b => b.id), 0) + 1;
      const newBrigade: Brigade = {
        ...brigade,
        id: newId,
      };

      brigades.value.push(newBrigade);
      saveToLocalStorage(brigades.value);
      return newBrigade;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas dodawania brygady';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Aktualizuje istniejącą brygadę
   */
  function updateBrigade(id: number, updates: Partial<Omit<Brigade, 'id'>>): Brigade | null {
    loading.value = true;
    error.value = null;

    try {
      const index = brigades.value.findIndex(b => b.id === id);
      if (index === -1) {
        error.value = 'Brygada nie została znaleziona';
        return null;
      }

      brigades.value[index] = {
        ...brigades.value[index],
        ...updates,
      };

      saveToLocalStorage(brigades.value);
      return brigades.value[index];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas aktualizacji brygady';
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Usuwa brygadę (lub oznacza jako nieaktywną)
   */
  function deleteBrigade(id: number, hardDelete: boolean = false): boolean {
    loading.value = true;
    error.value = null;

    try {
      const index = brigades.value.findIndex(b => b.id === id);
      if (index === -1) {
        error.value = 'Brygada nie została znaleziona';
        return false;
      }

      if (hardDelete) {
        brigades.value.splice(index, 1);
      } else {
        // Soft delete - tylko zmiana statusu
        brigades.value[index].isActive = false;
      }

      saveToLocalStorage(brigades.value);
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas usuwania brygady';
      return false;
    } finally {
      loading.value = false;
    }
  }

  return {
    // State
    brigades,
    loading,
    error,
    // Computed
    activeBrigades,
    inactiveBrigades,
    totalCount,
    // Methods
    getAllBrigades,
    getBrigade,
    addBrigade,
    updateBrigade,
    deleteBrigade,
  };
});
