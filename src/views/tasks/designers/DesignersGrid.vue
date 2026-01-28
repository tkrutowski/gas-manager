<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import SidebarMenu from '@/components/SidebarMenu.vue';
  import DesignerFormDialog from '@/components/tasks/designers/DesignerFormDialog.vue';
  import TasksListToolbar from '@/components/tasks/TasksListToolbar.vue';
  import TasksListSettingsDialog from '@/components/tasks/TasksListSettingsDialog.vue';
  import DesignerDetailsDialog from '@/components/tasks/designers/DesignerDetailsDialog.vue';
  import DataView from 'primevue/dataview';
  import Button from 'primevue/button';
  import ConfirmPopup from 'primevue/confirmpopup';
  import { useConfirm } from 'primevue/useconfirm';
  import { useDesignersStore } from '@/stores/designers';
  import { useGasConnectionsStore } from '@/stores/gasConnections';
  import { useSettingsStore } from '@/stores/settings';
  import type { Designer } from '@/types/Designer';
  import type { TasksListFilter } from '@/types/Settings';
  import { Phase } from '@/types/GasConnection';
  import { MapPinIcon, PhoneIcon, EnvelopeIcon, EyeIcon } from '@heroicons/vue/24/outline';

  const designersStore = useDesignersStore();
  const gasConnectionsStore = useGasConnectionsStore();
  const settingsStore = useSettingsStore();
  const confirm = useConfirm();
  const route = useRoute();
  const router = useRouter();

  const MODULE_NAME = 'designerTable' as const;

  const selectedFilter = ref<TasksListFilter>('all');
  const selectedDesignerId = ref<number | null>(null);
  const globalSearchQuery = ref('');
  const showDialog = ref(false);
  const showSettingsDialog = ref(false);
  const showInfoDialog = ref(false);
  const designerForEdit = ref<Designer | null>(null);

  const designers = ref<Designer[]>([]);

  onMounted(() => {
    designers.value = designersStore.getAllDesigners();

    const settings = settingsStore.getTasksListTableSettings(MODULE_NAME);
    if (settings?.defaultFilter) {
      selectedFilter.value = settings.defaultFilter;
    }

    if (route.path === '/tasks/designers/new') {
      openDialogForNew();
    }
  });

  watch(
    () => route.path,
    newPath => {
      if (newPath === '/tasks/designers/new') {
        openDialogForNew();
      }
    }
  );

  const favoriteIds = computed(() => settingsStore.getTasksListFavoriteIds(MODULE_NAME));

  const filteredDesigners = computed(() => {
    let base: Designer[] = [];

    switch (selectedFilter.value) {
      case 'active':
        base = designersStore.getAllDesigners({ status: true });
        break;
      case 'inactive':
        base = designersStore.getAllDesigners({ status: false });
        break;
      case 'favorites':
        base = designersStore.getAllDesigners().filter(d => favoriteIds.value.includes(d.id));
        break;
      default:
        base = designersStore.getAllDesigners();
        break;
    }

    if (globalSearchQuery.value.trim()) {
      base = designersStore
        .searchDesigners(globalSearchQuery.value.trim())
        .filter(d => base.some(bd => bd.id === d.id));
    }

    return base;
  });

  const selectedDesigner = computed<Designer | null>(() => {
    if (selectedDesignerId.value == null) return null;
    return filteredDesigners.value.find(d => d.id === selectedDesignerId.value) ?? null;
  });

  const isSelectedFavorite = computed(() => {
    if (!selectedDesigner.value) return false;
    return favoriteIds.value.includes(selectedDesigner.value.id);
  });

  const handleFilterChange = (filter: TasksListFilter) => {
    selectedFilter.value = filter;
    if (selectedDesignerId.value != null && !filteredDesigners.value.some(d => d.id === selectedDesignerId.value)) {
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
    if (designer.designerType === 'company') {
      const name = designer.companyName || designer.name || '';
      return name.slice(0, 2).toUpperCase();
    }
    const first = designer.firstName ?? designer.name ?? '';
    const last = designer.lastName ?? '';
    return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
  };

  const getDesignerStats = (designerId: number) => {
    const allConnections = gasConnectionsStore.getAllGasConnections().filter(gc => gc.designer?.id === designerId);
    const activeProjects = allConnections.filter(gc => gc.phase === Phase.PROJECT);
    return {
      total: allConnections.length,
      active: activeProjects.length,
    };
  };

  const selectedDesignerStats = computed(() => {
    if (!selectedDesigner.value) {
      return { total: 0, active: 0 };
    }
    return getDesignerStats(selectedDesigner.value.id);
  });

  const handleCall = (designer: Designer) => {
    const phone = designer.phones?.[0];
    if (!phone) return;
    window.location.href = `tel:${phone.replace(/\s+/g, '')}`;
  };

  const handleEmail = (designer: Designer) => {
    const email = designer.emails?.[0];
    if (!email) return;
    window.location.href = `mailto:${email}`;
  };

  const openDialogForNew = () => {
    designerForEdit.value = null;
    showDialog.value = true;
    if (route.path !== '/tasks/designers/grid' && route.path !== '/tasks/designers/list') {
      router.replace('/tasks/designers/grid');
    }
  };

  const openDialogForEdit = (designer?: Designer) => {
    if (designer) {
      designerForEdit.value = designer;
    } else if (selectedDesigner.value) {
      designerForEdit.value = selectedDesigner.value;
    } else {
      return;
    }
    showDialog.value = true;
  };

  const handleDialogClose = () => {
    showDialog.value = false;
    designerForEdit.value = null;
  };

  const handleDesignerAdded = () => {
    designers.value = designersStore.getAllDesigners();
    handleDialogClose();
  };

  const handleDesignerUpdated = (designer: Designer) => {
    designers.value = designersStore.getAllDesigners();
    if (selectedDesignerId.value === designer.id) {
      selectedDesignerId.value = designer.id;
    }
    handleDialogClose();
  };

  const handleDelete = (event: Event) => {
    if (!selectedDesigner.value) return;

    confirm.require({
      target: event.currentTarget as HTMLElement,
      message: `Czy na pewno chcesz usunąć projektanta "${selectedDesigner.value.firstName ?? selectedDesigner.value.name ?? ''} ${selectedDesigner.value.lastName ?? ''}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Tak',
      rejectLabel: 'Nie',
      accept: () => {
        const success = designersStore.deleteDesigner(selectedDesigner.value!.id, false);
        if (success) {
          designers.value = designersStore.getAllDesigners();
          selectedDesignerId.value = null;
        }
      },
    });
  };

  const handleInfo = () => {
    if (selectedDesigner.value) {
      showInfoDialog.value = true;
    }
  };

  const handleOpenDetails = (designer: Designer) => {
    selectedDesignerId.value = designer.id;
    showInfoDialog.value = true;
  };

  const handleToggleFavorite = () => {
    if (!selectedDesigner.value) return;
    const id = selectedDesigner.value.id;
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
    designers.value = designersStore.getAllDesigners();
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
            <h1 class="text-3xl font-bold text-surface-700 dark:text-surface-300">Projektanci</h1>
            <p class="text-sm text-surface-600 dark:text-surface-400">
              Wybierz projektanta, aby zobaczyć powiązane projekty.
            </p>
          </div>
          <div class="hidden md:flex items-center gap-2">
            <router-link to="/tasks/designers/list">
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
          :selected-row="selectedDesigner ? { id: selectedDesigner.id } : null"
          :is-selected-favorite="isSelectedFavorite"
          v-model:global-search-query="globalSearchQuery"
          new-button-label="Nowy projektant"
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
                  {{ selectedDesignerStats.total }}
                </div>
                <div class="text-xs text-surface-500 dark:text-surface-400 mt-1">
                  {{ selectedDesigner ? 'Dla wybranego projektanta' : 'Wybierz projektanta z listy' }}
                </div>
              </div>
              <div class="text-xs text-green-400">+12%</div>
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
                  {{ selectedDesignerStats.active }}
                </div>
                <div class="text-xs text-surface-500 dark:text-surface-400 mt-1">Faza PROJECT</div>
              </div>
              <div class="text-xs text-green-400">+5%</div>
            </div>
          </div>

          <!-- Placeholder 3 -->
          <div
            class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-4 flex flex-col justify-between opacity-70"
          >
            <div class="text-xs font-semibold tracking-widest text-surface-600 dark:text-surface-400">
              PODMIOTY PRZYŁĄCZANE
            </div>
            <div class="mt-3 flex items-end justify-between">
              <div>
                <div class="text-3xl font-bold text-surface-700 dark:text-surface-300">0</div>
                <div class="text-xs text-surface-500 dark:text-surface-400 mt-1">Do ustalenia</div>
              </div>
              <div class="text-xs text-red-400">-2%</div>
            </div>
          </div>

          <!-- Placeholder 4 -->
          <div
            class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-4 flex flex-col justify-between opacity-70"
          >
            <div class="text-xs font-semibold tracking-widest text-surface-600 dark:text-surface-400">ZAKOŃCZONE</div>
            <div class="mt-3 flex items-end justify-between">
              <div>
                <div class="text-3xl font-bold text-surface-700 dark:text-surface-300">0</div>
                <div class="text-xs text-surface-500 dark:text-surface-400 mt-1">Do ustalenia</div>
              </div>
              <div class="text-xs text-green-400">+8%</div>
            </div>
          </div>
        </div>

        <!-- Lista projektantów -->
        <div
          class="bg-surface-0 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-xl p-1 md:p-6"
        >
          <DataView :value="filteredDesigners" layout="grid" :data-key="'id'">
            <template #grid="slotProps">
              <div class="overflow-y-auto" style="max-height: calc(100vh - 320px)">
                <div class="grid gap-4" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))">
                  <button
                    v-for="designer in slotProps.items"
                    :key="designer.id"
                    type="button"
                    class="text-left rounded-2xl border transition-all duration-200 focus:outline-none"
                    :class="[
                      selectedDesignerId === designer.id
                        ? 'border-primary-400 ring-2 ring-primary-400/40 bg-surface-200 dark:bg-surface-700'
                        : 'border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 hover:border-primary-400/60 hover:bg-surface-100 dark:hover:bg-surface-800',
                    ]"
                    @click="toggleDesignerSelection(designer.id)"
                  >
                    <div class="p-4 flex flex-col h-full">
                      <!-- Top row: initials + status -->
                      <div class="flex items-start justify-between mb-4">
                        <div
                          class="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                          :class="designer.status ? 'bg-green-600' : 'bg-red-600'"
                        >
                          {{ getInitials(designer) }}
                        </div>

                        <div class="text-right">
                          <div
                            class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide"
                            :class="
                              designer.status
                                ? 'bg-green-900/60 text-green-400 border border-green-700/60'
                                : 'bg-red-800/20 text-red-400 border border-red-700/60'
                            "
                          >
                            {{ designer.status ? 'AKTYWNY' : 'NIEAKTYWNY' }}
                          </div>
                          <div class="mt-1 text-[10px] text-surface-500 dark:text-surface-400">
                            ID: {{ designer.id }}
                          </div>
                        </div>
                      </div>

                      <!-- Name & address -->
                      <div class="mb-3">
                        <div class="flex items-center justify-between gap-2 mb-1">
                          <div class="text-sm font-semibold text-surface-900 dark:text-surface-50">
                            <span v-if="designer.designerType === 'company'">
                              {{ designer.companyName || designer.name }}
                            </span>
                            <span v-else> {{ designer.firstName || designer.name }} {{ designer.lastName }} </span>
                          </div>
                          <span
                            class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium"
                            :class="
                              designer.designerType === 'company'
                                ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-200'
                                : 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200'
                            "
                          >
                            {{ designer.designerType === 'company' ? 'Firma' : 'Osoba' }}
                          </span>
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
                            {{ designer.phones?.[0] || 'Brak numeru telefonu' }}
                          </span>
                        </div>
                        <div class="flex items-center gap-2">
                          <EnvelopeIcon class="w-4 h-4" />
                          <span class="truncate">
                            {{ designer.emails?.[0] || 'Brak adresu email' }}
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
                          @click.stop="handleOpenDetails(designer)"
                        >
                          <EyeIcon class="w-4 h-4" />
                        </button>
                        <div class="flex items-center gap-1.5">
                          <button
                            type="button"
                            class="w-8 h-8 inline-flex items-center justify-center rounded-lg text-xs font-medium transition-colors"
                            :class="[
                              designer.phones?.[0]
                                ? 'bg-green-700 text-white hover:bg-green-600'
                                : 'bg-surface-200 dark:bg-surface-800 text-surface-400 cursor-not-allowed',
                            ]"
                            :disabled="!designer.phones?.[0]"
                            @click.stop="handleCall(designer)"
                          >
                            <PhoneIcon class="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            class="w-8 h-8 inline-flex items-center justify-center rounded-lg text-xs font-medium transition-colors"
                            :class="[
                              designer.emails?.[0]
                                ? 'bg-sky-700 text-white hover:bg-sky-600'
                                : 'bg-surface-200 dark:bg-surface-800 text-surface-400 cursor-not-allowed',
                            ]"
                            :disabled="!designer.emails?.[0]"
                            @click.stop="handleEmail(designer)"
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

    <!-- Dialog formularza projektanta -->
    <DesignerFormDialog
      v-model:visible="showDialog"
      :designer="designerForEdit"
      @close="handleDialogClose"
      @designer-added="handleDesignerAdded"
      @designer-updated="handleDesignerUpdated"
    />

    <!-- Dialog ustawień -->
    <TasksListSettingsDialog
      v-model:visible="showSettingsDialog"
      :module-name="MODULE_NAME"
      :default-filter="selectedFilter"
      @saved="handleSettingsSaved"
    />

    <!-- Dialog szczegółów projektanta -->
    <DesignerDetailsDialog
      v-if="showInfoDialog && selectedDesigner"
      :designer="selectedDesigner"
      @close="showInfoDialog = false"
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
