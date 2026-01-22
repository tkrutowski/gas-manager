import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import type {
  GasConnection,
  GasConnectionDesign,
  GasConnectionBuild,
  GasConnectionFinance,
  Cost,
  CostType,
  Pgn,
} from '../types/GasConnection';
import { Phase } from '../types/GasConnection';
import type { TaskType } from '../types/TaskType';
import type { WorkRangeConnection, WorkRangeGasConnection, WorkRangeGasStation } from '../types/WorkRange';
import type { Plot, PlotOwner } from '../types/Plot';
import { useCustomersStore } from './customers';
import { useDesignersStore } from './designers';
import { useCoordinatorsStore } from './coordinators';
import { useSurveyorsStore } from './surveyors';
import { useGasDistributionsStore } from './gasDistributions';
import { useDesignerTrafficStore } from './designerTraffic';
import type { Address } from '../types/Address';
import { MapDeliveredBy } from '../types/Commons';

// Funkcja pomocnicza do generowania losowych adresów
function generateMockAddress(id: number): Address {
  const cities = [
    'Warszawa',
    'Kraków',
    'Gdańsk',
    'Wrocław',
    'Poznań',
    'Łódź',
    'Katowice',
    'Lublin',
    'Szczecin',
    'Bydgoszcz',
  ];
  const streets = [
    'ul. Główna',
    'ul. Słoneczna',
    'ul. Polna',
    'ul. Leśna',
    'ul. Kwiatowa',
    'ul. Parkowa',
    'ul. Ogrodowa',
    'ul. Spacerowa',
  ];
  const communes = ['Mokotów', 'Śródmieście', 'Praga', 'Żoliborz', 'Wola', 'Ochota', 'Bielany', 'Bemowo'];

  return {
    id: id,
    commune: communes[Math.floor(Math.random() * communes.length)],
    city: cities[Math.floor(Math.random() * cities.length)],
    street: `${streets[Math.floor(Math.random() * streets.length)]} ${Math.floor(Math.random() * 100) + 1}`,
    zip: `${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 900) + 100}`,
    coordinates: {
      id: id,
      latitude: (50 + Math.random() * 4).toFixed(6),
      longitude: (19 + Math.random() * 4).toFixed(6),
    },
  };
}

// Funkcja pomocnicza do generowania daty w przeszłości
function randomPastDate(daysAgo: number = 365): Date {
  return new Date(Date.now() - Math.random() * daysAgo * 24 * 60 * 60 * 1000);
}

// Funkcja pomocnicza do generowania daty w przyszłości
function randomFutureDate(daysAhead: number = 90): Date {
  return new Date(Date.now() + Math.random() * daysAhead * 24 * 60 * 60 * 1000);
}

// Funkcja pomocnicza do generowania losowego TaskType
function generateTaskType(): TaskType {
  const types: TaskType[] = [
    { name: 'GAS_CONNECTION', viewName: 'przylacze' },
    { name: 'GAS_PIPELINE', viewName: 'gazociag' },
    { name: 'GAS_INTERNAL', viewName: 'wewnetrzna' },
  ];
  return types[Math.floor(Math.random() * types.length)];
}

// Funkcja pomocnicza do generowania losowego CostType
function generateCostType(id: number): CostType {
  const types = ['Projekt', 'Budowa', 'Materiały', 'Robocizna', 'Inne'];
  return {
    id: id,
    name: types[Math.floor(Math.random() * types.length)],
  };
}

// Opcje PlotOwner
const plotOwnerOptions: PlotOwner[] = [
  { id: 1, name: 'Urząd Gminy' },
  { id: 2, name: 'ZDP' },
  { id: 3, name: 'ZDW' },
  { id: 4, name: 'GDDKiA' },
  { id: 5, name: 'ZDM' },
  { id: 6, name: 'Wł. prywatny' },
];

// Klucz localStorage dla połączeń gazowych
const STORAGE_KEY = 'gas-manager:gasConnections';

// Funkcja pomocnicza do ładowania danych z localStorage
function loadFromLocalStorage(): GasConnection[] | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : null;
  } catch (err) {
    console.warn('Błąd podczas ładowania połączeń gazowych z localStorage:', err);
    return null;
  }
}

