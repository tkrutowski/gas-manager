<script setup lang="ts">
import { ref } from 'vue';
import { useCustomersStore } from '@/stores/customers';
import type { Customer } from '@/types/Customer';

const emit = defineEmits<{
    close: [];
    customerAdded: [customer: Customer];
}>();

const customersStore = useCustomersStore();
const visible = ref(true);

const formData = ref<Partial<Customer>>({
    customerType: 'person',
    firstName: '',
    lastName: '',
    companyName: '',
    nip: '',
    regon: '',
    krs: '',
    phone: '',
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
});

const errors = ref<Record<string, string>>({});

const validate = (): boolean => {
    errors.value = {};

    if (formData.value.customerType === 'person') {
        if (!formData.value.firstName?.trim()) {
            errors.value.firstName = 'Imię jest wymagane';
        }
        if (!formData.value.lastName?.trim()) {
            errors.value.lastName = 'Nazwisko jest wymagane';
        }
    } else {
        if (!formData.value.companyName?.trim()) {
            errors.value.companyName = 'Nazwa firmy jest wymagana';
        }
        if (!formData.value.nip?.trim()) {
            errors.value.nip = 'NIP jest wymagany';
        }
    }

    // Telefon i email są opcjonalne, ale jeśli są wypełnione, email musi mieć poprawny format
    if (formData.value.email && formData.value.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email)) {
        errors.value.email = 'Nieprawidłowy format email';
    }

    if (!formData.value.address?.commune?.trim()) {
        errors.value.commune = 'Gmina jest wymagana';
    }

    if (!formData.value.address?.city?.trim()) {
        errors.value.city = 'Miasto jest wymagane';
    }

    if (!formData.value.address?.street?.trim()) {
        errors.value.street = 'Ulica jest wymagana';
    }

    // Kod pocztowy jest obowiązkowy dla obu typów
    if (!formData.value.address?.zip?.trim()) {
        errors.value.zip = 'Kod pocztowy jest wymagany';
    } else if (!/^\d{2}-\d{3}$/.test(formData.value.address.zip.trim())) {
        errors.value.zip = 'Kod pocztowy musi być w formacie 00-000';
    }

    return Object.keys(errors.value).length === 0;
};

const handleSubmit = () => {
    if (!validate()) {
        return;
    }

    try {
        const newCustomer = customersStore.addCustomer(formData.value as Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>);
        emit('customerAdded', newCustomer);
        visible.value = false;
        emit('close');
    } catch (error) {
        console.error('Błąd podczas dodawania klienta:', error);
    }
};

const handleClose = () => {
    visible.value = false;
    emit('close');
};
</script>

<template>
    <Dialog v-model:visible="visible" modal header="Dodaj Nowego Klienta" :style="{ width: '600px' }"
        @hide="handleClose">
        <form @submit.prevent="handleSubmit" class="space-y-4">
            <!-- Customer Type -->
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Typ klienta</label>
                <Select v-model="formData.customerType" :options="[
                    { label: 'Osoba fizyczna', value: 'person' },
                    { label: 'Firma', value: 'company' },
                ]" optionLabel="label" optionValue="value" class="w-full" />
            </div>

            <!-- Person fields -->
            <template v-if="formData.customerType === 'person'">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Imię<span class="text-yellow-500">*</span>
                    </label>
                    <InputText v-model="formData.firstName" :class="{ 'border-red-500': errors.firstName }"
                        class="w-full bg-white dark:bg-gray-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-white" />
                    <p v-if="errors.firstName" class="text-red-500 text-sm mt-1">{{ errors.firstName }}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nazwisko<span class="text-yellow-500">*</span>
                    </label>
                    <InputText v-model="formData.lastName" :class="{ 'border-red-500': errors.lastName }"
                        class="w-full bg-white dark:bg-gray-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-white" />
                    <p v-if="errors.lastName" class="text-red-500 text-sm mt-1">{{ errors.lastName }}</p>
                </div>
            </template>

            <!-- Company fields -->
            <template v-else>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nazwa firmy<span class="text-yellow-500">*</span>
                    </label>
                    <InputText v-model="formData.companyName" :class="{ 'border-red-500': errors.companyName }"
                        class="w-full bg-white dark:bg-gray-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-white" />
                    <p v-if="errors.companyName" class="text-red-500 text-sm mt-1">{{ errors.companyName }}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        NIP<span class="text-yellow-500">*</span>
                    </label>
                    <InputText v-model="formData.nip" :class="{ 'border-red-500': errors.nip }"
                        class="w-full bg-white dark:bg-gray-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-white" />
                    <p v-if="errors.nip" class="text-red-500 text-sm mt-1">{{ errors.nip }}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">REGON</label>
                    <InputText v-model="formData.regon"
                        class="w-full bg-white dark:bg-gray-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">KRS</label>
                    <InputText v-model="formData.krs"
                        class="w-full bg-white dark:bg-gray-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-white" />
                </div>
            </template>

            <!-- Common fields -->
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Telefon
                </label>
                <InputText v-model="formData.phone"
                    class="w-full bg-white dark:bg-gray-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-white" />
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                </label>
                <InputText v-model="formData.email" type="email" :class="{ 'border-red-500': errors.email }"
                    class="w-full bg-white dark:bg-gray-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-white" />
                <p v-if="errors.email" class="text-red-500 text-sm mt-1">{{ errors.email }}</p>
            </div>

            <!-- Address -->
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Gmina<span class="text-yellow-500">*</span>
                </label>
                <InputText v-model="formData.address!.commune" :class="{ 'border-red-500': errors.commune }"
                    class="w-full bg-white dark:bg-gray-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-white" />
                <p v-if="errors.commune" class="text-red-500 text-sm mt-1">{{ errors.commune }}</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Miasto<span class="text-yellow-500">*</span>
                </label>
                <InputText v-model="formData.address!.city" :class="{ 'border-red-500': errors.city }"
                    class="w-full bg-white dark:bg-gray-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-white" />
                <p v-if="errors.city" class="text-red-500 text-sm mt-1">{{ errors.city }}</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ulica<span class="text-yellow-500">*</span>
                </label>
                <InputText v-model="formData.address!.street" :class="{ 'border-red-500': errors.street }"
                    class="w-full bg-white dark:bg-gray-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-white" />
                <p v-if="errors.street" class="text-red-500 text-sm mt-1">{{ errors.street }}</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kod pocztowy<span class="text-yellow-500">*</span>
                </label>
                <InputText v-model="formData.address!.zip" :class="{ 'border-red-500': errors.zip }"
                    class="w-full bg-white dark:bg-gray-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-white"
                    placeholder="00-000" />
                <p v-if="errors.zip" class="text-red-500 text-sm mt-1">{{ errors.zip }}</p>
            </div>

            <!-- Info -->
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Uwagi</label>
                <Textarea v-model="formData.info" rows="3"
                    class="w-full bg-white dark:bg-gray-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-white" />
            </div>

            <!-- Footer -->
            <div
                class="flex items-center justify-between pt-4 border-t border-surface-200 dark:border-surface-700 mt-6">
                <p class="text-sm text-gray-600 dark:text-gray-400">* - pola, które muszą być wypełnione</p>
                <div class="flex gap-4">
                    <button type="button" @click="handleClose"
                        class="px-6 py-2 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-900 dark:text-white">
                        Anuluj
                    </button>
                    <button type="submit"
                        class="px-6 py-2 bg-primary-400 hover:bg-primary-300 text-black rounded-lg transition-colors font-medium">
                        Zapisz
                    </button>
                </div>
            </div>
        </form>
    </Dialog>
</template>
