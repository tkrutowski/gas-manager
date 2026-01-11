export interface UtilityCompanyType {
  id: number;
  name: string;
}

/**
 * Enum określający kto dostarczył mapę
 */
export enum MapDeliveredBy {
  Geodeta = 0,
  Klient = 1,
  Ośrodek = 2,
}
