import type { Address } from './Address';

export interface Surveyor {
  id: number;
  name: string;
  lastName: string;
  phones?: string[];
  emails?: string[];
  info?: string; // opcjonalne informacje dodatkowe
  address: Address;
  status: boolean; // oznacza czy geodeta jest aktywny
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
