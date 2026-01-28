<script setup lang="ts">
  import { ref, watch } from 'vue';
  import Dialog from 'primevue/dialog';
  import Select from 'primevue/select';
  import SecondaryButton from '@/components/SecondaryButton.vue';
  import PrimaryButton from '@/components/PrimaryButton.vue';
  import { FunnelIcon } from '@heroicons/vue/24/outline';
  import { useSettingsStore } from '@/stores/settings';
  import type { TasksListFilter, TasksListTableSettings } from '@/types/Settings';

  const settingsStore = useSettingsStore();

  const props = defineProps<{
    visible: boolean;
    moduleName: TasksListTableSettings['moduleName'];
    defaultFilter?: TasksListFilter;
  }>();

  const emit = defineEmits<{
    'update:visible': [value: boolean];
    saved: [defaultFilter?: TasksListFilter];
    close: [];
  }>();

  const filterOptions: { label: string; value: TasksListFilter }[] = [
    { label: 'Wszyscy', value: 'all' },
    { label: 'Aktywni', value: 'active' },
    { label: 'Nieaktywni', value: 'inactive' },
    { label: 'Ulubieni', value: 'favorites' },
  ];

  const selectedFilter = ref<TasksListFilter>('all');

  watch(
    () => props.visible,
    v => {
      if (v) {
        selectedFilter.value = props.defaultFilter ?? 'all';
      }
    },
    { immediate: true }
  );

  function handleSave() {
    const filter = selectedFilter.value;
    settingsStore.saveTasksListTableSettings(props.moduleName, filter);
    emit('saved', filter);
    emit('update:visible', false);
  }

  function handleCancel() {
    emit('update:visible', false);
    emit('close');
  }
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="val => emit('update:visible', val)"
    modal
    closable
    :draggable="false"
    :style="{ width: '32rem' }"
    :breakpoints="{ '575px': '90vw' }"
    class="p-fluid"
    :pt="{ root: { class: '!bg-surface-0 dark:!bg-surface-950' } }"
    @hide="handleCancel"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <span class="text-lg font-semibold text-surface-700 dark:text-surface-300">Konfiguracja listy</span>
      </div>
    </template>

    <div class="space-y-6">
      <div class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
        <h3 class="text-lg font-semibold text-surface-700 dark:text-surface-300 mb-4 flex items-center gap-2">
          <FunnelIcon class="w-5 h-5 text-primary-400" />
          Domyślny filtr
        </h3>
        <div>
          <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Filtr</label>
          <Select
            v-model="selectedFilter"
            :options="filterOptions"
            option-label="label"
            option-value="value"
            class="w-full"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <SecondaryButton type="button" text="Anuluj" @click="handleCancel" size="lg" />
        <PrimaryButton type="button" text="Zapisz" size="lg" icon="pi pi-check" iconPos="left" @click="handleSave" />
      </div>
    </template>
  </Dialog>
</template>
