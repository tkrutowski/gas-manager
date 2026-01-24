import type {
  AppDefaultSettings,
  SettingsStorage,
  GasConnectionTableSettings,
  GasConnectionStageSettings,
  StageCardConfig,
  CustomerTableSettings,
} from '@/types/Settings';

const SETTINGS_STORAGE_KEY = 'appDefaultSettings';

class SettingsService {
  /**
   * Pobiera wszystkie ustawienia z localStorage
   */
  getAllSettings(): SettingsStorage {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!stored) return {};
      return JSON.parse(stored);
    } catch (error) {
      console.error('Błąd podczas wczytywania ustawień:', error);
      return {};
    }
  }

  /**
   * Pobiera ustawienia dla konkretnego modułu
   */
  getModuleSettings<T extends AppDefaultSettings>(moduleName: string): T | null {
    const allSettings = this.getAllSettings();
    return (allSettings[moduleName] as T) || null;
  }

  /**
   * Zapisuje ustawienia dla modułu
   */
  saveModuleSettings(settings: AppDefaultSettings): void {
    try {
      const allSettings = this.getAllSettings();
      allSettings[settings.moduleName] = {
        ...settings,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(allSettings));
    } catch (error) {
      console.error('Błąd podczas zapisywania ustawień:', error);
      throw error;
    }
  }

  /**
   * Aktualizuje konkretne ustawienie w module
   */
  updateModuleSetting<T extends AppDefaultSettings>(
    moduleName: string,
    updateFn: (settings: T | null) => Partial<T extends { defaults: infer D } ? D : never>
  ): void {
    const currentSettings = this.getModuleSettings<T>(moduleName);
    const updatedDefaults = updateFn(currentSettings);

    if (!currentSettings) {
      // Tworzymy nowe ustawienia jeśli nie istnieją
      const newSettings = {
        moduleName,
        version: '1.0.0',
        updatedAt: new Date().toISOString(),
        defaults: updatedDefaults,
      } as unknown as T;
      this.saveModuleSettings(newSettings);
      return;
    }

    // Aktualizujemy istniejące ustawienia tylko jeśli mają właściwość defaults
    if ('defaults' in currentSettings && typeof currentSettings === 'object' && currentSettings !== null) {
      const settingsWithDefaults = currentSettings as T & { defaults: Record<string, unknown> };
      if (settingsWithDefaults.defaults) {
        settingsWithDefaults.defaults = { ...settingsWithDefaults.defaults, ...updatedDefaults };
      }
    }
    this.saveModuleSettings(currentSettings);
  }

  /**
   * Usuwa ustawienia dla modułu
   */
  removeModuleSettings(moduleName: string): void {
    const allSettings = this.getAllSettings();
    delete allSettings[moduleName];
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(allSettings));
  }

  /**
   * Czyści wszystkie ustawienia
   */
  clearAllSettings(): void {
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
  }

  /**
   * Eksportuje ustawienia do JSON (przydatne do backupu)
   */
  exportSettings(): string {
    return JSON.stringify(this.getAllSettings(), null, 2);
  }

  /**
   * Importuje ustawienia z JSON
   */
  importSettings(json: string): void {
    try {
      const settings = JSON.parse(json) as SettingsStorage;
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Błąd podczas importowania ustawień:', error);
      throw error;
    }
  }

  /**
   * Pobiera ustawienia tabeli dla konkretnego modułu
   */
  getTableSettings(moduleName: string): GasConnectionTableSettings | null {
    return this.getModuleSettings<GasConnectionTableSettings>(moduleName);
  }

  /**
   * Zapisuje ustawienia tabeli
   */
  saveTableSettings(settings: GasConnectionTableSettings): void {
    this.saveModuleSettings(settings);
  }

  /**
   * Aktualizuje konfigurację kolumn tabeli
   */
  updateTableColumnConfig(moduleName: string, columns: GasConnectionTableSettings['columns']): void {
    const currentSettings = this.getTableSettings(moduleName);

    if (!currentSettings) {
      // Tworzymy nowe ustawienia jeśli nie istnieją
      const newSettings: GasConnectionTableSettings = {
        moduleName: 'gasConnectionTable',
        version: '1.0.0',
        updatedAt: new Date().toISOString(),
        columns: columns,
      };
      this.saveTableSettings(newSettings);
      return;
    }

    // Aktualizujemy istniejące ustawienia
    currentSettings.columns = columns;
    this.saveTableSettings(currentSettings);
  }

  /**
   * Aktualizuje pełne ustawienia tabeli (kolumny + sortowanie + filtr + ulubione)
   */
  updateTableSettings(
    moduleName: string,
    settings: Partial<
      Pick<
        GasConnectionTableSettings,
        'columns' | 'defaultSortField' | 'defaultSortOrder' | 'defaultFilter' | 'favoriteConnectionIds'
      >
    >
  ): void {
    const currentSettings = this.getTableSettings(moduleName);

    if (!currentSettings) {
      // Tworzymy nowe ustawienia jeśli nie istnieją
      const newSettings: GasConnectionTableSettings = {
        moduleName: 'gasConnectionTable',
        version: '1.0.0',
        updatedAt: new Date().toISOString(),
        columns: settings.columns || [],
        defaultSortField: settings.defaultSortField,
        defaultSortOrder: settings.defaultSortOrder,
        defaultFilter: settings.defaultFilter,
        favoriteConnectionIds: settings.favoriteConnectionIds ?? [],
      };
      this.saveTableSettings(newSettings);
      return;
    }

    // Aktualizujemy istniejące ustawienia
    if (settings.columns !== undefined) {
      currentSettings.columns = settings.columns;
    }
    if (settings.defaultSortField !== undefined) {
      currentSettings.defaultSortField = settings.defaultSortField;
    }
    if (settings.defaultSortOrder !== undefined) {
      currentSettings.defaultSortOrder = settings.defaultSortOrder;
    }
    if (settings.defaultFilter !== undefined) {
      currentSettings.defaultFilter = settings.defaultFilter;
    }
    if (settings.favoriteConnectionIds !== undefined) {
      currentSettings.favoriteConnectionIds = settings.favoriteConnectionIds;
    }
    this.saveTableSettings(currentSettings);
  }

  /**
   * Pobiera ustawienia tabeli klientów
   */
  getCustomerTableSettings(): CustomerTableSettings | null {
    return this.getModuleSettings<CustomerTableSettings>('customerTable');
  }

  /**
   * Aktualizuje ustawienia tabeli klientów (sortowanie, filtr, ulubieni, auto-save)
   */
  updateCustomerTableSettings(
    settings: Partial<
      Pick<
        CustomerTableSettings,
        | 'defaultSortField'
        | 'defaultSortOrder'
        | 'defaultFilter'
        | 'favoriteCustomerIds'
        | 'autoSaveSettings'
      >
    >
  ): void {
    const current = this.getCustomerTableSettings();
    if (!current) {
      const newSettings: CustomerTableSettings = {
        moduleName: 'customerTable',
        version: '1.0.0',
        updatedAt: new Date().toISOString(),
        defaultSortField: settings.defaultSortField,
        defaultSortOrder: settings.defaultSortOrder,
        defaultFilter: settings.defaultFilter,
        favoriteCustomerIds: settings.favoriteCustomerIds ?? [],
        autoSaveSettings: settings.autoSaveSettings ?? false,
      };
      this.saveModuleSettings(newSettings);
      return;
    }
    if (settings.defaultSortField !== undefined) current.defaultSortField = settings.defaultSortField;
    if (settings.defaultSortOrder !== undefined) current.defaultSortOrder = settings.defaultSortOrder;
    if (settings.defaultFilter !== undefined) current.defaultFilter = settings.defaultFilter;
    if (settings.favoriteCustomerIds !== undefined) current.favoriteCustomerIds = settings.favoriteCustomerIds;
    if (settings.autoSaveSettings !== undefined) current.autoSaveSettings = settings.autoSaveSettings;
    this.saveModuleSettings(current);
  }

  /**
   * Pobiera ustawienia etapów dla modułu GasConnection
   */
  getStageSettings(): GasConnectionStageSettings | null {
    return this.getModuleSettings<GasConnectionStageSettings>('gasConnectionStages');
  }

  /**
   * Pobiera konfigurację Cardów dla konkretnego etapu
   */
  getStageCardConfigs(stageId: string): StageCardConfig[] | null {
    const stageSettings = this.getStageSettings();
    if (!stageSettings || !stageSettings.stages) {
      return null;
    }
    return stageSettings.stages[stageId] || null;
  }

  /**
   * Zapisuje konfigurację Cardów dla konkretnego etapu
   */
  saveStageSettings(stageId: string, cards: StageCardConfig[]): void {
    const currentSettings = this.getStageSettings();

    if (!currentSettings) {
      // Tworzymy nowe ustawienia jeśli nie istnieją
      const newSettings: GasConnectionStageSettings = {
        moduleName: 'gasConnectionStages',
        version: '1.0.0',
        updatedAt: new Date().toISOString(),
        stages: {
          [stageId]: cards,
        },
      };
      this.saveModuleSettings(newSettings);
      return;
    }

    // Aktualizujemy istniejące ustawienia
    currentSettings.stages = {
      ...currentSettings.stages,
      [stageId]: cards,
    };
    this.saveModuleSettings(currentSettings);
  }
}

export const settingsService = new SettingsService();
