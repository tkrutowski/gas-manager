export interface Coordinator {
  id: number;
  name: string;
  lastName: string;
  phones?: string[];
  emails?: string[];
  info?: string; // opcjonalne informacje dodatkowe
  status: boolean; // oznacza czy koordynator jest aktywny
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