// Funkcja pomocnicza do walidacji i naprawy wartości mapDeliveredBy
// Zwraca zaktualizowane dane oraz informację, czy coś zostało zmienione
function validateMapDeliveredBy(data: GasConnection[]): { data: GasConnection[]; changed: boolean } {
  let changed = false;
  const validatedData = data.map(connection => {
    if (
      connection.gasConnectionDesign?.mapDeliveredBy !== undefined &&
      connection.gasConnectionDesign?.mapDeliveredBy !== null
    ) {
      const value = connection.gasConnectionDesign.mapDeliveredBy;
      // Sprawdzamy czy wartość jest zgodna z enum (0, 1, 2)
      if (value > 2 || value < 0) {
        console.warn(
          `Naprawiono nieprawidłową wartość mapDeliveredBy (${value}) dla połączenia ${connection.id}. Ustawiono na undefined.`
        );
        if (connection.gasConnectionDesign) {
          connection.gasConnectionDesign.mapDeliveredBy = undefined;
          changed = true;
        }
      }
    }
    return connection;
  });
  return { data: validatedData, changed };
}

// Funkcja pomocnicza do zapisywania danych do localStorage
function saveToLocalStorage(data: GasConnection[]): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Błąd podczas zapisywania połączeń gazowych do localStorage:', err);
  }
}

