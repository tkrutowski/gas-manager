<script setup lang="ts">
import { computed } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import Dialog from 'primevue/dialog';
import Card from 'primevue/card';
import Button from 'primevue/button';
import type { Plot, PlotOwnerPrivate } from '@/types/Plot';
import { UtilsService } from '@/utils/formatService';
import { CheckIcon } from '@heroicons/vue/24/solid';
import { MapIcon } from '@heroicons/vue/24/outline';

const props = defineProps<{
    visible: boolean;
    plot: Plot | null;
    isReadonly: boolean;
}>();

const emit = defineEmits<{
    'update:visible': [value: boolean];
    'edit': [plotOwnerPrivate: PlotOwnerPrivate];
    'delete': [event: Event, plotOwnerPrivate: PlotOwnerPrivate];
}>();

const confirm = useConfirm();

// Lista właścicieli prywatnych
const plotOwnerPrivateList = computed(() => props.plot?.plotOwnerPrivate || []);

// Funkcja do określania koloru właściciela prywatnego na podstawie dat
const getPlotOwnerPrivateColor = (owner: PlotOwnerPrivate): 'red' | 'yellow' | 'green' => {
    const hasSubmission = !!owner.submissionDate;
    const hasReceipt = !!owner.receiptDate;
    const hasSubmission1 = !!owner.submissionDate1;
    const hasReceipt1 = !!owner.receiptDate1;
    const hasSubmission2 = !!owner.submissionDate2;
    const hasReceipt2 = !!owner.receiptDate2;

    // Sprawdź czy wszystkie daty są puste
    if (!hasSubmission && !hasReceipt && !hasSubmission1 && !hasReceipt1 && !hasSubmission2 && !hasReceipt2) {
        return 'red';
    }

    // Sprawdź czy któraś data złożenia jest uzupełniona, ale odpowiadająca data otrzymania jest pusta
    if ((hasSubmission && !hasReceipt) || (hasSubmission1 && !hasReceipt1) || (hasSubmission2 && !hasReceipt2)) {
        return 'yellow';
    }

    // Jeśli wszystkie wypełnione daty złożenia mają odpowiadające daty otrzymania
    return 'green';
};

// Funkcja do określania klas CSS dla obramowania właściciela prywatnego
const getPlotOwnerPrivateBorderClasses = (owner: PlotOwnerPrivate): string => {
    const color = getPlotOwnerPrivateColor(owner);
    switch (color) {
        case 'red':
            return 'border-red-400 dark:border-red-500';
        case 'yellow':
            return 'border-yellow-400 dark:border-yellow-500';
        case 'green':
            return 'border-green-400 dark:border-green-500';
        default:
            return 'border-surface-200 dark:border-surface-700';
    }
};

// Funkcja do określania klas CSS dla tła właściciela prywatnego
const getPlotOwnerPrivateBgClasses = (owner: PlotOwnerPrivate): string => {
    const color = getPlotOwnerPrivateColor(owner);
    switch (color) {
        case 'red':
            return 'bg-red-50 dark:bg-red-900/20';
        case 'yellow':
            return 'bg-yellow-50 dark:bg-yellow-900/20';
        case 'green':
            return 'bg-green-50 dark:bg-green-900/20';
        default:
            return 'bg-surface-50 dark:bg-surface-900';
    }
};

// Logika kolorowania ikony checkmark w headerze dla właścicieli prywatnych
const plotOwnerPrivateCheckmarkColor = computed<'red' | 'yellow' | 'green'>(() => {
    if (plotOwnerPrivateList.value.length === 0) return 'red';

    const ownerColors = plotOwnerPrivateList.value.map(owner => getPlotOwnerPrivateColor(owner));

    // Jeśli wszystkie są zielone → zielony
    if (ownerColors.every(color => color === 'green')) {
        return 'green';
    }

    // Jeśli wszystkie są czerwone → czerwony
    if (ownerColors.every(color => color === 'red')) {
        return 'red';
    }

    // Jeśli którykolwiek ma kolor inny niż czerwony → żółty
    return 'yellow';
});

