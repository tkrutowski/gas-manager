import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { settingsService } from '@/services/settingsService';
import type {
  GasConnectionDefaultSettings,
  GasConnectionTableSettings,
  GasConnectionTableColumnConfig,
  StageCardConfig,
} from '@/types/Settings';
import { useCustomersStore } from './customers';
import { useDesignersStore } from './designers';
import { useCoordinatorsStore } from './coordinators';
import { useGasDistributionsStore } from './gasDistributions';

// Typy dla kluczy w defaults
type DefaultValueKey = keyof GasConnectionDefaultSettings['defaults'];
type IDBasedKey = 'customer' | 'endCustomer' | 'designer' | 'coordinator' | 'coordinatorProject' | 'gasDistribution';

/**
 * Mapa określająca, który store i metodę użyć do pobrania danych dla danego pola
 */
const DEFAULT_VALUE_RESOLVERS: Record<
  IDBasedKey,
  {
    store: () =>
      | ReturnType<typeof useCustomersStore>
      | ReturnType<typeof useDesignersStore>
      | ReturnType<typeof useCoordinatorsStore>
      | ReturnType<typeof useGasDistributionsStore>;
    getMethod: string;
  }
> = {
  customer: {
    store: () => useCustomersStore(),
    getMethod: 'getCustomer',
  },
  endCustomer: {
    store: () => useCustomersStore(),
    getMethod: 'getCustomer',
  },
  designer: {
    store: () => useDesignersStore(),
    getMethod: 'getDesigner',
  },
  coordinator: {
    store: () => useCoordinatorsStore(),
    getMethod: 'getCoordinator',
  },
  coordinatorProject: {
    store: () => useCoordinatorsStore(),
    getMethod: 'getCoordinator',
  },
  gasDistribution: {
    store: () => useGasDistributionsStore(),
    getMethod: 'getGasDistribution',
  },
};

