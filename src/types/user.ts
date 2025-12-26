export interface User {
  id: string | number;
  login: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  isActive?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
