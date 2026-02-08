<script setup lang="ts">
  import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
  import Toolbar from 'primevue/toolbar';
  import Button from 'primevue/button';
  import Panel from 'primevue/panel';
  import ConfirmPopup from 'primevue/confirmpopup';
  import { useConfirm } from 'primevue/useconfirm';
  import moment from 'moment';
  import SidebarMenu from '@/components/SidebarMenu.vue';
  import ScheduleTaskCard from '@/components/tasks/ScheduleTaskCard.vue';
  import ScheduleTaskFormDialog from '@/components/tasks/ScheduleTaskFormDialog.vue';
  import ScheduleDayDetailPanel from '@/components/tasks/ScheduleDayDetailPanel.vue';
  import ScheduleTaskDetailPanel from '@/components/tasks/ScheduleTaskDetailPanel.vue';
  import ScheduleCalendarSettingsDialog from '@/components/tasks/ScheduleCalendarSettingsDialog.vue';
  import { useBrigadesStore } from '@/stores/brigades';
  import { useScheduleTasksStore } from '@/stores/scheduleTasks';
  import { useSettingsStore } from '@/stores/settings';
  import type { ScheduleTask } from '@/types/ScheduleTask';
  import type { ScheduleCalendarDefaultView } from '@/types/Settings';
  import { CalendarIcon } from '@heroicons/vue/24/outline';

  const dateFormatMain = new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const dateFormatWeekday = new Intl.DateTimeFormat('pl-PL', { weekday: 'long' });
  const dateFormatWeekdayShort = new Intl.DateTimeFormat('pl-PL', { weekday: 'short' });
  const weekdayShortLabel = (d: Date) => dateFormatWeekdayShort.format(d).replace('.', '').toUpperCase();

  type ViewMode = ScheduleCalendarDefaultView;

  const brigadesStore = useBrigadesStore();
  const scheduleTasksStore = useScheduleTasksStore();
  const settingsStore = useSettingsStore();
  const confirm = useConfirm();

  const currentDate = ref<Date>(new Date());
  const viewMode = ref<ViewMode>('day');
  const autoSaveSettings = ref(false);
  const showSettingsDialog = ref(false);
  const selectedDay = ref<Date>(new Date());
  const selectedBrigadeId = ref<number>(0);
  const isMobile = ref(false);
  const dialogVisible = ref(false);
  const editingTask = ref<ScheduleTask | null>(null);
  const selectedTaskInDayView = ref<ScheduleTask | null>(null);

  // Drag and drop (miesiąc + tydzień) – tylko zadania jednodniowe
  const draggedTask = ref<ScheduleTask | null>(null);
  const dragImageEl = ref<HTMLElement | null>(null);
  const ghostEl = ref<HTMLElement | null>(null);
  let globalDragOverHandler: ((e: DragEvent) => void) | null = null;
  let lastHighlightedEl: HTMLElement | null = null;
  const DROP_TARGET_CLASSES = [
    'ring-2',
    'ring-primary-500',
    'ring-inset',
    'bg-primary-400/30',
    'dark:bg-primary-400/20',
  ];

  function clearDropTargetHighlight() {
    if (lastHighlightedEl) {
      lastHighlightedEl.classList.remove(...DROP_TARGET_CLASSES);
      lastHighlightedEl = null;
    }
  }

  function setDropTargetHighlight(el: HTMLElement) {
    if (el === lastHighlightedEl) return;
    clearDropTargetHighlight();
    el.classList.add(...DROP_TARGET_CLASSES);
    lastHighlightedEl = el;
  }

  function isSameDay(a: Date, b: Date): boolean {
    const d1 = new Date(a);
    const d2 = new Date(b);
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  }

  function isSingleDayTask(task: ScheduleTask): boolean {
    const start = task.startDate instanceof Date ? task.startDate : new Date(task.startDate);
    const end = task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
    return isSameDay(start, end);
  }

  function moveTaskToDay(task: ScheduleTask, targetDay: Date): { startDate: Date; endDate: Date } {
    const start = task.startDate instanceof Date ? task.startDate : new Date(task.startDate);
    const end = task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
    const t = new Date(targetDay);
    t.setHours(0, 0, 0, 0);
    const newStart = new Date(t);
    newStart.setHours(start.getHours(), start.getMinutes(), start.getSeconds(), 0);
    const newEnd = new Date(t);
    newEnd.setHours(end.getHours(), end.getMinutes(), end.getSeconds(), 0);
    return { startDate: newStart, endDate: newEnd };
  }

  function onTaskDragStart(e: DragEvent, task: ScheduleTask) {
    if (!isSingleDayTask(task)) {
      e.preventDefault();
      return;
    }
    if (!e.dataTransfer || !dragImageEl.value) return;
    e.dataTransfer.setData('taskId', String(task.id));
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setDragImage(dragImageEl.value, 0, 0);
    draggedTask.value = task;
    document.body.classList.add('cursor-grabbing');
    globalDragOverHandler = (ev: DragEvent) => {
      ev.preventDefault();
      if (ghostEl.value && ev.clientX !== undefined && ev.clientY !== undefined) {
        ghostEl.value.style.left = `${ev.clientX + 10}px`;
        ghostEl.value.style.top = `${ev.clientY + 10}px`;
      }
    };
    document.addEventListener('dragover', globalDragOverHandler);
    nextTick(() => {
      if (ghostEl.value) {
        ghostEl.value.style.left = `${e.clientX + 10}px`;
        ghostEl.value.style.top = `${e.clientY + 10}px`;
      }
    });
  }

  function onTaskDragEnd() {
    draggedTask.value = null;
    clearDropTargetHighlight();
    document.body.classList.remove('cursor-grabbing');
    if (globalDragOverHandler) {
      document.removeEventListener('dragover', globalDragOverHandler);
      globalDragOverHandler = null;
    }
  }

  function onDayDragOver(e: DragEvent, _cell: { date: Date }) {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    setDropTargetHighlight(e.currentTarget as HTMLElement);
  }

  function onDayDrop(e: DragEvent, cell: { date: Date }) {
    e.preventDefault();
    clearDropTargetHighlight();
    const taskIdStr = e.dataTransfer?.getData('taskId');
    if (!taskIdStr) return;
    const taskId = Number(taskIdStr);
    const task = scheduleTasksStore.getTask(taskId);
    if (!task || !isSingleDayTask(task)) return;
    const { startDate, endDate } = moveTaskToDay(task, cell.date);
    scheduleTasksStore.updateTask(task.id, { startDate, endDate });
  }

  function onWeekCellDragOver(e: DragEvent, _cell: { brigadeId: number; date: Date }) {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    setDropTargetHighlight(e.currentTarget as HTMLElement);
  }

  function onWeekCellDrop(e: DragEvent, cell: { brigadeId: number; date: Date }) {
    e.preventDefault();
    clearDropTargetHighlight();
    const taskIdStr = e.dataTransfer?.getData('taskId');
    if (!taskIdStr) return;
    const taskId = Number(taskIdStr);
    const task = scheduleTasksStore.getTask(taskId);
    if (!task || !isSingleDayTask(task)) return;
    const { startDate, endDate } = moveTaskToDay(task, cell.date);
    scheduleTasksStore.updateTask(task.id, { startDate, endDate, brigadeId: cell.brigadeId });
  }

  const checkMobile = () => {
    isMobile.value = window.innerWidth < 768;
  };

  onMounted(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
    const settings = settingsStore.getScheduleCalendarSettings();
    if (settings?.defaultView) {
      viewMode.value = settings.defaultView;
      if (settings.defaultView === 'month') {
        calendarMonth.value = new Date();
        selectedDay.value = new Date();
      }
    }
    autoSaveSettings.value = settings?.autoSaveSettings ?? false;
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

  const visibleBrigadeIds = computed(() => {
    const settings = settingsStore.getScheduleCalendarSettings();
    if (settings?.visibleBrigadeIds?.length) return settings.visibleBrigadeIds;
    return activeBrigades.value.map(b => b.id);
  });

  const visibleBrigades = computed(() => activeBrigades.value.filter(b => visibleBrigadeIds.value.includes(b.id)));

  const effectiveViewMode = computed<ViewMode>(() => (isMobile.value ? 'day' : viewMode.value));

  watch(
    [visibleBrigadeIds, activeBrigades],
    () => {
      if (selectedBrigadeId.value === 0 || !visibleBrigadeIds.value.includes(selectedBrigadeId.value)) {
        const first = visibleBrigadeIds.value[0] ?? activeBrigades.value[0]?.id ?? 1;
        selectedBrigadeId.value = first;
      }
    },
    { immediate: true }
  );

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

  const calendarMonth = ref<Date>(new Date());

  const monthStart = computed(() => moment(calendarMonth.value).startOf('month'));

  const monthDays = computed(() => {
    const start = monthStart.value;
    const daysInMonth = start.daysInMonth();
    const firstDow = start.isoWeekday(); // 1=Pn, 2=Wt, ..., 7=Nd
    const padStart = firstDow - 1; // kolumny: 0=Pn, 1=Wt, ..., 6=Nd
    const totalCells = Math.ceil((padStart + daysInMonth) / 7) * 7;
    const days: { date: Date; isCurrentMonth: boolean }[] = [];
    for (let i = 0; i < padStart; i++) {
      const d = moment(start)
        .subtract(padStart - i, 'days')
        .toDate();
      days.push({ date: d, isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const d = moment(start).date(i).toDate();
      days.push({ date: d, isCurrentMonth: true });
    }
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = moment(start)
        .add(daysInMonth + i - 1, 'days')
        .toDate();
      days.push({ date: d, isCurrentMonth: false });
    }
    return days;
  });

  const monthLabel = computed(() =>
    new Intl.DateTimeFormat('pl-PL', { month: 'long', year: 'numeric' }).format(calendarMonth.value)
  );

  const prevMonth = () => {
    calendarMonth.value = moment(calendarMonth.value).subtract(1, 'month').toDate();
  };

  const nextMonth = () => {
    calendarMonth.value = moment(calendarMonth.value).add(1, 'month').toDate();
  };

  function getTasksForDay(day: Date): ScheduleTask[] {
    const groups = scheduleTasksStore.getTasksForDayGroupedByBrigade(day);
    const found = groups.find(g => g.brigadeId === selectedBrigadeId.value);
    return found?.tasks ?? [];
  }

  function selectDay(day: Date) {
    selectedDay.value = new Date(day);
  }

  function isSelectedDay(day: Date): boolean {
    const d = new Date(day);
    return (
      d.getFullYear() === selectedDay.value.getFullYear() &&
      d.getMonth() === selectedDay.value.getMonth() &&
      d.getDate() === selectedDay.value.getDate()
    );
  }

  function isToday(day: Date): boolean {
    const d = new Date(day);
    const t = new Date();
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
  }

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
    if (mode === 'month') {
      const now = new Date();
      calendarMonth.value = now;
      selectedDay.value = now;
    }
    if (autoSaveSettings.value) {
      const ids = visibleBrigadeIds.value;
      settingsStore.saveScheduleCalendarSettings(ids, mode, true);
    }
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

  function handleResetConfig(event: Event) {
    confirm.require({
      target: event.currentTarget as HTMLElement,
      message: 'Czy na pewno chcesz zresetować ustawienia kalendarza (widok, brygady, auto-zapis)?',
      icon: 'pi pi-exclamation-triangle',
      rejectProps: { label: 'Anuluj', severity: 'secondary', outlined: true },
      acceptProps: { label: 'Resetuj', severity: 'warning' },
      accept: () => {
        settingsStore.resetScheduleCalendarSettings();
        viewMode.value = 'day';
        autoSaveSettings.value = false;
      },
    });
  }

  function handleSettingsSaved(
    _visibleBrigadeIds: number[],
    defaultView?: ScheduleCalendarDefaultView,
    autoSave?: boolean
  ) {
    if (defaultView) viewMode.value = defaultView;
    if (autoSave !== undefined) autoSaveSettings.value = autoSave;
    if (defaultView === 'month') {
      calendarMonth.value = new Date();
      selectedDay.value = new Date();
    }
  }
</script>

<template>
  <div class="flex h-screen bg-surface-0 dark:bg-surface-950 overflow-hidden">
    <!-- Sidebar Menu -->
    <SidebarMenu />

    <!-- Main Content -->
    <div class="flex-1 overflow-y-auto p-1 md:p-6 w-full">
      <div class="w-full relative">
        <!-- Wspólne dla drag (miesiąc + tydzień): ghost i drag image muszą być w DOM -->
        <div
          ref="dragImageEl"
          class="absolute w-px h-px opacity-0 pointer-events-none -left-[9999px]"
          aria-hidden="true"
        />
        <div
          v-if="draggedTask"
          ref="ghostEl"
          class="fixed pointer-events-none z-9999 cursor-grabbing rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 shadow-lg p-2 min-w-[120px] max-w-[200px]"
          style="left: 0; top: 0"
        >
          <h3 class="text-sm font-bold text-surface-700 dark:text-surface-300 truncate">
            {{ draggedTask.title }}
          </h3>
        </div>
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
              <div class="h-6 w-px bg-surface-200 dark:bg-surface-700 shrink-0" aria-hidden="true" />
              <Button
                icon="pi pi-cog"
                text
                severity="secondary"
                class="text-xs!"
                title="Ustawienia"
                @click="showSettingsDialog = true"
              />
              <Button
                icon="pi pi-refresh"
                text
                severity="secondary"
                class="text-xs!"
                title="Resetuj konfigurację"
                @click="handleResetConfig($event)"
              />
            </div>
          </template>

          <template #center>
            <div class="flex items-center gap-3">
              <template v-if="viewMode === 'month'">
                <Button icon="pi pi-chevron-left" text rounded title="Poprzedni miesiąc" @click="prevMonth" />
                <div class="text-center min-w-[200px]">
                  <div class="text-lg font-bold text-surface-700 dark:text-surface-300">
                    {{ monthLabel }}
                  </div>
                  <div class="text-sm text-surface-600 dark:text-surface-400">Miesiąc</div>
                </div>
                <Button icon="pi pi-chevron-right" text rounded title="Następny miesiąc" @click="nextMonth" />
              </template>
              <template v-else-if="viewMode === 'week'">
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
                v-if="viewMode !== 'month'"
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

        <!-- Mobile Toolbar (zawsze widok dzień: nawigacja + Dodaj) -->
        <div
          v-if="isMobile"
          class="md:hidden bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg w-full mb-4 p-3"
        >
          <div class="flex items-center gap-2">
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
            <Button
              label="Dziś"
              outlined
              severity="secondary"
              size="small"
              class="rounded-lg shrink-0"
              title="Przejdź do dzisiejszej daty"
              @click="goToToday"
            />
            <Button icon="pi pi-plus" severity="success" text rounded class="text-xs" title="Dodaj" @click="onAdd" />
          </div>
        </div>

        <!-- Widok dzień: panele brygad z zadaniami + panel szczegółów (desktop) -->
        <template v-if="effectiveViewMode === 'day'">
          <div class="flex flex-col lg:flex-row gap-4">
            <div class="flex-1 min-w-0 space-y-4">
              <Panel
                v-for="brigade in visibleBrigades"
                :key="brigade.id"
                toggleable
                :collapsed="getTasksForBrigade(brigade.id).length === 0"
                class="bg-surface-50! dark:bg-surface-900! border border-surface-200 dark:border-surface-700"
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
                    :selectable="!isMobile"
                    @edit="onEditTask(task)"
                    @delete="e => onDeleteTask(task, e)"
                    @select="selectedTaskInDayView = task"
                  />
                </div>
              </Panel>
            </div>
            <div v-if="!isMobile" class="w-full lg:w-[380px] shrink-0 min-h-[300px]">
              <ScheduleTaskDetailPanel :task="selectedTaskInDayView" />
            </div>
          </div>
        </template>

        <!-- Widok tydzień: siatka brygady × dni robocze -->
        <div
          v-else-if="effectiveViewMode === 'week'"
          class="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900"
        >
          <div
            class="grid min-w-[800px]"
            :style="{ gridTemplateColumns: `minmax(28px, 0.25fr) repeat(6, minmax(140px, 1fr))` }"
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
              :class="[
                'border-b border-r border-surface-200 dark:border-surface-700 px-2 py-3 text-center text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors cursor-pointer last:border-r-0',
                isToday(day) ? 'bg-primary-400/20 dark:bg-primary-400/10' : 'bg-surface-50 dark:bg-surface-900',
              ]"
              @click="goToDay(day)"
            >
              <div class="text-sm font-semibold">{{ weekdayShortLabel(day) }}</div>
              <div class="text-lg font-bold">{{ day.getDate() }}</div>
            </button>
            <!-- Wiersze: brygada + komórki dni -->
            <template v-for="brigade in visibleBrigades" :key="brigade.id">
              <div
                class="border-b border-r border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 py-2 flex items-center justify-center"
              >
                <span
                  class="text-xs font-semibold uppercase tracking-wide text-surface-700 dark:text-surface-300 whitespace-nowrap inline-block origin-center"
                  style="writing-mode: vertical-rl; text-orientation: mixed; transform: rotate(180deg)"
                >
                  {{ brigade.name }}
                </span>
              </div>
              <div
                v-for="day in weekDays"
                :key="`${brigade.id}-${day.toISOString()}`"
                :class="[
                  'border-b border-r border-surface-200 dark:border-surface-700 p-2 min-h-[120px] last:border-r-0',
                  isToday(day) ? 'bg-primary-400/20 dark:bg-primary-400/10' : 'bg-surface-50 dark:bg-surface-900',
                ]"
                @dragover.prevent="onWeekCellDragOver($event, { brigadeId: brigade.id, date: day })"
                @drop="onWeekCellDrop($event, { brigadeId: brigade.id, date: day })"
              >
                <div class="flex flex-col gap-2">
                  <div
                    v-for="task in getTasksForBrigadeAndDay(brigade.id, day)"
                    :key="task.id"
                    :draggable="isSingleDayTask(task)"
                    class="shrink-0"
                    :class="{ 'cursor-grab': isSingleDayTask(task) }"
                    @dragstart="onTaskDragStart($event, task)"
                    @dragend="onTaskDragEnd"
                  >
                    <ScheduleTaskCard
                      :task="task"
                      compact
                      class="shrink-0"
                      @edit="onEditTask(task)"
                      @delete="e => onDeleteTask(task, e)"
                    />
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- Widok miesiąc: kalendarz + panel dnia -->
        <div v-else class="flex flex-col lg:flex-row gap-4">
          <div
            class="flex-1 min-w-0 overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900"
          >
            <div class="grid min-w-[600px]" style="grid-template-columns: repeat(7, 1fr)">
              <div
                v-for="w in 7"
                :key="w"
                class="border-b border-r border-surface-200 dark:border-surface-700 px-2 py-2 text-center text-xs font-semibold uppercase text-surface-600 dark:text-surface-400 bg-surface-100 dark:bg-surface-800 last:border-r-0"
              >
                {{ ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'][w - 1] }}
              </div>
              <div
                v-for="(cell, idx) in monthDays"
                :key="idx"
                :class="[
                  'border-b border-r border-surface-200 dark:border-surface-700 p-2 min-h-[100px] last:border-r-0',
                  !cell.isCurrentMonth && 'bg-surface-100/50 dark:bg-surface-800/50',
                  cell.isCurrentMonth && isToday(cell.date) && 'bg-primary-400/20 dark:bg-primary-400/10',
                  cell.isCurrentMonth && isSelectedDay(cell.date) && 'ring-2 ring-primary-500 ring-inset',
                ]"
                @dragover.prevent="onDayDragOver($event, cell)"
                @drop="onDayDrop($event, cell)"
              >
                <button
                  type="button"
                  class="w-full h-full flex flex-col items-stretch text-left"
                  @click="selectDay(cell.date)"
                >
                  <span
                    :class="[
                      'text-sm font-medium mb-1',
                      cell.isCurrentMonth
                        ? 'text-surface-700 dark:text-surface-300'
                        : 'text-surface-400 dark:text-surface-500',
                    ]"
                  >
                    {{ cell.date.getDate() }}
                  </span>
                  <div class="flex flex-col gap-1 overflow-y-auto">
                    <div
                      v-for="task in getTasksForDay(cell.date)"
                      :key="task.id"
                      :draggable="isSingleDayTask(task)"
                      class="shrink-0 max-w-full"
                      :class="{ 'cursor-grab': isSingleDayTask(task) }"
                      @dragstart="onTaskDragStart($event, task)"
                      @dragend="onTaskDragEnd"
                    >
                      <ScheduleTaskCard
                        :task="task"
                        minimal
                        class="shrink-0 max-w-full"
                        @edit="onEditTask(task)"
                        @delete="e => onDeleteTask(task, e)"
                      />
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
          <div class="w-full lg:w-[380px] shrink-0 min-h-[300px]">
            <ScheduleDayDetailPanel
              :selected-day="selectedDay"
              :selected-brigade-id="selectedBrigadeId"
              @update:selected-brigade-id="selectedBrigadeId = $event"
              @edit="onEditTask"
              @delete="onDeleteTask"
            />
          </div>
        </div>
      </div>

      <ConfirmPopup />
      <ScheduleTaskFormDialog
        v-model:visible="dialogVisible"
        :schedule-task="editingTask ?? undefined"
        :initial-date="currentDate"
        @close="onDialogClose"
      />
      <ScheduleCalendarSettingsDialog
        v-model:visible="showSettingsDialog"
        :default-view="viewMode"
        :auto-save-settings="autoSaveSettings"
        @saved="handleSettingsSaved"
      />
    </div>
  </div>
</template>
