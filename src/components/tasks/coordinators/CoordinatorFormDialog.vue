<script setup lang="ts">
  import { ref, watch, computed } from 'vue';
  import Dialog from 'primevue/dialog';
  import InputText from 'primevue/inputtext';
  import Textarea from 'primevue/textarea';
  import Checkbox from 'primevue/checkbox';
  import { useCoordinatorsStore } from '@/stores/coordinators';
  import type { Coordinator } from '@/types/Coordinator';
  import { UserIcon, PhoneIcon, DocumentTextIcon, EnvelopeIcon, TrashIcon } from '@heroicons/vue/24/outline';
  import SecondaryButton from '@/components/SecondaryButton.vue';
  import PrimaryButton from '@/components/PrimaryButton.vue';

  const props = withDefaults(
    defineProps<{
      visible?: boolean;
      coordinator?: Coordinator | null;
    }>(),
    {
      visible: true,
    }
  );

  const emit = defineEmits<{
    'update:visible': [value: boolean];
    close: [];
    'coordinator-added': [coordinator: Coordinator];
    'coordinator-updated': [coordinator: Coordinator];
  }>();

  const coordinatorsStore = useCoordinatorsStore();

  // Kompatybilność wsteczna: jeśli visible nie jest przekazany jako prop, używamy wewnętrznego ref
  const internalVisible = ref(true);
  const isVisible = computed(() => (props.visible !== undefined ? props.visible : internalVisible.value));

  const defaultFormData = (): Partial<Coordinator> => ({
    name: '',
    lastName: '',
    phones: [],
    emails: [],
    info: '',
    status: true,
  });

  const formData = ref<Partial<Coordinator>>(defaultFormData());

  const isEditMode = computed(() => !!props.coordinator);

  const dialogHeader = computed(() => (isEditMode.value ? 'Edytuj Koordynatora' : 'Dodaj Nowego Koordynatora'));

  watch(
    () => isVisible.value,
    newVal => {
      if (newVal) {
        if (props.coordinator) {
          formData.value = {
            ...defaultFormData(),
            ...props.coordinator,
            phones: props.coordinator.phones ? [...props.coordinator.phones] : [],
            emails: props.coordinator.emails ? [...props.coordinator.emails] : [],
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

      if (isEditMode.value && props.coordinator) {
        const updated = coordinatorsStore.updateCoordinator(
          props.coordinator.id,
          cleanedData as Partial<Omit<Coordinator, 'id' | 'createdAt'>>
        );
        if (updated) {
          emit('coordinator-updated', updated);
        }
      } else {
        const newCoordinator = coordinatorsStore.addCoordinator(
          cleanedData as Omit<Coordinator, 'id' | 'createdAt' | 'updatedAt'>
        );
        emit('coordinator-added', newCoordinator);
      }

      if (props.visible !== undefined) {
        emit('update:visible', false);
      } else {
        internalVisible.value = false;
      }
      emit('close');
    } catch (error) {
      console.error('Błąd podczas zapisywania koordynatora:', error);
    }
  };

  const handleClose = () => {
    if (props.visible !== undefined) {
      emit('update:visible', false);
    } else {
      internalVisible.value = false;
    }
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
    v-model:visible="isVisible"
    modal
    :header="dialogHeader"
    :style="{ width: '700px' }"
    :pt="{
      root: { class: '!bg-surface-0 dark:!bg-surface-950' },
    }"
    @update:visible="
      val => {
        if (props.visible !== undefined) emit('update:visible', val);
        else internalVisible = val;
      }
    "
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
              <Checkbox v-model="formData.status" :binary="true" inputId="status-coordinator" />
              <label for="status-coordinator" class="text-surface-700 dark:text-surface-300">Aktywny</label>
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
