/**
 * Bazowy interfejs dla ustawień modułu
 */
export interface ModuleSettings {
  moduleName: string;
  version: string;
  updatedAt: string;
}

/**
 * Ustawienia danych firmy
 */
export interface CompanySettings extends ModuleSettings {
  moduleName: 'companySettings';
  company: {
    name: string;
    taxId: string; // NIP
    regon?: string;
    krs?: string;
    address: {
      street: string;
      zipCode: string;
      city: string;
    };
    phones: string[];
    emails: string[];
    bankAccounts: {
      name?: string;
      iban: string;
    }[];
  };
}

/**
 * Ustawienia informacji o aplikacji
 */
export interface AppInfoSettings extends ModuleSettings {
  moduleName: 'appInfo';
  appName: string;
  appVersion: string;
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
 * Konfiguracja kolumny tabeli
 */
export interface GasConnectionTableColumnConfig {
  field: string; // unikalny identyfikator kolumny
  header: string; // nagłówek kolumny
  visible: boolean; // czy kolumna jest widoczna
  order: number; // kolejność kolumny
  frozen: boolean; // czy kolumna jest przypięta do lewej
  sortable?: boolean; // czy kolumna jest sortowalna (domyślnie true)
  filterable?: boolean; // czy kolumna jest filtrowalna (domyślnie true)
  width?: string; // szerokość kolumny
}

/**
 * Typ dla domyślnego filtru tabeli
 */
export type GasConnectionTableFilter =
  | 'all'
  | 'finished'
  | 'unfinished'
  | 'unfinished-technical'
  | 'unfinished-final'
  | 'overdue'
  | 'favorites';

/**
 * Ustawienia tabeli dla modułu GasConnection
 */
export interface GasConnectionTableSettings extends ModuleSettings {
  moduleName: 'gasConnectionTable';
  columns: GasConnectionTableColumnConfig[];
  defaultSortField?: string; // pole kolumny do domyślnego sortowania
  defaultSortOrder?: number; // kierunek sortowania (1 = rosnąco, -1 = malejąco)
  defaultFilter?: GasConnectionTableFilter; // domyślny filtr tabeli
  favoriteConnectionIds?: number[]; // lista ID ulubionych przyłączy
}

/**
 * Konfiguracja Card w etapie
 */
export interface StageCardConfig {
  id: string; // unikalny identyfikator Card
  title: string; // tytuł Card z headera
  required: boolean; // czy Card jest obowiązkowy
}

/**
 * Ustawienia etapów - mapa stageId => lista Cardów
 */
export interface StageSettings {
  [stageId: string]: StageCardConfig[];
}

/**
 * Ustawienia etapów dla modułu GasConnection
 */
export interface GasConnectionStageSettings extends ModuleSettings {
  moduleName: 'gasConnectionStages';
  stages: StageSettings;
}

/**
 * Unia typów dla wszystkich modułów (łatwe rozszerzanie)
 */
export type AppDefaultSettings =
  | GasConnectionDefaultSettings
  | GasConnectionTableSettings
  | GasConnectionStageSettings
  | CompanySettings
  | AppInfoSettings; // | OtherModuleSettings | ...

/**
 * Struktura przechowywania w localStorage
 */
export interface SettingsStorage {
  [moduleName: string]: AppDefaultSettings;
}
