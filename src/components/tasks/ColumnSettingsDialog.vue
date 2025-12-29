<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import Dialog from 'primevue/dialog';
import PickList from 'primevue/picklist';
import Button from 'primevue/button';
import Select from 'primevue/select';
import SecondaryButton from '@/components/SecondaryButton.vue';
import type { GasConnectionTableColumnConfig, GasConnectionTableFilter } from '@/types/Settings';

const props = defineProps<{
    visible: boolean;
    columns: GasConnectionTableColumnConfig[];
    defaultSortField?: string;
    defaultSortOrder?: number;
    defaultFilter?: GasConnectionTableFilter;
}>();

const emit = defineEmits<{
    'update:visible': [value: boolean];
    saved: [columns: GasConnectionTableColumnConfig[], defaultSortField?: string, defaultSortOrder?: number, defaultFilter?: GasConnectionTableFilter];
    close: [];
}>();

const pickListColumns = ref<[GasConnectionTableColumnConfig[], GasConnectionTableColumnConfig[]]>([[], []]);
const selectedSortField = ref<string | null>(null);
const selectedSortOrder = ref<number | null>(null);
const selectedFilter = ref<GasConnectionTableFilter>('all');

// Sortowalne kolumny (tylko te z sortable !== false)
const sortableColumns = computed(() => {
    return props.columns.filter(col => col.sortable !== false);
});

// Opcje kierunku sortowania
const sortOrderOptions = [
    { label: 'Brak', value: null },
    { label: 'Rosnąco', value: 1 },
    { label: 'Malejąco', value: -1 },
];

// Opcje filtru
const filterOptions = [
    { label: 'Wszystkie', value: 'all' as GasConnectionTableFilter },
    { label: 'Zrealizowane', value: 'finished' as GasConnectionTableFilter },
    { label: 'Niezrealizowane', value: 'unfinished' as GasConnectionTableFilter },
    { label: 'Niezrealizowane - odbiór techniczny', value: 'unfinished-technical' as GasConnectionTableFilter },
    { label: 'Niezrealizowane - odbiór końcowy', value: 'unfinished-final' as GasConnectionTableFilter },
    { label: 'Przeterminowane', value: 'overdue' as GasConnectionTableFilter },
];

// Inicjalizacja danych dla PickList
const initializePickListColumns = () => {
    // Sortujemy wszystkie kolumny według order
    const sorted = [...props.columns].sort((a, b) => a.order - b.order);

    // Dzielimy na widoczne i niewidoczne
    const visible: GasConnectionTableColumnConfig[] = [];
    const hidden: GasConnectionTableColumnConfig[] = [];

    sorted.forEach(col => {
        if (col.visible) {
            visible.push({ ...col });
        } else {
            hidden.push({ ...col });
        }
    });

    pickListColumns.value = [hidden, visible];
};

// Watch na visible, żeby inicjalizować przy otwarciu
watch(() => props.visible, (newValue) => {
    if (newValue) {
        initializePickListColumns();
        // Inicjalizuj sortowanie
        selectedSortField.value = props.defaultSortField || null;
        selectedSortOrder.value = props.defaultSortOrder ?? null;
        // Inicjalizuj filtr
        selectedFilter.value = props.defaultFilter || 'all';
    }
}, { immediate: true });

// Watch na props sortowania i filtru
watch([() => props.defaultSortField, () => props.defaultSortOrder, () => props.defaultFilter], ([field, order, filter]) => {
    if (props.visible) {
        selectedSortField.value = field || null;
        selectedSortOrder.value = order ?? null;
        selectedFilter.value = filter || 'all';
    }
});

// Watch na selectedSortField - resetuj kierunek gdy kolumna zostanie odznaczona
watch(selectedSortField, (newValue) => {
    if (!newValue) {
        selectedSortOrder.value = null;
    }
});

