<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useSettingsStore } from '@/stores/settings';
import { useSurveyorsStore } from '@/stores/surveyors';
import { useDesignersStore } from '@/stores/designers';
import { useStageCards } from '@/composables/useStageCards';
import LocationMap from '@/components/maps/LocationMap.vue';
import StageSettingsDialog from '@/components/tasks/StageSettingsDialog.vue';
import type { GasConnection } from '@/types/GasConnection';
import { MapDeliveredBy } from '@/types/Commons';
import type { UtilityCompanyType } from '@/types/Commons';
import {
    DocumentIcon,
    MapPinIcon,
    ClipboardDocumentIcon,
    MapIcon,
} from '@heroicons/vue/24/outline';
import { CheckIcon } from '@heroicons/vue/24/solid';
import Panel from 'primevue/panel';
import Card from 'primevue/card';
import DatePicker from 'primevue/datepicker';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';

interface Props {
    gasConnection: GasConnection | undefined;
    isReadonly: boolean;
}

const props = defineProps<Props>();

// Stores
const settingsStore = useSettingsStore();
const surveyorsStore = useSurveyorsStore();
const designersStore = useDesignersStore();

// Composable dla logiki etapów
const gasConnectionRef = computed(() => props.gasConnection);
const isReadonlyRef = computed(() => props.isReadonly);
const {
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
    getCardBorderClasses,
    getCardHeaderClasses,
    getCardHeaderTextClasses,
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
    // Functions for buttons
    getPlotOwnersClasses,
    getLaneOccupationClasses,
} = useStageCards(gasConnectionRef, isReadonlyRef);

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

// Lista projektantów ruchu dla Select "Projektant" (ETAP 4)
const designerTrafficOptions = computed(() => {
    return designersStore.getAllDesigners({ status: true }).map(designer => ({
        label: `${designer.name} ${designer.lastName}`,
        value: designer as any, // Tymczasowo używamy Designer jako DesignerTraffic
    }));
});

// Lokalne refs dla współrzędnych, aby umożliwić edycję
const latitude = ref<string>('');
const longitude = ref<string>('');

