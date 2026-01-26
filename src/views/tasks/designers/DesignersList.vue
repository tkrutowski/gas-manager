<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import { useRoute } from 'vue-router';
  import SidebarMenu from '@/components/SidebarMenu.vue';
  import DesignerFormDialog from '@/components/tasks/designers/DesignerFormDialog.vue';
  import TasksListToolbar from '@/components/tasks/TasksListToolbar.vue';
  import TasksListSettingsDialog from '@/components/tasks/TasksListSettingsDialog.vue';
  import TasksListInfoDialog from '@/components/tasks/TasksListInfoDialog.vue';
  import DataTable from 'primevue/datatable';
  import type { DataTableSortEvent } from 'primevue/datatable';
  import Column from 'primevue/column';
  import Button from 'primevue/button';
  import ConfirmPopup from 'primevue/confirmpopup';
  import { useConfirm } from 'primevue/useconfirm';
  import { useDesignersStore } from '@/stores/designers';
  import { useSettingsStore } from '@/stores/settings';
  import { formatAddress, getPersonDisplayName } from '@/utils/tableFormatters';
  import type { Designer } from '@/types/Designer';
  import type { TasksListFilter } from '@/types/Settings';
  import { HomeIcon, Squares2X2Icon, ListBulletIcon, PlusIcon } from '@heroicons/vue/24/outline';

  const designersStore = useDesignersStore();
  const settingsStore = useSettingsStore();
  const confirm = useConfirm();
  const route = useRoute();

  const MODULE_NAME = 'designerTable' as const;

  const designersMenuItems = [
    { id: 'modules-dashboard', label: 'Moduły', icon: HomeIcon, route: '/', children: null },
    { id: 'tasks-dashboard', label: 'Pulpit zadań', icon: Squares2X2Icon, route: '/tasks', children: null },
    { id: 'designers-new', label: 'Nowy projektant', icon: PlusIcon, route: '/tasks/designers/new', children: null },
    { id: 'designers-list', label: 'Lista', icon: ListBulletIcon, route: '/tasks/designers/list', children: null },
    { id: 'designers-grid', label: 'Kafelki', icon: Squares2X2Icon, route: '/tasks/designers/grid', children: null },
  ];

  const designers = ref<Designer[]>([]);
  const loading = ref(false);
  const selectedRow = ref<Designer | null>(null);
  const selectedFilter = ref<TasksListFilter>('all');
  const defaultSortField = ref<string | undefined>(undefined);
  const defaultSortOrder = ref<number | undefined>(undefined);
  const showSettingsDialog = ref(false);
  const showFormDialog = ref(false);
  const showInfoDialog = ref(false);
  const formEditDesigner = ref<Designer | null>(null);
  const globalSearchQuery = ref('');

  const COLUMNS = [
    { field: 'name', header: 'Imię', sortable: true },
    { field: 'lastName', header: 'Nazwisko', sortable: true },
    { field: 'phone', header: 'Telefon', sortable: true },
    { field: 'email', header: 'Email', sortable: true },
    { field: 'address', header: 'Adres', sortable: true },
    { field: 'status', header: 'Status', sortable: true },
    { field: 'employee', header: 'Pracownik', sortable: true },
  ] as const;

  const favoriteIds = computed(() => settingsStore.getTasksListFavoriteIds(MODULE_NAME));

  const filteredDesigners = computed(() => {
    let list: Designer[] = [];

    switch (selectedFilter.value) {
      case 'active':
        list = designersStore.getAllDesigners({ status: true });
        break;
      case 'inactive':
        list = designersStore.getAllDesigners({ status: false });
        break;
      case 'favorites':
        list = designersStore.getAllDesigners().filter(d => favoriteIds.value.includes(d.id));
        break;
      default:
        list = designersStore.getAllDesigners();
        break;
    }

    const q = globalSearchQuery.value.trim().toLowerCase();
    if (q) {
      list = designersStore.searchDesigners(q).filter(d => list.some(ld => ld.id === d.id));
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

  function formatCellValue(row: Designer, field: string): string {
    switch (field) {
      case 'name':
        return row.name ?? '';
      case 'lastName':
        return row.lastName ?? '';
      case 'phone':
        return row.phone ?? '';
      case 'email':
        return row.email ?? '';
      case 'address':
        return formatAddress(row.address);
      case 'status':
        return row.status ? 'Aktywny' : 'Nieaktywny';
      case 'employee':
        return row.employee ? 'Tak' : 'Nie';
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
    if (selectedRow.value && !filteredDesigners.value.some(d => d.id === selectedRow.value!.id)) {
      selectedRow.value = null;
    }
  }

  function handleNew() {
    formEditDesigner.value = null;
    showFormDialog.value = true;
  }

  function handleEdit() {
    if (!selectedRow.value) return;
    formEditDesigner.value = selectedRow.value;
    showFormDialog.value = true;
  }

  function handleDelete(event: Event) {
    if (!selectedRow.value) return;
    const d = selectedRow.value;
    const name = getPersonDisplayName(d);
    confirm.require({
      target: event.currentTarget as HTMLElement,
      message: `Czy na pewno chcesz usunąć projektanta "${name}"?`,
      icon: 'pi pi-exclamation-triangle',
      rejectProps: { label: 'Anuluj', severity: 'secondary', outlined: true },
      acceptProps: { label: 'Usuń', severity: 'danger' },
      accept: () => {
        designersStore.deleteDesigner(d.id, false);
        refreshDesigners();
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
        refreshDesigners();
      },
    });
  }

  function loadConfig() {
    const cfg = settingsStore.getTasksListTableSettings(MODULE_NAME);
    if (cfg?.defaultFilter) {
      selectedFilter.value = cfg.defaultFilter;
    }
  }

  function refreshDesigners() {
    designers.value = designersStore.getAllDesigners();
  }

  function onFormClose() {
    showFormDialog.value = false;
    formEditDesigner.value = null;
  }

  function onDesignerAdded() {
    refreshDesigners();
    onFormClose();
  }

  function onDesignerUpdated() {
    refreshDesigners();
    if (selectedRow.value && formEditDesigner.value && selectedRow.value.id === formEditDesigner.value.id) {
      const updated = designersStore.getDesigner(selectedRow.value.id);
      if (updated) selectedRow.value = updated;
    }
    onFormClose();
  }

  function clearFilter() {
    globalSearchQuery.value = '';
  }

  onMounted(() => {
    loading.value = true;
    refreshDesigners();
    loadConfig();
    loading.value = false;

    if (route.path === '/tasks/designers/new') {
      handleNew();
    }
  });
</script>

<template>
  <div class="flex h-screen bg-surface-0 dark:bg-surface-950 overflow-hidden">
    <ConfirmPopup />
    <SidebarMenu :menu-items="designersMenuItems" />

    <div class="flex-1 overflow-y-auto p-1 md:p-6">
      <div class="max-w-full mx-auto">
        <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold text-surface-700 dark:text-surface-300 mb-2">Lista projektantów</h1>
            <p class="text-sm text-surface-600 dark:text-surface-400">Zarządzanie projektantami</p>
          </div>
          <div class="hidden md:flex items-center gap-2">
            <router-link to="/tasks/designers/grid">
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
            new-button-label="Nowy projektant"
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
            :value="filteredDesigners"
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
            <Column v-for="col in COLUMNS" :key="col.field" :field="col.field" :header="col.header" sortable>
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
                <template v-else-if="col.field === 'employee'">
                  <span
                    class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="
                      data.employee
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200'
                        : 'bg-gray-100 dark:bg-gray-900/40 text-gray-800 dark:text-gray-200'
                    "
                  >
                    {{ data.employee ? 'Tak' : 'Nie' }}
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

    <DesignerFormDialog
      v-if="showFormDialog"
      :visible="showFormDialog"
      :designer="formEditDesigner"
      @update:visible="showFormDialog = $event"
      @close="onFormClose"
      @designer-added="onDesignerAdded"
      @designer-updated="onDesignerUpdated"
    />

    <TasksListInfoDialog
      :visible="showInfoDialog"
      :entity="selectedRow"
      entity-type="designer"
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
