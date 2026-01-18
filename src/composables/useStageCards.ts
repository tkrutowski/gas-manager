import { ref, computed, type Ref, type ComputedRef } from 'vue';
import { useSettingsStore } from '@/stores/settings';
import type { GasConnection } from '@/types/GasConnection';
import { MapDeliveredBy } from '@/types/Commons';

export function useStageCards(
  gasConnection: Ref<GasConnection | undefined>,
  isReadonly: ComputedRef<boolean>
) {
  const settingsStore = useSettingsStore();

  // Refs dla kluczy re-renderu Cardów po zmianie ustawień
  const stage1SettingsKey = ref(0);
  const stage2SettingsKey = ref(0);
  const stage3SettingsKey = ref(0);
  const stage4SettingsKey = ref(0);

  // Refs dla widoczności dialogów ustawień
  const stageSettingsDialogVisible = ref(false);
  const stage2SettingsDialogVisible = ref(false);
  const stage3SettingsDialogVisible = ref(false);
  const stage4SettingsDialogVisible = ref(false);

  // Lista Cardów dla każdego etapu
  const stage1Cards = [
    { id: 'projectOrder', title: 'Zlecenie Projektu' },
    { id: 'proxy', title: 'Pełnomocnictwo' },
    { id: 'extract', title: 'Wypis' },
    { id: 'map', title: 'Mapa' },
    { id: 'coordinates', title: 'Współrzędne' },
  ];

  const stage2Cards = [
    { id: 'zudp', title: 'ZUDP' },
    { id: 'utilityCompany', title: 'ZAKŁAD' },
    { id: 'plotOwners', title: 'Właściciele działek' },
  ];

  const stage3Cards = [
    { id: 'wsgAgreement', title: 'UZGODNIENIE WSG' },
    { id: 'wsgAgreementPointScheme', title: 'UZG. SCHEMATU PUNKTU W WSG' },
  ];

  const stage4Cards = [
    { id: 'trafficOrganizationProject', title: 'PROJEKT ORGANIZACJI RUCHU' },
    { id: 'gasPoint', title: 'PUNKT GAZOWY' },
    { id: 'geodesy', title: 'GEODEZJA' },
  ];

  // Mapowanie pól dla każdego Card
  const getCardFields = (cardId: string, _stage: 'stage1' | 'stage2' | 'stage3' | 'stage4' = 'stage1'): string[] => {
    const fieldMap: Record<string, string[]> = {
      // Stage 1
      projectOrder: ['gasConnectionDesign.projectOrderSubmissionDate', 'gasConnectionDesign.projectOrderConfirmationDate'],
      proxy: ['gasConnectionDesign.proxySubmissionDate', 'gasConnectionDesign.proxyReceiptDate'],
      extract: ['gasConnectionDesign.extractSubmissionDate', 'gasConnectionDesign.extractReceiptDate'],
      map: ['gasConnectionDesign.mapSubmissionDate', 'gasConnectionDesign.mapReceiptDate', 'gasConnectionDesign.mapDeliveredBy', 'gasConnectionDesign.mapSurveyor'],
      coordinates: ['address.coordinates.latitude', 'address.coordinates.longitude'],
      // Stage 2
      zudp: ['gasConnectionDesign.zudpSubmissionDate', 'gasConnectionDesign.zudpReceiptDate', 'gasConnectionDesign.withoutZud'],
      utilityCompany: ['gasConnectionDesign.utilityCompanyType', 'gasConnectionDesign.utilityCompanySubmissionDate', 'gasConnectionDesign.utilityCompanyReceiptDate'],
      plotOwners: [], // TODO: będzie uzupełnione w późniejszym terminie
      // Stage 3
      wsgAgreement: ['gasConnectionDesign.wsgAgreementSubmissionDate', 'gasConnectionDesign.wsgAgreementReceiptDate', 'gasConnectionDesign.wsgAgreementAgreementDate', 'gasConnectionDesign.wsgAgreementNo'],
      wsgAgreementPointScheme: ['gasConnectionDesign.wsgAgreementPointSchemeSubmissionDate', 'gasConnectionDesign.wsgAgreementPointSchemeReceiptDate'],
      // Stage 4
      trafficOrganizationProject: ['gasConnectionDesign.trafficOrganizationProjectSubmissionDate', 'gasConnectionDesign.trafficOrganizationProjectReceiptDate', 'gasConnectionDesign.designerTraffic', 'gasConnectionDesign.withoutTrafficOrganizationProject'],
      gasPoint: ['gasConnectionDesign.gasPointOrderDate', 'gasConnectionDesign.gasPointPickupDate', 'gasConnectionDesign.gasPointDocPickupDate', 'gasConnectionDesign.gasPointOrderNo'],
      geodesy: ['gasConnectionDesign.zudpSentToSurveyorDate', 'gasConnectionDesign.surveyorTrafficProject'],
    };
    return fieldMap[cardId] || [];
  };

  // Sprawdza czy pole jest puste
  const isFieldEmpty = (fieldPath: string): boolean => {
    if (!gasConnection.value) return true;

    const parts = fieldPath.split('.');
    let value: any = gasConnection.value;

    for (const part of parts) {
      if (value === null || value === undefined) return true;
      value = value[part];
    }

    // Sprawdzamy różne typy wartości
    if (value === null || value === undefined) return true;
    if (value === '') return true;

    // Date jest zawsze prawidłową wartością (jeśli istnieje)
    if (value instanceof Date) return false;

    // Dla number sprawdzamy tylko undefined/null, nie 0 (bo 0 może być prawidłową wartością)
    if (typeof value === 'object' && value !== null && Object.keys(value).length === 0) return true;

    return false;
  };

  // Sprawdza czy wszystkie obowiązkowe pola Card są puste
  const isCardFieldEmpty = (cardId: string, stage: 'stage1' | 'stage2' | 'stage3' | 'stage4' = 'stage1'): boolean => {
    const stageSettings = settingsStore.getStageSettings(stage);
    if (!stageSettings) return false;

    const cardConfig = stageSettings.find(c => c.id === cardId);
    if (!cardConfig || !cardConfig.required) return false;

    const fields = getCardFields(cardId, stage);

    // Dla ZUDP - jeśli withoutZud jest true, to Card jest uzupełniony
    if (cardId === 'zudp' && gasConnection.value?.gasConnectionDesign?.withoutZud === true) {
      return false;
    }

    // Dla ZUDP - jeśli withoutZud nie jest true, sprawdzamy tylko daty (ignorujemy withoutZud)
    if (cardId === 'zudp') {
      const dateFields = fields.filter(field => field !== 'gasConnectionDesign.withoutZud');
      return dateFields.every(field => isFieldEmpty(field));
    }

    // Dla PROJEKT ORGANIZACJI RUCHU - jeśli withoutTrafficOrganizationProject jest true, to Card jest uzupełniony
    if (cardId === 'trafficOrganizationProject' && gasConnection.value?.gasConnectionDesign?.withoutTrafficOrganizationProject === true) {
      return false;
    }

    // Dla PROJEKT ORGANIZACJI RUCHU - jeśli withoutTrafficOrganizationProject nie jest true, sprawdzamy tylko daty i projektanta (ignorujemy withoutTrafficOrganizationProject)
    if (cardId === 'trafficOrganizationProject') {
      const dateFields = fields.filter(field => field !== 'gasConnectionDesign.withoutTrafficOrganizationProject');
      return dateFields.every(field => isFieldEmpty(field));
    }

    const requiredFields = fields;
    return requiredFields.every(field => isFieldEmpty(field));
  };

  // Sprawdza czy wszystkie obowiązkowe pola Card są uzupełnione
  const isCardFieldComplete = (cardId: string, stage: 'stage1' | 'stage2' | 'stage3' | 'stage4' = 'stage1'): boolean => {
    const stageSettings = settingsStore.getStageSettings(stage);
    if (!stageSettings) return false;

    const cardConfig = stageSettings.find(c => c.id === cardId);
    if (!cardConfig || !cardConfig.required) return false;

    const fields = getCardFields(cardId, stage);

    // Dla ZUDP - jeśli withoutZud jest true, to Card jest uzupełniony
    if (cardId === 'zudp' && gasConnection.value?.gasConnectionDesign?.withoutZud === true) {
      return true;
    }

    // Dla ZUDP - jeśli withoutZud nie jest true, sprawdzamy tylko daty (ignorujemy withoutZud)
    if (cardId === 'zudp') {
      const dateFields = fields.filter(field => field !== 'gasConnectionDesign.withoutZud');
      return dateFields.every(field => !isFieldEmpty(field));
    }

    // Dla PROJEKT ORGANIZACJI RUCHU - jeśli withoutTrafficOrganizationProject jest true, to Card jest uzupełniony
    if (cardId === 'trafficOrganizationProject' && gasConnection.value?.gasConnectionDesign?.withoutTrafficOrganizationProject === true) {
      return true;
    }

    // Dla PROJEKT ORGANIZACJI RUCHU - jeśli withoutTrafficOrganizationProject nie jest true, sprawdzamy tylko daty i projektanta (ignorujemy withoutTrafficOrganizationProject)
    if (cardId === 'trafficOrganizationProject') {
      const dateFields = fields.filter(field => field !== 'gasConnectionDesign.withoutTrafficOrganizationProject');
      return dateFields.every(field => !isFieldEmpty(field));
    }

    const requiredFields = fields;
    return requiredFields.every(field => !isFieldEmpty(field));
  };

  // Sprawdza czy którekolwiek obowiązkowe pole Card jest wypełnione (ale nie wszystkie)
  const isCardFieldPartial = (cardId: string, stage: 'stage1' | 'stage2' | 'stage3' | 'stage4' = 'stage1'): boolean => {
    const stageSettings = settingsStore.getStageSettings(stage);
    if (!stageSettings) return false;

    const cardConfig = stageSettings.find(c => c.id === cardId);
    if (!cardConfig || !cardConfig.required) return false;

    const fields = getCardFields(cardId, stage);

    // Dla ZUDP - jeśli withoutZud jest true, to Card jest uzupełniony (nie partial)
    if (cardId === 'zudp' && gasConnection.value?.gasConnectionDesign?.withoutZud === true) {
      return false;
    }

    // Dla ZUDP - jeśli withoutZud nie jest true, sprawdzamy tylko daty (ignorujemy withoutZud)
    if (cardId === 'zudp') {
      const dateFields = fields.filter(field => field !== 'gasConnectionDesign.withoutZud');
      const filledFields = dateFields.filter(field => !isFieldEmpty(field));
      return filledFields.length > 0 && filledFields.length < dateFields.length;
    }

    // Dla PROJEKT ORGANIZACJI RUCHU - jeśli withoutTrafficOrganizationProject jest true, to Card jest uzupełniony (nie partial)
    if (cardId === 'trafficOrganizationProject' && gasConnection.value?.gasConnectionDesign?.withoutTrafficOrganizationProject === true) {
      return false;
    }

    // Dla PROJEKT ORGANIZACJI RUCHU - jeśli withoutTrafficOrganizationProject nie jest true, sprawdzamy tylko daty i projektanta (ignorujemy withoutTrafficOrganizationProject)
    if (cardId === 'trafficOrganizationProject') {
      const dateFields = fields.filter(field => field !== 'gasConnectionDesign.withoutTrafficOrganizationProject');
      const filledFields = dateFields.filter(field => !isFieldEmpty(field));
      return filledFields.length > 0 && filledFields.length < dateFields.length;
    }

    const requiredFields = fields;
    const filledFields = requiredFields.filter(field => !isFieldEmpty(field));
    return filledFields.length > 0 && filledFields.length < requiredFields.length;
  };

  // Zwraca kolor Card na podstawie stanu
  const getCardColor = (cardId: string, stage: 'stage1' | 'stage2' | 'stage3' | 'stage4' = 'stage1'): 'red' | 'yellow' | 'green' | 'default' => {
    const stageSettings = settingsStore.getStageSettings(stage);
    if (!stageSettings) return 'default';

    const cardConfig = stageSettings.find(c => c.id === cardId);
    if (!cardConfig || !cardConfig.required) return 'default';

    if (isCardFieldComplete(cardId, stage)) return 'green';
    if (isCardFieldPartial(cardId, stage)) return 'yellow';
    if (isCardFieldEmpty(cardId, stage)) return 'red';

    return 'default';
  };

  // Zwraca klasy CSS dla headera Card na podstawie koloru
  const getCardHeaderClasses = (cardId: string, stage: 'stage1' | 'stage2' | 'stage3' | 'stage4' = 'stage1'): string => {
    const color = getCardColor(cardId, stage);
    const baseClasses = 'flex items-center gap-2 px-4 py-3 border-b rounded-t-xl';

    switch (color) {
      case 'red':
        return `${baseClasses} bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-500`;
      case 'yellow':
        return `${baseClasses} bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 dark:border-yellow-500`;
      case 'green':
        return `${baseClasses} bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-500`;
      default:
        return `${baseClasses} bg-surface-100 dark:bg-surface-800 border-surface-200 dark:border-surface-700`;
    }
  };

  // Zwraca klasy CSS dla tekstu w headerze Card na podstawie koloru
  const getCardHeaderTextClasses = (cardId: string, stage: 'stage1' | 'stage2' | 'stage3' | 'stage4' = 'stage1'): string => {
    const color = getCardColor(cardId, stage);
    const baseClasses = 'text-sm font-bold uppercase m-0';

    switch (color) {
      case 'red':
        return `${baseClasses} text-red-700 dark:text-red-300`;
      case 'yellow':
        return `${baseClasses} text-yellow-700 dark:text-yellow-300`;
      case 'green':
        return `${baseClasses} text-green-700 dark:text-green-300`;
      default:
        return `${baseClasses} text-surface-700 dark:text-surface-300`;
    }
  };

  // Zwraca klasy CSS dla obramowania Card na podstawie koloru
  const getCardBorderClasses = (cardId: string, stage: 'stage1' | 'stage2' | 'stage3' | 'stage4' = 'stage1'): string => {
    const color = getCardColor(cardId, stage);

    switch (color) {
      case 'red':
        return 'border-red-400 dark:border-red-500';
      case 'yellow':
        return 'border-yellow-400 dark:border-yellow-500';
      case 'green':
        return 'border-green-400 dark:border-green-500';
      default:
        return 'border-surface-200 dark:border-surface-700';
    }
  };

  // Status etapu 1
  const stageStatus = computed(() => {
    stage1SettingsKey.value;

    const stageSettings = settingsStore.getStageSettings('stage1');
    if (!stageSettings) {
      return { text: 'STATUS: UKOŃCZONO (0/0)', color: 'default' };
    }

    const requiredCards = stageSettings.filter(c => c.required);
    const requiredCount = requiredCards.length;

    if (requiredCount === 0) {
      return { text: 'STATUS: UKOŃCZONO (0/0)', color: 'default' };
    }

    const greenRequiredCards = requiredCards.filter(card => getCardColor(card.id) === 'green');
    const greenCount = greenRequiredCards.length;

    if (greenCount > 0) {
      return { text: `STATUS: UKOŃCZONO (${greenCount}/${requiredCount})`, color: 'default' };
    }

    return { text: `STATUS: UKOŃCZONO (0/${requiredCount})`, color: 'default' };
  });

  // Klasy CSS dla statusu etapu 1
  const stageStatusClasses = computed(() => {
    const color = stageStatus.value.color;
    const baseClasses = 'text-sm';

    switch (color) {
      case 'yellow':
        return `${baseClasses} text-yellow-600 dark:text-yellow-400`;
      default:
        return `${baseClasses} text-surface-600 dark:text-surface-400`;
    }
  });

  // Kolor ikony checkmark dla ETAP 1
  const checkmarkColor = computed(() => {
    stage1SettingsKey.value;

    const stageSettings = settingsStore.getStageSettings('stage1');
    if (!stageSettings) return 'green';

    const requiredCards = stageSettings.filter(c => c.required);
    if (requiredCards.length === 0) return 'green';

    const requiredCardColors = requiredCards.map(card => getCardColor(card.id));

    if (requiredCardColors.every(color => color === 'green')) {
      return 'green';
    }

    if (requiredCardColors.every(color => color === 'red')) {
      return 'red';
    }

    return 'yellow';
  });

  // Klasy CSS dla ikony checkmark ETAP 1
  const checkmarkClasses = computed(() => {
    const color = checkmarkColor.value;
    const baseClasses = 'w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ring-1';

    switch (color) {
      case 'red':
        return `${baseClasses} border-red-400 bg-red-400/10 shadow-[0_0_8px_rgba(239,68,68,0.5)] ring-red-400/50`;
      case 'yellow':
        return `${baseClasses} border-yellow-400 bg-yellow-400/10 shadow-[0_0_8px_rgba(234,179,8,0.5)] ring-yellow-400/50`;
      case 'green':
        return `${baseClasses} border-green-400 bg-green-400/10 shadow-[0_0_8px_rgba(34,197,94,0.5)] ring-green-400/50`;
      default:
        return `${baseClasses} border-green-400 bg-green-400/10 shadow-[0_0_8px_rgba(34,197,94,0.5)] ring-green-400/50`;
    }
  });

  // Klasy CSS dla ikony checkmark ETAP 1 (ikona wewnątrz)
  const checkmarkIconClasses = computed(() => {
    const color = checkmarkColor.value;
    const baseClasses = 'w-5 h-5';

    switch (color) {
      case 'red':
        return `${baseClasses} text-red-400`;
      case 'yellow':
        return `${baseClasses} text-yellow-400`;
      case 'green':
        return `${baseClasses} text-green-400`;
      default:
        return `${baseClasses} text-green-400`;
    }
  });

  // Status etapu 2
  const stage2Status = computed(() => {
    stage2SettingsKey.value;

    const stageSettings = settingsStore.getStageSettings('stage2');
    if (!stageSettings) {
      return { text: 'STATUS: UKOŃCZONO (0/0)', color: 'default' };
    }

    const requiredCards = stageSettings.filter(c => c.required);
    const requiredCount = requiredCards.length;

    if (requiredCount === 0) {
      return { text: 'STATUS: UKOŃCZONO (0/0)', color: 'default' };
    }

    const greenRequiredCards = requiredCards.filter(card => getCardColor(card.id, 'stage2') === 'green');
    const greenCount = greenRequiredCards.length;

    if (greenCount > 0) {
      return { text: `STATUS: UKOŃCZONO (${greenCount}/${requiredCount})`, color: 'default' };
    }

    return { text: `STATUS: UKOŃCZONO (0/${requiredCount})`, color: 'default' };
  });

  // Klasy CSS dla statusu etapu 2
  const stage2StatusClasses = computed(() => {
    const color = stage2Status.value.color;
    const baseClasses = 'text-sm';

    switch (color) {
      case 'yellow':
        return `${baseClasses} text-yellow-600 dark:text-yellow-400`;
      default:
        return `${baseClasses} text-surface-600 dark:text-surface-400`;
    }
  });

  // Kolor ikony checkmark dla ETAP 2
  const checkmark2Color = computed(() => {
    stage2SettingsKey.value;

    const stageSettings = settingsStore.getStageSettings('stage2');
    if (!stageSettings) return 'green';

    const requiredCards = stageSettings.filter(c => c.required);
    if (requiredCards.length === 0) return 'green';

    // Oblicz kolor dla każdego wymaganego Card, uwzględniając plotOwners
    const requiredCardColors = requiredCards.map(card => {
      // Dla plotOwners użyj koloru działek
      if (card.id === 'plotOwners') {
        return getPlotsColor();
      }
      // Dla pozostałych Cardów użyj standardowej logiki
      return getCardColor(card.id, 'stage2');
    });

    if (requiredCardColors.every(color => color === 'green')) {
      return 'green';
    }

    if (requiredCardColors.every(color => color === 'red')) {
      return 'red';
    }

    return 'yellow';
  });

  // Klasy CSS dla ikony checkmark ETAP 2
  const checkmark2Classes = computed(() => {
    const color = checkmark2Color.value;
    const baseClasses = 'w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ring-1';

    switch (color) {
      case 'red':
        return `${baseClasses} border-red-400 bg-red-400/10 shadow-[0_0_8px_rgba(239,68,68,0.5)] ring-red-400/50`;
      case 'yellow':
        return `${baseClasses} border-yellow-400 bg-yellow-400/10 shadow-[0_0_8px_rgba(234,179,8,0.5)] ring-yellow-400/50`;
      case 'green':
        return `${baseClasses} border-green-400 bg-green-400/10 shadow-[0_0_8px_rgba(34,197,94,0.5)] ring-green-400/50`;
      default:
        return `${baseClasses} border-green-400 bg-green-400/10 shadow-[0_0_8px_rgba(34,197,94,0.5)] ring-green-400/50`;
    }
  });

  // Klasy CSS dla ikony checkmark ETAP 2 (ikona wewnątrz)
  const checkmark2IconClasses = computed(() => {
    const color = checkmark2Color.value;
    const baseClasses = 'w-5 h-5';

    switch (color) {
      case 'red':
        return `${baseClasses} text-red-400`;
      case 'yellow':
        return `${baseClasses} text-yellow-400`;
      case 'green':
        return `${baseClasses} text-green-400`;
      default:
        return `${baseClasses} text-green-400`;
    }
  });

  // Status etapu 3
  const stage3Status = computed(() => {
    stage3SettingsKey.value;

    const stageSettings = settingsStore.getStageSettings('stage3');
    if (!stageSettings) {
      return { text: 'STATUS: UKOŃCZONO (0/0)', color: 'default' };
    }

    const requiredCards = stageSettings.filter(c => c.required);
    const requiredCount = requiredCards.length;

    if (requiredCount === 0) {
      return { text: 'STATUS: UKOŃCZONO (0/0)', color: 'default' };
    }

    const greenRequiredCards = requiredCards.filter(card => getCardColor(card.id, 'stage3') === 'green');
    const greenCount = greenRequiredCards.length;

    if (greenCount > 0) {
      return { text: `STATUS: UKOŃCZONO (${greenCount}/${requiredCount})`, color: 'default' };
    }

    return { text: `STATUS: UKOŃCZONO (0/${requiredCount})`, color: 'default' };
  });

  // Klasy CSS dla statusu etapu 3
  const stage3StatusClasses = computed(() => {
    const color = stage3Status.value.color;
    const baseClasses = 'text-sm';

    switch (color) {
      case 'yellow':
        return `${baseClasses} text-yellow-600 dark:text-yellow-400`;
      default:
        return `${baseClasses} text-surface-600 dark:text-surface-400`;
    }
  });

  // Kolor ikony checkmark dla ETAP 3
  const checkmark3Color = computed(() => {
    stage3SettingsKey.value;

    const stageSettings = settingsStore.getStageSettings('stage3');
    if (!stageSettings) return 'red';

    const requiredCards = stageSettings.filter(c => c.required);
    if (requiredCards.length === 0) return 'red';

    const requiredCardColors = requiredCards.map(card => getCardColor(card.id, 'stage3'));

    if (requiredCardColors.every(color => color === 'green')) {
      return 'green';
    }

    if (requiredCardColors.every(color => color === 'red')) {
      return 'red';
    }

    return 'yellow';
  });

  // Klasy CSS dla ikony checkmark ETAP 3
  const checkmark3Classes = computed(() => {
    const color = checkmark3Color.value;
    const baseClasses = 'w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ring-1';

    switch (color) {
      case 'red':
        return `${baseClasses} border-red-400 bg-red-400/10 shadow-[0_0_8px_rgba(239,68,68,0.5)] ring-red-400/50`;
      case 'yellow':
        return `${baseClasses} border-yellow-400 bg-yellow-400/10 shadow-[0_0_8px_rgba(234,179,8,0.5)] ring-yellow-400/50`;
      case 'green':
        return `${baseClasses} border-green-400 bg-green-400/10 shadow-[0_0_8px_rgba(34,197,94,0.5)] ring-green-400/50`;
      default:
        return `${baseClasses} border-green-400 bg-green-400/10 shadow-[0_0_8px_rgba(34,197,94,0.5)] ring-green-400/50`;
    }
  });

  // Klasy CSS dla ikony checkmark ETAP 3 (ikona wewnątrz)
  const checkmark3IconClasses = computed(() => {
    const color = checkmark3Color.value;
    const baseClasses = 'w-5 h-5';

    switch (color) {
      case 'red':
        return `${baseClasses} text-red-400`;
      case 'yellow':
        return `${baseClasses} text-yellow-400`;
      case 'green':
        return `${baseClasses} text-green-400`;
      default:
        return `${baseClasses} text-green-400`;
    }
  });

  // Status etapu 4
  const stage4Status = computed(() => {
    stage4SettingsKey.value;

    const stageSettings = settingsStore.getStageSettings('stage4');
    if (!stageSettings) {
      return { text: 'STATUS: UKOŃCZONO (0/0)', color: 'default' };
    }

    const requiredCards = stageSettings.filter(c => c.required);
    const requiredCount = requiredCards.length;

    if (requiredCount === 0) {
      return { text: 'STATUS: UKOŃCZONO (0/0)', color: 'default' };
    }

    const greenRequiredCards = requiredCards.filter(card => getCardColor(card.id, 'stage4') === 'green');
    const greenCount = greenRequiredCards.length;

    if (greenCount > 0) {
      return { text: `STATUS: UKOŃCZONO (${greenCount}/${requiredCount})`, color: 'default' };
    }

    return { text: `STATUS: UKOŃCZONO (0/${requiredCount})`, color: 'default' };
  });

  // Klasy CSS dla statusu etapu 4
  const stage4StatusClasses = computed(() => {
    const color = stage4Status.value.color;
    const baseClasses = 'text-sm';

    switch (color) {
      case 'yellow':
        return `${baseClasses} text-yellow-600 dark:text-yellow-400`;
      default:
        return `${baseClasses} text-surface-600 dark:text-surface-400`;
    }
  });

  // Kolor ikony checkmark dla ETAP 4
  const checkmark4Color = computed(() => {
    stage4SettingsKey.value;

    const stageSettings = settingsStore.getStageSettings('stage4');
    if (!stageSettings) return 'red';

    const requiredCards = stageSettings.filter(c => c.required);
    if (requiredCards.length === 0) return 'red';

    const requiredCardColors = requiredCards.map(card => getCardColor(card.id, 'stage4'));

    if (requiredCardColors.every(color => color === 'green')) {
      return 'green';
    }

    if (requiredCardColors.every(color => color === 'red')) {
      return 'red';
    }

    return 'yellow';
  });

  // Klasy CSS dla ikony checkmark ETAP 4
  const checkmark4Classes = computed(() => {
    const color = checkmark4Color.value;
    const baseClasses = 'w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ring-1';

    switch (color) {
      case 'red':
        return `${baseClasses} border-red-400 bg-red-400/10 shadow-[0_0_8px_rgba(239,68,68,0.5)] ring-red-400/50`;
      case 'yellow':
        return `${baseClasses} border-yellow-400 bg-yellow-400/10 shadow-[0_0_8px_rgba(234,179,8,0.5)] ring-yellow-400/50`;
      case 'green':
        return `${baseClasses} border-green-400 bg-green-400/10 shadow-[0_0_8px_rgba(34,197,94,0.5)] ring-green-400/50`;
      default:
        return `${baseClasses} border-green-400 bg-green-400/10 shadow-[0_0_8px_rgba(34,197,94,0.5)] ring-green-400/50`;
    }
  });

  // Klasy CSS dla ikony checkmark ETAP 4 (ikona wewnątrz)
  const checkmark4IconClasses = computed(() => {
    const color = checkmark4Color.value;
    const baseClasses = 'w-5 h-5';

    switch (color) {
      case 'red':
        return `${baseClasses} text-red-400`;
      case 'yellow':
        return `${baseClasses} text-yellow-400`;
      case 'green':
        return `${baseClasses} text-green-400`;
      default:
        return `${baseClasses} text-green-400`;
    }
  });

  // Computed properties dla disabled pól
  const isZudpDateFieldsDisabled = computed(() => {
    if (isReadonly.value) return true;
    return gasConnection.value?.gasConnectionDesign?.withoutZud === true;
  });

  const isUtilityCompanyDateFieldsDisabled = computed(() => {
    if (isReadonly.value) return true;
    const utilityCompanyType = gasConnection.value?.gasConnectionDesign?.utilityCompanyType;
    return utilityCompanyType === null || utilityCompanyType === undefined;
  });

  const isTrafficOrganizationProjectDateFieldsDisabled = computed(() => {
    if (isReadonly.value) return true;
    return gasConnection.value?.gasConnectionDesign?.withoutTrafficOrganizationProject === true;
  });

  const isDesignerTrafficSelectDisabled = computed(() => {
    if (isReadonly.value) return true;
    return gasConnection.value?.gasConnectionDesign?.withoutTrafficOrganizationProject === true;
  });

  const isGeodetaSelectDisabled = computed(() => {
    if (isReadonly.value) return true;
    const deliveredBy = gasConnection.value?.gasConnectionDesign?.mapDeliveredBy;
    if (deliveredBy === undefined || deliveredBy === null) return true;
    return deliveredBy !== MapDeliveredBy.Geodeta;
  });

  // Funkcja do określania koloru pojedynczej działki na podstawie dat
  const getPlotColor = (plot: any): 'red' | 'yellow' | 'green' => {
    const hasSubmission = !!plot.submissionDate;
    const hasReceipt = !!plot.receiptDate;

    if (hasSubmission && hasReceipt) return 'green';
    if (hasSubmission && !hasReceipt) return 'yellow';
    return 'red';
  };

  // Funkcja do obliczania koloru działek (używana dla przycisku "+ właściciele działek")
  const getPlotsColor = (): 'red' | 'yellow' | 'green' => {
    const plots = gasConnection.value?.plots || [];
    if (plots.length === 0) return 'red';

    const plotColors = plots.map(plot => getPlotColor(plot));

    // Jeśli wszystkie są zielone → zielony
    if (plotColors.every(color => color === 'green')) {
      return 'green';
    }

    // Jeśli wszystkie są czerwone → czerwony
    if (plotColors.every(color => color === 'red')) {
      return 'red';
    }

    // Jeśli którykolwiek ma kolor inny niż czerwony → żółty
    return 'yellow';
  };

  // Funkcje pomocnicze dla przycisków
  const getPlotOwnersStatus = (): 'red' | 'yellow' | 'green' | 'default' => {
    // Użyj koloru działek zamiast getCardColor dla plotOwners
    return getPlotsColor();
  };

  const getPlotOwnersClasses = (): string => {
    const status = getPlotOwnersStatus();
    const baseClasses = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-medium text-sm transition-colors';

    switch (status) {
      case 'red':
        return `${baseClasses} bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-500 text-red-700 dark:text-red-300`;
      case 'yellow':
        return `${baseClasses} bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 dark:border-yellow-500 text-yellow-700 dark:text-yellow-300`;
      case 'green':
        return `${baseClasses} bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-500 text-green-700 dark:text-green-300`;
      default:
        return `${baseClasses} bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300`;
    }
  };

  const getLaneOccupationStatus = (): 'red' | 'yellow' | 'green' | 'default' => {
    return 'default';
  };

  const getLaneOccupationClasses = (): string => {
    const status = getLaneOccupationStatus();
    const baseClasses = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-medium text-sm transition-colors';

    switch (status) {
      case 'red':
        return `${baseClasses} bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-500 text-red-700 dark:text-red-300`;
      case 'yellow':
        return `${baseClasses} bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 dark:border-yellow-500 text-yellow-700 dark:text-yellow-300`;
      case 'green':
        return `${baseClasses} bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-500 text-green-700 dark:text-green-300`;
      default:
        return `${baseClasses} bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300`;
    }
  };

  return {
    // Refs
    stage1SettingsKey,
    stage2SettingsKey,
    stage3SettingsKey,
    stage4SettingsKey,
    stageSettingsDialogVisible,
    stage2SettingsDialogVisible,
    stage3SettingsDialogVisible,
    stage4SettingsDialogVisible,
    // Lists
    stage1Cards,
    stage2Cards,
    stage3Cards,
    stage4Cards,
    // Functions
    getCardFields,
    isFieldEmpty,
    isCardFieldEmpty,
    isCardFieldComplete,
    isCardFieldPartial,
    getCardColor,
    getCardHeaderClasses,
    getCardHeaderTextClasses,
    getCardBorderClasses,
    getPlotOwnersStatus,
    getPlotOwnersClasses,
    getLaneOccupationStatus,
    getLaneOccupationClasses,
    // Computed - Stage 1
    stageStatus,
    stageStatusClasses,
    checkmarkColor,
    checkmarkClasses,
    checkmarkIconClasses,
    // Computed - Stage 2
    stage2Status,
    stage2StatusClasses,
    checkmark2Color,
    checkmark2Classes,
    checkmark2IconClasses,
    // Computed - Stage 3
    stage3Status,
    stage3StatusClasses,
    checkmark3Color,
    checkmark3Classes,
    checkmark3IconClasses,
    // Computed - Stage 4
    stage4Status,
    stage4StatusClasses,
    checkmark4Color,
    checkmark4Classes,
    checkmark4IconClasses,
    // Computed - Disabled fields
    isZudpDateFieldsDisabled,
    isUtilityCompanyDateFieldsDisabled,
    isTrafficOrganizationProjectDateFieldsDisabled,
    isDesignerTrafficSelectDisabled,
    isGeodetaSelectDisabled,
  };
}
