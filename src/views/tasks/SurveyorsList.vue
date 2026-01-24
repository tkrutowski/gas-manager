<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import SidebarMenu from '@/components/SidebarMenu.vue';
  import SurveyorFormDialog from '@/components/tasks/SurveyorFormDialog.vue';
  import PrimaryButton from '@/components/PrimaryButton.vue';
  import { useSurveyorsStore } from '@/stores/surveyors';
  import { useGasConnectionsStore } from '@/stores/gasConnections';
  import type { Surveyor } from '@/types/Surveyor';
  import { Phase } from '@/types/GasConnection';
  import { MapPinIcon, PhoneIcon, EnvelopeIcon, PencilIcon, PlusIcon } from '@heroicons/vue/24/outline';

  const surveyorsStore = useSurveyorsStore();
  const gasConnectionsStore = useGasConnectionsStore();
  const route = useRoute();
  const router = useRouter();

  type SurveyorFilter = 'all' | 'active';

  const selectedFilter = ref<SurveyorFilter>('all');
  const selectedSurveyorId = ref<number | null>(null);
  const showDialog = ref(false);
  const surveyorForEdit = ref<Surveyor | null>(null);

  const surveyors = ref<Surveyor[]>([]);

  onMounted(() => {
    surveyors.value = surveyorsStore.getAllSurveyors();

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

  const filteredSurveyors = computed(() => {
    const base =
      selectedFilter.value === 'active'
        ? surveyorsStore.getAllSurveyors({ status: true })
        : surveyorsStore.getAllSurveyors();

    return base;
  });

  const selectedSurveyor = computed<Surveyor | null>(() => {
    if (selectedSurveyorId.value == null) return null;
    return filteredSurveyors.value.find(s => s.id === selectedSurveyorId.value) ?? null;
  });

  const handleFilterChange = (filter: SurveyorFilter) => {
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
      return {
        total: 0,
        active: 0,
      };
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
    if (route.path !== '/tasks/surveyors') {
      router.replace('/tasks/surveyors');
    }
  };

  const openDialogForEdit = (surveyor: Surveyor) => {
    surveyorForEdit.value = surveyor;
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
            <h1 class="text-3xl font-bold text-surface-700 dark:text-surface-300">Geodeci</h1>
            <p class="text-sm text-surface-600 dark:text-surface-400">
              Wybierz geodetę, aby zobaczyć powiązane projekty.
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

            <!-- Przycisk Nowy geodeta -->
            <PrimaryButton type="button" size="md" :withIcon="true" @click="openDialogForNew">
              <PlusIcon class="w-5 h-5" />
              <span>Nowy Geodeta</span>
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
        <div class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-4">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-surface-700 dark:text-surface-300">Lista geodetów</h2>
            <p class="text-xs text-surface-500 dark:text-surface-400">Kliknij kartę, aby zaznaczyć geodetę.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <button
              v-for="surveyor in filteredSurveyors"
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
                  class="mt-auto pt-3 border-t border-surface-200 dark:border-surface-700 flex items-center justify-between gap-2"
                >
                  <button
                    type="button"
                    class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-400 text-black hover:bg-primary-500 transition-colors"
                    @click.stop="openDialogForEdit(surveyor)"
                  >
                    <PencilIcon class="w-4 h-4" />
                    <span>Edytuj</span>
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
  </div>
</template>
