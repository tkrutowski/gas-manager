<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import SidebarMenu from '@/components/SidebarMenu.vue';
  import CoordinatorFormDialog from '@/components/tasks/coordinators/CoordinatorFormDialog.vue';
  import TasksListToolbar from '@/components/tasks/TasksListToolbar.vue';
  import TasksListSettingsDialog from '@/components/tasks/TasksListSettingsDialog.vue';
  import TasksListInfoDialog from '@/components/tasks/TasksListInfoDialog.vue';
  import DataView from 'primevue/dataview';
  import Button from 'primevue/button';
  import ConfirmPopup from 'primevue/confirmpopup';
  import { useConfirm } from 'primevue/useconfirm';
  import { useCoordinatorsStore } from '@/stores/coordinators';
  import { useGasConnectionsStore } from '@/stores/gasConnections';
  import { useSettingsStore } from '@/stores/settings';
  import type { Coordinator } from '@/types/Coordinator';
  import type { TasksListFilter } from '@/types/Settings';
  import { Phase } from '@/types/GasConnection';
  import { PhoneIcon, EnvelopeIcon, EyeIcon } from '@heroicons/vue/24/outline';

  const coordinatorsStore = useCoordinatorsStore();
  const gasConnectionsStore = useGasConnectionsStore();
  const settingsStore = useSettingsStore();
  const confirm = useConfirm();
  const route = useRoute();
  const router = useRouter();

  const MODULE_NAME = 'coordinatorTable' as const;

  const selectedFilter = ref<TasksListFilter>('all');
  const selectedCoordinatorId = ref<number | null>(null);
  const globalSearchQuery = ref('');
  const showDialog = ref(false);
  const showSettingsDialog = ref(false);
  const showInfoDialog = ref(false);
  const coordinatorForEdit = ref<Coordinator | null>(null);

  const coordinators = ref<Coordinator[]>([]);

  onMounted(() => {
    coordinators.value = coordinatorsStore.getAllCoordinators();

    const settings = settingsStore.getTasksListTableSettings(MODULE_NAME);
    if (settings?.defaultFilter) {
      selectedFilter.value = settings.defaultFilter;
    }

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
    }
  );

  const favoriteIds = computed(() => settingsStore.getTasksListFavoriteIds(MODULE_NAME));

  const filteredCoordinators = computed(() => {
    let base: Coordinator[] = [];

    switch (selectedFilter.value) {
      case 'active':
        base = coordinatorsStore.getAllCoordinators({ status: true });
        break;
      case 'inactive':
        base = coordinatorsStore.getAllCoordinators({ status: false });
        break;
      case 'favorites':
        base = coordinatorsStore.getAllCoordinators().filter(c => favoriteIds.value.includes(c.id));
        break;
      default:
        base = coordinatorsStore.getAllCoordinators();
        break;
    }

    if (globalSearchQuery.value.trim()) {
      base = coordinatorsStore.searchCoordinators(globalSearchQuery.value.trim()).filter(c =>
        base.some(bc => bc.id === c.id)
      );
    }

    return base;
  });

  const selectedCoordinator = computed<Coordinator | null>(() => {
    if (selectedCoordinatorId.value == null) return null;
    return filteredCoordinators.value.find(c => c.id === selectedCoordinatorId.value) ?? null;
  });

  const isSelectedFavorite = computed(() => {
    if (!selectedCoordinator.value) return false;
    return favoriteIds.value.includes(selectedCoordinator.value.id);
  });

  const handleFilterChange = (filter: TasksListFilter) => {
    selectedFilter.value = filter;
    if (selectedCoordinatorId.value != null && !filteredCoordinators.value.some(c => c.id === selectedCoordinatorId.value)) {
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
      return { total: 0, active: 0 };
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
    if (route.path !== '/tasks/coordinators/grid' && route.path !== '/tasks/coordinators/list') {
      router.replace('/tasks/coordinators/grid');
    }
  };

  const openDialogForEdit = (coordinator?: Coordinator) => {
    if (coordinator) {
      coordinatorForEdit.value = coordinator;
    } else if (selectedCoordinator.value) {
      coordinatorForEdit.value = selectedCoordinator.value;
    } else {
      return;
    }
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

  const handleDelete = (event: Event) => {
    if (!selectedCoordinator.value) return;

    confirm.require({
      target: event.currentTarget as HTMLElement,
      message: `Czy na pewno chcesz usunąć koordynatora "${selectedCoordinator.value.name} ${selectedCoordinator.value.lastName}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Tak',
      rejectLabel: 'Nie',
      accept: () => {
        const success = coordinatorsStore.deleteCoordinator(selectedCoordinator.value!.id, false);
        if (success) {
          coordinators.value = coordinatorsStore.getAllCoordinators();
          selectedCoordinatorId.value = null;
        }
      },
    });
  };

  const handleInfo = () => {
    if (selectedCoordinator.value) {
      showInfoDialog.value = true;
    }
  };

  const handleOpenDetails = (coordinator: Coordinator) => {
    selectedCoordinatorId.value = coordinator.id;
    showInfoDialog.value = true;
  };

  const handleToggleFavorite = () => {
    if (!selectedCoordinator.value) return;
    const id = selectedCoordinator.value.id;
    if (isSelectedFavorite.value) {
      settingsStore.removeTasksListFavorite(MODULE_NAME, id);
    } else {
      settingsStore.addTasksListFavorite(MODULE_NAME, id);
    }
  };

  const handleClearFilter = () => {
    globalSearchQuery.value = '';
  };

  const handleOpenSettings = () => {
    showSettingsDialog.value = true;
  };

  const handleResetConfig = () => {
    settingsStore.resetTasksListTableSettings(MODULE_NAME);
    selectedFilter.value = 'all';
    globalSearchQuery.value = '';
    coordinators.value = coordinatorsStore.getAllCoordinators();
  };

  const handleSettingsSaved = (defaultFilter?: TasksListFilter) => {
    if (defaultFilter) {
      selectedFilter.value = defaultFilter;
    }
  };
</script>

<template>
  <div class="flex h-screen bg-surface-0 dark:bg-surface-950 overflow-hidden">
    <!-- Sidebar -->
    <SidebarMenu />

    <!-- Main content -->
    <div class="flex-1 overflow-hidden p-1 md:p-6">
      <div class="max-w-full mx-auto space-y-6">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold text-surface-700 dark:text-surface-300">Koordynatorzy</h1>
            <p class="text-sm text-surface-600 dark:text-surface-400">
              Wybierz koordynatora, aby zobaczyć powiązane projekty.
            </p>
          </div>
          <div class="hidden md:flex items-center gap-2">
            <router-link to="/tasks/coordinators/list">
              <Button
                icon="pi pi-list"
                text
                severity="primary"
                title="Przełącz na widok listy"
                class="list-view-button"
              />
            </router-link>
          </div>
        </div>

        <!-- Toolbar -->
        <TasksListToolbar
          :selected-filter="selectedFilter"
          :selected-row="selectedCoordinator ? { id: selectedCoordinator.id } : null"
          :is-selected-favorite="isSelectedFavorite"
          v-model:global-search-query="globalSearchQuery"
          new-button-label="Nowy koordynator"
          @filter-click="handleFilterChange"
          @new="openDialogForNew"
          @edit="openDialogForEdit()"
          @delete="handleDelete"
          @info="handleInfo"
          @toggle-favorite="handleToggleFavorite"
          @clear-filter="handleClearFilter"
          @open-settings="handleOpenSettings"
          @reset-config="handleResetConfig"
        />

        <!-- Statystyki -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Suma projektów -->
          <div
            class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-4 flex flex-col justify-between"
          >
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
            class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-4 flex flex-col justify-between"
          >
            <div class="text-xs font-semibold tracking-widest text-surface-600 dark:text-surface-400">
              AKTYWNE PROJEKTY
            </div>
            <div class="mt-3 flex items-end justify-between">
              <div>
                <div class="text-3xl font-bold text-surface-700 dark:text-surface-300">
                  {{ selectedCoordinatorStats.active }}
                </div>
                <div class="text-xs text-surface-500 dark:text-surface-400 mt-1">Faza PROJECT</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Lista koordynatorów -->
        <div
          class="bg-surface-0 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-xl p-1 md:p-6"
        >
          <DataView :value="filteredCoordinators" layout="grid" :data-key="'id'">
            <template #grid="slotProps">
              <div class="overflow-y-auto" style="max-height: calc(100vh - 320px);">
                <div class="grid gap-4" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
                  <button
                    v-for="coordinator in slotProps.items"
                    :key="coordinator.id"
                    type="button"
                    class="text-left rounded-2xl border transition-all duration-200 focus:outline-none"
                    :class="[
                      selectedCoordinatorId === coordinator.id
                        ? 'border-primary-400 ring-2 ring-primary-400/40 bg-surface-200 dark:bg-surface-700'
                        : 'border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 hover:border-primary-400/60 hover:bg-surface-100 dark:hover:bg-surface-800',
                    ]"
                    @click="toggleSelection(coordinator.id)"
                  >
                    <div class="p-4 flex flex-col h-full">
                      <!-- Top row: initials + status -->
                      <div class="flex items-start justify-between mb-4">
                        <div
                          class="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                          :class="coordinator.status ? 'bg-green-600' : 'bg-red-600'"
                        >
                          {{ getInitials(coordinator) }}
                        </div>

                        <div class="text-right">
                          <div
                            class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide"
                            :class="
                              coordinator.status
                                ? 'bg-green-900/60 text-green-400 border border-green-700/60'
                                : 'bg-red-800/20 text-red-400 border border-red-700/60'
                            "
                          >
                            {{ coordinator.status ? 'AKTYWNY' : 'NIEAKTYWNY' }}
                          </div>
                          <div class="mt-1 text-[10px] text-surface-500 dark:text-surface-400">ID: {{ coordinator.id }}</div>
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
                        class="mt-auto pt-3 border-t border-surface-200 dark:border-surface-700 flex items-center justify-between gap-1.5"
                      >
                        <button
                          type="button"
                          class="w-8 h-8 inline-flex items-center justify-center rounded-lg text-xs font-medium transition-colors bg-primary-500 text-surface-900 hover:bg-primary-600 cursor-pointer"
                          title="Zobacz szczegóły"
                          @click.stop="handleOpenDetails(coordinator)"
                        >
                          <EyeIcon class="w-4 h-4" />
                        </button>
                        <div class="flex items-center gap-1.5">
                          <button
                            type="button"
                            class="w-8 h-8 inline-flex items-center justify-center rounded-lg text-xs font-medium transition-colors"
                            :class="[
                              coordinator.phone
                                ? 'bg-green-700 text-white hover:bg-green-600'
                                : 'bg-surface-200 dark:bg-surface-800 text-surface-400 cursor-not-allowed',
                            ]"
                            :disabled="!coordinator.phone"
                            @click.stop="handleCall(coordinator)"
                          >
                            <PhoneIcon class="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            class="w-8 h-8 inline-flex items-center justify-center rounded-lg text-xs font-medium transition-colors"
                            :class="[
                              coordinator.email
                                ? 'bg-sky-700 text-white hover:bg-sky-600'
                                : 'bg-surface-200 dark:bg-surface-800 text-surface-400 cursor-not-allowed',
                            ]"
                            :disabled="!coordinator.email"
                            @click.stop="handleEmail(coordinator)"
                          >
                            <EnvelopeIcon class="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </template>
          </DataView>
        </div>
      </div>
    </div>

    <!-- Dialog formularza koordynatora -->
    <CoordinatorFormDialog
      v-model:visible="showDialog"
      :coordinator="coordinatorForEdit"
      @close="handleDialogClose"
      @coordinator-added="handleCoordinatorAdded"
      @coordinator-updated="handleCoordinatorUpdated"
    />

    <!-- Dialog ustawień -->
    <TasksListSettingsDialog
      v-model:visible="showSettingsDialog"
      :module-name="MODULE_NAME"
      :default-filter="selectedFilter"
      @saved="handleSettingsSaved"
    />

    <!-- Dialog informacji -->
    <TasksListInfoDialog
      v-model:visible="showInfoDialog"
      :entity="selectedCoordinator"
      entity-type="coordinator"
    />

    <!-- Confirm Popup -->
    <ConfirmPopup />
  </div>
</template>

<style scoped>
.list-view-button :deep(.p-button-icon) {
  font-size: 1.5rem;
}
</style>
