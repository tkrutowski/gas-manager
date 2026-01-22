<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import SidebarMenu from '@/components/tasks/SidebarMenu.vue';
import SecondaryButton from '@/components/SecondaryButton.vue';
import ColumnSettingsDialog from '@/components/tasks/ColumnSettingsDialog.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import MultiSelect from 'primevue/multiselect';
import Checkbox from 'primevue/checkbox';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import DatePicker from 'primevue/datepicker';
import Select from 'primevue/select';
import SplitButton from 'primevue/splitbutton';
import Toolbar from 'primevue/toolbar';
import ConfirmPopup from 'primevue/confirmpopup';
import { useConfirm } from 'primevue/useconfirm';
import { useGasConnectionsStore } from '@/stores/gasConnections';
import { useSettingsStore } from '@/stores/settings';
import { useDesignersStore } from '@/stores/designers';
import { useCoordinatorsStore } from '@/stores/coordinators';
import { useGasDistributionsStore } from '@/stores/gasDistributions';
import { settingsService } from '@/services/settingsService';
import type { GasConnection } from '@/types/GasConnection';
import { Phase } from '@/types/GasConnection';
import type { Customer } from '@/types/Customer';
import type { GasConnectionTableColumnConfig, GasConnectionTableFilter } from '@/types/Settings';
import { getDefaultTableColumns } from '@/utils/gasConnectionTableColumns';
import {
    formatDate,
    formatMoney,
    formatPhase,
    formatWorkRangeGasConnections,
    formatWorkRangeGasStations,
    formatWorkRangeConnection,
    getPersonDisplayName,
} from '@/utils/tableFormatters';

const router = useRouter();
const gasConnectionsStore = useGasConnectionsStore();
const settingsStore = useSettingsStore();
const designersStore = useDesignersStore();
const coordinatorsStore = useCoordinatorsStore();
const gasDistributionsStore = useGasDistributionsStore();
const confirm = useConfirm();

// Dane
const gasConnections = ref<GasConnection[]>([]);
const loading = ref(false);
const selectedRow = ref<GasConnection | null>(null);

// Filtr tabeli
const selectedFilter = ref<GasConnectionTableFilter>('all');
const defaultFilter = ref<GasConnectionTableFilter | undefined>(undefined);

// Konfiguracja kolumn
const allColumns = ref<GasConnectionTableColumnConfig[]>([]);
const selectedColumns = ref<GasConnectionTableColumnConfig[]>([]);

// Dialog ustawień kolumn
const showColumnSettingsDialog = ref(false);

// Domyślne sortowanie
const defaultSortField = ref<string | undefined>(undefined);
const defaultSortOrder = ref<number | undefined>(undefined);

// Filtry
const filters = ref<Record<string, any>>({});

// Opcje dla MultiSelect filtrów
const designerOptions = computed(() => {
    return designersStore.getAllDesigners({ status: true }).map(designer => ({
        label: getPersonDisplayName(designer),
        value: designer.id
    }));
});

const coordinatorOptions = computed(() => {
    return coordinatorsStore.getAllCoordinators({ status: true }).map(coordinator => ({
        label: getPersonDisplayName(coordinator),
        value: coordinator.id
    }));
});

const gasDistributionOptions = computed(() => {
    return gasDistributionsStore.getAllGasDistributions({ isActive: true }).map(dist => ({
        label: dist.name,
        value: dist.id
    }));
});

const phaseOptions = computed(() => {
    return [
        { label: 'Brak', value: Phase.NONE },
        { label: 'Projekt', value: Phase.PROJECT },
        { label: 'Praca', value: Phase.WORK },
        { label: 'Finanse', value: Phase.FINANSE },
    ];
});

// Funkcja pomocnicza do pobierania opcji MultiSelect dla danego pola
const getMultiSelectOptions = (field: string) => {
    if (field === 'designer') {
        return designerOptions.value;
    } else if (field === 'coordinator') {
        return coordinatorOptions.value;
    } else if (field === 'gasDistribution') {
        return gasDistributionOptions.value;
    } else if (field === 'phase') {
        return phaseOptions.value;
    }
    return [];
};

// Funkcja pomocnicza do formatowania tekstu customera (dla filtrowania)
const getCustomerText = (customer: Customer | null | undefined): string => {
    if (!customer) return '';
    if (customer.customerType === 'person') {
        return `${customer.firstName || ''} ${customer.lastName || ''}`.trim().toLowerCase();
    }
    return (customer.companyName || '').toLowerCase();
};

// Funkcja pomocnicza do określenia filterField
const getFilterField = (field: string): string => {
    // Multiselect - używamy płaskich pól ID
    if (field === 'designer') return '_designerId';
    if (field === 'coordinator') return '_coordinatorId';
    if (field === 'gasDistribution') return '_gasDistributionId';

    // Pola wymagające formatowania - używamy płaskich pól tekstowych
    if (field === 'customer') return '_customerText';
    if (field === 'endCustomer') return '_endCustomerText';
    if (field === 'gasConnectionDesign.designerTraffic') return '_designerTrafficText';
    if (field === 'workRangeGasConnections') return '_workRangeGasConnectionsText';
    if (field === 'workRangeGasStations') return '_workRangeGasStationsText';
    if (field === 'workRangeConnection') return '_workRangeConnectionText';
    if (field === 'gasConnectionDesign.utilityCompanyType') return '_utilityCompanyTypeText';
    if (field === 'phase') return '_phaseText';

    // Domyślnie używamy oryginalnego pola
    return field;
};

