<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import { useRoute } from 'vue-router';
  import SidebarMenu from '@/components/SidebarMenu.vue';
  import DesignerTrafficFormDialog from '@/components/tasks/designerTraffic/DesignerTrafficFormDialog.vue';
  import TasksListToolbar from '@/components/tasks/TasksListToolbar.vue';
  import TasksListSettingsDialog from '@/components/tasks/TasksListSettingsDialog.vue';
  import TasksListInfoDialog from '@/components/tasks/TasksListInfoDialog.vue';
  import DataTable from 'primevue/datatable';
  import type { DataTableSortEvent } from 'primevue/datatable';
  import Column from 'primevue/column';
  import Button from 'primevue/button';
  import ConfirmPopup from 'primevue/confirmpopup';
  import { useConfirm } from 'primevue/useconfirm';
  import { useDesignerTrafficStore } from '@/stores/designerTraffic';
  import { useSettingsStore } from '@/stores/settings';
  import { getPersonDisplayName } from '@/utils/tableFormatters';
  import type { DesignerTraffic } from '@/types/Designer';
  import type { TasksListFilter } from '@/types/Settings';
  import { HomeIcon, Squares2X2Icon, ListBulletIcon, PlusIcon } from '@heroicons/vue/24/outline';

  const designerTrafficStore = useDesignerTrafficStore();
  const settingsStore = useSettingsStore();
  const confirm = useConfirm();
  const route = useRoute();

  const MODULE_NAME = 'designerTrafficTable' as const;

  const designerTrafficMenuItems = [
    { id: 'modules-dashboard', label: 'Moduły', icon: HomeIcon, route: '/', children: null },
    { id: 'tasks-dashboard', label: 'Pulpit zadań', icon: Squares2X2Icon, route: '/tasks', children: null },
    { id: 'designer-traffic-new', label: 'Nowy projektant ruchu', icon: PlusIcon, route: '/tasks/designers-traffic/new', children: null },
    { id: 'designer-traffic-list', label: 'Lista', icon: ListBulletIcon, route: '/tasks/designers-traffic/list', children: null },
    { id: 'designer-traffic-grid', label: 'Kafelki', icon: Squares2X2Icon, route: '/tasks/designers-traffic/grid', children: null },
  ];

  const items = ref<DesignerTraffic[]>([]);
  const loading = ref(false);
  const selectedRow = ref<DesignerTraffic | null>(null);
  const selectedFilter = ref<TasksListFilter>('all');
  const defaultSortField = ref<string | undefined>(undefined);
  const defaultSortOrder = ref<number | undefined>(undefined);
  const showSettingsDialog = ref(false);
  const showFormDialog = ref(false);
  const showInfoDialog = ref(false);
  const formEditItem = ref<DesignerTraffic | null>(null);
  const globalSearchQuery = ref('');

  const COLUMNS = [
    { field: 'name', header: 'Imię', sortable: true },
    { field: 'lastName', header: 'Nazwisko', sortable: true },
    { field: 'phone', header: 'Telefon', sortable: true },
    { field: 'email', header: 'Email', sortable: true },
    { field: 'status', header: 'Status', sortable: true },
  ] as const;

  const favoriteIds = computed(() => settingsStore.getTasksListFavoriteIds(MODULE_NAME));

  const filteredItems = computed(() => {
    let list: DesignerTraffic[] = [];

    switch (selectedFilter.value) {
      case 'active':
        list = designerTrafficStore.getAllDesignerTraffic({ status: true });
        break;
      case 'inactive':
        list = designerTrafficStore.getAllDesignerTraffic({ status: false });
        break;
      case 'favorites':
        list = designerTrafficStore.getAllDesignerTraffic().filter(d => favoriteIds.value.includes(d.id));
        break;
      default:
        list = designerTrafficStore.getAllDesignerTraffic();
        break;
    }

    const q = globalSearchQuery.value.trim().toLowerCase();
    if (q) {
      list = designerTrafficStore.searchDesignerTraffic(q).filter(d => list.some(ld => ld.id === d.id));
    }

    const field = defaultSortField.value;
    const order = defaultSortOrder.value ?? 1;
    if (!field) return list;
    list = [...list].sort((a, b) => {
      const av = formatCellValue(a, field);
      const bv = formatCellValue(b, field);
      const cmp = av.localeCompare(bv, undefined, { numeric: true });
      return order === 1 ? cmp : -cmp;
    });
    return list;
  });

  function formatCellValue(row: DesignerTraffic, field: string): string {
    switch (field) {
      case 'name':
        return row.name ?? '';
      case 'lastName':
        return row.lastName ?? '';
      case 'phone':
        return row.phone ?? '';
      case 'email':
        return row.email ?? '';
      case 'status':
        return row.status ? 'Aktywny' : 'Nieaktywny';
      default:
        return '';
    }
  }

  const isSelectedFavorite = computed(() => {
    const row = selectedRow.value;
    return row ? favoriteIds.value.includes(row.id) : false;
  });

  function handleFilterClick(f: TasksListFilter) {
    selectedFilter.value = f;
    if (selectedRow.value && !filteredItems.value.some(d => d.id === selectedRow.value!.id)) {
      selectedRow.value = null;
    }
  }

  function handleNew() {
    formEditItem.value = null;
    showFormDialog.value = true;
  }

  function handleEdit() {
    if (!selectedRow.value) return;
    formEditItem.value = selectedRow.value;
    showFormDialog.value = true;
  }

  function handleDelete(event: Event) {
    if (!selectedRow.value) return;
    const d = selectedRow.value;
    const name = getPersonDisplayName(d);
    confirm.require({
      target: event.currentTarget as HTMLElement,
      message: `Czy na pewno chcesz usunąć projektanta ruchu "${name}"?`,
      icon: 'pi pi-exclamation-triangle',
      rejectProps: { label: 'Anuluj', severity: 'secondary', outlined: true },
      acceptProps: { label: 'Usuń', severity: 'danger' },
      accept: () => {
        designerTrafficStore.deleteDesignerTraffic(d.id, false);
        refreshItems();
        selectedRow.value = null;
      },
    });
  }

  function handleToggleFavorite() {
    if (!selectedRow.value) return;
    const id = selectedRow.value.id;
    if (isSelectedFavorite.value) {
      settingsStore.removeTasksListFavorite(MODULE_NAME, id);
    } else {
      settingsStore.addTasksListFavorite(MODULE_NAME, id);
    }
  }

  function handleOpenSettings() {
    showSettingsDialog.value = true;
  }

  function handleOpenInfo() {
    showInfoDialog.value = true;
  }

  function handleSettingsSaved(defaultFilter?: TasksListFilter) {
    if (defaultFilter) {
      selectedFilter.value = defaultFilter;
    }
  }

  function onSort(event: DataTableSortEvent) {
    const field = typeof event.sortField === 'string' ? event.sortField : undefined;
    const order = event.sortOrder === 1 || event.sortOrder === -1 ? event.sortOrder : undefined;
    defaultSortField.value = field;
    defaultSortOrder.value = order;
  }

  function handleResetConfig(event: Event) {
    confirm.require({
      target: event.currentTarget as HTMLElement,
      message: 'Czy na pewno chcesz zresetować konfigurację (filtr, ulubieni)?',
      icon: 'pi pi-exclamation-triangle',
      rejectProps: { label: 'Anuluj', severity: 'secondary', outlined: true },
      acceptProps: { label: 'Resetuj', severity: 'warning' },
      accept: () => {
        settingsStore.resetTasksListTableSettings(MODULE_NAME);
        selectedFilter.value = 'all';
        globalSearchQuery.value = '';
        refreshItems();
      },
    });
  }

  function loadConfig() {
    const cfg = settingsStore.getTasksListTableSettings(MODULE_NAME);
    if (cfg?.defaultFilter) {
      selectedFilter.value = cfg.defaultFilter;
    }
  }

  function refreshItems() {
    items.value = designerTrafficStore.getAllDesignerTraffic();
  }

  function onFormClose() {
    showFormDialog.value = false;
    formEditItem.value = null;
  }

  function onItemAdded() {
    refreshItems();
    onFormClose();
  }

  function onItemUpdated() {
    refreshItems();
    if (selectedRow.value && formEditItem.value && selectedRow.value.id === formEditItem.value.id) {
      const updated = designerTrafficStore.getDesignerTraffic(selectedRow.value.id);
      if (updated) selectedRow.value = updated;
    }
    onFormClose();
  }

  function clearFilter() {
    globalSearchQuery.value = '';
  }

  onMounted(() => {
    loading.value = true;
    refreshItems();
    loadConfig();
    loading.value = false;

    if (route.path === '/tasks/designers-traffic/new') {
      handleNew();
    }
  });
