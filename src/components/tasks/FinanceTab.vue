<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { useToast } from 'primevue/usetoast';
  import { useConfirm } from 'primevue/useconfirm';
  import { useCostTypesStore } from '@/stores/costTypes';
  import type { GasConnection } from '@/types/GasConnection';
  import type { Cost } from '@/types/GasConnection';
  import { formatMoney } from '@/utils/tableFormatters';
  import { CurrencyDollarIcon, ClipboardDocumentIcon } from '@heroicons/vue/24/outline';
  import Panel from 'primevue/panel';
  import Card from 'primevue/card';
  import DatePicker from 'primevue/datepicker';
  import Select from 'primevue/select';
  import InputNumber from 'primevue/inputnumber';
  import Textarea from 'primevue/textarea';
  import Button from 'primevue/button';
  import DataTable from 'primevue/datatable';
  import Column from 'primevue/column';
  import Dialog from 'primevue/dialog';
  import InputText from 'primevue/inputtext';
  import ConfirmPopup from 'primevue/confirmpopup';
  import SecondaryButton from '@/components/SecondaryButton.vue';
  import PrimaryButton from '@/components/PrimaryButton.vue';

  interface Props {
    gasConnection: GasConnection | undefined;
    isReadonly: boolean;
  }

  const props = defineProps<Props>();
  const toast = useToast();
  const confirm = useConfirm();
  const costTypesStore = useCostTypesStore();

  // Opcje dla Select CostType
  const costTypeOptions = computed(() => {
    return costTypesStore.getAllCostTypes().map(ct => ({
      label: ct.name,
      value: ct,
    }));
  });

  // Formularz dodawania/edycji kosztu
  const costFormData = ref<Partial<Cost>>({
    costType: undefined,
    paymentDate: undefined,
    amount: 0,
    description: '',
  });

  const editingCostId = ref<number | null>(null);
  const newCostTypeDialogVisible = ref(false);
  const newCostTypeName = ref('');

  // Lista kosztów
  const costList = computed(() => {
    return props.gasConnection?.gasConnectionFinance?.costList || [];
  });

  // Reset formularza
  const resetCostForm = () => {
    costFormData.value = {
      costType: undefined,
      paymentDate: undefined,
      amount: 0,
      description: '',
    };
    editingCostId.value = null;
  };

  // Zapisz koszt
  const handleSaveCost = () => {
    if (!props.gasConnection?.gasConnectionFinance) return;

    // Walidacja
    if (!costFormData.value.costType) {
      toast.add({
        severity: 'warn',
        summary: 'Błąd walidacji',
        detail: 'Wybierz typ kosztu',
        life: 3000,
      });
      return;
    }

    if (!costFormData.value.paymentDate) {
      toast.add({
        severity: 'warn',
        summary: 'Błąd walidacji',
        detail: 'Podaj datę zapłaty',
        life: 3000,
      });
      return;
    }

    if (!costFormData.value.amount || costFormData.value.amount <= 0) {
      toast.add({
        severity: 'warn',
        summary: 'Błąd walidacji',
        detail: 'Podaj kwotę większą od zera',
        life: 3000,
      });
      return;
    }

    // Zapewnij, że costList istnieje
    if (!props.gasConnection.gasConnectionFinance.costList) {
      props.gasConnection.gasConnectionFinance.costList = [] as Cost[];
    }

    const costList = props.gasConnection.gasConnectionFinance.costList as Cost[];

    if (editingCostId.value !== null) {
      // Edycja istniejącego kosztu
      const index = costList.findIndex(c => c.id === editingCostId.value);
      if (index !== -1) {
        costList[index] = {
          ...costList[index],
          costType: costFormData.value.costType!,
          paymentDate: costFormData.value.paymentDate,
          amount: costFormData.value.amount!,
          description: costFormData.value.description || '',
        };
        toast.add({
          severity: 'success',
          summary: 'Sukces',
          detail: 'Koszt został zaktualizowany',
          life: 3000,
        });
      }
    } else {
      // Dodanie nowego kosztu
      const newCost: Cost = {
        id: Date.now(), // Tymczasowe ID
        idTask: props.gasConnection.id,
        costType: costFormData.value.costType!,
        paymentDate: costFormData.value.paymentDate,
        amount: costFormData.value.amount!,
        taskType: {} as any, // Tymczasowo
        description: costFormData.value.description || '',
      };
      costList.push(newCost);
      toast.add({
        severity: 'success',
        summary: 'Sukces',
        detail: 'Koszt został dodany',
        life: 3000,
      });
    }

    resetCostForm();
  };

  // Edytuj koszt
  const handleEditCost = (cost: Cost) => {
    costFormData.value = {
      costType: cost.costType,
      paymentDate: cost.paymentDate,
      amount: cost.amount,
      description: cost.description,
    };
    editingCostId.value = cost.id;
  };

  // Usuń koszt
  const handleDeleteCost = (event: Event, cost: Cost) => {
    if (!props.gasConnection?.gasConnectionFinance?.costList) return;

    confirm.require({
      target: event.currentTarget as HTMLElement,
      message: `Czy na pewno chcesz usunąć koszt "${cost.costType?.name || ''}"?`,
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
        const index = props.gasConnection!.gasConnectionFinance!.costList.findIndex(c => c.id === cost.id);
        if (index !== -1) {
          props.gasConnection!.gasConnectionFinance!.costList.splice(index, 1);
          toast.add({
            severity: 'success',
            summary: 'Sukces',
            detail: 'Koszt został usunięty',
            life: 3000,
          });
        }
      },
    });
  };

  // Dodaj nowy typ kosztu
  const handleAddNewCostType = () => {
    if (!newCostTypeName.value.trim()) {
      toast.add({
        severity: 'warn',
        summary: 'Błąd walidacji',
        detail: 'Podaj nazwę typu kosztu',
        life: 3000,
      });
      return;
    }

    try {
      costTypesStore.addCostType(newCostTypeName.value);
      toast.add({
        severity: 'success',
        summary: 'Sukces',
        detail: 'Typ kosztu został dodany',
        life: 3000,
      });
      newCostTypeName.value = '';
      newCostTypeDialogVisible.value = false;
    } catch (error: any) {
      toast.add({
        severity: 'warn',
        summary: 'Błąd',
        detail: error.message || 'Typ kosztu o tej nazwie już istnieje',
        life: 3000,
      });
    }
  };

  // Formatowanie daty dla tabeli
  const formatPaymentDate = (date: Date | undefined | null): string => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  };
