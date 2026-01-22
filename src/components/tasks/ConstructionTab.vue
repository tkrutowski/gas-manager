<script setup lang="ts">
  import { computed } from 'vue';
  import { useToast } from 'primevue/usetoast';
  import type { GasConnection } from '@/types/GasConnection';
  import { UtilsService } from '@/utils/formatService';
  import { DocumentIcon } from '@heroicons/vue/24/outline';
  import Card from 'primevue/card';
  import DatePicker from 'primevue/datepicker';
  import InputText from 'primevue/inputtext';
  import InputNumber from 'primevue/inputnumber';
  import Textarea from 'primevue/textarea';
  import Button from 'primevue/button';

  interface Props {
    gasConnection: GasConnection | undefined;
    isReadonly: boolean;
  }

  const props = defineProps<Props>();
  const toast = useToast();

  // Lista działek
  const plots = computed(() => props.gasConnection?.plots || []);

  // Funkcja wywoływana przy kliknięciu ikony "W"
  const handleWordIconClick = () => {
    toast.add({
      severity: 'info',
      summary: 'Informacja',
      detail: 'Ta funkcja nie jest jeszcze zaimplementowana.',
      life: 3000,
    });
  };
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Sekcja: ZAJĘCIE I ODBIÓR PASA -->
    <Card class="border border-surface-200 dark:border-surface-700 overflow-hidden">
      <template #header>
        <div
          class="flex items-center gap-2 px-4 py-3 border-b border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 rounded-t-xl"
        >
          <DocumentIcon class="w-5 h-5 text-primary-400" />
          <h4 class="text-sm font-bold uppercase text-surface-700 dark:text-surface-300 m-0">ZAJĘCIE I ODBIÓR PASA</h4>
        </div>
      </template>
      <template #content>
        <div class="space-y-4">
          <!-- Lista działek -->
          <div
            v-for="plot in plots"
            :key="plot.id"
            :class="`p-4 rounded-lg border border-surface-200 dark:border-surface-700 ${
              plot.connectionEntity
                ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700'
                : 'bg-surface-50 dark:bg-surface-900'
            }`"
          >
            <div class="grid grid-cols-7 gap-3">
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
                    {{ UtilsService.formatDateToString(plot.submissionDate) || '---' }}
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
                    {{ UtilsService.formatDateToString(plot.receiptDate) || '---' }}
                  </p>
                </div>
              </div>

              <!-- DATA ZAJĘCIA OD -->
              <div class="mt-3">
                <label class="block text-xs uppercase text-surface-600 dark:text-surface-400 mb-1">
                  DATA ZAJĘCIA OD
                </label>
                <div class="flex items-center gap-2">
                  <i class="pi pi-calendar text-surface-400 text-sm"></i>
                  <p class="text-sm text-surface-700 dark:text-surface-300 m-0">
                    {{ UtilsService.formatDateToString(plot.laneOccupationStartDate) || '---' }}
                  </p>
                </div>
              </div>

              <!-- DATA ODB PASA -->
              <div class="mt-3">
                <label class="block text-xs uppercase text-surface-600 dark:text-surface-400 mb-1">
                  DATA ODB PASA
                </label>
                <div class="flex items-center gap-2">
                  <i class="pi pi-calendar text-surface-400 text-sm"></i>
                  <p class="text-sm text-surface-700 dark:text-surface-300 m-0">
                    {{ UtilsService.formatDateToString(plot.laneReceiptDate) || '---' }}
                  </p>
                </div>
              </div>

              <!-- WŁAŚCICIEL -->
              <div class="mt-3">
                <label class="block text-xs uppercase text-surface-600 dark:text-surface-400 mb-1"> WŁAŚCICIEL </label>
                <p class="text-sm text-surface-700 dark:text-surface-300 m-0">
                  {{ plot.plotOwner?.name || '---' }}
                </p>
              </div>

              <!-- INFO -->
              <div class="mt-3">
                <label class="block text-xs uppercase text-surface-600 dark:text-surface-400 mb-1"> INFO </label>
                <p class="text-sm text-surface-700 dark:text-surface-300 m-0">
                  {{ plot.info || '---' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Komunikat gdy brak działek -->
          <div v-if="plots.length === 0" class="p-8 text-center text-surface-600 dark:text-surface-400">
            <p>Brak działek.</p>
          </div>
        </div>
      </template>
      <!-- Footer -->
      <template #footer>
        <div
          class="flex items-center justify-between px-4 pt-1 bg-surface-50 dark:bg-surface-900 border-t border-surface-200 dark:border-surface-700"
        >
          <p class="text-sm text-surface-600 dark:text-surface-400 m-0 flex items-center gap-2">
            <span class="w-6 h-4 bg-orange-600 dark:bg-orange-400 rounded-sm" />
            <span>- oznacza podmiot przyłączany</span>
          </p>
        </div>
      </template>
    </Card>

    <!-- Sekcje: ZAWIADOMIENIE ROZDZIELNI, GEODEZJA, REALIZACJA w jednej linii -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Sekcja: ZAWIADOMIENIE ROZDZIELNI -->
      <Card class="border border-surface-200 dark:border-surface-700 overflow-hidden">
        <template #header>
          <div
            class="flex items-center gap-2 px-4 py-3 border-b border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 rounded-t-xl"
          >
            <DocumentIcon class="w-5 h-5 text-primary-400" />
            <h4 class="text-sm font-bold uppercase text-surface-700 dark:text-surface-300 m-0">
              ZAWIADOMIENIE ROZDZIELNI
            </h4>
          </div>
        </template>
        <template #content>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Data złożenia
              </label>
              <div class="flex items-center gap-2">
                <DatePicker
                  :modelValue="gasConnection?.gasConnectionBuild?.substationNotificationSubmissionDate"
                  @update:modelValue="
                    val => {
                      if (gasConnection?.gasConnectionBuild) {
                        gasConnection.gasConnectionBuild.substationNotificationSubmissionDate = val as Date | undefined;
                      }
                    }
                  "
                  :disabled="isReadonly"
                  :manualInput="false"
                  showButtonBar
                  showIcon
                  dateFormat="dd.mm.yy"
                  class="flex-1"
                />
                <Button
                  icon="pi pi-file-word"
                  severity="info"
                  text
                  rounded
                  :disabled="isReadonly"
                  @click="handleWordIconClick"
                  title="Generuj dokument Word"
                />
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Sekcja: GEODEZJA -->
      <Card class="border border-surface-200 dark:border-surface-700 overflow-hidden">
        <template #header>
          <div
            class="flex items-center gap-2 px-4 py-3 border-b border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 rounded-t-xl"
          >
            <DocumentIcon class="w-5 h-5 text-primary-400" />
            <h4 class="text-sm font-bold uppercase text-surface-700 dark:text-surface-300 m-0">GEODEZJA</h4>
          </div>
        </template>
        <template #content>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"> Szkice </label>
              <DatePicker
                :modelValue="gasConnection?.gasConnectionBuild?.surveyingSketchesDate"
                @update:modelValue="
                  val => {
                    if (gasConnection?.gasConnectionBuild) {
                      gasConnection.gasConnectionBuild.surveyingSketchesDate = val as Date | undefined;
                    }
                  }
                "
                :disabled="isReadonly"
                :manualInput="false"
                showButtonBar
                showIcon
                dateFormat="dd.mm.yy"
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Inwentaryzacja
              </label>
              <DatePicker
                :modelValue="gasConnection?.gasConnectionBuild?.surveyingInventoryDate"
                @update:modelValue="
                  val => {
                    if (gasConnection?.gasConnectionBuild) {
                      gasConnection.gasConnectionBuild.surveyingInventoryDate = val as Date | undefined;
                    }
                  }
                "
                :disabled="isReadonly"
                :manualInput="false"
                showButtonBar
                showIcon
                dateFormat="dd.mm.yy"
                class="w-full"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Sekcja: REALIZACJA -->
      <Card class="border border-surface-200 dark:border-surface-700 overflow-hidden">
        <template #header>
          <div
            class="flex items-center gap-2 px-4 py-3 border-b border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 rounded-t-xl"
          >
            <DocumentIcon class="w-5 h-5 text-primary-400" />
            <h4 class="text-sm font-bold uppercase text-surface-700 dark:text-surface-300 m-0">REALIZACJA</h4>
          </div>
        </template>
        <template #content>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Data rozpoczęcia
              </label>
              <div class="flex items-center gap-2">
                <DatePicker
                  :modelValue="gasConnection?.gasConnectionBuild?.realizationStartDate"
                  @update:modelValue="
                    val => {
                      if (gasConnection?.gasConnectionBuild) {
                        gasConnection.gasConnectionBuild.realizationStartDate = val as Date | undefined;
                      }
                    }
                  "
                  :disabled="isReadonly"
                  :manualInput="false"
                  showButtonBar
                  showIcon
                  dateFormat="dd.mm.yy"
                  class="flex-1"
                />
                <Button
                  icon="pi pi-file-word"
                  severity="info"
                  text
                  rounded
                  :disabled="isReadonly"
                  @click="handleWordIconClick"
                  title="Generuj dokument Word"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Data zakończenia
              </label>
              <div class="flex items-center gap-2">
                <DatePicker
                  :modelValue="gasConnection?.gasConnectionBuild?.realizationEndDate"
                  @update:modelValue="
                    val => {
                      if (gasConnection?.gasConnectionBuild) {
                        gasConnection.gasConnectionBuild.realizationEndDate = val as Date | undefined;
                      }
                    }
                  "
                  :disabled="isReadonly"
                  :manualInput="false"
                  showButtonBar
                  showIcon
                  dateFormat="dd.mm.yy"
                  class="flex-1"
                />
                <Button
                  icon="pi pi-file-word"
                  severity="info"
                  text
                  rounded
                  :disabled="isReadonly"
                  @click="handleWordIconClick"
                  title="Generuj dokument Word"
                />
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Sekcja: ODBIÓR WSG -->
    <Card class="border border-surface-200 dark:border-surface-700 overflow-hidden">
      <template #header>
        <div
          class="flex items-center gap-2 px-4 py-3 border-b border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 rounded-t-xl"
        >
          <DocumentIcon class="w-5 h-5 text-primary-400" />
          <h4 class="text-sm font-bold uppercase text-surface-700 dark:text-surface-300 m-0">ODBIÓR WSG</h4>
        </div>
      </template>
      <template #content>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Lewa kolumna -->
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Odb. techniczny
              </label>
              <div class="flex items-center gap-2">
                <DatePicker
                  :modelValue="gasConnection?.gasConnectionBuild?.wsgTechnicalAcceptanceDate"
                  @update:modelValue="
                    val => {
                      if (gasConnection?.gasConnectionBuild) {
                        gasConnection.gasConnectionBuild.wsgTechnicalAcceptanceDate = val as Date | undefined;
                      }
                    }
                  "
                  :disabled="isReadonly"
                  :manualInput="false"
                  showButtonBar
                  showIcon
                  dateFormat="dd.mm.yy"
                  class="flex-1"
                />
                <Button
                  icon="pi pi-file-word"
                  severity="info"
                  text
                  rounded
                  :disabled="isReadonly"
                  @click="handleWordIconClick"
                  title="Generuj dokument Word"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Nr prot. odb. tech.
              </label>
              <InputText
                :modelValue="gasConnection?.gasConnectionBuild?.technicalAcceptanceProtocolNo"
                @update:modelValue="
                  val => {
                    if (gasConnection?.gasConnectionBuild) {
                      gasConnection.gasConnectionBuild.technicalAcceptanceProtocolNo = val as string;
                    }
                  }
                "
                :disabled="isReadonly"
                placeholder=""
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Nr inw. gazociągu
              </label>
              <InputText
                :modelValue="gasConnection?.gasConnectionBuild?.gasPipelineInventoryNumber"
                @update:modelValue="
                  val => {
                    if (gasConnection?.gasConnectionBuild) {
                      gasConnection.gasConnectionBuild.gasPipelineInventoryNumber = val as string;
                    }
                  }
                "
                :disabled="isReadonly"
                placeholder=""
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Dł. przyłącza (m)
              </label>
              <InputNumber
                :modelValue="gasConnection?.gasConnectionBuild?.gasConnectionRealLength"
                @update:modelValue="
                  val => {
                    if (gasConnection?.gasConnectionBuild) {
                      gasConnection.gasConnectionBuild.gasConnectionRealLength = (val as number) || 0;
                    }
                  }
                "
                :disabled="isReadonly"
                :min="0"
                :maxFractionDigits="4"
                :useGrouping="false"
                placeholder=""
                class="w-full"
              />
            </div>
          </div>

          <!-- Prawa kolumna -->
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Odb. koń. wysł
              </label>
              <DatePicker
                :modelValue="gasConnection?.gasConnectionBuild?.wsgFinalAcceptanceSubmissionDate"
                @update:modelValue="
                  val => {
                    if (gasConnection?.gasConnectionBuild) {
                      gasConnection.gasConnectionBuild.wsgFinalAcceptanceSubmissionDate = val as Date | undefined;
                    }
                  }
                "
                :disabled="isReadonly"
                :manualInput="false"
                showButtonBar
                showIcon
                dateFormat="dd.mm.yy"
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Odb. końcowy
              </label>
              <DatePicker
                :modelValue="gasConnection?.gasConnectionBuild?.wsgFinalAcceptanceDate"
                @update:modelValue="
                  val => {
                    if (gasConnection?.gasConnectionBuild) {
                      gasConnection.gasConnectionBuild.wsgFinalAcceptanceDate = val as Date | undefined;
                    }
                  }
                "
                :disabled="isReadonly"
                :manualInput="false"
                showButtonBar
                showIcon
                dateFormat="dd.mm.yy"
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"> Uwagi </label>
              <Textarea
                :modelValue="gasConnection?.gasConnectionBuild?.wsgInfo"
                @update:modelValue="
                  val => {
                    if (gasConnection?.gasConnectionBuild) {
                      gasConnection.gasConnectionBuild.wsgInfo = val as string;
                    }
                  }
                "
                :disabled="isReadonly"
                :rows="4"
                placeholder=""
                class="w-full"
              />
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Sekcja: PRACE GAZONIEBEZPIECZNE -->
    <Card class="border border-surface-200 dark:border-surface-700 overflow-hidden">
      <template #header>
        <div
          class="flex items-center gap-2 px-4 py-3 border-b border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 rounded-t-xl"
        >
          <DocumentIcon class="w-5 h-5 text-primary-400" />
          <h4 class="text-sm font-bold uppercase text-surface-700 dark:text-surface-300 m-0">
            PRACE GAZONIEBEZPIECZNE
          </h4>
        </div>
      </template>
      <template #content>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Lewa kolumna -->
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Nr protokołu
              </label>
              <InputText
                :modelValue="gasConnection?.pgn?.pgnNumber"
                @update:modelValue="
                  val => {
                    if (gasConnection?.pgn) {
                      gasConnection.pgn.pgnNumber = val as string;
                    }
                  }
                "
                :disabled="isReadonly"
                placeholder=""
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"> Uwagi </label>
              <Textarea
                :modelValue="gasConnection?.pgn?.info"
                @update:modelValue="
                  val => {
                    if (gasConnection?.pgn) {
                      gasConnection.pgn.info = val as string;
                    }
                  }
                "
                :disabled="isReadonly"
                :rows="4"
                placeholder=""
                class="w-full"
              />
            </div>
          </div>

          <!-- Prawa kolumna -->
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Data wykonania
              </label>
              <DatePicker
                :modelValue="gasConnection?.pgn?.workDate"
                @update:modelValue="
                  val => {
                    if (gasConnection?.pgn) {
                      gasConnection.pgn.workDate = val as Date | undefined;
                    }
                  }
                "
                :disabled="isReadonly"
                :manualInput="false"
                showButtonBar
                showIcon
                dateFormat="dd.mm.yy"
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Nr zgłoszenia
              </label>
              <InputText
                :modelValue="gasConnection?.pgn?.applicationNumber"
                @update:modelValue="
                  val => {
                    if (gasConnection?.pgn) {
                      gasConnection.pgn.applicationNumber = val as string;
                    }
                  }
                "
                :disabled="isReadonly"
                placeholder=""
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Przyjmujący zgłoszenie
              </label>
              <InputText
                :modelValue="gasConnection?.pgn?.recipient"
                @update:modelValue="
                  val => {
                    if (gasConnection?.pgn) {
                      gasConnection.pgn.recipient = val as string;
                    }
                  }
                "
                :disabled="isReadonly"
                placeholder=""
                class="w-full"
              />
            </div>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>
