<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import Dialog from 'primevue/dialog';
import DatePicker from 'primevue/datepicker';
import Select from 'primevue/select';
import InputNumber from 'primevue/inputnumber';
import Textarea from 'primevue/textarea';
import type { WorkRangeGasConnection } from '@/types/WorkRange';
import type { GasCabinetProviderType } from '@/types/GasCabinetProviderType';
import SecondaryButton from '@/components/SecondaryButton.vue';
import PrimaryButton from '@/components/PrimaryButton.vue';

const props = defineProps<{
    visible: boolean;
    item: WorkRangeGasConnection | null;
    isReadonly: boolean;
}>();

const emit = defineEmits<{
    'update:visible': [value: boolean];
    'save': [itemData: Partial<WorkRangeGasConnection>];
}>();

// Opcje dla Selectów
const diameterOptions = [25, 32, 40, 50, 63, 65, 75, 80, 90, 100, 110, 125, 140, 150, 160, 180, 200, 225, 250, 280, 315, 350, 400, 450, 500];

const materialOptions = ['PE100RC', 'PE', 'Stal'];

const sdrOptions = ['SDR 11', 'SDR 17.6'];

const gasCabinetProviderTypeOptions: GasCabinetProviderType[] = [
    { name: 'UNKNOWN', viewValue: 'Nieznane' },
    { name: 'CUSTOMER', viewValue: 'Klient' },
    { name: 'PSG', viewValue: 'PSG' },
    { name: 'COMPANY', viewValue: 'Progas' },
];

// Lokalne refs dla formularza
const diameter = ref<number | null>(null);
const lengthWar = ref<number | null>(null);
const material = ref<string | null>(null);
const sdr = ref<string | null>(null);
const lengthProj = ref<number | null>(null);
const gasCabinetProviderType = ref<GasCabinetProviderType | null>(null);
const gasCabinetPickupDate = ref<Date | undefined>(undefined);
const info = ref<string>('');

// Czy to tryb edycji
const isEditMode = computed(() => props.item !== null);

// Inicjalizacja formularza
const initializeForm = () => {
    if (props.item) {
        diameter.value = props.item.diameter || null;
        lengthWar.value = props.item.lengthWar || null;
        material.value = props.item.material || null;
        sdr.value = props.item.sdr || null;
        lengthProj.value = props.item.lengthProj || null;
        gasCabinetProviderType.value = props.item.gasCabinetProviderType || null;
        gasCabinetPickupDate.value = props.item.gasCabinetPickupDate;
        info.value = props.item.info || '';
    } else {
        diameter.value = null;
        lengthWar.value = null;
        material.value = null;
        sdr.value = null;
        lengthProj.value = null;
        gasCabinetProviderType.value = null;
        gasCabinetPickupDate.value = undefined;
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
    const itemData: Partial<WorkRangeGasConnection> = {
        diameter: diameter.value || 0,
        lengthWar: lengthWar.value || 0,
        material: material.value || '',
        sdr: sdr.value || '',
        lengthProj: lengthProj.value || 0,
        gasCabinetProviderType: gasCabinetProviderType.value || { name: 'UNKNOWN', viewValue: 'Nieznane' },
        gasCabinetPickupDate: gasCabinetPickupDate.value,
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
        :header="isEditMode ? 'Edytuj przyłącze' : 'Dodaj nowe przyłącze'" class="p-fluid">
        <div class="space-y-4">
            <!-- ŚREDNICA -->
            <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Średnica
                </label>
                <Select v-model="diameter" :options="diameterOptions" placeholder="wybierz..." class="w-full"
                    :disabled="isReadonly" :showClear="true" />
            </div>

            <!-- DŁUGOŚĆ Z WAR. (M) -->
            <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Długość z war. (m)
                </label>
                <InputNumber v-model="lengthWar" :disabled="isReadonly" :min="0" class="w-full" />
            </div>

            <!-- MATERIAŁ -->
            <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Materiał
                </label>
                <Select v-model="material" :options="materialOptions" placeholder="wybierz..." class="w-full"
                    :disabled="isReadonly" :showClear="true" />
            </div>

            <!-- SDR -->
            <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    SDR
                </label>
                <Select v-model="sdr" :options="sdrOptions" placeholder="wybierz..." class="w-full"
                    :disabled="isReadonly" :showClear="true" />
            </div>

            <!-- DŁUGOŚĆ Z PROJ. (M) -->
            <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Długość z proj. (m)
                </label>
                <InputNumber v-model="lengthProj" :disabled="isReadonly" :min="0" class="w-full" />
            </div>

            <!-- SZAFKĘ DOSTARCZA -->
            <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Szafkę dostarcza
                </label>
                <Select v-model="gasCabinetProviderType" :options="gasCabinetProviderTypeOptions"
                    optionLabel="viewValue" placeholder="wybierz..." class="w-full" :disabled="isReadonly"
                    :showClear="true" />
            </div>

            <!-- DATA POBRANIA SZAFKI -->
            <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Data pobrania szafki
                </label>
                <DatePicker v-model="gasCabinetPickupDate" :disabled="isReadonly" :manualInput="false" showButtonBar
                    showIcon dateFormat="dd.mm.yy" class="w-full" />
            </div>

            <!-- INNE INFO -->
            <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Inne info
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
