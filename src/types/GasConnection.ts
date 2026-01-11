import { type Customer } from '@/types/Customer.ts';
import { type Designer, type DesignerTraffic } from '@/types/Designer.ts';
import { type Coordinator } from '@/types/Coordinator.ts';
import { type Address } from '@/types/Address.ts';
import { type Surveyor } from '@/types/Surveyor.ts';
import { type UtilityCompanyType, MapDeliveredBy } from '@/types/Commons.ts';
import { type Plot } from '@/types/Plot.ts';
import { type WorkRangeConnection, type WorkRangeGasConnection, type WorkRangeGasStation } from '@/types/WorkRange.ts';
import { type TaskType } from '@/types/TaskType.ts';
import { type GasDistribution } from '@/types/GasDistribution.ts';

export interface GasConnection {
  id: number;
  designer: Designer | undefined;
  coordinator: Coordinator | undefined;
  customer: Customer | undefined;
  endCustomer: Customer | undefined;
  address: Address | undefined;
  plots: Plot[];
  workRangeGasConnections: WorkRangeGasConnection[];
  workRangeGasStations: WorkRangeGasStation[];
  workRangeConnection: WorkRangeConnection;
  pgn: Pgn;

  taskNo: string;
  contractNo: string;
  contractDate: undefined | Date;
  conditionNo: string;
  conditionDate: undefined | Date;
  gasDistribution: GasDistribution | undefined;
  connectionAgreementNumber: string;
  sapUpNo: string;
  accelerationDate: undefined | Date;

  taskValue: number;
  finishDeadline: undefined | Date;
  projectDeadline: undefined | Date;
  projectValue: number;
  wsgFinalPickupDate: undefined | Date;
  constructionValue: number;
  isPGN: boolean;
  info: string;
  isFinished: boolean;
  idGasConnectionSync: boolean;
  phase: Phase;
  gasConnectionDesign: GasConnectionDesign;
  gasConnectionBuild: GasConnectionBuild;
  gasConnectionFinance: GasConnectionFinance;
}

export interface GasConnectionDesign {
  //stage 1
  projectOrderSubmissionDate: undefined | Date;
  projectOrderConfirmationDate: undefined | Date;
  proxySubmissionDate: undefined | Date;
  proxyReceiptDate: undefined | Date;
  mapSubmissionDate: undefined | Date;
  mapReceiptDate: undefined | Date;
  mapDeliveredBy: undefined | MapDeliveredBy;
  mapSurveyor: Surveyor | null;
  extractSubmissionDate: undefined | Date;
  extractReceiptDate: undefined | Date;

  //stage 2
  withoutZud: boolean;
  zudpSubmissionDate: undefined | Date;
  zudpReceiptDate: undefined | Date;
  utilityCompanyType: UtilityCompanyType | null;
  utilityCompanySubmissionDate: undefined | Date;
  utilityCompanyReceiptDate: undefined | Date;

  //stage 3
  wsgAgreementSubmissionDate: undefined | Date;
  wsgAgreementReceiptDate: undefined | Date;
  wsgAgreementAgreementDate: undefined | Date;
  wsgAgreementNo: string;
  wsgAgreementPointSchemeSubmissionDate: undefined | Date;
  wsgAgreementPointSchemeReceiptDate: undefined | Date;

  //stage 4
  withoutTrafficOrganizationProject: boolean;
  trafficOrganizationProjectSubmissionDate: undefined | Date;
  trafficOrganizationProjectReceiptDate: undefined | Date;
  designerTraffic: DesignerTraffic | null;
  gasPointOrderDate: undefined | Date;
  gasPointPickupDate: undefined | Date;
  gasPointDocPickupDate: undefined | Date;
  gasPointOrderNo: string;
  zudpSentToSurveyorDate: undefined | Date;
  surveyorTrafficProject: Surveyor | null;
}

export interface GasConnectionBuild {
  substationNotificationSubmissionDate: undefined | Date;
  surveyingSketchesDate: undefined | Date;
  surveyingInventoryDate: undefined | Date;
  realizationStartDate: undefined | Date;
  realizationEndDate: undefined | Date;
  wsgTechnicalAcceptanceDate: undefined | Date;
  wsgFinalAcceptanceSubmissionDate: undefined | Date;
  wsgFinalAcceptanceDate: undefined | Date;
  gasConnectionRealLength: number;
  technicalAcceptanceProtocolNo: string;
  gasPipelineInventoryNumber: string;
  wsgInfo: string;
}

export interface GasConnectionFinance {
  financeInventoryAmount: number;
  financeInventoryDate: undefined | Date;
  financeProjectAmount: number;
  financeProjectDate: undefined | Date;
  financeRoadPastureAmount: number;
  financeRoadPastureDate: undefined | Date;
  costList: Cost[] | [];
}

export interface Cost {
  id: number;
  idTask: number;
  costType: CostType;
  paymentDate: undefined | Date;
  amount: number;
  taskType: TaskType;
  description: string;
}

export interface CostType {
  id: number;
  name: string;
}

export interface Pgn {
  id: number;
  idTask: number;
  pgnNumber: string;
  applicationNumber: string;
  recipient: string;
  workDate: undefined | Date;
  info: string;
  taskType: TaskType;
}

/**
 * Faza projektu
 */
export enum Phase {
  NONE = 'NONE',
  PROJECT = 'PROJECT',
  WORK = 'WORK',
  FINANSE = 'FINANSE',
}

/**
 * Etap projektu
 */
export interface Stage {
  name: string;
  viewName: string;
}
