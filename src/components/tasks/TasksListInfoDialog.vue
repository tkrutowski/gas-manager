<script setup lang="ts">
  import { computed } from 'vue';
  import Dialog from 'primevue/dialog';
  import SecondaryButton from '@/components/SecondaryButton.vue';
  import { UserIcon, PhoneIcon, MapPinIcon, DocumentTextIcon } from '@heroicons/vue/24/outline';
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
    if (!props.entity) return '';
    return `${props.entity.name} ${props.entity.lastName}`;
  });

  const hasAddress = computed(() => {
    return props.entity && 'address' in props.entity && props.entity.address;
  });

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
      <div class="flex items-center gap-2">
        <UserIcon class="w-6 h-6 text-yellow-400" />
        <span class="text-surface-700 dark:text-surface-300">{{ entityName }}</span>
      </div>
    </template>

    <div v-if="entity" class="space-y-6">
      <!-- Informacje podstawowe -->
      <div class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
        <h2 class="text-lg font-semibold text-surface-700 dark:text-surface-300 mb-4 flex items-center gap-2">
          <UserIcon class="w-5 h-5 text-primary-400" />
          Informacje podstawowe
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Imię</label>
            <p class="text-sm font-semibold text-surface-700 dark:text-surface-300">{{ entity.name || '-' }}</p>
          </div>
          <div>
            <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Nazwisko</label>
            <p class="text-sm font-semibold text-surface-700 dark:text-surface-300">{{ entity.lastName || '-' }}</p>
          </div>
          <div>
            <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Status</label>
            <p class="text-sm font-semibold text-surface-700 dark:text-surface-300">
              <span
                class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                :class="
                  entity.status
                    ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200'
                    : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200'
                "
              >
                {{ entity.status ? 'Aktywny' : 'Nieaktywny' }}
              </span>
            </p>
          </div>
          <div v-if="'employee' in entity">
            <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Pracownik</label>
            <p class="text-sm font-semibold text-surface-700 dark:text-surface-300">
              {{ entity.employee ? 'Tak' : 'Nie' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Kontakt -->
      <div class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
        <h2 class="text-lg font-semibold text-surface-700 dark:text-surface-300 mb-4 flex items-center gap-2">
          <PhoneIcon class="w-5 h-5 text-primary-400" />
          Kontakt
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Telefon</label>
            <p class="text-sm font-semibold text-surface-700 dark:text-surface-300">
              {{ entity.phone || '-' }}
            </p>
          </div>
          <div v-if="entity.phone2">
            <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Telefon 2</label>
            <p class="text-sm font-semibold text-surface-700 dark:text-surface-300">
              {{ entity.phone2 }}
            </p>
          </div>
          <div class="md:col-span-2">
            <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Email</label>
            <p class="text-sm font-semibold text-surface-700 dark:text-surface-300">
              {{ entity.email || '-' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Adres (jeśli dostępny) -->
      <div
        v-if="hasAddress"
        class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6"
      >
        <h2 class="text-lg font-semibold text-surface-700 dark:text-surface-300 mb-4 flex items-center gap-2">
          <MapPinIcon class="w-5 h-5 text-primary-400" />
          Adres
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Ulica</label>
            <p class="text-sm font-semibold text-surface-700 dark:text-surface-300">
              {{ 'address' in entity && entity.address ? entity.address.street || '-' : '-' }}
            </p>
          </div>
          <div>
            <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Miasto</label>
            <p class="text-sm font-semibold text-surface-700 dark:text-surface-300">
              {{ 'address' in entity && entity.address ? entity.address.city || '-' : '-' }}
            </p>
          </div>
          <div>
            <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Gmina</label>
            <p class="text-sm font-semibold text-surface-700 dark:text-surface-300">
              {{ 'address' in entity && entity.address ? entity.address.commune || '-' : '-' }}
            </p>
          </div>
          <div>
            <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1">Kod pocztowy</label>
            <p class="text-sm font-semibold text-surface-700 dark:text-surface-300">
              {{ 'address' in entity && entity.address ? entity.address.zip || '-' : '-' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Informacje dodatkowe -->
      <div
        v-if="entity.info"
        class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6"
      >
        <h2 class="text-lg font-semibold text-surface-700 dark:text-surface-300 mb-4 flex items-center gap-2">
          <DocumentTextIcon class="w-5 h-5 text-primary-400" />
          Informacje dodatkowe
        </h2>
        <div class="bg-surface-0 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg p-4">
          <p class="text-sm text-surface-700 dark:text-surface-300 whitespace-pre-wrap">{{ entity.info }}</p>
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
