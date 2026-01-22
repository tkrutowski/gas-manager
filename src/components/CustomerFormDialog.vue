<script setup lang="ts">
  import { ref } from 'vue';
  import { useCustomersStore } from '@/stores/customers';
  import type { Customer } from '@/types/Customer';
  import { UserIcon, PhoneIcon, MapPinIcon, DocumentTextIcon } from '@heroicons/vue/24/outline';
  import SecondaryButton from '@/components/SecondaryButton.vue';
  import PrimaryButton from '@/components/PrimaryButton.vue';

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
    if (
      formData.value.email &&
      formData.value.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email)
    ) {
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
      const newCustomer = customersStore.addCustomer(
        formData.value as Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>
      );
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
  <Dialog
    v-model:visible="visible"
    modal
    header="Dodaj Nowego Klienta"
    :style="{ width: '800px' }"
    :pt="{
      root: { class: '!bg-surface-0 dark:!bg-surface-950' },
    }"
    @hide="handleClose"
  >
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- INFORMACJE PODSTAWOWE -->
      <div class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
        <h2 class="text-lg font-semibold text-surface-700 dark:text-surface-300 mb-4 flex items-center gap-2">
          <UserIcon class="w-5 h-5 text-primary-400" />
          Informacje Podstawowe
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Typ klienta</label>
            <Select
              v-model="formData.customerType"
              :options="[
                { label: 'Osoba fizyczna', value: 'person' },
                { label: 'Firma', value: 'company' },
              ]"
              optionLabel="label"
              optionValue="value"
              class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300"
            />
          </div>

          <!-- Person fields -->
          <template v-if="formData.customerType === 'person'">
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Imię<span class="text-primary-400">*</span>
              </label>
              <InputText
                v-model="formData.firstName"
                :class="{ 'border-red-500': errors.firstName }"
                class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300"
              />
              <p v-if="errors.firstName" class="text-red-500 text-sm mt-1">{{ errors.firstName }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Nazwisko<span class="text-primary-400">*</span>
              </label>
              <InputText
                v-model="formData.lastName"
                :class="{ 'border-red-500': errors.lastName }"
                class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300"
              />
              <p v-if="errors.lastName" class="text-red-500 text-sm mt-1">{{ errors.lastName }}</p>
            </div>
          </template>

          <!-- Company fields -->
          <template v-else>
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Nazwa firmy<span class="text-primary-400">*</span>
              </label>
              <InputText
                v-model="formData.companyName"
                :class="{ 'border-red-500': errors.companyName }"
                class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300"
              />
              <p v-if="errors.companyName" class="text-red-500 text-sm mt-1">{{ errors.companyName }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                NIP<span class="text-primary-400">*</span>
              </label>
              <InputText
                v-model="formData.nip"
                :class="{ 'border-red-500': errors.nip }"
                class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300"
              />
              <p v-if="errors.nip" class="text-red-500 text-sm mt-1">{{ errors.nip }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">REGON</label>
              <InputText
                v-model="formData.regon"
                class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">KRS</label>
              <InputText
                v-model="formData.krs"
                class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300"
              />
            </div>
          </template>
        </div>
      </div>

      <!-- DANE KONTAKTOWE -->
      <div class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
        <h2 class="text-lg font-semibold text-surface-700 dark:text-surface-300 mb-4 flex items-center gap-2">
          <PhoneIcon class="w-5 h-5 text-primary-400" />
          Dane Kontaktowe
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"> Telefon </label>
            <InputText
              v-model="formData.phone"
              class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"> Email </label>
            <InputText
              v-model="formData.email"
              type="email"
              :class="{ 'border-red-500': errors.email }"
              class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300"
            />
            <p v-if="errors.email" class="text-red-500 text-sm mt-1">{{ errors.email }}</p>
          </div>
        </div>
      </div>

      <!-- LOKALIZACJA -->
      <div class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
        <h2 class="text-lg font-semibold text-surface-700 dark:text-surface-300 mb-4 flex items-center gap-2">
          <MapPinIcon class="w-5 h-5 text-primary-400" />
          Lokalizacja
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Gmina<span class="text-primary-400">*</span>
            </label>
            <InputText
              v-model="formData.address!.commune"
              :class="{ 'border-red-500': errors.commune }"
              class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300"
            />
            <p v-if="errors.commune" class="text-red-500 text-sm mt-1">{{ errors.commune }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Miasto<span class="text-primary-400">*</span>
            </label>
            <InputText
              v-model="formData.address!.city"
              :class="{ 'border-red-500': errors.city }"
              class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300"
            />
            <p v-if="errors.city" class="text-red-500 text-sm mt-1">{{ errors.city }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Ulica<span class="text-primary-400">*</span>
            </label>
            <InputText
              v-model="formData.address!.street"
              :class="{ 'border-red-500': errors.street }"
              class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300"
            />
            <p v-if="errors.street" class="text-red-500 text-sm mt-1">{{ errors.street }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Kod pocztowy<span class="text-primary-400">*</span>
            </label>
            <InputText
              v-model="formData.address!.zip"
              :class="{ 'border-red-500': errors.zip }"
              class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300"
              placeholder="00-000"
            />
            <p v-if="errors.zip" class="text-red-500 text-sm mt-1">{{ errors.zip }}</p>
          </div>
        </div>
      </div>

      <!-- DODATKOWE INFORMACJE -->
      <div class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
        <h2 class="text-lg font-semibold text-surface-700 dark:text-surface-300 mb-4 flex items-center gap-2">
          <DocumentTextIcon class="w-5 h-5 text-primary-400" />
          Dodatkowe Informacje
        </h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Uwagi</label>
            <Textarea
              v-model="formData.info"
              rows="3"
              class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300"
            />
          </div>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <Checkbox v-model="formData.status" :binary="true" inputId="status" />
              <label for="status" class="text-surface-700 dark:text-surface-300">Aktywny</label>
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
