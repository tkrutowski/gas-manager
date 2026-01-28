<script setup lang="ts">
  import { ref, computed } from 'vue';
  import type { Designer } from '@/types/Designer';
  import {
    UserIcon,
    MapPinIcon,
    PhoneIcon,
    EnvelopeIcon,
    DocumentTextIcon,
    BuildingOffice2Icon,
    CalendarIcon,
  } from '@heroicons/vue/24/outline';
  import PrimaryButton from '@/components/PrimaryButton.vue';

  const props = defineProps<{
    designer: Designer;
  }>();

  const emit = defineEmits<{
    close: [];
  }>();

  const visible = ref(true);

  const handleClose = () => {
    visible.value = false;
    emit('close');
  };

  // Inicjały projektanta (osoba/firma)
  const getInitials = computed(() => {
    const d = props.designer;
    if (d.designerType === 'person') {
      const first = (d.firstName ?? d.name ?? '').charAt(0).toUpperCase() || '';
      const last = d.lastName?.charAt(0).toUpperCase() || '';
      return first + last || '?';
    } else {
      const company = d.companyName || d.name || '';
      return company.substring(0, 2).toUpperCase() || '??';
    }
  });

  // Nazwa projektanta do wyświetlenia
  const designerName = computed(() => {
    const d = props.designer;
    if (d.designerType === 'person') {
      return `${d.firstName ?? d.name ?? ''} ${d.lastName ?? ''}`.trim() || '-';
    }
    return d.companyName || d.name || '-';
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

  const handleCall = (phone: string) => {
    if (!phone) return;
    window.location.href = `tel:${phone.replace(/\s+/g, '')}`;
  };

  const handleEmail = (email: string) => {
    if (!email) return;
    window.location.href = `mailto:${email}`;
  };
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :style="{ width: '600px' }"
    @hide="handleClose"
    :closable="true"
    :pt="{
      root: {
        class: '!bg-surface-0 dark:!bg-surface-950',
      },
    }"
  >
    <template #header>
      <div class="w-full">
        <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-300">Szczegóły Projektanta</h2>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Designer Overview Card -->
      <div
        class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg p-4 flex items-center gap-4"
      >
        <div class="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shrink-0">
          <span class="text-lg font-semibold text-black">{{ getInitials }}</span>
        </div>
        <div class="flex-1">
          <p class="text-xs text-surface-600 dark:text-surface-400 mb-1">
            {{ props.designer.designerType === 'person' ? 'OSOBA FIZYCZNA' : 'FIRMA' }}
          </p>
          <p class="text-xl font-bold text-surface-900 dark:text-surface-300">
            {{ designerName }}
          </p>
          <p
            v-if="props.designer.designerType === 'company' && props.designer.nip"
            class="text-sm text-surface-600 dark:text-surface-400 mt-1"
          >
            NIP: {{ props.designer.nip }}
          </p>
        </div>
        <div
          :class="[
            'flex items-center gap-2 px-3 py-1.5 rounded-full',
            props.designer.status ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700/50',
          ]"
        >
          <span :class="['w-2 h-2 rounded-full', props.designer.status ? 'bg-green-500' : 'bg-gray-500']"></span>
          <span
            :class="[
              'text-sm font-medium',
              props.designer.status ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-400',
            ]"
          >
            {{ props.designer.status ? 'Aktywny' : 'Nieaktywny' }}
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
              <div v-if="props.designer.phones && props.designer.phones.length > 0" class="space-y-1.5">
                <div
                  v-for="(phone, index) in props.designer.phones"
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
              <div v-if="props.designer.emails && props.designer.emails.length > 0" class="space-y-1.5">
                <div
                  v-for="(email, index) in props.designer.emails"
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

        <!-- Address Card -->
        <div
          class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg p-4"
          v-if="props.designer.address"
        >
          <div class="flex items-center gap-2 mb-4">
            <MapPinIcon class="w-5 h-5 text-yellow-400" />
            <h3 class="text-xs font-medium text-surface-600 dark:text-surface-400 uppercase">Adres</h3>
          </div>
          <div class="space-y-3">
            <div>
              <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Ulica i numer</label>
              <p class="text-sm font-semibold text-surface-900 dark:text-surface-300">
                {{ props.designer.address.street || '-' }}
              </p>
            </div>
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Miasto / Dzielnica</label>
                <p class="text-sm font-semibold text-surface-900 dark:text-surface-300">
                  {{ props.designer.address.city
                  }}{{
                    props.designer.address.commune
                      ? `,
                  ${props.designer.address.commune}`
                      : ''
                  }}
                </p>
              </div>
              <div>
                <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Kod pocztowy</label>
                <p class="text-sm font-semibold text-surface-900 dark:text-surface-300">
                  {{ props.designer.address.zip || '-' }}
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
            <BuildingOffice2Icon v-if="props.designer.designerType === 'company'" class="w-5 h-5 text-yellow-400" />
            <UserIcon v-else class="w-5 h-5 text-yellow-400" />
            <h3 class="text-xs font-medium text-surface-600 dark:text-surface-400 uppercase">
              {{ props.designer.designerType === 'company' ? 'Dane firmy' : 'Dane osobowe' }}
            </h3>
          </div>
          <div class="space-y-3">
            <template v-if="props.designer.designerType === 'person'">
              <div>
                <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Imię</label>
                <p class="text-sm font-semibold text-surface-900 dark:text-surface-300">
                  {{ props.designer.firstName ?? props.designer.name ?? '-' }}
                </p>
              </div>
              <div>
                <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Nazwisko</label>
                <p class="text-sm font-semibold text-surface-900 dark:text-surface-300">
                  {{ props.designer.lastName || '-' }}
                </p>
              </div>
            </template>
            <template v-else>
              <div>
                <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Nazwa firmy</label>
                <p class="text-sm font-semibold text-surface-900 dark:text-surface-300">
                  {{ props.designer.companyName ?? props.designer.name ?? '-' }}
                </p>
              </div>
              <div>
                <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">NIP</label>
                <p class="text-sm font-semibold text-surface-900 dark:text-surface-300">
                  {{ props.designer.nip || '-' }}
                </p>
              </div>
              <div v-if="props.designer.regon">
                <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">REGON</label>
                <p class="text-sm font-semibold text-surface-900 dark:text-surface-300">
                  {{ props.designer.regon }}
                </p>
              </div>
              <div v-if="props.designer.krs">
                <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">KRS</label>
                <p class="text-sm font-semibold text-surface-900 dark:text-surface-300">
                  {{ props.designer.krs }}
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
            <div v-if="props.designer.info">
              <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Uwagi</label>
              <p class="text-sm font-semibold text-surface-900 dark:text-surface-300 whitespace-pre-wrap">
                {{ props.designer.info }}
              </p>
            </div>
            <div class="flex items-center gap-2 pt-2 border-t border-surface-200 dark:border-surface-700">
              <CalendarIcon class="w-4 h-4 text-surface-500 dark:text-surface-400" />
              <div class="flex-1">
                <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Utworzono</label>
                <p class="text-sm font-semibold text-surface-900 dark:text-surface-300">
                  {{ formatDate(props.designer.createdAt) }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <CalendarIcon class="w-4 h-4 text-surface-500 dark:text-surface-400" />
              <div class="flex-1">
                <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Ostatnia aktualizacja</label>
                <p class="text-sm font-semibold text-surface-900 dark:text-surface-300">
                  {{ formatDate(props.designer.updatedAt) }}
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
