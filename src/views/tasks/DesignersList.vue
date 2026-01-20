<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import SidebarMenu from '@/components/tasks/SidebarMenu.vue';
import DesignerFormDialog from '@/components/tasks/DesignerFormDialog.vue';
import PrimaryButton from '@/components/PrimaryButton.vue';
import { useDesignersStore } from '@/stores/designers';
import { useGasConnectionsStore } from '@/stores/gasConnections';
import type { Designer } from '@/types/Designer';
import { Phase } from '@/types/GasConnection';
import {
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  PencilIcon,
  PlusIcon,
} from '@heroicons/vue/24/outline';

const designersStore = useDesignersStore();
const gasConnectionsStore = useGasConnectionsStore();
const route = useRoute();
const router = useRouter();

type DesignerFilter = 'all' | 'active';

const selectedFilter = ref<DesignerFilter>('all');
const selectedDesignerId = ref<number | null>(null);
const showDialog = ref(false);
const designerForEdit = ref<Designer | null>(null);

const designers = ref<Designer[]>([]);

onMounted(() => {
  // Na razie dane są mockowane w store, więc tylko je pobieramy
  designers.value = designersStore.getAllDesigners();

  // Sprawdź czy otworzyć dialog z routingu
  if (route.path === '/tasks/designers/new') {
    openDialogForNew();
  }
});

// Obsługa zmiany routingu
watch(() => route.path, (newPath) => {
  if (newPath === '/tasks/designers/new') {
    openDialogForNew();
  }
});

const filteredDesigners = computed(() => {
  const base =
    selectedFilter.value === 'active'
      ? designersStore.getAllDesigners({ status: true })
      : designersStore.getAllDesigners();

  return base;
});

const selectedDesigner = computed<Designer | null>(() => {
  if (selectedDesignerId.value == null) return null;
  return (
    filteredDesigners.value.find(d => d.id === selectedDesignerId.value) ?? null
  );
});

const handleFilterChange = (filter: DesignerFilter) => {
  selectedFilter.value = filter;
  // Po zmianie filtra zostawiamy zaznaczenie tylko jeśli projektant nadal jest w zbiorze
  if (
    selectedDesignerId.value != null &&
    !filteredDesigners.value.some(d => d.id === selectedDesignerId.value)
  ) {
    selectedDesignerId.value = null;
  }
};

const toggleDesignerSelection = (designerId: number) => {
  if (selectedDesignerId.value === designerId) {
    selectedDesignerId.value = null;
  } else {
    selectedDesignerId.value = designerId;
  }
};

const getInitials = (designer: Designer) => {
  const first = designer.name?.[0] ?? '';
  const last = designer.lastName?.[0] ?? '';
  return `${first}${last}`.toUpperCase();
};

const getDesignerStats = (designerId: number) => {
  const allConnections = gasConnectionsStore
    .getAllGasConnections()
    .filter(gc => gc.designer?.id === designerId);

  const activeProjects = allConnections.filter(
    gc => gc.phase === Phase.PROJECT,
  );

  return {
    total: allConnections.length,
    active: activeProjects.length,
  };
};

const selectedDesignerStats = computed(() => {
  if (!selectedDesigner.value) {
    return {
      total: 0,
      active: 0,
    };
  }
  return getDesignerStats(selectedDesigner.value.id);
});

const handleCall = (designer: Designer) => {
  if (!designer.phone) return;
  window.location.href = `tel:${designer.phone.replace(/\s+/g, '')}`;
};

const handleEmail = (designer: Designer) => {
  if (!designer.email) return;
  window.location.href = `mailto:${designer.email}`;
};

const openDialogForNew = () => {
  designerForEdit.value = null;
  showDialog.value = true;
  // Zmień URL bez przeładowania strony
  if (route.path !== '/tasks/designers') {
    router.replace('/tasks/designers');
  }
};

const openDialogForEdit = (designer: Designer) => {
  designerForEdit.value = designer;
  showDialog.value = true;
};

const handleDialogClose = () => {
  showDialog.value = false;
  designerForEdit.value = null;
};

const handleDesignerAdded = () => {
  // Odśwież listę projektantów
  designers.value = designersStore.getAllDesigners();
  handleDialogClose();
};

const handleDesignerUpdated = (designer: Designer) => {
  // Odśwież listę projektantów
  designers.value = designersStore.getAllDesigners();
  // Jeśli zaktualizowany projektant był zaznaczony, odśwież zaznaczenie
  if (selectedDesignerId.value === designer.id) {
    selectedDesignerId.value = designer.id; // Trigger update
  }
  handleDialogClose();
};
</script>

