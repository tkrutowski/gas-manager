import type { Address } from './Address';

export interface Surveyor {
  id: number;
  name: string;
  lastName: string;
  phone: string;
  phone2?: string; // opcjonalny drugi telefon
  email: string; // zmienione z "mail" na "email" dla spójności
  info?: string; // opcjonalne informacje dodatkowe
  address: Address;
  status: boolean; // oznacza czy geodeta jest aktywny
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
