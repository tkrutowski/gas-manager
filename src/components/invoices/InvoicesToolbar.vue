<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue';
  import Toolbar from 'primevue/toolbar';
  import Button from 'primevue/button';
  import InputText from 'primevue/inputtext';
  import IconField from 'primevue/iconfield';
  import InputIcon from 'primevue/inputicon';
  import type { Invoice } from '@/types/Invoice';
  import type { InvoiceTableFilter } from '@/types/Settings';

  withDefaults(
    defineProps<{
      selectedFilter: InvoiceTableFilter;
      selectedRow?: Invoice | null;
      globalSearchQuery?: string;
      showSearch?: boolean;
      showSettings?: boolean;
    }>(),
    {
      selectedRow: null,
      globalSearchQuery: '',
      showSearch: true,
      showSettings: true,
    }
  );

  const emit = defineEmits<{
    'filter-click': [filter: InvoiceTableFilter];
    new: [];
    edit: [];
    preview: [];
    delete: [event: Event];
    'clear-filter': [];
    'open-settings': [];
    'reset-config': [event: Event];
    'update:globalSearchQuery': [value: string];
  }>();

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
          title="Nowa faktura"
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
          title="Podgląd faktury"
          @click="emit('preview')"
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
          title="Wszystkie"
        />
        <Button
          icon="pi pi-check-circle"
          :outlined="selectedFilter !== 'paid'"
          :class="
            selectedFilter === 'paid'
              ? 'bg-green-600! text-white text-xs! border-0!'
              : 'text-xs! border-2! border-green-500! text-green-500!'
          "
          @click="emit('filter-click', 'paid')"
          title="Zapłacone"
        />
        <Button
          icon="pi pi-times-circle"
          :outlined="selectedFilter !== 'unpaid'"
          :class="
            selectedFilter === 'unpaid'
              ? 'bg-red-600! text-white text-xs! border-0!'
              : 'text-xs! border-2! border-red-500! text-red-500!'
          "
          @click="emit('filter-click', 'unpaid')"
          title="Niezapłacone"
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
</template>
