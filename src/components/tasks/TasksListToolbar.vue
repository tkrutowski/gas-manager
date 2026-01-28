<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue';
  import Toolbar from 'primevue/toolbar';
  import Button from 'primevue/button';
  import InputText from 'primevue/inputtext';
  import IconField from 'primevue/iconfield';
  import InputIcon from 'primevue/inputicon';
  import SpeedDial from 'primevue/speeddial';
  import type { MenuItem } from 'primevue/menuitem';
  import type { TasksListFilter } from '@/types/Settings';

  const props = withDefaults(
    defineProps<{
      selectedFilter: TasksListFilter;
      selectedRow?: { id: number } | null;
      isSelectedFavorite?: boolean;
      globalSearchQuery?: string;
      showSearch?: boolean;
      showSettings?: boolean;
      newButtonLabel: string;
    }>(),
    {
      selectedRow: null,
      isSelectedFavorite: false,
      globalSearchQuery: '',
      showSearch: true,
      showSettings: true,
    }
  );

  const emit = defineEmits<{
    'filter-click': [filter: TasksListFilter];
    new: [];
    edit: [];
    delete: [event: Event];
    info: [];
    details: [];
    'toggle-favorite': [];
    'clear-filter': [];
    'open-settings': [];
    'reset-config': [event: Event];
    'update:globalSearchQuery': [value: string];
  }>();

  // Mobile detection
  const isMobile = ref(false);

  const checkMobile = () => {
    isMobile.value = window.innerWidth < 768; // md breakpoint
  };

  onMounted(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', checkMobile);
  });

  // SpeedDial model for actions
  const speedDialItems = computed<MenuItem[]>(() => {
    const items: MenuItem[] = [
      {
        label: props.newButtonLabel,
        icon: 'pi pi-plus',
        command: () => emit('new'),
        class: 'bg-green-50 dark:bg-green-900 text-green-600 dark:text-green-400',
      },
      {
        label: 'Edytuj',
        icon: 'pi pi-pencil',
        command: () => emit('edit'),
        disabled: !props.selectedRow,
        class: 'bg-primary-50 dark:bg-primary-900 text-primary dark:text-primary',
      },
      {
        label: 'Usuń',
        icon: 'pi pi-trash',
        command: e => emit('delete', e.originalEvent as Event),
        disabled: !props.selectedRow,
        class: 'bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-400',
      },
      {
        label: 'Szczegóły',
        icon: 'pi pi-eye',
        command: () => emit('details'),
        disabled: !props.selectedRow,
        class: 'bg-primary-50 dark:bg-primary-900 text-primary dark:text-primary',
      },
      {
        label: 'Informacje',
        icon: 'pi pi-clipboard',
        command: () => emit('info'),
        disabled: !props.selectedRow,
        class: 'bg-primary-50 dark:bg-primary-900 text-primary dark:text-primary',
      },
      {
        label: props.isSelectedFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych',
        icon: props.isSelectedFavorite ? 'pi pi-star-fill' : 'pi pi-star',
        command: () => emit('toggle-favorite'),
        disabled: !props.selectedRow,
        class: 'bg-primary-50 dark:bg-primary-900 text-primary dark:text-primary',
      },
    ];

    return items;
  });

  // SpeedDial model for filters
  const filterSpeedDialItems = computed<MenuItem[]>(() => {
    return [
      {
        label: 'Wszyscy',
        icon: 'pi pi-list-check',
        command: () => emit('filter-click', 'all'),
        class:
          props.selectedFilter === 'all'
            ? 'bg-primary-400 hover:bg-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600 text-black dark:text-black'
            : 'bg-surface-200 hover:bg-surface-300 dark:bg-surface-700 dark:hover:bg-surface-600 border-2 border-primary-500 text-primary-500 dark:text-primary-400',
      },
      {
        label: 'Aktywni',
        icon: 'pi pi-check-circle',
        command: () => emit('filter-click', 'active'),
        class:
          props.selectedFilter === 'active'
            ? 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white'
            : 'bg-surface-200 hover:bg-surface-300 dark:bg-surface-700 dark:hover:bg-surface-600 border-2 border-green-500 text-green-500 dark:text-green-400',
      },
      {
        label: 'Nieaktywni',
        icon: 'pi pi-times-circle',
        command: () => emit('filter-click', 'inactive'),
        class:
          props.selectedFilter === 'inactive'
            ? 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white'
            : 'bg-surface-200 hover:bg-surface-300 dark:bg-surface-700 dark:hover:bg-surface-600 border-2 border-red-500 text-red-500 dark:text-red-400',
      },
      {
        label: 'Ulubieni',
        icon: 'pi pi-star',
        command: () => emit('filter-click', 'favorites'),
        class:
          props.selectedFilter === 'favorites'
            ? 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800 text-white'
            : 'bg-surface-200 hover:bg-surface-300 dark:bg-surface-700 dark:hover:bg-surface-600 border-2 border-amber-500 text-amber-500 dark:text-amber-400',
      },
    ];
  });
</script>

