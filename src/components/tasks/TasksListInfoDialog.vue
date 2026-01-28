<script setup lang="ts">
  import { computed } from 'vue';
  import Dialog from 'primevue/dialog';
  import SecondaryButton from '@/components/SecondaryButton.vue';
  import {
    UserIcon,
    PhoneIcon,
    MapPinIcon,
    DocumentTextIcon,
    EnvelopeIcon,
    CalendarIcon,
  } from '@heroicons/vue/24/outline';
  import type { Designer, DesignerTraffic } from '@/types/Designer';
  import type { Coordinator } from '@/types/Coordinator';
  import type { Surveyor } from '@/types/Surveyor';

  const props = defineProps<{
    visible: boolean;
    entity: Designer | DesignerTraffic | Coordinator | Surveyor | null;
    entityType: 'designer' | 'designerTraffic' | 'coordinator' | 'surveyor';
  }>();

  const emit = defineEmits<{
    'update:visible': [value: boolean];
    close: [];
  }>();

  const entityName = computed(() => {
    const e = props.entity;
    if (!e) return '';
    return `${e.name} ${'lastName' in e ? (e.lastName ?? '') : ''}`.trim();
  });

  const hasAddress = computed(() => {
    return props.entity && 'address' in props.entity && props.entity.address;
  });

  const entityTypeLabel = computed(() => {
    switch (props.entityType) {
      case 'designer':
        return 'PROJEKTANT GAZU';
      case 'designerTraffic':
        return 'PROJEKTANT RUCHU';
      case 'coordinator':
        return 'KOORDYNATOR';
      case 'surveyor':
        return 'GEODETA';
      default:
        return 'OSOBA';
    }
  });

  const getInitials = computed(() => {
    const e = props.entity;
    if (!e) return '?';
    const first = e.name?.charAt(0).toUpperCase() || '';
    const last = 'lastName' in e && e.lastName ? e.lastName.charAt(0).toUpperCase() : '';
    return first + last || '?';
  });

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

  function handleClose() {
    emit('update:visible', false);
    emit('close');
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
      <div class="w-full">
        <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-300">Szczegóły – {{ entityTypeLabel }}</h2>
      </div>
    </template>

    <div v-if="entity" class="space-y-4">
      <!-- Overview Card -->
      <div
        class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg p-4 flex items-center gap-4"
      >
        <div class="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shrink-0">
          <span class="text-lg font-semibold text-black">{{ getInitials }}</span>
        </div>
        <div class="flex-1">
          <p class="text-xs text-surface-600 dark:text-surface-400 mb-1">
            {{ entityTypeLabel }}
          </p>
          <p class="text-xl font-bold text-surface-900 dark:text-surface-300">
            {{ entityName || '-' }}
          </p>
        </div>
        <div
          :class="[
            'flex items-center gap-2 px-3 py-1.5 rounded-full',
            entity.status ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700/50',
          ]"
        >
          <span :class="['w-2 h-2 rounded-full', entity.status ? 'bg-green-500' : 'bg-gray-500']"></span>
          <span
            :class="[
              'text-sm font-medium',
              entity.status ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-400',
            ]"
          >
            {{ entity.status ? 'Aktywny' : 'Nieaktywny' }}
          </span>
        </div>
      </div>

      <!-- Kontakt + Adres -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Kontakt -->
        <div class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg p-4">
          <div class="flex items-center gap-2 mb-4">
            <UserIcon class="w-5 h-5 text-yellow-400" />
            <h3 class="text-xs font-medium text-surface-600 dark:text-surface-400 uppercase">Dane kontaktowe</h3>
          </div>
          <div class="space-y-3">
            <div>
              <label class="block text-xs text-surface-600 dark:text-surface-400 mb-2">Telefony</label>
              <div v-if="entity.phones && entity.phones.length > 0" class="space-y-1.5">
                <div
                  v-for="(phone, index) in entity.phones"
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
              <div v-if="entity.emails && entity.emails.length > 0" class="space-y-1.5">
                <div
                  v-for="(email, index) in entity.emails"
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

        <!-- Adres -->
        <div
          class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg p-4"
          v-if="hasAddress"
        >
          <div class="flex items-center gap-2 mb-4">
            <MapPinIcon class="w-5 h-5 text-yellow-400" />
            <h3 class="text-xs font-medium text-surface-600 dark:text-surface-400 uppercase">Adres</h3>
          </div>
          <div class="space-y-3">
            <div>
              <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Ulica i numer</label>
              <p class="text-sm font-semibold text-surface-900 dark:text-surface-300">
                {{ 'address' in entity && entity.address ? entity.address.street || '-' : '-' }}
              </p>
            </div>
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Miasto / Gmina</label>
                <p class="text-sm font-semibold text-surface-900 dark:text-surface-300">
                  {{
                    'address' in entity && entity.address
                      ? `${entity.address.city || '-'}${entity.address.commune ? ', ' + entity.address.commune : ''}`
                      : '-'
                  }}
                </p>
              </div>
              <div>
                <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Kod pocztowy</label>
                <p class="text-sm font-semibold text-surface-900 dark:text-surface-300">
                  {{ 'address' in entity && entity.address ? entity.address.zip || '-' : '-' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Informacje dodatkowe + daty (jeśli dostępne) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg p-4">
          <div class="flex items-center gap-2 mb-4">
            <DocumentTextIcon class="w-5 h-5 text-yellow-400" />
            <h3 class="text-xs font-medium text-surface-600 dark:text-surface-400 uppercase">Informacje dodatkowe</h3>
          </div>
          <div class="space-y-3">
            <div v-if="entity.info">
              <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Uwagi</label>
              <p class="text-sm font-semibold text-surface-900 dark:text-surface-300 whitespace-pre-wrap">
                {{ entity.info }}
              </p>
            </div>
            <p v-else class="text-sm text-surface-500 dark:text-surface-400">Brak dodatkowych informacji</p>
          </div>
        </div>

        <div class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg p-4">
          <div class="flex items-center gap-2 mb-4">
            <CalendarIcon class="w-5 h-5 text-yellow-400" />
            <h3 class="text-xs font-medium text-surface-600 dark:text-surface-400 uppercase">Daty</h3>
          </div>
          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <CalendarIcon class="w-4 h-4 text-surface-500 dark:text-surface-400" />
              <div class="flex-1">
                <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Utworzono</label>
                <p class="text-sm font-semibold text-surface-900 dark:text-surface-300">
                  {{ 'createdAt' in entity ? formatDate(entity.createdAt as any) : '-' }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <CalendarIcon class="w-4 h-4 text-surface-500 dark:text-surface-400" />
              <div class="flex-1">
                <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Ostatnia aktualizacja</label>
                <p class="text-sm font-semibold text-surface-900 dark:text-surface-300">
                  {{ 'updatedAt' in entity ? formatDate(entity.updatedAt as any) : '-' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-8">
      <p class="text-surface-600 dark:text-surface-400">Brak danych do wyświetlenia</p>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <SecondaryButton type="button" text="Zamknij" size="lg" @click="handleClose" />
      </div>
    </template>
  </Dialog>
</template>