// Funkcja sprawdzająca, czy kolumna wymaga custom sortowania/filtrowania (dla pól z "Imię Nazwisko")
const requiresCustomSortFilter = (field: string): boolean => {
    const customFields = [
        'designer',
        'coordinator',
        'customer',
        'endCustomer',
        'gasConnectionDesign.designerTraffic',
        'workRangeGasConnections',
        'workRangeGasStations',
        'workRangeConnection',
        'gasDistribution',
        'gasConnectionDesign.utilityCompanyType',
        'phase',
    ];
    return customFields.includes(field);
};

// Custom sort function dla kolumn z "Imię Nazwisko"
const customSortFunction = (field: string) => {
    return (data: GasConnection[], _sortField: string, sortOrder: number) => {
        const sorted = [...data].sort((a, b) => {
            const aVal = formatCellValue(a, { field } as GasConnectionTableColumnConfig).toLowerCase();
            const bVal = formatCellValue(b, { field } as GasConnectionTableColumnConfig).toLowerCase();
            if (aVal < bVal) return sortOrder === 1 ? -1 : 1;
            if (aVal > bVal) return sortOrder === 1 ? 1 : -1;
            return 0;
        });
        return sorted;
    };
};

// Funkcja do określenia typu filtru na podstawie pola
const getFilterType = (field: string): 'text' | 'date' | 'numeric' | 'boolean' | 'multiselect' => {
    const dateFields = [
        'contractDate',
        'conditionDate',
        'accelerationDate',
        'finishDeadline',
        'projectDeadline',
        'wsgFinalPickupDate',
        'gasConnectionDesign.projectOrderSubmissionDate',
        'gasConnectionDesign.projectOrderConfirmationDate',
        'gasConnectionDesign.proxySubmissionDate',
        'gasConnectionDesign.proxyReceiptDate',
        'gasConnectionDesign.mapSubmissionDate',
        'gasConnectionDesign.mapReceiptDate',
        'gasConnectionDesign.extractSubmissionDate',
        'gasConnectionDesign.extractReceiptDate',
        'gasConnectionDesign.zudpSubmissionDate',
        'gasConnectionDesign.zudpReceiptDate',
        'gasConnectionDesign.utilityCompanySubmissionDate',
        'gasConnectionDesign.utilityCompanyReceiptDate',
        'gasConnectionDesign.wsgAgreementSubmissionDate',
        'gasConnectionDesign.wsgAgreementReceiptDate',
        'gasConnectionDesign.wsgAgreementAgreementDate',
        'gasConnectionDesign.wsgAgreementPointSchemeSubmissionDate',
        'gasConnectionDesign.wsgAgreementPointSchemeReceiptDate',
        'gasConnectionDesign.trafficOrganizationProjectSubmissionDate',
        'gasConnectionDesign.trafficOrganizationProjectReceiptDate',
        'gasConnectionDesign.gasPointOrderDate',
        'gasConnectionDesign.gasPointPickupDate',
        'gasConnectionDesign.gasPointDocPickupDate',
        'gasConnectionDesign.zudpSentToSurveyorDate',
        'gasConnectionBuild.substationNotificationSubmissionDate',
        'gasConnectionBuild.surveyingSketchesDate',
        'gasConnectionBuild.surveyingInventoryDate',
        'gasConnectionBuild.realizationStartDate',
        'gasConnectionBuild.realizationEndDate',
        'gasConnectionBuild.wsgTechnicalAcceptanceDate',
        'gasConnectionBuild.wsgFinalAcceptanceSubmissionDate',
        'gasConnectionBuild.wsgFinalAcceptanceDate',
    ];

    if (dateFields.includes(field)) {
        return 'date';
    }

    const numericFields = ['taskValue', 'projectValue', 'constructionValue'];
    if (numericFields.includes(field)) {
        return 'numeric';
    }

    const booleanFields = ['isPGN'];
    if (booleanFields.includes(field)) {
        return 'boolean';
    }

    const multiselectFields = ['designer', 'coordinator', 'gasDistribution', 'phase'];
    if (multiselectFields.includes(field)) {
        return 'multiselect';
    }

    return 'text';
};

