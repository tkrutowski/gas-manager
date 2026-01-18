<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Select from 'primevue/select';
import InputNumber from 'primevue/inputnumber';
import Textarea from 'primevue/textarea';
import type { WorkRangeGasStation } from '@/types/WorkRange';
import type { GasStationType } from '@/types/GasStationType';

const props = defineProps<{
    visible: boolean;
    item: WorkRangeGasStation | null;
    isReadonly: boolean;
}>();

const emit = defineEmits<{
    'update:visible': [value: boolean];
    'save': [itemData: Partial<WorkRangeGasStation>];
}>();

// Opcje dla Selectów
const stationTypeOptions: GasStationType[] = [
    { name: 'REDUCTION', viewValue: 'redukcyjna' },
    { name: 'MEASUREMENT', viewValue: 'pomiarowa' },
    { name: 'REDUCTION_MEASUREMENT', viewValue: 'redukcyjno - pomiarowa' },
];

// Lokalne refs dla formularza
const capacity = ref<number | null>(10);
const amount = ref<number | null>(1);
const stationType = ref<GasStationType | null>(null);
const info = ref<string>('');

// Czy to tryb edycji
const isEditMode = computed(() => props.item !== null);

// Inicjalizacja formularza
const initializeForm = () => {
    if (props.item) {
        capacity.value = props.item.capacity || 10;
        amount.value = props.item.amount || 1;
        stationType.value = props.item.stationType || null;
        info.value = props.item.info || '';
    } else {
        capacity.value = 10;
        amount.value = 1;
        stationType.value = null;
        info.value = '';
    }
};

// Watch na visible - inicjalizuj formularz przy otwarciu
watch(() => props.visible, (newValue) => {
    if (newValue) {
        initializeForm();
    }
});

// Watch na item - aktualizuj formularz gdy item się zmieni
watch(() => props.item, () => {
    if (props.visible) {
        initializeForm();
    }
}, { deep: true });

// Zapis formularza
const handleSave = () => {
    const itemData: Partial<WorkRangeGasStation> = {
        capacity: capacity.value || 0,
        amount: amount.value || 0,
        stationType: stationType.value || { name: 'REDUCTION', viewValue: 'redukcyjna' },
        info: info.value,
    };

    emit('save', itemData);
    emit('update:visible', false);
};

// Anulowanie
const handleCancel = () => {
    emit('update:visible', false);
};
</script>

<template>
    <Dialog :visible="visible" @update:visible="(val) => emit('update:visible', val)" modal :closable="true"
        :draggable="false" :style="{ width: '40rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
        :header="isEditMode ? 'Edytuj punkt/stację' : 'Dodaj nowy punkt/stację'" class="p-fluid">
        <div class="space-y-4">
            <!-- PRZEPUSTOWOŚĆ -->
            <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Przepustowość:
                </label>
                <div class="flex items-center gap-2">
                    <InputNumber v-model="capacity" :disabled="isReadonly" :min="0" class="flex-1" />
                    <span class="text-sm text-surface-600 dark:text-surface-400">m3/h</span>
                </div>
            </div>

            <!-- ILOŚĆ -->
            <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Ilość:
                </label>
                <div class="flex items-center gap-2">
                    <InputNumber v-model="amount" :disabled="isReadonly" :min="0" class="flex-1" />
                    <span class="text-sm text-surface-600 dark:text-surface-400">szt.</span>
                </div>
            </div>

            <!-- RODZAJ STACJI -->
            <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Rodzaj stacji:
                </label>
                <Select v-model="stationType" :options="stationTypeOptions" optionLabel="viewValue"
                    placeholder="wybierz..." class="w-full" :disabled="isReadonly" :showClear="true" />
            </div>

            <!-- INNE INFO -->
            <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Inne info:
                </label>
                <Textarea v-model="info" placeholder="Dodatkowe informacje" rows="3" class="w-full"
                    :disabled="isReadonly" />
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end gap-2">
                <Button label="Anuluj" severity="secondary" outlined @click="handleCancel" :disabled="isReadonly" />
                <Button label="Zapisz" icon="pi pi-check" @click="handleSave" :disabled="isReadonly" />
            </div>
        </template>
    </Dialog>
</template>
