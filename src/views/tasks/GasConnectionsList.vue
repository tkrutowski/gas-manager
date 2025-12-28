<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
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
import ConfirmPopup from 'primevue/confirmpopup';
import { useConfirm } from 'primevue/useconfirm';
import { useGasConnectionsStore } from '@/stores/gasConnections';
import { useSettingsStore } from '@/stores/settings';
import { settingsService } from '@/services/settingsService';
import type { GasConnection } from '@/types/GasConnection';
import type { GasConnectionTableColumnConfig } from '@/types/Settings';
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

const gasConnectionsStore = useGasConnectionsStore();
const settingsStore = useSettingsStore();
const confirm = useConfirm();

// Dane
const gasConnections = ref<GasConnection[]>([]);
const loading = ref(false);
const selectedRow = ref<GasConnection | null>(null);

// Konfiguracja kolumn
const allColumns = ref<GasConnectionTableColumnConfig[]>([]);
const selectedColumns = ref<GasConnectionTableColumnConfig[]>([]);

// Dialog ustawień kolumn
const showColumnSettingsDialog = ref(false);

// Filtry
const filters = ref<Record<string, any>>({});

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

// Custom filter function dla kolumn z "Imię Nazwisko"
const customFilterFunction = (field: string) => {
    return (_value: any, filter: any) => {
        if (!filter || !filter.value) return true;
        const filterValue = String(filter.value).toLowerCase();
        return (value: GasConnection) => {
            const cellValue = formatCellValue(value, { field } as GasConnectionTableColumnConfig).toLowerCase();
            if (filter.matchMode === 'contains') {
                return cellValue.includes(filterValue);
            } else if (filter.matchMode === 'startsWith') {
                return cellValue.startsWith(filterValue);
            } else if (filter.matchMode === 'endsWith') {
                return cellValue.endsWith(filterValue);
            } else if (filter.matchMode === 'equals') {
                return cellValue === filterValue;
            }
            return true;
        };
    };
};

// Custom filter function dla boolean
const booleanFilterFunction = (field: string) => {
    return (_value: any, filter: any) => {
        if (filter.value === null || filter.value === undefined) return true;
        return (value: GasConnection) => {
            const boolValue = getNestedValue(value, field);
            if (filter.matchMode === 'equals') {
                return boolValue === filter.value;
            }
            return true;
        };
    };
};

// Custom filter function dla dat
const dateFilterFunction = (field: string) => {
    return (_value: any, filter: any) => {
        if (!filter || !filter.value) return true;
        const filterDate = new Date(filter.value);
        if (isNaN(filterDate.getTime())) return true;

        return (value: GasConnection) => {
            const dateValue = getNestedValue(value, field);
            if (!dateValue) return false;

            const rowDate = new Date(dateValue);
            if (isNaN(rowDate.getTime())) return false;

            // Porównujemy tylko daty (bez czasu)
            const filterDateOnly = new Date(filterDate.getFullYear(), filterDate.getMonth(), filterDate.getDate());
            const rowDateOnly = new Date(rowDate.getFullYear(), rowDate.getMonth(), rowDate.getDate());

            if (filter.matchMode === 'dateIs') {
                return filterDateOnly.getTime() === rowDateOnly.getTime();
            } else if (filter.matchMode === 'dateIsNot') {
                return filterDateOnly.getTime() !== rowDateOnly.getTime();
            } else if (filter.matchMode === 'dateBefore') {
                return rowDateOnly < filterDateOnly;
            } else if (filter.matchMode === 'dateAfter') {
                return rowDateOnly > filterDateOnly;
            }
            return true;
        };
    };
};

// Funkcja do określenia typu filtru na podstawie pola
const getFilterType = (field: string): 'text' | 'date' | 'numeric' | 'boolean' => {
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

    return 'text';
};

// Inicjalizacja filtrów dla wszystkich kolumn
const initializeFilters = () => {
    const newFilters: Record<string, any> = {};

    allColumns.value.forEach(col => {
        if (col.filterable !== false) {
            const filterType = getFilterType(col.field);

            if (filterType === 'date') {
                newFilters[col.field] = { value: null, matchMode: 'dateIs' };
            } else if (filterType === 'numeric') {
                newFilters[col.field] = { value: null, matchMode: 'equals' };
            } else if (filterType === 'boolean') {
                newFilters[col.field] = { value: null, matchMode: 'equals' };
            } else {
                newFilters[col.field] = { value: null, matchMode: 'contains' };
            }
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

// Sortowane kolumny (widoczne, posortowane po order)
const sortedColumns = computed(() => {
    return [...allColumns.value]
        .filter(col => col.visible)
        .sort((a, b) => a.order - b.order);
});

// Kolumny przypięte
const frozenColumns = computed(() => {
    return sortedColumns.value.filter(col => col.frozen);
});

// Kolumny nieprzypięte
const unfrozenColumns = computed(() => {
    return sortedColumns.value.filter(col => !col.frozen);
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
            saveColumnConfig();
        }
    });
};

// Zapisywanie konfiguracji
const saveColumnConfig = () => {
    settingsStore.saveGasConnectionTableSettings(allColumns.value);
};

// Otwarcie dialogu ustawień
const handleOpenColumnSettings = () => {
    showColumnSettingsDialog.value = true;
};

// Obsługa zapisu z dialogu
const handleColumnSettingsSaved = (updatedColumns: GasConnectionTableColumnConfig[]) => {
    // Aktualizujemy allColumns
    allColumns.value = updatedColumns;

    // Aktualizujemy selectedColumns
    selectedColumns.value = updatedColumns.filter(col => col.visible);

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
        } else {
            // Domyślna konfiguracja
            allColumns.value = getDefaultTableColumns();
            selectedColumns.value = allColumns.value.filter(col => col.visible);
            saveColumnConfig();
        }
    } catch (error) {
        console.error('Błąd podczas ładowania konfiguracji kolumn:', error);
        // Domyślna konfiguracja w przypadku błędu
        allColumns.value = getDefaultTableColumns();
        selectedColumns.value = allColumns.value.filter(col => col.visible);
        saveColumnConfig();
    }
};

