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
  | 'overdue';

/**
 * Ustawienia tabeli dla modułu GasConnection
 */
export interface GasConnectionTableSettings extends ModuleSettings {
  moduleName: 'gasConnectionTable';
  columns: GasConnectionTableColumnConfig[];
  defaultSortField?: string; // pole kolumny do domyślnego sortowania
  defaultSortOrder?: number; // kierunek sortowania (1 = rosnąco, -1 = malejąco)
  defaultFilter?: GasConnectionTableFilter; // domyślny filtr tabeli
}

/**
 * Unia typów dla wszystkich modułów (łatwe rozszerzanie)
 */
export type AppDefaultSettings = GasConnectionDefaultSettings | GasConnectionTableSettings; // | OtherModuleSettings | ...

/**
 * Struktura przechowywania w localStorage
 */
export interface SettingsStorage {
  [moduleName: string]: AppDefaultSettings;
}