// Generowanie mockowanych połączeń gazowych
function generateMockGasConnections(): GasConnection[] {
  const customersStore = useCustomersStore();
  const designersStore = useDesignersStore();
  const coordinatorsStore = useCoordinatorsStore();
  const surveyorsStore = useSurveyorsStore();
  const designerTrafficStore = useDesignerTrafficStore();

  const customers = customersStore.getAllCustomers({ status: true });
  const designers = designersStore.getAllDesigners({ status: true });
  const coordinators = coordinatorsStore.getAllCoordinators({ status: true });
  const surveyors = surveyorsStore.getAllSurveyors({ status: true });
  const gasDistributionsStore = useGasDistributionsStore();
  const gasDistributions = gasDistributionsStore.getAllGasDistributions({ isActive: true });
  const designerTrafficList = designerTrafficStore.getAllDesignerTraffic({ status: true });

  const gasConnections: GasConnection[] = [];
  const phases: Phase[] = [Phase.PREPARATION, Phase.PROJECT, Phase.WORK, Phase.FINANSE, Phase.COMPLETED, Phase.CANCELED];

  let id = 1;
  let plotId = 1;
  let costId = 1;
  let workRangeId = 1;

  // Generowanie po 10 dla każdej fazy
  phases.forEach(phase => {
    for (let i = 0; i < 10; i++) {
      const taskNo = `GC-${String(id).padStart(4, '0')}`;
      const contractNo = `UM/${new Date().getFullYear()}/${String(id).padStart(3, '0')}`;
      const taskType = generateTaskType();

      // Losowe wybory z dostępnych danych
      const customer = customers.length > 0 ? customers[Math.floor(Math.random() * customers.length)] : undefined;
      const endCustomer =
        Math.random() > 0.7 && customers.length > 0
          ? customers[Math.floor(Math.random() * customers.length)]
          : undefined;
      const designer = designers.length > 0 ? designers[Math.floor(Math.random() * designers.length)] : undefined;
      const coordinator =
        coordinators.length > 0 ? coordinators[Math.floor(Math.random() * coordinators.length)] : undefined;
      const address = generateMockAddress(id);
      const mapSurveyor =
        surveyors.length > 0 && Math.random() > 0.3 ? surveyors[Math.floor(Math.random() * surveyors.length)] : null;
      const surveyorTraffic =
        surveyors.length > 0 && Math.random() > 0.5 ? surveyors[Math.floor(Math.random() * surveyors.length)] : null;
      const designerTraffic =
        designerTrafficList.length > 0 && Math.random() > 0.4
          ? designerTrafficList[Math.floor(Math.random() * designerTrafficList.length)]
          : null;

      // Generowanie plots (0-3 działki)
      const plotsCount = Math.floor(Math.random() * 4);
      const plots: Plot[] = [];
      for (let p = 0; p < plotsCount; p++) {
        plots.push({
          id: plotId++,
          idTask: id,
          plotOwner: plotOwnerOptions[Math.floor(Math.random() * plotOwnerOptions.length)],
          plotOwnerPrivate: [],
          plotNumber: `${Math.floor(Math.random() * 999) + 1}/${Math.floor(Math.random() * 99) + 1}`,
          submissionDate: Math.random() > 0.3 ? randomPastDate(180) : undefined,
          receiptDate: Math.random() > 0.5 ? randomPastDate(90) : undefined,
          laneOccupationSubmissionDate: Math.random() > 0.4 ? randomPastDate(120) : undefined,
          laneOccupationReceiptDate: Math.random() > 0.5 ? randomPastDate(60) : undefined,
          laneReceiptDate: Math.random() > 0.6 ? randomPastDate(30) : undefined,
          info: Math.random() > 0.7 ? 'Dodatkowe informacje o działce' : '',
          taskType: taskType,
          connectionEntity: Math.random() > 0.5,
          laneOccupationPreparationDate: Math.random() > 0.5 ? randomPastDate(45) : undefined,
          laneOccupationStartDate: Math.random() > 0.5 ? randomPastDate(30) : undefined,
          laneOccupationEndDate: Math.random() > 0.5 ? randomFutureDate(60) : undefined,
        });
      }

      // Generowanie workRangeGasConnections (0-2)
      const workRangeGasConnections: WorkRangeGasConnection[] = [];
      const connectionsCount = Math.floor(Math.random() * 3);
      for (let w = 0; w < connectionsCount; w++) {
        workRangeGasConnections.push({
          id: workRangeId++,
          idTask: id,
          taskType: taskType,
          info: `Połączenie gazowe ${w + 1}`,
          diameter: [32, 40, 50, 63, 90, 110][Math.floor(Math.random() * 6)],
          lengthWar: Math.floor(Math.random() * 500) + 10,
          material: ['PE', 'Stal'][Math.floor(Math.random() * 2)],
          sdr: ['SDR11', 'SDR17.6'][Math.floor(Math.random() * 2)],
          lengthProj: Math.floor(Math.random() * 500) + 10,
          gasCabinetProviderType: {
            id: workRangeId,
            name: ['Dostawca A', 'Dostawca B', 'Dostawca C'][Math.floor(Math.random() * 3)],
          } as any,
          gasCabinetPickupDate: Math.random() > 0.5 ? randomPastDate(60) : undefined,
        });
      }

      // Generowanie workRangeGasStations (0-1)
      const workRangeGasStations: WorkRangeGasStation[] = [];
      if (Math.random() > 0.6) {
        workRangeGasStations.push({
          id: workRangeId++,
          idTask: id,
          taskType: taskType,
          info: 'Stacja gazowa',
          capacity: Math.floor(Math.random() * 100) + 10,
          amount: Math.floor(Math.random() * 5) + 1,
          stationType: {
            id: workRangeId,
            name: ['Typ A', 'Typ B', 'Typ C'][Math.floor(Math.random() * 3)],
          } as any,
        });
      }

      // WorkRangeConnection
      const workRangeConnection: WorkRangeConnection = {
        id: workRangeId++,
        idTask: id,
        taskType: taskType,
        info: 'Zakres prac',
        diameter: [32, 40, 50, 63][Math.floor(Math.random() * 4)],
        material: ['PE', 'Stal'][Math.floor(Math.random() * 2)],
        pressure:
          Math.random() > 0.3
            ? {
                name: ['MEDIUM', 'LOW', 'HIGH'][Math.floor(Math.random() * 3)] as 'MEDIUM' | 'LOW' | 'HIGH',
                viewValue: 'Średnie',
                displayValue: '0.5 MPa',
              }
            : undefined,
      };

      // Pgn
      const pgn: Pgn = {
        id: id,
        idTask: id,
        pgnNumber: `PGN-${String(id).padStart(4, '0')}`,
        applicationNumber: `WN/${new Date().getFullYear()}/${String(id).padStart(3, '0')}`,
        recipient:
          customer?.customerType === 'company'
            ? customer.companyName || 'Firma'
            : `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim() || 'Klient',
        workDate: Math.random() > 0.4 ? randomPastDate(180) : undefined,
        info: Math.random() > 0.6 ? 'Informacje o PGN' : '',
        taskType: taskType,
      };

      // GasConnectionDesign - różne w zależności od fazy
      const gasConnectionDesign: GasConnectionDesign = {
        projectOrderSubmissionDate: phase !== Phase.PREPARATION ? randomPastDate(200) : undefined,
        projectOrderConfirmationDate: phase !== Phase.PREPARATION ? randomPastDate(180) : undefined,
        proxySubmissionDate: phase !== Phase.PREPARATION ? randomPastDate(150) : undefined,
        proxyReceiptDate: phase !== Phase.PREPARATION ? randomPastDate(120) : undefined,
        mapSubmissionDate: phase !== Phase.PREPARATION ? randomPastDate(100) : undefined,
        mapReceiptDate: phase !== Phase.PREPARATION ? randomPastDate(80) : undefined,
        mapDeliveredBy:
          phase !== Phase.PREPARATION && Math.random() > 0.3
            ? ([MapDeliveredBy.Geodeta, MapDeliveredBy.Klient, MapDeliveredBy.Ośrodek][
                Math.floor(Math.random() * 3)
              ] as MapDeliveredBy)
            : undefined,
        mapSurveyor: mapSurveyor,
        extractSubmissionDate: phase !== Phase.PREPARATION ? randomPastDate(90) : undefined,
        extractReceiptDate: phase !== Phase.PREPARATION ? randomPastDate(70) : undefined,
        withoutZud: Math.random() > 0.7,
        zudpSubmissionDate:
          phase === Phase.PROJECT || phase === Phase.WORK || phase === Phase.FINANSE ? randomPastDate(60) : undefined,
        zudpReceiptDate:
          phase === Phase.PROJECT || phase === Phase.WORK || phase === Phase.FINANSE ? randomPastDate(50) : undefined,
        utilityCompanyType:
          Math.random() > 0.5
            ? {
                id: Math.floor(Math.random() * 10) + 1,
                name: ['Energia', 'Woda', 'Telekomunikacja'][Math.floor(Math.random() * 3)],
              }
            : null,
        utilityCompanySubmissionDate:
          phase === Phase.PROJECT || phase === Phase.WORK || phase === Phase.FINANSE ? randomPastDate(40) : undefined,
        utilityCompanyReceiptDate:
          phase === Phase.PROJECT || phase === Phase.WORK || phase === Phase.FINANSE ? randomPastDate(30) : undefined,
        wsgAgreementSubmissionDate: phase === Phase.WORK || phase === Phase.FINANSE ? randomPastDate(20) : undefined,
        wsgAgreementReceiptDate: phase === Phase.WORK || phase === Phase.FINANSE ? randomPastDate(15) : undefined,
        wsgAgreementAgreementDate: phase === Phase.WORK || phase === Phase.FINANSE ? randomPastDate(10) : undefined,
        wsgAgreementNo:
          phase === Phase.WORK || phase === Phase.FINANSE
            ? `WSG/${new Date().getFullYear()}/${String(id).padStart(3, '0')}`
            : '',
        wsgAgreementPointSchemeSubmissionDate:
          phase === Phase.WORK || phase === Phase.FINANSE ? randomPastDate(8) : undefined,
        wsgAgreementPointSchemeReceiptDate:
          phase === Phase.WORK || phase === Phase.FINANSE ? randomPastDate(5) : undefined,
        withoutTrafficOrganizationProject: Math.random() > 0.6,
        trafficOrganizationProjectSubmissionDate:
          phase === Phase.WORK || phase === Phase.FINANSE ? randomPastDate(3) : undefined,
        trafficOrganizationProjectReceiptDate:
          phase === Phase.WORK || phase === Phase.FINANSE ? randomPastDate(2) : undefined,
        designerTraffic: designerTraffic,
        gasPointOrderDate: phase === Phase.WORK || phase === Phase.FINANSE ? randomPastDate(1) : undefined,
        gasPointPickupDate: phase === Phase.WORK || phase === Phase.FINANSE ? randomPastDate(1) : undefined,
        gasPointDocPickupDate: phase === Phase.WORK || phase === Phase.FINANSE ? randomPastDate(1) : undefined,
        gasPointOrderNo:
          phase === Phase.WORK || phase === Phase.FINANSE
            ? `GP/${new Date().getFullYear()}/${String(id).padStart(3, '0')}`
            : '',
        zudpSentToSurveyorDate:
          phase === Phase.PROJECT || phase === Phase.WORK || phase === Phase.FINANSE ? randomPastDate(45) : undefined,
        surveyorTrafficProject: surveyorTraffic,
      };

      // GasConnectionBuild - tylko dla faz WORK i FINANSE
      const gasConnectionBuild: GasConnectionBuild = {
        substationNotificationSubmissionDate:
          phase === Phase.WORK || phase === Phase.FINANSE ? randomPastDate(10) : undefined,
        surveyingSketchesDate: phase === Phase.WORK || phase === Phase.FINANSE ? randomPastDate(8) : undefined,
        surveyingInventoryDate: phase === Phase.WORK || phase === Phase.FINANSE ? randomPastDate(5) : undefined,
        realizationStartDate: phase === Phase.WORK || phase === Phase.FINANSE ? randomPastDate(3) : undefined,
        realizationEndDate: phase === Phase.FINANSE ? randomPastDate(1) : undefined,
        wsgTechnicalAcceptanceDate: phase === Phase.FINANSE ? randomPastDate(1) : undefined,
        wsgFinalAcceptanceSubmissionDate: phase === Phase.FINANSE ? randomPastDate(1) : undefined,
        wsgFinalAcceptanceDate: phase === Phase.FINANSE ? randomPastDate(1) : undefined,
        gasConnectionRealLength:
          phase === Phase.WORK || phase === Phase.FINANSE ? Math.floor(Math.random() * 500) + 50 : 0,
        technicalAcceptanceProtocolNo:
          phase === Phase.FINANSE ? `PROT/${new Date().getFullYear()}/${String(id).padStart(3, '0')}` : '',
        gasPipelineInventoryNumber: phase === Phase.FINANSE ? `INV-${String(id).padStart(4, '0')}` : '',
        wsgInfo: phase === Phase.FINANSE ? 'Informacje o odbiorze' : '',
      };

      // GasConnectionFinance - tylko dla fazy FINANSE
      const costsCount = phase === Phase.FINANSE ? Math.floor(Math.random() * 5) + 1 : 0;
      const costList: Cost[] = [];
      for (let c = 0; c < costsCount; c++) {
        const costType = generateCostType(costId);
        costList.push({
          id: costId++,
          idTask: id,
          costType: costType,
          paymentDate: randomPastDate(30),
          amount: Math.floor(Math.random() * 50000) + 1000,
          taskType: taskType,
          description: `Koszt ${costType.name}`,
        });
      }

      const gasConnectionFinance: GasConnectionFinance = {
        financeInventoryAmount: phase === Phase.FINANSE ? Math.floor(Math.random() * 100000) + 10000 : 0,
        financeInventoryDate: phase === Phase.FINANSE ? randomPastDate(20) : undefined,
        financeProjectAmount: phase === Phase.FINANSE ? Math.floor(Math.random() * 50000) + 5000 : 0,
        financeProjectDate: phase === Phase.FINANSE ? randomPastDate(15) : undefined,
        financeRoadPastureAmount: phase === Phase.FINANSE ? Math.floor(Math.random() * 30000) + 3000 : 0,
        financeRoadPastureDate: phase === Phase.FINANSE ? randomPastDate(10) : undefined,
        costList: costList,
      };

      // Obliczanie wartości - wartość zadania = wartość projektu + wartość wykonawstwa
      const projectValue = Math.floor(Math.random() * 100000) + 10000;
      const constructionValue =
        phase === Phase.WORK || phase === Phase.FINANSE ? Math.floor(Math.random() * 150000) + 15000 : 0;
      const taskValue = projectValue + constructionValue;

      gasConnections.push({
        id: id++,
        designer: designer,
        coordinator: coordinator,
        customer: customer,
        endCustomer: endCustomer,
        address: address,
        plots: plots,
        workRangeGasConnections: workRangeGasConnections,
        workRangeGasStations: workRangeGasStations,
        workRangeConnection: workRangeConnection,
        pgn: pgn,
        taskNo: taskNo,
        contractNo: contractNo,
        contractDate: phase !== Phase.PREPARATION ? randomPastDate(250) : undefined,
        conditionNo: phase !== Phase.PREPARATION ? `WAR/${new Date().getFullYear()}/${String(id - 1).padStart(3, '0')}` : '',
        conditionDate: phase !== Phase.PREPARATION ? randomPastDate(240) : undefined,
        gasDistribution:
          gasDistributions.length > 0
            ? gasDistributions[Math.floor(Math.random() * gasDistributions.length)]
            : undefined,
        connectionAgreementNumber:
          phase !== Phase.PREPARATION ? `UM/${new Date().getFullYear()}/${String(id - 1).padStart(3, '0')}` : '',
        sapUpNo: phase !== Phase.PREPARATION ? `SAP-${String(id - 1).padStart(5, '0')}` : '',
        accelerationDate: Math.random() > 0.7 ? randomFutureDate(30) : undefined,
        taskValue: taskValue,
        finishDeadline: randomFutureDate(180),
        projectDeadline: phase !== Phase.PREPARATION ? randomFutureDate(120) : undefined,
        projectValue: projectValue,
        wsgFinalPickupDate: phase === Phase.FINANSE ? randomPastDate(5) : undefined,
        constructionValue: constructionValue,
        isPGN: Math.random() > 0.5,
        info: Math.random() > 0.5 ? 'Dodatkowe informacje o połączeniu' : '',
        isFinished: phase === Phase.FINANSE,
        idGasConnectionSync: Math.random() > 0.3,
        phase: phase,
        gasConnectionDesign: gasConnectionDesign,
        gasConnectionBuild: gasConnectionBuild,
        gasConnectionFinance: gasConnectionFinance,
      });
    }
  });

  return gasConnections;
}

export const useGasConnectionsStore = defineStore('gasConnections', () => {
  // Ładowanie danych z localStorage lub generowanie nowych
  // Uwaga: generateMockGasConnections() wymaga załadowanych danych z innych store'ów
  // więc jeśli nie ma danych w localStorage, musimy wygenerować nowe
  const loadedData = loadFromLocalStorage();
  const validationResult = loadedData ? validateMapDeliveredBy(loadedData) : null;
  const initialData = validationResult?.data ?? generateMockGasConnections();
  const gasConnections = ref<GasConnection[]>(initialData);

  // Jeśli dane zostały naprawione, zapisz je z powrotem do localStorage
  if (validationResult?.changed) {
    saveToLocalStorage(validationResult.data);
  }

  // Zapisanie wygenerowanych danych do localStorage jeśli nie były tam wcześniej
  if (!loadedData) {
    saveToLocalStorage(gasConnections.value);
  }

  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed properties
  const totalCount = computed(() => gasConnections.value.length);
  const byPhase = computed(() => {
    return {
      [Phase.PREPARATION]: gasConnections.value.filter(gc => gc.phase === Phase.PREPARATION),
      [Phase.PROJECT]: gasConnections.value.filter(gc => gc.phase === Phase.PROJECT),
      [Phase.WORK]: gasConnections.value.filter(gc => gc.phase === Phase.WORK),
      [Phase.FINANSE]: gasConnections.value.filter(gc => gc.phase === Phase.FINANSE),
      [Phase.COMPLETED]: gasConnections.value.filter(gc => gc.phase === Phase.COMPLETED),
      [Phase.CANCELED]: gasConnections.value.filter(gc => gc.phase === Phase.CANCELED),
    };
  });
  const finished = computed(() => gasConnections.value.filter(gc => gc.isFinished));
  const unfinished = computed(() => gasConnections.value.filter(gc => !gc.isFinished));

  // Funkcje CRUD (na razie z mockowaniem, później będą używać API)

  /**
   * Pobiera wszystkie połączenia gazowe
   * @param filters - opcjonalne filtry (phase, isFinished)
   */
  function getAllGasConnections(filters?: { phase?: Phase; isFinished?: boolean }): GasConnection[] {
    loading.value = true;
    error.value = null;

    try {
      let result = [...gasConnections.value];

      if (filters?.phase !== undefined) {
        result = result.filter(gc => gc.phase === filters.phase);
      }

      if (filters?.isFinished !== undefined) {
        result = result.filter(gc => gc.isFinished === filters.isFinished);
      }

      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas pobierania połączeń gazowych';
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * Pobiera połączenie gazowe po ID
   */
  function getGasConnection(id: number): GasConnection | undefined {
    loading.value = true;
    error.value = null;

    try {
      return gasConnections.value.find(gc => gc.id === id);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas pobierania połączenia gazowego';
      return undefined;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Dodaje nowe połączenie gazowe
   */
  function addGasConnection(gasConnection: Omit<GasConnection, 'id'>): GasConnection {
    loading.value = true;
    error.value = null;

    try {
      const newId = Math.max(...gasConnections.value.map(gc => gc.id), 0) + 1;
      const newGasConnection: GasConnection = {
        ...gasConnection,
        id: newId,
      };

      gasConnections.value.push(newGasConnection);
      saveToLocalStorage(gasConnections.value);
      return newGasConnection;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas dodawania połączenia gazowego';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Aktualizuje istniejące połączenie gazowe
   */
  function updateGasConnection(id: number, updates: Partial<Omit<GasConnection, 'id'>>): GasConnection | null {
    loading.value = true;
    error.value = null;

    try {
      const index = gasConnections.value.findIndex(gc => gc.id === id);
      if (index === -1) {
        error.value = 'Połączenie gazowe nie zostało znalezione';
        return null;
      }

      gasConnections.value[index] = {
        ...gasConnections.value[index],
        ...updates,
      };

      saveToLocalStorage(gasConnections.value);
      return gasConnections.value[index];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas aktualizacji połączenia gazowego';
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Usuwa połączenie gazowe
   */
  function deleteGasConnection(id: number): boolean {
    loading.value = true;
    error.value = null;

    try {
      const index = gasConnections.value.findIndex(gc => gc.id === id);
      if (index === -1) {
        error.value = 'Połączenie gazowe nie zostało znalezione';
        return false;
      }

      gasConnections.value.splice(index, 1);
      saveToLocalStorage(gasConnections.value);
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Błąd podczas usuwania połączenia gazowego';
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Wyszukuje połączenia gazowe po frazie (numer zadania, numer umowy, numer warunków)
   */
  function searchGasConnections(query: string): GasConnection[] {
    if (!query.trim()) {
      return getAllGasConnections();
    }

    const lowerQuery = query.toLowerCase();
    return gasConnections.value.filter(gc => {
      return (
        gc.taskNo.toLowerCase().includes(lowerQuery) ||
        gc.contractNo.toLowerCase().includes(lowerQuery) ||
        gc.conditionNo.toLowerCase().includes(lowerQuery) ||
        gc.connectionAgreementNumber.toLowerCase().includes(lowerQuery) ||
        gc.sapUpNo.toLowerCase().includes(lowerQuery) ||
        gc.pgn.pgnNumber.toLowerCase().includes(lowerQuery)
      );
    });
  }

  return {
    // State
    gasConnections,
    loading,
    error,
    // Computed
    totalCount,
    byPhase,
    finished,
    unfinished,
    // Methods
    getAllGasConnections,
    getGasConnection,
    addGasConnection,
    updateGasConnection,
    deleteGasConnection,
    searchGasConnections,
  };
});
