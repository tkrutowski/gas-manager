<script setup lang="ts">
import { ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import PickList from 'primevue/picklist';
import Button from 'primevue/button';
import SecondaryButton from '@/components/SecondaryButton.vue';
import type { GasConnectionTableColumnConfig } from '@/types/Settings';

const props = defineProps<{
    visible: boolean;
    columns: GasConnectionTableColumnConfig[];
}>();

const emit = defineEmits<{
    'update:visible': [value: boolean];
    saved: [columns: GasConnectionTableColumnConfig[]];
    close: [];
}>();

const pickListColumns = ref<[GasConnectionTableColumnConfig[], GasConnectionTableColumnConfig[]]>([[], []]);

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
    }
}, { immediate: true });

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

    // Emitujemy zaktualizowane kolumny
    emit('saved', updatedColumns);
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
        <template #footer>
            <div class="flex justify-end gap-2">
                <SecondaryButton type="button" text="Anuluj" @click="handleCancel" />
                <Button label="Zapisz" icon="pi pi-check" @click="handleSave" />
            </div>
        </template>
    </Dialog>
</template>
