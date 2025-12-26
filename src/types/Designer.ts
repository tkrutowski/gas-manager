import type { Address } from './Address';

export interface Designer {
  id: number;
  name: string;
  lastName: string;
  phone: string;
  phone2?: string; // opcjonalny drugi telefon
  email: string; // zmienione z "mail" na "email" dla spójności
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
  phone: string;
  phone2?: string; // opcjonalny drugi telefon
  email: string; // zmienione z "mail" na "email" dla spójności
  info?: string; // opcjonalne informacje dodatkowe
  status: boolean; // oznacza czy projektant ruchu jest aktywny
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
