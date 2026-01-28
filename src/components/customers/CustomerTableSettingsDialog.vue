<script setup lang="ts">
  import { ref, watch } from 'vue';
  import Dialog from 'primevue/dialog';
  import Select from 'primevue/select';
  import Checkbox from 'primevue/checkbox';
  import Popover from 'primevue/popover';
  import SecondaryButton from '@/components/SecondaryButton.vue';
  import PrimaryButton from '@/components/PrimaryButton.vue';
  import { ArrowsUpDownIcon, FunnelIcon, InformationCircleIcon } from '@heroicons/vue/24/outline';
  import { useSettingsStore } from '@/stores/settings';
  import type { CustomerTableFilter } from '@/types/Settings';

  const settingsStore = useSettingsStore();

  const props = withDefaults(
    defineProps<{
      visible: boolean;
      defaultSortField?: string;
      defaultSortOrder?: number;
      defaultFilter?: CustomerTableFilter;
      autoSaveSettings?: boolean;
    }>(),
    { autoSaveSettings: false }
  );

  const emit = defineEmits<{
    'update:visible': [value: boolean];
    saved: [
      defaultSortField?: string,
      defaultSortOrder?: number,
      defaultFilter?: CustomerTableFilter,
      autoSaveSettings?: boolean,
    ];
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
  const autoSaveChecked = ref(false);
  const infoPopover = ref();
  const autoSavePopover = ref();

  watch(
    () => props.visible,
    v => {
      if (v) {
        selectedSortField.value = props.defaultSortField ?? null;
        selectedSortOrder.value = props.defaultSortOrder ?? null;
        selectedFilter.value = props.defaultFilter ?? 'all';
        autoSaveChecked.value = props.autoSaveSettings ?? false;
      }
    },
    { immediate: true }
  );

  watch(selectedSortField, v => {
    if (!v) selectedSortOrder.value = null;
  });

  function handleSave() {
    const sortField = selectedSortField.value ?? undefined;
    const sortOrder = selectedSortOrder.value ?? undefined;
    const filter = selectedFilter.value;
    const autoSave = autoSaveChecked.value;
    settingsStore.saveCustomerTableSettings(sortField, sortOrder, filter, autoSave);
    emit('saved', sortField, sortOrder, filter, autoSave);
    emit('update:visible', false);
  }

  function handleCancel() {
    emit('update:visible', false);
    emit('close');
  }

  function toggleInfoPopover(event: Event) {
    infoPopover.value?.toggle(event);
  }

  function toggleAutoSavePopover(event: Event) {
    autoSavePopover.value?.toggle(event);
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
        <span class="text-lg font-semibold text-surface-700 dark:text-surface-300">Konfiguracja tabeli klientów</span>
        <button
          type="button"
          class="inline-flex items-center p-1 border-0 bg-transparent cursor-help"
          @click="toggleInfoPopover($event)"
        >
          <InformationCircleIcon
            class="w-7 h-7 text-gray-400 dark:text-gray-500 hover:text-primary-400 transition-colors"
          />
        </button>
        <Popover ref="infoPopover">
          <div class="p-3" style="max-width: 320px">
            <p class="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Jak działa konfiguracja?</p>
            <p class="text-xs text-surface-600 dark:text-surface-400 leading-relaxed">
              Te ustawienia określają wartości domyślne, które będą przywracane przy każdym otwarciu widoku klientów.
              Gdy „Zapisz ustawienia automatycznie” jest odznaczone – zmiany można zapisać tylko przez przycisk Zapisz w
              tym oknie. Gdy zaznaczone – zapis następuje także przy zmianie filtra w toolbarze oraz przy sortowaniu
              kolumn w tabeli.
            </p>
          </div>
        </Popover>
      </div>
    </template>

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

      <div class="flex flex-wrap items-center gap-2">
        <Checkbox v-model="autoSaveChecked" :binary="true" input-id="auto-save-settings" />
        <label
          for="auto-save-settings"
          class="text-sm font-medium text-surface-700 dark:text-surface-300 cursor-pointer"
        >
          Zapisz ustawienia automatycznie
        </label>
        <button
          type="button"
          class="inline-flex items-center p-1 border-0 bg-transparent cursor-help"
          aria-label="Wyjaśnienie"
          @click="toggleAutoSavePopover($event)"
        >
          <InformationCircleIcon
            class="w-5 h-5 text-gray-400 dark:text-gray-500 hover:text-primary-400 transition-colors"
          />
        </button>
        <Popover ref="autoSavePopover">
          <div class="p-3" style="max-width: 320px">
            <p class="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Zapisz ustawienia automatycznie
            </p>
            <p class="text-xs text-surface-600 dark:text-surface-400 leading-relaxed">
              Gdy zaznaczone – zmiana filtra w toolbarze oraz sortowanie kolumn w tabeli zapisują się od razu. Gdy
              odznaczone – zmiany są tylko widoczne w interfejsie; zapis następuje wyłącznie po kliknięciu „Zapisz” w
              tym oknie.
            </p>
          </div>
        </Popover>
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
