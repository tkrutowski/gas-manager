import type { Address } from './Address';

export interface Designer {
  id: number;
  /**
   * Typ projektanta:
   * - 'person'  – osoba fizyczna (wypełnione firstName/lastName)
   * - 'company' – firma (wypełnione companyName, nip, opcjonalnie regon/krs)
   */
  designerType: 'person' | 'company';

  // Dane osoby fizycznej
  firstName?: string;
  lastName?: string;

  // Dane firmy
  companyName?: string;
  nip?: string;
  regon?: string;
  krs?: string;

  // Pola pozostawione dla ewentualnej kompatybilności wstecznej (nie używać w nowym kodzie)
  name?: string;
  phones?: string[];
  emails?: string[];
  info?: string; // opcjonalne informacje dodatkowe
  address: Address;
  status: boolean; // oznacza czy projektant jest aktywny (zmienione z ActiveStatus na boolean dla spójności)
  employee: boolean; // czy jest pracownikiem firmy
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface DesignerTraffic {
  id: number;
  name: string;
  lastName: string;
  phones?: string[];
  emails?: string[];
  info?: string; // opcjonalne informacje dodatkowe
  status: boolean; // oznacza czy projektant ruchu jest aktywny
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