// Inicjalizacja filtrów dla wszystkich kolumn
const initializeFilters = () => {
    const newFilters: Record<string, any> = {};

    allColumns.value.forEach(col => {
        if (col.filterable !== false) {
            const filterType = getFilterType(col.field);
            let matchMode: string;

            if (filterType === 'date') {
                matchMode = 'dateIs';
            } else if (filterType === 'numeric') {
                matchMode = 'equals';
            } else if (filterType === 'boolean') {
                matchMode = 'equals';
            } else if (filterType === 'multiselect') {
                matchMode = 'in';
            } else {
                matchMode = 'contains';
            }

            // Dla filterDisplay="menu" PrimeVue oczekuje struktury z operator i constraints
            newFilters[col.field] = {
                operator: 'and',
                constraints: [
                    { value: null, matchMode }
                ]
            };
        }
    });

    filters.value = newFilters;
};

// Funkcje pomocnicze do pobierania wartości z zagnieżdżonych obiektów
const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, prop) => {
        return current?.[prop];
    }, obj);
};

// Funkcja do formatowania wartości komórki
const formatCellValue = (rowData: GasConnection, column: GasConnectionTableColumnConfig): string => {
    const field = column.field;

    // Specjalne przypadki dla złożonych danych
    if (field === 'designer') {
        return getPersonDisplayName(rowData.designer);
    }
    if (field === 'coordinator') {
        return getPersonDisplayName(rowData.coordinator);
    }
    if (field === 'customer') {
        return getPersonDisplayName(rowData.customer);
    }
    if (field === 'endCustomer') {
        return getPersonDisplayName(rowData.endCustomer);
    }
    if (field === 'workRangeGasConnections') {
        return formatWorkRangeGasConnections(rowData.workRangeGasConnections);
    }
    if (field === 'workRangeGasStations') {
        return formatWorkRangeGasStations(rowData.workRangeGasStations);
    }
    if (field === 'workRangeConnection') {
        return formatWorkRangeConnection(rowData.workRangeConnection);
    }
    if (field === 'gasDistribution') {
        return rowData.gasDistribution?.name || '';
    }
    if (field === 'gasConnectionDesign.utilityCompanyType') {
        return rowData.gasConnectionDesign?.utilityCompanyType?.name || '';
    }
    if (field === 'gasConnectionDesign.designerTraffic') {
        return getPersonDisplayName(rowData.gasConnectionDesign?.designerTraffic);
    }
    if (field === 'phase') {
        return formatPhase(rowData.phase);
    }

    // Pola dat
    const dateFields = [
        'contractDate',
        'conditionDate',
        'accelerationDate',
        'finishDeadline',
        'projectDeadline',
        'wsgFinalPickupDate',
        'gasConnectionDesign.projectOrderSubmissionDate',
        'gasConnectionDesign.projectOrderConfirmationDate',
        'gasConnectionDesign.proxySubmissionDate',
        'gasConnectionDesign.proxyReceiptDate',
        'gasConnectionDesign.mapSubmissionDate',
        'gasConnectionDesign.mapReceiptDate',
        'gasConnectionDesign.extractSubmissionDate',
        'gasConnectionDesign.extractReceiptDate',
        'gasConnectionDesign.zudpSubmissionDate',
        'gasConnectionDesign.zudpReceiptDate',
        'gasConnectionDesign.utilityCompanySubmissionDate',
        'gasConnectionDesign.utilityCompanyReceiptDate',
        'gasConnectionDesign.wsgAgreementSubmissionDate',
        'gasConnectionDesign.wsgAgreementReceiptDate',
        'gasConnectionDesign.wsgAgreementAgreementDate',
        'gasConnectionDesign.wsgAgreementPointSchemeSubmissionDate',
        'gasConnectionDesign.wsgAgreementPointSchemeReceiptDate',
        'gasConnectionDesign.trafficOrganizationProjectSubmissionDate',
        'gasConnectionDesign.trafficOrganizationProjectReceiptDate',
        'gasConnectionDesign.gasPointOrderDate',
        'gasConnectionDesign.gasPointPickupDate',
        'gasConnectionDesign.gasPointDocPickupDate',
        'gasConnectionDesign.zudpSentToSurveyorDate',
        'gasConnectionBuild.substationNotificationSubmissionDate',
        'gasConnectionBuild.surveyingSketchesDate',
        'gasConnectionBuild.surveyingInventoryDate',
        'gasConnectionBuild.realizationStartDate',
        'gasConnectionBuild.realizationEndDate',
        'gasConnectionBuild.wsgTechnicalAcceptanceDate',
        'gasConnectionBuild.wsgFinalAcceptanceSubmissionDate',
        'gasConnectionBuild.wsgFinalAcceptanceDate',
    ];

    if (dateFields.includes(field)) {
        const value = getNestedValue(rowData, field);
        return formatDate(value);
    }

    // Pola pieniężne
    const moneyFields = ['taskValue', 'projectValue', 'constructionValue'];
    if (moneyFields.includes(field)) {
        const value = getNestedValue(rowData, field);
        return formatMoney(value);
    }

    // Zwykłe pola
    const value = getNestedValue(rowData, field);
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'Tak' : 'Nie';
    return String(value);
};

// Menu dla SplitButton "Niezrealizowane"
const unfinishedMenuItems = [
    {
        label: 'Odbiór techniczny',
        command: () => {
            selectedFilter.value = 'unfinished-technical';
        }
    },
    {
        label: 'Odbiór końcowy',
        command: () => {
            selectedFilter.value = 'unfinished-final';
        }
    }
];