<template>
  <div class="flex h-screen bg-surface-0 dark:bg-surface-950 overflow-hidden">
    <!-- Sidebar -->
    <SidebarMenu />

    <!-- Main content -->
    <div class="flex-1 overflow-y-auto p-6">
      <div class="max-w-7xl mx-auto space-y-6">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold text-surface-700 dark:text-surface-300">
              Projektanci
            </h1>
            <p class="text-sm text-surface-600 dark:text-surface-400">
              Wybierz projektanta, aby zobaczyć powiązane projekty.
            </p>
          </div>

          <div class="flex items-center gap-4">
            <!-- Filtry -->
            <div
              class="inline-flex rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden bg-surface-50 dark:bg-surface-900">
              <button type="button" class="px-4 py-2 text-sm font-medium transition-colors" :class="[
                selectedFilter === 'all'
                  ? 'bg-primary-400 text-black'
                  : 'text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800',
              ]" @click="handleFilterChange('all')">
                WSZYSCY
              </button>
              <button type="button"
                class="px-4 py-2 text-sm font-medium border-l border-surface-200 dark:border-surface-700 transition-colors"
                :class="[
                  selectedFilter === 'active'
                    ? 'bg-primary-400 text-black'
                    : 'text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800',
                ]" @click="handleFilterChange('active')">
                AKTYWNI
              </button>
            </div>

            <!-- Przycisk Nowy projektant -->
            <PrimaryButton type="button" size="md" :withIcon="true" @click="openDialogForNew">
              <PlusIcon class="w-5 h-5" />
              <span>Nowy Projektant</span>
            </PrimaryButton>
          </div>
        </div>

        <!-- Statystyki -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Suma projektów -->
          <div
            class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-4 flex flex-col justify-between">
            <div class="text-xs font-semibold tracking-widest text-surface-600 dark:text-surface-400">
              SUMA PROJEKTÓW
            </div>
            <div class="mt-3 flex items-end justify-between">
              <div>
                <div class="text-3xl font-bold text-surface-700 dark:text-surface-300">
                  {{ selectedDesignerStats.total }}
                </div>
                <div class="text-xs text-surface-500 dark:text-surface-400 mt-1">
                  {{ selectedDesigner ? 'Dla wybranego projektanta' : 'Wybierz projektanta z listy' }}
                </div>
              </div>
              <div class="text-xs text-green-400">
                <!-- Placeholder trend -->
                +12%
              </div>
            </div>
          </div>

          <!-- Aktywne projekty -->
          <div
            class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-4 flex flex-col justify-between">
            <div class="text-xs font-semibold tracking-widest text-surface-600 dark:text-surface-400">
              AKTYWNE PROJEKTY
            </div>
            <div class="mt-3 flex items-end justify-between">
              <div>
                <div class="text-3xl font-bold text-surface-700 dark:text-surface-300">
                  {{ selectedDesignerStats.active }}
                </div>
                <div class="text-xs text-surface-500 dark:text-surface-400 mt-1">
                  Faza PROJECT
                </div>
              </div>
              <div class="text-xs text-green-400">
                +5%
              </div>
            </div>
          </div>

          <!-- Placeholder 3 -->
          <div
            class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-4 flex flex-col justify-between opacity-70">
            <div class="text-xs font-semibold tracking-widest text-surface-600 dark:text-surface-400">
              PODMIOTY PRZYŁĄCZANE
            </div>
            <div class="mt-3 flex items-end justify-between">
              <div>
                <div class="text-3xl font-bold text-surface-700 dark:text-surface-300">
                  0
                </div>
                <div class="text-xs text-surface-500 dark:text-surface-400 mt-1">
                  Do ustalenia
                </div>
              </div>
              <div class="text-xs text-red-400">
                -2%
              </div>
            </div>
          </div>

          <!-- Placeholder 4 -->
          <div
            class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-4 flex flex-col justify-between opacity-70">
            <div class="text-xs font-semibold tracking-widest text-surface-600 dark:text-surface-400">
              ZAKOŃCZONE
            </div>
            <div class="mt-3 flex items-end justify-between">
              <div>
                <div class="text-3xl font-bold text-surface-700 dark:text-surface-300">
                  0
                </div>
                <div class="text-xs text-surface-500 dark:text-surface-400 mt-1">
                  Do ustalenia
                </div>
              </div>
              <div class="text-xs text-green-400">
                +8%
              </div>
            </div>
          </div>
        </div>

        <!-- Lista projektantów -->
        <div class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-4">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-surface-700 dark:text-surface-300">
              Lista projektantów
            </h2>
            <p class="text-xs text-surface-500 dark:text-surface-400">
              Kliknij kartę, aby zaznaczyć projektanta.
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ">
            <button v-for="designer in filteredDesigners" :key="designer.id" type="button"
              class="text-left rounded-2xl border transition-all duration-200 focus:outline-none" :class="[
                selectedDesignerId === designer.id
                  ? 'border-primary-400 ring-2 ring-primary-400/40 bg-surface-200 dark:bg-surface-700'
                  : 'border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 hover:border-primary-400/60 hover:bg-surface-100 dark:hover:bg-surface-800',
              ]" @click="toggleDesignerSelection(designer.id)">
              <div class="p-4 flex flex-col h-full">
                <!-- Top row: initials + status -->
                <div class="flex items-start justify-between mb-4">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                    :class="designer.status ? 'bg-green-600' : 'bg-red-600'">
                    {{ getInitials(designer) }}
                  </div>

                  <div class="text-right">
                    <div
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide"
                      :class="designer.status
                        ? 'bg-green-900/60 text-green-400 border border-green-700/60'
                        : 'bg-red-800/20 text-red-400 border border-red-700/60'">
                      {{ designer.status ? 'AKTYWNY' : 'NIEAKTYWNY' }}
                    </div>
                    <div class="mt-1 text-[10px] text-surface-500 dark:text-surface-400">
                      ID: {{ designer.id }}
                    </div>
                  </div>
                </div>

                <!-- Name & address -->
                <div class="mb-3">
                  <div class="text-sm font-semibold text-surface-900 dark:text-surface-50 mb-1">
                    {{ designer.name }} {{ designer.lastName }}
                  </div>
                  <div class="flex items-center gap-1 text-xs text-surface-500 dark:text-surface-400">
                    <MapPinIcon class="w-3.5 h-3.5" />
                    <span>
                      {{ designer.address?.city }},
                      {{ designer.address?.commune }}
                    </span>
                  </div>
                </div>

                <!-- Contact info -->
                <div class="space-y-1.5 text-xs text-surface-500 dark:text-surface-400 mb-4">
                  <div class="flex items-center gap-2">
                    <PhoneIcon class="w-4 h-4" />
                    <span class="truncate">
                      {{ designer.phone || 'Brak numeru telefonu' }}
                    </span>
                  </div>
                  <div class="flex items-center gap-2">
                    <EnvelopeIcon class="w-4 h-4" />
                    <span class="truncate">
                      {{ designer.email || 'Brak adresu email' }}
                    </span>
                  </div>
                </div>

                <!-- Buttons -->
                <div
                  class="mt-auto pt-3 border-t border-surface-200 dark:border-surface-700 flex items-center justify-between gap-2">
                  <button type="button"
                    class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-400 text-black hover:bg-primary-500 transition-colors"
                    @click.stop="openDialogForEdit(designer)">
                    <PencilIcon class="w-4 h-4" />
                    <span>Edytuj</span>
                  </button>

                  <div class="flex items-center gap-1.5">
                    <button type="button"
                      class="w-8 h-8 inline-flex items-center justify-center rounded-lg text-xs font-medium transition-colors"
                      :class="[
                        designer.phone
                          ? 'bg-green-700 text-white hover:bg-green-600'
                          : 'bg-surface-200 dark:bg-surface-800 text-surface-400 cursor-not-allowed',
                      ]" :disabled="!designer.phone" @click.stop="handleCall(designer)">
                      <PhoneIcon class="w-4 h-4" />
                    </button>
                    <button type="button"
                      class="w-8 h-8 inline-flex items-center justify-center rounded-lg text-xs font-medium transition-colors"
                      :class="[
                        designer.email
                          ? 'bg-sky-700 text-white hover:bg-sky-600'
                          : 'bg-surface-200 dark:bg-surface-800 text-surface-400 cursor-not-allowed',
                      ]" :disabled="!designer.email" @click.stop="handleEmail(designer)">
                      <EnvelopeIcon class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Dialog formularza projektanta -->
    <DesignerFormDialog v-model:visible="showDialog" :designer="designerForEdit" @close="handleDialogClose"
      @designer-added="handleDesignerAdded" @designer-updated="handleDesignerUpdated" />
  </div>
</template>
