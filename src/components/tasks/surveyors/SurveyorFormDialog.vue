<script setup lang="ts">
  import { ref, watch, computed } from 'vue';
  import Dialog from 'primevue/dialog';
  import InputText from 'primevue/inputtext';
  import Textarea from 'primevue/textarea';
  import Checkbox from 'primevue/checkbox';
  import { useSurveyorsStore } from '@/stores/surveyors';
  import type { Surveyor } from '@/types/Surveyor';
  import {
    UserIcon,
    PhoneIcon,
    MapPinIcon,
    DocumentTextIcon,
    EnvelopeIcon,
    TrashIcon,
  } from '@heroicons/vue/24/outline';
  import SecondaryButton from '@/components/SecondaryButton.vue';
  import PrimaryButton from '@/components/PrimaryButton.vue';

  const props = defineProps<{
    visible: boolean;
    surveyor?: Surveyor | null;
  }>();

  const emit = defineEmits<{
    'update:visible': [value: boolean];
    close: [];
    'surveyor-added': [surveyor: Surveyor];
    'surveyor-updated': [surveyor: Surveyor];
  }>();

  const surveyorsStore = useSurveyorsStore();

  const defaultFormData = (): Partial<Surveyor> => ({
    name: '',
    lastName: '',
    phones: [],
    emails: [],
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

  const formData = ref<Partial<Surveyor>>(defaultFormData());

  const isEditMode = computed(() => !!props.surveyor);

  const dialogHeader = computed(() => (isEditMode.value ? 'Edytuj Geodetę' : 'Dodaj Nowego Geodetę'));

  watch(
    () => props.visible,
    newVal => {
      if (newVal) {
        if (props.surveyor) {
          formData.value = {
            ...defaultFormData(),
            ...props.surveyor,
            phones: props.surveyor.phones ? [...props.surveyor.phones] : [],
            emails: props.surveyor.emails ? [...props.surveyor.emails] : [],
            address: props.surveyor.address
              ? {
                  ...props.surveyor.address,
                  coordinates: props.surveyor.address.coordinates
                    ? { ...props.surveyor.address.coordinates }
                    : { id: 0, latitude: '', longitude: '' },
                }
              : defaultFormData().address,
          };
        } else {
          formData.value = defaultFormData();
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

    // Walidacja wszystkich emaili - każdy email musi mieć poprawny format
    if (formData.value.emails && formData.value.emails.length > 0) {
      const invalidEmails = formData.value.emails.filter(
        email => email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      );
      if (invalidEmails.length > 0) {
        errors.value.emails = 'Niektóre adresy email mają nieprawidłowy format';
      }
    }

    return Object.keys(errors.value).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    try {
      // Usuń puste telefony i emaile przed zapisem
      const cleanedData = {
        ...formData.value,
        phones: formData.value.phones?.filter(phone => phone.trim() !== '') || [],
        emails: formData.value.emails?.filter(email => email.trim() !== '') || [],
      };

      if (isEditMode.value && props.surveyor) {
        const updated = surveyorsStore.updateSurveyor(
          props.surveyor.id,
          cleanedData as Partial<Omit<Surveyor, 'id' | 'createdAt'>>
        );
        if (updated) {
          emit('surveyor-updated', updated);
        }
      } else {
        const newSurveyor = surveyorsStore.addSurveyor(cleanedData as Omit<Surveyor, 'id' | 'createdAt' | 'updatedAt'>);
        emit('surveyor-added', newSurveyor);
      }

      emit('update:visible', false);
      emit('close');
    } catch (error) {
      console.error('Błąd podczas zapisywania geodety:', error);
    }
  };

  const handleClose = () => {
    emit('update:visible', false);
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
    v-model:visible="props.visible"
    modal
    :header="dialogHeader"
    :style="{ width: '800px' }"
    :pt="{
      root: { class: '!bg-surface-0 dark:!bg-surface-950' },
    }"
    @update:visible="emit('update:visible', $event)"
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
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Imię<span class="text-primary-400">*</span>
            </label>
            <InputText
              v-model="formData.name"
              :class="{ 'border-red-500': errors.name }"
              class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300"
            />
            <p v-if="errors.name" class="text-red-500 text-sm mt-1">{{ errors.name }}</p>
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
              <div v-for="(_phone, index) in formData.phones || []" :key="index" class="flex items-center gap-2">
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
              <p
                v-if="!formData.phones || !formData.phones.length"
                class="text-sm text-surface-500 dark:text-surface-400"
              >
                Brak zdefiniowanych numerów telefonów.
              </p>
              <button type="button" class="text-xs text-primary-500 hover:text-primary-400" @click="handleAddPhone">
                + Dodaj numer telefonu
              </button>
            </div>
          </div>
          <div>
            <h3 class="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Adresy e-mail</h3>
            <div class="space-y-2">
              <div v-for="(_email, index) in formData.emails || []" :key="index" class="flex items-center gap-2">
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
              <p
                v-if="!formData.emails || !formData.emails.length"
                class="text-sm text-surface-500 dark:text-surface-400"
              >
                Brak zdefiniowanych adresów e-mail.
              </p>
              <button type="button" class="text-xs text-primary-500 hover:text-primary-400" @click="handleAddEmail">
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
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Gmina</label>
            <InputText
              v-model="formData.address!.commune"
              class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Miasto</label>
            <InputText
              v-model="formData.address!.city"
              class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Ulica</label>
            <InputText
              v-model="formData.address!.street"
              class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Kod pocztowy</label>
            <InputText
              v-model="formData.address!.zip"
              class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300"
            />
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
            <Textarea
              v-model="formData.info"
              rows="3"
              class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300"
            />
          </div>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <Checkbox v-model="formData.status" :binary="true" inputId="status-surveyor" />
              <label for="status-surveyor" class="text-surface-700 dark:text-surface-300">Aktywny</label>
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