// Inicjalizacja
onMounted(() => {
    loading.value = true;
    gasConnections.value = gasConnectionsStore.getAllGasConnections();
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
</script>

<template>
    <div class="flex h-screen bg-surface-50 dark:bg-surface-900 overflow-hidden">
        <ConfirmPopup />
        <!-- Sidebar Menu -->
        <SidebarMenu />

        <!-- Main Content -->
        <div class="flex-1 overflow-y-auto p-6">
            <div class="max-w-full mx-auto">
                <div class="mb-6">
                    <h1 class="text-3xl font-bold text-surface-700 dark:text-surface-300 mb-2">Lista Przyłączy Gazu</h1>
                    <p class="text-sm text-surface-600 dark:text-surface-400">Zarządzanie instalacjami gazowymi</p>
                </div>

                <div
                    class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
                    <!-- Header z MultiSelect do wyboru kolumn -->
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center gap-4">
                            <MultiSelect v-model="selectedColumns" :options="allColumns" optionLabel="header"
                                placeholder="Wybierz kolumny" display="chip" class="w-80" :filter="true"
                                filterPlaceholder="Szukaj kolumn..." @update:modelValue="onColumnToggle" />
                        </div>
                        <div class="flex items-center gap-2">
                            <SecondaryButton type="button" icon="pi pi-cog" @click="handleOpenColumnSettings"
                                title="Ustawienia" />
                            <Button label="Resetuj konfigurację" icon="pi pi-refresh" severity="secondary" outlined
                                @click="resetColumnConfig($event)" />
                        </div>
                    </div>

                    <!-- DataTable -->
                    <DataTable :value="gasConnections" :loading="loading" :reorderableColumns="true"
                        @columnReorder="onColumnReorder" :scrollable="true" scrollHeight="calc(100vh - 300px)"
                        v-model:filters="filters" filterDisplay="row" stripedRows showGridlines class="p-datatable-sm"
                        v-model:selection="selectedRow" selectionMode="single" rowHover :pt="{
                            root: { class: 'bg-surface-0 dark:bg-surface-900' },
                            header: { class: 'bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700' },
                            thead: {
                                class: '[&>tr>th]:text-center [&>tr>th]:align-middle'
                            },
                            tbody: {
                                class: '[&>tr>td]:text-center [&>tr>td]:align-middle'
                            }
                        }">
                        <!-- Przypięte kolumny -->
                        <Column v-for="col in frozenColumns" :key="`frozen-${col.field}`" :field="col.field"
                            :sortable="col.sortable !== false" :frozen="true"
                            :style="{ width: col.width || 'auto', whiteSpace: 'nowrap' }"
                            :headerStyle="{ textAlign: 'center' }" :bodyStyle="{ textAlign: 'center' }"
                            :filter="col.filterable !== false"
                            :dataType="getFilterType(col.field) === 'date' ? 'date' : getFilterType(col.field) === 'numeric' ? 'numeric' : getFilterType(col.field) === 'boolean' ? 'boolean' : 'text'"
                            :filterMatchMode="getFilterType(col.field) === 'date' ? 'dateIs' : getFilterType(col.field) === 'numeric' ? 'equals' : getFilterType(col.field) === 'boolean' ? 'equals' : 'contains'"
                            :filterField="col.field"
                            :sortFunction="requiresCustomSortFilter(col.field) ? customSortFunction(col.field) : undefined"
                            :filterFunction="getFilterType(col.field) === 'date' ? dateFilterFunction(col.field) : getFilterType(col.field) === 'boolean' ? booleanFilterFunction(col.field) : requiresCustomSortFilter(col.field) ? customFilterFunction(col.field) : undefined">
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
                            </template>
                        </Column>

                        <!-- Nieprzypięte kolumny -->
                        <Column v-for="col in unfrozenColumns" :key="col.field" :field="col.field"
                            :sortable="col.sortable !== false"
                            :style="{ width: col.width || 'auto', whiteSpace: 'nowrap' }"
                            :headerStyle="{ textAlign: 'center' }" :bodyStyle="{ textAlign: 'center' }"
                            :filter="col.filterable !== false"
                            :dataType="getFilterType(col.field) === 'date' ? 'date' : getFilterType(col.field) === 'numeric' ? 'numeric' : getFilterType(col.field) === 'boolean' ? 'boolean' : 'text'"
                            :filterMatchMode="getFilterType(col.field) === 'date' ? 'dateIs' : getFilterType(col.field) === 'numeric' ? 'equals' : getFilterType(col.field) === 'boolean' ? 'equals' : 'contains'"
                            :filterField="col.field"
                            :sortFunction="requiresCustomSortFilter(col.field) ? customSortFunction(col.field) : undefined"
                            :filterFunction="getFilterType(col.field) === 'date' ? dateFilterFunction(col.field) : getFilterType(col.field) === 'boolean' ? booleanFilterFunction(col.field) : requiresCustomSortFilter(col.field) ? customFilterFunction(col.field) : undefined">
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
            @update:visible="showColumnSettingsDialog = $event" @saved="handleColumnSettingsSaved" />
    </div>
</template>
