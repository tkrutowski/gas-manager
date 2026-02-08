<script setup lang="ts">
  import { ref, watch, computed } from 'vue';
  import Dialog from 'primevue/dialog';
  import InputText from 'primevue/inputtext';
  import Textarea from 'primevue/textarea';
  import Checkbox from 'primevue/checkbox';
  import { useBrigadesStore } from '@/stores/brigades';
  import type { Brigade } from '@/types/Brigade';
  import { BuildingOffice2Icon, DocumentTextIcon } from '@heroicons/vue/24/outline';
  import SecondaryButton from '@/components/SecondaryButton.vue';
  import PrimaryButton from '@/components/PrimaryButton.vue';

  const props = defineProps<{
    visible: boolean;
    brigade?: Brigade | null;
  }>();

  const emit = defineEmits<{
    'update:visible': [value: boolean];
    close: [];
    'brigade-added': [brigade: Brigade];
    'brigade-updated': [brigade: Brigade];
  }>();

  const brigadesStore = useBrigadesStore();

  const defaultFormData = (): Partial<Brigade> => ({
    name: '',
    isActive: true,
    info: '',
  });

  const formData = ref<Partial<Brigade>>(defaultFormData());

  const isEditMode = computed(() => !!props.brigade);

  const dialogHeader = computed(() => (isEditMode.value ? 'Edytuj brygadę' : 'Dodaj nową brygadę'));

  watch(
    () => props.visible,
    newVal => {
      if (newVal) {
        if (props.brigade) {
          formData.value = {
            ...defaultFormData(),
            ...props.brigade,
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
      errors.value.name = 'Nazwa jest wymagana';
    }

    return Object.keys(errors.value).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    try {
      const data = {
        name: formData.value.name!.trim(),
        isActive: formData.value.isActive ?? true,
        info: formData.value.info?.trim() || undefined,
      };

      if (isEditMode.value && props.brigade) {
        const updated = brigadesStore.updateBrigade(props.brigade.id, data);
        if (updated) {
          emit('brigade-updated', updated);
        }
      } else {
        const newBrigade = brigadesStore.addBrigade(data);
        emit('brigade-added', newBrigade);
      }

      emit('update:visible', false);
      emit('close');
    } catch (error) {
      console.error('Błąd podczas zapisywania brygady:', error);
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
    :style="{ width: '500px' }"
    :pt="{
      root: { class: '!bg-surface-0 dark:!bg-surface-950' },
    }"
    @update:visible="emit('update:visible', $event)"
    @hide="handleClose"
  >
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
        <h2 class="text-lg font-semibold text-surface-700 dark:text-surface-300 mb-4 flex items-center gap-2">
          <BuildingOffice2Icon class="w-5 h-5 text-primary-400" />
          Informacje o brygadzie
        </h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Nazwa<span class="text-primary-400">*</span>
            </label>
            <InputText
              v-model="formData.name"
              :class="{ 'border-red-500': errors.name }"
              class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300"
            />
            <p v-if="errors.name" class="text-red-500 text-sm mt-1">{{ errors.name }}</p>
          </div>
      
          <div>
            <label class="flex items-center gap-2 text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              <DocumentTextIcon class="w-4 h-4 text-primary-400" />
              Informacje dodatkowe
            </label>
            <Textarea
              v-model="formData.info"
              rows="3"
              class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300"
              placeholder="Uwagi, opis brygady..."
            />
          </div>

          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <Checkbox v-model="formData.isActive" :binary="true" inputId="status-brigade" />
              <label for="status-brigade" class="text-surface-700 dark:text-surface-300">Aktywna</label>
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
