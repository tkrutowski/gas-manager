type Status = 'ALL' | 'GAS_CONNECTION' | 'GAS_PIPELINE' | 'GAS_INTERNAL';
type StatusViewName = 'Wszystkie' | 'przylacze' | 'gazociag' | 'wewnetrzna';
export interface TaskType {
  name: Status;
  viewName: StatusViewName;
}
