import type { TaskType } from '@/types/TaskType.ts';
import type { GasCabinetProviderType } from '@/types/GasCabinetProviderType.ts';
import type { GasStationType } from '@/types/GasStationType.ts';

export interface WorkRangeGasStation {
  id: number;
  idTask: number;
  taskType: TaskType;
  info: string;
  capacity: number;
  amount: number;
  stationType: GasStationType;
}

export interface WorkRangeGasConnection {
  id: number;
  idTask: number;
  taskType: TaskType;
  info: string;
  diameter: number;
  lengthWar: number;
  material: string;
  sdr: string;
  lengthProj: number;
  gasCabinetProviderType: GasCabinetProviderType;
  gasCabinetPickupDate: undefined | Date;
}

export interface WorkRangeConnection {
  id: number;
  idTask: number;
  taskType: TaskType | undefined;
  info: string;
  diameter: number | undefined;
  material: string | undefined;
  pressure: GasPressureType | undefined;
}

type PressureType = 'MEDIUM' | 'LOW' | 'HIGH';
export interface GasPressureType {
  name: PressureType;
  viewValue: string;
  displayValue: string;
}
