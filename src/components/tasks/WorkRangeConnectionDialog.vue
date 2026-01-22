<script setup lang="ts">
  import { ref, watch, computed } from 'vue';
  import Dialog from 'primevue/dialog';
  import Select from 'primevue/select';
  import Textarea from 'primevue/textarea';
  import type { WorkRangeConnection, GasPressureType } from '@/types/WorkRange';
  import SecondaryButton from '@/components/SecondaryButton.vue';
  import PrimaryButton from '@/components/PrimaryButton.vue';

  const props = defineProps<{
    visible: boolean;
    item: WorkRangeConnection | null;
    isReadonly: boolean;
  }>();

  const emit = defineEmits<{
    'update:visible': [value: boolean];
    save: [itemData: Partial<WorkRangeConnection>];
  }>();

  // Opcje dla Selectów
  const pressureOptions: GasPressureType[] = [
    { name: 'MEDIUM', viewValue: 'średnie', displayValue: 'średnie' },
    { name: 'LOW', viewValue: 'niskie', displayValue: 'niskie' },
  ];

  const diameterOptions = [
    25, 32, 40, 50, 63, 65, 75, 80, 90, 100, 110, 125, 140, 150, 160, 180, 200, 225, 250, 280, 315, 350, 400, 450, 500,
  ];

  const materialOptions = ['PE', 'stal'];

  // Lokalne refs dla formularza
  const pressure = ref<GasPressureType | null>(null);
  const diameter = ref<number | null>(null);
  const material = ref<string | null>(null);
  const info = ref<string>('');

  // Czy to tryb edycji
  const isEditMode = computed(() => props.item !== null);

  // Inicjalizacja formularza
  const initializeForm = () => {
    if (props.item) {
      pressure.value = props.item.pressure || null;
      diameter.value = props.item.diameter || null;
      material.value = props.item.material || null;
      info.value = props.item.info || '';
    } else {
      pressure.value = null;
      diameter.value = null;
      material.value = null;
      info.value = '';
    }
  };

  // Watch na visible - inicjalizuj formularz przy otwarciu
  watch(
    () => props.visible,
    newValue => {
      if (newValue) {
        initializeForm();
      }
    }
  );

  // Watch na item - aktualizuj formularz gdy item się zmieni
  watch(
    () => props.item,
    () => {
      if (props.visible) {
        initializeForm();
      }
    },
    { deep: true }
  );

  // Zapis formularza
  const handleSave = () => {
    const itemData: Partial<WorkRangeConnection> = {
      pressure: pressure.value || undefined,
      diameter: diameter.value || undefined,
      material: material.value || undefined,
      info: info.value,
    };

    emit('save', itemData);
    emit('update:visible', false);
  };

  // Anulowanie
  const handleCancel = () => {
    emit('update:visible', false);
  };
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="val => emit('update:visible', val)"
    modal
    :closable="true"
    :draggable="false"
    :style="{ width: '40rem' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
    :header="isEditMode ? 'Edytuj włączenie' : 'Dodaj włączenie'"
    class="p-fluid"
  >
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <!-- Lewa kolumna - Parametry gazociągu -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Istniejący gazociąg:
            </label>
          </div>

          <!-- CIŚNIENIE -->
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"> ciśnienie: </label>
            <Select
              v-model="pressure"
              :options="pressureOptions"
              optionLabel="displayValue"
              placeholder="wybierz..."
              class="w-full"
              :disabled="isReadonly"
              :showClear="true"
            />
          </div>

          <!-- ŚREDNICA NOMINALNA -->
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              średnica nominalna:
            </label>
            <Select
              v-model="diameter"
              :options="diameterOptions"
              placeholder="wybierz..."
              class="w-full"
              :disabled="isReadonly"
              :showClear="true"
            />
          </div>

          <!-- MATERIAŁ -->
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"> Materiał: </label>
            <Select
              v-model="material"
              :options="materialOptions"
              placeholder="wybierz..."
              class="w-full"
              :disabled="isReadonly"
              :showClear="true"
            />
          </div>
        </div>

        <!-- Prawa kolumna - Uwagi -->
        <div class="space-y-4">
          <!-- UWAGI -->
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"> Uwagi: </label>
            <Textarea v-model="info" placeholder="Uwagi" rows="8" class="w-full" :disabled="isReadonly" />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <SecondaryButton type="button" @click="handleCancel" text="Anuluj" size="lg" :disabled="isReadonly" />
        <PrimaryButton
          type="button"
          @click="handleSave"
          text="Zapisz"
          size="lg"
          :disabled="isReadonly"
          icon="pi pi-check"
          iconPos="left"
        />
      </div>
    </template>
  </Dialog>
</template>
