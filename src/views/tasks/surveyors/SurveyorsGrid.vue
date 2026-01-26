<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import SidebarMenu from '@/components/SidebarMenu.vue';
  import SurveyorFormDialog from '@/components/tasks/surveyors/SurveyorFormDialog.vue';
  import TasksListToolbar from '@/components/tasks/TasksListToolbar.vue';
  import TasksListSettingsDialog from '@/components/tasks/TasksListSettingsDialog.vue';
  import TasksListInfoDialog from '@/components/tasks/TasksListInfoDialog.vue';
  import DataView from 'primevue/dataview';
  import Button from 'primevue/button';
  import ConfirmPopup from 'primevue/confirmpopup';
  import { useConfirm } from 'primevue/useconfirm';
  import { useSurveyorsStore } from '@/stores/surveyors';
  import { useGasConnectionsStore } from '@/stores/gasConnections';
  import { useSettingsStore } from '@/stores/settings';
  import type { Surveyor } from '@/types/Surveyor';
  import type { TasksListFilter } from '@/types/Settings';
  import { Phase } from '@/types/GasConnection';
  import { MapPinIcon, PhoneIcon, EnvelopeIcon, EyeIcon, HomeIcon, Squares2X2Icon, ListBulletIcon, PlusIcon } from '@heroicons/vue/24/outline';

  const surveyorsStore = useSurveyorsStore();
  const gasConnectionsStore = useGasConnectionsStore();
  const settingsStore = useSettingsStore();
  const confirm = useConfirm();
  const route = useRoute();
  const router = useRouter();

  const MODULE_NAME = 'surveyorTable' as const;

  const surveyorsMenuItems = [
    { id: 'modules-dashboard', label: 'Moduły', icon: HomeIcon, route: '/', children: null },
    { id: 'tasks-dashboard', label: 'Pulpit zadań', icon: Squares2X2Icon, route: '/tasks', children: null },
    { id: 'surveyors-new', label: 'Nowy geodeta', icon: PlusIcon, route: '/tasks/surveyors/new', children: null },
    { id: 'surveyors-list', label: 'Lista', icon: ListBulletIcon, route: '/tasks/surveyors/list', children: null },
    { id: 'surveyors-grid', label: 'Kafelki', icon: Squares2X2Icon, route: '/tasks/surveyors/grid', children: null },
  ];

  const selectedFilter = ref<TasksListFilter>('all');
  const selectedSurveyorId = ref<number | null>(null);
  const globalSearchQuery = ref('');
  const showDialog = ref(false);
  const showSettingsDialog = ref(false);
  const showInfoDialog = ref(false);
  const surveyorForEdit = ref<Surveyor | null>(null);

  const surveyors = ref<Surveyor[]>([]);

  onMounted(() => {
    surveyors.value = surveyorsStore.getAllSurveyors();

    const settings = settingsStore.getTasksListTableSettings(MODULE_NAME);
    if (settings?.defaultFilter) {
      selectedFilter.value = settings.defaultFilter;
    }

    if (route.path === '/tasks/surveyors/new') {
      openDialogForNew();
    }
  });

  watch(
    () => route.path,
    newPath => {
      if (newPath === '/tasks/surveyors/new') {
        openDialogForNew();
      }
    }
  );

  const favoriteIds = computed(() => settingsStore.getTasksListFavoriteIds(MODULE_NAME));

  const filteredSurveyors = computed(() => {
    let base: Surveyor[] = [];

    switch (selectedFilter.value) {
      case 'active':
        base = surveyorsStore.getAllSurveyors({ status: true });
        break;
      case 'inactive':
        base = surveyorsStore.getAllSurveyors({ status: false });
        break;
      case 'favorites':
        base = surveyorsStore.getAllSurveyors().filter(s => favoriteIds.value.includes(s.id));
        break;
      default:
        base = surveyorsStore.getAllSurveyors();
        break;
    }

    if (globalSearchQuery.value.trim()) {
      base = surveyorsStore.searchSurveyors(globalSearchQuery.value.trim()).filter(s =>
        base.some(bs => bs.id === s.id)
      );
    }

    return base;
  });

  const selectedSurveyor = computed<Surveyor | null>(() => {
    if (selectedSurveyorId.value == null) return null;
    return filteredSurveyors.value.find(s => s.id === selectedSurveyorId.value) ?? null;
  });

  const isSelectedFavorite = computed(() => {
    if (!selectedSurveyor.value) return false;
    return favoriteIds.value.includes(selectedSurveyor.value.id);
  });

  const handleFilterChange = (filter: TasksListFilter) => {
    selectedFilter.value = filter;
    if (selectedSurveyorId.value != null && !filteredSurveyors.value.some(s => s.id === selectedSurveyorId.value)) {
      selectedSurveyorId.value = null;
    }
  };

  const toggleSurveyorSelection = (surveyorId: number) => {
    if (selectedSurveyorId.value === surveyorId) {
      selectedSurveyorId.value = null;
    } else {
      selectedSurveyorId.value = surveyorId;
    }
  };

  const getInitials = (surveyor: Surveyor) => {
    const first = surveyor.name?.[0] ?? '';
    const last = surveyor.lastName?.[0] ?? '';
    return `${first}${last}`.toUpperCase();
  };

  const getSurveyorStats = (surveyorId: number) => {
    const allConnections = gasConnectionsStore
      .getAllGasConnections()
      .filter(
        gc =>
          gc.gasConnectionDesign.mapSurveyor?.id === surveyorId ||
          gc.gasConnectionDesign.surveyorTrafficProject?.id === surveyorId
      );
    const activeProjects = allConnections.filter(gc => gc.phase === Phase.PROJECT);
    return {
      total: allConnections.length,
      active: activeProjects.length,
    };
  };

  const selectedSurveyorStats = computed(() => {
    if (!selectedSurveyor.value) {
      return { total: 0, active: 0 };
    }
    return getSurveyorStats(selectedSurveyor.value.id);
  });

  const handleCall = (surveyor: Surveyor) => {
    if (!surveyor.phone) return;
    window.location.href = `tel:${surveyor.phone.replace(/\s+/g, '')}`;
  };

  const handleEmail = (surveyor: Surveyor) => {
    if (!surveyor.email) return;
    window.location.href = `mailto:${surveyor.email}`;
  };

  const openDialogForNew = () => {
    surveyorForEdit.value = null;
    showDialog.value = true;
    if (route.path !== '/tasks/surveyors/grid' && route.path !== '/tasks/surveyors/list') {
      router.replace('/tasks/surveyors/grid');
    }
  };

  const openDialogForEdit = (surveyor?: Surveyor) => {
    if (surveyor) {
      surveyorForEdit.value = surveyor;
    } else if (selectedSurveyor.value) {
      surveyorForEdit.value = selectedSurveyor.value;
    } else {
      return;
    }
    showDialog.value = true;
  };

  const handleDialogClose = () => {
    showDialog.value = false;
    surveyorForEdit.value = null;
  };

  const handleSurveyorAdded = () => {
    surveyors.value = surveyorsStore.getAllSurveyors();
    handleDialogClose();
  };

  const handleSurveyorUpdated = (surveyor: Surveyor) => {
    surveyors.value = surveyorsStore.getAllSurveyors();
    if (selectedSurveyorId.value === surveyor.id) {
      selectedSurveyorId.value = surveyor.id;
    }
    handleDialogClose();
  };

  const handleDelete = (event: Event) => {
    if (!selectedSurveyor.value) return;

    confirm.require({
      target: event.currentTarget as HTMLElement,
      message: `Czy na pewno chcesz usunąć geodetę "${selectedSurveyor.value.name} ${selectedSurveyor.value.lastName}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Tak',
      rejectLabel: 'Nie',
      accept: () => {
        const success = surveyorsStore.deleteSurveyor(selectedSurveyor.value!.id, false);
        if (success) {
          surveyors.value = surveyorsStore.getAllSurveyors();
          selectedSurveyorId.value = null;
        }
      },
    });
  };

  const handleInfo = () => {
    if (selectedSurveyor.value) {
      showInfoDialog.value = true;
    }
  };

  const handleOpenDetails = (surveyor: Surveyor) => {
    selectedSurveyorId.value = surveyor.id;
    showInfoDialog.value = true;
  };

  const handleToggleFavorite = () => {
    if (!selectedSurveyor.value) return;
    const id = selectedSurveyor.value.id;
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
    surveyors.value = surveyorsStore.getAllSurveyors();
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
    <SidebarMenu :menu-items="surveyorsMenuItems" />

    <!-- Main content -->
    <div class="flex-1 overflow-hidden p-1 md:p-6">
      <div class="max-w-full mx-auto space-y-6">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold text-surface-700 dark:text-surface-300">Geodeci</h1>
            <p class="text-sm text-surface-600 dark:text-surface-400">
              Wybierz geodetę, aby zobaczyć powiązane projekty.
            </p>
          </div>
          <div class="hidden md:flex items-center gap-2">
            <router-link to="/tasks/surveyors/list">
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
          :selected-row="selectedSurveyor ? { id: selectedSurveyor.id } : null"
          :is-selected-favorite="isSelectedFavorite"
          v-model:global-search-query="globalSearchQuery"
          new-button-label="Nowy geodeta"
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
                  {{ selectedSurveyorStats.total }}
                </div>
                <div class="text-xs text-surface-500 dark:text-surface-400 mt-1">
                  {{ selectedSurveyor ? 'Dla wybranego geodety' : 'Wybierz geodetę z listy' }}
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
                  {{ selectedSurveyorStats.active }}
                </div>
                <div class="text-xs text-surface-500 dark:text-surface-400 mt-1">Faza PROJECT</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Lista geodetów -->
        <div
          class="bg-surface-0 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-xl p-1 md:p-6"
        >
          <DataView :value="filteredSurveyors" layout="grid" :data-key="'id'">
            <template #grid="slotProps">
              <div class="overflow-y-auto" style="max-height: calc(100vh - 320px);">
                <div class="grid gap-4" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
                  <button
                    v-for="surveyor in slotProps.items"
                    :key="surveyor.id"
                    type="button"
                    class="text-left rounded-2xl border transition-all duration-200 focus:outline-none"
                    :class="[
                      selectedSurveyorId === surveyor.id
                        ? 'border-primary-400 ring-2 ring-primary-400/40 bg-surface-200 dark:bg-surface-700'
                        : 'border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 hover:border-primary-400/60 hover:bg-surface-100 dark:hover:bg-surface-800',
                    ]"
                    @click="toggleSurveyorSelection(surveyor.id)"
                  >
                    <div class="p-4 flex flex-col h-full">
                      <!-- Top row: initials + status -->
                      <div class="flex items-start justify-between mb-4">
                        <div
                          class="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                          :class="surveyor.status ? 'bg-green-600' : 'bg-red-600'"
                        >
                          {{ getInitials(surveyor) }}
                        </div>

                        <div class="text-right">
                          <div
                            class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide"
                            :class="
                              surveyor.status
                                ? 'bg-green-900/60 text-green-400 border border-green-700/60'
                                : 'bg-red-800/20 text-red-400 border border-red-700/60'
                            "
                          >
                            {{ surveyor.status ? 'AKTYWNY' : 'NIEAKTYWNY' }}
                          </div>
                          <div class="mt-1 text-[10px] text-surface-500 dark:text-surface-400">ID: {{ surveyor.id }}</div>
                        </div>
                      </div>

                      <!-- Name & address -->
                      <div class="mb-3">
                        <div class="text-sm font-semibold text-surface-900 dark:text-surface-50 mb-1">
                          {{ surveyor.name }} {{ surveyor.lastName }}
                        </div>
                        <div class="flex items-center gap-1 text-xs text-surface-500 dark:text-surface-400">
                          <MapPinIcon class="w-3.5 h-3.5" />
                          <span>
                            {{ surveyor.address?.city }},
                            {{ surveyor.address?.commune }}
                          </span>
                        </div>
                      </div>

                      <!-- Contact info -->
                      <div class="space-y-1.5 text-xs text-surface-500 dark:text-surface-400 mb-4">
                        <div class="flex items-center gap-2">
                          <PhoneIcon class="w-4 h-4" />
                          <span class="truncate">
                            {{ surveyor.phone || 'Brak numeru telefonu' }}
                          </span>
                        </div>
                        <div class="flex items-center gap-2">
                          <EnvelopeIcon class="w-4 h-4" />
                          <span class="truncate">
                            {{ surveyor.email || 'Brak adresu email' }}
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
                          @click.stop="handleOpenDetails(surveyor)"
                        >
                          <EyeIcon class="w-4 h-4" />
                        </button>
                        <div class="flex items-center gap-1.5">
                          <button
                            type="button"
                            class="w-8 h-8 inline-flex items-center justify-center rounded-lg text-xs font-medium transition-colors"
                            :class="[
                              surveyor.phone
                                ? 'bg-green-700 text-white hover:bg-green-600'
                                : 'bg-surface-200 dark:bg-surface-800 text-surface-400 cursor-not-allowed',
                            ]"
                            :disabled="!surveyor.phone"
                            @click.stop="handleCall(surveyor)"
                          >
                            <PhoneIcon class="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            class="w-8 h-8 inline-flex items-center justify-center rounded-lg text-xs font-medium transition-colors"
                            :class="[
                              surveyor.email
                                ? 'bg-sky-700 text-white hover:bg-sky-600'
                                : 'bg-surface-200 dark:bg-surface-800 text-surface-400 cursor-not-allowed',
                            ]"
                            :disabled="!surveyor.email"
                            @click.stop="handleEmail(surveyor)"
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

    <!-- Dialog formularza geodety -->
    <SurveyorFormDialog
      v-model:visible="showDialog"
      :surveyor="surveyorForEdit"
      @close="handleDialogClose"
      @surveyor-added="handleSurveyorAdded"
      @surveyor-updated="handleSurveyorUpdated"
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
      :entity="selectedSurveyor"
      entity-type="surveyor"
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
