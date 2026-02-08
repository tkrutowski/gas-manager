<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import SidebarMenu from '@/components/SidebarMenu.vue';
  import BrigadeFormDialog from '@/components/tasks/brigades/BrigadeFormDialog.vue';
  import TasksListToolbar from '@/components/tasks/TasksListToolbar.vue';
  import TasksListSettingsDialog from '@/components/tasks/TasksListSettingsDialog.vue';
  import TasksListInfoDialog from '@/components/tasks/TasksListInfoDialog.vue';
  import DataView from 'primevue/dataview';
  import ConfirmPopup from 'primevue/confirmpopup';
  import { useConfirm } from 'primevue/useconfirm';
  import { useBrigadesStore } from '@/stores/brigades';
  import { useSettingsStore } from '@/stores/settings';
  import type { Brigade } from '@/types/Brigade';
  import type { TasksListFilter } from '@/types/Settings';
  import { EyeIcon } from '@heroicons/vue/24/outline';

  const brigadesStore = useBrigadesStore();
  const settingsStore = useSettingsStore();
  const confirm = useConfirm();
  const route = useRoute();
  const router = useRouter();

  const MODULE_NAME = 'brigadeTable' as const;

  const selectedFilter = ref<TasksListFilter>('all');
  const selectedBrigadeId = ref<number | null>(null);
  const globalSearchQuery = ref('');
  const showDialog = ref(false);
  const showSettingsDialog = ref(false);
  const showInfoDialog = ref(false);
  const brigadeForEdit = ref<Brigade | null>(null);

  const brigades = ref<Brigade[]>([]);

  onMounted(() => {
    brigades.value = brigadesStore.getAllBrigades();

    const settings = settingsStore.getTasksListTableSettings(MODULE_NAME);
    if (settings?.defaultFilter) {
      selectedFilter.value = settings.defaultFilter;
    }

    if (route.path === '/tasks/brigades/new') {
      openDialogForNew();
    }
  });

  watch(
    () => route.path,
    newPath => {
      if (newPath === '/tasks/brigades/new') {
        openDialogForNew();
      }
    }
  );

  const favoriteIds = computed(() => settingsStore.getTasksListFavoriteIds(MODULE_NAME));

  const filteredBrigades = computed(() => {
    let base: Brigade[] = [];

    switch (selectedFilter.value) {
      case 'active':
        base = brigadesStore.getAllBrigades({ isActive: true });
        break;
      case 'inactive':
        base = brigadesStore.getAllBrigades({ isActive: false });
        break;
      case 'favorites':
        base = brigadesStore.getAllBrigades().filter(b => favoriteIds.value.includes(b.id));
        break;
      default:
        base = brigadesStore.getAllBrigades();
        break;
    }

    const query = globalSearchQuery.value.trim().toLowerCase();
    if (query) {
      base = base.filter(b => b.name.toLowerCase().includes(query));
    }

    return base;
  });

  const selectedBrigade = computed<Brigade | null>(() => {
    if (selectedBrigadeId.value == null) return null;
    return filteredBrigades.value.find(b => b.id === selectedBrigadeId.value) ?? null;
  });

  const isSelectedFavorite = computed(() => {
    if (!selectedBrigade.value) return false;
    return favoriteIds.value.includes(selectedBrigade.value.id);
  });

  const handleFilterChange = (filter: TasksListFilter) => {
    selectedFilter.value = filter;
    if (selectedBrigadeId.value != null && !filteredBrigades.value.some(b => b.id === selectedBrigadeId.value)) {
      selectedBrigadeId.value = null;
    }
  };

  const toggleBrigadeSelection = (brigadeId: number) => {
    if (selectedBrigadeId.value === brigadeId) {
      selectedBrigadeId.value = null;
    } else {
      selectedBrigadeId.value = brigadeId;
    }
  };

  const getInitials = (brigade: Brigade) => {
    const name = brigade.name || '';
    return (name.charAt(0) + name.charAt(1)).toUpperCase() || 'B';
  };

  const openDialogForNew = () => {
    brigadeForEdit.value = null;
    showDialog.value = true;
    if (route.path !== '/tasks/brigades/grid') {
      router.replace('/tasks/brigades/grid');
    }
  };

  const openDialogForEdit = (brigade?: Brigade) => {
    if (brigade) {
      brigadeForEdit.value = brigade;
    } else if (selectedBrigade.value) {
      brigadeForEdit.value = selectedBrigade.value;
    } else {
      return;
    }
    showDialog.value = true;
  };

  const handleDialogClose = () => {
    showDialog.value = false;
    brigadeForEdit.value = null;
  };

  const handleBrigadeAdded = () => {
    brigades.value = brigadesStore.getAllBrigades();
    handleDialogClose();
  };

  const handleBrigadeUpdated = (brigade: Brigade) => {
    brigades.value = brigadesStore.getAllBrigades();
    if (selectedBrigadeId.value === brigade.id) {
      selectedBrigadeId.value = brigade.id;
    }
    handleDialogClose();
  };

  const handleDelete = (event: Event) => {
    if (!selectedBrigade.value) return;

    confirm.require({
      target: event.currentTarget as HTMLElement,
      message: `Czy na pewno chcesz usunąć brygadę "${selectedBrigade.value.name}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Tak',
      rejectLabel: 'Nie',
      accept: () => {
        const success = brigadesStore.deleteBrigade(selectedBrigade.value!.id, false);
        if (success) {
          brigades.value = brigadesStore.getAllBrigades();
          selectedBrigadeId.value = null;
        }
      },
    });
  };

  const handleInfo = () => {
    if (selectedBrigade.value) {
      showInfoDialog.value = true;
    }
  };

  const handleOpenDetails = (brigade: Brigade) => {
    selectedBrigadeId.value = brigade.id;
    showInfoDialog.value = true;
  };

  const handleToggleFavorite = () => {
    if (!selectedBrigade.value) return;
    const id = selectedBrigade.value.id;
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
    brigades.value = brigadesStore.getAllBrigades();
  };

  const handleSettingsSaved = (defaultFilter?: TasksListFilter) => {
    if (defaultFilter) {
      selectedFilter.value = defaultFilter;
    }
  };
</script>

<template>
  <div class="flex h-screen bg-surface-0 dark:bg-surface-950 overflow-hidden">
    <SidebarMenu />

    <div class="flex-1 overflow-hidden p-1 md:p-6">
      <div class="max-w-full mx-auto space-y-6">
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold text-surface-700 dark:text-surface-300">Brygady</h1>
            <p class="text-sm text-surface-600 dark:text-surface-400">
              Wybierz brygadę, aby zobaczyć szczegóły lub edytować.
            </p>
          </div>
        </div>

        <TasksListToolbar
          :selected-filter="selectedFilter"
          :selected-row="selectedBrigade ? { id: selectedBrigade.id } : null"
          :is-selected-favorite="isSelectedFavorite"
          v-model:global-search-query="globalSearchQuery"
          new-button-label="Nowa brygada"
          @filter-click="handleFilterChange"
          @new="openDialogForNew"
          @edit="openDialogForEdit()"
          @delete="handleDelete"
          @info="handleInfo"
          @details="handleInfo"
          @toggle-favorite="handleToggleFavorite"
          @clear-filter="handleClearFilter"
          @open-settings="handleOpenSettings"
          @reset-config="handleResetConfig"
        />

        <div
          class="bg-surface-0 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-xl p-1 md:p-6"
        >
          <DataView :value="filteredBrigades" layout="grid" :data-key="'id'">
            <template #grid="slotProps">
              <div class="overflow-y-auto" style="max-height: calc(100vh - 260px)">
                <div class="grid gap-4" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))">
                  <button
                    v-for="brigade in slotProps.items"
                    :key="brigade.id"
                    type="button"
                    class="text-left rounded-2xl border transition-all duration-200 focus:outline-none"
                    :class="[
                      selectedBrigadeId === brigade.id
                        ? 'border-primary-400 ring-2 ring-primary-400/40 bg-surface-200 dark:bg-surface-700'
                        : 'border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 hover:border-primary-400/60 hover:bg-surface-100 dark:hover:bg-surface-800',
                    ]"
                    @click="toggleBrigadeSelection(brigade.id)"
                  >
                    <div class="p-4 flex flex-col h-full">
                      <div class="flex items-start justify-between mb-4">
                        <div
                          class="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                          :class="brigade.isActive ? 'bg-green-600' : 'bg-red-600'"
                        >
                          {{ getInitials(brigade) }}
                        </div>

                        <div class="text-right">
                          <div
                            class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide"
                            :class="
                              brigade.isActive
                                ? 'bg-green-900/60 text-green-400 border border-green-700/60'
                                : 'bg-red-800/20 text-red-400 border border-red-700/60'
                            "
                          >
                            {{ brigade.isActive ? 'AKTYWNA' : 'NIEAKTYWNA' }}
                          </div>
                          <div class="mt-1 text-[10px] text-surface-500 dark:text-surface-400">
                            ID: {{ brigade.id }}
                          </div>
                        </div>
                      </div>

                      <div class="mb-3">
                        <div class="text-sm font-semibold text-surface-900 dark:text-surface-50 mb-1">
                          {{ brigade.name }}
                        </div>
                      </div>

                      <div
                        class="mt-auto pt-3 border-t border-surface-200 dark:border-surface-700 flex items-center justify-between gap-1.5"
                      >
                        <button
                          type="button"
                          class="w-8 h-8 inline-flex items-center justify-center rounded-lg text-xs font-medium transition-colors bg-primary-500 text-surface-900 hover:bg-primary-600 cursor-pointer"
                          title="Zobacz szczegóły"
                          @click.stop="handleOpenDetails(brigade)"
                        >
                          <EyeIcon class="w-4 h-4" />
                        </button>
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

    <BrigadeFormDialog
      v-model:visible="showDialog"
      :brigade="brigadeForEdit"
      @close="handleDialogClose"
      @brigade-added="handleBrigadeAdded"
      @brigade-updated="handleBrigadeUpdated"
    />

    <TasksListSettingsDialog
      v-model:visible="showSettingsDialog"
      :module-name="MODULE_NAME"
      :default-filter="selectedFilter"
      @saved="handleSettingsSaved"
    />

    <TasksListInfoDialog v-model:visible="showInfoDialog" :entity="selectedBrigade" entity-type="brigade" />

    <ConfirmPopup />
  </div>
</template>
