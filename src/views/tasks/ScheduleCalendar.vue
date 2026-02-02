<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue';
  import Toolbar from 'primevue/toolbar';
  import Button from 'primevue/button';
  import Panel from 'primevue/panel';
  import SpeedDial from 'primevue/speeddial';
  import ConfirmPopup from 'primevue/confirmpopup';
  import { useConfirm } from 'primevue/useconfirm';
  import type { MenuItem } from 'primevue/menuitem';
  import moment from 'moment';
  import SidebarMenu from '@/components/SidebarMenu.vue';
  import ScheduleTaskCard from '@/components/tasks/ScheduleTaskCard.vue';
  import ScheduleTaskFormDialog from '@/components/tasks/ScheduleTaskFormDialog.vue';
  import { useBrigadesStore } from '@/stores/brigades';
  import { useScheduleTasksStore } from '@/stores/scheduleTasks';
  import type { ScheduleTask } from '@/types/ScheduleTask';
  import { CalendarIcon } from '@heroicons/vue/24/outline';

  const dateFormatMain = new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const dateFormatWeekday = new Intl.DateTimeFormat('pl-PL', { weekday: 'long' });
  const dateFormatWeekdayShort = new Intl.DateTimeFormat('pl-PL', { weekday: 'short' });
  const weekdayShortLabel = (d: Date) => dateFormatWeekdayShort.format(d).replace('.', '').toUpperCase();

  type ViewMode = 'day' | 'week' | 'month';

  const brigadesStore = useBrigadesStore();
  const scheduleTasksStore = useScheduleTasksStore();
  const confirm = useConfirm();

  const currentDate = ref<Date>(new Date());
  const viewMode = ref<ViewMode>('day');
  const isMobile = ref(false);
  const dialogVisible = ref(false);
  const editingTask = ref<ScheduleTask | null>(null);

  const checkMobile = () => {
    isMobile.value = window.innerWidth < 768;
  };

  onMounted(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', checkMobile);
  });

  const formattedDateMain = computed(() => dateFormatMain.format(currentDate.value));

  const formattedDateSub = computed(() => {
    const dayName = dateFormatWeekday.format(currentDate.value);
    const weekNum = moment(currentDate.value).week();
    return `${dayName} - Tydzień ${weekNum}`;
  });

  const activeBrigades = computed(() => brigadesStore.getAllBrigades({ isActive: true }));

  const weekStart = computed(() => moment(currentDate.value).startOf('isoWeek').toDate());
  const weekDays = computed(() =>
    [0, 1, 2, 3, 4, 5].map(i => {
      const d = new Date(weekStart.value);
      d.setDate(d.getDate() + i);
      return d;
    })
  );
  const weekLabel = computed(() => {
    const start = weekStart.value;
    const end = new Date(start);
    end.setDate(end.getDate() + 5);
    return `${dateFormatMain.format(start)} – ${dateFormatMain.format(end)}`;
  });

  function getTasksForBrigadeAndDay(brigadeId: number, day: Date): ScheduleTask[] {
    const groups = scheduleTasksStore.getTasksForDayGroupedByBrigade(day);
    const found = groups.find(g => g.brigadeId === brigadeId);
    return found?.tasks ?? [];
  }

  const tasksByBrigadeMap = computed(() => {
    const groups = scheduleTasksStore.getTasksForDayGroupedByBrigade(currentDate.value);
    const map = new Map<number, ScheduleTask[]>();
    for (const { brigadeId, tasks } of groups) {
      map.set(brigadeId, tasks);
    }
    return map;
  });

  function getTasksForBrigade(brigadeId: number): ScheduleTask[] {
    return tasksByBrigadeMap.value.get(brigadeId) ?? [];
  }

  function taskCountLabel(count: number): string {
    if (count === 1) return '1 Zadanie';
    if (count >= 2 && count <= 4) return `${count} Zadania`;
    return `${count} Zadań`;
  }

  const prevDay = () => {
    const d = new Date(currentDate.value);
    d.setDate(d.getDate() - 1);
    currentDate.value = d;
  };

  const nextDay = () => {
    const d = new Date(currentDate.value);
    d.setDate(d.getDate() + 1);
    currentDate.value = d;
  };

  const goToToday = () => {
    currentDate.value = new Date();
  };

  const goToDay = (day: Date) => {
    currentDate.value = new Date(day);
    viewMode.value = 'day';
  };

  const prevWeek = () => {
    const d = new Date(currentDate.value);
    d.setDate(d.getDate() - 7);
    currentDate.value = d;
  };

  const nextWeek = () => {
    const d = new Date(currentDate.value);
    d.setDate(d.getDate() + 7);
    currentDate.value = d;
  };

  const setViewMode = (mode: ViewMode) => {
    viewMode.value = mode;
  };

  const onAdd = () => {
    editingTask.value = null;
    dialogVisible.value = true;
  };

  const onEditTask = (task: ScheduleTask) => {
    editingTask.value = task;
    dialogVisible.value = true;
  };

  const onDeleteTask = (task: ScheduleTask, event: Event) => {
    confirm.require({
      target: event.currentTarget as HTMLElement,
      message: `Czy na pewno chcesz usunąć zadanie "${task.title}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Tak',
      rejectLabel: 'Nie',
      accept: () => {
        scheduleTasksStore.deleteTask(task.id);
      },
    });
  };

  const onDialogClose = () => {
    editingTask.value = null;
  };

  const onEdit = () => {
    // placeholder – brak wybranego zadania w widoku dzień
  };

  const onDelete = (_event: Event) => {
    // placeholder
  };

  const speedDialItems = computed<MenuItem[]>(() => [
    {
      label: 'Dodaj',
      icon: 'pi pi-plus',
      command: () => onAdd(),
      class: 'bg-green-50 dark:bg-green-900 text-green-600 dark:text-green-400',
    },
    {
      label: 'Edytuj',
      icon: 'pi pi-pencil',
      command: () => onEdit(),
      class: 'bg-primary-50 dark:bg-primary-900 text-primary dark:text-primary',
    },
    {
      label: 'Usuń',
      icon: 'pi pi-trash',
      command: (e: { originalEvent: Event }) => onDelete(e.originalEvent),
      class: 'bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-400',
    },
  ]);
</script>

<template>
  <div class="flex h-screen bg-surface-0 dark:bg-surface-950 overflow-hidden">
    <!-- Sidebar Menu -->
    <SidebarMenu />

    <!-- Main Content -->
    <div class="flex-1 overflow-y-auto p-1 md:p-6 w-full">
      <div class="w-full">
        <div class="flex items-center gap-3 mb-1 md:mb-6">
          <CalendarIcon class="md:w-6 md:h-6 w-4 h-4 text-primary-400" />
          <h1 class="text-md md:text-3xl font-bold text-surface-700 dark:text-surface-300">Terminarz</h1>
        </div>

        <!-- Desktop Toolbar -->
        <Toolbar
          v-if="!isMobile"
          class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg w-full mb-4"
        >
          <template #start>
            <div class="flex items-center gap-2">
              <Button icon="pi pi-plus" severity="success" text rounded class="text-xs" title="Dodaj" @click="onAdd" />
              <Button icon="pi pi-pencil" text rounded class="text-xs!" title="Edytuj" @click="onEdit" />
              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                rounded
                class="text-xs!"
                title="Usuń"
                @click="onDelete($event)"
              />
            </div>
          </template>

          <template #center>
            <div class="flex items-center gap-3">
              <template v-if="viewMode === 'week'">
                <Button icon="pi pi-chevron-left" text rounded title="Poprzedni tydzień" @click="prevWeek" />
                <div class="text-center min-w-[280px]">
                  <div class="text-lg font-bold text-surface-700 dark:text-surface-300">
                    {{ weekLabel }}
                  </div>
                  <div class="text-sm text-surface-600 dark:text-surface-400">Tydzień</div>
                </div>
                <Button icon="pi pi-chevron-right" text rounded title="Następny tydzień" @click="nextWeek" />
              </template>
              <template v-else>
                <Button icon="pi pi-chevron-left" text rounded title="Poprzedni dzień" @click="prevDay" />
                <div class="text-center min-w-[220px]">
                  <div class="text-lg font-bold text-surface-700 dark:text-surface-300">
                    {{ formattedDateMain }}
                  </div>
                  <div class="text-sm text-surface-600 dark:text-surface-400">
                    {{ formattedDateSub }}
                  </div>
                </div>
                <Button icon="pi pi-chevron-right" text rounded title="Następny dzień" @click="nextDay" />
              </template>
              <Button
                label="Dziś"
                outlined
                severity="secondary"
                class="rounded-lg"
                title="Przejdź do dzisiejszej daty"
                @click="goToToday"
              />
            </div>
          </template>

          <template #end>
            <div class="flex items-center gap-1">
              <Button
                :label="'Dzień'"
                :outlined="viewMode !== 'day'"
                :class="
                  viewMode === 'day'
                    ? 'bg-primary-400 text-black text-xs! border-0!'
                    : 'text-xs! border-2! border-primary-500! text-primary-500!'
                "
                title="Widok dzień"
                @click="setViewMode('day')"
              />
              <Button
                label="Tydzień"
                :outlined="viewMode !== 'week'"
                :class="
                  viewMode === 'week'
                    ? 'bg-primary-400! text-black text-xs! border-0!'
                    : 'text-xs! border-2! border-primary-500! text-primary-500!'
                "
                title="Widok tydzień"
                @click="setViewMode('week')"
              />
              <Button
                label="Miesiąc"
                :outlined="viewMode !== 'month'"
                :class="
                  viewMode === 'month'
                    ? 'bg-primary-400! text-black text-xs! border-0!'
                    : 'text-xs! border-2! border-primary-500! text-primary-500!'
                "
                title="Widok miesiąc"
                @click="setViewMode('month')"
              />
            </div>
          </template>
        </Toolbar>

        <!-- Mobile Toolbar -->
        <div
          v-if="isMobile"
          class="relative md:hidden bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg w-full mb-4 p-3"
        >
          <div class="flex flex-col gap-3">
            <div class="flex items-center gap-2">
              <template v-if="viewMode === 'week'">
                <Button icon="pi pi-chevron-left" text rounded title="Poprzedni tydzień" @click="prevWeek" />
                <div class="flex-1 text-center min-w-0">
                  <div class="text-base font-bold text-surface-700 dark:text-surface-300 truncate">
                    {{ weekLabel }}
                  </div>
                  <div class="text-xs text-surface-600 dark:text-surface-400">Tydzień</div>
                </div>
                <Button icon="pi pi-chevron-right" text rounded title="Następny tydzień" @click="nextWeek" />
              </template>
              <template v-else>
                <Button icon="pi pi-chevron-left" text rounded title="Poprzedni dzień" @click="prevDay" />
                <div class="flex-1 text-center min-w-0">
                  <div class="text-base font-bold text-surface-700 dark:text-surface-300 truncate">
                    {{ formattedDateMain }}
                  </div>
                  <div class="text-xs text-surface-600 dark:text-surface-400">
                    {{ formattedDateSub }}
                  </div>
                </div>
                <Button icon="pi pi-chevron-right" text rounded title="Następny dzień" @click="nextDay" />
              </template>
              <Button
                label="Dziś"
                outlined
                severity="secondary"
                size="small"
                class="rounded-lg shrink-0"
                title="Przejdź do dzisiejszej daty"
                @click="goToToday"
              />
            </div>
            <div class="flex items-center gap-1">
              <Button
                label="Dzień"
                :outlined="viewMode !== 'day'"
                :class="
                  viewMode === 'day'
                    ? 'bg-primary-400 text-black text-xs! border-0!'
                    : 'text-xs! border-2! border-primary-500! text-primary-500!'
                "
                size="small"
                title="Widok dzień"
                @click="setViewMode('day')"
              />
              <Button
                label="Tydzień"
                :outlined="viewMode !== 'week'"
                :class="
                  viewMode === 'week'
                    ? 'bg-primary-400! text-black text-xs! border-0!'
                    : 'text-xs! border-2! border-primary-500! text-primary-500!'
                "
                size="small"
                title="Widok tydzień"
                @click="setViewMode('week')"
              />
              <Button
                label="Miesiąc"
                :outlined="viewMode !== 'month'"
                :class="
                  viewMode === 'month'
                    ? 'bg-primary-400! text-black text-xs! border-0!'
                    : 'text-xs! border-2! border-primary-500! text-primary-500!'
                "
                size="small"
                title="Widok miesiąc"
                @click="setViewMode('month')"
              />
            </div>
          </div>
          <SpeedDial
            :model="speedDialItems"
            :radius="120"
            type="quarter-circle"
            direction="down-right"
            :mask="true"
            class="absolute top-0 right-0 z-10"
          >
            <template #item="{ item }: { item: MenuItem }">
              <button
                :class="[
                  'p-speeddial-action',
                  'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
                  item.class || '',
                ]"
                :disabled="item.disabled === true"
                :title="typeof item.label === 'string' ? item.label : undefined"
                @click="item.command && item.command({ originalEvent: $event, item })"
              >
                <i :class="item.icon" class="text-lg" />
              </button>
            </template>
          </SpeedDial>
        </div>

        <!-- Widok dzień: panele brygad z zadaniami -->
        <template v-if="viewMode === 'day'">
          <div class="space-y-4">
            <Panel
              v-for="brigade in activeBrigades"
              :key="brigade.id"
              toggleable
              :collapsed="getTasksForBrigade(brigade.id).length === 0"
              class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700"
            >
              <template #header>
                <div class="flex items-center w-full gap-3">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-1.5 h-10 shrink-0 rounded-full bg-amber-400 dark:bg-amber-500" aria-hidden="true" />
                    <span class="font-semibold text-surface-700 dark:text-surface-300 truncate">
                      {{ brigade.name }}
                    </span>
                  </div>
                  <span
                    class="shrink-0 rounded-full bg-surface-200 dark:bg-surface-700 px-2.5 py-1 text-xs font-medium text-surface-700 dark:text-surface-300"
                  >
                    {{ taskCountLabel(getTasksForBrigade(brigade.id).length) }}
                  </span>
                </div>
              </template>
              <div class="flex flex-wrap gap-4 p-1 md:p-4">
                <ScheduleTaskCard
                  v-for="task in getTasksForBrigade(brigade.id)"
                  :key="task.id"
                  :task="task"
                  @edit="onEditTask(task)"
                  @delete="e => onDeleteTask(task, e)"
                />
              </div>
            </Panel>
          </div>
        </template>

        <!-- Widok tydzień: siatka brygady × dni robocze -->
        <div
          v-else-if="viewMode === 'week'"
          class="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900"
        >
          <div
            class="grid min-w-[800px]"
            :style="{ gridTemplateColumns: `minmax(56px, 0.5fr) repeat(6, minmax(140px, 1fr))` }"
          >
            <!-- Pusta komórka nad kolumną brygad -->
            <div
              class="border-b border-r border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900"
            />
            <!-- Nagłówki dni (klikalne) -->
            <button
              v-for="day in weekDays"
              :key="day.toISOString()"
              type="button"
              class="border-b border-r border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 px-2 py-3 text-center text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors cursor-pointer last:border-r-0"
              @click="goToDay(day)"
            >
              <div class="text-sm font-semibold">{{ weekdayShortLabel(day) }}</div>
              <div class="text-lg font-bold">{{ day.getDate() }}</div>
            </button>
            <!-- Wiersze: brygada + komórki dni -->
            <template v-for="brigade in activeBrigades" :key="brigade.id">
              <div
                class="border-b border-r border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 py-2 flex items-center justify-center "
              >
                <span
                  class="text-xs font-semibold uppercase tracking-wide text-surface-700 dark:text-surface-300 whitespace-nowrap"
                  style="writing-mode: vertical-rl; text-orientation: mixed"
                >
                  {{ brigade.name }}
                </span>
              </div>
              <div
                v-for="day in weekDays"
                :key="`${brigade.id}-${day.toISOString()}`"
                class="border-b border-r border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 p-2 min-h-[120px] last:border-r-0"
              >
                <div class="flex flex-col gap-2">
                  <ScheduleTaskCard
                    v-for="task in getTasksForBrigadeAndDay(brigade.id, day)"
                    :key="task.id"
                    :task="task"
                    compact
                    class="shrink-0"
                    @edit="onEditTask(task)"
                    @delete="e => onDeleteTask(task, e)"
                  />
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- Placeholder dla widoku miesiąc -->
        <div
          v-else
          class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-12 text-center"
        >
          <CalendarIcon class="w-16 h-16 text-surface-400 dark:text-surface-600 mx-auto mb-4" />
          <h2 class="text-xl font-semibold text-surface-700 dark:text-surface-300 mb-2">Widok miesiąc</h2>
          <p class="text-surface-600 dark:text-surface-400">Widok miesiąc zostanie dodany w przyszłości.</p>
        </div>
      </div>

      <ConfirmPopup />
      <ScheduleTaskFormDialog
        v-model:visible="dialogVisible"
        :schedule-task="editingTask ?? undefined"
        :initial-date="currentDate"
        @close="onDialogClose"
      />
    </div>
  </div>
</template>
