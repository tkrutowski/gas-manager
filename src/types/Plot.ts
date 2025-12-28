import type { TaskType } from '@/types/TaskType.ts';

export interface Plot {
  id: number;
  idTask: number;
  plotOwner: PlotOwner;
  plotOwnerPrivate: PlotOwnerPrivate[];
  plotNumber: string;
  submissionDate: undefined | Date;
  receiptDate: undefined | Date;
  laneOccupationSubmissionDate: undefined | Date;
  laneOccupationReceiptDate: undefined | Date;
  laneReceiptDate: undefined | Date;
  info: string;
  taskType: TaskType;
  connectionEntity: boolean;
  laneOccupationPreparationDate: undefined | Date;
  laneOccupationStartDate: undefined | Date;
  laneOccupationEndDate: undefined | Date;
}

export interface PlotOwner {
  id: number;
  name: string;
}

export interface PlotOwnerPrivate {
  id: number;
  idPlot: number;
  name: string;
  lastName: string;
  share: number;
  submissionDate: undefined | Date;
  receiptDate: undefined | Date;
  submissionDate1: undefined | Date;
  receiptDate1: undefined | Date;
  info1: string;
  submissionDate2: undefined | Date;
  receiptDate2: undefined | Date;
  info2: string;
}