export const useSettingsStore = defineStore('settings', () => {
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Pobiera ustawienia dla modułu GasConnection
   */
  const getGasConnectionSettings = computed((): GasConnectionDefaultSettings | null => {
    return settingsService.getModuleSettings<GasConnectionDefaultSettings>('gasConnection');
  });

  /**
   * Generyczna metoda do ustawiania wartości domyślnej
   */
  function setDefaultValue(key: DefaultValueKey, value: number | boolean | string): void {
    loading.value = true;
    error.value = null;

    try {
      settingsService.updateModuleSetting<GasConnectionDefaultSettings>('gasConnection', () => {
        // Dla pól opartych na ID (number) - zapis jako { [key]: { id: number } }
        if (typeof value === 'number') {
          return { [key]: { id: value } } as Partial<GasConnectionDefaultSettings['defaults']>;
        }
        // Dla pól boolean lub string - zapis bezpośredni jako wartość
        return { [key]: value } as Partial<GasConnectionDefaultSettings['defaults']>;
      });
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas zapisywania ustawień';
    } finally {
      loading.value = false;
    }
  }

  /**
   * Generyczna metoda do usuwania wartości domyślnej
   */
  function removeDefaultValue(key: DefaultValueKey): void {
    loading.value = true;
    error.value = null;

    try {
      const currentSettings = getGasConnectionSettings.value;
      if (currentSettings) {
        const { [key]: _, ...rest } = currentSettings.defaults;
        // Tworzymy nowy obiekt defaults bez usuniętej właściwości
        currentSettings.defaults = rest;
        settingsService.saveModuleSettings(currentSettings);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas usuwania ustawień';
    } finally {
      loading.value = false;
    }
  }

  /**
   * Zapisuje wszystkie wartości domyślne dla sekcji "Zespół Projektowy"
   */
  function setTeamDefaults(data: {
    designerId?: number;
    coordinatorId?: number;
    coordinatorProjectId?: number;
    isPGN?: boolean;
  }): void {
    // Używamy generycznych metod do ustawiania/usuwania wartości
    if (data.designerId !== undefined) {
      if (data.designerId) {
        setDefaultValue('designer', data.designerId);
      } else {
        removeDefaultValue('designer');
      }
    }
    if (data.coordinatorId !== undefined) {
      if (data.coordinatorId) {
        setDefaultValue('coordinator', data.coordinatorId);
      } else {
        removeDefaultValue('coordinator');
      }
    }
    if (data.coordinatorProjectId !== undefined) {
      if (data.coordinatorProjectId) {
        setDefaultValue('coordinatorProject', data.coordinatorProjectId);
      } else {
        removeDefaultValue('coordinatorProject');
      }
    }
    if (data.isPGN !== undefined) {
      setDefaultValue('isPGN', data.isPGN);
    }
  }

  /**
   * Usuwa wszystkie wartości domyślne dla sekcji "Zespół Projektowy"
   */
  function removeTeamDefaults(): void {
    loading.value = true;
    error.value = null;

    try {
      const currentSettings = getGasConnectionSettings.value;
      if (currentSettings) {
        const { designer, coordinator, coordinatorProject, isPGN, ...rest } = currentSettings.defaults;
        // Tworzymy nowy obiekt defaults bez wartości zespołu
        currentSettings.defaults = rest;
        settingsService.saveModuleSettings(currentSettings);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas usuwania ustawień';
    } finally {
      loading.value = false;
    }
  }

  /**
   * Generyczna metoda do pobierania pełnych danych wartości domyślnej
   */
  function getDefaultValueData(key: IDBasedKey) {
    const settings = getGasConnectionSettings.value;
    if (!settings?.defaults[key]) return null;

    const resolver = DEFAULT_VALUE_RESOLVERS[key];
    if (!resolver) return null;

    const store = resolver.store();
    const id = (settings.defaults[key] as { id: number }).id;

    // Wywołanie odpowiedniej metody w zależności od klucza
    if (key === 'customer' || key === 'endCustomer') {
      return (store as ReturnType<typeof useCustomersStore>).getCustomer(id);
    } else if (key === 'designer') {
      return (store as ReturnType<typeof useDesignersStore>).getDesigner(id);
    } else if (key === 'coordinator' || key === 'coordinatorProject') {
      return (store as ReturnType<typeof useCoordinatorsStore>).getCoordinator(id);
    } else if (key === 'gasDistribution') {
      return (store as ReturnType<typeof useGasDistributionsStore>).getGasDistribution(id);
    }

    return null;
  }

  /**
   * Pobiera wszystkie domyślne wartości dla nowego GasConnection
   * (używane tylko przy tworzeniu, nie przy edycji)
   */
  function getGasConnectionDefaults() {
    const settings = getGasConnectionSettings.value;
    if (!settings) return {};

    const defaults: Partial<{
      customer: any;
      endCustomer: any;
      designer: any;
      coordinator: any;
      coordinatorProject: any;
      gasDistribution: any;
      isPGN: boolean;
    }> = {};

    if (settings.defaults.customer) {
      defaults.customer = getDefaultValueData('customer');
    }
    if (settings.defaults.endCustomer) {
      defaults.endCustomer = getDefaultValueData('endCustomer');
    }
    if (settings.defaults.designer) {
      defaults.designer = getDefaultValueData('designer');
    }
    if (settings.defaults.coordinator) {
      defaults.coordinator = getDefaultValueData('coordinator');
    }
    if (settings.defaults.coordinatorProject) {
      defaults.coordinatorProject = getDefaultValueData('coordinatorProject');
    }
    if (settings.defaults.gasDistribution) {
      defaults.gasDistribution = getDefaultValueData('gasDistribution');
    }
    if (settings.defaults.isPGN !== undefined) {
      defaults.isPGN = settings.defaults.isPGN;
    }

    return defaults;
  }

  /**
   * Pobiera ustawienia tabeli dla GasConnection
   */
  const getGasConnectionTableSettings = computed((): GasConnectionTableSettings | null => {
    return settingsService.getTableSettings('gasConnectionTable');
  });

  /**
   * Zapisuje konfigurację kolumn tabeli
   */
  function saveGasConnectionTableSettings(
    columns: GasConnectionTableColumnConfig[],
    defaultSortField?: string,
    defaultSortOrder?: number,
    defaultFilter?: import('@/types/Settings').GasConnectionTableFilter
  ): void {
    loading.value = true;
    error.value = null;

    try {
      settingsService.updateTableSettings('gasConnectionTable', {
        columns,
        defaultSortField,
        defaultSortOrder,
        defaultFilter,
      });
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas zapisywania ustawień tabeli';
    } finally {
      loading.value = false;
    }
  }

  /**
   * Przywraca domyślną konfigurację tabeli
   */
  function resetGasConnectionTableSettings(): void {
    loading.value = true;
    error.value = null;

    try {
      // Domyślna konfiguracja zostanie utworzona w komponencie
      settingsService.removeModuleSettings('gasConnectionTable');
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas resetowania ustawień tabeli';
    } finally {
      loading.value = false;
    }
  }

  /**
   * Pobiera konfigurację Cardów dla konkretnego etapu
   */
  function getStageSettings(stageId: string): StageCardConfig[] | null {
    return settingsService.getStageCardConfigs(stageId);
  }

  /**
   * Zapisuje konfigurację Cardów dla konkretnego etapu
   */
  function saveStageSettings(stageId: string, cards: StageCardConfig[]): void {
    loading.value = true;
    error.value = null;

    try {
      settingsService.saveStageSettings(stageId, cards);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas zapisywania ustawień etapu';
    } finally {
      loading.value = false;
    }
  }

  return {
    // State
    loading,
    error,
    // Computed
    getGasConnectionSettings,
    getGasConnectionTableSettings,
    // Methods - Generic
    setDefaultValue,
    removeDefaultValue,
    getDefaultValueData,
    // Methods - Team
    setTeamDefaults,
    removeTeamDefaults,
    // Methods - All defaults
    getGasConnectionDefaults,
    // Methods - Table Settings
    saveGasConnectionTableSettings,
    resetGasConnectionTableSettings,
    // Methods - Stage Settings
    getStageSettings,
    saveStageSettings,
  };
});
