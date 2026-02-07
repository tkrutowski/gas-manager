<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { MapPinIcon, ClockIcon, EyeIcon } from '@heroicons/vue/24/outline';
  import { useGasConnectionsStore } from '@/stores/gasConnections';
  import { getPersonDisplayName } from '@/utils/tableFormatters';
  import LocationMap from '@/components/maps/LocationMap.vue';
  import CustomerDetailsDialog from '@/components/customers/CustomerDetailsDialog.vue';
  import type { ScheduleTask } from '@/types/ScheduleTask';
  import type { Customer } from '@/types/Customer';

  const props = defineProps<{
    task: ScheduleTask | null;
  }>();

  const gasConnectionsStore = useGasConnectionsStore();
  const customerDialogVisible = ref(false);
  const customerForDialog = ref<Customer | null>(null);

  const dateFormatFull = new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  });

  const timeFormat = new Intl.DateTimeFormat('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const dateFormatShort = new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });

  const dateTimeLabel = computed((): { dateStr: string; timeStr: string } => {
    if (!props.task) return { dateStr: '', timeStr: '' };
    const start = props.task.startDate instanceof Date ? props.task.startDate : new Date(props.task.startDate);
    const end = props.task.endDate instanceof Date ? props.task.endDate : new Date(props.task.endDate);
    const dateStr = dateFormatFull.format(start);
    const timeStr = `${timeFormat.format(start)} – ${timeFormat.format(end)}`;
    return { dateStr, timeStr };
  });

  const hasCoordinates = computed(() => {
    if (!props.task) return false;
    const lat = props.task.latitude;
    const lng = props.task.longitude;
    if (lat == null || lng == null) return false;
    const latNum = Number(lat);
    const lngNum = Number(lng);
    return !isNaN(latNum) && !isNaN(lngNum);
  });

  const addressText = computed(() => {
    if (!props.task || props.task.referenceType?.name !== 'GAS_CONNECTION') return '—';
    const gc = gasConnectionsStore.getGasConnection(props.task.referenceId);
    if (!gc?.address) return '—';
    const a = gc.address;
    const parts = [a.street, a.city].filter(Boolean);
    return parts.length ? parts.join(', ') : '—';
  });

  const gasConnection = computed(() => {
    if (!props.task || props.task.referenceType?.name !== 'GAS_CONNECTION') return null;
    return gasConnectionsStore.getGasConnection(props.task.referenceId);
  });

  const taskData = computed(() => {
    const gc = gasConnection.value;
    if (!gc) {
      return {
        customerName: '—',
        communeCity: '—',
        streetPlot: '—',
        taskNo: '—',
        contractNo: '—',
        sapUpNo: '—',
        contractDate: '—',
        designer: '—',
        coordinator: '—',
      };
    }
    const addr = gc.address;
    const communeCity = addr ? [addr.commune, addr.city].filter(Boolean).join(' / ') || '—' : '—';
    const streetPart = addr?.street || '—';
    const plotPart = gc.plots?.length > 0 ? gc.plots.map(p => `dz. ${p.plotNumber}`).join(', ') : '';
    const streetPlot = [streetPart, plotPart].filter(Boolean).join(' ') || '—';
    const contractDateStr = gc.contractDate ? dateFormatShort.format(new Date(gc.contractDate)) : '—';
    return {
      customerName: getPersonDisplayName(gc.customer) || '—',
      communeCity,
      streetPlot,
      taskNo: gc.taskNo || '—',
      contractNo: gc.contractNo || '—',
      sapUpNo: gc.sapUpNo || '—',
      contractDate: contractDateStr,
      designer: getPersonDisplayName(gc.designer) || '—',
      coordinator: getPersonDisplayName(gc.coordinator) || '—',
    };
  });

  const canShowCustomerDetails = computed(() => {
    const gc = gasConnection.value;
    return gc?.customer && gc.customer.id != null;
  });

  function goToCustomerDetails() {
    const gc = gasConnection.value;
    if (!gc?.customer) return;
    customerForDialog.value = gc.customer;
    customerDialogVisible.value = true;
  }
</script>

<template>
  <div
    class="flex flex-col h-full min-h-[300px] bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden"
  >
    <template v-if="!task">
      <div class="flex-1 flex items-center justify-center p-6 text-center text-surface-600 dark:text-surface-400">
        <p class="text-sm">Wybierz zadanie, klikając w kartę</p>
      </div>
    </template>

    <template v-else>
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <!-- Data i godzina -->
        <section>
          <div class="flex items-center gap-2 mb-2">
            <ClockIcon class="w-5 h-5 text-primary-400 shrink-0" />
            <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wide">
              Data i godzina
            </h3>
          </div>
          <p class="text-surface-700 dark:text-surface-300 font-medium">
            {{ dateTimeLabel.dateStr }}
          </p>
          <p class="text-surface-600 dark:text-surface-400 text-sm">
            {{ dateTimeLabel.timeStr }}
          </p>
        </section>

        <hr class="border-surface-200 dark:border-surface-700" />

        <!-- Lokalizacja -->
        <section>
          <div class="flex items-center gap-2 mb-2">
            <MapPinIcon class="w-5 h-5 text-primary-400 shrink-0" />
            <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wide">
              Lokalizacja
            </h3>
          </div>
          <div
            v-if="hasCoordinates"
            class="rounded-lg overflow-hidden border border-surface-200 dark:border-surface-700 h-[200px]"
          >
            <LocationMap :latitude="task.latitude!" :longitude="task.longitude!" :readonly="true" />
          </div>
          <div
            v-else
            class="flex flex-col items-center justify-center py-6 px-4 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800"
          >
            <MapPinIcon class="w-12 h-12 text-amber-400 dark:text-amber-500 mb-2 shrink-0" />
            <p class="text-center text-sm text-surface-700 dark:text-surface-300">
              {{ addressText }}
            </p>
          </div>
        </section>

        <hr class="border-surface-200 dark:border-surface-700" />

        <!-- Dane zadania -->
        <section>
          <h3
            class="text-base font-bold text-surface-700 dark:text-surface-300 mb-3 border-b border-surface-200 dark:border-surface-700 pb-2"
          >
            Dane Zadania
          </h3>

          <div class="space-y-3">
            <div>
              <p class="text-xs text-surface-500 dark:text-surface-500 mb-0.5">Nazwisko</p>
              <div class="flex items-center gap-2">
                <p class="text-surface-700 dark:text-surface-300 font-semibold">
                  {{ taskData.customerName }}
                </p>
                <button
                  v-if="canShowCustomerDetails"
                  type="button"
                  class="p-1.5 rounded-full hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                  title="Szczegóły klienta"
                  @click="goToCustomerDetails"
                >
                  <EyeIcon class="w-5 h-5 text-amber-400 dark:text-amber-400" />
                </button>
              </div>
            </div>

            <div>
              <p class="text-xs text-surface-500 dark:text-surface-500 mb-0.5">Gmina / Miasto</p>
              <p class="text-surface-700 dark:text-surface-300 font-semibold">
                {{ taskData.communeCity }}
              </p>
            </div>

            <div>
              <p class="text-xs text-surface-500 dark:text-surface-500 mb-0.5">Ulica, Działka</p>
              <p class="text-surface-700 dark:text-surface-300 font-semibold">
                {{ taskData.streetPlot }}
              </p>
            </div>

            <hr class="border-surface-200 dark:border-surface-700" />

            <div class="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <p class="text-xs text-surface-500 dark:text-surface-500 mb-0.5">Nr Zlecenia</p>
                <p class="text-amber-600 dark:text-amber-400 font-semibold">
                  {{ taskData.taskNo }}
                </p>
              </div>
              <div>
                <p class="text-xs text-surface-500 dark:text-surface-500 mb-0.5">Nr Umowy</p>
                <p class="text-surface-700 dark:text-surface-300 font-semibold">
                  {{ taskData.contractNo }}
                </p>
              </div>
              <div>
                <p class="text-xs text-surface-500 dark:text-surface-500 mb-0.5">Nr SAP/UP</p>
                <p class="text-surface-700 dark:text-surface-300 font-semibold">
                  {{ taskData.sapUpNo }}
                </p>
              </div>
              <div>
                <p class="text-xs text-surface-500 dark:text-surface-500 mb-0.5">Data Umowy</p>
                <p class="text-surface-700 dark:text-surface-300 font-semibold">
                  {{ taskData.contractDate }}
                </p>
              </div>
            </div>

            <hr class="border-surface-200 dark:border-surface-700" />

            <div>
              <p class="text-xs text-surface-500 dark:text-surface-500 mb-0.5">Projektant</p>
              <p class="text-surface-700 dark:text-surface-300 font-semibold">
                {{ taskData.designer }}
              </p>
            </div>
            <div>
              <p class="text-xs text-surface-500 dark:text-surface-500 mb-0.5">Koordynator</p>
              <p class="text-surface-700 dark:text-surface-300 font-semibold">
                {{ taskData.coordinator }}
              </p>
            </div>
          </div>
        </section>

        <hr class="border-surface-200 dark:border-surface-700" />

        <!-- Historia działań (placeholder) -->
        <section>
          <h3
            class="text-base font-bold text-surface-700 dark:text-surface-300 mb-2 border-b border-surface-200 dark:border-surface-700 pb-2"
          >
            Historia działań
          </h3>
          <p class="text-sm text-surface-500 dark:text-surface-500 italic">W przyszłości: informacje z audytu</p>
        </section>
      </div>
    </template>

    <CustomerDetailsDialog
      v-if="customerDialogVisible && customerForDialog"
      :customer="customerForDialog"
      @close="customerDialogVisible = false"
    />
  </div>
</template>
