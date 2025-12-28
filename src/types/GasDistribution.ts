/**
 * Jednostka zlecająca (rozdzielnia gazowa)
 */
export interface GasDistribution {
  id: number;
  name: string; // nazwa (nvarchar(30), not null)
  distributionNumber?: string; // nr_rozdzielni (nvarchar(30), null)
  representative?: string; // przedstawiciel (nvarchar(50), null)
  info?: string; // info (nchar(500), null)
  isActive?: boolean; // czy_aktywny (bit, null)
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
