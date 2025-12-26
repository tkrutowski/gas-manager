export interface Coordinator {
  id: number;
  name: string;
  lastName: string;
  phone: string;
  phone2?: string; // opcjonalny drugi telefon
  email: string; // zmienione z "mail" na "email" dla spójności
  info?: string; // opcjonalne informacje dodatkowe
  status: boolean; // oznacza czy koordynator jest aktywny
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
