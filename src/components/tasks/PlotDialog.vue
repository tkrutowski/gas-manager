<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import Dialog from 'primevue/dialog';
import DatePicker from 'primevue/datepicker';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import type { Plot, PlotOwner } from '@/types/Plot';
import SecondaryButton from '@/components/SecondaryButton.vue';
import PrimaryButton from '@/components/PrimaryButton.vue';

const props = defineProps<{
    visible: boolean;
    plot: Plot | null;
    isReadonly: boolean;
}>();

const emit = defineEmits<{
    'update:visible': [value: boolean];
    'save': [plotData: Partial<Plot>];
}>();

// Opcje PlotOwner
const plotOwnerOptions: PlotOwner[] = [
    { id: 1, name: 'Urząd Gminy' },
    { id: 2, name: 'ZDP' },
    { id: 3, name: 'ZDW' },
    { id: 4, name: 'GDDKiA' },
    { id: 5, name: 'ZDM' },
    { id: 6, name: 'Wł. prywatny' },
];

// Lokalne refs dla formularza
const plotNumber = ref<string>('');
const submissionDate = ref<Date | undefined>(undefined);
const receiptDate = ref<Date | undefined>(undefined);
const plotOwner = ref<PlotOwner | null>(null);
const info = ref<string>('');

// Czy to tryb edycji
const isEditMode = computed(() => props.plot !== null);

// Czy data otrzymania jest disabled
const isReceiptDateDisabled = computed(() => {
    return props.isReadonly || !submissionDate.value;
});

// Inicjalizacja formularza
const initializeForm = () => {
    if (props.plot) {
        plotNumber.value = props.plot.plotNumber || '';
        submissionDate.value = props.plot.submissionDate;
        receiptDate.value = props.plot.receiptDate;
        plotOwner.value = props.plot.plotOwner || null;
        info.value = props.plot.info || '';
    } else {
        plotNumber.value = '';
        submissionDate.value = undefined;
        receiptDate.value = undefined;
        plotOwner.value = null;
        info.value = '';
    }
};

// Watch na visible - inicjalizuj formularz przy otwarciu
watch(() => props.visible, (newValue) => {
    if (newValue) {
        initializeForm();
    }
});

// Watch na plot - aktualizuj formularz gdy plot się zmieni
watch(() => props.plot, () => {
    if (props.visible) {
        initializeForm();
    }
}, { deep: true });

// Watch na submissionDate - wyczyść receiptDate jeśli submissionDate jest puste
watch(submissionDate, (newValue) => {
    if (!newValue && receiptDate.value) {
        receiptDate.value = undefined;
    }
});

// Zapis formularza
const handleSave = () => {
    const plotData: Partial<Plot> = {
        plotNumber: plotNumber.value,
        submissionDate: submissionDate.value,
        receiptDate: receiptDate.value,
        plotOwner: plotOwner.value || undefined,
        info: info.value,
    };

    emit('save', plotData);
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
        :header="isEditMode ? 'Edytuj działkę' : 'Dodaj nową działkę'" class="p-fluid">
        <div class="space-y-4">
            <!-- NR DZIAŁKI -->
            <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    NR DZIAŁKI
                </label>
                <InputText v-model="plotNumber" placeholder="np. 197/1" class="w-full"
                    :disabled="isReadonly || isEditMode" />
            </div>

            <!-- DATA ZŁOŻENIA -->
            <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    DATA ZŁOŻENIA
                </label>
                <DatePicker v-model="submissionDate" :disabled="isReadonly" :manualInput="false" showButtonBar showIcon
                    dateFormat="dd.mm.yy" class="w-full" />
            </div>

            <!-- DATA OTRZYMANIA -->
            <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    DATA OTRZYMANIA
                </label>
                <DatePicker v-model="receiptDate" :disabled="isReceiptDateDisabled" :inputReadonly="true"
                    :manualInput="false" showButtonBar showIcon dateFormat="dd.mm.yy" class="w-full" />
            </div>

            <!-- WŁAŚCICIEL -->
            <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    WŁAŚCICIEL
                </label>
                <Select v-model="plotOwner" :options="plotOwnerOptions" optionLabel="name" placeholder="wybierz"
                    class="w-full" :disabled="isReadonly" :showClear="true" />
            </div>

            <!-- DODATKOWE INFO -->
            <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    DODATKOWE INFO
                </label>
                <Textarea v-model="info" placeholder="Dodatkowe informacje" rows="3" class="w-full"
                    :disabled="isReadonly" />
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end gap-2">
                <SecondaryButton type="button" @click="handleCancel" text="Anuluj" size="lg" :disabled="isReadonly" />
                <PrimaryButton type="button" @click="handleSave" text="Zapisz" size="lg" :disabled="isReadonly"
                    icon="pi pi-check" iconPos="left" />
            </div>
        </template>
    </Dialog>
</template>
