<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import SidebarMenu from '@/components/tasks/SidebarMenu.vue';
  import DesignerTrafficFormDialog from '@/components/tasks/DesignerTrafficFormDialog.vue';
  import PrimaryButton from '@/components/PrimaryButton.vue';
  import { useDesignerTrafficStore } from '@/stores/designerTraffic';
  import { useGasConnectionsStore } from '@/stores/gasConnections';
  import type { DesignerTraffic } from '@/types/Designer';
  import { Phase } from '@/types/GasConnection';
  import { PhoneIcon, EnvelopeIcon, PencilIcon, PlusIcon } from '@heroicons/vue/24/outline';

  const designerTrafficStore = useDesignerTrafficStore();
  const gasConnectionsStore = useGasConnectionsStore();
  const route = useRoute();
  const router = useRouter();

  type DesignerTrafficFilter = 'all' | 'active';

  const selectedFilter = ref<DesignerTrafficFilter>('all');
  const selectedDesignerTrafficId = ref<number | null>(null);
  const showDialog = ref(false);
  const designerTrafficForEdit = ref<DesignerTraffic | null>(null);

  const items = ref<DesignerTraffic[]>([]);

  onMounted(() => {
    items.value = designerTrafficStore.getAllDesignerTraffic();

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

  const filteredItems = computed(() => {
    const base =
      selectedFilter.value === 'active'
        ? designerTrafficStore.getAllDesignerTraffic({ status: true })
        : designerTrafficStore.getAllDesignerTraffic();

    return base;
  });

  const selectedItem = computed<DesignerTraffic | null>(() => {
    if (selectedDesignerTrafficId.value == null) return null;
    return filteredItems.value.find(d => d.id === selectedDesignerTrafficId.value) ?? null;
  });

  const handleFilterChange = (filter: DesignerTrafficFilter) => {
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
    if (route.path !== '/tasks/designers-traffic') {
      router.replace('/tasks/designers-traffic');
    }
  };

  const openDialogForEdit = (item: DesignerTraffic) => {
    designerTrafficForEdit.value = item;
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
      return {
        total: 0,
        active: 0,
      };
    }
    return getDesignerTrafficStats(selectedItem.value.id);
  });
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
            <h1 class="text-3xl font-bold text-surface-700 dark:text-surface-300">Projektanci ruchu</h1>
            <p class="text-sm text-surface-600 dark:text-surface-400">
              Wybierz projektanta ruchu, aby zobaczyć szczegóły kontaktowe.
            </p>
          </div>

          <div class="flex items-center gap-4">
            <!-- Filtry -->
            <div
              class="inline-flex rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden bg-surface-50 dark:bg-surface-900"
            >
              <button
                type="button"
                class="px-4 py-2 text-sm font-medium transition-colors"
                :class="[
                  selectedFilter === 'all'
                    ? 'bg-primary-400 text-black'
                    : 'text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800',
                ]"
                @click="handleFilterChange('all')"
              >
                WSZYSCY
              </button>
              <button
                type="button"
                class="px-4 py-2 text-sm font-medium border-l border-surface-200 dark:border-surface-700 transition-colors"
                :class="[
                  selectedFilter === 'active'
                    ? 'bg-primary-400 text-black'
                    : 'text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800',
                ]"
                @click="handleFilterChange('active')"
              >
                AKTYWNI
              </button>
            </div>

            <!-- Przycisk Nowy projektant ruchu -->
            <PrimaryButton type="button" size="md" :withIcon="true" @click="openDialogForNew">
              <PlusIcon class="w-5 h-5" />
              <span>Nowy Projektant ruchu</span>
            </PrimaryButton>
          </div>
        </div>

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
        <div class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-4">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-surface-700 dark:text-surface-300">Lista projektantów ruchu</h2>
            <p class="text-xs text-surface-500 dark:text-surface-400">
              Kliknij kartę, aby zaznaczyć projektanta ruchu.
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <button
              v-for="item in filteredItems"
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
                  class="mt-auto pt-3 border-t border-surface-200 dark:border-surface-700 flex items-center justify-between gap-2"
                >
                  <button
                    type="button"
                    class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-400 text-black hover:bg-primary-500 transition-colors"
                    @click.stop="openDialogForEdit(item)"
                  >
                    <PencilIcon class="w-4 h-4" />
                    <span>Edytuj</span>
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
  </div>
</template>