</script>

<template>
  <div class="flex h-screen bg-surface-0 dark:bg-surface-950 overflow-hidden">
    <ConfirmPopup />
    <SidebarMenu :menu-items="designerTrafficMenuItems" />

    <div class="flex-1 overflow-y-auto p-1 md:p-6">
      <div class="max-w-full mx-auto">
        <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold text-surface-700 dark:text-surface-300 mb-2">Lista projektantów ruchu</h1>
            <p class="text-sm text-surface-600 dark:text-surface-400">Zarządzanie projektantami ruchu</p>
          </div>
          <div class="hidden md:flex items-center gap-2">
            <router-link to="/tasks/designers-traffic/grid">
              <Button
                icon="pi pi-th-large"
                text
                severity="primary"
                title="Przełącz na widok kafelków"
                class="grid-view-button"
              />
            </router-link>
          </div>
        </div>

        <div
          class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-1 md:p-6"
        >
          <TasksListToolbar
            :selected-filter="selectedFilter"
            :selected-row="selectedRow ? { id: selectedRow.id } : null"
            :is-selected-favorite="isSelectedFavorite"
            :global-search-query="globalSearchQuery"
            new-button-label="Nowy projektant ruchu"
            @filter-click="handleFilterClick"
            @new="handleNew"
            @edit="handleEdit"
            @delete="handleDelete"
            @info="handleOpenInfo"
            @toggle-favorite="handleToggleFavorite"
            @clear-filter="clearFilter"
            @open-settings="handleOpenSettings"
            @reset-config="handleResetConfig"
            @update:global-search-query="globalSearchQuery = $event"
          />

          <DataTable
            :value="filteredItems"
            :loading="loading"
            v-model:selection="selectedRow"
            selection-mode="single"
            data-key="id"
            striped-rows
            show-gridlines
            class="p-datatable-sm"
            scrollable
            scroll-height="calc(100vh - 320px)"
            sort-mode="single"
            :sort-field="defaultSortField"
            :sort-order="defaultSortOrder"
            @sort="onSort"
            :pt="{
              root: { class: 'bg-surface-0 dark:bg-surface-900' },
              header: {
                class: 'bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700',
              },
              thead: { class: '[&>tr>th]:text-center [&>tr>th]:align-middle' },
              tbody: { class: '[&>tr>td]:text-center [&>tr>td]:align-middle' },
            }"
          >
            <Column
              v-for="col in COLUMNS"
              :key="col.field"
              :field="col.field"
              :header="col.header"
              sortable
            >
              <template #body="{ data }">
                <template v-if="col.field === 'status'">
                  <span
                    class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="
                      data.status
                        ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200'
                        : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200'
                    "
                  >
                    {{ data.status ? 'Aktywny' : 'Nieaktywny' }}
                  </span>
                </template>
                <template v-else>
                  {{ formatCellValue(data, col.field) }}
                </template>
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
    </div>

    <TasksListSettingsDialog
      :visible="showSettingsDialog"
      :module-name="MODULE_NAME"
      :default-filter="selectedFilter"
      @update:visible="showSettingsDialog = $event"
      @saved="handleSettingsSaved"
      @close="showSettingsDialog = false"
    />

    <DesignerTrafficFormDialog
      v-if="showFormDialog"
      :visible="showFormDialog"
      :designer-traffic="formEditItem"
      @update:visible="showFormDialog = $event"
      @close="onFormClose"
      @designer-traffic-added="onItemAdded"
      @designer-traffic-updated="onItemUpdated"
    />

    <TasksListInfoDialog
      :visible="showInfoDialog"
      :entity="selectedRow"
      entity-type="designerTraffic"
      @update:visible="showInfoDialog = $event"
      @close="showInfoDialog = false"
    />
  </div>
</template>

<style scoped>
.grid-view-button :deep(.p-button-icon) {
  font-size: 1.5rem;
}
</style>
