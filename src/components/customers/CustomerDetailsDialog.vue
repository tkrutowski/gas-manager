<script setup lang="ts">
  import { ref, computed } from 'vue';
  import type { Customer } from '@/types/Customer.ts';
  import { UserIcon, MapPinIcon } from '@heroicons/vue/24/outline';

  const props = defineProps<{
    customer: Customer;
  }>();

  const emit = defineEmits<{
    close: [];
  }>();

  const visible = ref(true);

  const handleClose = () => {
    visible.value = false;
    emit('close');
  };

  // Funkcja do generowania inicjałów
  const getInitials = computed(() => {
    if (props.customer.customerType === 'person') {
      const first = props.customer.firstName?.charAt(0).toUpperCase() || '';
      const last = props.customer.lastName?.charAt(0).toUpperCase() || '';
      return first + last || '?';
    } else {
      const company = props.customer.companyName || '';
      return company.substring(0, 2).toUpperCase() || '??';
    }
  });

  // Nazwa klienta do wyświetlenia
  const customerName = computed(() => {
    if (props.customer.customerType === 'person') {
      return `${props.customer.firstName || ''} ${props.customer.lastName || ''}`.trim() || '-';
    } else {
      return props.customer.companyName || '-';
    }
  });
</script>

<template>
  <Dialog v-model:visible="visible" modal :style="{ width: '600px' }" @hide="handleClose" :closable="true">
    <template #header>
      <div class="w-full">
        <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-300">Szczegóły Klienta</h2>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Customer Overview Card -->
      <div
        class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg p-4 flex items-center gap-4"
      >
        <div class="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shrink-0">
          <span class="text-lg font-semibold text-black">{{ getInitials }}</span>
        </div>
        <div class="flex-1">
          <p class="text-xs text-surface-600 dark:text-surface-400 mb-1">
            {{ props.customer.customerType === 'person' ? 'OSOBA FIZYCZNA' : 'FIRMA' }}
          </p>
          <p class="text-xl font-bold text-surface-900 dark:text-surface-300">
            {{ customerName }}
          </p>
          <p
            v-if="props.customer.customerType === 'company' && props.customer.nip"
            class="text-sm text-surface-600 dark:text-surface-400 mt-1"
          >
            NIP: {{ props.customer.nip }}
          </p>
        </div>
        <div
          :class="[
            'flex items-center gap-2 px-3 py-1.5 rounded-full',
            props.customer.status ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700/50',
          ]"
        >
          <span :class="['w-2 h-2 rounded-full', props.customer.status ? 'bg-green-500' : 'bg-gray-500']"></span>
          <span
            :class="[
              'text-sm font-medium',
              props.customer.status ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-400',
            ]"
          >
            {{ props.customer.status ? 'Aktywny' : 'Nieaktywny' }}
          </span>
        </div>
      </div>

      <!-- Contact Details and Address Section -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Contact Details Card -->
        <div class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg p-4">
          <div class="flex items-center gap-2 mb-4">
            <UserIcon class="w-5 h-5 text-surface-600 dark:text-surface-400" />
            <h3 class="text-xs font-medium text-surface-600 dark:text-surface-400 uppercase">Dane kontaktowe</h3>
          </div>
          <div class="space-y-3">
            <div>
              <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Telefon</label>
              <p class="text-sm font-semibold text-surface-900 dark:text-surface-300">
                {{ props.customer.phone || '-' }}
              </p>
            </div>
            <div>
              <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Email</label>
              <p class="text-sm font-semibold text-surface-900 dark:text-surface-300">
                {{ props.customer.email || '-' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Installation Address Card -->
        <div
          class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg p-4"
          v-if="props.customer.address"
        >
          <div class="flex items-center gap-2 mb-4">
            <MapPinIcon class="w-5 h-5 text-surface-600 dark:text-surface-400" />
            <h3 class="text-xs font-medium text-surface-600 dark:text-surface-400 uppercase">Adres instalacji</h3>
          </div>
          <div class="space-y-3">
            <div>
              <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Ulica i numer</label>
              <p class="text-sm font-semibold text-surface-900 dark:text-surface-300">
                {{ props.customer.address.street || '-' }}
              </p>
            </div>
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Miasto / Dzielnica</label>
                <p class="text-sm font-semibold text-surface-900 dark:text-surface-300">
                  {{ props.customer.address.city
                  }}{{
                    props.customer.address.commune
                      ? `,
                                    ${props.customer.address.commune}`
                      : ''
                  }}
                </p>
              </div>
              <div>
                <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Kod pocztowy</label>
                <p class="text-sm font-semibold text-surface-900 dark:text-surface-300">
                  {{ props.customer.address.zip || '-' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <PrimaryButton type="button" @click="handleClose" title="Zamknij dialog" text="Zamknij" size="lg" />
      </div>
    </template>
  </Dialog>
</template>
