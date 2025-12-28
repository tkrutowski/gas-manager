import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import type { GasDistribution } from '../types/GasDistribution';

// Generowanie mockowanych jednostek zlecających
function generateMockGasDistributions(): GasDistribution[] {
  const names = [
    'Gniezno',
    'Piła',
    'Poznań-Południe',
    'Poznań-Północ',
    'Poznań-Wschód',
    'Śrem',
    'Leszno',
    'Gostyń',
    'Rawicz',
    'Środa Wlkp.',
    'Chodzież',
    'Kalisz',
    'Nowy Tomyśl',
    'Kępno',
    'Konin',
    'Chodzież-Czarnków',
    'Kościan-Śrem',
    'Wolsztyn',
    'Bydgoszcz',
    'Gorzów Wielkopolski',
    'Umowa Kompensacyjna',
    'Umowa poza PSG',
    'Ostrów Wlkp.',
  ];

  const representatives = [
    'Jan Kowalski',
    'Anna Nowak',
    'Piotr Wiśniewski',
    'Maria Wójcik',
    'Krzysztof Kowalczyk',
    'Katarzyna Kamińska',
    'Tomasz Lewandowski',
    'Magdalena Zielińska',
    'Paweł Szymański',
    'Agnieszka Woźniak',
    'Marcin Dąbrowski',
    'Joanna Kozłowska',
    'Michał Jankowski',
    'Ewa Mazur',
    'Łukasz Kwiatkowski',
    null,
    null,
    null,
  ];

  const infoOptions = [
    'Jednostka zlecająca z wieloletnim doświadczeniem',
    'Specjalizuje się w projektach gazowych',
    'Ekspert w zakresie instalacji przemysłowych',
    'Doświadczenie w projektach mieszkaniowych',
    'Specjalista od projektów komercyjnych',
    null,
    null,
    null,
  ];

  const distributions: GasDistribution[] = [];
  let id = 1;

  for (const name of names) {
    const distributionNumber = Math.random() > 0.3 ? `RD-${String(id).padStart(3, '0')}` : undefined;
    const representative = representatives[Math.floor(Math.random() * representatives.length)] || undefined;
    const info = infoOptions[Math.floor(Math.random() * infoOptions.length)] || undefined;
    const isActive = Math.random() > 0.1; // 90% aktywnych

    distributions.push({
      id: id++,
      name,
      distributionNumber,
      representative,
      info,
      isActive,
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  return distributions;
}

export const useGasDistributionsStore = defineStore('gasDistributions', () => {
  const gasDistributions = ref<GasDistribution[]>(generateMockGasDistributions());
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed properties
  const activeGasDistributions = computed(() => gasDistributions.value.filter(gd => gd.isActive !== false));
  const inactiveGasDistributions = computed(() => gasDistributions.value.filter(gd => gd.isActive === false));
  const totalCount = computed(() => gasDistributions.value.length);

  // Funkcje CRUD (na razie z mockowaniem, później będą używać API)

  /**
   * Pobiera wszystkie jednostki zlecające
   * @param filters - opcjonalne filtry (isActive)
   */
  function getAllGasDistributions(filters?: { isActive?: boolean }): GasDistribution[] {
    loading.value = true;
    error.value = null;

    try {
      let result = [...gasDistributions.value];

      if (filters?.isActive !== undefined) {
        result = result.filter(gd => gd.isActive === filters.isActive);
      }

      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas pobierania jednostek zlecających';
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * Pobiera jednostkę zlecającą po ID
   */
  function getGasDistribution(id: number): GasDistribution | undefined {
    loading.value = true;
    error.value = null;

    try {
      return gasDistributions.value.find(gd => gd.id === id);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas pobierania jednostki zlecającej';
      return undefined;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Dodaje nową jednostkę zlecającą
   */
  function addGasDistribution(
    gasDistribution: Omit<GasDistribution, 'id' | 'createdAt' | 'updatedAt'>
  ): GasDistribution {
    loading.value = true;
    error.value = null;

    try {
      const newId = Math.max(...gasDistributions.value.map(gd => gd.id), 0) + 1;
      const newGasDistribution: GasDistribution = {
        ...gasDistribution,
        id: newId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      gasDistributions.value.push(newGasDistribution);
      return newGasDistribution;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas dodawania jednostki zlecającej';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Aktualizuje istniejącą jednostkę zlecającą
   */
  function updateGasDistribution(
    id: number,
    updates: Partial<Omit<GasDistribution, 'id' | 'createdAt'>>
  ): GasDistribution | null {
    loading.value = true;
    error.value = null;

    try {
      const index = gasDistributions.value.findIndex(gd => gd.id === id);
      if (index === -1) {
        error.value = 'Jednostka zlecająca nie została znaleziona';
        return null;
      }

      gasDistributions.value[index] = {
        ...gasDistributions.value[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      return gasDistributions.value[index];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas aktualizacji jednostki zlecającej';
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Usuwa jednostkę zlecającą (lub oznacza jako nieaktywną)
   */
  function deleteGasDistribution(id: number, hardDelete: boolean = false): boolean {
    loading.value = true;
    error.value = null;

    try {
      const index = gasDistributions.value.findIndex(gd => gd.id === id);
      if (index === -1) {
        error.value = 'Jednostka zlecająca nie została znaleziona';
        return false;
      }

      if (hardDelete) {
        gasDistributions.value.splice(index, 1);
      } else {
        // Soft delete - tylko zmiana statusu
        gasDistributions.value[index].isActive = false;
        gasDistributions.value[index].updatedAt = new Date().toISOString();
      }

      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas usuwania jednostki zlecającej';
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Wyszukuje jednostki zlecające po frazie (nazwa, numer, przedstawiciel)
   */
  function searchGasDistributions(query: string): GasDistribution[] {
    if (!query.trim()) {
      return getAllGasDistributions();
    }

    const lowerQuery = query.toLowerCase();
    return gasDistributions.value.filter(gd => {
      return (
        gd.name.toLowerCase().includes(lowerQuery) ||
        gd.distributionNumber?.toLowerCase().includes(lowerQuery) ||
        gd.representative?.toLowerCase().includes(lowerQuery) ||
        gd.info?.toLowerCase().includes(lowerQuery)
      );
    });
  }

  return {
    // State
    gasDistributions,
    loading,
    error,
    // Computed
    activeGasDistributions,
    inactiveGasDistributions,
    totalCount,
    // Methods
    getAllGasDistributions,
    getGasDistribution,
    addGasDistribution,
    updateGasDistribution,
    deleteGasDistribution,
    searchGasDistributions,
  };
});
