<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import DatePicker from 'primevue/datepicker';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Textarea from 'primevue/textarea';
import Fieldset from 'primevue/fieldset';
import type { Plot, PlotOwnerPrivate } from '@/types/Plot';

const props = defineProps<{
    visible: boolean;
    plot: Plot | null;
    editingPlotOwnerPrivate?: PlotOwnerPrivate | null;
    isReadonly: boolean;
}>();

const emit = defineEmits<{
    'update:visible': [value: boolean];
    'save': [plotOwnerPrivateData: Partial<PlotOwnerPrivate>];
}>();

// Lokalne refs dla formularza
const lastName = ref<string>('');
const name = ref<string>('');
const share = ref<number>(0);
const submissionDate = ref<Date | undefined>(undefined);
const receiptDate = ref<Date | undefined>(undefined);
const submissionDate1 = ref<Date | undefined>(undefined);
const receiptDate1 = ref<Date | undefined>(undefined);
const info1 = ref<string>('');
const submissionDate2 = ref<Date | undefined>(undefined);
const receiptDate2 = ref<Date | undefined>(undefined);
const info2 = ref<string>('');

// Czy data otrzymania jest disabled (dane podstawowe)
const isReceiptDateDisabled = computed(() => {
    return props.isReadonly || !submissionDate.value;
});

// Czy data otrzymania 1 jest disabled (termin dodatkowy I)
const isReceiptDate1Disabled = computed(() => {
    return props.isReadonly || !submissionDate1.value;
});

// Czy data otrzymania 2 jest disabled (termin dodatkowy II)
const isReceiptDate2Disabled = computed(() => {
    return props.isReadonly || !submissionDate2.value;
});

// Inicjalizacja formularza
const initializeForm = () => {
    if (props.editingPlotOwnerPrivate) {
        // Wypełnij formularz danymi z edytowanego obiektu
        name.value = props.editingPlotOwnerPrivate.name || '';
        lastName.value = props.editingPlotOwnerPrivate.lastName || '';
        share.value = props.editingPlotOwnerPrivate.share || 0;
        submissionDate.value = props.editingPlotOwnerPrivate.submissionDate;
        receiptDate.value = props.editingPlotOwnerPrivate.receiptDate;
        submissionDate1.value = props.editingPlotOwnerPrivate.submissionDate1;
        receiptDate1.value = props.editingPlotOwnerPrivate.receiptDate1;
        info1.value = props.editingPlotOwnerPrivate.info1 || '';
        submissionDate2.value = props.editingPlotOwnerPrivate.submissionDate2;
        receiptDate2.value = props.editingPlotOwnerPrivate.receiptDate2;
        info2.value = props.editingPlotOwnerPrivate.info2 || '';
    } else {
        // Wyczyść formularz
        lastName.value = '';
        name.value = '';
        share.value = 0;
        submissionDate.value = undefined;
        receiptDate.value = undefined;
        submissionDate1.value = undefined;
        receiptDate1.value = undefined;
        info1.value = '';
        submissionDate2.value = undefined;
        receiptDate2.value = undefined;
        info2.value = '';
    }
};

// Watch na visible - inicjalizuj formularz przy otwarciu
watch(() => props.visible, (newValue) => {
    if (newValue) {
        initializeForm();
    }
});

// Watch na editingPlotOwnerPrivate - aktualizuj formularz gdy zmienia się edytowany obiekt
watch(() => props.editingPlotOwnerPrivate, (newValue) => {
    if (props.visible && newValue) {
        initializeForm();
    }
}, { deep: true });

// Watch na submissionDate - wyczyść receiptDate jeśli submissionDate jest puste
watch(submissionDate, (newValue) => {
    if (!newValue && receiptDate.value) {
        receiptDate.value = undefined;
    }
});

// Watch na submissionDate1 - wyczyść receiptDate1 jeśli submissionDate1 jest puste
watch(submissionDate1, (newValue) => {
    if (!newValue && receiptDate1.value) {
        receiptDate1.value = undefined;
    }
});

// Watch na submissionDate2 - wyczyść receiptDate2 jeśli submissionDate2 jest puste
watch(submissionDate2, (newValue) => {
    if (!newValue && receiptDate2.value) {
        receiptDate2.value = undefined;
    }
});

// Zapis formularza
const handleSave = () => {
    const plotOwnerPrivateData: Partial<PlotOwnerPrivate> = {
        lastName: lastName.value,
        name: name.value,
        share: share.value,
        submissionDate: submissionDate.value,
        receiptDate: receiptDate.value,
        submissionDate1: submissionDate1.value,
        receiptDate1: receiptDate1.value,
        info1: info1.value,
        submissionDate2: submissionDate2.value,
        receiptDate2: receiptDate2.value,
        info2: info2.value,
    };

    emit('save', plotOwnerPrivateData);
    emit('update:visible', false);
};

