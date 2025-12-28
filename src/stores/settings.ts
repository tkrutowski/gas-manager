import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { settingsService } from '@/services/settingsService';
import type { GasConnectionDefaultSettings } from '@/types/Settings';
import { useCustomersStore } from './customers';
import { useDesignersStore } from './designers';
import { useCoordinatorsStore } from './coordinators';
import { useGasDistributionsStore } from './gasDistributions';

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
   * Zapisuje domyślnego klienta (zleceniodawcę) dla GasConnection
   */
  function setDefaultCustomer(customerId: number): void {
    loading.value = true;
    error.value = null;

    try {
      settingsService.updateModuleSetting<GasConnectionDefaultSettings>('gasConnection', () => ({
        customer: { id: customerId },
      }));
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas zapisywania ustawień';
    } finally {
      loading.value = false;
    }
  }

  /**
   * Usuwa domyślnego klienta
   */
  function removeDefaultCustomer(): void {
    loading.value = true;
    error.value = null;

    try {
      const currentSettings = getGasConnectionSettings.value;
      if (currentSettings) {
        const { customer, ...rest } = currentSettings.defaults;
        // Tworzymy nowy obiekt defaults bez customer
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
   * Zapisuje domyślnego klienta końcowego dla GasConnection
   */
  function setDefaultEndCustomer(customerId: number): void {
    loading.value = true;
    error.value = null;

    try {
      settingsService.updateModuleSetting<GasConnectionDefaultSettings>('gasConnection', () => ({
        endCustomer: { id: customerId },
      }));
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas zapisywania ustawień';
    } finally {
      loading.value = false;
    }
  }

  /**
   * Usuwa domyślnego klienta końcowego
   */
  function removeDefaultEndCustomer(): void {
    loading.value = true;
    error.value = null;

    try {
      const currentSettings = getGasConnectionSettings.value;
      if (currentSettings) {
        const { endCustomer, ...rest } = currentSettings.defaults;
        // Tworzymy nowy obiekt defaults bez endCustomer
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
   * Zapisuje domyślnego projektanta dla GasConnection
   */
  function setDefaultDesigner(designerId: number): void {
    loading.value = true;
    error.value = null;

    try {
      settingsService.updateModuleSetting<GasConnectionDefaultSettings>('gasConnection', () => ({
        designer: { id: designerId },
      }));
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas zapisywania ustawień';
    } finally {
      loading.value = false;
    }
  }

  /**
   * Usuwa domyślnego projektanta
   */
  function removeDefaultDesigner(): void {
    loading.value = true;
    error.value = null;

    try {
      const currentSettings = getGasConnectionSettings.value;
      if (currentSettings) {
        const { designer, ...rest } = currentSettings.defaults;
        // Tworzymy nowy obiekt defaults bez designer
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
   * Zapisuje domyślnego koordynatora dla GasConnection
   */
  function setDefaultCoordinator(coordinatorId: number): void {
    loading.value = true;
    error.value = null;

    try {
      settingsService.updateModuleSetting<GasConnectionDefaultSettings>('gasConnection', () => ({
        coordinator: { id: coordinatorId },
      }));
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas zapisywania ustawień';
    } finally {
      loading.value = false;
    }
  }

  /**
   * Usuwa domyślnego koordynatora
   */
  function removeDefaultCoordinator(): void {
    loading.value = true;
    error.value = null;

    try {
      const currentSettings = getGasConnectionSettings.value;
      if (currentSettings) {
        const { coordinator, ...rest } = currentSettings.defaults;
        // Tworzymy nowy obiekt defaults bez coordinator
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
   * Zapisuje domyślnego koordynatora projektu dla GasConnection
   */
  function setDefaultCoordinatorProject(coordinatorId: number): void {
    loading.value = true;
    error.value = null;

    try {
      settingsService.updateModuleSetting<GasConnectionDefaultSettings>('gasConnection', () => ({
        coordinatorProject: { id: coordinatorId },
      }));
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas zapisywania ustawień';
    } finally {
      loading.value = false;
    }
  }

  /**
   * Usuwa domyślnego koordynatora projektu
   */
  function removeDefaultCoordinatorProject(): void {
    loading.value = true;
    error.value = null;

    try {
      const currentSettings = getGasConnectionSettings.value;
      if (currentSettings) {
        const { coordinatorProject, ...rest } = currentSettings.defaults;
        // Tworzymy nowy obiekt defaults bez coordinatorProject
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
   * Zapisuje domyślną jednostkę zlecającą dla GasConnection
   */
  function setDefaultGasDistribution(gasDistributionId: number): void {
    loading.value = true;
    error.value = null;

    try {
      settingsService.updateModuleSetting<GasConnectionDefaultSettings>('gasConnection', () => ({
        gasDistribution: { id: gasDistributionId },
      }));
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas zapisywania ustawień';
    } finally {
      loading.value = false;
    }
  }

  /**
   * Usuwa domyślną jednostkę zlecającą
   */
  function removeDefaultGasDistribution(): void {
    loading.value = true;
    error.value = null;

    try {
      const currentSettings = getGasConnectionSettings.value;
      if (currentSettings) {
        const { gasDistribution, ...rest } = currentSettings.defaults;
        // Tworzymy nowy obiekt defaults bez gasDistribution
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
   * Zapisuje domyślną wartość PGN dla GasConnection
   */
  function setDefaultIsPGN(isPGN: boolean): void {
    loading.value = true;
    error.value = null;

    try {
      settingsService.updateModuleSetting<GasConnectionDefaultSettings>('gasConnection', () => ({
        isPGN,
      }));
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas zapisywania ustawień';
    } finally {
      loading.value = false;
    }
  }

  /**
   * Usuwa domyślną wartość PGN
   */
  function removeDefaultIsPGN(): void {
    loading.value = true;
    error.value = null;

    try {
      const currentSettings = getGasConnectionSettings.value;
      if (currentSettings) {
        const { isPGN, ...rest } = currentSettings.defaults;
        // Tworzymy nowy obiekt defaults bez isPGN
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
    loading.value = true;
    error.value = null;

    try {
      const currentSettings = getGasConnectionSettings.value;
      const currentDefaults = currentSettings?.defaults || {};
      
      // Tworzymy nowy obiekt defaults, zaczynając od aktualnych wartości
      let newDefaults: GasConnectionDefaultSettings['defaults'] = { ...currentDefaults };
      
      // Aktualizujemy wartości - jeśli undefined, usuwamy właściwość
      if (data.designerId !== undefined) {
        if (data.designerId) {
          newDefaults.designer = { id: data.designerId };
        } else {
          const { designer, ...rest } = newDefaults;
          newDefaults = rest;
        }
      }
      if (data.coordinatorId !== undefined) {
        if (data.coordinatorId) {
          newDefaults.coordinator = { id: data.coordinatorId };
        } else {
          const { coordinator, ...rest } = newDefaults;
          newDefaults = rest;
        }
      }
      if (data.coordinatorProjectId !== undefined) {
        if (data.coordinatorProjectId) {
          newDefaults.coordinatorProject = { id: data.coordinatorProjectId };
        } else {
          const { coordinatorProject, ...rest } = newDefaults;
          newDefaults = rest;
        }
      }
      if (data.isPGN !== undefined) {
        newDefaults.isPGN = data.isPGN;
      }

      // Zapisujemy zaktualizowane ustawienia
      if (currentSettings) {
        currentSettings.defaults = newDefaults;
        settingsService.saveModuleSettings(currentSettings);
      } else {
        // Jeśli nie ma ustawień, tworzymy nowe
        const newSettings: GasConnectionDefaultSettings = {
          moduleName: 'gasConnection',
          version: '1.0.0',
          updatedAt: new Date().toISOString(),
          defaults: newDefaults,
        };
        settingsService.saveModuleSettings(newSettings);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas zapisywania ustawień';
    } finally {
      loading.value = false;
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
   * Pobiera pełne dane domyślnego klienta (z store)
   */
  function getDefaultCustomerData() {
    const settings = getGasConnectionSettings.value;
    if (!settings?.defaults.customer) return null;

    const customersStore = useCustomersStore();
    return customersStore.getCustomer(settings.defaults.customer.id);
  }

  /**
   * Pobiera pełne dane domyślnego klienta końcowego (z store)
   */
  function getDefaultEndCustomerData() {
    const settings = getGasConnectionSettings.value;
    if (!settings?.defaults.endCustomer) return null;

    const customersStore = useCustomersStore();
    return customersStore.getCustomer(settings.defaults.endCustomer.id);
  }

  /**
   * Pobiera pełne dane domyślnego projektanta (z store)
   */
  function getDefaultDesignerData() {
    const settings = getGasConnectionSettings.value;
    if (!settings?.defaults.designer) return null;

    const designersStore = useDesignersStore();
    return designersStore.getDesigner(settings.defaults.designer.id);
  }

  /**
   * Pobiera pełne dane domyślnego koordynatora (z store)
   */
  function getDefaultCoordinatorData() {
    const settings = getGasConnectionSettings.value;
    if (!settings?.defaults.coordinator) return null;

    const coordinatorsStore = useCoordinatorsStore();
    return coordinatorsStore.getCoordinator(settings.defaults.coordinator.id);
  }

  /**
   * Pobiera pełne dane domyślnego koordynatora projektu (z store)
   */
  function getDefaultCoordinatorProjectData() {
    const settings = getGasConnectionSettings.value;
    if (!settings?.defaults.coordinatorProject) return null;

    const coordinatorsStore = useCoordinatorsStore();
    return coordinatorsStore.getCoordinator(settings.defaults.coordinatorProject.id);
  }

  /**
   * Pobiera pełne dane domyślnej jednostki zlecającej (z store)
   */
  function getDefaultGasDistributionData() {
    const settings = getGasConnectionSettings.value;
    if (!settings?.defaults.gasDistribution) return null;

    const gasDistributionsStore = useGasDistributionsStore();
    return gasDistributionsStore.getGasDistribution(settings.defaults.gasDistribution.id);
  }

  /**
   * Pobiera wszystkie domyślne wartości dla nowego GasConnection
   * (używane tylko przy tworzeniu, nie przy edycji)
   */
  function getGasConnectionDefaults() {
    const settings = getGasConnectionSettings.value;
    if (!settings) return {};

    const customersStore = useCustomersStore();
    const designersStore = useDesignersStore();
    const coordinatorsStore = useCoordinatorsStore();
    const gasDistributionsStore = useGasDistributionsStore();

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
      defaults.customer = customersStore.getCustomer(settings.defaults.customer.id);
    }
    if (settings.defaults.endCustomer) {
      defaults.endCustomer = customersStore.getCustomer(settings.defaults.endCustomer.id);
    }
    if (settings.defaults.designer) {
      defaults.designer = designersStore.getDesigner(settings.defaults.designer.id);
    }
    if (settings.defaults.coordinator) {
      defaults.coordinator = coordinatorsStore.getCoordinator(settings.defaults.coordinator.id);
    }
    if (settings.defaults.coordinatorProject) {
      defaults.coordinatorProject = coordinatorsStore.getCoordinator(settings.defaults.coordinatorProject.id);
    }
    if (settings.defaults.gasDistribution) {
      defaults.gasDistribution = gasDistributionsStore.getGasDistribution(settings.defaults.gasDistribution.id);
    }
    if (settings.defaults.isPGN !== undefined) {
      defaults.isPGN = settings.defaults.isPGN;
    }

    return defaults;
  }

  return {
    // State
    loading,
    error,
    // Computed
    getGasConnectionSettings,
    // Methods - Customer
    setDefaultCustomer,
    removeDefaultCustomer,
    getDefaultCustomerData,
    // Methods - End Customer
    setDefaultEndCustomer,
    removeDefaultEndCustomer,
    getDefaultEndCustomerData,
    // Methods - Designer
    setDefaultDesigner,
    removeDefaultDesigner,
    getDefaultDesignerData,
    // Methods - Coordinator
    setDefaultCoordinator,
    removeDefaultCoordinator,
    getDefaultCoordinatorData,
    // Methods - Coordinator Project
    setDefaultCoordinatorProject,
    removeDefaultCoordinatorProject,
    getDefaultCoordinatorProjectData,
    // Methods - Gas Distribution
    setDefaultGasDistribution,
    removeDefaultGasDistribution,
    getDefaultGasDistributionData,
    // Methods - PGN
    setDefaultIsPGN,
    removeDefaultIsPGN,
    // Methods - Team
    setTeamDefaults,
    removeTeamDefaults,
    // Methods - All defaults
    getGasConnectionDefaults,
  };
});

