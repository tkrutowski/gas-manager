<script setup lang="ts">
  import { ref, watch } from 'vue';
  import { useCustomersStore } from '@/stores/customers.ts';
  import type { Customer } from '@/types/Customer.ts';
  import { UserIcon, PhoneIcon, MapPinIcon, DocumentTextIcon, EnvelopeIcon, TrashIcon } from '@heroicons/vue/24/outline';
  import SecondaryButton from '@/components/SecondaryButton.vue';
  import PrimaryButton from '@/components/PrimaryButton.vue';

  const props = defineProps<{
    customer?: Customer | null;
  }>();

  const emit = defineEmits<{
    close: [];
    customerAdded: [customer: Customer];
    customerUpdated: [customer: Customer];
  }>();

  const customersStore = useCustomersStore();
  const visible = ref(true);

  const defaultFormData = (): Partial<Customer> => ({
    customerType: 'person',
    firstName: '',
    lastName: '',
    companyName: '',
    nip: '',
    regon: '',
    krs: '',
    phones: [],
    emails: [],
    info: '',
    address: {
      id: 0,
      commune: '',
      city: '',
      street: '',
      zip: '',
      coordinates: { id: 0, latitude: '', longitude: '' },
    },
    status: true,
  });

  const formData = ref<Partial<Customer>>(defaultFormData());

  watch(
    () => props.customer,
    (c) => {
      if (c) {
        // Obsługa kompatybilności wstecznej - jeśli są stare dane z phone/email jako string
        const oldCustomer = c as any;
        const phones = c.phones || (oldCustomer.phone ? [oldCustomer.phone] : []);
        const emails = c.emails || (oldCustomer.email ? [oldCustomer.email] : []);
        
        formData.value = {
          ...defaultFormData(),
          ...c,
          phones: [...phones],
          emails: [...emails],
          address: c.address
            ? {
                ...c.address,
                coordinates: c.address.coordinates
                  ? { ...c.address.coordinates }
                  : { id: 0, latitude: '', longitude: '' },
              }
            : defaultFormData().address,
        };
      } else {
        formData.value = defaultFormData();
      }
    },
    { immediate: true }
  );

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

    // Walidacja wszystkich emaili - każdy email musi mieć poprawny format
    if (formData.value.emails && formData.value.emails.length > 0) {
      const invalidEmails = formData.value.emails.filter(
        (email) => email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      );
      if (invalidEmails.length > 0) {
        errors.value.emails = 'Niektóre adresy email mają nieprawidłowy format';
      }
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
    if (!validate()) return;

    const id = props.customer?.id;
    try {
      // Usuń puste telefony i emaile przed zapisem
      const cleanedData = {
        ...formData.value,
        phones: formData.value.phones?.filter(phone => phone.trim() !== '') || [],
        emails: formData.value.emails?.filter(email => email.trim() !== '') || [],
      };

      if (id != null) {
        const updated = customersStore.updateCustomer(id, {
          customerType: cleanedData.customerType!,
          firstName: cleanedData.firstName,
          lastName: cleanedData.lastName,
          companyName: cleanedData.companyName,
          nip: cleanedData.nip,
          regon: cleanedData.regon,
          krs: cleanedData.krs,
          phones: cleanedData.phones,
          emails: cleanedData.emails,
          info: cleanedData.info,
          address: cleanedData.address!,
          status: cleanedData.status!,
        });
        if (updated) {
          emit('customerUpdated', updated);
          visible.value = false;
          emit('close');
        }
      } else {
        const newCustomer = customersStore.addCustomer(
          cleanedData as Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>
        );
        emit('customerAdded', newCustomer);
        visible.value = false;
        emit('close');
      }
    } catch (error) {
      console.error(id != null ? 'Błąd podczas aktualizacji klienta' : 'Błąd podczas dodawania klienta', error);
    }
  };

  const handleClose = () => {
    visible.value = false;
    emit('close');
  };

  const handleAddPhone = () => {
    if (!formData.value.phones) {
      formData.value.phones = [];
    }
    // Sprawdź czy ostatni telefon nie jest pusty
    const lastPhone = formData.value.phones[formData.value.phones.length - 1];
    if (lastPhone && lastPhone.trim() !== '') {
      formData.value.phones.push('');
    } else if (formData.value.phones.length === 0) {
      formData.value.phones.push('');
    }
  };

  const handleRemovePhone = (index: number) => {
    if (formData.value.phones) {
      formData.value.phones.splice(index, 1);
    }
  };

  const handleAddEmail = () => {
    if (!formData.value.emails) {
      formData.value.emails = [];
    }
    // Sprawdź czy ostatni email nie jest pusty
    const lastEmail = formData.value.emails[formData.value.emails.length - 1];
    if (lastEmail && lastEmail.trim() !== '') {
      formData.value.emails.push('');
    } else if (formData.value.emails.length === 0) {
      formData.value.emails.push('');
    }
  };

  const handleRemoveEmail = (index: number) => {
    if (formData.value.emails) {
      formData.value.emails.splice(index, 1);
    }
  };
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="customer ? 'Edytuj klienta' : 'Dodaj nowego klienta'"
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
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Telefony</h3>
            <div class="space-y-2">
              <div v-for="(phone, index) in (formData.phones || [])" :key="index" class="flex items-center gap-2">
                <PhoneIcon class="w-4 h-4 text-primary-400" />
                <InputText
                  v-model="formData.phones![index]"
                  class="flex-1 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300"
                />
                <button
                  type="button"
                  class="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  title="Usuń numer telefonu"
                  @click="handleRemovePhone(index)"
                >
                  <TrashIcon class="w-4 h-4" />
                </button>
              </div>
              <p v-if="!formData.phones || !formData.phones.length" class="text-sm text-surface-500 dark:text-surface-400">
                Brak zdefiniowanych numerów telefonów.
              </p>
              <button
                type="button"
                class="text-xs text-primary-500 hover:text-primary-400"
                @click="handleAddPhone"
              >
                + Dodaj numer telefonu
              </button>
            </div>
          </div>
          <div>
            <h3 class="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Adresy e-mail</h3>
            <div class="space-y-2">
              <div v-for="(email, index) in (formData.emails || [])" :key="index" class="flex items-center gap-2">
                <EnvelopeIcon class="w-4 h-4 text-primary-400" />
                <InputText
                  v-model="formData.emails![index]"
                  type="email"
                  :class="{ 'border-red-500': errors.emails }"
                  class="flex-1 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300"
                />
                <button
                  type="button"
                  class="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  title="Usuń adres e-mail"
                  @click="handleRemoveEmail(index)"
                >
                  <TrashIcon class="w-4 h-4" />
                </button>
              </div>
              <p v-if="!formData.emails || !formData.emails.length" class="text-sm text-surface-500 dark:text-surface-400">
                Brak zdefiniowanych adresów e-mail.
              </p>
              <button
                type="button"
                class="text-xs text-primary-500 hover:text-primary-400"
                @click="handleAddEmail"
              >
                + Dodaj adres e-mail
              </button>
              <p v-if="errors.emails" class="text-red-500 text-sm mt-1">{{ errors.emails }}</p>
            </div>
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