// Watch na columns, żeby zaktualizować gdy się zmienią (gdy dialog jest otwarty)
watch(() => props.columns, () => {
    if (props.visible) {
        initializePickListColumns();
    }
}, { deep: true });

// Zapis ustawień z PickList
const handleSave = () => {
    const [hidden, visible] = pickListColumns.value;

    // Tworzymy kopie wszystkich kolumn
    const updatedColumns = props.columns.map(col => ({ ...col }));

    // Tworzymy mapę dla szybkiego dostępu
    const columnMap = new Map<string, GasConnectionTableColumnConfig>();
    updatedColumns.forEach(col => {
        columnMap.set(col.field, col);
    });

    // Aktualizujemy widoczność i kolejność
    hidden.forEach(col => {
        const existing = columnMap.get(col.field);
        if (existing) {
            existing.visible = false;
        }
    });

    visible.forEach((col, index) => {
        const existing = columnMap.get(col.field);
        if (existing) {
            existing.visible = true;
            existing.order = index;
        }
    });

    // Emitujemy zaktualizowane kolumny, sortowanie i filtr
    const sortField = selectedSortField.value || undefined;
    const sortOrder = selectedSortOrder.value ?? undefined;
    const filter = selectedFilter.value;
    emit('saved', updatedColumns, sortField, sortOrder, filter);
    emit('update:visible', false);
};

// Anulowanie zmian w dialogu
const handleCancel = () => {
    emit('update:visible', false);
    emit('close');
};
</script>

<template>
    <Dialog :visible="visible" @update:visible="(val) => emit('update:visible', val)" modal :closable="true"
        :draggable="false" :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
        header="Ustawienia kolumn" class="p-fluid">
        <div class="mb-4">
            <div class="mb-2 flex gap-4">
                <div class="flex-1 text-center">
                    <span class="text-surface-700 dark:text-surface-300 font-semibold">Kolumny niewidoczne</span>
                </div>
                <div class="flex-1 text-center">
                    <span class="text-surface-700 dark:text-surface-300 font-semibold">Kolumny widoczne</span>
                </div>
            </div>
            <PickList v-model="pickListColumns" dataKey="field" listStyle="height: 20rem" :pt="{
                root: { class: 'bg-surface-0 dark:bg-surface-900' },
                sourceList: { class: 'bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700' },
                targetList: { class: 'bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700' }
            }">
                <template #option="{ option }">
                    <div class="text-surface-700 dark:text-surface-300">{{ option.header }}</div>
                </template>
            </PickList>
        </div>

        <!-- Domyślne sortowanie -->
        <div class="mb-4 pt-4 border-t border-surface-200 dark:border-surface-700">
            <h3 class="text-lg font-semibold text-surface-700 dark:text-surface-300 mb-4">Domyślne sortowanie</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                        Kolumna
                    </label>
                    <Select v-model="selectedSortField" :options="sortableColumns" optionLabel="header"
                        optionValue="field" placeholder="Wybierz kolumnę..." :showClear="true" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                        Kierunek
                    </label>
                    <Select v-model="selectedSortOrder" :options="sortOrderOptions" optionLabel="label"
                        optionValue="value" placeholder="Wybierz kierunek..." :showClear="false" class="w-full"
                        :disabled="!selectedSortField" />
                </div>
            </div>
        </div>

        <!-- Domyślny filtr -->
        <div class="mb-4 pt-4 border-t border-surface-200 dark:border-surface-700">
            <h3 class="text-lg font-semibold text-surface-700 dark:text-surface-300 mb-4">Domyślny filtr</h3>
            <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Filtr
                </label>
                <Select v-model="selectedFilter" :options="filterOptions" optionLabel="label" optionValue="value"
                    class="w-full" />
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end gap-2">
                <SecondaryButton type="button" text="Anuluj" @click="handleCancel" />
                <Button label="Zapisz" icon="pi pi-check" @click="handleSave" />
            </div>
        </template>
    </Dialog>
</template>
