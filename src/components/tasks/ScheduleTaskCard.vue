<script setup lang="ts">
  import { computed } from 'vue';
  import { useRouter } from 'vue-router';
  import Button from 'primevue/button';
  import { useGasConnectionsStore } from '@/stores/gasConnections';
  import type { ScheduleTask, ScheduleTaskStatus } from '@/types/ScheduleTask';
  import { SCHEDULE_TASK_STATUS_LABELS } from '@/types/ScheduleTask';
  import { MapPinIcon } from '@heroicons/vue/24/outline';

  const props = withDefaults(
    defineProps<{
      task: ScheduleTask;
      /** Gdy true, notatki nie są wyświetlane w treści; pokazywane w title przy najechaniu. */
      compact?: boolean;
      /** Gdy true, pokazywane są tylko tytuł i status (np. w widoku miesięcznym). */
      minimal?: boolean;
      /** Gdy true, klik w kartę emituje select (np. do panelu szczegółów w widoku dzień). */
      selectable?: boolean;
    }>(),
    { compact: false, minimal: false, selectable: false }
  );

  const emit = defineEmits<{
    edit: [];
    delete: [event: Event];
    select: [];
  }>();

  const router = useRouter();
  const gasConnectionsStore = useGasConnectionsStore();

  const timeRange = computed(() => {
    const start = props.task.startDate instanceof Date ? props.task.startDate : new Date(props.task.startDate);
    const end = props.task.endDate instanceof Date ? props.task.endDate : new Date(props.task.endDate);
    const fmt = (d: Date) => d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    return `${fmt(start)} - ${fmt(end)}`;
  });

  const locationText = computed(() => {
    if (props.task.referenceType?.name !== 'GAS_CONNECTION') return '—';
    const gc = gasConnectionsStore.getGasConnection(props.task.referenceId);
    if (!gc?.address) return '—';
    const a = gc.address;
    const parts = [a.street, a.city].filter(Boolean);
    return parts.length ? parts.join(', ') : '—';
  });

  const statusBadgeClass = computed(() => {
    const m: Record<ScheduleTaskStatus, string> = {
      scheduled: 'bg-surface-400 dark:bg-surface-700 text-surface-50 dark:text-surface-300',
      active: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200',
      done: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200',
      cancelled: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200',
      postponed: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200',
    };
    return m[props.task.status] ?? m.scheduled;
  });

  const statusBorderClass = computed(() => {
    const m: Record<ScheduleTaskStatus, string> = {
      scheduled: 'border border-surface-400 dark:border-surface-600 border-l-8',
      active: 'border border-amber-400 dark:border-amber-500 border-l-8',
      done: 'border border-green-500 dark:border-green-400 border-l-8',
      cancelled: 'border border-red-500 dark:border-red-400 border-l-8',
      postponed: 'border border-blue-500 dark:border-blue-400 border-l-8',
    };
    return m[props.task.status] ?? m.scheduled;
  });

  const canShowConnectionDetails = computed(
    () => props.task.referenceType?.name === 'GAS_CONNECTION' && props.task.referenceId
  );

  function goToConnectionDetails() {
    if (!canShowConnectionDetails.value) return;
    router.push({
      name: 'gas-connection-details',
      query: { id: String(props.task.referenceId), readonly: 'true' },
    });
  }

  function onEdit() {
    emit('edit');
  }

  function onDelete(event: Event) {
    emit('delete', event);
  }

  function onCardClick() {
    if (props.selectable) emit('select');
  }
</script>

<template>
  <div
    :class="[
      'flex flex-col rounded-xl border bg-surface-200 dark:bg-surface-800 min-w-0 max-w-full',
      minimal ? 'p-2 md:max-w-[200px]' : 'p-3 pb-0.5 md:max-w-[360px]',
      statusBorderClass,
      selectable && 'cursor-pointer',
    ]"
    :title="(compact && task.notes) || minimal ? task.notes || undefined : undefined"
    @click="onCardClick"
  >
    <!-- Tryb minimal: tylko tytuł, kolor statusu w obramowaniu (border-l-8) -->
    <template v-if="minimal">
      <h3 class="text-sm font-bold text-surface-700 dark:text-surface-300 truncate">
        {{ task.title }}
      </h3>
    </template>

    <!-- Tryb pełny lub compact -->
    <template v-else>
      <div class="flex items-center justify-between gap-2 mb-3">
        <span class="text-sm font-medium text-surface-600 dark:text-surface-400">{{ timeRange }}</span>
        <span :class="['rounded-full px-2 py-1.5 text-xs font-medium', statusBadgeClass]">
          {{ SCHEDULE_TASK_STATUS_LABELS[task.status] }}
        </span>
      </div>
      <h3 class="text-base font-bold text-surface-700 dark:text-surface-300 mb-1">
        {{ task.title }}
      </h3>
      <div class="flex items-center gap-1.5 text-sm text-surface-600 dark:text-surface-400 mb-4 min-w-0">
        <MapPinIcon class="w-4 h-4 shrink-0" />
        <span class="min-w-0 truncate">{{ locationText }}</span>
      </div>

      <div
        v-if="!compact && task.notes"
        class="text-sm text-surface-600 dark:text-surface-400 mb-4 min-w-0 wrap-break-word line-clamp-2"
      >
        <span class="font-medium text-surface-700 dark:text-surface-300">Notatki:</span>
        {{ task.notes }}
      </div>

      <div
        class="mt-auto flex items-center justify-between gap-2 border-t border-surface-200 dark:border-surface-700"
        @click.stop
      >
        <div class="flex items-center gap-1">
          <Button
            icon="pi pi-pencil"
            text
            rounded
            severity="primary"
            size="small"
            title="Edytuj"
            class="p-1.5!"
            @click="onEdit"
          />
          <Button
            icon="pi pi-trash"
            text
            rounded
            severity="danger"
            size="small"
            title="Usuń"
            class="p-1.5! text-red-600 dark:text-red-400"
            @click="onDelete"
          />
        </div>
        <div class="flex items-center gap-1">
          <Button
            v-if="canShowConnectionDetails"
            icon="pi pi-eye-slash"
            text
            rounded
            severity="primary"
            size="small"
            title="Szczegóły przyłącza (tylko odczyt)"
            class="p-1.5!"
            @click="goToConnectionDetails"
          />
        </div>
      </div>
    </template>
  </div>
</template>
