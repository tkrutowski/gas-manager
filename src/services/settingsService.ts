import type { AppDefaultSettings, SettingsStorage, GasConnectionDefaultSettings, GasConnectionTableSettings } from '@/types/Settings';

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
    updateFn: (settings: T | null) => Partial<T['defaults']>
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
      } as T;
      this.saveModuleSettings(newSettings);
      return;
    }

    // Aktualizujemy istniejące ustawienia
    currentSettings.defaults = { ...currentSettings.defaults, ...updatedDefaults };
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
  updateTableColumnConfig(
    moduleName: string,
    columns: GasConnectionTableSettings['columns']
  ): void {
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
}

export const settingsService = new SettingsService();

