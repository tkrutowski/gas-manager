import type { Address } from './Address';

export interface Customer {
  id: number;
  customerType: 'person' | 'company'; // rozróżnienie typu klienta
  // Dla osób:
  firstName?: string;
  lastName?: string;
  // Dla firm:
  companyName?: string;
  nip?: string;
  regon?: string;
  krs?: string;
  // Wspólne pola:
  phones?: string[];
  emails?: string[];
  info?: string;
  address: Address;
  status: boolean; // oznacza czy klient jest aktywny
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