// Anulowanie
const handleCancel = () => {
    emit('update:visible', false);
};

// Computed dla nagłówka dialogu
const dialogHeader = computed(() => {
    return props.editingPlotOwnerPrivate
        ? 'Właściciel działki - Szczegóły - Edycja'
        : 'Właściciel działki - Szczegóły - Nowy';
});
</script>

<template>
    <Dialog :visible="visible" @update:visible="(val) => emit('update:visible', val)" modal :closable="true"
        :draggable="false" :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
        :header="dialogHeader" class="p-fluid">
        <div class="space-y-6">
            <!-- Dane podstawowe -->
            <Fieldset legend="Dane podstawowe" class="mb-4">
                <div class="space-y-4">
                    <!-- Imię, Nazwisko, Udział [%] w jednej linii -->
                    <div class="grid grid-cols-3 gap-4">
                        <!-- Imię -->
                        <div>
                            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                Imię
                            </label>
                            <InputText v-model="name" placeholder="" class="w-full" :disabled="isReadonly" />
                        </div>

                        <!-- Nazwisko -->
                        <div>
                            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                Nazwisko
                            </label>
                            <InputText v-model="lastName" placeholder="" class="w-full" :disabled="isReadonly" />
                        </div>

                        <!-- Udział [%] -->
                        <div>
                            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                Udział [%]
                            </label>
                            <InputNumber v-model="share" :min="0" :max="100" :disabled="isReadonly" class="w-full" />
                        </div>
                    </div>

                    <!-- Data złożenia, Data otrzymania w jednej linii -->
                    <div class="grid grid-cols-2 gap-4">
                        <!-- Data złożenia -->
                        <div>
                            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                Data złożenia
                            </label>
                            <DatePicker v-model="submissionDate" :disabled="isReadonly" :manualInput="false"
                                showButtonBar showIcon dateFormat="dd.mm.yy" class="w-full" />
                        </div>

                        <!-- Data otrzymania -->
                        <div>
                            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                Data otrzymania
                            </label>
                            <DatePicker v-model="receiptDate" :disabled="isReceiptDateDisabled" :inputReadonly="true"
                                :manualInput="false" showButtonBar showIcon dateFormat="dd.mm.yy" class="w-full" />
                        </div>
                    </div>
                </div>
            </Fieldset>

            <!-- Termin dodatkowy I -->
            <Fieldset legend="Termin dodatkowy I" class="mb-4">
                <div class="grid grid-cols-2 gap-4">
                    <!-- Data złożenia -->
                    <div>
                        <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                            Data złożenia
                        </label>
                        <DatePicker v-model="submissionDate1" :disabled="isReadonly" :manualInput="false" showButtonBar
                            showIcon dateFormat="dd.mm.yy" class="w-full" />
                    </div>

                    <!-- Data otrzymania -->
                    <div>
                        <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                            Data otrzymania
                        </label>
                        <DatePicker v-model="receiptDate1" :disabled="isReceiptDate1Disabled" :inputReadonly="true"
                            :manualInput="false" showButtonBar showIcon dateFormat="dd.mm.yy" class="w-full" />
                    </div>

                    <!-- Inne info -->
                    <div class="col-span-2">
                        <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                            Inne info
                        </label>
                        <Textarea v-model="info1" placeholder="" rows="3" class="w-full" :disabled="isReadonly" />
                    </div>
                </div>
            </Fieldset>

            <!-- Termin dodatkowy II -->
            <Fieldset legend="Termin dodatkowy II" class="mb-4">
                <div class="grid grid-cols-2 gap-4">
                    <!-- Data złożenia -->
                    <div>
                        <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                            Data złożenia
                        </label>
                        <DatePicker v-model="submissionDate2" :disabled="isReadonly" :manualInput="false" showButtonBar
                            showIcon dateFormat="dd.mm.yy" class="w-full" />
                    </div>

                    <!-- Data otrzymania -->
                    <div>
                        <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                            Data otrzymania
                        </label>
                        <DatePicker v-model="receiptDate2" :disabled="isReceiptDate2Disabled" :inputReadonly="true"
                            :manualInput="false" showButtonBar showIcon dateFormat="dd.mm.yy" class="w-full" />
                    </div>

                    <!-- Inne info -->
                    <div class="col-span-2">
                        <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                            Inne info
                        </label>
                        <Textarea v-model="info2" placeholder="" rows="3" class="w-full" :disabled="isReadonly" />
                    </div>
                </div>
            </Fieldset>
        </div>

        <template #footer>
            <div class="flex justify-end gap-2">
                <Button label="Anuluj" severity="secondary" outlined @click="handleCancel" :disabled="isReadonly" />
                <Button label="Zapisz" icon="pi pi-check" @click="handleSave" :disabled="isReadonly" />
            </div>
        </template>
    </Dialog>
</template>
