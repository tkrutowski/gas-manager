<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useSurveyorsStore } from '@/stores/surveyors';
import type { Surveyor } from '@/types/Surveyor';
import { UserIcon, PhoneIcon, MapPinIcon, DocumentTextIcon } from '@heroicons/vue/24/outline';

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

const formData = ref<Partial<Surveyor>>({
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
});

const isEditMode = computed(() => !!props.surveyor);

const dialogHeader = computed(() =>
  isEditMode.value ? 'Edytuj Geodetę' : 'Dodaj Nowego Geodetę',
);

watch(
  () => props.visible,
  newVal => {
    if (newVal) {
      if (props.surveyor) {
        formData.value = {
          name: props.surveyor.name || '',
          lastName: props.surveyor.lastName || '',
          phone: props.surveyor.phone || '',
          phone2: props.surveyor.phone2 || '',
          email: props.surveyor.email || '',
          info: props.surveyor.info || '',
          address: props.surveyor.address
            ? {
              id: props.surveyor.address.id,
              commune: props.surveyor.address.commune || '',
              city: props.surveyor.address.city || '',
              street: props.surveyor.address.street || '',
              zip: props.surveyor.address.zip || '',
              coordinates: props.surveyor.address.coordinates
                ? {
                  id: props.surveyor.address.coordinates.id,
                  latitude: props.surveyor.address.coordinates.latitude || '',
                  longitude: props.surveyor.address.coordinates.longitude || '',
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
          status: props.surveyor.status ?? true,
        };
      } else {
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
        };
      }
      errors.value = {};
    }
  },
  { immediate: true },
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
    if (isEditMode.value && props.surveyor) {
      const updated = surveyorsStore.updateSurveyor(
        props.surveyor.id,
        formData.value as Partial<Omit<Surveyor, 'id' | 'createdAt'>>,
      );
      if (updated) {
        emit('surveyor-updated', updated);
      }
    } else {
      const newSurveyor = surveyorsStore.addSurveyor(
        formData.value as Omit<Surveyor, 'id' | 'createdAt' | 'updatedAt'>,
      );
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
</script>

<template>
  <Dialog v-model:visible="props.visible" modal :header="dialogHeader" :style="{ width: '800px' }" :pt="{
    root: { class: '!bg-surface-0 dark:!bg-surface-950' },
  }" @update:visible="emit('update:visible', $event)" @hide="handleClose">
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
            <InputText v-model="formData.name" :class="{ 'border-red-500': errors.name }"
              class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300" />
            <p v-if="errors.name" class="text-red-500 text-sm mt-1">{{ errors.name }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Nazwisko<span class="text-primary-400">*</span>
            </label>
            <InputText v-model="formData.lastName" :class="{ 'border-red-500': errors.lastName }"
              class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300" />
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
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Telefon<span class="text-primary-400">*</span>
            </label>
            <InputText v-model="formData.phone" :class="{ 'border-red-500': errors.phone }"
              class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300" />
            <p v-if="errors.phone" class="text-red-500 text-sm mt-1">{{ errors.phone }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Telefon 2
            </label>
            <InputText v-model="formData.phone2"
              class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Adres E-mail<span class="text-primary-400">*</span>
            </label>
            <InputText v-model="formData.email" type="email" :class="{ 'border-red-500': errors.email }"
              class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300" />
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
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Gmina</label>
            <InputText v-model="formData.address!.commune"
              class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300" />
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Miasto</label>
            <InputText v-model="formData.address!.city"
              class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300" />
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Ulica</label>
            <InputText v-model="formData.address!.street"
              class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300" />
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Kod pocztowy</label>
            <InputText v-model="formData.address!.zip"
              class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300" />
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
            <Textarea v-model="formData.info" rows="3"
              class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300" />
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
      <Button label="Anuluj" @click="handleClose" class="p-button-text" />
      <Button label="Zapisz" @click="handleSubmit" />
    </template>
  </Dialog>
</template>
