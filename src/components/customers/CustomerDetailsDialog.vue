<script setup lang="ts">
  import { ref, computed } from 'vue';
  import type { Customer } from '@/types/Customer.ts';
  import { UserIcon, MapPinIcon, PhoneIcon, EnvelopeIcon, DocumentTextIcon, BuildingOffice2Icon, CalendarIcon } from '@heroicons/vue/24/outline';
  import PrimaryButton from '@/components/PrimaryButton.vue';

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

  // Formatowanie daty
  const formatDate = (date?: Date | string): string => {
    if (!date) return '-';
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '-';
    }
  };

  // Funkcja do dzwonienia
  const handleCall = (phone: string) => {
    if (!phone) return;
    window.location.href = `tel:${phone.replace(/\s+/g, '')}`;
  };

  // Funkcja do wysyłania maila
  const handleEmail = (email: string) => {
    if (!email) return;
    window.location.href = `mailto:${email}`;
  };
</script>

<template>
  <Dialog v-model:visible="visible" modal :style="{ width: '600px' }" @hide="handleClose" :closable="true" :pt="{
    root: {
      class: '!bg-surface-0 dark:!bg-surface-950',
    },
  }">
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
            <UserIcon class="w-5 h-5 text-yellow-400" />
            <h3 class="text-xs font-medium text-surface-600 dark:text-surface-400 uppercase">Dane kontaktowe</h3>
          </div>
          <div class="space-y-3">
            <div>
              <label class="block text-xs text-surface-600 dark:text-surface-400 mb-2">Telefony</label>
              <div v-if="props.customer.phones && props.customer.phones.length > 0" class="space-y-1.5">
                <div
                  v-for="(phone, index) in props.customer.phones"
                  :key="index"
                  class="flex items-center gap-2 text-sm font-semibold text-surface-900 dark:text-surface-300"
                >
                  <button
                    type="button"
                    @click="handleCall(phone)"
                    class="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
                    title="Zadzwoń"
                  >
                    <PhoneIcon class="w-4 h-4 text-green-500" />
                    <span>{{ phone }}</span>
                  </button>
                </div>
              </div>
              <p v-else class="text-sm text-surface-500 dark:text-surface-400">-</p>
            </div>
            <div>
              <label class="block text-xs text-surface-600 dark:text-surface-400 mb-2">Emaile</label>
              <div v-if="props.customer.emails && props.customer.emails.length > 0" class="space-y-1.5">
                <div
                  v-for="(email, index) in props.customer.emails"
                  :key="index"
                  class="flex items-center gap-2 text-sm font-semibold text-surface-900 dark:text-surface-300"
                >
                  <button
                    type="button"
                    @click="handleEmail(email)"
                    class="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
                    title="Wyślij email"
                  >
                    <EnvelopeIcon class="w-4 h-4 text-blue-500" />
                    <span>{{ email }}</span>
                  </button>
                </div>
              </div>
              <p v-else class="text-sm text-surface-500 dark:text-surface-400">-</p>
            </div>
          </div>
        </div>

        <!-- Installation Address Card -->
        <div
          class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg p-4"
          v-if="props.customer.address"
        >
          <div class="flex items-center gap-2 mb-4">
            <MapPinIcon class="w-5 h-5 text-yellow-400" />
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

      <!-- Additional Information Section -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Person/Company Details Card -->
        <div class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg p-4">
          <div class="flex items-center gap-2 mb-4">
            <BuildingOffice2Icon
              v-if="props.customer.customerType === 'company'"
              class="w-5 h-5 text-yellow-400"
            />
            <UserIcon
              v-else
              class="w-5 h-5 text-yellow-400"
            />
            <h3 class="text-xs font-medium text-surface-600 dark:text-surface-400 uppercase">
              {{ props.customer.customerType === 'company' ? 'Dane firmy' : 'Dane osobowe' }}
            </h3>
          </div>
          <div class="space-y-3">
            <template v-if="props.customer.customerType === 'person'">
              <div>
                <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Imię</label>
                <p class="text-sm font-semibold text-surface-900 dark:text-surface-300">
                  {{ props.customer.firstName || '-' }}
                </p>
              </div>
              <div>
                <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Nazwisko</label>
                <p class="text-sm font-semibold text-surface-900 dark:text-surface-300">
                  {{ props.customer.lastName || '-' }}
                </p>
              </div>
            </template>
            <template v-else>
              <div>
                <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Nazwa firmy</label>
                <p class="text-sm font-semibold text-surface-900 dark:text-surface-300">
                  {{ props.customer.companyName || '-' }}
                </p>
              </div>
              <div>
                <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">NIP</label>
                <p class="text-sm font-semibold text-surface-900 dark:text-surface-300">
                  {{ props.customer.nip || '-' }}
                </p>
              </div>
              <div v-if="props.customer.regon">
                <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">REGON</label>
                <p class="text-sm font-semibold text-surface-900 dark:text-surface-300">
                  {{ props.customer.regon }}
                </p>
              </div>
              <div v-if="props.customer.krs">
                <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">KRS</label>
                <p class="text-sm font-semibold text-surface-900 dark:text-surface-300">
                  {{ props.customer.krs }}
                </p>
              </div>
            </template>
          </div>
        </div>

        <!-- Additional Info and Dates Card -->
        <div class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg p-4">
          <div class="flex items-center gap-2 mb-4">
            <DocumentTextIcon class="w-5 h-5 text-yellow-400" />
            <h3 class="text-xs font-medium text-surface-600 dark:text-surface-400 uppercase">Informacje dodatkowe</h3>
          </div>
          <div class="space-y-3">
            <div v-if="props.customer.info">
              <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Uwagi</label>
              <p class="text-sm font-semibold text-surface-900 dark:text-surface-300 whitespace-pre-wrap">
                {{ props.customer.info }}
              </p>
            </div>
            <div class="flex items-center gap-2 pt-2 border-t border-surface-200 dark:border-surface-700">
              <CalendarIcon class="w-4 h-4 text-surface-500 dark:text-surface-400" />
              <div class="flex-1">
                <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Utworzono</label>
                <p class="text-sm font-semibold text-surface-900 dark:text-surface-300">
                  {{ formatDate(props.customer.createdAt) }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <CalendarIcon class="w-4 h-4 text-surface-500 dark:text-surface-400" />
              <div class="flex-1">
                <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Ostatnia aktualizacja</label>
                <p class="text-sm font-semibold text-surface-900 dark:text-surface-300">
                  {{ formatDate(props.customer.updatedAt) }}
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
