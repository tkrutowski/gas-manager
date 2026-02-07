<script setup lang="ts">
  import { ref, computed, watch } from 'vue';
  import Dialog from 'primevue/dialog';
  import MultiSelect from 'primevue/multiselect';
  import Select from 'primevue/select';
  import Checkbox from 'primevue/checkbox';
  import Popover from 'primevue/popover';
  import SecondaryButton from '@/components/SecondaryButton.vue';
  import PrimaryButton from '@/components/PrimaryButton.vue';
  import { UserGroupIcon, Squares2X2Icon, InformationCircleIcon } from '@heroicons/vue/24/outline';
  import { useSettingsStore } from '@/stores/settings';
  import { useBrigadesStore } from '@/stores/brigades';
  import type { Brigade } from '@/types/Brigade';
  import type { ScheduleCalendarDefaultView } from '@/types/Settings';

  const settingsStore = useSettingsStore();
  const brigadesStore = useBrigadesStore();

  const props = withDefaults(
    defineProps<{
      visible: boolean;
      defaultView?: ScheduleCalendarDefaultView;
      autoSaveSettings?: boolean;
    }>(),
    { autoSaveSettings: false }
  );

  const emit = defineEmits<{
    'update:visible': [value: boolean];
    saved: [
      visibleBrigadeIds: number[],
      defaultView?: ScheduleCalendarDefaultView,
      autoSaveSettings?: boolean,
    ];
    close: [];
  }>();

  const defaultViewOptions: { label: string; value: ScheduleCalendarDefaultView }[] = [
    { label: 'Dzień', value: 'day' },
    { label: 'Tydzień', value: 'week' },
    { label: 'Miesiąc', value: 'month' },
  ];

  const activeBrigades = computed(() => brigadesStore.getAllBrigades({ isActive: true }));
  const selectedBrigades = ref<Brigade[]>([]);
  const selectedDefaultView = ref<ScheduleCalendarDefaultView>('day');
  const autoSaveChecked = ref(false);
  const autoSavePopover = ref();

  watch(
    () => props.visible,
    v => {
      if (v) {
        const settings = settingsStore.getScheduleCalendarSettings();
        if (settings?.visibleBrigadeIds?.length) {
          selectedBrigades.value = activeBrigades.value.filter(b =>
            settings.visibleBrigadeIds!.includes(b.id)
          );
        } else {
          selectedBrigades.value = [...activeBrigades.value];
        }
        selectedDefaultView.value = settings?.defaultView ?? 'day';
        autoSaveChecked.value = settings?.autoSaveSettings ?? false;
      }
    },
    { immediate: true }
  );

  function handleSave() {
    const ids = selectedBrigades.value.map(b => b.id);
    const defaultView = selectedDefaultView.value;
    const autoSave = autoSaveChecked.value;
    settingsStore.saveScheduleCalendarSettings(ids, defaultView, autoSave);
    emit('saved', ids, defaultView, autoSave);
    emit('update:visible', false);
  }

  function handleCancel() {
    emit('update:visible', false);
    emit('close');
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
        <span class="text-lg font-semibold text-surface-700 dark:text-surface-300"
          >Ustawienia kalendarza</span
        >
      </div>
    </template>

    <div class="space-y-6">
      <div
        class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6"
      >
        <h3 class="text-lg font-semibold text-surface-700 dark:text-surface-300 mb-4 flex items-center gap-2">
          <Squares2X2Icon class="w-5 h-5 text-primary-400 shrink-0" />
          Domyślny widok
        </h3>
        <div>
          <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
            >Widok przy otwarciu terminarza</label
          >
          <Select
            v-model="selectedDefaultView"
            :options="defaultViewOptions"
            option-label="label"
            option-value="value"
            class="w-full"
          />
        </div>
      </div>

      <div
        class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6"
      >
        <h3 class="text-lg font-semibold text-surface-700 dark:text-surface-300 mb-4 flex items-center gap-2">
          <UserGroupIcon class="w-5 h-5 text-primary-400 shrink-0" />
          Wybierz brygady wyświetlane w kalendarzu
        </h3>
        <div>
          <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
            >Brygady</label
          >
          <MultiSelect
            v-model="selectedBrigades"
            :options="activeBrigades"
            option-label="name"
            placeholder="Wybierz brygady"
            display="chip"
            class="w-full"
            :filter="true"
            filter-placeholder="Szukaj..."
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
            class="w-5 h-5 text-surface-400 dark:text-surface-500 hover:text-primary-400 transition-colors"
          />
        </button>
        <Popover ref="autoSavePopover">
          <div class="p-3" style="max-width: 320px">
            <p class="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Zapisz ustawienia automatycznie
            </p>
            <p class="text-xs text-surface-600 dark:text-surface-400 leading-relaxed">
              Gdy zaznaczone – zmiana widoku (Dzień, Tydzień, Miesiąc) zapisuje się od razu jako domyślny. Gdy
              odznaczone – zapis następuje wyłącznie po kliknięciu „Zapisz” w tym oknie.
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
