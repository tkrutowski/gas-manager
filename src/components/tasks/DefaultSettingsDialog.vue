<script setup lang="ts">
  import { ref, onMounted, computed } from 'vue';
  import { useSettingsStore } from '@/stores/settings';
  import { useCustomersStore } from '@/stores/customers';
  import { useDesignersStore } from '@/stores/designers';
  import { useCoordinatorsStore } from '@/stores/coordinators';
  import { useGasDistributionsStore } from '@/stores/gasDistributions';
  import type { Customer } from '@/types/Customer';
  import type { Designer } from '@/types/Designer';
  import type { Coordinator } from '@/types/Coordinator';
  import type { GasDistribution } from '@/types/GasDistribution';
  import PrimaryButton from '@/components/PrimaryButton.vue';
  import SecondaryButton from '@/components/SecondaryButton.vue';

  const props = defineProps<{
    sectionName: 'customer' | 'endCustomer' | 'finance' | 'team';
    title: string;
  }>();

  const emit = defineEmits<{
    close: [];
    saved: [];
  }>();

  const settingsStore = useSettingsStore();
  const customersStore = useCustomersStore();
  const designersStore = useDesignersStore();
  const coordinatorsStore = useCoordinatorsStore();
  const gasDistributionsStore = useGasDistributionsStore();

  // Customer/EndCustomer fields
  const selectedCustomer = ref<Customer | null>(null);
  const customerSearchQuery = ref('');
  const customerSuggestions = ref<Customer[]>([]);

  // Finance field
  const selectedGasDistribution = ref<GasDistribution | null>(null);

  // Team fields
  const selectedDesigner = ref<Designer | null>(null);
  const designerSearchQuery = ref('');
  const designerSuggestions = ref<Designer[]>([]);

  const selectedCoordinator = ref<Coordinator | null>(null);
  const coordinatorSearchQuery = ref('');
  const coordinatorSuggestions = ref<Coordinator[]>([]);

  const selectedCoordinatorProject = ref<Coordinator | null>(null);
  const coordinatorProjectSearchQuery = ref('');
  const coordinatorProjectSuggestions = ref<Coordinator[]>([]);

  const isPGN = ref(false);

  // Current defaults
  const currentDefault = computed(() => {
    if (props.sectionName === 'customer') {
      return settingsStore.getDefaultValueData('customer') as Customer | null;
    } else if (props.sectionName === 'endCustomer') {
      return settingsStore.getDefaultValueData('endCustomer') as Customer | null;
    } else if (props.sectionName === 'finance') {
      return settingsStore.getDefaultValueData('gasDistribution') as GasDistribution | null;
    }
    return null;
  });

  const hasTeamDefaults = computed(() => {
    try {
      const settings = settingsStore.getGasConnectionSettings;
      if (!settings) return false;
      return !!(
        settings.defaults?.designer ||
        settings.defaults?.coordinator ||
        settings.defaults?.coordinatorProject ||
        settings.defaults?.isPGN !== undefined
      );
    } catch (error) {
      console.error('Błąd podczas sprawdzania domyślnych wartości zespołu:', error);
      return false;
    }
  });

  onMounted(() => {
    // Initialize suggestions first
    customerSuggestions.value = customersStore.getAllCustomers({ status: true });
    designerSuggestions.value = designersStore.getAllDesigners({ status: true });
    coordinatorSuggestions.value = coordinatorsStore.getAllCoordinators({ status: true });
    coordinatorProjectSuggestions.value = coordinatorsStore.getAllCoordinators({ status: true });

    // Load current defaults
    if (props.sectionName === 'customer') {
      const defaultCustomer = settingsStore.getDefaultValueData('customer') as Customer | null;
      if (defaultCustomer) {
        selectedCustomer.value = defaultCustomer;
        customerSearchQuery.value = getCustomerDisplayName(defaultCustomer);
        // Upewnij się, że wybrany klient jest w suggestions
        if (!customerSuggestions.value.find(c => c.id === defaultCustomer.id)) {
          customerSuggestions.value = [defaultCustomer, ...customerSuggestions.value];
        }
      }
    } else if (props.sectionName === 'endCustomer') {
      const defaultEndCustomer = settingsStore.getDefaultValueData('endCustomer') as Customer | null;
      if (defaultEndCustomer) {
        selectedCustomer.value = defaultEndCustomer;
        customerSearchQuery.value = getCustomerDisplayName(defaultEndCustomer);
        // Upewnij się, że wybrany klient jest w suggestions
        if (!customerSuggestions.value.find(c => c.id === defaultEndCustomer.id)) {
          customerSuggestions.value = [defaultEndCustomer, ...customerSuggestions.value];
        }
      }
    } else if (props.sectionName === 'finance') {
      const defaultGasDistribution = settingsStore.getDefaultValueData('gasDistribution') as GasDistribution | null;
      if (defaultGasDistribution) {
        selectedGasDistribution.value = defaultGasDistribution;
      }
    } else if (props.sectionName === 'team') {
      const defaultDesigner = settingsStore.getDefaultValueData('designer') as Designer | null;
      if (defaultDesigner) {
        selectedDesigner.value = defaultDesigner;
        designerSearchQuery.value = `${defaultDesigner.name} ${defaultDesigner.lastName}`;
        // Upewnij się, że wybrany projektant jest w suggestions
        if (!designerSuggestions.value.find(d => d.id === defaultDesigner.id)) {
          designerSuggestions.value = [defaultDesigner, ...designerSuggestions.value];
        }
      }

      const defaultCoordinator = settingsStore.getDefaultValueData('coordinator') as Coordinator | null;
      if (defaultCoordinator) {
        selectedCoordinator.value = defaultCoordinator;
        coordinatorSearchQuery.value = `${defaultCoordinator.name} ${defaultCoordinator.lastName}`;
        // Upewnij się, że wybrany koordynator jest w suggestions
        if (!coordinatorSuggestions.value.find(c => c.id === defaultCoordinator.id)) {
          coordinatorSuggestions.value = [defaultCoordinator, ...coordinatorSuggestions.value];
        }
      }

      const defaultCoordinatorProject = settingsStore.getDefaultValueData('coordinatorProject') as Coordinator | null;
      if (defaultCoordinatorProject) {
        selectedCoordinatorProject.value = defaultCoordinatorProject;
        coordinatorProjectSearchQuery.value = `${defaultCoordinatorProject.name} ${defaultCoordinatorProject.lastName}`;
        // Upewnij się, że wybrany koordynator projektu jest w suggestions
        if (!coordinatorProjectSuggestions.value.find(c => c.id === defaultCoordinatorProject.id)) {
          coordinatorProjectSuggestions.value = [defaultCoordinatorProject, ...coordinatorProjectSuggestions.value];
        }
      }

      try {
        const settings = settingsStore.getGasConnectionSettings;
        if (settings?.defaults?.isPGN !== undefined) {
          isPGN.value = settings.defaults.isPGN;
        }
      } catch (error) {
        console.error('Błąd podczas wczytywania ustawień PGN:', error);
      }
    }
  });

  // Customer display name
  const getCustomerDisplayName = (customer: Customer | null): string => {
    if (!customer) return '';
    if (customer.customerType === 'person') {
      return `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
    }
    return customer.companyName || '';
  };

  // Search functions
  const searchCustomers = (event: any) => {
    const query = event.query;
    if (!query.trim()) {
      customerSuggestions.value = customersStore.getAllCustomers({ status: true });
    } else {
      customerSuggestions.value = customersStore.searchCustomers(query).filter(c => c.status);
    }
  };

  const searchDesigners = (event: any) => {
    const query = event.query;
    if (!query.trim()) {
      designerSuggestions.value = designersStore.getAllDesigners({ status: true });
    } else {
      designerSuggestions.value = designersStore.searchDesigners(query).filter(d => d.status);
    }
  };

  const searchCoordinators = (event: any) => {
    const query = event.query;
    if (!query.trim()) {
      coordinatorSuggestions.value = coordinatorsStore.getAllCoordinators({ status: true });
    } else {
      coordinatorSuggestions.value = coordinatorsStore.searchCoordinators(query).filter(c => c.status);
    }
  };

  const searchCoordinatorProjects = (event: any) => {
    const query = event.query;
    if (!query.trim()) {
      coordinatorProjectSuggestions.value = coordinatorsStore.getAllCoordinators({ status: true });
    } else {
      coordinatorProjectSuggestions.value = coordinatorsStore.searchCoordinators(query).filter(c => c.status);
    }
  };

  // Handlers
  const handleCustomerSelect = (customer: Customer | null) => {
    selectedCustomer.value = customer;
    if (customer) {
      customerSearchQuery.value = getCustomerDisplayName(customer);
    }
  };

  const handleDesignerSelect = (designer: Designer | null) => {
    selectedDesigner.value = designer;
    if (designer) {
      designerSearchQuery.value = `${designer.name} ${designer.lastName}`;
    }
  };

  const handleCoordinatorSelect = (coordinator: Coordinator | null) => {
    selectedCoordinator.value = coordinator;
    if (coordinator) {
      coordinatorSearchQuery.value = `${coordinator.name} ${coordinator.lastName}`;
    }
  };

  const handleCoordinatorProjectSelect = (coordinator: Coordinator | null) => {
    selectedCoordinatorProject.value = coordinator;
    if (coordinator) {
      coordinatorProjectSearchQuery.value = `${coordinator.name} ${coordinator.lastName}`;
    }
  };

  const handleSave = () => {
    if (props.sectionName === 'customer') {
      if (selectedCustomer.value) {
        settingsStore.setDefaultValue('customer', selectedCustomer.value.id);
      } else {
        // Jeśli wartość jest null, usuń domyślną wartość
        settingsStore.removeDefaultValue('customer');
      }
    } else if (props.sectionName === 'endCustomer') {
      if (selectedCustomer.value) {
        settingsStore.setDefaultValue('endCustomer', selectedCustomer.value.id);
      } else {
        // Jeśli wartość jest null, usuń domyślną wartość
        settingsStore.removeDefaultValue('endCustomer');
      }
    } else if (props.sectionName === 'finance') {
      if (selectedGasDistribution.value) {
        settingsStore.setDefaultValue('gasDistribution', selectedGasDistribution.value.id);
      } else {
        // Jeśli wartość jest null, usuń domyślną wartość
        settingsStore.removeDefaultValue('gasDistribution');
      }
    } else if (props.sectionName === 'team') {
      settingsStore.setTeamDefaults({
        designerId: selectedDesigner.value?.id,
        coordinatorId: selectedCoordinator.value?.id,
        coordinatorProjectId: selectedCoordinatorProject.value?.id,
        isPGN: isPGN.value,
      });
    }

    emit('saved');
    emit('close');
  };

  const handleClose = () => {
    emit('close');
  };
</script>

<template>
  <Dialog
    :visible="true"
    :modal="true"
    :closable="true"
    :draggable="false"
    :style="{ width: sectionName === 'team' ? '600px' : '500px' }"
    @update:visible="handleClose"
    class="bg-surface-50 dark:bg-surface-900"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <i class="pi pi-cog text-primary-400"></i>
        <h3 class="text-lg font-semibold text-surface-700 dark:text-surface-300">
          {{ title }}
        </h3>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Customer / EndCustomer Section -->
      <div v-if="sectionName === 'customer' || sectionName === 'endCustomer'">
        <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
          Wybierz domyślnego {{ sectionName === 'customer' ? 'zleceniodawcę' : 'klienta' }}
        </label>
        <div class="relative">
          <AutoComplete
            v-model="selectedCustomer"
            :suggestions="customerSuggestions"
            @complete="searchCustomers"
            placeholder="Wybierz klienta..."
            class="w-full"
            @item-select="e => handleCustomerSelect(e.value)"
            dropdown
            :optionLabel="(customer: Customer) => getCustomerDisplayName(customer)"
            :inputValue="customerSearchQuery"
            @update:inputValue="(value: string) => (customerSearchQuery = value)"
          >
            <template #option="{ option }">
              <div>{{ getCustomerDisplayName(option) }}</div>
            </template>
          </AutoComplete>
          <button
            v-if="selectedCustomer"
            type="button"
            @click="
              selectedCustomer = null;
              customerSearchQuery = '';
            "
            class="absolute right-12 top-1/2 -translate-y-1/2 text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 transition-colors z-10"
            title="Usuń wybraną wartość"
          >
            <i class="pi pi-times text-sm"></i>
          </button>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Ta wartość będzie automatycznie ustawiana przy tworzeniu nowego zadania. Możesz ją usunąć klikając ikonę X.
        </p>
      </div>

      <!-- Finance Section -->
      <div v-if="sectionName === 'finance'">
        <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
          Wybierz domyślną jednostkę zlecającą
        </label>
        <Select
          v-model="selectedGasDistribution"
          :options="gasDistributionsStore.activeGasDistributions"
          placeholder="Wybierz jednostkę..."
          class="w-full"
          optionLabel="name"
          :filter="true"
          filterPlaceholder="Szukaj jednostki..."
          :showClear="true"
        />
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Ta wartość będzie automatycznie ustawiana przy tworzeniu nowego zadania. Możesz ją usunąć klikając ikonę X.
        </p>
      </div>

      <!-- Team Section -->
      <div v-if="sectionName === 'team'" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"> Projektant </label>
          <div class="relative">
            <AutoComplete
              v-model="selectedDesigner"
              :suggestions="designerSuggestions"
              @complete="searchDesigners"
              placeholder="Wybierz projektanta..."
              class="w-full"
              @item-select="e => handleDesignerSelect(e.value)"
              dropdown
              :optionLabel="(designer: Designer) => `${designer.name} ${designer.lastName}`"
              :inputValue="designerSearchQuery"
              @update:inputValue="(value: string) => (designerSearchQuery = value)"
            >
              <template #option="{ option }">
                <div>{{ option.name }} {{ option.lastName }}</div>
              </template>
            </AutoComplete>
            <button
              v-if="selectedDesigner"
              type="button"
              @click="
                selectedDesigner = null;
                designerSearchQuery = '';
              "
              class="absolute right-12 top-1/2 -translate-y-1/2 text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 transition-colors z-10"
              title="Usuń wybraną wartość"
            >
              <i class="pi pi-times text-sm"></i>
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"> Koordynator </label>
          <div class="relative">
            <AutoComplete
              v-model="selectedCoordinator"
              :suggestions="coordinatorSuggestions"
              @complete="searchCoordinators"
              placeholder="Wybierz koordynatora..."
              class="w-full"
              @item-select="e => handleCoordinatorSelect(e.value)"
              dropdown
              :optionLabel="(coordinator: Coordinator) => `${coordinator.name} ${coordinator.lastName}`"
              :inputValue="coordinatorSearchQuery"
              @update:inputValue="(value: string) => (coordinatorSearchQuery = value)"
            >
              <template #option="{ option }">
                <div>{{ option.name }} {{ option.lastName }}</div>
              </template>
            </AutoComplete>
            <button
              v-if="selectedCoordinator"
              type="button"
              @click="
                selectedCoordinator = null;
                coordinatorSearchQuery = '';
              "
              class="absolute right-12 top-1/2 -translate-y-1/2 text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 transition-colors z-10"
              title="Usuń wybraną wartość"
            >
              <i class="pi pi-times text-sm"></i>
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            Koordynator projekt
          </label>
          <div class="relative">
            <AutoComplete
              v-model="selectedCoordinatorProject"
              :suggestions="coordinatorProjectSuggestions"
              @complete="searchCoordinatorProjects"
              placeholder="Wybierz koordynatora projektu..."
              class="w-full"
              @item-select="e => handleCoordinatorProjectSelect(e.value)"
              dropdown
              :optionLabel="(coordinator: Coordinator) => `${coordinator.name} ${coordinator.lastName}`"
              :inputValue="coordinatorProjectSearchQuery"
              @update:inputValue="(value: string) => (coordinatorProjectSearchQuery = value)"
            >
              <template #option="{ option }">
                <div>{{ option.name }} {{ option.lastName }}</div>
              </template>
            </AutoComplete>
            <button
              v-if="selectedCoordinatorProject"
              type="button"
              @click="
                selectedCoordinatorProject = null;
                coordinatorProjectSearchQuery = '';
              "
              class="absolute right-12 top-1/2 -translate-y-1/2 text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 transition-colors z-10"
              title="Usuń wybraną wartość"
            >
              <i class="pi pi-times text-sm"></i>
            </button>
          </div>
        </div>

        <div>
          <div class="flex items-center gap-2">
            <Checkbox v-model="isPGN" :binary="true" inputId="pgn-default" />
            <label for="pgn-default" class="text-surface-700 dark:text-surface-300">
              Prace gazoniebezpieczne (PGN)
            </label>
          </div>
        </div>

        <p class="text-sm text-gray-600 dark:text-gray-400">
          Te wartości będą automatycznie ustawiane przy tworzeniu nowego zadania. Możesz je usunąć klikając ikonę X przy
          każdym polu.
        </p>
      </div>

      <!-- Current Default Info -->
      <div
        v-if="
          (sectionName === 'customer' || sectionName === 'endCustomer' || sectionName === 'finance') && currentDefault
        "
        class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
      >
        <p class="text-sm text-surface-700 dark:text-surface-300">
          <strong>Aktualna wartość domyślna: </strong>
          <span v-if="sectionName === 'customer' || sectionName === 'endCustomer'">
            {{ getCustomerDisplayName(currentDefault as Customer) }}
          </span>
          <span v-else-if="sectionName === 'finance'">
            {{ (currentDefault as GasDistribution)?.name }}
          </span>
        </p>
      </div>

      <div v-if="sectionName === 'team' && hasTeamDefaults" class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p class="text-sm text-surface-700 dark:text-surface-300">
          <strong>Aktualne wartości domyślne:</strong>
        </p>
        <ul class="list-disc list-inside mt-1 space-y-1">
          <li v-if="settingsStore.getDefaultValueData('designer') as Designer | null">
            Projektant: {{ (settingsStore.getDefaultValueData('designer') as Designer | null)?.name }}
            {{ (settingsStore.getDefaultValueData('designer') as Designer | null)?.lastName }}
          </li>
          <li v-if="settingsStore.getDefaultValueData('coordinator') as Coordinator | null">
            Koordynator: {{ (settingsStore.getDefaultValueData('coordinator') as Coordinator | null)?.name }}
            {{ (settingsStore.getDefaultValueData('coordinator') as Coordinator | null)?.lastName }}
          </li>
          <li v-if="settingsStore.getDefaultValueData('coordinatorProject') as Coordinator | null">
            Koordynator projekt:
            {{ (settingsStore.getDefaultValueData('coordinatorProject') as Coordinator | null)?.name }}
            {{ (settingsStore.getDefaultValueData('coordinatorProject') as Coordinator | null)?.lastName }}
          </li>
          <li v-if="settingsStore.getGasConnectionSettings?.defaults?.isPGN !== undefined">
            PGN: {{ settingsStore.getGasConnectionSettings?.defaults?.isPGN ? 'Tak' : 'Nie' }}
          </li>
        </ul>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <SecondaryButton type="button" @click="handleClose" text="Anuluj" size="lg" />
        <PrimaryButton type="button" @click="handleSave" text="Zapisz" size="lg" />
      </div>
    </template>
  </Dialog>
</template>
