type Status = 'UNKNOWN' | 'CUSTOMER' | 'PSG' | 'COMPANY';
type StatusViewName = 'Nieznane' | 'Klient' | 'PSG' | 'Progas';
export interface GasCabinetProviderType {
  name: Status;
  viewValue: StatusViewName;
}
