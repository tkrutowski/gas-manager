<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import SidebarMenu from '@/components/tasks/SidebarMenu.vue';
import CoordinatorFormDialog from '@/components/tasks/CoordinatorFormDialog.vue';
import PrimaryButton from '@/components/PrimaryButton.vue';
import { useCoordinatorsStore } from '@/stores/coordinators';
import { useGasConnectionsStore } from '@/stores/gasConnections';
import type { Coordinator } from '@/types/Coordinator';
import { Phase } from '@/types/GasConnection';
import {
  PhoneIcon,
  EnvelopeIcon,
  PencilIcon,
  PlusIcon,
} from '@heroicons/vue/24/outline';

const coordinatorsStore = useCoordinatorsStore();
const gasConnectionsStore = useGasConnectionsStore();
const route = useRoute();
const router = useRouter();

type CoordinatorFilter = 'all' | 'active';

const selectedFilter = ref<CoordinatorFilter>('all');
const selectedCoordinatorId = ref<number | null>(null);
const showDialog = ref(false);
const coordinatorForEdit = ref<Coordinator | null>(null);

const coordinators = ref<Coordinator[]>([]);

onMounted(() => {
  coordinators.value = coordinatorsStore.getAllCoordinators();

  if (route.path === '/tasks/coordinators/new') {
    openDialogForNew();
  }
});

watch(
  () => route.path,
  newPath => {
    if (newPath === '/tasks/coordinators/new') {
      openDialogForNew();
    }
  },
);

const filteredCoordinators = computed(() => {
  const base =
    selectedFilter.value === 'active'
      ? coordinatorsStore.getAllCoordinators({ status: true })
      : coordinatorsStore.getAllCoordinators();

  return base;
});

const selectedCoordinator = computed<Coordinator | null>(() => {
  if (selectedCoordinatorId.value == null) return null;
  return (
    filteredCoordinators.value.find(c => c.id === selectedCoordinatorId.value) ?? null
  );
});

const handleFilterChange = (filter: CoordinatorFilter) => {
  selectedFilter.value = filter;
  if (
    selectedCoordinatorId.value != null &&
    !filteredCoordinators.value.some(c => c.id === selectedCoordinatorId.value)
  ) {
    selectedCoordinatorId.value = null;
  }
};

const toggleSelection = (id: number) => {
  if (selectedCoordinatorId.value === id) {
    selectedCoordinatorId.value = null;
  } else {
    selectedCoordinatorId.value = id;
  }
};

const getInitials = (coordinator: Coordinator) => {
  const first = coordinator.name?.[0] ?? '';
  const last = coordinator.lastName?.[0] ?? '';
  return `${first}${last}`.toUpperCase();
};

const getCoordinatorStats = (coordinatorId: number) => {
  const allConnections = gasConnectionsStore
    .getAllGasConnections()
    .filter(gc => gc.coordinator?.id === coordinatorId);

  const activeProjects = allConnections.filter(gc => gc.phase === Phase.PROJECT);

  return {
    total: allConnections.length,
    active: activeProjects.length,
  };
};

const selectedCoordinatorStats = computed(() => {
  if (!selectedCoordinator.value) {
    return {
      total: 0,
      active: 0,
    };
  }
  return getCoordinatorStats(selectedCoordinator.value.id);
});

const handleCall = (coordinator: Coordinator) => {
  if (!coordinator.phone) return;
  window.location.href = `tel:${coordinator.phone.replace(/\s+/g, '')}`;
};

const handleEmail = (coordinator: Coordinator) => {
  if (!coordinator.email) return;
  window.location.href = `mailto:${coordinator.email}`;
};

const openDialogForNew = () => {
  coordinatorForEdit.value = null;
  showDialog.value = true;
  if (route.path !== '/tasks/coordinators') {
    router.replace('/tasks/coordinators');
  }
};

const openDialogForEdit = (coordinator: Coordinator) => {
  coordinatorForEdit.value = coordinator;
  showDialog.value = true;
};

const handleDialogClose = () => {
  showDialog.value = false;
  coordinatorForEdit.value = null;
};

const handleCoordinatorAdded = () => {
  coordinators.value = coordinatorsStore.getAllCoordinators();
  handleDialogClose();
};

