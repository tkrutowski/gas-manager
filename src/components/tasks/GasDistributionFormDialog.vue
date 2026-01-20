<script setup lang="ts">
import { ref } from 'vue';
import { useGasDistributionsStore } from '@/stores/gasDistributions';
import type { GasDistribution } from '@/types/GasDistribution';

const emit = defineEmits<{
    close: [];
    gasDistributionAdded: [gasDistribution: GasDistribution];
}>();

const gasDistributionsStore = useGasDistributionsStore();
const visible = ref(true);

const formData = ref<Partial<GasDistribution>>({
    name: '',
    distributionNumber: '',
    representative: '',
    info: '',
    isActive: true,
});

const errors = ref<Record<string, string>>({});

const validate = (): boolean => {
    errors.value = {};

    if (!formData.value.name?.trim()) {
        errors.value.name = 'Nazwa jest wymagana';
    }

    return Object.keys(errors.value).length === 0;
};

const handleSubmit = () => {
    if (!validate()) {
        return;
    }

    try {
        const newGasDistribution = gasDistributionsStore.addGasDistribution(
            formData.value as Omit<GasDistribution, 'id' | 'createdAt' | 'updatedAt'>
        );
        emit('gasDistributionAdded', newGasDistribution);
        visible.value = false;
        emit('close');
    } catch (error) {
        console.error('Błąd podczas dodawania jednostki zlecającej:', error);
    }
};

const handleClose = () => {
    visible.value = false;
    emit('close');
};
</script>

<template>
    <Dialog v-model:visible="visible" modal header="Dodaj Nową Jednostkę Zlecającą" :style="{ width: '600px' }"
        @hide="handleClose">
        <form @submit.prevent="handleSubmit" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Nazwa<span class="text-primary-400">*</span>
                </label>
                <InputText v-model="formData.name" :class="{ 'border-red-500': errors.name }"
                    class="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300" />
                <p v-if="errors.name" class="text-red-500 text-sm mt-1">{{ errors.name }}</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Nr rozdziału
                </label>
                <InputText v-model="formData.distributionNumber"
                    class="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300" />
            </div>
            <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Przedstawiciel
                </label>
                <InputText v-model="formData.representative"
                    class="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300" />
            </div>
            <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Uwagi</label>
                <Textarea v-model="formData.info" rows="3"
                    class="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300" />
            </div>
            <div class="flex items-center gap-2">
                <Checkbox v-model="formData.isActive" :binary="true" inputId="isActive" />
                <label for="isActive" class="text-surface-700 dark:text-surface-300">Aktywna</label>
            </div>
        </form>

        <template #footer>
            <SecondaryButton type="button" @click="handleClose" text="Anuluj" size="lg" />
            <PrimaryButton type="button" @click="handleSubmit" text="Zapisz" size="lg" />
        </template>
    </Dialog>
</template>
