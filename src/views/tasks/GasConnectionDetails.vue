<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import SidebarMenu from '@/components/tasks/SidebarMenu.vue';
import LocationMap from '@/components/maps/LocationMap.vue';
import StageSettingsDialog from '@/components/tasks/StageSettingsDialog.vue';
import { useGasConnectionsStore } from '@/stores/gasConnections';
import { useSettingsStore } from '@/stores/settings';
import { useSurveyorsStore } from '@/stores/surveyors';
import type { GasConnection } from '@/types/GasConnection';
import { MapDeliveredBy } from '@/types/Commons';
import { getPersonDisplayName, formatDate, formatMoney } from '@/utils/tableFormatters';
import {
    DocumentIcon,
    MapPinIcon,
    ClipboardDocumentIcon,
    MapIcon,
} from '@heroicons/vue/24/outline';
import { CheckIcon } from '@heroicons/vue/24/solid';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import Panel from 'primevue/panel';
import Card from 'primevue/card';
import DatePicker from 'primevue/datepicker';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import type { UtilityCompanyType } from '@/types/Commons';

const router = useRouter();
const route = useRoute();
const gasConnectionsStore = useGasConnectionsStore();
const settingsStore = useSettingsStore();
const surveyorsStore = useSurveyorsStore();

// Opcje dla Select "Mapę dostarczył"
const mapDeliveredByOptions = [
    { label: 'Geodeta', value: MapDeliveredBy.Geodeta },
    { label: 'Klient', value: MapDeliveredBy.Klient },
    { label: 'Ośrodek', value: MapDeliveredBy.Ośrodek },
];

// Opcje dla Select "ZAKŁAD" (ETAP 2)
const utilityCompanyTypeOptions = [
    { label: 'Komunalny', value: { id: 1, name: 'Komunalny' } as UtilityCompanyType },
    { label: 'Archeolog', value: { id: 2, name: 'Archeolog' } as UtilityCompanyType },
    { label: 'Konserwator zabytków', value: { id: 3, name: 'Konserwator zabytków' } as UtilityCompanyType },
    { label: 'Spółki wodne', value: { id: 4, name: 'Spółki wodne' } as UtilityCompanyType },
];

// Lista geodetów dla Select "Geodeta"
const surveyorsOptions = computed(() => {
    return surveyorsStore.getAllSurveyors({ status: true }).map(surveyor => ({
        label: `${surveyor.name} ${surveyor.lastName}`,
        value: surveyor,
    }));
});

// Sprawdza czy Select "Geodeta" powinien być disabled
const isGeodetaSelectDisabled = computed(() => {
    if (isReadonly.value) return true;
    const deliveredBy = gasConnection.value?.gasConnectionDesign?.mapDeliveredBy;
    // Jeśli mapDeliveredBy nie jest ustawione (undefined/null), select jest disabled
    if (deliveredBy === undefined || deliveredBy === null) return true;
    // Jeśli wybrano kogoś innego niż Geodeta, select jest disabled
    return deliveredBy !== MapDeliveredBy.Geodeta;
});

// Sprawdza czy pola dat ZUDP powinny być disabled (ETAP 2)
const isZudpDateFieldsDisabled = computed(() => {
    if (isReadonly.value) return true;
    return gasConnection.value?.gasConnectionDesign?.withoutZud === true;
});

// Sprawdza czy pola dat ZAKŁAD powinny być disabled (ETAP 2)
const isUtilityCompanyDateFieldsDisabled = computed(() => {
    if (isReadonly.value) return true;
    const utilityCompanyType = gasConnection.value?.gasConnectionDesign?.utilityCompanyType;
    return utilityCompanyType === null || utilityCompanyType === undefined;
});

// Status etapu 2
const stage2Status = computed(() => {
    // Używamy klucza re-renderu, aby wymusić odświeżenie po zapisaniu ustawień
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

    // Liczymy zielone Cardy (tylko obowiązkowe)
    const greenRequiredCards = requiredCards.filter(card => getCardColor(card.id, 'stage2') === 'green');
    const greenCount = greenRequiredCards.length;

    if (greenCount > 0) {
        return { text: `STATUS: UKOŃCZONO (${greenCount}/${requiredCount})`, color: 'default' };
    }

    return { text: `STATUS: UKOŃCZONO (0/${requiredCount})`, color: 'default' };
});

