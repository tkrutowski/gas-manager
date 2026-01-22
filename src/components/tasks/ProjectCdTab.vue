<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { useConfirm } from 'primevue/useconfirm';
  import type { GasConnection } from '@/types/GasConnection';
  import type { Plot } from '@/types/Plot';
  import { CheckIcon } from '@heroicons/vue/24/solid';
  import { MapIcon } from '@heroicons/vue/24/outline';
  import Card from 'primevue/card';
  import Button from 'primevue/button';
  import PlotDialog from '@/components/tasks/PlotDialog.vue';
  import PlotOwnerPrivateDialog from '@/components/tasks/PlotOwnerPrivateDialog.vue';
  import PlotOwnerPrivateListDialog from '@/components/tasks/PlotOwnerPrivateListDialog.vue';
  import { UtilsService } from '@/utils/formatService';
  import type { PlotOwnerPrivate } from '@/types/Plot';

  interface Props {
    gasConnection: GasConnection | undefined;
    isReadonly: boolean;
  }

  const props = defineProps<Props>();
  const confirm = useConfirm();

  // Dialog state
  const plotDialogVisible = ref(false);
  const editingPlot = ref<Plot | null>(null);
  const plotOwnerPrivateDialogVisible = ref(false);
  const currentPlotForPrivate = ref<Plot | null>(null);
  const plotOwnerPrivateListDialogVisible = ref(false);
  const currentPlotForPrivateList = ref<Plot | null>(null);
  const editingPlotOwnerPrivate = ref<PlotOwnerPrivate | null>(null);

  // Lista działek
  const plots = computed(() => props.gasConnection?.plots || []);

  // Funkcja do określania koloru działki na podstawie dat (bez uwzględnienia właścicieli prywatnych)
  const getPlotColorBase = (plot: Plot): 'red' | 'yellow' | 'green' => {
    const hasSubmission = !!plot.submissionDate;
    const hasReceipt = !!plot.receiptDate;

    if (hasSubmission && hasReceipt) return 'green';
    if (hasSubmission && !hasReceipt) return 'yellow';
    return 'red';
  };

  // Funkcja sprawdzająca czy działka ma właścicieli prywatnych
  const plotHasPrivateOwners = (plot: Plot): boolean => {
    if (props.isReadonly) return false;
    if (plot.connectionEntity === true) return false;
    if (plot.plotOwner?.name !== 'Wł. prywatny') return false;
    return !!(plot.plotOwnerPrivate && plot.plotOwnerPrivate.length > 0);
  };

  // Funkcja do określania koloru właściciela prywatnego na podstawie dat (używana dla pojedynczej działki)
  const getPlotOwnerPrivateColorForPlot = (plot: Plot): 'red' | 'yellow' | 'green' => {
    if (!plot.plotOwnerPrivate || plot.plotOwnerPrivate.length === 0) return 'red';

    const ownerColors = plot.plotOwnerPrivate.map(owner => {
      const hasSubmission = !!owner.submissionDate;
      const hasReceipt = !!owner.receiptDate;
      const hasSubmission1 = !!owner.submissionDate1;
      const hasReceipt1 = !!owner.receiptDate1;
      const hasSubmission2 = !!owner.submissionDate2;
      const hasReceipt2 = !!owner.receiptDate2;

      if (!hasSubmission && !hasReceipt && !hasSubmission1 && !hasReceipt1 && !hasSubmission2 && !hasReceipt2) {
        return 'red';
      }
      if ((hasSubmission && !hasReceipt) || (hasSubmission1 && !hasReceipt1) || (hasSubmission2 && !hasReceipt2)) {
        return 'yellow';
      }
      return 'green';
    });

    if (ownerColors.every(color => color === 'green')) return 'green';
    if (ownerColors.every(color => color === 'red')) return 'red';
    return 'yellow';
  };

  // Funkcja do określania koloru działki na podstawie dat (używana do obliczania checkmarka w headerze)
  const getPlotColor = (plot: Plot): 'red' | 'yellow' | 'green' => {
    return getPlotColorBase(plot);
  };

  // Funkcja do określania koloru działki z uwzględnieniem statusu właścicieli prywatnych (używana do kolorowania diva)
  const getPlotColorWithPrivateOwners = (plot: Plot): 'red' | 'yellow' | 'green' => {
    const plotColor = getPlotColorBase(plot);

    // Jeśli działka nie ma właścicieli prywatnych, użyj normalnego koloru działki
    if (!plotHasPrivateOwners(plot)) {
      return plotColor;
    }

    // Jeśli działka ma właścicieli prywatnych, uwzględnij ich status
    const privateOwnersColor = getPlotOwnerPrivateColorForPlot(plot);

    // Zielony: tylko gdy działka ma obie daty uzupełnione ORAZ właściciele prywatni są zieloni
    if (plotColor === 'green' && privateOwnersColor === 'green') {
      return 'green';
    }

    // Żółty: gdy:
    // - działka ma submissionDate ale brak receiptDate LUB
    // - działka ma obie daty uzupełnione, ale właściciele prywatni są żółci LUB
    // - działka nie ma dat (czerwona) ale właściciele prywatni są żółci
    if (
      plotColor === 'yellow' ||
      (plotColor === 'green' && privateOwnersColor === 'yellow') ||
      (plotColor === 'red' && privateOwnersColor === 'yellow')
    ) {
      return 'yellow';
    }

    // Czerwony: tylko gdy działka nie ma dat (czerwona) ORAZ właściciele prywatni są czerwoni
    return 'red';
  };

  // Funkcja do określania klas CSS dla obramowania działki (z uwzględnieniem właścicieli prywatnych)
  const getPlotBorderClasses = (plot: Plot): string => {
    const color = getPlotColorWithPrivateOwners(plot);
    switch (color) {
      case 'red':
        return 'border-red-400 dark:border-red-500';
      case 'yellow':
        return 'border-yellow-400 dark:border-yellow-500';
      case 'green':
        return 'border-green-400 dark:border-green-500';
      default:
        return 'border-surface-200 dark:border-surface-700';
    }
  };

  // Funkcja do określania klas CSS dla tła działki (z uwzględnieniem właścicieli prywatnych)
  const getPlotBgClasses = (plot: Plot): string => {
    const color = getPlotColorWithPrivateOwners(plot);
    switch (color) {
      case 'red':
        return 'bg-red-50 dark:bg-red-900/20';
      case 'yellow':
        return 'bg-yellow-50 dark:bg-yellow-900/20';
      case 'green':
        return 'bg-green-50 dark:bg-green-900/20';
      default:
        return 'bg-surface-50 dark:bg-surface-900';
    }
  };

  // Logika kolorowania ikony checkmark w headerze
  const checkmarkColor = computed<'red' | 'yellow' | 'green'>(() => {
    if (plots.value.length === 0) return 'red';

    const plotColors = plots.value.map(plot => getPlotColor(plot));

    // Jeśli wszystkie są zielone → zielony
    if (plotColors.every(color => color === 'green')) {
      return 'green';
    }

    // Jeśli wszystkie są czerwone → czerwony
    if (plotColors.every(color => color === 'red')) {
      return 'red';
    }

    // Jeśli którykolwiek ma kolor inny niż czerwony → żółty
    return 'yellow';
  });

  // Klasy CSS dla ikony checkmark
  const checkmarkClasses = computed(() => {
    const color = checkmarkColor.value;
    const baseClasses = 'w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ring-1';

    switch (color) {
      case 'red':
        return `${baseClasses} border-red-400 bg-red-400/10 shadow-[0_0_8px_rgba(239,68,68,0.5)] ring-red-400/50`;
      case 'yellow':
        return `${baseClasses} border-yellow-400 bg-yellow-400/10 shadow-[0_0_8px_rgba(234,179,8,0.5)] ring-yellow-400/50`;
      case 'green':
        return `${baseClasses} border-green-400 bg-green-400/10 shadow-[0_0_8px_rgba(34,197,94,0.5)] ring-green-400/50`;
      default:
        return `${baseClasses} border-green-400 bg-green-400/10 shadow-[0_0_8px_rgba(34,197,94,0.5)] ring-green-400/50`;
    }
  });

  // Klasy CSS dla ikony checkmark (ikona wewnątrz)
  const checkmarkIconClasses = computed(() => {
    const color = checkmarkColor.value;
    const baseClasses = 'w-5 h-5';

    switch (color) {
      case 'red':
        return `${baseClasses} text-red-400`;
      case 'yellow':
        return `${baseClasses} text-yellow-400`;
      case 'green':
        return `${baseClasses} text-green-400`;
      default:
        return `${baseClasses} text-green-400`;
    }
  });

  // Computed property dla statusu działek (ilość zielonych/total)
  const plotsStatus = computed(() => {
    const total = plots.value.length;
    if (total === 0) return { text: 'STATUS: UKOŃCZONO (0/0)', green: 0, total: 0 };

    const green = plots.value.filter(plot => getPlotColor(plot) === 'green').length;
    return {
      text: `STATUS: UKOŃCZONO (${green}/${total})`,
      green,
      total,
    };
  });

  // Funkcja do określania klas CSS dla napisu o właścicielach prywatnych dla konkretnej działki
  const getPlotOwnerPrivateStatusClassesForPlot = (plot: Plot): string => {
    const color = getPlotOwnerPrivateColorForPlot(plot);
    switch (color) {
      case 'red':
        return 'text-red-400 dark:text-red-500';
      case 'yellow':
        return 'text-yellow-400 dark:text-yellow-500';
      case 'green':
        return 'text-green-400 dark:text-green-500';
      default:
        return 'text-surface-700 dark:text-surface-300';
    }
  };

  // Otwarcie dialogu do dodawania nowej działki
  const handleAddPlot = () => {
    editingPlot.value = null;
    plotDialogVisible.value = true;
  };

  // Otwarcie dialogu do edycji działki
  const handleEditPlot = (plot: Plot) => {
    editingPlot.value = plot;
    plotDialogVisible.value = true;
  };

  // Zapis działki (dodanie lub edycja)
  const handleSavePlot = (plotData: Partial<Plot>) => {
    if (!props.gasConnection) return;

    if (editingPlot.value) {
      // Edycja istniejącej działki
      const index = props.gasConnection.plots.findIndex(p => p.id === editingPlot.value!.id);
      if (index !== -1) {
        Object.assign(props.gasConnection.plots[index], plotData);
      }
    } else {
      // Dodanie nowej działki
      const newPlot: Plot = {
        id: Date.now(), // Tymczasowe ID
        idTask: props.gasConnection.id,
        plotNumber: plotData.plotNumber || '',
        submissionDate: plotData.submissionDate,
        receiptDate: plotData.receiptDate,
        plotOwner: plotData.plotOwner || { id: 0, name: '' },
        plotOwnerPrivate: [],
        info: plotData.info || '',
        taskType: { name: 'GAS_CONNECTION', viewName: 'przylacze' },
        connectionEntity: false,
        laneOccupationSubmissionDate: undefined,
        laneOccupationReceiptDate: undefined,
        laneReceiptDate: undefined,
        laneOccupationPreparationDate: undefined,
        laneOccupationStartDate: undefined,
        laneOccupationEndDate: undefined,
      };
      props.gasConnection.plots.push(newPlot);
    }
  };

  // Usuwanie działki
  const handleDeletePlot = (event: Event, plot: Plot) => {
    if (!props.gasConnection) return;

    confirm.require({
      target: event.currentTarget as HTMLElement,
      message: `Czy na pewno chcesz usunąć działkę "${plot.plotNumber}"?`,
      icon: 'pi pi-exclamation-triangle',
      rejectProps: {
        label: 'Anuluj',
        severity: 'secondary',
        outlined: true,
      },
      acceptProps: {
        label: 'Usuń',
        severity: 'danger',
      },
      accept: () => {
        const index = props.gasConnection!.plots.findIndex(p => p.id === plot.id);
        if (index !== -1) {
          props.gasConnection!.plots.splice(index, 1);
        }
      },
    });
  };

  // Przełączanie connectionEntity
  const handleToggleConnectionEntity = (plot: Plot) => {
    if (props.isReadonly) return;
    plot.connectionEntity = !plot.connectionEntity;
  };

  // Otwarcie dialogu do dodawania PlotOwnerPrivate
  const handleAddPlotOwnerPrivate = (plot: Plot) => {
    editingPlotOwnerPrivate.value = null;
    currentPlotForPrivate.value = plot;
    plotOwnerPrivateDialogVisible.value = true;
  };

  // Otwarcie dialogu z listą PlotOwnerPrivate
  const handleShowPlotOwnerPrivateList = (plot: Plot) => {
    currentPlotForPrivateList.value = plot;
    plotOwnerPrivateListDialogVisible.value = true;
  };

  // Otwarcie dialogu do edycji PlotOwnerPrivate
  const handleEditPlotOwnerPrivate = (plotOwnerPrivate: PlotOwnerPrivate) => {
    editingPlotOwnerPrivate.value = plotOwnerPrivate;
    currentPlotForPrivate.value = currentPlotForPrivateList.value;
    plotOwnerPrivateDialogVisible.value = true;
  };

  // Usuwanie PlotOwnerPrivate
  const handleDeletePlotOwnerPrivate = (_event: Event, plotOwnerPrivate: PlotOwnerPrivate) => {
    if (!currentPlotForPrivateList.value) return;

    if (currentPlotForPrivateList.value.plotOwnerPrivate) {
      const index = currentPlotForPrivateList.value.plotOwnerPrivate.findIndex(p => p.id === plotOwnerPrivate.id);
      if (index !== -1) {
        currentPlotForPrivateList.value.plotOwnerPrivate.splice(index, 1);
      }
    }
  };

  // Zapis PlotOwnerPrivate
  const handleSavePlotOwnerPrivate = (plotOwnerPrivateData: Partial<PlotOwnerPrivate>) => {
    if (!currentPlotForPrivate.value) return;

    if (editingPlotOwnerPrivate.value) {
      // Edycja istniejącego PlotOwnerPrivate
      const index = currentPlotForPrivate.value.plotOwnerPrivate.findIndex(
        p => p.id === editingPlotOwnerPrivate.value!.id
      );
      if (index !== -1) {
        Object.assign(currentPlotForPrivate.value.plotOwnerPrivate[index], {
          ...plotOwnerPrivateData,
          id: editingPlotOwnerPrivate.value.id,
          idPlot: currentPlotForPrivate.value.id,
        });
      }
      editingPlotOwnerPrivate.value = null;
    } else {
      // Dodanie nowego PlotOwnerPrivate
      const newPlotOwnerPrivate: PlotOwnerPrivate = {
        id: Date.now(), // Tymczasowe ID
        idPlot: currentPlotForPrivate.value.id,
        name: plotOwnerPrivateData.name || '',
        lastName: plotOwnerPrivateData.lastName || '',
        share: plotOwnerPrivateData.share || 0,
        submissionDate: plotOwnerPrivateData.submissionDate,
        receiptDate: plotOwnerPrivateData.receiptDate,
        submissionDate1: plotOwnerPrivateData.submissionDate1,
        receiptDate1: plotOwnerPrivateData.receiptDate1,
        info1: plotOwnerPrivateData.info1 || '',
        submissionDate2: plotOwnerPrivateData.submissionDate2,
        receiptDate2: plotOwnerPrivateData.receiptDate2,
        info2: plotOwnerPrivateData.info2 || '',
      };

      if (!currentPlotForPrivate.value.plotOwnerPrivate) {
        currentPlotForPrivate.value.plotOwnerPrivate = [];
      }
      currentPlotForPrivate.value.plotOwnerPrivate.push(newPlotOwnerPrivate);
    }
  };

  // Computed property dla disabled ikony PlotOwnerPrivate
  const isPlotOwnerPrivateIconDisabled = (plot: Plot): boolean => {
    if (props.isReadonly) return true;
    if (plot.connectionEntity === true) return true;
    if (plot.plotOwner?.name !== 'Wł. prywatny') return true;
    return false;
  };
