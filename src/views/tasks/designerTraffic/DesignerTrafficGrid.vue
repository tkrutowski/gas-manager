<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import SidebarMenu from '@/components/SidebarMenu.vue';
  import DesignerTrafficFormDialog from '@/components/tasks/designerTraffic/DesignerTrafficFormDialog.vue';
  import TasksListToolbar from '@/components/tasks/TasksListToolbar.vue';
  import TasksListSettingsDialog from '@/components/tasks/TasksListSettingsDialog.vue';
  import TasksListInfoDialog from '@/components/tasks/TasksListInfoDialog.vue';
  import DataView from 'primevue/dataview';
  import Button from 'primevue/button';
  import ConfirmPopup from 'primevue/confirmpopup';
  import { useConfirm } from 'primevue/useconfirm';
  import { useDesignerTrafficStore } from '@/stores/designerTraffic';
  import { useGasConnectionsStore } from '@/stores/gasConnections';
  import { useSettingsStore } from '@/stores/settings';
  import type { DesignerTraffic } from '@/types/Designer';
  import type { TasksListFilter } from '@/types/Settings';
  import { Phase } from '@/types/GasConnection';
  import { PhoneIcon, EnvelopeIcon, EyeIcon } from '@heroicons/vue/24/outline';

  const designerTrafficStore = useDesignerTrafficStore();
  const gasConnectionsStore = useGasConnectionsStore();
  const settingsStore = useSettingsStore();
  const confirm = useConfirm();
  const route = useRoute();
  const router = useRouter();

  const MODULE_NAME = 'designerTrafficTable' as const;

  const selectedFilter = ref<TasksListFilter>('all');
  const selectedDesignerTrafficId = ref<number | null>(null);
  const globalSearchQuery = ref('');
  const showDialog = ref(false);
  const showSettingsDialog = ref(false);
  const showInfoDialog = ref(false);
  const designerTrafficForEdit = ref<DesignerTraffic | null>(null);

  const items = ref<DesignerTraffic[]>([]);

  onMounted(() => {
    items.value = designerTrafficStore.getAllDesignerTraffic();

    const settings = settingsStore.getTasksListTableSettings(MODULE_NAME);
    if (settings?.defaultFilter) {
      selectedFilter.value = settings.defaultFilter;
    }

    if (route.path === '/tasks/designers-traffic/new') {
      openDialogForNew();
    }
  });

  watch(
    () => route.path,
    newPath => {
      if (newPath === '/tasks/designers-traffic/new') {
        openDialogForNew();
      }
    }
  );

  const favoriteIds = computed(() => settingsStore.getTasksListFavoriteIds(MODULE_NAME));

  const filteredItems = computed(() => {
    let base: DesignerTraffic[] = [];

    switch (selectedFilter.value) {
      case 'active':
        base = designerTrafficStore.getAllDesignerTraffic({ status: true });
        break;
      case 'inactive':
        base = designerTrafficStore.getAllDesignerTraffic({ status: false });
        break;
      case 'favorites':
        base = designerTrafficStore.getAllDesignerTraffic().filter(d => favoriteIds.value.includes(d.id));
        break;
      default:
        base = designerTrafficStore.getAllDesignerTraffic();
        break;
    }

    if (globalSearchQuery.value.trim()) {
      base = designerTrafficStore
        .searchDesignerTraffic(globalSearchQuery.value.trim())
        .filter(d => base.some(bd => bd.id === d.id));
    }

    return base;
  });

  const selectedItem = computed<DesignerTraffic | null>(() => {
    if (selectedDesignerTrafficId.value == null) return null;
    return filteredItems.value.find(d => d.id === selectedDesignerTrafficId.value) ?? null;
  });

  const isSelectedFavorite = computed(() => {
    if (!selectedItem.value) return false;
    return favoriteIds.value.includes(selectedItem.value.id);
  });

  const handleFilterChange = (filter: TasksListFilter) => {
    selectedFilter.value = filter;
    if (
      selectedDesignerTrafficId.value != null &&
      !filteredItems.value.some(d => d.id === selectedDesignerTrafficId.value)
    ) {
      selectedDesignerTrafficId.value = null;
    }
  };

  const toggleSelection = (id: number) => {
    if (selectedDesignerTrafficId.value === id) {
      selectedDesignerTrafficId.value = null;
    } else {
      selectedDesignerTrafficId.value = id;
    }
  };

  const getInitials = (item: DesignerTraffic) => {
    const first = item.name?.[0] ?? '';
    const last = item.lastName?.[0] ?? '';
    return `${first}${last}`.toUpperCase();
  };

  const getDesignerTrafficStats = (designerTrafficId: number) => {
    const allConnections = gasConnectionsStore
      .getAllGasConnections()
      .filter(gc => gc.gasConnectionDesign.designerTraffic?.id === designerTrafficId);
    const activeProjects = allConnections.filter(gc => gc.phase === Phase.PROJECT);
    return {
      total: allConnections.length,
      active: activeProjects.length,
    };
  };

  const selectedDesignerTrafficStats = computed(() => {
    if (!selectedItem.value) {
      return { total: 0, active: 0 };
    }
    return getDesignerTrafficStats(selectedItem.value.id);
  });

  const handleCall = (item: DesignerTraffic) => {
    if (!item.phone) return;
    window.location.href = `tel:${item.phone.replace(/\s+/g, '')}`;
  };

  const handleEmail = (item: DesignerTraffic) => {
    if (!item.email) return;
    window.location.href = `mailto:${item.email}`;
  };

  const openDialogForNew = () => {
    designerTrafficForEdit.value = null;
    showDialog.value = true;
    if (route.path !== '/tasks/designers-traffic/grid' && route.path !== '/tasks/designers-traffic/list') {
      router.replace('/tasks/designers-traffic/grid');
    }
  };

  const openDialogForEdit = (item?: DesignerTraffic) => {
    if (item) {
      designerTrafficForEdit.value = item;
    } else if (selectedItem.value) {
      designerTrafficForEdit.value = selectedItem.value;
    } else {
      return;
    }
    showDialog.value = true;
  };

  const handleDialogClose = () => {
    showDialog.value = false;
    designerTrafficForEdit.value = null;
  };

  const handleDesignerTrafficAdded = () => {
    items.value = designerTrafficStore.getAllDesignerTraffic();
    handleDialogClose();
  };

  const handleDesignerTrafficUpdated = (item: DesignerTraffic) => {
    items.value = designerTrafficStore.getAllDesignerTraffic();
    if (selectedDesignerTrafficId.value === item.id) {
      selectedDesignerTrafficId.value = item.id;
    }
    handleDialogClose();
  };

  const handleDelete = (event: Event) => {
    if (!selectedItem.value) return;

    confirm.require({
      target: event.currentTarget as HTMLElement,
      message: `Czy na pewno chcesz usunąć projektanta ruchu "${selectedItem.value.name} ${selectedItem.value.lastName}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Tak',
      rejectLabel: 'Nie',
      accept: () => {
        const success = designerTrafficStore.deleteDesignerTraffic(selectedItem.value!.id, false);
        if (success) {
          items.value = designerTrafficStore.getAllDesignerTraffic();
          selectedDesignerTrafficId.value = null;
        }
      },
    });
  };

  const handleInfo = () => {
    if (selectedItem.value) {
      showInfoDialog.value = true;
    }
  };

  const handleOpenDetails = (item: DesignerTraffic) => {
    selectedDesignerTrafficId.value = item.id;
    showInfoDialog.value = true;
  };

  const handleToggleFavorite = () => {
    if (!selectedItem.value) return;
    const id = selectedItem.value.id;
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
    items.value = designerTrafficStore.getAllDesignerTraffic();
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
            <h1 class="text-3xl font-bold text-surface-700 dark:text-surface-300">Projektanci ruchu</h1>
            <p class="text-sm text-surface-600 dark:text-surface-400">
              Wybierz projektanta ruchu, aby zobaczyć szczegóły kontaktowe.
            </p>
          </div>
          <div class="hidden md:flex items-center gap-2">
            <router-link to="/tasks/designers-traffic/list">
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
          :selected-row="selectedItem ? { id: selectedItem.id } : null"
          :is-selected-favorite="isSelectedFavorite"
          v-model:global-search-query="globalSearchQuery"
          new-button-label="Nowy projektant ruchu"
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
                  {{ selectedDesignerTrafficStats.total }}
                </div>
                <div class="text-xs text-surface-500 dark:text-surface-400 mt-1">
                  {{ selectedItem ? 'Dla wybranego projektanta ruchu' : 'Wybierz projektanta ruchu z listy' }}
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
                  {{ selectedDesignerTrafficStats.active }}
                </div>
                <div class="text-xs text-surface-500 dark:text-surface-400 mt-1">Faza PROJECT</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Lista projektantów ruchu -->
        <div
          class="bg-surface-0 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-xl p-1 md:p-6"
        >
          <DataView :value="filteredItems" layout="grid" :data-key="'id'">
            <template #grid="slotProps">
              <div class="overflow-y-auto" style="max-height: calc(100vh - 320px)">
                <div class="grid gap-4" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))">
                  <button
                    v-for="item in slotProps.items"
                    :key="item.id"
                    type="button"
                    class="text-left rounded-2xl border transition-all duration-200 focus:outline-none"
                    :class="[
                      selectedDesignerTrafficId === item.id
                        ? 'border-primary-400 ring-2 ring-primary-400/40 bg-surface-200 dark:bg-surface-700'
                        : 'border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 hover:border-primary-400/60 hover:bg-surface-100 dark:hover:bg-surface-800',
                    ]"
                    @click="toggleSelection(item.id)"
                  >
                    <div class="p-4 flex flex-col h-full">
                      <!-- Top row: initials + status -->
                      <div class="flex items-start justify-between mb-4">
                        <div
                          class="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                          :class="item.status ? 'bg-green-600' : 'bg-red-600'"
                        >
                          {{ getInitials(item) }}
                        </div>

                        <div class="text-right">
                          <div
                            class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide"
                            :class="
                              item.status
                                ? 'bg-green-900/60 text-green-400 border border-green-700/60'
                                : 'bg-red-800/20 text-red-400 border border-red-700/60'
                            "
                          >
                            {{ item.status ? 'AKTYWNY' : 'NIEAKTYWNY' }}
                          </div>
                          <div class="mt-1 text-[10px] text-surface-500 dark:text-surface-400">ID: {{ item.id }}</div>
                        </div>
                      </div>

                      <!-- Name -->
                      <div class="mb-3">
                        <div class="text-sm font-semibold text-surface-900 dark:text-surface-50 mb-1">
                          {{ item.name }} {{ item.lastName }}
                        </div>
                      </div>

                      <!-- Contact info -->
                      <div class="space-y-1.5 text-xs text-surface-500 dark:text-surface-400 mb-4">
                        <div class="flex items-center gap-2">
                          <PhoneIcon class="w-4 h-4" />
                          <span class="truncate">
                            {{ item.phone || 'Brak numeru telefonu' }}
                          </span>
                        </div>
                        <div class="flex items-center gap-2">
                          <EnvelopeIcon class="w-4 h-4" />
                          <span class="truncate">
                            {{ item.email || 'Brak adresu email' }}
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
                          @click.stop="handleOpenDetails(item)"
                        >
                          <EyeIcon class="w-4 h-4" />
                        </button>
                        <div class="flex items-center gap-1.5">
                          <button
                            type="button"
                            class="w-8 h-8 inline-flex items-center justify-center rounded-lg text-xs font-medium transition-colors"
                            :class="[
                              item.phone
                                ? 'bg-green-700 text-white hover:bg-green-600'
                                : 'bg-surface-200 dark:bg-surface-800 text-surface-400 cursor-not-allowed',
                            ]"
                            :disabled="!item.phone"
                            @click.stop="handleCall(item)"
                          >
                            <PhoneIcon class="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            class="w-8 h-8 inline-flex items-center justify-center rounded-lg text-xs font-medium transition-colors"
                            :class="[
                              item.email
                                ? 'bg-sky-700 text-white hover:bg-sky-600'
                                : 'bg-surface-200 dark:bg-surface-800 text-surface-400 cursor-not-allowed',
                            ]"
                            :disabled="!item.email"
                            @click.stop="handleEmail(item)"
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

    <!-- Dialog formularza projektanta ruchu -->
    <DesignerTrafficFormDialog
      v-model:visible="showDialog"
      :designer-traffic="designerTrafficForEdit"
      @close="handleDialogClose"
      @designer-traffic-added="handleDesignerTrafficAdded"
      @designer-traffic-updated="handleDesignerTrafficUpdated"
    />

    <!-- Dialog ustawień -->
    <TasksListSettingsDialog
      v-model:visible="showSettingsDialog"
      :module-name="MODULE_NAME"
      :default-filter="selectedFilter"
      @saved="handleSettingsSaved"
    />

    <!-- Dialog informacji -->
    <TasksListInfoDialog v-model:visible="showInfoDialog" :entity="selectedItem" entity-type="designerTraffic" />

    <!-- Confirm Popup -->
    <ConfirmPopup />
  </div>
</template>

<style scoped>
  .list-view-button :deep(.p-button-icon) {
    font-size: 1.5rem;
  }
</style>