// Funkcja do obsługi kliknięcia przycisku filtru
const handleFilterClick = (filter: GasConnectionTableFilter) => {
    selectedFilter.value = filter;
};

// Funkcja pomocnicza do porównywania dat (tylko data, bez czasu)
const compareDatesOnly = (date1: Date | undefined, date2: Date): boolean => {
    if (!date1) return false;
    const d1 = new Date(date1);
    d1.setHours(0, 0, 0, 0);
    const d2 = new Date(date2);
    d2.setHours(0, 0, 0, 0);
    return d1 < d2;
};

// Filtrowane połączenia gazowe
const filteredGasConnections = computed(() => {
    let filtered = [...gasConnections.value];

    switch (selectedFilter.value) {
        case 'finished':
            filtered = filtered.filter(gc => gc.isFinished === true);
            break;
        case 'unfinished':
            filtered = filtered.filter(gc => gc.isFinished === false);
            break;
        case 'unfinished-technical':
            filtered = filtered.filter(gc =>
                gc.isFinished === false &&
                gc.gasConnectionBuild?.wsgTechnicalAcceptanceDate !== undefined &&
                gc.gasConnectionBuild?.wsgFinalAcceptanceDate === undefined
            );
            break;
        case 'unfinished-final':
            filtered = filtered.filter(gc =>
                gc.isFinished === false &&
                gc.gasConnectionBuild?.wsgFinalAcceptanceSubmissionDate !== undefined
            );
            break;
        case 'overdue':
            const today = new Date();
            filtered = filtered.filter(gc => {
                // Użycie bracket notation, ponieważ w typie jest błąd w nazwie pola
                const finishDeadline = (gc as any).finishDeadline as Date | undefined;
                return (
                    gc.isFinished === false &&
                    finishDeadline !== undefined &&
                    compareDatesOnly(finishDeadline, today)
                );
            });
            break;
        case 'all':
        default:
            // Wszystkie - bez filtrowania
            break;
    }

    return filtered;
});

// Sortowane kolumny (widoczne, posortowane po order)
const sortedColumns = computed(() => {
    return [...allColumns.value]
        .filter(col => col.visible)
        .sort((a, b) => a.order - b.order);
});

// Obsługa zmiany widoczności kolumn
const onColumnToggle = (columns: GasConnectionTableColumnConfig[]) => {
    // Usuwamy duplikaty na podstawie field
    const uniqueColumns = columns.filter((col, index, self) =>
        index === self.findIndex(c => c.field === col.field)
    );

    // Tworzymy zbiór fieldów zaznaczonych kolumn
    const selectedFields = new Set(uniqueColumns.map(col => col.field));

    // Aktualizujemy widoczność w allColumns
    allColumns.value.forEach(col => {
        col.visible = selectedFields.has(col.field);
    });

    // Aktualizujemy selectedColumns na podstawie widoczności
    selectedColumns.value = allColumns.value.filter(col => col.visible);

    saveColumnConfig();
};

// Obsługa zmiany kolejności kolumn
const onColumnReorder = (event: any) => {
    const { dragIndex, dropIndex } = event;
    const columns = [...selectedColumns.value];
    const draggedColumn = columns[dragIndex];

    columns.splice(dragIndex, 1);
    columns.splice(dropIndex, 0, draggedColumn);

    // Aktualizujemy order
    columns.forEach((col, index) => {
        col.order = index;
    });

    selectedColumns.value = columns;
    allColumns.value = [...allColumns.value];
    saveColumnConfig();
};

// Obsługa przypinania kolumny
const toggleFrozen = (column: GasConnectionTableColumnConfig) => {
    column.frozen = !column.frozen;
    saveColumnConfig();
};

// Obsługa przycisków akcji
const handleNew = () => {
    router.push('/tasks/gas-connections/new');
};

const handleEdit = () => {
    if (selectedRow.value) {
        router.push(`/tasks/gas-connections/new?id=${selectedRow.value.id}`);
    }
};

