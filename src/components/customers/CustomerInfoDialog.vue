<script setup lang="ts">
  import { computed } from 'vue';
  import { useRouter } from 'vue-router';
  import Dialog from 'primevue/dialog';
  import { useGasConnectionsStore } from '@/stores/gasConnections';
  import { formatAddress, formatPhase, getCustomerName } from '@/utils/tableFormatters';
  import type { Customer } from '@/types/Customer';
  import { BoltIcon, DocumentTextIcon, ClipboardDocumentIcon, UserIcon } from '@heroicons/vue/24/outline';
  import SecondaryButton from '@/components/SecondaryButton.vue';

  const props = defineProps<{
    customer: Customer | null;
    visible: boolean;
  }>();

  const emit = defineEmits<{
    'update:visible': [value: boolean];
    close: [];
  }>();

  const router = useRouter();
  const gasConnectionsStore = useGasConnectionsStore();

  const customerGasConnections = computed(() => {
    if (!props.customer) return [];
    return gasConnectionsStore.getAllGasConnections().filter(gc => gc.customer?.id === props.customer!.id);
  });

  const customerName = computed(() => {
    if (!props.customer) return '';
    return getCustomerName(props.customer);
  });

  function handleClose() {
    emit('update:visible', false);
    emit('close');
  }

  function handleConnectionClick(id: number) {
    router.push({
      name: 'gas-connection-details',
      query: { id: id.toString(), readonly: 'true' },
    });
    handleClose();
  }
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="val => emit('update:visible', val)"
    modal
    closable
    :draggable="false"
    :style="{ width: '800px' }"
    :breakpoints="{ '575px': '90vw' }"
    class="p-fluid"
    :pt="{ root: { class: '!bg-surface-0 dark:!bg-surface-950' } }"
    @hide="handleClose"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <UserIcon class="w-6 h-6 text-yellow-400" />
        <span class="text-surface-700 dark:text-surface-300">{{ customerName }}</span>
      </div>
    </template>
    <div class="space-y-6">
      <!-- PRZYŁĄCZA -->
      <div class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
        <h2 class="text-lg font-semibold text-surface-700 dark:text-surface-300 mb-4 flex items-center gap-2">
          <BoltIcon class="w-5 h-5 text-primary-400" />
          Przyłącza
        </h2>
        <div v-if="customerGasConnections.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="connection in customerGasConnections"
            :key="connection.id"
            @click="handleConnectionClick(connection.id)"
            class="bg-surface-0 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg p-4 hover:bg-surface-100 dark:hover:bg-surface-700 cursor-pointer transition-colors"
          >
            <div class="space-y-2">
              <div>
                <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Adres</label>
                <p class="text-sm font-semibold text-surface-700 dark:text-surface-300">
                  {{ formatAddress(connection.address) || '-' }}
                </p>
              </div>
              <div>
                <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Numer umowy</label>
                <p class="text-sm font-semibold text-surface-700 dark:text-surface-300">
                  {{ connection.contractNo || '-' }}
                </p>
              </div>
              <div>
                <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Status</label>
                <p class="text-sm font-semibold text-surface-700 dark:text-surface-300">
                  {{ formatPhase(connection.phase) }}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8">
          <p class="text-sm text-surface-600 dark:text-surface-400">Brak przyłączy dla tego klienta</p>
        </div>
      </div>

      <!-- FAKTURY -->
      <div class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
        <h2 class="text-lg font-semibold text-surface-700 dark:text-surface-300 mb-4 flex items-center gap-2">
          <DocumentTextIcon class="w-5 h-5 text-primary-400" />
          Faktury
        </h2>
        <div
          class="bg-surface-0 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg p-8 text-center"
        >
          <p class="text-sm text-surface-600 dark:text-surface-400">W przyszłości będą tutaj wyświetlane faktury</p>
        </div>
      </div>

      <!-- OFERTY -->
      <div class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
        <h2 class="text-lg font-semibold text-surface-700 dark:text-surface-300 mb-4 flex items-center gap-2">
          <ClipboardDocumentIcon class="w-5 h-5 text-primary-400" />
          Oferty
        </h2>
        <div
          class="bg-surface-0 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg p-8 text-center"
        >
          <p class="text-sm text-surface-600 dark:text-surface-400">W przyszłości będą tutaj wyświetlane oferty</p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <SecondaryButton type="button" text="Zamknij" size="lg" @click="handleClose" />
      </div>
    </template>
  </Dialog>
</template>