// Klasy CSS dla ikony checkmark
const plotOwnerPrivateCheckmarkClasses = computed(() => {
    const color = plotOwnerPrivateCheckmarkColor.value;
    const baseClasses = 'w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ring-1';

    switch (color) {
        case 'red':
            return `${baseClasses} border-red-400 bg-red-400/10 shadow-[0_0_8px_rgba(239,68,68,0.5)] ring-red-400/50`;
        case 'yellow':
            return `${baseClasses} border-yellow-400 bg-yellow-400/10 shadow-[0_0_8px_rgba(234,179,8,0.5)] ring-yellow-400/50`;
        case 'green':
            return `${baseClasses} border-green-400 bg-green-400/10 shadow-[0_0_8px_rgba(34,197,94,0.5)] ring-green-400/50`;
        default:
            return `${baseClasses} border-green-400 bg-green-400/10 shadow-[0_0_8px_rgba(34,197,94,0.5)] ring-green-400/50`;
    }
});

// Klasy CSS dla ikony checkmark (ikona wewnątrz)
const plotOwnerPrivateCheckmarkIconClasses = computed(() => {
    const color = plotOwnerPrivateCheckmarkColor.value;
    const baseClasses = 'w-5 h-5';

    switch (color) {
        case 'red':
            return `${baseClasses} text-red-400`;
        case 'yellow':
            return `${baseClasses} text-yellow-400`;
        case 'green':
            return `${baseClasses} text-green-400`;
        default:
            return `${baseClasses} text-green-400`;
    }
});

// Computed property dla statusu właścicieli prywatnych (ilość zielonych/total)
const plotOwnerPrivateStatus = computed(() => {
    const total = plotOwnerPrivateList.value.length;
    if (total === 0) return { text: 'STATUS: UKOŃCZONO (0/0)', green: 0, total: 0 };

    const green = plotOwnerPrivateList.value.filter(owner => getPlotOwnerPrivateColor(owner) === 'green').length;
    return {
        text: `STATUS: UKOŃCZONO (${green}/${total})`,
        green,
        total
    };
});

// Usuwanie PlotOwnerPrivate
const handleDelete = (event: Event, plotOwnerPrivate: PlotOwnerPrivate) => {
    confirm.require({
        target: event.currentTarget as HTMLElement,
        message: `Czy na pewno chcesz usunąć właściciela prywatnego "${plotOwnerPrivate.name} ${plotOwnerPrivate.lastName}"?`,
        icon: 'pi pi-exclamation-triangle',
        rejectProps: {
            label: 'Anuluj',
            severity: 'secondary',
            outlined: true,
        },
        acceptProps: {
            label: 'Usuń',
            severity: 'danger',
        },
        accept: () => {
            emit('delete', event, plotOwnerPrivate);
        },
    });
};
</script>