</script>

<template>
  <div class="p-6">
    <!-- Kontener główny -->
    <Card class="border border-surface-200 dark:border-surface-700 overflow-hidden">
      <!-- Header -->
      <template #header>
        <div
          class="flex items-center justify-between px-4 py-3 bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700"
        >
          <div class="flex items-center gap-4">
            <!-- Ikona mapy -->
            <div class="w-12 h-12 bg-primary-400/70 rounded-full flex items-center justify-center shrink-0">
              <MapIcon class="w-8 h-8 text-white" />
            </div>
            <!-- Tytuł i status -->
            <div>
              <h3 class="text-lg font-bold uppercase text-surface-700 dark:text-surface-300 m-0">WŁAŚCIELE DZIAŁEK</h3>
              <p class="text-sm text-surface-600 dark:text-surface-400 m-0 mt-1">
                {{ plotsStatus.text }}
              </p>
            </div>
          </div>
          <!-- Ikona checkmark po prawej stronie -->
          <div :class="checkmarkClasses">
            <CheckIcon :class="checkmarkIconClasses" />
          </div>
        </div>
      </template>

      <!-- Content -->
      <template #content>
        <div class="space-y-4">
          <!-- Lista działek -->
          <div
            v-for="plot in plots"
            :key="plot.id"
            :class="`p-4 rounded-lg border ${getPlotBorderClasses(plot)} ${getPlotBgClasses(plot)}`"
          >
            <div class="grid grid-cols-6 gap-3">
              <!-- NR DZIAŁKI -->
              <div class="mt-3">
                <label class="block text-xs uppercase text-surface-600 dark:text-surface-400 mb-1"> NR DZIAŁKI </label>
                <p
                  :class="`text-base font-bold ${
                    plot.connectionEntity
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-surface-700 dark:text-surface-300'
                  }`"
                >
                  {{ plot.plotNumber || '---' }}
                </p>
              </div>

              <!-- DATA ZŁOŻENIA -->
              <div class="mt-3">
                <label class="block text-xs uppercase text-surface-600 dark:text-surface-400 mb-1">
                  DATA ZŁOŻENIA
                </label>
                <div class="flex items-center gap-2">
                  <i class="pi pi-calendar text-surface-400 text-sm"></i>
                  <p class="text-sm text-surface-700 dark:text-surface-300 m-0">
                    {{ UtilsService.formatDateToString(plot.submissionDate) }}
                  </p>
                </div>
              </div>

              <!-- DATA OTRZYMANIA -->
              <div class="mt-3">
                <label class="block text-xs uppercase text-surface-600 dark:text-surface-400 mb-1">
                  DATA OTRZYMANIA
                </label>
                <div class="flex items-center gap-2">
                  <i class="pi pi-calendar text-surface-400 text-sm"></i>
                  <p class="text-sm text-surface-700 dark:text-surface-300 m-0">
                    {{
                      plot.receiptDate
                        ? UtilsService.formatDateToString(plot.receiptDate)
                        : plot.submissionDate
                          ? 'Brak daty'
                          : '---'
                    }}
                  </p>
                </div>
              </div>

              <!-- WŁAŚCICIEL -->
              <div class="mt-3">
                <label class="block text-xs uppercase text-surface-600 dark:text-surface-400 mb-1"> WŁAŚCICIEL </label>
                <div class="flex items-center gap-2">
                  <i
                    :class="plot.plotOwner?.name === 'Wł. prywatny' ? 'pi pi-user' : 'pi pi-building-columns'"
                    class="text-surface-400 text-sm"
                  ></i>
                  <p class="text-sm text-surface-700 dark:text-surface-300 m-0">
                    {{ plot.plotOwner?.name || 'Brak danych' }}
                  </p>
                </div>
              </div>

              <!-- DODATKOWE INFO -->
              <div class="mt-3">
                <label class="block text-xs uppercase text-surface-600 dark:text-surface-400 mb-1">
                  DODATKOWE INFO
                </label>
                <p class="text-sm text-surface-700 dark:text-surface-300 m-0">
                  {{ plot.info || 'Brak danych' }}
                </p>
              </div>

              <!-- Przyciski akcji -->
              <div class="flex flex-col items-end gap-0">
                <!-- Ikony nad przyciskami edycji/usuwania -->
                <div class="flex">
                  <!-- Ikona przełączania connectionEntity -->
                  <Button
                    :icon="plot.connectionEntity ? 'pi pi-star-fill' : 'pi pi-star'"
                    :severity="plot.connectionEntity ? 'warning' : 'secondary'"
                    text
                    rounded
                    :disabled="isReadonly"
                    :class="plot.connectionEntity ? 'text-orange-600 dark:text-orange-400' : ''"
                    @click="handleToggleConnectionEntity(plot)"
                    :title="
                      plot.connectionEntity
                        ? 'Usuń oznaczenie podmiotu przyłączanego'
                        : 'Oznacz jako podmiot przyłączany'
                    "
                  />
                  <!-- Ikona otwierania dialogu PlotOwnerPrivate -->
                  <Button
                    icon="pi pi-user-plus"
                    severity="primary"
                    text
                    rounded
                    :disabled="isPlotOwnerPrivateIconDisabled(plot)"
                    @click="handleAddPlotOwnerPrivate(plot)"
                    title="Dodaj właściciela prywatnego"
                  />
                  <!-- Ikona otwierania listy PlotOwnerPrivate -->
                  <Button
                    icon="pi pi-list"
                    severity="info"
                    text
                    rounded
                    :disabled="isPlotOwnerPrivateIconDisabled(plot)"
                    @click="handleShowPlotOwnerPrivateList(plot)"
                    title="Wyświetl listę właścicieli prywatnych"
                  />
                </div>
                <!-- Przyciski edycji i usuwania -->
                <div class="flex">
                  <Button
                    icon="pi pi-pencil"
                    severity="secondary"
                    text
                    rounded
                    :disabled="isReadonly"
                    @click="handleEditPlot(plot)"
                    title="Edytuj działkę"
                  />
                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    rounded
                    :disabled="isReadonly"
                    @click="event => handleDeletePlot(event, plot)"
                    title="Usuń działkę"
                  />
                </div>
              </div>
            </div>
            <!-- Napis o właścicielach prywatnych dla tej działki -->
            <div
              v-if="plotHasPrivateOwners(plot)"
              class="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700"
            >
              <p :class="`text-sm font-semibold uppercase m-0 ${getPlotOwnerPrivateStatusClassesForPlot(plot)}`">
                WŁAŚCICIELE DZIALEK PRYWATNYCH
              </p>
            </div>
          </div>

          <!-- Komunikat gdy brak działek -->
          <div v-if="plots.length === 0" class="p-8 text-center text-surface-600 dark:text-surface-400">
            <p>Brak działek. Kliknij "+ dodaj działkę" aby dodać pierwszą działkę.</p>
          </div>
        </div>
      </template>

      <!-- Footer -->
      <template #footer>
        <div
          class="flex items-center justify-between px-4 py-3 bg-surface-50 dark:bg-surface-900 border-t border-surface-200 dark:border-surface-700"
        >
          <p class="text-sm text-surface-600 dark:text-surface-400 m-0 flex items-center gap-2">
            <span class="w-6 h-4 bg-orange-500 dark:bg-orange-400 rounded-sm" />
            <span>- oznacza podmiot przyłączany</span>
          </p>
          <Button label="Dodaj działkę" icon="pi pi-plus" :disabled="isReadonly" @click="handleAddPlot" />
        </div>
      </template>
    </Card>

    <!-- Dialog do dodawania/edycji działki -->
    <PlotDialog
      v-model:visible="plotDialogVisible"
      :plot="editingPlot"
      :isReadonly="isReadonly"
      @save="handleSavePlot"
    />

    <!-- Dialog do dodawania PlotOwnerPrivate -->
    <PlotOwnerPrivateDialog
      v-model:visible="plotOwnerPrivateDialogVisible"
      :plot="currentPlotForPrivate"
      :editingPlotOwnerPrivate="editingPlotOwnerPrivate"
      :isReadonly="isReadonly"
      @save="handleSavePlotOwnerPrivate"
      @update:visible="
        val => {
          plotOwnerPrivateDialogVisible = val;
          if (!val) editingPlotOwnerPrivate = null;
        }
      "
    />

    <!-- Dialog z listą PlotOwnerPrivate -->
    <PlotOwnerPrivateListDialog
      v-model:visible="plotOwnerPrivateListDialogVisible"
      :plot="currentPlotForPrivateList"
      :isReadonly="isReadonly"
      @edit="handleEditPlotOwnerPrivate"
      @delete="handleDeletePlotOwnerPrivate"
    />
  </div>
</template>