<template>
  <!-- Desktop Toolbar -->
  <Toolbar
    v-if="!isMobile"
    class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg w-full mb-4"
  >
    <template #start>
      <div class="flex items-center gap-2">
        <Button
          icon="pi pi-plus"
          severity="success"
          text
          rounded
          class="text-xs"
          :title="newButtonLabel"
          @click="emit('new')"
        />
        <Button
          icon="pi pi-pencil"
          :disabled="!selectedRow"
          text
          rounded
          class="text-xs!"
          title="Edytuj"
          @click="emit('edit')"
        />
        <Button
          icon="pi pi-trash"
          severity="danger"
          :disabled="!selectedRow"
          text
          rounded
          class="text-xs!"
          title="Usuń"
          @click="emit('delete', $event)"
        />
        <div class="h-8 w-px bg-surface-300 dark:bg-surface-600 mx-1" />
        <Button
          icon="pi pi-eye"
          :disabled="!selectedRow"
          text
          rounded
          class="text-xs!"
          title="Pokaż szczegóły"
          @click="emit('details')"
        />
        <Button
          icon="pi pi-clipboard"
          :disabled="!selectedRow"
          text
          rounded
          class="text-xs!"
          title="Pokaż informacje"
          @click="emit('info')"
        />
        <Button
          :icon="isSelectedFavorite ? 'pi pi-star-fill' : 'pi pi-star'"
          text
          :disabled="!selectedRow"
          :title="isSelectedFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'"
          @click="emit('toggle-favorite')"
        />
      </div>
    </template>

    <template #center>
      <div class="flex items-center gap-1">
        <Button
          icon="pi pi-list-check"
          :outlined="selectedFilter !== 'all'"
          :class="
            selectedFilter === 'all'
              ? 'bg-primary-400 text-black text-xs! border-0!'
              : 'text-xs! border-2! border-primary-500! text-primary-500!'
          "
          @click="emit('filter-click', 'all')"
          title="Wszyscy"
        />
        <Button
          icon="pi pi-check-circle"
          :outlined="selectedFilter !== 'active'"
          :class="
            selectedFilter === 'active'
              ? 'bg-green-600! text-white text-xs! border-0!'
              : 'text-xs! border-2! border-green-500! text-green-500!'
          "
          @click="emit('filter-click', 'active')"
          title="Aktywni"
        />
        <Button
          icon="pi pi-times-circle"
          :outlined="selectedFilter !== 'inactive'"
          :class="
            selectedFilter === 'inactive'
              ? 'bg-red-600! text-white text-xs! border-0!'
              : 'text-xs! border-2! border-red-500! text-red-500!'
          "
          @click="emit('filter-click', 'inactive')"
          title="Nieaktywni"
        />
        <Button
          icon="pi pi-star"
          :outlined="selectedFilter !== 'favorites'"
          :class="
            selectedFilter === 'favorites'
              ? 'bg-amber-600! text-white text-xs! border-0!'
              : 'text-xs! border-2! border-amber-500! text-amber-500!'
          "
          @click="emit('filter-click', 'favorites')"
          title="Ulubieni"
        />
      </div>
    </template>

    <template #end>
      <div v-if="showSearch" class="flex items-center gap-2 mr-2">
        <IconField>
          <InputIcon>
            <i class="pi pi-search" />
          </InputIcon>
          <InputText
            :model-value="globalSearchQuery"
            @update:model-value="val => emit('update:globalSearchQuery', val as string)"
            placeholder="Wpisz tutaj szukaną frazę..."
            class="w-64 text-sm"
          />
        </IconField>
        <Button
          type="button"
          icon="pi pi-filter-slash"
          text
          outlined
          rounded
          @click="emit('clear-filter')"
          title="Wyczyść filtr"
          :disabled="!globalSearchQuery?.trim()"
        />
      </div>
      <div v-if="showSearch || showSettings" class="h-8 w-px bg-surface-300 dark:bg-surface-600 mx-1" />
      <div v-if="showSettings" class="flex items-center gap-2">
        <Button icon="pi pi-cog" text severity="secondary" title="Konfiguracja" @click="emit('open-settings')" />
        <Button
          icon="pi pi-refresh"
          text
          severity="secondary"
          title="Reset konfiguracji"
          @click="emit('reset-config', $event)"
        />
      </div>
    </template>
  </Toolbar>

  <!-- Mobile Toolbar -->
  <div
    v-if="isMobile"
    class="md:hidden bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg w-full mb-4 p-3"
  >
    <!-- SpeedDial buttons -->
    <div class="flex flex-row gap-3 relative">
      <SpeedDial
        :model="speedDialItems"
        :radius="120"
        type="quarter-circle"
        direction="down-right"
        :mask="true"
        class="absolute top-0 right-0 z-10"
      >
        <template #item="{ item }: any">
          <button
            :class="[
              'p-speeddial-action',
              'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
              item.class || '',
            ]"
            :disabled="item.disabled === true"
            @click="item.command && item.command({ originalEvent: $event, item })"
            :title="item.label"
          >
            <i :class="item.icon" class="text-lg"></i>
          </button>
        </template>
      </SpeedDial>
      <!-- Search field -->
      <div v-if="showSearch" class="flex items-center gap-2 flex-1">
        <IconField class="flex-1">
          <InputIcon>
            <i class="pi pi-search" />
          </InputIcon>
          <InputText
            :model-value="globalSearchQuery"
            @update:model-value="val => emit('update:globalSearchQuery', val as string)"
            placeholder="Wpisz..."
            class="w-full text-sm"
          />
        </IconField>
      </div>

      <SpeedDial
        :model="filterSpeedDialItems"
        :radius="120"
        type="quarter-circle"
        direction="down-left"
        :mask="false"
        class="absolute top-0 right-0"
      >
        <template #item="{ item }: any">
          <button
            :class="[
              'p-speeddial-action',
              'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
              item.class || '',
            ]"
            :disabled="item.disabled === true"
            @click="item.command && item.command({ originalEvent: $event, item })"
            :title="item.label"
          >
            <i :class="item.icon" class="text-lg"></i>
          </button>
        </template>
      </SpeedDial>
    </div>
  </div>
</template>