<template>
    <Dialog :visible="visible" @update:visible="(val) => emit('update:visible', val)" modal :closable="true"
        :draggable="false" :style="{ width: '90rem' }" :breakpoints="{ '1199px': '95vw', '575px': '95vw' }"
        header="Właściciele prywatni - Lista" class="p-fluid">
        <Card class="border border-surface-200 dark:border-surface-700 overflow-hidden">
            <!-- Header -->
            <template #header>
                <div
                    class="flex items-center justify-between px-4 py-3 bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700">
                    <div class="flex items-center gap-4">
                        <!-- Ikona mapy -->
                        <div class="w-12 h-12 bg-primary-400/70 rounded-full flex items-center justify-center shrink-0">
                            <MapIcon class="w-8 h-8 text-white" />
                        </div>
                        <!-- Tytuł i status -->
                        <div>
                            <h3 class="text-lg font-bold uppercase text-surface-700 dark:text-surface-300 m-0">
                                WŁAŚCICIELE DZIALEK PRYWATNYCH
                            </h3>
                            <p class="text-sm text-surface-600 dark:text-surface-400 m-0 mt-1">
                                {{ plotOwnerPrivateStatus.text }}
                            </p>
                        </div>
                    </div>
                    <!-- Ikona checkmark po prawej stronie -->
                    <div :class="plotOwnerPrivateCheckmarkClasses">
                        <CheckIcon :class="plotOwnerPrivateCheckmarkIconClasses" />
                    </div>
                </div>
            </template>
            <template #content>
                <div class="space-y-4">
                    <!-- Lista właścicieli prywatnych -->
                    <div v-for="owner in plotOwnerPrivateList" :key="owner.id"
                        :class="`p-4 rounded-lg border ${getPlotOwnerPrivateBorderClasses(owner)} ${getPlotOwnerPrivateBgClasses(owner)}`">
                        <div class="space-y-4">
                            <!-- Dane podstawowe -->
                            <div class="grid grid-cols-6 gap-3">
                                <!-- IMIĘ -->
                                <div class="mt-3">
                                    <label class="block text-xs uppercase text-surface-600 dark:text-surface-400 mb-1">
                                        IMIĘ
                                    </label>
                                    <p class="text-sm text-surface-700 dark:text-surface-300 m-0">
                                        {{ owner.name || 'Brak danych' }}
                                    </p>
                                </div>

                                <!-- NAZWISKO -->
                                <div class="mt-3">
                                    <label class="block text-xs uppercase text-surface-600 dark:text-surface-400 mb-1">
                                        NAZWISKO
                                    </label>
                                    <p class="text-sm text-surface-700 dark:text-surface-300 m-0">
                                        {{ owner.lastName || 'Brak danych' }}
                                    </p>
                                </div>

                                <!-- UDZIAŁ [%] -->
                                <div class="mt-3">
                                    <label class="block text-xs uppercase text-surface-600 dark:text-surface-400 mb-1">
                                        UDZIAŁ [%]
                                    </label>
                                    <p class="text-sm text-surface-700 dark:text-surface-300 m-0">
                                        {{ owner.share || 0 }}%
                                    </p>
                                </div>

                                <!-- DATA ZŁOŻENIA -->
                                <div class="mt-3">
                                    <label class="block text-xs uppercase text-surface-600 dark:text-surface-400 mb-1">
                                        DATA ZŁOŻENIA
                                    </label>
                                    <div class="flex items-center gap-2">
                                        <i class="pi pi-calendar text-surface-400 text-sm"></i>
                                        <p class="text-sm text-surface-700 dark:text-surface-300 m-0">
                                            {{ UtilsService.formatDateToString(owner.submissionDate) || '---' }}
                                        </p>
                                    </div>
                                </div>

                                <!-- DATA OTRZYMANIA -->
                                <div class="mt-3">
                                    <label class="block text-xs uppercase text-surface-600 dark:text-surface-400 mb-1">
                                        DATA OTRZYMANIA
                                    </label>
                                    <div class="flex items-center gap-2">
                                        <i class="pi pi-calendar text-surface-400 text-sm"></i>
                                        <p class="text-sm text-surface-700 dark:text-surface-300 m-0">
                                            {{ UtilsService.formatDateToString(owner.receiptDate) || '---' }}
                                        </p>
                                    </div>
                                </div>

                                <!-- Przyciski akcji -->
                                <div class="flex flex-col items-end gap-2">
                                    <div class="flex gap-2">
                                        <Button icon="pi pi-pencil" severity="secondary" text rounded
                                            :disabled="isReadonly" @click="emit('edit', owner)"
                                            title="Edytuj właściciela prywatnego" />
                                        <Button icon="pi pi-trash" severity="danger" text rounded :disabled="isReadonly"
                                            @click="(event) => handleDelete(event, owner)"
                                            title="Usuń właściciela prywatnego" />
                                    </div>
                                </div>
                            </div>

                            <!-- Termin dodatkowy I -->
                            <div v-if="owner.submissionDate1 || owner.receiptDate1 || owner.info1"
                                class="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
                                <label
                                    class="block text-xs uppercase text-surface-600 dark:text-surface-400 mb-2 font-bold">
                                    TERMIN DODATKOWY I
                                </label>
                                <div class="grid grid-cols-3 gap-3">
                                    <!-- DATA ZŁOŻENIA -->
                                    <div>
                                        <label
                                            class="block text-xs uppercase text-surface-600 dark:text-surface-400 mb-1">
                                            DATA ZŁOŻENIA
                                        </label>
                                        <div class="flex items-center gap-2">
                                            <i class="pi pi-calendar text-surface-400 text-sm"></i>
                                            <p class="text-sm text-surface-700 dark:text-surface-300 m-0">
                                                {{ UtilsService.formatDateToString(owner.submissionDate1) || '---' }}
                                            </p>
                                        </div>
                                    </div>

                                    <!-- DATA OTRZYMANIA -->
                                    <div>
                                        <label
                                            class="block text-xs uppercase text-surface-600 dark:text-surface-400 mb-1">
                                            DATA OTRZYMANIA
                                        </label>
                                        <div class="flex items-center gap-2">
                                            <i class="pi pi-calendar text-surface-400 text-sm"></i>
                                            <p class="text-sm text-surface-700 dark:text-surface-300 m-0">
                                                {{ UtilsService.formatDateToString(owner.receiptDate1) || '---' }}
                                            </p>
                                        </div>
                                    </div>

                                    <!-- INNE INFO -->
                                    <div>
                                        <label
                                            class="block text-xs uppercase text-surface-600 dark:text-surface-400 mb-1">
                                            INNE INFO
                                        </label>
                                        <p class="text-sm text-surface-700 dark:text-surface-300 m-0">
                                            {{ owner.info1 || 'Brak danych' }}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <!-- Termin dodatkowy II -->
                            <div v-if="owner.submissionDate2 || owner.receiptDate2 || owner.info2"
                                class="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
                                <label
                                    class="block text-xs uppercase text-surface-600 dark:text-surface-400 mb-2 font-bold">
                                    TERMIN DODATKOWY II
                                </label>
                                <div class="grid grid-cols-3 gap-3">
                                    <!-- DATA ZŁOŻENIA -->
                                    <div>
                                        <label
                                            class="block text-xs uppercase text-surface-600 dark:text-surface-400 mb-1">
                                            DATA ZŁOŻENIA
                                        </label>
                                        <div class="flex items-center gap-2">
                                            <i class="pi pi-calendar text-surface-400 text-sm"></i>
                                            <p class="text-sm text-surface-700 dark:text-surface-300 m-0">
                                                {{ UtilsService.formatDateToString(owner.submissionDate2) || '---' }}
                                            </p>
                                        </div>
                                    </div>

                                    <!-- DATA OTRZYMANIA -->
                                    <div>
                                        <label
                                            class="block text-xs uppercase text-surface-600 dark:text-surface-400 mb-1">
                                            DATA OTRZYMANIA
                                        </label>
                                        <div class="flex items-center gap-2">
                                            <i class="pi pi-calendar text-surface-400 text-sm"></i>
                                            <p class="text-sm text-surface-700 dark:text-surface-300 m-0">
                                                {{ UtilsService.formatDateToString(owner.receiptDate2) || '---' }}
                                            </p>
                                        </div>
                                    </div>

                                    <!-- INNE INFO -->
                                    <div>
                                        <label
                                            class="block text-xs uppercase text-surface-600 dark:text-surface-400 mb-1">
                                            INNE INFO
                                        </label>
                                        <p class="text-sm text-surface-700 dark:text-surface-300 m-0">
                                            {{ owner.info2 || 'Brak danych' }}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Komunikat gdy brak właścicieli -->
                    <div v-if="plotOwnerPrivateList.length === 0"
                        class="p-8 text-center text-surface-600 dark:text-surface-400">
                        <p>Brak właścicieli prywatnych. Kliknij ikonę "+" aby dodać pierwszego właściciela
                            prywatnego.</p>
                    </div>
                </div>
            </template>
        </Card>

        <template #footer>
            <div class="flex justify-end gap-2">
                <Button label="Zamknij" severity="secondary" outlined @click="emit('update:visible', false)" />
            </div>
        </template>
    </Dialog>
</template>