// Synchronizuj lokalne refs z gasConnection
watch(
    () => props.gasConnection?.address?.coordinates,
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
</script>

<template>
    <div>
        <!-- ETAP 1 -->
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
                                            :modelValue="gasConnection?.gasConnectionDesign?.projectOrderSubmissionDate"
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
                                            :modelValue="gasConnection?.gasConnectionDesign?.projectOrderConfirmationDate"
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
                                            :modelValue="gasConnection?.gasConnectionDesign?.proxySubmissionDate"
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
                                            :modelValue="gasConnection?.gasConnectionDesign?.proxyReceiptDate"
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
                                            :modelValue="gasConnection?.gasConnectionDesign?.extractSubmissionDate"
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
                                            :modelValue="gasConnection?.gasConnectionDesign?.extractReceiptDate"
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
                                                :modelValue="gasConnection?.gasConnectionDesign?.mapSubmissionDate"
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
                                                :modelValue="gasConnection?.gasConnectionDesign?.mapReceiptDate"
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
                                                :modelValue="gasConnection?.gasConnectionDesign?.mapDeliveredBy"
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
                                                :modelValue="gasConnection?.gasConnectionDesign?.mapSurveyor"
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
                                        }" :disabled="isReadonly"
                                        :manualInput="false" showButtonBar showIcon
                                        dateFormat="dd.mm.yy" class="w-full" />
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
                                        }"
                                        placeholder=""
                                        class="w-full"
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
                            <div :class="getCardHeaderClasses('wsgAgreementPointScheme', 'stage3')">
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

        <!-- ETAP 4 -->
        <Panel :key="stage4SettingsKey" toggleable class="mt-6">
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
                                ETAP 4
                            </div>
                            <div :class="stage4StatusClasses">
                                {{ stage4Status.text }}
                            </div>
                        </div>
                    </div>
                    <!-- Ikony po prawej stronie -->
                    <div class="flex items-center gap-2">
                        <!-- Ikona checkmark -->
                        <div :class="checkmark4Classes">
                            <CheckIcon :class="checkmark4IconClasses" />
                        </div>
                        <!-- Ikona ustawień -->
                        <Button icon="pi pi-cog" text severity="secondary" rounded
                            @click="stage4SettingsDialogVisible = true" />
                    </div>
                </div>
            </template>

            <!-- Karty w układzie: lewa kolumna (PROJEKT ORGANIZACJI RUCHU), prawa kolumna (PUNKT GAZOWY i GEODEZJA) -->
            <div class="p-6">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Lewa kolumna - PROJEKT ORGANIZACJI RUCHU -->
                    <Card :key="`trafficOrganizationProject-${stage4SettingsKey}`"
                        data-card-id="trafficOrganizationProject"
                        :class="`border ${getCardBorderClasses('trafficOrganizationProject', 'stage4')} overflow-hidden`">
                        <template #header>
                            <div
                                :class="getCardHeaderClasses('trafficOrganizationProject', 'stage4')">
                                <DocumentIcon class="w-5 h-5 text-primary-400" />
                                <h4
                                    :class="getCardHeaderTextClasses('trafficOrganizationProject', 'stage4')">
                                    PROJEKT ORGANIZACJI RUCHU
                                </h4>
                            </div>
                        </template>
                        <template #content>
                            <div class="space-y-4">
                                <!-- Checkbox "bez POR" -->
                                <div class="flex items-center gap-2">
                                    <Checkbox
                                        :modelValue="gasConnection?.gasConnectionDesign?.withoutTrafficOrganizationProject"
                                        @update:modelValue="(val) => {
                                            if (gasConnection?.gasConnectionDesign) {
                                                gasConnection.gasConnectionDesign.withoutTrafficOrganizationProject = val as boolean;
                                                // Jeśli checkbox jest zaznaczony, wyczyść daty i projektanta
                                                if (val) {
                                                    gasConnection.gasConnectionDesign.trafficOrganizationProjectSubmissionDate = undefined;
                                                    gasConnection.gasConnectionDesign.trafficOrganizationProjectReceiptDate = undefined;
                                                    gasConnection.gasConnectionDesign.designerTraffic = null;
                                                }
                                            }
                                        }" :binary="true"
                                        inputId="withoutTrafficOrganizationProject"
                                        :disabled="isReadonly" />
                                    <label for="withoutTrafficOrganizationProject"
                                        class="text-sm font-medium text-surface-700 dark:text-surface-300 cursor-pointer">
                                        bez POR
                                    </label>
                                </div>

                                <!-- Data złożenia -->
                                <div>
                                    <label
                                        class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                        Data złożenia
                                    </label>
                                    <DatePicker
                                        :modelValue="gasConnection?.gasConnectionDesign?.trafficOrganizationProjectSubmissionDate"
                                        @update:modelValue="(val) => {
                                            if (gasConnection?.gasConnectionDesign) {
                                                gasConnection.gasConnectionDesign.trafficOrganizationProjectSubmissionDate = val as Date | undefined;
                                                // Jeśli wyczyszczono datę złożenia, wyczyść datę otrzymania
                                                if (!val) {
                                                    gasConnection.gasConnectionDesign.trafficOrganizationProjectReceiptDate = undefined;
                                                }
                                            }
                                        }"
                                        :disabled="isTrafficOrganizationProjectDateFieldsDisabled"
                                        :manualInput="false" showButtonBar showIcon
                                        dateFormat="dd.mm.yy" class="w-full" />
                                </div>

                                <!-- Data otrzymania -->
                                <div>
                                    <label
                                        class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                        Data otrzymania
                                    </label>
                                    <DatePicker
                                        :modelValue="gasConnection?.gasConnectionDesign?.trafficOrganizationProjectReceiptDate"
                                        @update:modelValue="(val) => {
                                            if (gasConnection?.gasConnectionDesign) {
                                                gasConnection.gasConnectionDesign.trafficOrganizationProjectReceiptDate = val as Date | undefined;
                                            }
                                        }"
                                        :disabled="isTrafficOrganizationProjectDateFieldsDisabled || !gasConnection?.gasConnectionDesign?.trafficOrganizationProjectSubmissionDate"
                                        :inputReadonly="true" showIcon :manualInput="false"
                                        showButtonBar dateFormat="dd.mm.yy"
                                        class="w-full" />
                                </div>

                                <!-- Projektant -->
                                <div>
                                    <label
                                        class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                        Projektant
                                    </label>
                                    <Select
                                        :modelValue="gasConnection?.gasConnectionDesign?.designerTraffic"
                                        :showClear="true" @update:modelValue="(val) => {
                                            if (gasConnection?.gasConnectionDesign) {
                                                gasConnection.gasConnectionDesign.designerTraffic = val as any;
                                            }
                                        }" :options="designerTrafficOptions"
                                        optionLabel="label" optionValue="value"
                                        placeholder="wybierz" class="w-full"
                                        :disabled="isDesignerTrafficSelectDisabled" />
                                </div>
                            </div>
                        </template>
                    </Card>

                    <!-- Prawa kolumna - PUNKT GAZOWY i GEODEZJA -->
                    <div class="space-y-6">
                        <!-- Card PUNKT GAZOWY -->
                        <Card :key="`gasPoint-${stage4SettingsKey}`" data-card-id="gasPoint"
                            :class="`border ${getCardBorderClasses('gasPoint', 'stage4')} overflow-hidden`">
                            <template #header>
                                <div :class="getCardHeaderClasses('gasPoint', 'stage4')">
                                    <DocumentIcon class="w-5 h-5 text-primary-400" />
                                    <h4
                                        :class="getCardHeaderTextClasses('gasPoint', 'stage4')">
                                        PUNKT GAZOWY
                                    </h4>
                                </div>
                            </template>
                            <template #content>
                                <div class="space-y-4">
                                    <!-- Data zamówienia -->
                                    <div>
                                        <label
                                            class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                            Data zamówienia
                                        </label>
                                        <DatePicker
                                            :modelValue="gasConnection?.gasConnectionDesign?.gasPointOrderDate"
                                            @update:modelValue="(val) => {
                                                if (gasConnection?.gasConnectionDesign) {
                                                    gasConnection.gasConnectionDesign.gasPointOrderDate = val as Date | undefined;
                                                }
                                            }" :disabled="isReadonly" :manualInput="false"
                                            showButtonBar showIcon dateFormat="dd.mm.yy"
                                            class="w-full" />
                                    </div>

                                    <!-- Data odbioru punktu -->
                                    <div>
                                        <label
                                            class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                            Data odbioru punktu
                                        </label>
                                        <DatePicker
                                            :modelValue="gasConnection?.gasConnectionDesign?.gasPointPickupDate"
                                            @update:modelValue="(val) => {
                                                if (gasConnection?.gasConnectionDesign) {
                                                    gasConnection.gasConnectionDesign.gasPointPickupDate = val as Date | undefined;
                                                }
                                            }" :disabled="isReadonly" :manualInput="false"
                                            showButtonBar showIcon dateFormat="dd.mm.yy"
                                            class="w-full" />
                                    </div>

                                    <!-- Data odbioru dok. -->
                                    <div>
                                        <label
                                            class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                            Data odbioru dok.
                                        </label>
                                        <DatePicker
                                            :modelValue="gasConnection?.gasConnectionDesign?.gasPointDocPickupDate"
                                            @update:modelValue="(val) => {
                                                if (gasConnection?.gasConnectionDesign) {
                                                    gasConnection.gasConnectionDesign.gasPointDocPickupDate = val as Date | undefined;
                                                }
                                            }" :disabled="isReadonly" :manualInput="false"
                                            showButtonBar showIcon dateFormat="dd.mm.yy"
                                            class="w-full" />
                                    </div>

                                    <!-- Nr zamówienia -->
                                    <div>
                                        <label
                                            class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                            Nr zamówienia
                                        </label>
                                        <InputText
                                            :modelValue="gasConnection?.gasConnectionDesign?.gasPointOrderNo"
                                            @update:modelValue="(val) => {
                                                if (gasConnection?.gasConnectionDesign) {
                                                    gasConnection.gasConnectionDesign.gasPointOrderNo = val as string;
                                                }
                                            }"
                                            placeholder=""
                                            class="w-full"
                                            :disabled="isReadonly" />
                                    </div>
                                </div>
                            </template>
                        </Card>

                        <!-- Card GEODEZJA -->
                        <Card :key="`geodesy-${stage4SettingsKey}`" data-card-id="geodesy"
                            :class="`border ${getCardBorderClasses('geodesy', 'stage4')} overflow-hidden`">
                            <template #header>
                                <div :class="getCardHeaderClasses('geodesy', 'stage4')">
                                    <DocumentIcon class="w-5 h-5 text-primary-400" />
                                    <h4
                                        :class="getCardHeaderTextClasses('geodesy', 'stage4')">
                                        GEODEZJA
                                    </h4>
                                </div>
                            </template>
                            <template #content>
                                <div class="space-y-4">
                                    <!-- Data wysłania -->
                                    <div>
                                        <label
                                            class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                            Data wysłania
                                        </label>
                                        <DatePicker
                                            :modelValue="gasConnection?.gasConnectionDesign?.zudpSentToSurveyorDate"
                                            @update:modelValue="(val) => {
                                                if (gasConnection?.gasConnectionDesign) {
                                                    gasConnection.gasConnectionDesign.zudpSentToSurveyorDate = val as Date | undefined;
                                                }
                                            }" :disabled="isReadonly" :manualInput="false"
                                            showButtonBar showIcon dateFormat="dd.mm.yy"
                                            class="w-full" />
                                    </div>

                                    <!-- Geodeta -->
                                    <div>
                                        <label
                                            class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                            Geodeta
                                        </label>
                                        <Select
                                            :modelValue="gasConnection?.gasConnectionDesign?.surveyorTrafficProject"
                                            :showClear="true" @update:modelValue="(val) => {
                                                if (gasConnection?.gasConnectionDesign) {
                                                    gasConnection.gasConnectionDesign.surveyorTrafficProject = val as any;
                                                }
                                            }" :options="surveyorsOptions"
                                            optionLabel="label" optionValue="value"
                                            placeholder="wybierz" class="w-full"
                                            :disabled="isReadonly" />
                                    </div>
                                </div>
                            </template>
                        </Card>
                    </div>
                </div>

                <!-- Element "+ zajęcie pasa" -->
                <div class="mt-6">
                    <button :class="getLaneOccupationClasses()" :disabled="isReadonly"
                        @click="() => { }">
                        <span class="text-lg font-bold">+</span>
                        <span>zajęcie pasa</span>
                    </button>
                </div>
            </div>
        </Panel>

        <!-- Dialogi ustawień etapów -->
        <StageSettingsDialog v-model:visible="stageSettingsDialogVisible" stage-id="stage1" :cards="stage1Cards"
            @saved="() => { stage1SettingsKey++; }" />

        <StageSettingsDialog v-model:visible="stage2SettingsDialogVisible" stage-id="stage2" :cards="stage2Cards"
            @saved="() => { stage2SettingsKey++; }" />

        <StageSettingsDialog v-model:visible="stage3SettingsDialogVisible" stage-id="stage3" :cards="stage3Cards"
            @saved="() => { stage3SettingsKey++; }" />

        <StageSettingsDialog v-model:visible="stage4SettingsDialogVisible" stage-id="stage4" :cards="stage4Cards"
            @saved="() => { stage4SettingsKey++; }" />
    </div>
</template>
