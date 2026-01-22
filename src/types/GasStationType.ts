type Status = 'REDUCTION' | 'MEASUREMENT' | 'REDUCTION_MEASUREMENT';
type StatusViewName = 'redukcyjna' | 'pomiarowa' | 'redukcyjno - pomiarowa';
export interface GasStationType {
  name: Status;
  viewValue: StatusViewName;
}
