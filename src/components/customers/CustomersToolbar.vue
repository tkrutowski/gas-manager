<script setup lang="ts">
  import Toolbar from 'primevue/toolbar';
  import Button from 'primevue/button';
  import InputText from 'primevue/inputtext';
  import IconField from 'primevue/iconfield';
  import InputIcon from 'primevue/inputicon';
  import type { Customer } from '@/types/Customer';
  import type { CustomerTableFilter } from '@/types/Settings';

  const props = withDefaults(
    defineProps<{
      selectedFilter: CustomerTableFilter;
      selectedRow?: Customer | null;
      isSelectedFavorite?: boolean;
      globalSearchQuery?: string;
      showSearch?: boolean;
      showSettings?: boolean;
      showViewToggle?: boolean;
    }>(),
    {
      selectedRow: null,
      isSelectedFavorite: false,
      globalSearchQuery: '',
      showSearch: true,
      showSettings: true,
      showViewToggle: false,
    }
  );

  const emit = defineEmits<{
    'filter-click': [filter: CustomerTableFilter];
    'new': [];
    'edit': [];
    'delete': [event: Event];
    'info': [];
    'toggle-favorite': [];
    'clear-filter': [];
    'open-settings': [];
    'reset-config': [event: Event];
    'view-toggle': [];
    'update:globalSearchQuery': [value: string];
  }>();
</script>

<template>
  <Toolbar
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
          title="Nowy klient"
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
          icon="pi pi-clipboard"
          :disabled="!selectedRow"
          text
          rounded
          class="text-xs!"
          title="Pokaż informacje o kliencie (przyłącza, faktury, oferty)"
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
      <div class="flex items-center gap-2">
        <div class="h-8 w-px bg-surface-300 dark:bg-surface-600 mx-1" />
        <Button
          icon="pi pi-list"
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
        <div class="h-8 w-px bg-surface-300 dark:bg-surface-600 mx-1" />
        <Button
          v-if="showViewToggle"
          icon="pi pi-th-large"
          text
          severity="secondary"
          title="Przełącz widok"
          @click="emit('view-toggle')"
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
            @update:model-value="(val) => emit('update:globalSearchQuery', val as string)"
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
        <Button
          icon="pi pi-cog"
          text
          severity="secondary"
          title="Konfiguracja"
          @click="emit('open-settings')"
        />
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
</template>
