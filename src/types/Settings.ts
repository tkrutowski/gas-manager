/**
 * Bazowy interfejs dla ustawień modułu
 */
export interface ModuleSettings {
  moduleName: string;
  version: string;
  updatedAt: string;
}

/**
 * Ustawienia domyślne dla modułu GasConnection
 */
export interface GasConnectionDefaultSettings extends ModuleSettings {
  moduleName: 'gasConnection';
  defaults: {
    customer?: {
      id: number;
    };
    endCustomer?: {
      id: number;
    };
    designer?: {
      id: number;
    };
    coordinator?: {
      id: number;
    };
    coordinatorProject?: {
      id: number;
    };
    gasDistribution?: {
      id: number;
    };
    isPGN?: boolean;
  };
}

/**
 * Unia typów dla wszystkich modułów (łatwe rozszerzanie)
 */
export type AppDefaultSettings = GasConnectionDefaultSettings; // | OtherModuleSettings | ...

/**
 * Struktura przechowywania w localStorage
 */
export interface SettingsStorage {
  [moduleName: string]: AppDefaultSettings;
}

