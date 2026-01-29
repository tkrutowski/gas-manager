<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue';
  import Toolbar from 'primevue/toolbar';
  import Button from 'primevue/button';
  import SpeedDial from 'primevue/speeddial';
  import type { MenuItem } from 'primevue/menuitem';
  import moment from 'moment';
  import SidebarMenu from '@/components/SidebarMenu.vue';
  import { CalendarIcon } from '@heroicons/vue/24/outline';

  const dateFormatMain = new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const dateFormatWeekday = new Intl.DateTimeFormat('pl-PL', { weekday: 'long' });

  type ViewMode = 'day' | 'week' | 'month';

  const currentDate = ref<Date>(new Date());
  const viewMode = ref<ViewMode>('day');
  const isMobile = ref(false);

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

  const setViewMode = (mode: ViewMode) => {
    viewMode.value = mode;
  };

  const onAdd = () => {
    // placeholder
  };

  const onEdit = () => {
    // placeholder
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
    <div class="flex-1 overflow-y-auto p-6 w-full">
      <div class="w-full">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-12 h-12 bg-primary-400/20 rounded-lg flex items-center justify-center">
            <CalendarIcon class="w-6 h-6 text-primary-400" />
          </div>
          <h1 class="text-3xl font-bold text-surface-700 dark:text-surface-300">Terminarz</h1>
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

        <!-- Placeholder dla przyszłego komponentu kalendarza -->
        <div
          class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-12 text-center"
        >
          <CalendarIcon class="w-16 h-16 text-surface-400 dark:text-surface-600 mx-auto mb-4" />
          <h2 class="text-xl font-semibold text-surface-700 dark:text-surface-300 mb-2">Kalendarz zadań brygad</h2>
          <p class="text-surface-600 dark:text-surface-400">
            Komponent kalendarza zostanie tutaj dodany w przyszłości.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
