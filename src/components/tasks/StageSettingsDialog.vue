<script setup lang="ts">
import { ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputSwitch from 'primevue/inputswitch';
import SecondaryButton from '@/components/SecondaryButton.vue';
import { useSettingsStore } from '@/stores/settings';
import type { StageCardConfig } from '@/types/Settings';

const props = defineProps<{
    visible: boolean;
    stageId: string;
    cards: Array<{ id: string; title: string }>;
}>();

const emit = defineEmits<{
    'update:visible': [value: boolean];
    saved: [cards: StageCardConfig[]];
    close: [];
}>();

const settingsStore = useSettingsStore();
const cardConfigs = ref<StageCardConfig[]>([]);

// Inicjalizacja danych przy otwarciu dialogu
const initializeCardConfigs = () => {
    // Pobieramy istniejące ustawienia dla tego etapu
    const existingSettings = settingsStore.getStageSettings(props.stageId);
    
    // Tworzymy mapę istniejących ustawień dla szybkiego dostępu
    const existingMap = new Map<string, boolean>();
    if (existingSettings) {
        existingSettings.forEach(config => {
            existingMap.set(config.id, config.required);
        });
    }
    
    // Tworzymy konfigurację dla każdego Card
    // Jeśli Card już ma ustawienia, używamy ich, w przeciwnym razie domyślnie required = false
    cardConfigs.value = props.cards.map(card => ({
        id: card.id,
        title: card.title,
        required: existingMap.get(card.id) || false,
    }));
};

// Watch na visible, żeby inicjalizować przy otwarciu
watch(() => props.visible, (newValue) => {
    if (newValue) {
        initializeCardConfigs();
    }
}, { immediate: true });

// Watch na cards, żeby zaktualizować gdy się zmienią (gdy dialog jest otwarty)
watch(() => props.cards, () => {
    if (props.visible) {
        initializeCardConfigs();
    }
}, { deep: true });

// Zapis ustawień
const handleSave = () => {
    settingsStore.saveStageSettings(props.stageId, cardConfigs.value);
    emit('saved', cardConfigs.value);
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
        :draggable="false" :style="{ width: '40rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
        header="Ustawienia etapu" class="p-fluid">
        <div class="mb-4">
            <p class="text-sm text-surface-600 dark:text-surface-400 mb-4">
                Zaznacz które Cardy są obowiązkowe do zakończenia etapu.
            </p>
            <div class="space-y-4">
                <div v-for="config in cardConfigs" :key="config.id"
                    class="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg">
                    <span class="text-surface-700 dark:text-surface-300 font-medium">{{ config.title }}</span>
                    <InputSwitch v-model="config.required" />
                </div>
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

