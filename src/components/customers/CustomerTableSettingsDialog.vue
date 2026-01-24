<script setup lang="ts">
  import { ref, watch } from 'vue';
  import Dialog from 'primevue/dialog';
  import Select from 'primevue/select';
  import SecondaryButton from '@/components/SecondaryButton.vue';
  import PrimaryButton from '@/components/PrimaryButton.vue';
  import { ArrowsUpDownIcon, FunnelIcon } from '@heroicons/vue/24/outline';
  import type { CustomerTableFilter } from '@/types/Settings';

  const props = defineProps<{
    visible: boolean;
    defaultSortField?: string;
    defaultSortOrder?: number;
    defaultFilter?: CustomerTableFilter;
  }>();

  const emit = defineEmits<{
    'update:visible': [value: boolean];
    saved: [defaultSortField?: string, defaultSortOrder?: number, defaultFilter?: CustomerTableFilter];
    close: [];
  }>();

  const sortColumnOptions = [
    { label: 'Nazwa', value: 'name' },
    { label: 'Adres', value: 'address' },
    { label: 'Typ klienta', value: 'customerType' },
    { label: 'Email', value: 'email' },
    { label: 'Telefon', value: 'phone' },
    { label: 'NIP', value: 'nip' },
    { label: 'REGON', value: 'regon' },
    { label: 'Status', value: 'status' },
    { label: 'Info', value: 'info' },
  ];

  const sortOrderOptions = [
    { label: 'Brak', value: null },
    { label: 'Rosnąco', value: 1 },
    { label: 'Malejąco', value: -1 },
  ];

  const filterOptions: { label: string; value: CustomerTableFilter }[] = [
    { label: 'Wszyscy', value: 'all' },
    { label: 'Aktywni', value: 'active' },
    { label: 'Nieaktywni', value: 'inactive' },
    { label: 'Ulubieni', value: 'favorites' },
  ];

  const selectedSortField = ref<string | null>(null);
  const selectedSortOrder = ref<number | null>(null);
  const selectedFilter = ref<CustomerTableFilter>('all');

  watch(
    () => props.visible,
    (v) => {
      if (v) {
        selectedSortField.value = props.defaultSortField ?? null;
        selectedSortOrder.value = props.defaultSortOrder ?? null;
        selectedFilter.value = props.defaultFilter ?? 'all';
      }
    },
    { immediate: true }
  );

  watch(selectedSortField, (v) => {
    if (!v) selectedSortOrder.value = null;
  });

  function handleSave() {
    emit('saved', selectedSortField.value ?? undefined, selectedSortOrder.value ?? undefined, selectedFilter.value);
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
    @update:visible="(val) => emit('update:visible', val)"
    modal
    closable
    :draggable="false"
    :style="{ width: '32rem' }"
    :breakpoints="{ '575px': '90vw' }"
    header="Konfiguracja tabeli klientów"
    class="p-fluid"
    :pt="{ root: { class: '!bg-surface-0 dark:!bg-surface-950' } }"
    @hide="handleCancel"
  >
    <div class="space-y-6">
      <div class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
        <h3 class="text-lg font-semibold text-surface-700 dark:text-surface-300 mb-4 flex items-center gap-2">
          <ArrowsUpDownIcon class="w-5 h-5 text-primary-400" />
          Domyślne sortowanie
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Kolumna</label>
            <Select
              v-model="selectedSortField"
              :options="sortColumnOptions"
              option-label="label"
              option-value="value"
              placeholder="Wybierz kolumnę..."
              show-clear
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Kierunek</label>
            <Select
              v-model="selectedSortOrder"
              :options="sortOrderOptions"
              option-label="label"
              option-value="value"
              placeholder="Wybierz kierunek..."
              class="w-full"
              :disabled="!selectedSortField"
            />
          </div>
        </div>
      </div>

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