</script>

<template>
  <div class="space-y-6">
    <!-- Panel z 3 elementami finansowymi -->
    <Panel toggleable>
      <template #header>
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center gap-4">
            <!-- Ikona finansowa -->
            <div class="w-12 h-12 bg-yellow-400/70 rounded-full flex items-center justify-center shrink-0">
              <CurrencyDollarIcon class="w-8 h-8 text-white" />
            </div>
            <!-- Tekst -->
            <div>
              <div class="text-lg font-bold uppercase text-surface-700 dark:text-surface-300">PŁATNOŚCI</div>
              <div class="text-sm text-surface-600 dark:text-surface-400">
                Zarządzanie płatnościami za inwentaryzację, projekt i pas drogowy
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 3 karty obok siebie -->
      <div class="p-6">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- INWENTARYZACJA -->
          <Card class="border border-surface-200 dark:border-surface-700 overflow-hidden">
            <template #header>
              <div
                class="flex items-center gap-2 px-4 py-3 border-b border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 rounded-t-xl"
              >
                <h4 class="text-sm font-bold uppercase text-surface-700 dark:text-surface-300 m-0">INWENTARYZACJA</h4>
              </div>
            </template>
            <template #content>
              <div class="space-y-4 p-4">
                <div>
                  <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Kwota do zapłaty (netto):
                  </label>
                  <InputNumber
                    :modelValue="gasConnection?.gasConnectionFinance?.financeInventoryAmount"
                    @update:modelValue="
                      val => {
                        if (gasConnection?.gasConnectionFinance) {
                          gasConnection.gasConnectionFinance.financeInventoryAmount = (val as number) || 0;
                        }
                      }
                    "
                    :disabled="isReadonly"
                    :min="0"
                    :maxFractionDigits="2"
                    :useGrouping="false"
                    mode="decimal"
                    class="w-full"
                    suffix=" zł."
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Data zapłaty:
                  </label>
                  <div class="flex items-center gap-2">
                    <DatePicker
                      :modelValue="gasConnection?.gasConnectionFinance?.financeInventoryDate"
                      @update:modelValue="
                        val => {
                          if (gasConnection?.gasConnectionFinance) {
                            gasConnection.gasConnectionFinance.financeInventoryDate = val as Date | undefined;
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
                  </div>
                </div>
              </div>
            </template>
          </Card>

          <!-- PROJEKT -->
          <Card class="border border-surface-200 dark:border-surface-700 overflow-hidden">
            <template #header>
              <div
                class="flex items-center gap-2 px-4 py-3 border-b border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 rounded-t-xl"
              >
                <h4 class="text-sm font-bold uppercase text-surface-700 dark:text-surface-300 m-0">PROJEKT</h4>
              </div>
            </template>
            <template #content>
              <div class="space-y-4 p-4">
                <div>
                  <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Kwota do zapłaty (netto):
                  </label>
                  <InputNumber
                    :modelValue="gasConnection?.gasConnectionFinance?.financeProjectAmount"
                    @update:modelValue="
                      val => {
                        if (gasConnection?.gasConnectionFinance) {
                          gasConnection.gasConnectionFinance.financeProjectAmount = (val as number) || 0;
                        }
                      }
                    "
                    :disabled="isReadonly"
                    :min="0"
                    :maxFractionDigits="2"
                    :useGrouping="false"
                    mode="decimal"
                    class="w-full"
                    suffix=" zł."
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Data zapłaty:
                  </label>
                  <div class="flex items-center gap-2">
                    <DatePicker
                      :modelValue="gasConnection?.gasConnectionFinance?.financeProjectDate"
                      @update:modelValue="
                        val => {
                          if (gasConnection?.gasConnectionFinance) {
                            gasConnection.gasConnectionFinance.financeProjectDate = val as Date | undefined;
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
                  </div>
                </div>
              </div>
            </template>
          </Card>

          <!-- PAS DROGOWY -->
          <Card class="border border-surface-200 dark:border-surface-700 overflow-hidden">
            <template #header>
              <div
                class="flex items-center gap-2 px-4 py-3 border-b border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 rounded-t-xl"
              >
                <h4 class="text-sm font-bold uppercase text-surface-700 dark:text-surface-300 m-0">PAS DROGOWY</h4>
              </div>
            </template>
            <template #content>
              <div class="space-y-4 p-4">
                <div>
                  <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Kwota do zapłaty (netto):
                  </label>
                  <InputNumber
                    :modelValue="gasConnection?.gasConnectionFinance?.financeRoadPastureAmount"
                    @update:modelValue="
                      val => {
                        if (gasConnection?.gasConnectionFinance) {
                          gasConnection.gasConnectionFinance.financeRoadPastureAmount = (val as number) || 0;
                        }
                      }
                    "
                    :disabled="isReadonly"
                    :min="0"
                    :maxFractionDigits="2"
                    :useGrouping="false"
                    mode="decimal"
                    class="w-full"
                    suffix=" zł."
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Data zapłaty:
                  </label>
                  <div class="flex items-center gap-2">
                    <DatePicker
                      :modelValue="gasConnection?.gasConnectionFinance?.financeRoadPastureDate"
                      @update:modelValue="
                        val => {
                          if (gasConnection?.gasConnectionFinance) {
                            gasConnection.gasConnectionFinance.financeRoadPastureDate = val as Date | undefined;
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
                  </div>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </Panel>

    <!-- Panel DODAWANIE KOSZTÓW -->
    <Panel toggleable class="mt-6">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center gap-4">
            <!-- Ikona -->
            <div class="w-12 h-12 bg-yellow-400/70 rounded-full flex items-center justify-center shrink-0">
              <ClipboardDocumentIcon class="w-8 h-8 text-white" />
            </div>
            <!-- Tekst -->
            <div>
              <div class="text-lg font-bold uppercase text-surface-700 dark:text-surface-300">DODAWANIE KOSZTÓW</div>
              <div class="text-sm text-surface-600 dark:text-surface-400">
                Zarządzanie kosztami związanymi z realizacją zadania
              </div>
            </div>
          </div>
        </div>
      </template>

      <div class="p-6 space-y-6">
        <!-- Formularz dodawania kosztu -->
        <Card class="border border-surface-200 dark:border-surface-700 overflow-hidden">
          <template #header>
            <div
              class="flex items-center gap-2 px-4 py-3 border-b border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 rounded-t-xl"
            >
              <h4 class="text-sm font-bold uppercase text-surface-700 dark:text-surface-300 m-0">Dodawanie kosztów</h4>
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              <!-- Lewa kolumna -->
              <div class="space-y-4">
                <!-- Nazwa -->
                <div>
                  <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"> Nazwa: </label>
                  <div class="flex items-center gap-2">
                    <Select
                      v-model="costFormData.costType"
                      :options="costTypeOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="wybierz"
                      class="flex-1"
                      :disabled="isReadonly"
                    />
                    <Button
                      label="Nowy"
                      severity="secondary"
                      size="small"
                      :disabled="isReadonly"
                      @click="newCostTypeDialogVisible = true"
                    />
                  </div>
                </div>

                <!-- Data zapł. -->
                <div>
                  <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Data zapł.:
                  </label>
                  <DatePicker
                    v-model="costFormData.paymentDate"
                    :disabled="isReadonly"
                    :manualInput="false"
                    showButtonBar
                    showIcon
                    dateFormat="dd.mm.yy"
                    class="w-full"
                  />
                </div>

                <!-- Kwota (netto) -->
                <div>
                  <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Kwota (netto):
                  </label>
                  <InputNumber
                    v-model="costFormData.amount"
                    :disabled="isReadonly"
                    :min="0"
                    :maxFractionDigits="2"
                    :useGrouping="false"
                    mode="decimal"
                    class="w-full"
                  />
                </div>

                <!-- Przycisk Zapisz -->
                <div class="flex justify-end">
                  <PrimaryButton
                    type="button"
                    :text="editingCostId !== null ? 'Aktualizuj' : 'Zapisz'"
                    :disabled="isReadonly"
                    @click="handleSaveCost"
                    size="sm"
                  />
                </div>
              </div>

              <!-- Prawa kolumna - Info -->
              <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Dodatkowe Informacje:
                </label>
                <Textarea v-model="costFormData.description" :disabled="isReadonly" :rows="10" class="w-full" />
              </div>
            </div>
          </template>
        </Card>

        <!-- Tabela kosztów -->
        <Card class="border border-surface-200 dark:border-surface-700 overflow-hidden">
          <template #content>
            <DataTable :value="costList" :loading="false" class="w-full">
              <Column field="id" header="Lp" style="width: 60px">
                <template #body="{ index }">
                  {{ index + 1 }}
                </template>
              </Column>
              <Column field="costType.name" header="Nazwa" />
              <Column field="amount" header="Kwota netto">
                <template #body="{ data }">
                  {{ formatMoney(data.amount) }}
                </template>
              </Column>
              <Column field="paymentDate" header="Data zapł.">
                <template #body="{ data }">
                  {{ formatPaymentDate(data.paymentDate) }}
                </template>
              </Column>
              <Column field="description" header="Info" />
              <Column header="Akcje" style="width: 120px" :exportable="false">
                <template #body="{ data }">
                  <div class="flex items-center gap-2">
                    <Button
                      icon="pi pi-pencil"
                      text
                      severity="secondary"
                      rounded
                      :disabled="isReadonly"
                      @click="handleEditCost(data)"
                    />
                    <Button
                      icon="pi pi-trash"
                      text
                      severity="danger"
                      rounded
                      :disabled="isReadonly"
                      @click="event => handleDeleteCost(event, data)"
                    />
                  </div>
                </template>
              </Column>
            </DataTable>
          </template>
        </Card>
      </div>
    </Panel>

    <!-- Dialog dodawania nowego typu kosztu -->
    <Dialog v-model:visible="newCostTypeDialogVisible" modal header="Dodaj nowy typ kosztu" :style="{ width: '500px' }">
      <div class="space-y-4 p-4">
        <div>
          <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            Nazwa typu kosztu:
          </label>
          <InputText
            v-model="newCostTypeName"
            placeholder="wprowadź nazwę"
            class="w-full"
            @keyup.enter="handleAddNewCostType"
          />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <SecondaryButton type="button" @click="newCostTypeDialogVisible = false" text="Anuluj" size="lg" />
          <PrimaryButton type="button" @click="handleAddNewCostType" text="Dodaj" size="lg" />
        </div>
      </template>
    </Dialog>

    <!-- ConfirmPopup dla potwierdzeń -->
    <ConfirmPopup />
  </div>
</template>