const handleCoordinatorUpdated = (coordinator: Coordinator) => {
  coordinators.value = coordinatorsStore.getAllCoordinators();
  if (selectedCoordinatorId.value === coordinator.id) {
    selectedCoordinatorId.value = coordinator.id;
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
              Koordynatorzy
            </h1>
            <p class="text-sm text-surface-600 dark:text-surface-400">
              Wybierz koordynatora, aby zobaczyć powiązane projekty.
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

            <!-- Przycisk Nowy koordynator -->
            <PrimaryButton type="button" size="md" :withIcon="true" @click="openDialogForNew">
              <PlusIcon class="w-5 h-5" />
              <span>Nowy Koordynator</span>
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
                  {{ selectedCoordinatorStats.total }}
                </div>
                <div class="text-xs text-surface-500 dark:text-surface-400 mt-1">
                  {{ selectedCoordinator ? 'Dla wybranego koordynatora' : 'Wybierz koordynatora z listy' }}
                </div>
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
                  {{ selectedCoordinatorStats.active }}
                </div>
                <div class="text-xs text-surface-500 dark:text-surface-400 mt-1">
                  Faza PROJECT
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Lista koordynatorów -->
        <div class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-4">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-surface-700 dark:text-surface-300">
              Lista koordynatorów
            </h2>
            <p class="text-xs text-surface-500 dark:text-surface-400">
              Kliknij kartę, aby zaznaczyć koordynatora.
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <button v-for="coordinator in filteredCoordinators" :key="coordinator.id" type="button"
              class="text-left rounded-2xl border transition-all duration-200 focus:outline-none" :class="[
                selectedCoordinatorId === coordinator.id
                  ? 'border-primary-400 ring-2 ring-primary-400/40 bg-surface-200 dark:bg-surface-700'
                  : 'border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 hover:border-primary-400/60 hover:bg-surface-100 dark:hover:bg-surface-800',
              ]" @click="toggleSelection(coordinator.id)">
              <div class="p-4 flex flex-col h-full">
                <!-- Top row: initials + status -->
                <div class="flex items-start justify-between mb-4">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                    :class="coordinator.status ? 'bg-green-600' : 'bg-red-600'">
                    {{ getInitials(coordinator) }}
                  </div>

                  <div class="text-right">
                    <div
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide"
                      :class="coordinator.status
                        ? 'bg-green-900/60 text-green-400 border border-green-700/60'
                        : 'bg-red-800/20 text-red-400 border border-red-700/60'
                        ">
                      {{ coordinator.status ? 'AKTYWNY' : 'NIEAKTYWNY' }}
                    </div>
                    <div class="mt-1 text-[10px] text-surface-500 dark:text-surface-400">
                      ID: {{ coordinator.id }}
                    </div>
                  </div>
                </div>

                <!-- Name -->
                <div class="mb-3">
                  <div class="text-sm font-semibold text-surface-900 dark:text-surface-50 mb-1">
                    {{ coordinator.name }} {{ coordinator.lastName }}
                  </div>
                </div>

                <!-- Contact info -->
                <div class="space-y-1.5 text-xs text-surface-500 dark:text-surface-400 mb-4">
                  <div class="flex items-center gap-2">
                    <PhoneIcon class="w-4 h-4" />
                    <span class="truncate">
                      {{ coordinator.phone || 'Brak numeru telefonu' }}
                    </span>
                  </div>
                  <div class="flex items-center gap-2">
                    <EnvelopeIcon class="w-4 h-4" />
                    <span class="truncate">
                      {{ coordinator.email || 'Brak adresu email' }}
                    </span>
                  </div>
                </div>

                <!-- Buttons -->
                <div
                  class="mt-auto pt-3 border-t border-surface-200 dark:border-surface-700 flex items-center justify-between gap-2">
                  <button type="button"
                    class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-400 text-black hover:bg-primary-500 transition-colors"
                    @click.stop="openDialogForEdit(coordinator)">
                    <PencilIcon class="w-4 h-4" />
                    <span>Edytuj</span>
                  </button>

                  <div class="flex items-center gap-1.5">
                    <button type="button"
                      class="w-8 h-8 inline-flex items-center justify-center rounded-lg text-xs font-medium transition-colors"
                      :class="[
                        coordinator.phone
                          ? 'bg-green-700 text-white hover:bg-green-600'
                          : 'bg-surface-200 dark:bg-surface-800 text-surface-400 cursor-not-allowed',
                      ]" :disabled="!coordinator.phone" @click.stop="handleCall(coordinator)">
                      <PhoneIcon class="w-4 h-4" />
                    </button>
                    <button type="button"
                      class="w-8 h-8 inline-flex items-center justify-center rounded-lg text-xs font-medium transition-colors"
                      :class="[
                        coordinator.email
                          ? 'bg-sky-700 text-white hover:bg-sky-600'
                          : 'bg-surface-200 dark:bg-surface-800 text-surface-400 cursor-not-allowed',
                      ]" :disabled="!coordinator.email" @click.stop="handleEmail(coordinator)">
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

    <!-- Dialog formularza koordynatora -->
    <CoordinatorFormDialog v-model:visible="showDialog" :coordinator="coordinatorForEdit" @close="handleDialogClose"
      @coordinator-added="handleCoordinatorAdded" @coordinator-updated="handleCoordinatorUpdated" />
  </div>
</template>