// Status etapu 3
const stage3Status = computed(() => {
    // Używamy klucza re-renderu, aby wymusić odświeżenie po zapisaniu ustawień
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

    // Liczymy zielone Cardy (tylko obowiązkowe)
    const greenRequiredCards = requiredCards.filter(card => getCardColor(card.id, 'stage3') === 'green');
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

// Kolor ikony checkmark dla ETAP 2
const checkmark2Color = computed(() => {
    // Używamy klucza re-renderu, aby wymusić odświeżenie po zapisaniu ustawień
    stage2SettingsKey.value;

    const stageSettings = settingsStore.getStageSettings('stage2');
    if (!stageSettings) return 'green';

    const requiredCards = stageSettings.filter(c => c.required);
    if (requiredCards.length === 0) return 'green';

    // Sprawdzamy kolory wszystkich obowiązkowych Cardów
    const requiredCardColors = requiredCards.map(card => getCardColor(card.id, 'stage2'));

    // Jeśli wszystkie obowiązkowe Cardy są zielone → zielony
    if (requiredCardColors.every(color => color === 'green')) {
        return 'green';
    }

    // Jeśli wszystkie obowiązkowe Cardy są czerwone → czerwony
    if (requiredCardColors.every(color => color === 'red')) {
        return 'red';
    }

    // W przeciwnym razie (mieszanka: żółty + cokolwiek, zielony + czerwony, itp.) → żółty
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

// Kolor ikony checkmark dla ETAP 3
const checkmark3Color = computed(() => {
    // Używamy klucza re-renderu, aby wymusić odświeżenie po zapisaniu ustawień
    stage3SettingsKey.value;

    const stageSettings = settingsStore.getStageSettings('stage3');
    if (!stageSettings) return 'red';

    const requiredCards = stageSettings.filter(c => c.required);
    if (requiredCards.length === 0) return 'red';

    // Sprawdzamy kolory wszystkich obowiązkowych Cardów
    const requiredCardColors = requiredCards.map(card => getCardColor(card.id, 'stage3'));

    // Jeśli wszystkie obowiązkowe Cardy są zielone → zielony
    if (requiredCardColors.every(color => color === 'green')) {
        return 'green';
    }

    // Jeśli wszystkie obowiązkowe Cardy są czerwone → czerwony
    if (requiredCardColors.every(color => color === 'red')) {
        return 'red';
    }

    // W przeciwnym razie (mieszanka: żółty + cokolwiek, zielony + czerwony, itp.) → żółty
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

// Oblicza stan dla "+ właściciele działek" (ETAP 2)
// TODO: Ta metoda będzie uzupełniona w późniejszym terminie
const getPlotOwnersStatus = (): 'red' | 'yellow' | 'green' | 'default' => {
    // Użyj funkcji getCardColor dla plotOwners
    return getCardColor('plotOwners', 'stage2');
};

// Zwraca klasy CSS dla "+ właściciele działek" na podstawie stanu
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

const gasConnection = ref<GasConnection | undefined>(undefined);
const isReadonly = computed(() => route.query.readonly === 'true');
const activeTab = ref<string>('projekt');
const stageSettingsDialogVisible = ref(false);
const stage2SettingsDialogVisible = ref(false);
const stage3SettingsDialogVisible = ref(false);
// Klucz do wymuszenia re-renderu Cardów po zmianie ustawień
const stage1SettingsKey = ref(0);
const stage2SettingsKey = ref(0);
const stage3SettingsKey = ref(0);

// Lista Cardów dla etapu 1
const stage1Cards = [
    { id: 'projectOrder', title: 'Zlecenie Projektu' },
    { id: 'proxy', title: 'Pełnomocnictwo' },
    { id: 'extract', title: 'Wypis' },
    { id: 'map', title: 'Mapa' },
    { id: 'coordinates', title: 'Współrzędne' },
];

// Lista Cardów dla etapu 2
const stage2Cards = [
    { id: 'zudp', title: 'ZUDP' },
    { id: 'utilityCompany', title: 'ZAKŁAD' },
    { id: 'plotOwners', title: 'Właściciele działek' },
];

// Lista Cardów dla etapu 3
const stage3Cards = [
    { id: 'wsgAgreement', title: 'UZGODNIENIE WSG' },
    { id: 'wsgAgreementPointScheme', title: 'UZG. SCHEMATU PUNKTU W WSG' },
];

// Mapowanie pól dla każdego Card
// Parametr _stage jest przekazywany dla spójności z innymi funkcjami, ale obecnie nie jest używany w ciele funkcji
const getCardFields = (cardId: string, _stage: 'stage1' | 'stage2' | 'stage3' = 'stage1'): string[] => {
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

    // Dla mapDeliveredBy - sprawdzamy tylko undefined/null, nie 0 (bo 0 to prawidłowa wartość "Geodeta")

    // Dla number sprawdzamy tylko undefined/null, nie 0 (bo 0 może być prawidłową wartością)
    if (typeof value === 'object' && value !== null && Object.keys(value).length === 0) return true;

    return false;
};

// Sprawdza czy wszystkie obowiązkowe pola Card są puste
const isCardFieldEmpty = (cardId: string, stage: 'stage1' | 'stage2' | 'stage3' = 'stage1'): boolean => {
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

    const requiredFields = fields; // Wszystkie pola są sprawdzane, ale tylko dla obowiązkowych Cardów

    return requiredFields.every(field => isFieldEmpty(field));
};

// Sprawdza czy wszystkie obowiązkowe pola Card są uzupełnione
const isCardFieldComplete = (cardId: string, stage: 'stage1' | 'stage2' | 'stage3' = 'stage1'): boolean => {
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

    const requiredFields = fields; // Wszystkie pola są sprawdzane, ale tylko dla obowiązkowych Cardów

    return requiredFields.every(field => !isFieldEmpty(field));
};

// Sprawdza czy którekolwiek obowiązkowe pole Card jest wypełnione (ale nie wszystkie)
const isCardFieldPartial = (cardId: string, stage: 'stage1' | 'stage2' | 'stage3' = 'stage1'): boolean => {
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

    const requiredFields = fields;

    const filledFields = requiredFields.filter(field => !isFieldEmpty(field));
    return filledFields.length > 0 && filledFields.length < requiredFields.length;
};

// Zwraca kolor Card na podstawie stanu
const getCardColor = (cardId: string, stage: 'stage1' | 'stage2' | 'stage3' = 'stage1'): 'red' | 'yellow' | 'green' | 'default' => {
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
const getCardHeaderClasses = (cardId: string, stage: 'stage1' | 'stage2' | 'stage3' = 'stage1'): string => {
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
const getCardHeaderTextClasses = (cardId: string, stage: 'stage1' | 'stage2' | 'stage3' = 'stage1'): string => {
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
const getCardBorderClasses = (cardId: string, stage: 'stage1' | 'stage2' | 'stage3' = 'stage1'): string => {
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

// Status etapu
const stageStatus = computed(() => {
    // Używamy klucza re-renderu, aby wymusić odświeżenie po zapisaniu ustawień
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


    // Liczymy zielone Cardy (tylko obowiązkowe)
    const greenRequiredCards = requiredCards.filter(card => getCardColor(card.id) === 'green');
    const greenCount = greenRequiredCards.length;

    if (greenCount > 0) {
        return { text: `STATUS: UKOŃCZONO (${greenCount}/${requiredCount})`, color: 'default' };
    }

    return { text: `STATUS: UKOŃCZONO (0/${requiredCount})`, color: 'default' };
});

// Klasy CSS dla statusu etapu
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

// Kolor ikony checkmark
const checkmarkColor = computed(() => {
    // Używamy klucza re-renderu, aby wymusić odświeżenie po zapisaniu ustawień
    stage1SettingsKey.value;

    const stageSettings = settingsStore.getStageSettings('stage1');
    if (!stageSettings) return 'green';

    const requiredCards = stageSettings.filter(c => c.required);
    if (requiredCards.length === 0) return 'green';

    // Sprawdzamy kolory wszystkich obowiązkowych Cardów
    const requiredCardColors = requiredCards.map(card => getCardColor(card.id));

    // Jeśli wszystkie obowiązkowe Cardy są zielone → zielony
    if (requiredCardColors.every(color => color === 'green')) {
        return 'green';
    }

    // Jeśli wszystkie obowiązkowe Cardy są czerwone → czerwony
    if (requiredCardColors.every(color => color === 'red')) {
        return 'red';
    }

    // W przeciwnym razie (mieszanka: żółty + cokolwiek, zielony + czerwony, itp.) → żółty
    return 'yellow';
});

// Klasy CSS dla ikony checkmark
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

// Klasy CSS dla ikony checkmark (ikona wewnątrz)
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

// Lokalne refs dla współrzędnych, aby umożliwić edycję
const latitude = ref<string>('');
const longitude = ref<string>('');

// Synchronizuj lokalne refs z gasConnection
watch(
    () => gasConnection.value?.address?.coordinates,
    (coordinates) => {
        if (coordinates) {
            latitude.value = coordinates.latitude || '';
            longitude.value = coordinates.longitude || '';
        } else {
            latitude.value = '';
            longitude.value = '';
        }
    },
    { immediate: true, deep: true }
);

onMounted(() => {
    const id = route.query.id;
    if (id) {
        const connectionId = typeof id === 'string' ? parseInt(id, 10) : Number(id);
        if (!isNaN(connectionId)) {
            const connection = gasConnectionsStore.getGasConnection(connectionId);
            if (connection) {
                gasConnection.value = connection;
            }
        }
    }
});


// Nazwisko klienta
const customerName = computed(() => {
    if (!gasConnection.value?.customer) return '-';
    const customer = gasConnection.value.customer;
    if (customer.customerType === 'person') {
        return `${customer.lastName || ''} ${customer.firstName || ''}`.trim() || '-';
    }
    return customer.companyName || '-';
});

// Gmina / Miasto
const location = computed(() => {
    if (!gasConnection.value?.address) return '-';
    const addr = gasConnection.value.address;
    const parts = [];
    if (addr.commune) parts.push(addr.commune);
    if (addr.city) parts.push(addr.city);
    return parts.join(' / ') || '-';
});

// Ulica, działka
const streetAndPlot = computed(() => {
    const parts = [];
    if (gasConnection.value?.address?.street) {
        parts.push(gasConnection.value.address.street);
    }
    if (gasConnection.value?.plots && gasConnection.value.plots.length > 0) {
        const plotNumbers = gasConnection.value.plots.map(p => `dz. ${p.plotNumber}`).join(', ');
        if (plotNumbers) parts.push(plotNumbers);
    }
    return parts.join(', ') || '-';
});
</script>

<template>
    <div class="flex h-screen bg-surface-0 dark:bg-surface-950 overflow-hidden">
        <!-- Sidebar Menu -->
        <SidebarMenu />

        <!-- Main Content -->
        <div class="flex-1 overflow-y-auto p-6">
            <div class="max-w-full mx-auto">
                <div class="mb-6">
                    <div class="flex items-center gap-2 mb-2">
                        <button @click="router.push('/tasks/gas-connections')"
                            class="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 transition-colors cursor-pointer">
                            ← powrót do listy zadań
                        </button>
                    </div>
                    <h1 class="text-3xl font-bold text-surface-700 dark:text-surface-300 mb-2">
                        Szczegóły Przyłącza Gazu
                        <span v-if="isReadonly" class="text-lg font-normal text-surface-600 dark:text-surface-400">
                            (Tylko do odczytu)
                        </span>
                    </h1>
                    <p class="text-sm text-surface-600 dark:text-surface-400">
                        Zarządzanie instalacjami gazowymi • Szczegóły zlecenia
                    </p>
                </div>

                <!-- Kontener z "Dane Zadania" i zakładkami obok siebie -->
                <div v-if="gasConnection" class="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-6 mb-6">
                    <!-- Karta Dane Zadania -->
                    <div
                        class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
                        <h2 class="text-xl font-bold text-surface-700 dark:text-surface-300 mb-6">Dane
                            Zadania</h2>
                        <Divider />
                        <div class="space-y-4">
                            <!-- Pierwszy rząd: NAZWISKO, GMINA / MIASTO, ULICA, DZIAŁKA -->
                            <div class="grid grid-cols-1 gap-2">
                                <div>
                                    <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1 ">
                                        Nazwisko
                                    </label>
                                    <p class="text-sm font-semibold text-surface-700 dark:text-surface-300">
                                        {{ customerName }}
                                    </p>
                                </div>
                                <div>
                                    <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1 ">
                                        Gmina / Miasto
                                    </label>
                                    <p class="text-sm font-semibold text-surface-700 dark:text-surface-300">
                                        {{ location }}
                                    </p>
                                </div>
                                <div>
                                    <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1 ">
                                        Ulica, Działka
                                    </label>
                                    <p class="text-sm font-semibold text-surface-700 dark:text-surface-300">
                                        {{ streetAndPlot }}
                                    </p>
                                </div>
                            </div>
                            <Divider />

                            <!-- Drugi rząd: NR ZLECENIA, NR UMOWY, DATA UMOWY -->
                            <div class="grid grid-cols-2 gap-2">
                                <div>
                                    <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1 ">
                                        Nr Zlecenia
                                    </label>
                                    <p class="text-sm font-semibold text-orange-600 dark:text-orange-400">
                                        {{ gasConnection.taskNo || '-' }}
                                    </p>
                                </div>
                                <div>
                                    <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1 ">
                                        Nr SAP/UP
                                    </label>
                                    <p class="text-sm font-semibold text-orange-600 dark:text-orange-400">
                                        {{ gasConnection.sapUpNo || '-' }}
                                    </p>
                                </div>
                                <div>
                                    <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1 ">
                                        Nr Umowy
                                    </label>
                                    <p class="text-sm font-semibold text-surface-700 dark:text-surface-300">
                                        {{ gasConnection.contractNo || '-' }}
                                    </p>
                                </div>
                                <div>
                                    <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1 ">
                                        Data Umowy
                                    </label>
                                    <p class="text-sm font-semibold text-surface-700 dark:text-surface-300">
                                        {{ formatDate(gasConnection.contractDate) || '-' }}
                                    </p>
                                </div>
                                <div>
                                    <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1 ">
                                        Termin zakończenia
                                    </label>
                                    <p class="text-sm font-semibold text-red-600 dark:text-red-400">
                                        {{ formatDate(gasConnection.contractDate) || '-' }}
                                    </p>
                                </div>
                                <div>
                                    <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1 ">
                                        Termin Odb. Tech
                                    </label>
                                    <p class="text-sm font-semibold text-surface-700 dark:text-surface-300">
                                        {{ formatDate(gasConnection.gasConnectionBuild?.wsgTechnicalAcceptanceDate ||
                                            gasConnection.finishDeadline) || '-' }}
                                    </p>
                                </div>
                            </div>

                            <Divider />

                            <!-- Trzeci rząd: TERMIN PROJ., TERMIN ODB. TECH -->
                            <div class="grid grid-cols-1 gap-2">
                                <div>
                                    <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1 ">
                                        Termin Proj.
                                    </label>
                                    <p class="text-sm font-semibold text-red-600 dark:text-red-400">
                                        {{ formatDate(gasConnection.projectDeadline) || '-' }}
                                    </p>
                                </div>
                                <div>
                                    <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1 ">
                                        Projektant
                                    </label>
                                    <p class="text-sm font-semibold text-surface-700 dark:text-surface-300">
                                        {{ getPersonDisplayName(gasConnection.designer) || '-' }}
                                    </p>
                                </div>
                                <div>
                                    <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1 ">
                                        Koordynator
                                    </label>
                                    <p class="text-sm font-semibold text-surface-700 dark:text-surface-300">
                                        {{ getPersonDisplayName(gasConnection.coordinator) || '-' }}
                                    </p>
                                </div>
                            </div>

                            <Divider />


                            <!-- Piąty rząd: Wartość proj., Wartość wyk., Wartość zad. -->
                            <div class="space-y-0">
                                <div class="flex items-center justify-between ">
                                    <label class="text-xs text-surface-600 dark:text-surface-400">
                                        Wartość proj.
                                    </label>
                                    <p class="text-sm font-semibold text-surface-700 dark:text-surface-300">
                                        {{ formatMoney(gasConnection.projectValue) || '-' }}
                                    </p>
                                </div>
                                <div class="flex items-center justify-between ">
                                    <label class="text-xs text-surface-600 dark:text-surface-400">
                                        Wartość wyk.
                                    </label>
                                    <p class="text-sm font-semibold text-surface-700 dark:text-surface-300">
                                        {{ formatMoney(gasConnection.constructionValue) || '-' }}
                                    </p>
                                </div>
                                <Divider type="dashed" />
                                <div class="flex items-center justify-between">
                                    <label class="text-xs font-bold text-surface-700 dark:text-surface-300">
                                        Wartość zad.
                                    </label>
                                    <p class="text-base font-bold text-orange-600 dark:text-orange-400">
                                        {{ formatMoney(gasConnection.taskValue) || '-' }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Zakładki -->
                    <div
                        class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
                        <Tabs v-model:value="activeTab">
                            <TabList>
                                <Tab value="projekt">Projekt</Tab>
                                <Tab value="projekt-cd">Projekt cd.</Tab>
                                <Tab value="wykonawstwo">Wykonawstwo</Tab>
                                <Tab value="finanse">Finanse</Tab>
                                <Tab value="finanse-cd">Finanse cd.</Tab>
                                <Tab value="zakres">Zakres</Tab>
                                <Tab value="pliki">Pliki</Tab>
                            </TabList>

                            <TabPanels>
                                <!-- Zakładka Projekt -->
                                <TabPanel value="projekt">
                                    <Panel :key="stage1SettingsKey" toggleable>
                                        <template #header>
                                            <div class="flex items-center justify-between w-full">
                                                <div class="flex items-center gap-4">
                                                    <!-- Żółta ikona clipboard -->
                                                    <div
                                                        class="w-12 h-12 bg-yellow-400/70 rounded-full flex items-center justify-center shrink-0">
                                                        <ClipboardDocumentIcon class="w-8 h-8 text-white" />
                                                    </div>
                                                    <!-- Tekst -->
                                                    <div>
                                                        <div
                                                            class="text-lg font-bold uppercase text-surface-700 dark:text-surface-300">
                                                            ETAP 1
                                                        </div>
                                                        <div :class="stageStatusClasses">
                                                            {{ stageStatus.text }}
                                                        </div>
                                                    </div>
                                                </div>
                                                <!-- Ikony po prawej stronie -->
                                                <div class="flex items-center gap-2">
                                                    <!-- Ikona checkmark -->
                                                    <div :class="checkmarkClasses">
                                                        <CheckIcon :class="checkmarkIconClasses" />
                                                    </div>
                                                    <!-- Ikona ustawień -->
                                                    <Button icon="pi pi-cog" text severity="secondary" rounded
                                                        @click="stageSettingsDialogVisible = true" />
                                                </div>
                                            </div>
                                        </template>

                                        <!-- Karty w dwóch kolumnach -->
                                        <div class="p-6">
                                            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                                <!-- Lewa kolumna -->
                                                <div class="space-y-6">
                                                    <!-- Karta ZLECENIE PROJEKTU -->
                                                    <Card :key="`projectOrder-${stage1SettingsKey}`"
                                                        data-card-id="projectOrder"
                                                        :class="`border ${getCardBorderClasses('projectOrder')} overflow-hidden`">
                                                        <template #header>
                                                            <div :class="getCardHeaderClasses('projectOrder')">
                                                                <DocumentIcon class="w-5 h-5 text-primary-400" />
                                                                <h4 :class="getCardHeaderTextClasses('projectOrder')">
                                                                    Zlecenie Projektu
                                                                </h4>
                                                            </div>
                                                        </template>
                                                        <template #content>
                                                            <div class="space-y-4">
                                                                <div>
                                                                    <label
                                                                        class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                                                        Data złożenia
                                                                    </label>
                                                                    <DatePicker
                                                                        :modelValue="gasConnection.gasConnectionDesign?.projectOrderSubmissionDate"
                                                                        @update:modelValue="(val) => {
                                                                            if (gasConnection?.gasConnectionDesign) {
                                                                                gasConnection.gasConnectionDesign.projectOrderSubmissionDate = val as Date | undefined;
                                                                            }
                                                                        }" :disabled="isReadonly" :manualInput="false"
                                                                        showButtonBar showIcon dateFormat="dd.mm.yy"
                                                                        class="w-full" />
                                                                </div>
                                                                <div>
                                                                    <label
                                                                        class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                                                        Data potwierdz.
                                                                    </label>
                                                                    <DatePicker
                                                                        :modelValue="gasConnection.gasConnectionDesign?.projectOrderConfirmationDate"
                                                                        @update:modelValue="(val) => {
                                                                            if (gasConnection?.gasConnectionDesign) {
                                                                                gasConnection.gasConnectionDesign.projectOrderConfirmationDate = val as Date | undefined;
                                                                            }
                                                                        }"
                                                                        :disabled="isReadonly || !gasConnection?.gasConnectionDesign?.projectOrderSubmissionDate"
                                                                        :inputReadonly="true" showIcon
                                                                        :manualInput="false" showButtonBar
                                                                        dateFormat="dd.mm.yy" class="w-full" />
                                                                </div>
                                                            </div>
                                                        </template>
                                                    </Card>

                                                    <!-- Karta PEŁNOMOCNICTWO -->
                                                    <Card :key="`proxy-${stage1SettingsKey}`" data-card-id="proxy"
                                                        :class="`border ${getCardBorderClasses('proxy')} overflow-hidden`">
                                                        <template #header>
                                                            <div :class="getCardHeaderClasses('proxy')">
                                                                <DocumentIcon class="w-5 h-5 text-primary-400" />
                                                                <h4 :class="getCardHeaderTextClasses('proxy')">
                                                                    Pełnomocnictwo
                                                                </h4>
                                                            </div>
                                                        </template>
                                                        <template #content>
                                                            <div class="space-y-4">
                                                                <div>
                                                                    <label
                                                                        class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                                                        Data złożenia
                                                                    </label>
                                                                    <DatePicker
                                                                        :modelValue="gasConnection.gasConnectionDesign?.proxySubmissionDate"
                                                                        @update:modelValue="(val) => {
                                                                            if (gasConnection?.gasConnectionDesign) {
                                                                                gasConnection.gasConnectionDesign.proxySubmissionDate = val as Date | undefined;
                                                                            }
                                                                        }" :disabled="isReadonly" :manualInput="false"
                                                                        showButtonBar showIcon dateFormat="dd.mm.yy"
                                                                        class="w-full" />
                                                                </div>
                                                                <div>
                                                                    <label
                                                                        class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                                                        Data otrzymania
                                                                    </label>
                                                                    <DatePicker
                                                                        :modelValue="gasConnection.gasConnectionDesign?.proxyReceiptDate"
                                                                        @update:modelValue="(val) => {
                                                                            if (gasConnection?.gasConnectionDesign) {
                                                                                gasConnection.gasConnectionDesign.proxyReceiptDate = val as Date | undefined;
                                                                            }
                                                                        }"
                                                                        :disabled="isReadonly || !gasConnection?.gasConnectionDesign?.proxySubmissionDate"
                                                                        :inputReadonly="true" showIcon
                                                                        :manualInput="false" showButtonBar
                                                                        dateFormat="dd.mm.yy" class="w-full" />
                                                                </div>
                                                            </div>
                                                        </template>
                                                    </Card>

                                                    <!-- Karta WYPIS -->
                                                    <Card :key="`extract-${stage1SettingsKey}`" data-card-id="extract"
                                                        :class="`border ${getCardBorderClasses('extract')} overflow-hidden`">
                                                        <template #header>
                                                            <div :class="getCardHeaderClasses('extract')">
                                                                <DocumentIcon class="w-5 h-5 text-primary-400" />
                                                                <h4 :class="getCardHeaderTextClasses('extract')">
                                                                    Wypis
                                                                </h4>
                                                            </div>
                                                        </template>
                                                        <template #content>
                                                            <div class="space-y-4">
                                                                <div>
                                                                    <label
                                                                        class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                                                        Data złożenia
                                                                    </label>
                                                                    <DatePicker
                                                                        :modelValue="gasConnection.gasConnectionDesign?.extractSubmissionDate"
                                                                        @update:modelValue="(val) => {
                                                                            if (gasConnection?.gasConnectionDesign) {
                                                                                gasConnection.gasConnectionDesign.extractSubmissionDate = val as Date | undefined;
                                                                            }
                                                                        }" :disabled="isReadonly" :manualInput="false"
                                                                        showButtonBar showIcon dateFormat="dd.mm.yy"
                                                                        class="w-full" />
                                                                </div>
                                                                <div>
                                                                    <label
                                                                        class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                                                        Data otrzymania
                                                                    </label>
                                                                    <DatePicker
                                                                        :modelValue="gasConnection.gasConnectionDesign?.extractReceiptDate"
                                                                        @update:modelValue="(val) => {
                                                                            if (gasConnection?.gasConnectionDesign) {
                                                                                gasConnection.gasConnectionDesign.extractReceiptDate = val as Date | undefined;
                                                                            }
                                                                        }"
                                                                        :disabled="isReadonly || !gasConnection?.gasConnectionDesign?.extractSubmissionDate"
                                                                        :inputReadonly="true" showIcon
                                                                        :manualInput="false" showButtonBar
                                                                        dateFormat="dd.mm.yy" class="w-full" />
                                                                </div>
                                                            </div>
                                                        </template>
                                                    </Card>

                                                </div>

                                                <!-- Prawa kolumna -->
                                                <div class="space-y-6 col-span-2">

                                                    <!-- Karta MAPA -->
                                                    <Card :key="`map-${stage1SettingsKey}`" data-card-id="map"
                                                        :class="`border ${getCardBorderClasses('map')} overflow-hidden`">
                                                        <template #header>
                                                            <div :class="getCardHeaderClasses('map')">
                                                                <MapIcon class="w-5 h-5 text-primary-400" />
                                                                <h4 :class="getCardHeaderTextClasses('map')">
                                                                    Mapa
                                                                </h4>
                                                            </div>
                                                        </template>
                                                        <template #content>
                                                            <div class="grid grid-cols-2 gap-4">
                                                                <!-- Lewa kolumna - daty -->
                                                                <div class="space-y-4">
                                                                    <div>
                                                                        <label
                                                                            class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                                                            Data złożenia
                                                                        </label>
                                                                        <DatePicker
                                                                            :modelValue="gasConnection.gasConnectionDesign?.mapSubmissionDate"
                                                                            @update:modelValue="(val) => {
                                                                                if (gasConnection?.gasConnectionDesign) {
                                                                                    gasConnection.gasConnectionDesign.mapSubmissionDate = val as Date | undefined;
                                                                                }
                                                                            }" :disabled="isReadonly"
                                                                            :inputReadonly="true" showIcon
                                                                            :manualInput="false" showButtonBar
                                                                            dateFormat="dd.mm.yy" class="w-full" />
                                                                    </div>
                                                                    <div>
                                                                        <label
                                                                            class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                                                            Data otrzymania
                                                                        </label>
                                                                        <DatePicker
                                                                            :modelValue="gasConnection.gasConnectionDesign?.mapReceiptDate"
                                                                            @update:modelValue="(val) => {
                                                                                if (gasConnection?.gasConnectionDesign) {
                                                                                    gasConnection.gasConnectionDesign.mapReceiptDate = val as Date | undefined;
                                                                                }
                                                                            }" :disabled="isReadonly"
                                                                            :inputReadonly="true" showIcon
                                                                            :manualInput="false" showButtonBar
                                                                            dateFormat="dd.mm.yy" class="w-full" />
                                                                    </div>
                                                                </div>
                                                                <!-- Prawa kolumna - selecty -->
                                                                <div class="space-y-4">
                                                                    <div>
                                                                        <label
                                                                            class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                                                            Mapę dostarczył
                                                                        </label>
                                                                        <Select
                                                                            :modelValue="gasConnection.gasConnectionDesign?.mapDeliveredBy"
                                                                            :showClear="true" @update:modelValue="(val) => {
                                                                                if (gasConnection?.gasConnectionDesign) {
                                                                                    gasConnection.gasConnectionDesign.mapDeliveredBy = val as MapDeliveredBy;
                                                                                    // Jeśli wybrano coś innego niż Geodeta, wyczyść wybór geodety
                                                                                    if (val !== MapDeliveredBy.Geodeta) {
                                                                                        gasConnection.gasConnectionDesign.mapSurveyor = null;
                                                                                    }
                                                                                }
                                                                            }" :options="mapDeliveredByOptions"
                                                                            optionLabel="label" optionValue="value"
                                                                            placeholder="wybierz" class="w-full"
                                                                            :disabled="isReadonly" />
                                                                    </div>
                                                                    <div>
                                                                        <label
                                                                            class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                                                            Geodeta
                                                                        </label>
                                                                        <Select
                                                                            :modelValue="gasConnection.gasConnectionDesign?.mapSurveyor"
                                                                            :showClear="true" @update:modelValue="(val) => {
                                                                                if (gasConnection?.gasConnectionDesign) {
                                                                                    gasConnection.gasConnectionDesign.mapSurveyor = val as any;
                                                                                }
                                                                            }" :options="surveyorsOptions"
                                                                            optionLabel="label" optionValue="value"
                                                                            placeholder="wybierz" class="w-full"
                                                                            :disabled="isGeodetaSelectDisabled" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </template>
                                                    </Card>


                                                    <!-- Karta WSPÓŁRZĘDNE -->
                                                    <Card :key="`coordinates-${stage1SettingsKey}`"
                                                        data-card-id="coordinates"
                                                        :class="`border ${getCardBorderClasses('coordinates')} overflow-hidden`">
                                                        <template #header>
                                                            <div :class="getCardHeaderClasses('coordinates')">
                                                                <MapPinIcon class="w-5 h-5 text-primary-400" />
                                                                <h4 :class="getCardHeaderTextClasses('coordinates')">
                                                                    Współrzędne
                                                                </h4>
                                                            </div>
                                                        </template>
                                                        <template #content>

                                                            <!-- Mapa -->
                                                            <div v-if="latitude && longitude" class="mb-4">
                                                                <LocationMap :latitude="latitude" :longitude="longitude"
                                                                    :readonly="isReadonly" />
                                                            </div>

                                                            <!-- Pola współrzędnych -->
                                                            <div class="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <label
                                                                        class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                                                        Szerokość geograficzna (N)
                                                                    </label>
                                                                    <InputText :value="latitude" @update:value="(val: string) => {
                                                                        // Zamień przecinek na kropkę
                                                                        const normalized = val.replace(',', '.');
                                                                        latitude = normalized;
                                                                        if (gasConnection?.address?.coordinates) {
                                                                            gasConnection.address.coordinates.latitude = normalized;
                                                                        }
                                                                    }" placeholder="N: ..."
                                                                        class="w-full bg-white dark:bg-gray-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-white"
                                                                        :disabled="isReadonly" />
                                                                </div>
                                                                <div>
                                                                    <label
                                                                        class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                                                        Długość geograficzna (E)
                                                                    </label>
                                                                    <InputText :value="longitude" @update:value="(val: string) => {
                                                                        // Zamień przecinek na kropkę
                                                                        const normalized = val.replace(',', '.');
                                                                        longitude = normalized;
                                                                        if (gasConnection?.address?.coordinates) {
                                                                            gasConnection.address.coordinates.longitude = normalized;
                                                                        }
                                                                    }" placeholder="E: ..."
                                                                        class="w-full bg-white dark:bg-gray-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-white"
                                                                        :disabled="isReadonly" />
                                                                </div>
                                                            </div>
                                                        </template>
                                                    </Card>
                                                </div>

                                            </div>
                                        </div>
                                    </Panel>

                                    <!-- ETAP 2 -->
                                    <Panel :key="stage2SettingsKey" toggleable class="mt-6">
                                        <template #header>
                                            <div class="flex items-center justify-between w-full">
                                                <div class="flex items-center gap-4">
                                                    <!-- Żółta ikona clipboard -->
                                                    <div
                                                        class="w-12 h-12 bg-yellow-400/70 rounded-full flex items-center justify-center shrink-0">
                                                        <ClipboardDocumentIcon class="w-8 h-8 text-white" />
                                                    </div>
                                                    <!-- Tekst -->
                                                    <div>
                                                        <div
                                                            class="text-lg font-bold uppercase text-surface-700 dark:text-surface-300">
                                                            ETAP 2
                                                        </div>
                                                        <div :class="stage2StatusClasses">
                                                            {{ stage2Status.text }}
                                                        </div>
                                                    </div>
                                                </div>
                                                <!-- Ikony po prawej stronie -->
                                                <div class="flex items-center gap-2">
                                                    <!-- Ikona checkmark -->
                                                    <div :class="checkmark2Classes">
                                                        <CheckIcon :class="checkmark2IconClasses" />
                                                    </div>
                                                    <!-- Ikona ustawień -->
                                                    <Button icon="pi pi-cog" text severity="secondary" rounded
                                                        @click="stage2SettingsDialogVisible = true" />
                                                </div>
                                            </div>
                                        </template>

                                        <!-- Karty w dwóch kolumnach -->
                                        <div class="p-6">
                                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                <!-- Lewa kolumna - ZUDP -->
                                                <Card :key="`zudp-${stage2SettingsKey}`" data-card-id="zudp"
                                                    :class="`border ${getCardBorderClasses('zudp', 'stage2')} overflow-hidden`">
                                                    <template #header>
                                                        <div :class="getCardHeaderClasses('zudp', 'stage2')">
                                                            <DocumentIcon class="w-5 h-5 text-primary-400" />
                                                            <h4 :class="getCardHeaderTextClasses('zudp', 'stage2')">
                                                                ZUDP
                                                            </h4>
                                                        </div>
                                                    </template>
                                                    <template #content>
                                                        <div class="space-y-4">
                                                            <!-- Checkbox "uzgodnienie bez ZUD" -->
                                                            <div class="flex items-center gap-2">
                                                                <Checkbox
                                                                    :modelValue="gasConnection?.gasConnectionDesign?.withoutZud"
                                                                    @update:modelValue="(val) => {
                                                                        if (gasConnection?.gasConnectionDesign) {
                                                                            gasConnection.gasConnectionDesign.withoutZud = val as boolean;
                                                                            // Jeśli checkbox jest zaznaczony, wyczyść daty
                                                                            if (val) {
                                                                                gasConnection.gasConnectionDesign.zudpSubmissionDate = undefined;
                                                                                gasConnection.gasConnectionDesign.zudpReceiptDate = undefined;
                                                                            }
                                                                        }
                                                                    }" :binary="true" inputId="withoutZud"
                                                                    :disabled="isReadonly" />
                                                                <label for="withoutZud"
                                                                    class="text-sm font-medium text-surface-700 dark:text-surface-300 cursor-pointer">
                                                                    uzgodnienie bez ZUD
                                                                </label>
                                                            </div>

                                                            <!-- Data złożenia -->
                                                            <div>
                                                                <label
                                                                    class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                                                    Data złożenia
                                                                </label>
                                                                <div class="flex items-center gap-2">
                                                                    <DatePicker
                                                                        :modelValue="gasConnection?.gasConnectionDesign?.zudpSubmissionDate"
                                                                        @update:modelValue="(val) => {
                                                                            if (gasConnection?.gasConnectionDesign) {
                                                                                gasConnection.gasConnectionDesign.zudpSubmissionDate = val as Date | undefined;
                                                                                // Jeśli wyczyszczono datę złożenia, wyczyść datę otrzymania
                                                                                if (!val) {
                                                                                    gasConnection.gasConnectionDesign.zudpReceiptDate = undefined;
                                                                                }
                                                                            }
                                                                        }" :disabled="isZudpDateFieldsDisabled"
                                                                        :manualInput="false" showButtonBar showIcon
                                                                        dateFormat="dd.mm.yy" class="flex-1" />
                                                                    <Button icon="pi pi-file-word" severity="info" text
                                                                        rounded
                                                                        :disabled="isReadonly || isZudpDateFieldsDisabled"
                                                                        v-tooltip.top="'Generuj dokument Word'" />
                                                                </div>
                                                            </div>

                                                            <!-- Data otrzymania -->
                                                            <div>
                                                                <label
                                                                    class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                                                    Data otrzymania
                                                                </label>
                                                                <DatePicker
                                                                    :modelValue="gasConnection?.gasConnectionDesign?.zudpReceiptDate"
                                                                    @update:modelValue="(val) => {
                                                                        if (gasConnection?.gasConnectionDesign) {
                                                                            gasConnection.gasConnectionDesign.zudpReceiptDate = val as Date | undefined;
                                                                        }
                                                                    }"
                                                                    :disabled="isZudpDateFieldsDisabled || !gasConnection?.gasConnectionDesign?.zudpSubmissionDate"
                                                                    :inputReadonly="true" showIcon :manualInput="false"
                                                                    showButtonBar dateFormat="dd.mm.yy"
                                                                    class="w-full" />
                                                            </div>
                                                        </div>
                                                    </template>
                                                </Card>

                                                <!-- Prawa kolumna - ZAKŁAD -->
                                                <Card :key="`utilityCompany-${stage2SettingsKey}`"
                                                    data-card-id="utilityCompany"
                                                    :class="`border ${getCardBorderClasses('utilityCompany', 'stage2')} overflow-hidden`">
                                                    <template #header>
                                                        <div :class="getCardHeaderClasses('utilityCompany', 'stage2')">
                                                            <DocumentIcon class="w-5 h-5 text-primary-400" />
                                                            <h4
                                                                :class="getCardHeaderTextClasses('utilityCompany', 'stage2')">
                                                                ZAKŁAD ...
                                                            </h4>
                                                        </div>
                                                    </template>
                                                    <template #content>
                                                        <div class="space-y-4">
                                                            <!-- Select "Rodzaj" -->
                                                            <div>
                                                                <label
                                                                    class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                                                    Rodzaj
                                                                </label>
                                                                <Select
                                                                    :modelValue="gasConnection?.gasConnectionDesign?.utilityCompanyType"
                                                                    :showClear="true" @update:modelValue="(val) => {
                                                                        if (gasConnection?.gasConnectionDesign) {
                                                                            gasConnection.gasConnectionDesign.utilityCompanyType = val as UtilityCompanyType | null;
                                                                            // Jeśli wyczyszczono wybór, wyczyść daty
                                                                            if (!val) {
                                                                                gasConnection.gasConnectionDesign.utilityCompanySubmissionDate = undefined;
                                                                                gasConnection.gasConnectionDesign.utilityCompanyReceiptDate = undefined;
                                                                            }
                                                                        }
                                                                    }" :options="utilityCompanyTypeOptions"
                                                                    optionLabel="label" optionValue="value"
                                                                    placeholder="brak" class="w-full"
                                                                    :disabled="isReadonly" />
                                                            </div>

                                                            <!-- Data złożenia -->
                                                            <div>
                                                                <label
                                                                    class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                                                    Data złożenia
                                                                </label>
                                                                <div class="flex items-center gap-2">
                                                                    <DatePicker
                                                                        :modelValue="gasConnection?.gasConnectionDesign?.utilityCompanySubmissionDate"
                                                                        @update:modelValue="(val) => {
                                                                            if (gasConnection?.gasConnectionDesign) {
                                                                                gasConnection.gasConnectionDesign.utilityCompanySubmissionDate = val as Date | undefined;
                                                                                // Jeśli wyczyszczono datę złożenia, wyczyść datę otrzymania
                                                                                if (!val) {
                                                                                    gasConnection.gasConnectionDesign.utilityCompanyReceiptDate = undefined;
                                                                                }
                                                                            }
                                                                        }"
                                                                        :disabled="isUtilityCompanyDateFieldsDisabled"
                                                                        :manualInput="false" showButtonBar showIcon
                                                                        dateFormat="dd.mm.yy" class="flex-1" />
                                                                    <Button icon="pi pi-file-word" severity="info" text
                                                                        rounded
                                                                        :disabled="isReadonly || isUtilityCompanyDateFieldsDisabled"
                                                                        v-tooltip.top="'Generuj dokument Word'" />
                                                                </div>
                                                            </div>

                                                            <!-- Data otrzymania -->
                                                            <div>
                                                                <label
                                                                    class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                                                    Data otrzymania
                                                                </label>
                                                                <DatePicker
                                                                    :modelValue="gasConnection?.gasConnectionDesign?.utilityCompanyReceiptDate"
                                                                    @update:modelValue="(val) => {
                                                                        if (gasConnection?.gasConnectionDesign) {
                                                                            gasConnection.gasConnectionDesign.utilityCompanyReceiptDate = val as Date | undefined;
                                                                        }
                                                                    }"
                                                                    :disabled="isUtilityCompanyDateFieldsDisabled || !gasConnection?.gasConnectionDesign?.utilityCompanySubmissionDate"
                                                                    :inputReadonly="true" showIcon :manualInput="false"
                                                                    showButtonBar dateFormat="dd.mm.yy"
                                                                    class="w-full" />
                                                            </div>
                                                        </div>
                                                    </template>
                                                </Card>
                                            </div>

                                            <!-- Element "+ właściciele działek" -->
                                            <div class="mt-6">
                                                <button :class="getPlotOwnersClasses()" :disabled="isReadonly"
                                                    @click="() => { }">
                                                    <span class="text-lg font-bold">+</span>
                                                    <span>właściciele działek</span>
                                                </button>
                                            </div>
                                        </div>
                                    </Panel>

                                    <!-- ETAP 3 -->
                                    <Panel :key="stage3SettingsKey" toggleable class="mt-6">
                                        <template #header>
                                            <div class="flex items-center justify-between w-full">
                                                <div class="flex items-center gap-4">
                                                    <!-- Żółta ikona clipboard -->
                                                    <div
                                                        class="w-12 h-12 bg-yellow-400/70 rounded-full flex items-center justify-center shrink-0">
                                                        <ClipboardDocumentIcon class="w-8 h-8 text-white" />
                                                    </div>
                                                    <!-- Tekst -->
                                                    <div>
                                                        <div
                                                            class="text-lg font-bold uppercase text-surface-700 dark:text-surface-300">
                                                            ETAP 3
                                                        </div>
                                                        <div :class="stage3StatusClasses">
                                                            {{ stage3Status.text }}
                                                        </div>
                                                    </div>
                                                </div>
                                                <!-- Ikony po prawej stronie -->
                                                <div class="flex items-center gap-2">
                                                    <!-- Ikona checkmark -->
                                                    <div :class="checkmark3Classes">
                                                        <CheckIcon :class="checkmark3IconClasses" />
                                                    </div>
                                                    <!-- Ikona ustawień -->
                                                    <Button icon="pi pi-cog" text severity="secondary" rounded
                                                        @click="stage3SettingsDialogVisible = true" />
                                                </div>
                                            </div>
                                        </template>

                                        <!-- Karty w dwóch kolumnach -->
                                        <div class="p-6">
                                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                <!-- Lewa kolumna - UZGODNIENIE WSG -->
                                                <Card :key="`wsgAgreement-${stage3SettingsKey}`"
                                                    data-card-id="wsgAgreement"
                                                    :class="`border ${getCardBorderClasses('wsgAgreement', 'stage3')} overflow-hidden`">
                                                    <template #header>
                                                        <div :class="getCardHeaderClasses('wsgAgreement', 'stage3')">
                                                            <DocumentIcon class="w-5 h-5 text-primary-400" />
                                                            <h4
                                                                :class="getCardHeaderTextClasses('wsgAgreement', 'stage3')">
                                                                UZGODNIENIE WSG
                                                            </h4>
                                                        </div>
                                                    </template>
                                                    <template #content>
                                                        <div class="space-y-4">
                                                            <!-- Data złożenia -->
                                                            <div>
                                                                <label
                                                                    class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                                                    Data złożenia
                                                                </label>
                                                                <DatePicker
                                                                    :modelValue="gasConnection?.gasConnectionDesign?.wsgAgreementSubmissionDate"
                                                                    @update:modelValue="(val) => {
                                                                        if (gasConnection?.gasConnectionDesign) {
                                                                            gasConnection.gasConnectionDesign.wsgAgreementSubmissionDate = val as Date | undefined;
                                                                            // Jeśli wyczyszczono datę złożenia, wyczyść datę otrzymania
                                                                            if (!val) {
                                                                                gasConnection.gasConnectionDesign.wsgAgreementReceiptDate = undefined;
                                                                                gasConnection.gasConnectionDesign.wsgAgreementAgreementDate = undefined;
                                                                            }
                                                                        }
                                                                    }" :disabled="isReadonly" :manualInput="false"
                                                                    showButtonBar showIcon dateFormat="dd.mm.yy"
                                                                    class="w-full" />
                                                            </div>

                                                            <!-- Data otrzymania -->
                                                            <div>
                                                                <label
                                                                    class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                                                    Data otrzymania
                                                                </label>
                                                                <DatePicker
                                                                    :modelValue="gasConnection?.gasConnectionDesign?.wsgAgreementReceiptDate"
                                                                    @update:modelValue="(val) => {
                                                                        if (gasConnection?.gasConnectionDesign) {
                                                                            gasConnection.gasConnectionDesign.wsgAgreementReceiptDate = val as Date | undefined;
                                                                        }
                                                                    }"
                                                                    :disabled="isReadonly || !gasConnection?.gasConnectionDesign?.wsgAgreementSubmissionDate"
                                                                    :inputReadonly="true" showIcon :manualInput="false"
                                                                    showButtonBar dateFormat="dd.mm.yy"
                                                                    class="w-full" />
                                                            </div>

                                                            <!-- Data uzgodnienia -->
                                                            <div>
                                                                <label
                                                                    class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                                                    Data uzgodnienia
                                                                </label>
                                                                <DatePicker
                                                                    :modelValue="gasConnection?.gasConnectionDesign?.wsgAgreementAgreementDate"
                                                                    @update:modelValue="(val) => {
                                                                        if (gasConnection?.gasConnectionDesign) {
                                                                            gasConnection.gasConnectionDesign.wsgAgreementAgreementDate = val as Date | undefined;
                                                                        }
                                                                    }" :disabled="isReadonly" :manualInput="false"
                                                                    showButtonBar showIcon dateFormat="dd.mm.yy"
                                                                    class="w-full" />
                                                            </div>

                                                            <!-- Nr uzgodnienia -->
                                                            <div>
                                                                <label
                                                                    class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                                                    Nr uzgodnienia
                                                                </label>
                                                                <InputText
                                                                    :modelValue="gasConnection?.gasConnectionDesign?.wsgAgreementNo"
                                                                    @update:modelValue="(val) => {
                                                                        if (gasConnection?.gasConnectionDesign) {
                                                                            gasConnection.gasConnectionDesign.wsgAgreementNo = val as string;
                                                                        }
                                                                    }" placeholder="" class="w-full"
                                                                    :disabled="isReadonly" />
                                                            </div>
                                                        </div>
                                                    </template>
                                                </Card>

                                                <!-- Prawa kolumna - UZG. SCHEMATU PUNKTU W WSG -->
                                                <Card :key="`wsgAgreementPointScheme-${stage3SettingsKey}`"
                                                    data-card-id="wsgAgreementPointScheme"
                                                    :class="`border ${getCardBorderClasses('wsgAgreementPointScheme', 'stage3')} overflow-hidden`">
                                                    <template #header>
                                                        <div
                                                            :class="getCardHeaderClasses('wsgAgreementPointScheme', 'stage3')">
                                                            <DocumentIcon class="w-5 h-5 text-primary-400" />
                                                            <h4
                                                                :class="getCardHeaderTextClasses('wsgAgreementPointScheme', 'stage3')">
                                                                UZG. SCHEMATU PUNKTU W WSG
                                                            </h4>
                                                        </div>
                                                    </template>
                                                    <template #content>
                                                        <div class="space-y-4">
                                                            <!-- Data złożenia -->
                                                            <div>
                                                                <label
                                                                    class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                                                    Data złożenia
                                                                </label>
                                                                <DatePicker
                                                                    :modelValue="gasConnection?.gasConnectionDesign?.wsgAgreementPointSchemeSubmissionDate"
                                                                    @update:modelValue="(val) => {
                                                                        if (gasConnection?.gasConnectionDesign) {
                                                                            gasConnection.gasConnectionDesign.wsgAgreementPointSchemeSubmissionDate = val as Date | undefined;
                                                                            // Jeśli wyczyszczono datę złożenia, wyczyść datę otrzymania
                                                                            if (!val) {
                                                                                gasConnection.gasConnectionDesign.wsgAgreementPointSchemeReceiptDate = undefined;
                                                                            }
                                                                        }
                                                                    }" :disabled="isReadonly" :manualInput="false"
                                                                    showButtonBar showIcon dateFormat="dd.mm.yy"
                                                                    class="w-full" />
                                                            </div>

                                                            <!-- Data otrzymania -->
                                                            <div>
                                                                <label
                                                                    class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                                                    Data otrzymania
                                                                </label>
                                                                <DatePicker
                                                                    :modelValue="gasConnection?.gasConnectionDesign?.wsgAgreementPointSchemeReceiptDate"
                                                                    @update:modelValue="(val) => {
                                                                        if (gasConnection?.gasConnectionDesign) {
                                                                            gasConnection.gasConnectionDesign.wsgAgreementPointSchemeReceiptDate = val as Date | undefined;
                                                                        }
                                                                    }"
                                                                    :disabled="isReadonly || !gasConnection?.gasConnectionDesign?.wsgAgreementPointSchemeSubmissionDate"
                                                                    :inputReadonly="true" showIcon :manualInput="false"
                                                                    showButtonBar dateFormat="dd.mm.yy"
                                                                    class="w-full" />
                                                            </div>
                                                        </div>
                                                    </template>
                                                </Card>
                                            </div>
                                        </div>
                                    </Panel>
                                </TabPanel>

                                <!-- Zakładka Projekt cd. -->
                                <TabPanel value="projekt-cd">
                                    <div class="p-6">
                                        <p class="text-surface-600 dark:text-surface-400">Zawartość zakładki Projekt cd.
                                            zostanie dodana w przyszłości.</p>
                                    </div>
                                </TabPanel>
                                <TabPanel value="wykonawstwo">
                                    <div class="p-6">
                                        <p class="text-surface-600 dark:text-surface-400">Zawartość zakładki Wykonawstwo
                                            zostanie dodana w przyszłości.</p>
                                    </div>
                                </TabPanel>
                                <TabPanel value="wykonawstwo">
                                    <div class="p-6">
                                        <p class="text-surface-600 dark:text-surface-400">Zawartość zakładki Wykonawstwo
                                            zostanie dodana w przyszłości.</p>
                                    </div>
                                </TabPanel>
                                <TabPanel value="finanse">
                                    <div class="p-6">
                                        <p class="text-surface-600 dark:text-surface-400">Zawartość zakładki Finanse
                                            zostanie dodana w przyszłości.</p>
                                    </div>
                                </TabPanel>
                                <TabPanel value="finanse-cd">
                                    <div class="p-6">
                                        <p class="text-surface-600 dark:text-surface-400">Zawartość zakładki Finanse cd.
                                            zostanie dodana w przyszłości.</p>
                                    </div>
                                </TabPanel>
                                <TabPanel value="zakres">
                                    <div class="p-6">
                                        <p class="text-surface-600 dark:text-surface-400">Zawartość zakładki Zakres
                                            zostanie dodana w przyszłości.</p>
                                    </div>
                                </TabPanel>
                                <TabPanel value="pliki">
                                    <div class="p-6">
                                        <p class="text-surface-600 dark:text-surface-400">Zawartość zakładki Pliki
                                            zostanie dodana w przyszłości.</p>
                                    </div>
                                </TabPanel>
                            </TabPanels>
                        </Tabs>
                    </div>
                </div>

                <!-- Placeholder gdy brak danych -->
                <div v-else
                    class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
                    <p class="text-surface-600 dark:text-surface-400">
                        Brak danych do wyświetlenia.
                    </p>
                </div>
            </div>
        </div>

        <!-- Dialog ustawień etapu 1 -->
        <StageSettingsDialog v-model:visible="stageSettingsDialogVisible" stage-id="stage1" :cards="stage1Cards"
            @saved="() => { stage1SettingsKey++; }" />

        <!-- Dialog ustawień etapu 2 -->
        <StageSettingsDialog v-model:visible="stage2SettingsDialogVisible" stage-id="stage2" :cards="stage2Cards"
            @saved="() => { stage2SettingsKey++; }" />

        <!-- Dialog ustawień etapu 3 -->
        <StageSettingsDialog v-model:visible="stage3SettingsDialogVisible" stage-id="stage3" :cards="stage3Cards"
            @saved="() => { stage3SettingsKey++; }" />
    </div>
</template>
