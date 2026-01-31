<script setup lang="ts">
  import { ref, watch, computed } from 'vue';
  import Dialog from 'primevue/dialog';
  import InputText from 'primevue/inputtext';
  import Textarea from 'primevue/textarea';
  import DatePicker from 'primevue/datepicker';
  import Select from 'primevue/select';
  import Checkbox from 'primevue/checkbox';
  import InputNumber from 'primevue/inputnumber';
  import { useScheduleTasksStore } from '@/stores/scheduleTasks';
  import { useBrigadesStore } from '@/stores/brigades';
  import { useGasConnectionsStore } from '@/stores/gasConnections';
  import type { ScheduleTask, ScheduleTaskStatus } from '@/types/ScheduleTask';
  import { SCHEDULE_TASK_STATUS_LABELS } from '@/types/ScheduleTask';
  import type { TaskType } from '@/types/TaskType';
  import { MapPinIcon, DocumentTextIcon, ClockIcon } from '@heroicons/vue/24/outline';
  import LocationMap from '@/components/maps/LocationMap.vue';
  import SecondaryButton from '@/components/SecondaryButton.vue';
  import PrimaryButton from '@/components/PrimaryButton.vue';

  const props = defineProps<{
    visible: boolean;
    scheduleTask?: ScheduleTask | null;
    initialReferenceId?: number; // ID przyłącza do wstępnego wypełnienia
    initialReferenceType?: TaskType; // Typ zadania do wstępnego wypełnienia
    initialDate?: Date; // Domyślna data przy dodawaniu z kalendarza
  }>();

  const emit = defineEmits<{
    'update:visible': [value: boolean];
    close: [];
    'schedule-task-added': [task: ScheduleTask];
    'schedule-task-updated': [task: ScheduleTask];
  }>();

  const scheduleTasksStore = useScheduleTasksStore();
  const brigadesStore = useBrigadesStore();
  const gasConnectionsStore = useGasConnectionsStore();

  // Opcje dla Select
  const brigadeOptions = computed(() => {
    return brigadesStore.getAllBrigades({ isActive: true }).map(brigade => ({
      label: brigade.name,
      value: brigade.id,
    }));
  });

  const defaultFormData = (): Partial<ScheduleTask> => ({
    referenceId: props.initialReferenceId || 0,
    referenceType: props.initialReferenceType,
    brigadeId: 0,
    title: '',
    status: 'scheduled',
    startDate: new Date(),
    endDate: new Date(),
    notes: '',
    latitude: undefined,
    longitude: undefined,
  });

  const statusOptions = computed(() =>
    (['scheduled', 'active', 'done', 'cancelled', 'postponed'] as ScheduleTaskStatus[]).map(value => ({
      label: SCHEDULE_TASK_STATUS_LABELS[value],
      value,
    }))
  );

  const formData = ref<Partial<ScheduleTask>>(defaultFormData());
  const mapEditable = ref(false);

  const isEditMode = computed(() => !!props.scheduleTask);

  const dialogHeader = computed(() => (isEditMode.value ? 'Edytuj Zadanie' : 'Dodaj Nowe Zadanie'));

  watch(
    () => props.visible,
    async newVal => {
      if (newVal) {
        if (props.scheduleTask) {
          formData.value = {
            ...defaultFormData(),
            ...props.scheduleTask,
            startDate:
              props.scheduleTask.startDate instanceof Date
                ? props.scheduleTask.startDate
                : new Date(props.scheduleTask.startDate),
            endDate:
              props.scheduleTask.endDate instanceof Date
                ? props.scheduleTask.endDate
                : new Date(props.scheduleTask.endDate),
          };
        } else {
          const startDate = props.initialDate ? new Date(props.initialDate) : new Date();
          const endDate = props.initialDate
            ? new Date(props.initialDate.getTime() + 60 * 60 * 1000)
            : new Date(startDate.getTime() + 60 * 60 * 1000);
          formData.value = {
            ...defaultFormData(),
            referenceId: props.initialReferenceId || 0,
            startDate,
            endDate,
          };

          // Jeśli podano initialReferenceId, spróbuj pobrać współrzędne z powiązanego GasConnection
          const refId = props.initialReferenceId || formData.value.referenceId;
          if (refId) {
            try {
              const gc = gasConnectionsStore.getGasConnection(refId);
              if (gc && gc.address && gc.address.coordinates) {
                const latRaw = gc.address.coordinates.latitude;
                const lonRaw = gc.address.coordinates.longitude;
                const lat = typeof latRaw === 'string' ? parseFloat(latRaw) : Number(latRaw);
                const lon = typeof lonRaw === 'string' ? parseFloat(lonRaw) : Number(lonRaw);
                if (!isNaN(lat) && !isNaN(lon)) {
                  formData.value.latitude = lat;
                  formData.value.longitude = lon;
                }
              }
            } catch (err) {
              // Nie przerywamy działania formularza, tylko logujemy błąd
              console.warn('Nie udało się pobrać współrzędnych przyłącza:', err);
            }
          }
        }
        errors.value = {};
      }
    },
    { immediate: true }
  );

  // Aktualizacja daty zakończenia gdy zmienia się data rozpoczęcia
  watch(
    () => formData.value.startDate,
    newStartDate => {
      if (newStartDate && formData.value.endDate) {
        // Jeśli data zakończenia jest wcześniejsza niż rozpoczęcia, ustaw ją na tę samą
        if (formData.value.endDate < newStartDate) {
          formData.value.endDate = new Date(newStartDate);
        }
      }
    }
  );

  const errors = ref<Record<string, string>>({});

  const validate = (): boolean => {
    errors.value = {};

    if (!formData.value.title?.trim()) {
      errors.value.title = 'Tytuł jest wymagany';
    }

    if (!formData.value.brigadeId || formData.value.brigadeId === 0) {
      errors.value.brigadeId = 'Brygada jest wymagana';
    }

    if (!formData.value.startDate) {
      errors.value.startDate = 'Data rozpoczęcia jest wymagana';
    }

    if (!formData.value.endDate) {
      errors.value.endDate = 'Data zakończenia jest wymagana';
    }

    if (formData.value.startDate && formData.value.endDate) {
      if (formData.value.endDate < formData.value.startDate) {
        errors.value.endDate = 'Data zakończenia nie może być wcześniejsza niż data rozpoczęcia';
      }
    }

    return Object.keys(errors.value).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    try {
      const cleanedData = {
        ...formData.value,
        referenceId: formData.value.referenceId || 0,
        referenceType: formData.value.referenceType || undefined,
        brigadeId: formData.value.brigadeId || 0,
        title: formData.value.title || '',
        status: formData.value.status ?? 'scheduled',
        startDate: formData.value.startDate!,
        endDate: formData.value.endDate!,
        notes: formData.value.notes || '',
        latitude: formData.value.latitude,
        longitude: formData.value.longitude,
      };

      if (isEditMode.value && props.scheduleTask) {
        const updated = scheduleTasksStore.updateTask(
          props.scheduleTask.id,
          cleanedData as Partial<Omit<ScheduleTask, 'id' | 'createdAt'>>
        );
        if (updated) {
          emit('schedule-task-updated', updated);
        }
      } else {
        const created = scheduleTasksStore.addTask(cleanedData as Omit<ScheduleTask, 'id' | 'createdAt' | 'updatedAt'>);
        emit('schedule-task-added', created);
      }

      emit('update:visible', false);
      emit('close');
    } catch (error) {
      console.error('Błąd podczas zapisywania zadania:', error);
    }
  };

  const handleClose = () => {
    emit('update:visible', false);
    emit('close');
  };

  const onMapPositionUpdate = (payload: { lat: number; lng: number }) => {
    formData.value.latitude = payload.lat;
    formData.value.longitude = payload.lng;
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
          <DocumentTextIcon class="w-5 h-5 text-primary-400" />
          Informacje Podstawowe
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Tytuł zadania<span class="text-primary-400">*</span>
            </label>
            <InputText
              v-model="formData.title"
              :class="{ 'border-red-500': errors.title }"
              class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300"
              placeholder="np. Budowa przyłącza, Włączenie, Czyszczenie..."
            />
            <p v-if="errors.title" class="text-red-500 text-sm mt-1">{{ errors.title }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Brygada<span class="text-primary-400">*</span>
            </label>
            <Select
              v-model="formData.brigadeId"
              :options="brigadeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Wybierz brygadę"
              :class="{ 'border-red-500': errors.brigadeId }"
              class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300"
            />
            <p v-if="errors.brigadeId" class="text-red-500 text-sm mt-1">{{ errors.brigadeId }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"> Status </label>
            <Select
              v-model="formData.status"
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Wybierz status"
              class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300"
            />
          </div>
        </div>
      </div>

      <!-- TERMINY -->
      <div class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
        <h2 class="text-lg font-semibold text-surface-700 dark:text-surface-300 mb-4 flex items-center gap-2">
          <ClockIcon class="w-5 h-5 text-primary-400" />
          Terminy
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Data/godzina rozpoczęcia<span class="text-primary-400">*</span>
            </label>
            <DatePicker
              v-model="formData.startDate"
              showTime
              hourFormat="24"
              dateFormat="dd.mm.yy"
              :class="{ 'border-red-500': errors.startDate }"
              class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300"
              showIcon
            />
            <p v-if="errors.startDate" class="text-red-500 text-sm mt-1">{{ errors.startDate }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Data/godzina zakończenia<span class="text-primary-400">*</span>
            </label>
            <DatePicker
              v-model="formData.endDate"
              showTime
              hourFormat="24"
              dateFormat="dd.mm.yy"
              :minDate="formData.startDate"
              :class="{ 'border-red-500': errors.endDate }"
              class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300"
              showIcon
            />
            <p v-if="errors.endDate" class="text-red-500 text-sm mt-1">{{ errors.endDate }}</p>
          </div>
        </div>
      </div>

      <!-- LOKALIZACJA -->
      <div class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
        <h2 class="text-lg font-semibold text-surface-700 dark:text-surface-300 mb-4 flex items-center gap-2">
          <MapPinIcon class="w-5 h-5 text-primary-400" />
          Lokalizacja (Współrzędne mapy Leaflet)
        </h2>
        <div class="space-y-4 mb-4">
          <div class="mb-2 flex items-center gap-3">
            <Checkbox v-model="mapEditable" :binary="true" inputId="map-editable" />
            <label for="map-editable" class="text-sm text-surface-700 dark:text-surface-300">Włącz edycję mapy</label>
          </div>
          <div v-if="formData.latitude !== undefined && formData.longitude !== undefined">
            <LocationMap
              :latitude="formData.latitude"
              :longitude="formData.longitude"
              :draggable="true"
              :readonly="!mapEditable"
              @update:position="onMapPositionUpdate"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Szerokość geograficzna (latitude)
              </label>
              <InputNumber
                v-model="formData.latitude"
                :minFractionDigits="6"
                :maxFractionDigits="6"
                :min="-90"
                :max="90"
                placeholder="np. 52.229676"
                class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Długość geograficzna (longitude)
              </label>
              <InputNumber
                v-model="formData.longitude"
                :minFractionDigits="6"
                :maxFractionDigits="6"
                :min="-180"
                :max="180"
                placeholder="np. 21.012229"
                class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- NOTATKI -->
      <div class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
        <h2 class="text-lg font-semibold text-surface-700 dark:text-surface-300 mb-4 flex items-center gap-2">
          <DocumentTextIcon class="w-5 h-5 text-primary-400" />
          Notatki/Opis
        </h2>
        <div>
          <Textarea
            v-model="formData.notes"
            rows="4"
            class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300"
            placeholder="Dodatkowe informacje o zadaniu..."
          />
        </div>
      </div>
    </form>

    <template #footer>
      <SecondaryButton type="button" @click="handleClose" text="Anuluj" size="lg" />
      <PrimaryButton type="button" @click="handleSubmit" text="Zapisz" size="lg" />
    </template>
  </Dialog>
</template>
