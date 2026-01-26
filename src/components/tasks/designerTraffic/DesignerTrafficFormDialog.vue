<script setup lang="ts">
  import { ref, watch, computed } from 'vue';
  import Dialog from 'primevue/dialog';
  import InputText from 'primevue/inputtext';
  import Textarea from 'primevue/textarea';
  import Checkbox from 'primevue/checkbox';
  import { useDesignerTrafficStore } from '@/stores/designerTraffic';
  import type { DesignerTraffic } from '@/types/Designer';
  import { UserIcon, PhoneIcon, DocumentTextIcon } from '@heroicons/vue/24/outline';
  import SecondaryButton from '@/components/SecondaryButton.vue';
  import PrimaryButton from '@/components/PrimaryButton.vue';

  const props = defineProps<{
    visible: boolean;
    designerTraffic?: DesignerTraffic | null;
  }>();

  const emit = defineEmits<{
    'update:visible': [value: boolean];
    close: [];
    'designer-traffic-added': [designer: DesignerTraffic];
    'designer-traffic-updated': [designer: DesignerTraffic];
  }>();

  const designerTrafficStore = useDesignerTrafficStore();

  const formData = ref<Partial<DesignerTraffic>>({
    name: '',
    lastName: '',
    phone: '',
    phone2: '',
    email: '',
    info: '',
    status: true,
  });

  const isEditMode = computed(() => !!props.designerTraffic);

  const dialogHeader = computed(() =>
    isEditMode.value ? 'Edytuj Projektanta ruchu' : 'Dodaj Nowego Projektanta ruchu'
  );

  watch(
    () => props.visible,
    newVal => {
      if (newVal) {
        if (props.designerTraffic) {
          formData.value = {
            name: props.designerTraffic.name || '',
            lastName: props.designerTraffic.lastName || '',
            phone: props.designerTraffic.phone || '',
            phone2: props.designerTraffic.phone2 || '',
            email: props.designerTraffic.email || '',
            info: props.designerTraffic.info || '',
            status: props.designerTraffic.status ?? true,
          };
        } else {
          formData.value = {
            name: '',
            lastName: '',
            phone: '',
            phone2: '',
            email: '',
            info: '',
            status: true,
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
      if (isEditMode.value && props.designerTraffic) {
        const updated = designerTrafficStore.updateDesignerTraffic(
          props.designerTraffic.id,
          formData.value as Partial<Omit<DesignerTraffic, 'id' | 'createdAt'>>
        );
        if (updated) {
          emit('designer-traffic-updated', updated);
        }
      } else {
        const created = designerTrafficStore.addDesignerTraffic(
          formData.value as Omit<DesignerTraffic, 'id' | 'createdAt' | 'updatedAt'>
        );
        emit('designer-traffic-added', created);
      }

      emit('update:visible', false);
      emit('close');
    } catch (error) {
      console.error('Błąd podczas zapisywania projektanta ruchu:', error);
    }
  };

  const handleClose = () => {
    emit('update:visible', false);
    emit('close');
  };
</script>

<template>
  <Dialog
    v-model:visible="props.visible"
    modal
    :header="dialogHeader"
    :style="{ width: '700px' }"
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
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Telefon<span class="text-primary-400">*</span>
            </label>
            <InputText
              v-model="formData.phone"
              :class="{ 'border-red-500': errors.phone }"
              class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300"
            />
            <p v-if="errors.phone" class="text-red-500 text-sm mt-1">{{ errors.phone }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"> Telefon 2 </label>
            <InputText
              v-model="formData.phone2"
              class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300"
            />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Adres E-mail<span class="text-primary-400">*</span>
            </label>
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

      <!-- DODATKOWE INFORMACJE -->
      <div class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
        <h2 class="text-lg font-semibold text-surface-700 dark:text-surface-300 mb-4 flex items-center gap-2">
          <DocumentTextIcon class="w-5 h-5 text-primary-400" />
          Dodatkowe Informacje
        </h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"> Uwagi </label>
            <Textarea
              v-model="formData.info"
              rows="3"
              class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300"
            />
          </div>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <Checkbox v-model="formData.status" :binary="true" inputId="status-traffic" />
              <label for="status-traffic" class="text-surface-700 dark:text-surface-300">Aktywny</label>
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