const handleDelete = (event: Event) => {
    if (!selectedRow.value) return;

    confirm.require({
        target: event.currentTarget as HTMLElement,
        message: `Czy na pewno chcesz usunąć połączenie gazowe "${selectedRow.value.taskNo}"?`,
        icon: 'pi pi-exclamation-triangle',
        rejectProps: {
            label: 'Anuluj',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: 'Usuń',
            severity: 'danger'
        },
        accept: () => {
            const success = gasConnectionsStore.deleteGasConnection(selectedRow.value!.id);
            if (success) {
                // Odświeżenie danych
                const rawData = gasConnectionsStore.getAllGasConnections();
                gasConnections.value = rawData.map(conn => ({
                    ...conn,
                    _designerId: conn.designer?.id ?? null,
                    _coordinatorId: conn.coordinator?.id ?? null,
                    _gasDistributionId: conn.gasDistribution?.id ?? null,
                    _customerText: getCustomerText(conn.customer) || '',
                    _endCustomerText: getCustomerText(conn.endCustomer) || '',
                    _designerTrafficText: (getPersonDisplayName(conn.gasConnectionDesign?.designerTraffic) || '').toLowerCase(),
                    _gasDistributionText: (conn.gasDistribution?.name || '').toLowerCase(),
                    _utilityCompanyTypeText: (conn.gasConnectionDesign?.utilityCompanyType?.name || '').toLowerCase(),
                    _workRangeGasConnectionsText: (formatWorkRangeGasConnections(conn.workRangeGasConnections) || '').toLowerCase(),
                    _workRangeGasStationsText: (formatWorkRangeGasStations(conn.workRangeGasStations) || '').toLowerCase(),
                    _workRangeConnectionText: (formatWorkRangeConnection(conn.workRangeConnection) || '').toLowerCase(),
                    _phaseText: (formatPhase(conn.phase) || '').toLowerCase(),
                }));
                // Wyczyszczenie zaznaczenia
                selectedRow.value = null;
            }
        }
    });
};

const handleViewDetails = () => {
    if (selectedRow.value) {
        router.push(`/tasks/gas-connections/details?id=${selectedRow.value.id}`);
    }
};

const handleViewDetailsReadonly = () => {
    if (selectedRow.value) {
        router.push(`/tasks/gas-connections/details?id=${selectedRow.value.id}&readonly=true`);
    }
};

// Reset konfiguracji do domyślnej
const resetColumnConfig = (event: Event) => {
    confirm.require({
        target: event.currentTarget as HTMLElement,
        message: 'Czy na pewno chcesz zresetować konfigurację tabeli do ustawień domyślnych?',
        icon: 'pi pi-exclamation-triangle',
        rejectProps: {
            label: 'Anuluj',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: 'Resetuj',
            severity: 'warning'
        },
        accept: () => {
            settingsStore.resetGasConnectionTableSettings();
            allColumns.value = getDefaultTableColumns();
            selectedColumns.value = allColumns.value.filter(col => col.visible);
            defaultSortField.value = undefined;
            defaultSortOrder.value = undefined;
            defaultFilter.value = undefined;
            selectedFilter.value = 'all';
            saveColumnConfig();
        }
    });
};

// Zapisywanie konfiguracji
const saveColumnConfig = () => {
    settingsStore.saveGasConnectionTableSettings(
        allColumns.value,
        defaultSortField.value,
        defaultSortOrder.value,
        selectedFilter.value
    );
};

// Otwarcie dialogu ustawień
const handleOpenColumnSettings = () => {
    showColumnSettingsDialog.value = true;
};

// Obsługa zapisu z dialogu
const handleColumnSettingsSaved = (
    updatedColumns: GasConnectionTableColumnConfig[],
    sortField?: string,
    sortOrder?: number,
    filter?: GasConnectionTableFilter
) => {
    // Aktualizujemy allColumns
    allColumns.value = updatedColumns;

    // Aktualizujemy selectedColumns
    selectedColumns.value = updatedColumns.filter(col => col.visible);

    // Aktualizujemy sortowanie
    defaultSortField.value = sortField;
    defaultSortOrder.value = sortOrder;

    // Aktualizujemy filtr jeśli został zmieniony
    if (filter !== undefined) {
        defaultFilter.value = filter;
        selectedFilter.value = filter;
    }

    // Zapisujemy konfigurację
    saveColumnConfig();
};

// Ładowanie konfiguracji
const loadColumnConfig = () => {
    try {
        const saved = settingsService.getTableSettings('gasConnectionTable');

        if (saved && saved.columns && saved.columns.length > 0) {
            allColumns.value = saved.columns;
            selectedColumns.value = saved.columns.filter(col => col.visible);
            // Ładujemy sortowanie
            defaultSortField.value = saved.defaultSortField;
            defaultSortOrder.value = saved.defaultSortOrder;
            // Ładujemy filtr
            defaultFilter.value = saved.defaultFilter;
            selectedFilter.value = saved.defaultFilter || 'all';
        } else {
            // Domyślna konfiguracja
            allColumns.value = getDefaultTableColumns();
            selectedColumns.value = allColumns.value.filter(col => col.visible);
            defaultSortField.value = undefined;
            defaultSortOrder.value = undefined;
            defaultFilter.value = undefined;
            selectedFilter.value = 'all';
            saveColumnConfig();
        }
    } catch (error) {
        console.error('Błąd podczas ładowania konfiguracji kolumn:', error);
        // Domyślna konfiguracja w przypadku błędu
        allColumns.value = getDefaultTableColumns();
        selectedColumns.value = allColumns.value.filter(col => col.visible);
        defaultSortField.value = undefined;
        defaultSortOrder.value = undefined;
        defaultFilter.value = undefined;
        selectedFilter.value = 'all';
        saveColumnConfig();
    }
};

