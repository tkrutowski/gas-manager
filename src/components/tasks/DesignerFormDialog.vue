<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useDesignersStore } from '@/stores/designers';
import type { Designer } from '@/types/Designer';
import { UserIcon, PhoneIcon, MapPinIcon, DocumentTextIcon } from '@heroicons/vue/24/outline';
import SecondaryButton from '@/components/SecondaryButton.vue';
import PrimaryButton from '@/components/PrimaryButton.vue';

const props = defineProps<{
    visible: boolean;
    designer?: Designer | null;
}>();

const emit = defineEmits<{
    'update:visible': [value: boolean];
    close: [];
    designerAdded: [designer: Designer];
    designerUpdated: [designer: Designer];
}>();

const designersStore = useDesignersStore();

const formData = ref<Partial<Designer>>({
    name: '',
    lastName: '',
    phone: '',
    phone2: '',
    email: '',
    info: '',
    address: {
        id: 0,
        commune: '',
        city: '',
        street: '',
        zip: '',
        coordinates: {
            id: 0,
            latitude: '',
            longitude: '',
        },
    },
    status: true,
    employee: false,
});

const isEditMode = computed(() => !!props.designer);

const dialogHeader = computed(() => (isEditMode.value ? 'Edytuj Projektanta' : 'Dodaj Nowego Projektanta'));

// Inicjalizacja formularza przy otwarciu
watch(
    () => props.visible,
    newVal => {
        if (newVal) {
            if (props.designer) {
                // Tryb edycji - wypełnij formularz danymi projektanta
                formData.value = {
                    name: props.designer.name || '',
                    lastName: props.designer.lastName || '',
                    phone: props.designer.phone || '',
                    phone2: props.designer.phone2 || '',
                    email: props.designer.email || '',
                    info: props.designer.info || '',
                    address: props.designer.address
                        ? {
                            id: props.designer.address.id,
                            commune: props.designer.address.commune || '',
                            city: props.designer.address.city || '',
                            street: props.designer.address.street || '',
                            zip: props.designer.address.zip || '',
                            coordinates: props.designer.address.coordinates
                                ? {
                                    id: props.designer.address.coordinates.id,
                                    latitude: props.designer.address.coordinates.latitude || '',
                                    longitude: props.designer.address.coordinates.longitude || '',
                                }
                                : {
                                    id: 0,
                                    latitude: '',
                                    longitude: '',
                                },
                        }
                        : {
                            id: 0,
                            commune: '',
                            city: '',
                            street: '',
                            zip: '',
                            coordinates: {
                                id: 0,
                                latitude: '',
                                longitude: '',
                            },
                        },
                    status: props.designer.status ?? true,
                    employee: props.designer.employee ?? false,
                };
            } else {
                // Tryb dodawania - wyczyść formularz
                formData.value = {
                    name: '',
                    lastName: '',
                    phone: '',
                    phone2: '',
                    email: '',
                    info: '',
                    address: {
                        id: 0,
                        commune: '',
                        city: '',
                        street: '',
                        zip: '',
                        coordinates: {
                            id: 0,
                            latitude: '',
                            longitude: '',
                        },
                    },
                    status: true,
                    employee: false,
                };
            }
            errors.value = {};
        }
    },
    { immediate: true }
);

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
        if (isEditMode.value && props.designer) {
            // Tryb edycji
            const updatedDesigner = designersStore.updateDesigner(
                props.designer.id,
                formData.value as Partial<Omit<Designer, 'id' | 'createdAt'>>
            );
            if (updatedDesigner) {
                emit('designerUpdated', updatedDesigner);
            }
        } else {
            // Tryb dodawania
            const newDesigner = designersStore.addDesigner(
                formData.value as Omit<Designer, 'id' | 'createdAt' | 'updatedAt'>
            );
            emit('designerAdded', newDesigner);
        }
        emit('update:visible', false);
        emit('close');
    } catch (error) {
        console.error('Błąd podczas zapisywania projektanta:', error);
    }
};

const handleClose = () => {
    emit('update:visible', false);
    emit('close');
};
</script>

