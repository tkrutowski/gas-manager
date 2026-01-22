<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { useConfirm } from 'primevue/useconfirm';
  import type { GasConnection } from '@/types/GasConnection';
  import type { WorkRangeGasConnection, WorkRangeGasStation, WorkRangeConnection } from '@/types/WorkRange';
  import Card from 'primevue/card';
  import Button from 'primevue/button';
  import WorkRangeGasConnectionDialog from '@/components/tasks/WorkRangeGasConnectionDialog.vue';
  import WorkRangeGasStationDialog from '@/components/tasks/WorkRangeGasStationDialog.vue';
  import WorkRangeConnectionDialog from '@/components/tasks/WorkRangeConnectionDialog.vue';
  import { UtilsService } from '@/utils/formatService';

  interface Props {
    gasConnection: GasConnection | undefined;
    isReadonly: boolean;
  }

  const props = defineProps<Props>();
  const confirm = useConfirm();

  // Dialog states - WorkRangeGasConnection
  const gasConnectionDialogVisible = ref(false);
  const editingGasConnection = ref<WorkRangeGasConnection | null>(null);

  // Dialog states - WorkRangeGasStation
  const gasStationDialogVisible = ref(false);
  const editingGasStation = ref<WorkRangeGasStation | null>(null);

  // Dialog states - WorkRangeConnection
  const connectionDialogVisible = ref(false);
  const editingConnection = ref<WorkRangeConnection | null>(null);

  // Lists
  const workRangeGasConnections = computed(() => props.gasConnection?.workRangeGasConnections || []);
  const workRangeGasStations = computed(() => props.gasConnection?.workRangeGasStations || []);
  const workRangeConnection = computed(() => props.gasConnection?.workRangeConnection);

  // ============ WorkRangeGasConnection Handlers ============

  const handleAddGasConnection = () => {
    editingGasConnection.value = null;
    gasConnectionDialogVisible.value = true;
  };

  const handleEditGasConnection = (item: WorkRangeGasConnection) => {
    editingGasConnection.value = item;
    gasConnectionDialogVisible.value = true;
  };

  const handleDeleteGasConnection = (event: Event, item: WorkRangeGasConnection) => {
    if (!props.gasConnection) return;

    confirm.require({
      target: event.currentTarget as HTMLElement,
      message: 'Czy na pewno chcesz usunąć to przyłącze?',
      icon: 'pi pi-exclamation-triangle',
      rejectProps: {
        label: 'Anuluj',
        severity: 'secondary',
        outlined: true,
      },
      acceptProps: {
        label: 'Usuń',
        severity: 'danger',
      },
      accept: () => {
        const index = props.gasConnection!.workRangeGasConnections.findIndex(p => p.id === item.id);
        if (index !== -1) {
          props.gasConnection!.workRangeGasConnections.splice(index, 1);
        }
      },
    });
  };

  const handleSaveGasConnection = (itemData: Partial<WorkRangeGasConnection>) => {
    if (!props.gasConnection) return;

    if (editingGasConnection.value) {
      // Edycja istniejącego
      const index = props.gasConnection.workRangeGasConnections.findIndex(p => p.id === editingGasConnection.value!.id);
      if (index !== -1) {
        Object.assign(props.gasConnection.workRangeGasConnections[index], itemData);
      }
    } else {
      // Dodanie nowego
      const newItem: WorkRangeGasConnection = {
        id: Date.now(),
        idTask: props.gasConnection.id,
        taskType: { name: 'GAS_CONNECTION', viewName: 'przylacze' },
        info: itemData.info || '',
        diameter: itemData.diameter || 0,
        lengthWar: itemData.lengthWar || 0,
        material: itemData.material || '',
        sdr: itemData.sdr || '',
        lengthProj: itemData.lengthProj || 0,
        gasCabinetProviderType: itemData.gasCabinetProviderType || { name: 'UNKNOWN', viewValue: 'Nieznane' },
        gasCabinetPickupDate: itemData.gasCabinetPickupDate,
      };
      props.gasConnection.workRangeGasConnections.push(newItem);
    }
  };

  // ============ WorkRangeGasStation Handlers ============

  const handleAddGasStation = () => {
    editingGasStation.value = null;
    gasStationDialogVisible.value = true;
  };

  const handleEditGasStation = (item: WorkRangeGasStation) => {
    editingGasStation.value = item;
    gasStationDialogVisible.value = true;
  };

  const handleDeleteGasStation = (event: Event, item: WorkRangeGasStation) => {
    if (!props.gasConnection) return;

    confirm.require({
      target: event.currentTarget as HTMLElement,
      message: 'Czy na pewno chcesz usunąć ten punkt/stację?',
      icon: 'pi pi-exclamation-triangle',
      rejectProps: {
        label: 'Anuluj',
        severity: 'secondary',
        outlined: true,
      },
      acceptProps: {
        label: 'Usuń',
        severity: 'danger',
      },
      accept: () => {
        const index = props.gasConnection!.workRangeGasStations.findIndex(p => p.id === item.id);
        if (index !== -1) {
          props.gasConnection!.workRangeGasStations.splice(index, 1);
        }
      },
    });
  };

  const handleSaveGasStation = (itemData: Partial<WorkRangeGasStation>) => {
    if (!props.gasConnection) return;

    if (editingGasStation.value) {
      // Edycja istniejącego
      const index = props.gasConnection.workRangeGasStations.findIndex(p => p.id === editingGasStation.value!.id);
      if (index !== -1) {
        Object.assign(props.gasConnection.workRangeGasStations[index], itemData);
      }
    } else {
      // Dodanie nowego
      const newItem: WorkRangeGasStation = {
        id: Date.now(),
        idTask: props.gasConnection.id,
        taskType: { name: 'GAS_CONNECTION', viewName: 'przylacze' },
        info: itemData.info || '',
        capacity: itemData.capacity || 0,
        amount: itemData.amount || 0,
        stationType: itemData.stationType || { name: 'REDUCTION', viewValue: 'redukcyjna' },
      };
      props.gasConnection.workRangeGasStations.push(newItem);
    }
  };

  // ============ WorkRangeConnection Handlers ============

  const handleEditConnection = () => {
    editingConnection.value = workRangeConnection.value || null;
    connectionDialogVisible.value = true;
  };

  const handleDeleteConnection = (event: Event) => {
    if (!props.gasConnection || !workRangeConnection.value) return;

    confirm.require({
      target: event.currentTarget as HTMLElement,
      message: 'Czy na pewno chcesz usunąć włączenie?',
      icon: 'pi pi-exclamation-triangle',
      rejectProps: {
        label: 'Anuluj',
        severity: 'secondary',
        outlined: true,
      },
      acceptProps: {
        label: 'Usuń',
        severity: 'danger',
      },
      accept: () => {
        if (props.gasConnection) {
          props.gasConnection.workRangeConnection = {
            id: 0,
            idTask: props.gasConnection.id,
            taskType: undefined,
            info: '',
            diameter: undefined,
            material: undefined,
            pressure: undefined,
          };
        }
      },
    });
  };

  const handleSaveConnection = (itemData: Partial<WorkRangeConnection>) => {
    if (!props.gasConnection) return;

    if (props.gasConnection.workRangeConnection) {
      Object.assign(props.gasConnection.workRangeConnection, itemData);
    } else {
      props.gasConnection.workRangeConnection = {
        id: Date.now(),
        idTask: props.gasConnection.id,
        taskType: { name: 'GAS_CONNECTION', viewName: 'przylacze' },
        info: itemData.info || '',
        diameter: itemData.diameter,
        material: itemData.material,
        pressure: itemData.pressure,
      };
    }
  };
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- ZAKRES - PRZYŁĄCZE -->
    <Card class="border border-surface-200 dark:border-surface-700 overflow-hidden">
      <template #header>
        <div
          class="flex items-center justify-between px-4 py-3 bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700"
        >
          <div class="flex items-center gap-4">
            <div>
              <h3 class="text-lg font-bold uppercase text-surface-700 dark:text-surface-300 m-0">ZAKRES - PRZYŁĄCZE</h3>
            </div>
          </div>
        </div>
      </template>

      <template #content>
        <div class="space-y-4">
          <div
            v-for="item in workRangeGasConnections"
            :key="item.id"
            class="p-4 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900"
          >
            <div class="grid grid-cols-6 gap-3">
              <!-- ŚREDNICA -->
              <div class="mt-3">
                <label class="block text-xs uppercase text-surface-600 dark:text-surface-400 mb-1"> ŚREDNICA </label>
                <p class="text-sm text-surface-700 dark:text-surface-300 m-0">
                  {{ item.diameter || '---' }}
                </p>
              </div>

              <!-- DŁUGOŚĆ Z WAR. -->
              <div class="mt-3">
                <label class="block text-xs uppercase text-surface-600 dark:text-surface-400 mb-1">
                  DŁUGOŚĆ Z WAR. (M)
                </label>
                <p class="text-sm text-surface-700 dark:text-surface-300 m-0">
                  {{ item.lengthWar || '---' }}
                </p>
              </div>

              <!-- DŁUGOŚĆ Z PROJ. -->
              <div class="mt-3">
                <label class="block text-xs uppercase text-surface-600 dark:text-surface-400 mb-1">
                  DŁUGOŚĆ Z PROJ. (M)
                </label>
                <p class="text-sm text-surface-700 dark:text-surface-300 m-0">
                  {{ item.lengthProj || '---' }}
                </p>
              </div>
              <!-- SZAFKĘ DOSTARCZA -->

              <div class="mt-3">
                <label class="block text-xs uppercase text-surface-600 dark:text-surface-400 mb-1">
                  SZAFKĘ DOSTARCZA
                </label>
                <p class="text-sm text-surface-700 dark:text-surface-300 m-0">
                  {{ item.gasCabinetProviderType?.viewValue || '---' }}
                </p>
              </div>

              <!-- DATA POBRANIA SZAFKI -->
              <div class="mt-3">
                <label class="block text-xs uppercase text-surface-600 dark:text-surface-400 mb-1">
                  DATA POBRANIA SZAFKI
                </label>
                <div class="flex items-center gap-2">
                  <i class="pi pi-calendar text-surface-400 text-sm"></i>
                  <p class="text-sm text-surface-700 dark:text-surface-300 m-0">
                    {{ UtilsService.formatDateToString(item.gasCabinetPickupDate) || '---' }}
                  </p>
                </div>
              </div>

              <!-- PRZYCISKI AKCJI -->
              <div class="flex flex-col items-end gap-2 mt-3">
                <div class="flex">
                  <Button
                    icon="pi pi-pencil"
                    severity="secondary"
                    text
                    rounded
                    :disabled="isReadonly"
                    @click="handleEditGasConnection(item)"
                    title="Edytuj przyłącze"
                  />
                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    rounded
                    :disabled="isReadonly"
                    @click="event => handleDeleteGasConnection(event, item)"
                    title="Usuń przyłącze"
                  />
                </div>
              </div>
            </div>

            <!-- DODATKOWE INFORMACJE -->
            <div class="grid grid-cols-6 gap-3 mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
              <!-- INNE INFO -->
              <div class="col-span-4">
                <label class="block text-xs uppercase text-surface-600 dark:text-surface-400 mb-1"> INNE INFO </label>
                <p class="text-sm text-surface-700 dark:text-surface-300 m-0">
                  {{ item.info || 'Brak danych' }}
                </p>
              </div>
            </div>
          </div>

          <div
            v-if="workRangeGasConnections.length === 0"
            class="p-8 text-center text-surface-600 dark:text-surface-400"
          >
            <p>Brak przyłączy. Kliknij "Dodaj przyłącze" aby dodać pierwsze przyłącze.</p>
          </div>
        </div>
      </template>

      <template #footer>
        <div
          class="flex items-center justify-end px-4 py-3 bg-surface-50 dark:bg-surface-900 border-t border-surface-200 dark:border-surface-700"
        >
          <Button
            label="Dodaj zakres przyłącza"
            icon="pi pi-plus"
            :disabled="isReadonly"
            @click="handleAddGasConnection"
          />
        </div>
      </template>
    </Card>

    <!-- PUNKT/STACJA -->
    <Card class="border border-surface-200 dark:border-surface-700 overflow-hidden">
      <template #header>
        <div
          class="flex items-center justify-between px-4 py-3 bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700"
        >
          <div class="flex items-center gap-4">
            <div>
              <h3 class="text-lg font-bold uppercase text-surface-700 dark:text-surface-300 m-0">PUNKT/STACJA</h3>
            </div>
          </div>
        </div>
      </template>

      <template #content>
        <div class="space-y-4">
          <div
            v-for="item in workRangeGasStations"
            :key="item.id"
            class="p-4 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900"
          >
            <div class="grid grid-cols-6 gap-3">
              <!-- PRZEPUSTOWOŚĆ -->
              <div class="mt-3">
                <label class="block text-xs uppercase text-surface-600 dark:text-surface-400 mb-1">
                  PRZEPUSTOWOŚĆ
                </label>
                <p class="text-sm text-surface-700 dark:text-surface-300 m-0">{{ item.capacity || '---' }} m3/h</p>
              </div>

              <!-- ILOŚĆ -->
              <div class="mt-3">
                <label class="block text-xs uppercase text-surface-600 dark:text-surface-400 mb-1"> ILOŚĆ </label>
                <p class="text-sm text-surface-700 dark:text-surface-300 m-0">{{ item.amount || '---' }} szt.</p>
              </div>

              <!-- RODZAJ STACJI -->
              <div class="mt-3">
                <label class="block text-xs uppercase text-surface-600 dark:text-surface-400 mb-1">
                  RODZAJ STACJI
                </label>
                <p class="text-sm text-surface-700 dark:text-surface-300 m-0">
                  {{ item.stationType?.viewValue || '---' }}
                </p>
              </div>

              <!-- INNE INFO -->
              <div class="mt-3 col-span-2">
                <label class="block text-xs uppercase text-surface-600 dark:text-surface-400 mb-1"> INNE INFO </label>
                <p class="text-sm text-surface-700 dark:text-surface-300 m-0">
                  {{ item.info || 'Brak danych' }}
                </p>
              </div>

              <!-- PRZYCISKI AKCJI -->
              <div class="flex flex-col items-end gap-2 mt-3">
                <div class="flex">
                  <Button
                    icon="pi pi-pencil"
                    severity="secondary"
                    text
                    rounded
                    :disabled="isReadonly"
                    @click="handleEditGasStation(item)"
                    title="Edytuj punkt/stację"
                  />
                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    rounded
                    :disabled="isReadonly"
                    @click="event => handleDeleteGasStation(event, item)"
                    title="Usuń punkt/stację"
                  />
                </div>
              </div>
            </div>
          </div>

          <div v-if="workRangeGasStations.length === 0" class="p-8 text-center text-surface-600 dark:text-surface-400">
            <p>Brak punktów/stacji. Kliknij "Dodaj punkt/stację" aby dodać pierwszy punkt/stację.</p>
          </div>
        </div>
      </template>

      <template #footer>
        <div
          class="flex items-center justify-end px-4 py-3 bg-surface-50 dark:bg-surface-900 border-t border-surface-200 dark:border-surface-700"
        >
          <Button label="Dodaj punkt/stację" icon="pi pi-plus" :disabled="isReadonly" @click="handleAddGasStation" />
        </div>
      </template>
    </Card>

    <!-- WŁĄCZENIE -->
    <Card class="border border-surface-200 dark:border-surface-700 overflow-hidden">
      <template #header>
        <div
          class="flex items-center justify-between px-4 py-3 bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700"
        >
          <div class="flex items-center gap-4">
            <div>
              <h3 class="text-lg font-bold uppercase text-surface-700 dark:text-surface-300 m-0">WŁĄCZENIE</h3>
            </div>
          </div>
        </div>
      </template>

      <template #content>
        <div class="space-y-4">
          <div
            v-if="workRangeConnection"
            class="p-4 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900"
          >
            <div class="grid grid-cols-6 gap-3">
              <!-- CIŚNIENIE -->
              <div class="mt-3">
                <label class="block text-xs uppercase text-surface-600 dark:text-surface-400 mb-1"> CIŚNIENIE </label>
                <p class="text-sm text-surface-700 dark:text-surface-300 m-0">
                  {{ workRangeConnection.pressure?.displayValue || '---' }}
                </p>
              </div>

              <!-- ŚREDNICA NOMINALNA -->
              <div class="mt-3">
                <label class="block text-xs uppercase text-surface-600 dark:text-surface-400 mb-1">
                  ŚREDNICA NOMINALNA
                </label>
                <p class="text-sm text-surface-700 dark:text-surface-300 m-0">
                  {{ workRangeConnection.diameter || '---' }}
                </p>
              </div>

              <!-- MATERIAŁ -->
              <div class="mt-3">
                <label class="block text-xs uppercase text-surface-600 dark:text-surface-400 mb-1"> MATERIAŁ </label>
                <p class="text-sm text-surface-700 dark:text-surface-300 m-0">
                  {{ workRangeConnection.material || '---' }}
                </p>
              </div>

              <!-- UWAGI -->
              <div class="mt-3 col-span-2">
                <label class="block text-xs uppercase text-surface-600 dark:text-surface-400 mb-1"> UWAGI </label>
                <p class="text-sm text-surface-700 dark:text-surface-300 m-0">
                  {{ workRangeConnection.info || 'Brak danych' }}
                </p>
              </div>

              <!-- PRZYCISKI AKCJI -->
              <div class="flex flex-col items-end gap-2 mt-3">
                <div class="flex">
                  <Button
                    icon="pi pi-pencil"
                    severity="secondary"
                    text
                    rounded
                    :disabled="isReadonly"
                    @click="handleEditConnection()"
                    title="Edytuj włączenie"
                  />
                  <Button
                    v-if="
                      workRangeConnection.pressure ||
                      workRangeConnection.diameter ||
                      workRangeConnection.material ||
                      workRangeConnection.info
                    "
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    rounded
                    :disabled="isReadonly"
                    @click="event => handleDeleteConnection(event)"
                    title="Usuń włączenie"
                  />
                </div>
              </div>
            </div>
          </div>

          <div v-else class="p-8 text-center text-surface-600 dark:text-surface-400">
            <p>Brak danych włączenia. Kliknij "Dodaj włączenie" aby dodać dane włączenia.</p>
          </div>
        </div>
      </template>

      <template #footer>
        <div
          class="flex items-center justify-end px-4 py-3 bg-surface-50 dark:bg-surface-900 border-t border-surface-200 dark:border-surface-700"
        >
          <Button
            :label="workRangeConnection ? 'Edytuj włączenie' : 'Dodaj włączenie'"
            icon="pi pi-plus"
            :disabled="isReadonly"
            @click="handleEditConnection()"
          />
        </div>
      </template>
    </Card>

    <!-- Dialogs -->
    <WorkRangeGasConnectionDialog
      v-model:visible="gasConnectionDialogVisible"
      :item="editingGasConnection"
      :isReadonly="isReadonly"
      @save="handleSaveGasConnection"
    />

    <WorkRangeGasStationDialog
      v-model:visible="gasStationDialogVisible"
      :item="editingGasStation"
      :isReadonly="isReadonly"
      @save="handleSaveGasStation"
    />

    <WorkRangeConnectionDialog
      v-model:visible="connectionDialogVisible"
      :item="editingConnection"
      :isReadonly="isReadonly"
      @save="handleSaveConnection"
    />
  </div>
</template>