// Inicjalizacja
onMounted(() => {
    loading.value = true;
    const rawData = gasConnectionsStore.getAllGasConnections();

    // Mapujemy dane, dodając płaskie pola dla filtrów
    gasConnections.value = rawData.map(conn => ({
        ...conn,
        // Pola dla multiselect (ID) - tylko designer, coordinator, gasDistribution
        _designerId: conn.designer?.id ?? null,
        _coordinatorId: conn.coordinator?.id ?? null,
        _gasDistributionId: conn.gasDistribution?.id ?? null,

        // Pola dla filtrowania tekstowego (sformatowane wartości)
        // Customer i endCustomer - uwzględniają firstName+lastName lub companyName
        _customerText: getCustomerText(conn.customer) || '',
        _endCustomerText: getCustomerText(conn.endCustomer) || '',
        _designerTrafficText: (getPersonDisplayName(conn.gasConnectionDesign?.designerTraffic) || '').toLowerCase(),
        _gasDistributionText: (conn.gasDistribution?.name || '').toLowerCase(),
        _utilityCompanyTypeText: (conn.gasConnectionDesign?.utilityCompanyType?.name || '').toLowerCase(),
        _workRangeGasConnectionsText: (formatWorkRangeGasConnections(conn.workRangeGasConnections) || '').toLowerCase(),
        _workRangeGasStationsText: (formatWorkRangeGasStations(conn.workRangeGasStations) || '').toLowerCase(),
        _workRangeConnectionText: (formatWorkRangeConnection(conn.workRangeConnection) || '').toLowerCase(),
        _phaseText: (formatPhase(conn.phase) || '').toLowerCase(),
    }));

    loadColumnConfig();
    // Inicjalizuj filtry po załadowaniu kolumn
    initializeFilters();
    loading.value = false;
});

// Watch na zmiany w allColumns
watch(
    () => allColumns.value,
    () => {
        selectedColumns.value = allColumns.value.filter(col => col.visible);
        // Aktualizuj filtry gdy kolumny się zmieniają
        initializeFilters();
    },
    { deep: true }
);

// Watch na zmiany filtru - zapisujemy do ustawień
watch(
    () => selectedFilter.value,
    () => {
        saveColumnConfig();
    }
);
</script>

