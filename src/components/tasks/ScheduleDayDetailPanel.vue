<script setup lang="ts">
  import { computed } from 'vue';
  import Select from 'primevue/select';
  import { useBrigadesStore } from '@/stores/brigades';
  import { useScheduleTasksStore } from '@/stores/scheduleTasks';
  import ScheduleTaskCard from '@/components/tasks/ScheduleTaskCard.vue';
  import type { ScheduleTask } from '@/types/ScheduleTask';

  const props = defineProps<{
    selectedDay: Date;
    selectedBrigadeId: number;
  }>();

  const emit = defineEmits<{
    'update:selectedBrigadeId': [value: number];
    edit: [task: ScheduleTask];
    delete: [task: ScheduleTask, event: Event];
  }>();

  const brigadesStore = useBrigadesStore();
  const scheduleTasksStore = useScheduleTasksStore();

  const dateFormatFull = new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  });

  const activeBrigades = computed(() => brigadesStore.getAllBrigades({ isActive: true }));

  const formattedDate = computed(() => dateFormatFull.format(props.selectedDay));

  const tasksForDay = computed(() => {
    const groups = scheduleTasksStore.getTasksForDayGroupedByBrigade(props.selectedDay);
    const found = groups.find(g => g.brigadeId === props.selectedBrigadeId);
    return found?.tasks ?? [];
  });

  function onBrigadeChange(brigade: { id: number } | null) {
    if (brigade) {
      emit('update:selectedBrigadeId', brigade.id);
    }
  }
</script>

<template>
  <div
    class="flex flex-col h-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden"
  >
    <div class="p-4 border-b border-surface-200 dark:border-surface-700">
      <h3 class="text-lg font-bold text-surface-700 dark:text-surface-300 mb-4">
        {{ formattedDate }}
      </h3>
      <div>
        <label
          class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
        >
          Brygada
        </label>
        <Select
          :model-value="activeBrigades.find(b => b.id === selectedBrigadeId) ?? null"
          :options="activeBrigades"
          option-label="name"
          placeholder="Wybierz brygadę"
          class="w-full"
          @update:model-value="onBrigadeChange"
        />
      </div>
    </div>
    <div class="flex-1 overflow-y-auto p-4">
      <div class="flex flex-col gap-4">
        <ScheduleTaskCard
          v-for="task in tasksForDay"
          :key="task.id"
          :task="task"
          @edit="$emit('edit', task)"
          @delete="e => $emit('delete', task, e)"
        />
        <p
          v-if="tasksForDay.length === 0"
          class="text-sm text-surface-600 dark:text-surface-400"
        >
          Brak zadań na ten dzień
        </p>
      </div>
    </div>
  </div>
</template>