<template>
    <Dialog v-model:visible="props.visible" modal :header="dialogHeader" :style="{ width: '800px' }" :pt="{
        root: { class: '!bg-surface-0 dark:!bg-surface-950' }
    }" @update:visible="emit('update:visible', $event)" @hide="handleClose">
        <form @submit.prevent="handleSubmit" class="space-y-6">
            <!-- INFORMACJE PODSTAWOWE -->
            <div
                class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <UserIcon class="w-5 h-5 text-primary-400" />
                    Informacje Podstawowe
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Imię<span class="text-primary-400">*</span>
                        </label>
                        <InputText v-model="formData.name" :class="{ 'border-red-500': errors.name }"
                            class="w-full bg-white dark:bg-gray-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-white" />
                        <p v-if="errors.name" class="text-red-500 text-sm mt-1">{{ errors.name }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nazwisko<span class="text-primary-400">*</span>
                        </label>
                        <InputText v-model="formData.lastName" :class="{ 'border-red-500': errors.lastName }"
                            class="w-full bg-white dark:bg-gray-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-white" />
                        <p v-if="errors.lastName" class="text-red-500 text-sm mt-1">{{ errors.lastName }}</p>
                    </div>
                </div>
            </div>

            <!-- DANE KONTAKTOWE -->
            <div
                class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <PhoneIcon class="w-5 h-5 text-primary-400" />
                    Dane Kontaktowe
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Telefon<span class="text-primary-400">*</span>
                        </label>
                        <InputText v-model="formData.phone" :class="{ 'border-red-500': errors.phone }"
                            class="w-full bg-white dark:bg-gray-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-white" />
                        <p v-if="errors.phone" class="text-red-500 text-sm mt-1">{{ errors.phone }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Telefon 2</label>
                        <InputText v-model="formData.phone2"
                            class="w-full bg-white dark:bg-gray-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-white" />
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Adres E-mail<span class="text-primary-400">*</span>
                        </label>
                        <InputText v-model="formData.email" type="email" :class="{ 'border-red-500': errors.email }"
                            class="w-full bg-white dark:bg-gray-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-white" />
                        <p v-if="errors.email" class="text-red-500 text-sm mt-1">{{ errors.email }}</p>
                    </div>
                </div>
            </div>

            <!-- LOKALIZACJA -->
            <div
                class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <MapPinIcon class="w-5 h-5 text-primary-400" />
                    Lokalizacja
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Gmina </label>
                        <InputText v-model="formData.address!.commune"
                            class="w-full bg-white dark:bg-gray-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-white" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Miasto </label>
                        <InputText v-model="formData.address!.city"
                            class="w-full bg-white dark:bg-gray-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-white" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Ulica </label>
                        <InputText v-model="formData.address!.street"
                            class="w-full bg-white dark:bg-gray-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-white" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Kod
                            pocztowy</label>
                        <InputText v-model="formData.address!.zip"
                            class="w-full bg-white dark:bg-gray-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-white" />
                    </div>
                </div>
            </div>

            <!-- DODATKOWE INFORMACJE -->
            <div
                class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <DocumentTextIcon class="w-5 h-5 text-primary-400" />
                    Dodatkowe Informacje
                </h2>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Uwagi</label>
                        <Textarea v-model="formData.info" rows="3"
                            class="w-full bg-white dark:bg-gray-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-white" />
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="flex items-center gap-2">
                            <Checkbox v-model="formData.status" :binary="true" inputId="status" />
                            <label for="status" class="text-gray-700 dark:text-gray-300">Aktywny</label>
                        </div>
                        <div class="flex items-center gap-2">
                            <Checkbox v-model="formData.employee" :binary="true" inputId="employee" />
                            <label for="employee" class="text-gray-700 dark:text-gray-300">Pracownik firmy</label>
                        </div>
                    </div>
                </div>
            </div>
        </form>

        <template #footer>
            <SecondaryButton type="button" @click="handleClose" text="Anuluj" size="lg" />
            <PrimaryButton type="button" @click="handleSubmit" text="Zapisz" size="lg" />
        </template>
    </Dialog>
</template>
