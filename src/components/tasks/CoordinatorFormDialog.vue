<script setup lang="ts">
import { ref } from 'vue';
import { useCoordinatorsStore } from '@/stores/coordinators';
import type { Coordinator } from '@/types/Coordinator';

const emit = defineEmits<{
    close: [];
    coordinatorAdded: [coordinator: Coordinator];
}>();

const coordinatorsStore = useCoordinatorsStore();
const visible = ref(true);

const formData = ref<Partial<Coordinator>>({
    name: '',
    lastName: '',
    phone: '',
    phone2: '',
    email: '',
    info: '',
    status: true,
});

const errors = ref<Record<string, string>>({});

const validate = (): boolean => {
    errors.value = {};

    if (!formData.value.name?.trim()) {
        errors.value.name = 'Imię jest wymagane';
    }

    if (!formData.value.lastName?.trim()) {
        errors.value.lastName = 'Nazwisko jest wymagane';
    }

    if (!formData.value.phone?.trim()) {
        errors.value.phone = 'Telefon jest wymagany';
    }

    if (!formData.value.email?.trim()) {
        errors.value.email = 'Email jest wymagany';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email)) {
        errors.value.email = 'Nieprawidłowy format email';
    }

    return Object.keys(errors.value).length === 0;
};

const handleSubmit = () => {
    if (!validate()) {
        return;
    }

    try {
        const newCoordinator = coordinatorsStore.addCoordinator(
            formData.value as Omit<Coordinator, 'id' | 'createdAt' | 'updatedAt'>
        );
        emit('coordinatorAdded', newCoordinator);
        visible.value = false;
        emit('close');
    } catch (error) {
        console.error('Błąd podczas dodawania koordynatora:', error);
    }
};

const handleClose = () => {
    visible.value = false;
    emit('close');
};
</script>

<template>
    <Dialog v-model:visible="visible" modal header="Dodaj Nowego Koordynatora" :style="{ width: '600px' }"
        @hide="handleClose">
        <form @submit.prevent="handleSubmit" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-white/80 mb-2">
                    Imię<span class="text-orange-500">*</span>
                </label>
                <InputText v-model="formData.name" :class="{ 'border-red-500': errors.name }"
                    class="w-full bg-dark-bg-input border border-dark-border text-white" />
                <p v-if="errors.name" class="text-red-500 text-sm mt-1">{{ errors.name }}</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-white/80 mb-2">
                    Nazwisko<span class="text-orange-500">*</span>
                </label>
                <InputText v-model="formData.lastName" :class="{ 'border-red-500': errors.lastName }"
                    class="w-full bg-dark-bg-input border border-dark-border text-white" />
                <p v-if="errors.lastName" class="text-red-500 text-sm mt-1">{{ errors.lastName }}</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-white/80 mb-2">
                    Telefon<span class="text-orange-500">*</span>
                </label>
                <InputText v-model="formData.phone" :class="{ 'border-red-500': errors.phone }"
                    class="w-full bg-dark-bg-input border border-dark-border text-white" />
                <p v-if="errors.phone" class="text-red-500 text-sm mt-1">{{ errors.phone }}</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-white/80 mb-2">Telefon 2</label>
                <InputText v-model="formData.phone2"
                    class="w-full bg-dark-bg-input border border-dark-border text-white" />
            </div>
            <div>
                <label class="block text-sm font-medium text-white/80 mb-2">
                    Email<span class="text-orange-500">*</span>
                </label>
                <InputText v-model="formData.email" type="email" :class="{ 'border-red-500': errors.email }"
                    class="w-full bg-dark-bg-input border border-dark-border text-white" />
                <p v-if="errors.email" class="text-red-500 text-sm mt-1">{{ errors.email }}</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-white/80 mb-2">Uwagi</label>
                <Textarea v-model="formData.info" rows="3"
                    class="w-full bg-dark-bg-input border border-dark-border text-white" />
            </div>
        </form>

        <template #footer>
            <Button label="Anuluj" @click="handleClose" class="p-button-text" />
            <Button label="Zapisz" @click="handleSubmit" />
        </template>
    </Dialog>
</template>