<template>
    <div class="flex h-screen bg-surface-50 dark:bg-surface-900 overflow-hidden">
        <ConfirmPopup />
        <!-- Sidebar Menu -->
        <SidebarMenu />

        <!-- Main Content -->
        <div class="flex-1 overflow-y-auto p-6">
            <div class="max-w-full mx-auto">
                <div class="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <h1 class="text-3xl font-bold text-surface-700 dark:text-surface-300 mb-2">Lista Przyłączy Gazu
                        </h1>
                        <p class="text-sm text-surface-600 dark:text-surface-400">Zarządzanie instalacjami gazowymi</p>
                    </div>
                    <!-- Grupa przycisków akcji -->
                    <!-- <div
                        class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-4">
                        <div class="flex items-center gap-2">
                            <Button label="Nowy" icon="pi pi-plus" severity="success" @click="handleNew" />
                            <Button label="Edycja" icon="pi pi-pencil" :disabled="!selectedRow" @click="handleEdit" />
                            <Button label="Usuń" icon="pi pi-trash" severity="danger" :disabled="!selectedRow"
                                @click="handleDelete($event)" />
                        </div>
                    </div> -->
                </div>

                <div
                    class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
                    <!-- Header z MultiSelect do wyboru kolumn -->
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center gap-4">
                      
                            <!-- <div class="flex items-center gap-2 ml-8">
                                <Button label="Wszystkie" :outlined="selectedFilter !== 'all'"
                                    :severity="selectedFilter === 'all' ? undefined : 'secondary'"
                                    @click="handleFilterClick('all')" />
                                <Button label="Zrealizowane" :outlined="selectedFilter !== 'finished'"
                                    :severity="selectedFilter === 'finished' ? undefined : 'secondary'"
                                    @click="handleFilterClick('finished')" />
                                <SplitButton label="Niezrealizowane"
                                    :outlined="selectedFilter !== 'unfinished' && selectedFilter !== 'unfinished-technical' && selectedFilter !== 'unfinished-final'"
                                    :severity="(selectedFilter === 'unfinished' || selectedFilter === 'unfinished-technical' || selectedFilter === 'unfinished-final') ? undefined : 'secondary'"
                                    :model="unfinishedMenuItems" @click="handleFilterClick('unfinished')" />
                                <Button label="Przeterminowane" :outlined="selectedFilter !== 'overdue'"
                                    :severity="selectedFilter === 'overdue' ? undefined : 'secondary'"
                                    @click="handleFilterClick('overdue')" />
                            </div> -->
                        </div>
                        <!-- Toolbar z przyciskami -->
                        <Toolbar
                            class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg w-full">
                            <template #start>
                                <div class="flex items-center gap-2">
                                    <Button icon="pi pi-plus" severity="success" text rounded class="text-xs"
                                        @click="handleNew" title="Utwórz nowe przyłącze" />
                                    <Button icon="pi pi-pencil" :disabled="!selectedRow" text rounded class="text-xs!"
                                        @click="handleEdit" title="Edycja" />
                                    <Button icon="pi pi-trash" severity="danger" :disabled="!selectedRow" text rounded
                                        class="text-xs!" @click="handleDelete($event)" title="Usuń" />
                                                   <!-- Pionowa kreska separatora -->
                                    <div class="h-8 w-px bg-surface-300 dark:bg-surface-600 mx-1"></div>
                                    <Button icon="pi pi-eye" text severity="secondary" :disabled="!selectedRow"
                                        title="Szczegóły przyłącza" @click="handleViewDetails" />
                                    <Button icon="pi pi-eye-slash" text severity="secondary" :disabled="!selectedRow"
                                        title="Szczegóły przyłącza - tylko do odczytu"
                                        @click="handleViewDetailsReadonly" />
                                                   <!-- Pionowa kreska separatora -->
                                    <div class="h-8 w-px bg-surface-300 dark:bg-surface-600 mx-1"></div>
                                </div>
                            </template>

                            <template #center>
                                <div class="flex items-center gap-2">
                                    <!-- Pionowa kreska separatora -->
                                    <div class="h-8 w-px bg-surface-300 dark:bg-surface-600 mx-1"></div>
                                    <Button icon="pi pi-list" :outlined="selectedFilter !== 'all'"
                                        :severity="selectedFilter === 'all' ? undefined : 'secondary'"
                                        :pt="{ root: { class: selectedFilter === 'all' ? 'bg-primary text-primary-contrast text-xs!' : 'text-xs! border-2! border-primary-500! text-primary-500!' } }"
                                        @click="handleFilterClick('all')" title="Wszystkie" />
                                    <Button icon="pi pi-check-circle" :outlined="selectedFilter !== 'finished'"
                                        severity="success"
                                        :pt="{ root: { class: selectedFilter === 'finished' ? 'bg-green-600 text-white text-xs!' : 'text-xs! border-2! border-green-500! text-green-500!' } }"
                                        @click="handleFilterClick('finished')" title="Zrealizowane" />
                                    <SplitButton icon="pi pi-times-circle"
                                        :outlined="selectedFilter !== 'unfinished' && selectedFilter !== 'unfinished-technical' && selectedFilter !== 'unfinished-final'"
                                        :model="unfinishedMenuItems" class="text-xs! border-2! border-primary-500! h-9!"
                                        @click="handleFilterClick('unfinished')" title="Niezrealizowane" />
                                    <Button icon="pi pi-exclamation-triangle" :outlined="selectedFilter !== 'overdue'"
                                        severity="danger"
                                        :pt="{ root: { class: selectedFilter === 'overdue' ? 'bg-red-600 text-white text-xs!' : 'text-xs! border-2! border-red-500! text-red-500!' } }"
                                        @click="handleFilterClick('overdue')" title="Przeterminowane" />
                                         <!-- Pionowa kreska separatora -->
                                    <div class="h-8 w-px bg-surface-300 dark:bg-surface-600 mx-1"></div>
                                 
                                </div>
                            </template>

                            <template #end>
                                           <!-- Pionowa kreska separatora -->
                                           <div class="h-8 w-px bg-surface-300 dark:bg-surface-600 mx-1"></div>
                                <div class="flex items-center gap-2">
                                    <MultiSelect v-model="selectedColumns" :options="allColumns" optionLabel="header"
                                placeholder="Wybierz kolumny" display="chip" class="w-80" :filter="true"
                                filterPlaceholder="Szukaj kolumn..." @update:modelValue="onColumnToggle" />
                                   
                                    <Button icon="pi pi-cog" text severity="secondary" @click="handleOpenColumnSettings"
                                        title="Ustawienia" />
                                    <Button icon="pi pi-refresh" text severity="secondary"
                                        @click="resetColumnConfig($event)" title="Resetuj konfigurację" />
                                </div>
                            </template>
                        </Toolbar>
                        <!-- <div class="flex items-center gap-4">
                            <div class="flex items-center gap-2 flex-1 max-w-md">
                                <div class="flex items-center gap-1">
                                    <Button icon="pi pi-eye" text severity="secondary" :disabled="!selectedRow"
                                        title="Szczegóły przyłącza" @click="handleViewDetails" />
                                    <Button icon="pi pi-eye-slash" text severity="secondary" :disabled="!selectedRow"
                                        title="Szczegóły przyłącza - tylko do odczytu"
                                        @click="handleViewDetailsReadonly" />
                                </div>
                            </div>
                            <div class="flex items-center gap-2">
                                <SecondaryButton type="button" icon="pi pi-cog" @click="handleOpenColumnSettings"
                                    title="Ustawienia" />
                                <Button label="Resetuj konfigurację" icon="pi pi-refresh" severity="secondary" outlined
                                    @click="resetColumnConfig($event)" />
                            </div>
                        </div> -->
                    </div>

                    <!-- DataTable -->
                    <DataTable :value="filteredGasConnections" :loading="loading" :reorderableColumns="true"
                        @columnReorder="onColumnReorder" :scrollable="true" scrollHeight="calc(100vh - 300px)"
                        v-model:filters="filters" filterDisplay="menu" stripedRows showGridlines class="p-datatable-sm"
                        v-model:selection="selectedRow" selectionMode="single" rowHover :sortField="defaultSortField"
                        :sortOrder="defaultSortOrder" :pt="{
                            root: { class: 'bg-surface-0 dark:bg-surface-900' },
                            header: { class: 'bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700' },
                            thead: {
                                class: '[&>tr>th]:text-center [&>tr>th]:align-middle'
                            },
                            tbody: {
                                class: '[&>tr>td]:text-center [&>tr>td]:align-middle'
                            }
                        }">
                        <!-- Kolumny -->
                        <Column v-for="col in sortedColumns" :key="col.field" :field="col.field"
                            :filterMenuStyle="{ width: '18rem' }"
                            :showFilterMatchModes="getFilterType(col.field) === 'multiselect' ? false : true as boolean"
                            :sortable="col.sortable !== false" :frozen="col.frozen"
                            :style="{ width: col.width || 'auto', whiteSpace: 'nowrap' }"
                            :headerStyle="{ textAlign: 'center' }" :bodyStyle="{ textAlign: 'center' }"
                            :dataType="getFilterType(col.field) === 'date' ? 'date' : getFilterType(col.field) === 'numeric' ? 'numeric' : getFilterType(col.field) === 'boolean' ? 'boolean' : getFilterType(col.field) === 'multiselect' ? 'text' : 'text'"
                            :filterMatchMode="getFilterType(col.field) === 'date' ? 'dateIs' : getFilterType(col.field) === 'numeric' ? 'equals' : getFilterType(col.field) === 'boolean' ? 'equals' : getFilterType(col.field) === 'multiselect' ? 'in' : 'contains'"
                            :filterField="getFilterField(col.field)"
                            :sortFunction="requiresCustomSortFilter(col.field) ? customSortFunction(col.field) : undefined">
                            <template #body="{ data }">
                                <span v-if="col.field === 'isPGN'" class="whitespace-nowrap">
                                    <Checkbox :modelValue="data.isPGN" :binary="true" disabled />
                                </span>
                                <span v-else class="whitespace-nowrap">
                                    {{ formatCellValue(data, col) }}
                                </span>
                            </template>
                            <template #header>
                                <div class="flex items-center justify-center gap-2 w-full">
                                    <span>{{ col.header }}</span>
                                    <Button :icon="col.frozen ? 'pi pi-lock' : 'pi pi-lock-open'" text rounded
                                        size="small" @click.stop="toggleFrozen(col)"
                                        :title="col.frozen ? 'Odepnij kolumnę' : 'Przypnij kolumnę'" />
                                </div>
                            </template>
                            <template #filter="{ filterModel, filterCallback }" v-if="col.filterable !== false">
                                <InputText v-if="getFilterType(col.field) === 'text'" v-model="filterModel.value"
                                    type="text" @input="filterCallback()"
                                    :placeholder="`Filtruj ${col.header.toLowerCase()}...`" class="p-column-filter" />
                                <DatePicker v-else-if="getFilterType(col.field) === 'date'" v-model="filterModel.value"
                                    dateFormat="yyyy-mm-dd" @update:modelValue="filterCallback()"
                                    placeholder="Wybierz datę" showIcon />
                                <InputNumber v-else-if="getFilterType(col.field) === 'numeric'"
                                    v-model="filterModel.value" @update:modelValue="filterCallback()"
                                    :placeholder="`Filtruj ${col.header.toLowerCase()}...`" class="p-column-filter" />
                                <Select v-else-if="getFilterType(col.field) === 'boolean'" v-model="filterModel.value"
                                    :options="[
                                        { label: 'Wszystkie', value: null },
                                        { label: 'Tak', value: true },
                                        { label: 'Nie', value: false }
                                    ]" optionLabel="label" optionValue="value" @update:modelValue="filterCallback()"
                                    placeholder="Wybierz" class="p-column-filter" />
                                <MultiSelect v-else-if="getFilterType(col.field) === 'multiselect'"
                                    v-model="filterModel.value" :options="getMultiSelectOptions(col.field)"
                                    optionLabel="label" optionValue="value" @update:modelValue="filterCallback()"
                                    placeholder="Dowolne" filterPlaceholder="Szukaj..."
                                    class="p-column-filter w-full" />
                            </template>
                        </Column>

                        <template #empty>
                            <div class="text-center py-8 text-surface-600 dark:text-surface-400">
                                Brak danych do wyświetlenia
                            </div>
                        </template>
                    </DataTable>
                </div>
            </div>
        </div>

        <!-- Dialog ustawień kolumn -->
        <ColumnSettingsDialog :visible="showColumnSettingsDialog" :columns="allColumns"
            :defaultSortField="defaultSortField" :defaultSortOrder="defaultSortOrder" :defaultFilter="defaultFilter"
            @update:visible="showColumnSettingsDialog = $event" @saved="handleColumnSettingsSaved" />
    </div>
</template>
