<script setup lang="ts">
  import { ref, onMounted, watch } from 'vue';
  import { useToast } from 'primevue/usetoast';
  import { useCustomersStore } from '@/stores/customers';
  import { useDesignersStore } from '@/stores/designers';
  import { useCoordinatorsStore } from '@/stores/coordinators';
  import { useGasDistributionsStore } from '@/stores/gasDistributions';
  import { useSettingsStore } from '@/stores/settings';
  import type { GasConnection } from '@/types/GasConnection';
  import type { Customer } from '@/types/Customer';
  import type { Designer } from '@/types/Designer';
  import type { Coordinator } from '@/types/Coordinator';
  import type { GasDistribution } from '@/types/GasDistribution';
  import { Phase } from '@/types/GasConnection';
  import CustomerDetailsDialog from '@/components/CustomerDetailsDialog.vue';
  import CustomerFormDialog from '@/components/CustomerFormDialog.vue';
  import DesignerFormDialog from '@/components/tasks/DesignerFormDialog.vue';
  import CoordinatorFormDialog from '@/components/tasks/CoordinatorFormDialog.vue';
  import GasDistributionFormDialog from '@/components/tasks/GasDistributionFormDialog.vue';
  import DefaultSettingsDialog from '@/components/tasks/DefaultSettingsDialog.vue';
  import PrimaryButton from '@/components/PrimaryButton.vue';
  import SecondaryButton from '@/components/SecondaryButton.vue';
  import Button from 'primevue/button';
  import { UserIcon, MapPinIcon, DocumentTextIcon, CurrencyDollarIcon, UserGroupIcon } from '@heroicons/vue/24/outline';

  const props = defineProps<{
    gasConnection?: GasConnection;
  }>();

  const emit = defineEmits<{
    submit: [data: GasConnection];
    cancel: [];
  }>();

  const toast = useToast();
  const customersStore = useCustomersStore();
  const designersStore = useDesignersStore();
  const coordinatorsStore = useCoordinatorsStore();
  const gasDistributionsStore = useGasDistributionsStore();
  const settingsStore = useSettingsStore();

  // Form data
  const formData = ref<Partial<GasConnection>>({
    id: props.gasConnection?.id || 0,
    designer: undefined,
    coordinator: undefined,
    customer: undefined,
    endCustomer: undefined,
    address: undefined,
    plots: [],
    workRangeGasConnections: [],
    workRangeGasStations: [],
    workRangeConnection: {
      id: 0,
      idTask: 0,
      taskType: undefined,
      info: '',
      diameter: undefined,
      material: undefined,
      pressure: undefined,
    },
    pgn: {
      id: 0,
      idTask: 0,
      pgnNumber: '',
      applicationNumber: '',
      recipient: '',
      workDate: undefined,
      info: '',
      taskType: {
        name: 'GAS_CONNECTION',
        viewName: 'przylacze',
      },
    },
    taskNo: '',
    contractNo: '',
    contractDate: undefined,
    conditionNo: '',
    conditionDate: undefined,
    gasDistribution: undefined,
    connectionAgreementNumber: '',
    sapUpNo: '',
    accelerationDate: undefined,
    taskValue: 0,
    finishDeadline: undefined,
    projectDeadline: undefined,
    projectValue: 0,
    wsgFinalPickupDate: undefined,
    constructionValue: 0,
    isPGN: false,
    info: '',
    isFinished: false,
    idGasConnectionSync: false,
    phase: Phase.NONE,
    gasConnectionDesign: {
      projectOrderSubmissionDate: undefined,
      projectOrderConfirmationDate: undefined,
      proxySubmissionDate: undefined,
      proxyReceiptDate: undefined,
      mapSubmissionDate: undefined,
      mapReceiptDate: undefined,
      mapDeliveredBy: undefined,
      mapSurveyor: null,
      extractSubmissionDate: undefined,
      extractReceiptDate: undefined,
      withoutZud: false,
      zudpSubmissionDate: undefined,
      zudpReceiptDate: undefined,
      utilityCompanyType: null,
      utilityCompanySubmissionDate: undefined,
      utilityCompanyReceiptDate: undefined,
      wsgAgreementSubmissionDate: undefined,
      wsgAgreementReceiptDate: undefined,
      wsgAgreementAgreementDate: undefined,
      wsgAgreementNo: '',
      wsgAgreementPointSchemeSubmissionDate: undefined,
      wsgAgreementPointSchemeReceiptDate: undefined,
      withoutTrafficOrganizationProject: false,
      trafficOrganizationProjectSubmissionDate: undefined,
      trafficOrganizationProjectReceiptDate: undefined,
      designerTraffic: null,
      gasPointOrderDate: undefined,
      gasPointPickupDate: undefined,
      gasPointDocPickupDate: undefined,
      gasPointOrderNo: '',
      zudpSentToSurveyorDate: undefined,
      surveyorTrafficProject: null,
    },
    gasConnectionBuild: {
      substationNotificationSubmissionDate: undefined,
      surveyingSketchesDate: undefined,
      surveyingInventoryDate: undefined,
      realizationStartDate: undefined,
      realizationEndDate: undefined,
      wsgTechnicalAcceptanceDate: undefined,
      wsgFinalAcceptanceSubmissionDate: undefined,
      wsgFinalAcceptanceDate: undefined,
      gasConnectionRealLength: 0,
      technicalAcceptanceProtocolNo: '',
      gasPipelineInventoryNumber: '',
      wsgInfo: '',
    },
    gasConnectionFinance: {
      financeInventoryAmount: 0,
      financeInventoryDate: undefined,
      financeProjectAmount: 0,
      financeProjectDate: undefined,
      financeRoadPastureAmount: 0,
      financeRoadPastureDate: undefined,
      costList: [],
    },
  });

  // Address fields
  const addressCommune = ref('');
  const addressCity = ref('');
  const addressStreet = ref('');

  // Search queries and suggestions
  const customerSearchQuery = ref('');
  const customerSuggestions = ref<Customer[]>([]);
  const endCustomerSearchQuery = ref('');
  const endCustomerSuggestions = ref<Customer[]>([]);
  const designerSearchQuery = ref('');
  const designerSuggestions = ref<Designer[]>([]);
  const coordinatorSearchQuery = ref('');
  const coordinatorSuggestions = ref<Coordinator[]>([]);
  const coordinatorProjectSearchQuery = ref('');
  const coordinatorProjectSuggestions = ref<Coordinator[]>([]);

  // Dialog states
  const showCustomerDetailsDialog = ref(false);
  const showCustomerFormDialog = ref(false);
  const showEndCustomerDetailsDialog = ref(false);
  const showEndCustomerFormDialog = ref(false);
  const showDesignerFormDialog = ref(false);
  const showCoordinatorFormDialog = ref(false);
  const showCoordinatorProjectFormDialog = ref(false);
  const showGasDistributionFormDialog = ref(false);
  const showDefaultSettingsDialog = ref(false);
  const currentSettingsSection = ref<'customer' | 'endCustomer' | 'finance' | 'team'>('customer');
  const selectedCustomerForDetails = ref<Customer | null>(null);
  const isNewEndCustomer = ref(false);

  // Validation errors
  const errors = ref<Record<string, string>>({});

  // Search functions
  const searchCustomers = (event: any) => {
    const query = event.query;
    if (!query.trim()) {
      customerSuggestions.value = customersStore.getAllCustomers({ status: true });
    } else {
      customerSuggestions.value = customersStore.searchCustomers(query).filter(c => c.status);
    }
  };

  const searchEndCustomers = (event: any) => {
    const query = event.query;
    if (!query.trim()) {
      endCustomerSuggestions.value = customersStore.getAllCustomers({ status: true });
    } else {
      endCustomerSuggestions.value = customersStore.searchCustomers(query).filter(c => c.status);
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

  // Customer display name
  const getCustomerDisplayName = (customer: Customer | undefined): string => {
    if (!customer) return '';
    if (customer.customerType === 'person') {
      return `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
    }
    return customer.companyName || '';
  };

  // Deep clone and convert date strings to Date objects
  const deepCloneWithDateConversion = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (obj instanceof Date) return new Date(obj);
    if (typeof obj === 'string' && obj.match(/^\d{4}-\d{2}-\d{2}/)) {
      return new Date(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(item => deepCloneWithDateConversion(item));
    }
    if (typeof obj === 'object') {
      const cloned: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = deepCloneWithDateConversion(obj[key]);
        }
      }
      return cloned;
    }
    return obj;
  };

  // Match objects from props with objects from lists (for AutoComplete and Select)
  const matchObjectFromList = <T extends { id: number }>(obj: T | undefined, list: T[]): T | undefined => {
    if (!obj) return undefined;
    return list.find(item => item.id === obj.id) || obj;
  };

  // Initialize form data from gasConnection prop
  const initializeFormData = () => {
    if (!props.gasConnection) return;

    // Deep clone with date conversion
    const cloned = deepCloneWithDateConversion(props.gasConnection);

    // Match objects with lists from stores
    cloned.customer = matchObjectFromList(cloned.customer, customersStore.getAllCustomers({ status: true }));
    cloned.endCustomer = matchObjectFromList(cloned.endCustomer, customersStore.getAllCustomers({ status: true }));
    cloned.designer = matchObjectFromList(cloned.designer, designersStore.getAllDesigners({ status: true }));
    cloned.coordinator = matchObjectFromList(
      cloned.coordinator,
      coordinatorsStore.getAllCoordinators({ status: true })
    );
    cloned.gasDistribution = matchObjectFromList(cloned.gasDistribution, gasDistributionsStore.activeGasDistributions);

    // Update formData
    formData.value = { ...formData.value, ...cloned };

    // Update address fields
    if (formData.value.address) {
      addressCommune.value = formData.value.address.commune || '';
      addressCity.value = formData.value.address.city || '';
      addressStreet.value = formData.value.address.street || '';
    }

    // Update search queries
    if (formData.value.customer) {
      customerSearchQuery.value = getCustomerDisplayName(formData.value.customer);
    }
    if (formData.value.endCustomer) {
      endCustomerSearchQuery.value = getCustomerDisplayName(formData.value.endCustomer);
    }
    if (formData.value.designer) {
      designerSearchQuery.value = `${formData.value.designer.name} ${formData.value.designer.lastName}`;
    }
    if (formData.value.coordinator) {
      coordinatorSearchQuery.value = `${formData.value.coordinator.name} ${formData.value.coordinator.lastName}`;
    }
  };

  // Load draft from localStorage
  const loadDraft = () => {
    const draftKey = 'gasConnectionDraft';
    const draft = localStorage.getItem(draftKey);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        // Convert date strings back to Date objects
        Object.keys(parsed).forEach(key => {
          if (parsed[key] && typeof parsed[key] === 'object' && !Array.isArray(parsed[key])) {
            Object.keys(parsed[key]).forEach(subKey => {
              if (
                parsed[key][subKey] &&
                typeof parsed[key][subKey] === 'string' &&
                parsed[key][subKey].match(/^\d{4}-\d{2}-\d{2}/)
              ) {
                parsed[key][subKey] = new Date(parsed[key][subKey]);
              }
            });
          }
          if (parsed[key] && typeof parsed[key] === 'string' && parsed[key].match(/^\d{4}-\d{2}-\d{2}/)) {
            parsed[key] = new Date(parsed[key]);
          }
        });
        formData.value = { ...formData.value, ...parsed };
      } catch (e) {
        console.error('Błąd podczas wczytywania szkicu:', e);
      }
    }
    // Always check if draft exists to update button state
    checkDraftExists();
  };

  // Save draft to localStorage
  const saveDraft = () => {
    const draftKey = 'gasConnectionDraft';
    try {
      localStorage.setItem(draftKey, JSON.stringify(formData.value));
    } catch (e) {
      console.error('Błąd podczas zapisywania szkicu:', e);
    }
  };

  // Clear draft from localStorage
  const clearDraft = () => {
    const draftKey = 'gasConnectionDraft';
    localStorage.removeItem(draftKey);
  };

  // Check if draft exists
  const hasDraft = ref(false);
  const checkDraftExists = () => {
    const draftKey = 'gasConnectionDraft';
    hasDraft.value = !!localStorage.getItem(draftKey);
  };

  // Delete draft handler
  const handleDeleteDraft = () => {
    clearDraft();
    checkDraftExists();
    toast.add({
      severity: 'success',
      summary: 'Szkic usunięty',
      detail: 'Zapisany szkic został usunięty.',
      life: 3000,
    });
  };

  // Load default values from settings
  const loadDefaultValues = () => {
    const defaults = settingsStore.getGasConnectionDefaults();

    if (defaults.customer) {
      formData.value.customer = defaults.customer;
      customerSearchQuery.value = getCustomerDisplayName(defaults.customer);
    }
    if (defaults.endCustomer) {
      formData.value.endCustomer = defaults.endCustomer;
      endCustomerSearchQuery.value = getCustomerDisplayName(defaults.endCustomer);
    }
    if (defaults.designer) {
      formData.value.designer = defaults.designer;
      designerSearchQuery.value = `${defaults.designer.name} ${defaults.designer.lastName}`;
    }
    if (defaults.coordinator) {
      formData.value.coordinator = defaults.coordinator;
      coordinatorSearchQuery.value = `${defaults.coordinator.name} ${defaults.coordinator.lastName}`;
    }
    if (defaults.coordinatorProject) {
      coordinatorProjectSearchQuery.value = `${defaults.coordinatorProject.name} ${defaults.coordinatorProject.lastName}`;
    }
    if (defaults.gasDistribution) {
      // Używamy obiektu z activeGasDistributions, aby PrimeVue Select mógł go poprawnie zidentyfikować
      const gasDistributionFromList = gasDistributionsStore.activeGasDistributions.find(
        gd => gd.id === defaults.gasDistribution.id
      );
      if (gasDistributionFromList) {
        formData.value.gasDistribution = gasDistributionFromList;
      }
    }
    if (defaults.isPGN !== undefined) {
      formData.value.isPGN = defaults.isPGN;
    }
  };

  // Settings dialog handlers
  const handleOpenSettings = (section: 'customer' | 'endCustomer' | 'finance' | 'team') => {
    currentSettingsSection.value = section;
    showDefaultSettingsDialog.value = true;
  };

  const handleSettingsSaved = () => {
    // Optionally reload defaults if needed
  };

  // Initialize form
  onMounted(() => {
    // Initialize suggestions
    customerSuggestions.value = customersStore.getAllCustomers({ status: true });
    endCustomerSuggestions.value = customersStore.getAllCustomers({ status: true });
    designerSuggestions.value = designersStore.getAllDesigners({ status: true });
    coordinatorSuggestions.value = coordinatorsStore.getAllCoordinators({ status: true });
    coordinatorProjectSuggestions.value = coordinatorsStore.getAllCoordinators({ status: true });

    // Load gas distributions
    gasDistributionsStore.getAllGasDistributions({ isActive: true });

    if (props.gasConnection) {
      initializeFormData();
    } else {
      loadDraft();
      if (formData.value.address) {
        addressCommune.value = formData.value.address.commune || '';
        addressCity.value = formData.value.address.city || '';
        addressStreet.value = formData.value.address.street || '';
      }
      if (formData.value.customer) {
        customerSearchQuery.value = getCustomerDisplayName(formData.value.customer);
      }
      if (formData.value.endCustomer) {
        endCustomerSearchQuery.value = getCustomerDisplayName(formData.value.endCustomer);
      }
      if (formData.value.designer) {
        designerSearchQuery.value = `${formData.value.designer.name} ${formData.value.designer.lastName}`;
      }
      if (formData.value.coordinator) {
        coordinatorSearchQuery.value = `${formData.value.coordinator.name} ${formData.value.coordinator.lastName}`;
      }
      // Load default values from settings (only for new tasks, not when editing)
      loadDefaultValues();
    }

    // Check if draft exists on mount
    checkDraftExists();
  });

  // Watch for changes in props.gasConnection
  watch(
    () => props.gasConnection,
    newValue => {
      if (newValue) {
        // Ensure stores are loaded
        customerSuggestions.value = customersStore.getAllCustomers({ status: true });
        endCustomerSuggestions.value = customersStore.getAllCustomers({ status: true });
        designerSuggestions.value = designersStore.getAllDesigners({ status: true });
        coordinatorSuggestions.value = coordinatorsStore.getAllCoordinators({ status: true });
        gasDistributionsStore.getAllGasDistributions({ isActive: true });

        initializeFormData();
      }
    },
    { deep: true, immediate: false }
  );

  // Watch address fields and update formData
  watch([addressCommune, addressCity, addressStreet], () => {
    if (!formData.value.address) {
      formData.value.address = {
        id: 0,
        commune: addressCommune.value,
        city: addressCity.value,
        street: addressStreet.value,
        zip: '',
        coordinates: {
          id: 0,
          latitude: '',
          longitude: '',
        },
      };
    } else {
      formData.value.address.commune = addressCommune.value;
      formData.value.address.city = addressCity.value;
      formData.value.address.street = addressStreet.value;
    }
  });

  // Customer handlers
  const handleCustomerSelect = (customer: Customer | null) => {
    formData.value.customer = customer || undefined;
    if (customer) {
      customerSearchQuery.value = getCustomerDisplayName(customer);
    }
  };

  const handleCustomerDetails = () => {
    if (formData.value.customer) {
      selectedCustomerForDetails.value = formData.value.customer;
      showCustomerDetailsDialog.value = true;
    }
  };

  const handleNewCustomer = () => {
    showCustomerFormDialog.value = true;
    isNewEndCustomer.value = false;
  };

  const handleCustomerAdded = (customer: Customer) => {
    formData.value.customer = customer;
    customerSearchQuery.value = getCustomerDisplayName(customer);
    showCustomerFormDialog.value = false;
  };

  // End Customer handlers
  const handleEndCustomerSelect = (customer: Customer | null) => {
    formData.value.endCustomer = customer || undefined;
    if (customer) {
      endCustomerSearchQuery.value = getCustomerDisplayName(customer);
    }
  };

  const handleEndCustomerDetails = () => {
    if (formData.value.endCustomer) {
      selectedCustomerForDetails.value = formData.value.endCustomer;
      showEndCustomerDetailsDialog.value = true;
    }
  };

  const handleNewEndCustomer = () => {
    showEndCustomerFormDialog.value = true;
    isNewEndCustomer.value = true;
  };

  const handleEndCustomerAdded = (customer: Customer) => {
    formData.value.endCustomer = customer;
    endCustomerSearchQuery.value = getCustomerDisplayName(customer);
    showEndCustomerFormDialog.value = false;
  };

  // Designer handlers
  const handleDesignerSelect = (designer: Designer | null) => {
    formData.value.designer = designer || undefined;
    if (designer) {
      designerSearchQuery.value = `${designer.name} ${designer.lastName}`;
    }
  };

  const handleNewDesigner = () => {
    showDesignerFormDialog.value = true;
  };

  const handleDesignerAdded = (designer: Designer) => {
    formData.value.designer = designer;
    designerSearchQuery.value = `${designer.name} ${designer.lastName}`;
    showDesignerFormDialog.value = false;
  };

  // Coordinator handlers
  const handleCoordinatorSelect = (coordinator: Coordinator | null) => {
    formData.value.coordinator = coordinator || undefined;
    if (coordinator) {
      coordinatorSearchQuery.value = `${coordinator.name} ${coordinator.lastName}`;
    }
  };

  const handleNewCoordinator = () => {
    showCoordinatorFormDialog.value = true;
  };

  const handleCoordinatorAdded = (coordinator: Coordinator) => {
    formData.value.coordinator = coordinator;
    coordinatorSearchQuery.value = `${coordinator.name} ${coordinator.lastName}`;
    showCoordinatorFormDialog.value = false;
  };

  // Coordinator Project handlers
  const handleCoordinatorProjectSelect = (coordinator: Coordinator | null) => {
    // Note: There's no coordinatorProject field in GasConnection, might need to add it
    if (coordinator) {
      coordinatorProjectSearchQuery.value = `${coordinator.name} ${coordinator.lastName}`;
    }
  };

  const handleNewCoordinatorProject = () => {
    showCoordinatorProjectFormDialog.value = true;
  };

  const handleCoordinatorProjectAdded = (coordinator: Coordinator) => {
    // Note: There's no coordinatorProject field in GasConnection, might need to add it
    coordinatorProjectSearchQuery.value = `${coordinator.name} ${coordinator.lastName}`;
    showCoordinatorProjectFormDialog.value = false;
  };

  // GasDistribution handlers
  const handleNewGasDistribution = () => {
    showGasDistributionFormDialog.value = true;
  };

  const handleGasDistributionAdded = (gasDistribution: GasDistribution) => {
    formData.value.gasDistribution = gasDistribution;
    showGasDistributionFormDialog.value = false;
  };

  // Validation
  const validate = (): boolean => {
    errors.value = {};

    if (!formData.value.customer) {
      errors.value.customer = 'Zleceniodawca jest wymagany';
    }

    if (!formData.value.endCustomer) {
      errors.value.endCustomer = 'Klient jest wymagany';
    }

    if (!addressCommune.value.trim()) {
      errors.value.addressCommune = 'Gmina jest wymagana';
    }

    if (!addressCity.value.trim()) {
      errors.value.addressCity = 'Miasto jest wymagane';
    }

    if (!addressStreet.value.trim()) {
      errors.value.addressStreet = 'Ulica jest wymagana';
    }

    if (!formData.value.taskNo?.trim()) {
      errors.value.taskNo = 'Nr zlecenia jest wymagany';
    }

    if (!formData.value.contractDate) {
      errors.value.contractDate = 'Data umowy jest wymagana';
    }

    if (!formData.value.finishDeadline) {
      errors.value.finishDeadline = 'Termin odb. tech. jest wymagany';
    }

    if (!formData.value.contractNo?.trim()) {
      errors.value.contractNo = 'Nr umowy jest wymagany';
    }

    if (!formData.value.conditionDate) {
      errors.value.conditionDate = 'Data warunków jest wymagana';
    }

    if (!formData.value.wsgFinalPickupDate) {
      errors.value.wsgFinalPickupDate = 'Termin odb. końcowego jest wymagany';
    }

    if (!formData.value.projectDeadline) {
      errors.value.projectDeadline = 'Termin projektu jest wymagany';
    }

    if (!formData.value.taskValue || formData.value.taskValue <= 0) {
      errors.value.taskValue = 'Wartość zadania jest wymagana';
    }

    if (!formData.value.projectValue || formData.value.projectValue <= 0) {
      errors.value.projectValue = 'Wartość projektu jest wymagana';
    }

    if (!formData.value.constructionValue || formData.value.constructionValue <= 0) {
      errors.value.constructionValue = 'Wartość wykonawstwa jest wymagana';
    }

    if (!formData.value.gasDistribution) {
      errors.value.gasDistribution = 'Jednostka zlecająca jest wymagana';
    }

    return Object.keys(errors.value).length === 0;
  };

  // Form submission
  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    // Update address
    if (formData.value.address) {
      formData.value.address.commune = addressCommune.value;
      formData.value.address.city = addressCity.value;
      formData.value.address.street = addressStreet.value;
    }

    clearDraft();
    emit('submit', formData.value as GasConnection);
  };

  const handleCancel = () => {
    emit('cancel');
  };

  const handleSaveDraft = () => {
    // Update address before saving
    if (formData.value.address) {
      formData.value.address.commune = addressCommune.value;
      formData.value.address.city = addressCity.value;
      formData.value.address.street = addressStreet.value;
    }
    saveDraft();
    checkDraftExists();
    toast.add({
      severity: 'success',
      summary: 'Szkic zapisany',
      detail: 'Zmiany zostały zapisane i będą dostępne podczas ponownego otwarcia formularza.',
      life: 3000,
    });
  };
</script>

<template>
  <div class="min-h-screen bg-surface-0 dark:bg-surface-950 text-gray-900 dark:text-white p-6">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-surface-300">Wprowadzanie Danych</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">Zarządzanie instalacjami gazowymi • Nowe zlecenie</p>
        </div>
        <div class="flex items-center gap-2">
          <SecondaryButton
            type="button"
            @click="handleSaveDraft"
            text="Zapisz szkic"
            icon="pi pi-download"
            iconPos="left"
            iconSize="sm"
            title="Zapisz szkic formularza"
          />
          <Button
            type="button"
            icon="pi pi-trash"
            severity="danger"
            :disabled="!hasDraft"
            variant="outlined"
            @click="handleDeleteDraft"
            title="Usuń zapisany szkic"
          />
        </div>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Zleceniodawca -->
        <div class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-surface-700 dark:text-surface-300 flex items-center gap-2">
              <UserIcon class="w-5 h-5 text-primary-400" />
              Zleceniodawca
            </h2>
            <SecondaryButton
              type="button"
              @click="handleOpenSettings('customer')"
              icon="pi pi-cog"
              title="Ustawienia domyślne"
            />
          </div>
          <div class="grid grid-cols-1 gap-4">
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-0 mb-2">
                Zleceniodawca<span class="text-primary-400">*</span>
              </label>
              <div class="flex gap-2">
                <AutoComplete
                  v-model="formData.customer"
                  :suggestions="customerSuggestions"
                  @complete="searchCustomers"
                  :placeholder="'Wybierz zleceniodawcę...'"
                  class="flex-1"
                  :class="{ 'border-red-500': errors.customer }"
                  @item-select="e => handleCustomerSelect(e.value)"
                  dropdown
                  forceSelection
                  :optionLabel="(customer: Customer) => getCustomerDisplayName(customer)"
                >
                  <template #option="{ option }">
                    <div>{{ getCustomerDisplayName(option) }}</div>
                  </template>
                </AutoComplete>
                <SecondaryButton
                  type="button"
                  @click="handleCustomerDetails"
                  :disabled="!formData.customer"
                  icon="pi pi-info-circle"
                  title="Pokaż szczegóły zleceniodawcy"
                />
                <PrimaryButton type="button" @click="handleNewCustomer" title="Dodaj nowego zleceniodawcę">
                  <i class="pi pi-plus"></i>
                </PrimaryButton>
              </div>
              <p v-if="errors.customer" class="text-red-500 text-sm mt-1">{{ errors.customer }}</p>
            </div>
          </div>
        </div>

        <!-- Klient i Lokalizacja -->
        <div class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <MapPinIcon class="w-5 h-5 text-primary-400" />
              Klient i Lokalizacja
            </h2>
            <SecondaryButton
              type="button"
              @click="handleOpenSettings('endCustomer')"
              icon="pi pi-cog"
              title="Ustawienia domyślne"
            />
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Klient<span class="text-primary-400">*</span>
              </label>
              <div class="flex gap-2">
                <AutoComplete
                  v-model="formData.endCustomer"
                  :suggestions="endCustomerSuggestions"
                  @complete="searchEndCustomers"
                  :placeholder="'Wybierz klienta...'"
                  class="flex-1"
                  :class="{ 'border-red-500': errors.endCustomer }"
                  @item-select="e => handleEndCustomerSelect(e.value)"
                  dropdown
                  forceSelection
                  :optionLabel="(customer: Customer) => getCustomerDisplayName(customer)"
                >
                  <template #option="{ option }">
                    <div>{{ getCustomerDisplayName(option) }}</div>
                  </template>
                </AutoComplete>
                <SecondaryButton
                  type="button"
                  @click="handleEndCustomerDetails"
                  :disabled="!formData.endCustomer"
                  icon="pi pi-info-circle"
                  title="Pokaż szczegóły klienta"
                />
                <PrimaryButton type="button" @click="handleNewEndCustomer" title="Dodaj nowego klienta">
                  <i class="pi pi-plus"></i>
                </PrimaryButton>
              </div>
              <p v-if="errors.endCustomer" class="text-red-500 text-sm mt-1">{{ errors.endCustomer }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gmina (budowa)<span class="text-primary-400">*</span>
              </label>
              <InputText
                v-model="addressCommune"
                :class="{ 'border-red-500': errors.addressCommune }"
                class="w-full bg-white dark:bg-gray-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-white"
              />
              <p v-if="errors.addressCommune" class="text-red-500 text-sm mt-1">{{ errors.addressCommune }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Miasto (budowa)<span class="text-primary-400">*</span>
              </label>
              <InputText
                v-model="addressCity"
                :class="{ 'border-red-500': errors.addressCity }"
                class="w-full bg-white dark:bg-gray-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-white"
              />
              <p v-if="errors.addressCity" class="text-red-500 text-sm mt-1">{{ errors.addressCity }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ulica, działka (bud)<span class="text-primary-400">*</span>
              </label>
              <InputText
                v-model="addressStreet"
                :class="{ 'border-red-500': errors.addressStreet }"
                class="w-full bg-white dark:bg-gray-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-white"
              />
              <p v-if="errors.addressStreet" class="text-red-500 text-sm mt-1">{{ errors.addressStreet }}</p>
            </div>
          </div>
        </div>

        <!-- Szczegóły Umowy i Terminy -->
        <div class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <DocumentTextIcon class="w-5 h-5 text-primary-400" />
            Szczegóły Umowy i Terminy
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nr zlecenia<span class="text-primary-400">*</span>
              </label>
              <InputText
                v-model="formData.taskNo"
                :class="{ 'border-red-500': errors.taskNo }"
                class="w-full bg-white dark:bg-gray-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-white"
              />
              <p v-if="errors.taskNo" class="text-red-500 text-sm mt-1">{{ errors.taskNo }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data umowy<span class="text-primary-400">*</span>
              </label>
              <DatePicker
                v-model="formData.contractDate"
                dateFormat="mm/dd/yy"
                :class="{ 'border-red-500': errors.contractDate }"
                class="w-full"
                showIcon
              />
              <p v-if="errors.contractDate" class="text-red-500 text-sm mt-1">{{ errors.contractDate }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Termin odb. tech.<span class="text-primary-400">*</span>
              </label>
              <DatePicker
                v-model="formData.finishDeadline"
                dateFormat="mm/dd/yy"
                :class="{ 'border-red-500': errors.finishDeadline }"
                class="w-full"
                showIcon
              />
              <p v-if="errors.finishDeadline" class="text-red-500 text-sm mt-1">{{ errors.finishDeadline }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nr umowy<span class="text-primary-400">*</span>
              </label>
              <InputText
                v-model="formData.contractNo"
                :class="{ 'border-red-500': errors.contractNo }"
                class="w-full bg-white dark:bg-gray-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-white"
              />
              <p v-if="errors.contractNo" class="text-red-500 text-sm mt-1">{{ errors.contractNo }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data warunków<span class="text-primary-400">*</span>
              </label>
              <DatePicker
                v-model="formData.conditionDate"
                dateFormat="mm/dd/yy"
                :class="{ 'border-red-500': errors.conditionDate }"
                class="w-full"
                showIcon
              />
              <p v-if="errors.conditionDate" class="text-red-500 text-sm mt-1">{{ errors.conditionDate }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Termin odb. końcowego<span class="text-primary-400">*</span>
              </label>
              <DatePicker
                v-model="formData.wsgFinalPickupDate"
                dateFormat="mm/dd/yy"
                :class="{ 'border-red-500': errors.wsgFinalPickupDate }"
                class="w-full"
                showIcon
              />
              <p v-if="errors.wsgFinalPickupDate" class="text-red-500 text-sm mt-1">{{ errors.wsgFinalPickupDate }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Nr warunków </label>
              <InputText
                v-model="formData.conditionNo"
                class="w-full bg-white dark:bg-gray-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Termin projektu<span class="text-primary-400">*</span>
              </label>
              <DatePicker
                v-model="formData.projectDeadline"
                dateFormat="mm/dd/yy"
                :class="{ 'border-red-500': errors.projectDeadline }"
                class="w-full"
                showIcon
              />
              <p v-if="errors.projectDeadline" class="text-red-500 text-sm mt-1">{{ errors.projectDeadline }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Umowa przył.</label>
              <InputText
                v-model="formData.connectionAgreementNumber"
                class="w-full bg-white dark:bg-gray-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SAP/UP</label>
              <InputText
                v-model="formData.sapUpNo"
                class="w-full bg-white dark:bg-gray-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data przyspieszenia</label>
              <DatePicker v-model="formData.accelerationDate" dateFormat="mm/dd/yy" class="w-full" showIcon />
            </div>
          </div>
        </div>

        <!-- Finanse i Zespół Projektowy -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Finanse -->
          <div
            class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6"
          >
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <CurrencyDollarIcon class="w-5 h-5 text-primary-400" />
                Finanse
              </h2>
              <SecondaryButton
                type="button"
                @click="handleOpenSettings('finance')"
                icon="pi pi-cog"
                title="Ustawienia domyślne"
              />
            </div>
            <div class="grid grid-cols-1 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Wartość zadania (netto)<span class="text-primary-400">*</span>
                </label>
                <div class="flex items-center gap-2">
                  <InputNumber
                    v-model="formData.taskValue"
                    mode="decimal"
                    :min="0"
                    :class="{ 'border-red-500': errors.taskValue }"
                    class="flex-1"
                  />
                  <span class="text-gray-600 dark:text-gray-400">PLN</span>
                </div>
                <p v-if="errors.taskValue" class="text-red-500 text-sm mt-1">{{ errors.taskValue }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Wartość projektu (netto)<span class="text-primary-400">*</span>
                </label>
                <div class="flex items-center gap-2">
                  <InputNumber
                    v-model="formData.projectValue"
                    mode="decimal"
                    :min="0"
                    :class="{ 'border-red-500': errors.projectValue }"
                    class="flex-1"
                  />
                  <span class="text-gray-600 dark:text-gray-400">PLN</span>
                </div>
                <p v-if="errors.projectValue" class="text-red-500 text-sm mt-1">{{ errors.projectValue }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Wartość wykonawstwa (netto)<span class="text-primary-400">*</span>
                </label>
                <div class="flex items-center gap-2">
                  <InputNumber
                    v-model="formData.constructionValue"
                    mode="decimal"
                    :min="0"
                    :class="{ 'border-red-500': errors.constructionValue }"
                    class="flex-1"
                  />
                  <span class="text-gray-600 dark:text-gray-400">PLN</span>
                </div>
                <p v-if="errors.constructionValue" class="text-red-500 text-sm mt-1">{{ errors.constructionValue }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Jedn. zlecająca<span class="text-primary-400">*</span>
                </label>
                <div class="flex gap-2">
                  <Select
                    v-model="formData.gasDistribution"
                    :options="gasDistributionsStore.activeGasDistributions"
                    placeholder="Wybierz jednostkę..."
                    class="flex-1"
                    optionLabel="name"
                    :filter="true"
                    filterPlaceholder="Szukaj jednostki..."
                    :showClear="true"
                    :class="{ 'border-red-500': errors.gasDistribution }"
                  />
                  <PrimaryButton type="button" @click="handleNewGasDistribution" title="Dodaj nową jednostkę zlecającą">
                    <i class="pi pi-plus"></i>
                  </PrimaryButton>
                </div>
                <p v-if="errors.gasDistribution" class="text-red-500 text-sm mt-1">{{ errors.gasDistribution }}</p>
              </div>
            </div>
          </div>

          <!-- Zespół Projektowy -->
          <div
            class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6"
          >
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <UserGroupIcon class="w-5 h-5 text-primary-400" />
                Zespół Projektowy
              </h2>
              <SecondaryButton
                type="button"
                @click="handleOpenSettings('team')"
                icon="pi pi-cog"
                title="Ustawienia domyślne"
              />
            </div>
            <div class="grid grid-cols-1 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Projektant</label>
                <div class="flex gap-2">
                  <AutoComplete
                    v-model="formData.designer"
                    :suggestions="designerSuggestions"
                    @complete="searchDesigners"
                    :placeholder="'Wybierz projektanta...'"
                    class="flex-1"
                    @item-select="e => handleDesignerSelect(e.value)"
                    dropdown
                    forceSelection
                    :optionLabel="(designer: Designer) => `${designer.name} ${designer.lastName}`"
                  >
                    <template #option="{ option }">
                      <div>{{ option.name }} {{ option.lastName }}</div>
                    </template>
                  </AutoComplete>
                  <PrimaryButton type="button" @click="handleNewDesigner" title="Dodaj nowego projektanta">
                    <i class="pi pi-plus"></i>
                  </PrimaryButton>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Koordynator</label>
                <div class="flex gap-2">
                  <AutoComplete
                    v-model="formData.coordinator"
                    :suggestions="coordinatorSuggestions"
                    @complete="searchCoordinators"
                    :placeholder="'Wybierz koordynatora...'"
                    class="flex-1"
                    @item-select="e => handleCoordinatorSelect(e.value)"
                    dropdown
                    forceSelection
                    :optionLabel="(coordinator: Coordinator) => `${coordinator.name} ${coordinator.lastName}`"
                  >
                    <template #option="{ option }">
                      <div>{{ option.name }} {{ option.lastName }}</div>
                    </template>
                  </AutoComplete>
                  <PrimaryButton type="button" @click="handleNewCoordinator" title="Dodaj nowego koordynatora">
                    <i class="pi pi-plus"></i>
                  </PrimaryButton>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >Koordynator projekt</label
                >
                <div class="flex gap-2">
                  <AutoComplete
                    v-model="coordinatorProjectSearchQuery"
                    :suggestions="coordinatorProjectSuggestions"
                    @complete="searchCoordinatorProjects"
                    :placeholder="'Wybierz koordynatora projektu...'"
                    class="flex-1"
                    @item-select="e => handleCoordinatorProjectSelect(e.value)"
                    dropdown
                    forceSelection
                    :optionLabel="(coordinator: Coordinator) => `${coordinator.name} ${coordinator.lastName}`"
                  >
                    <template #option="{ option }">
                      <div>{{ option.name }} {{ option.lastName }}</div>
                    </template>
                  </AutoComplete>
                  <PrimaryButton
                    type="button"
                    @click="handleNewCoordinatorProject"
                    title="Dodaj nowego koordynatora projektu"
                  >
                    <i class="pi pi-plus"></i>
                  </PrimaryButton>
                </div>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <Checkbox v-model="formData.isPGN" :binary="true" inputId="pgn" />
                  <label for="pgn" class="text-gray-700 dark:text-gray-300">Prace gazoniebezpieczne (PGN)</label>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Zaznacz jeśli zlecenie wymaga prac gazoniebezpiecznych.
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Uwagi</label>
                <Textarea
                  v-model="formData.info"
                  rows="4"
                  class="w-full bg-white dark:bg-gray-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="pt-6 border-t border-surface-200 dark:border-surface-700">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">* - pola, które muszą być wypełnione</p>
          <div class="flex items-center justify-end gap-4">
            <SecondaryButton
              type="button"
              @click="handleCancel"
              text="Anuluj"
              size="lg"
              title="Anuluj wprowadzanie danych"
            />
            <PrimaryButton type="submit" size="lg" text="Zatwierdź" title="Zatwierdź i zapisz formularz" />
          </div>
        </div>
      </form>
    </div>

    <!-- Dialogs -->
    <CustomerDetailsDialog
      v-if="showCustomerDetailsDialog"
      :customer="selectedCustomerForDetails!"
      @close="showCustomerDetailsDialog = false"
    />
    <CustomerFormDialog
      v-if="showCustomerFormDialog"
      @close="showCustomerFormDialog = false"
      @customer-added="handleCustomerAdded"
    />
    <CustomerDetailsDialog
      v-if="showEndCustomerDetailsDialog"
      :customer="selectedCustomerForDetails!"
      @close="showEndCustomerDetailsDialog = false"
    />
    <CustomerFormDialog
      v-if="showEndCustomerFormDialog"
      @close="showEndCustomerFormDialog = false"
      @customer-added="handleEndCustomerAdded"
    />
    <DesignerFormDialog v-model:visible="showDesignerFormDialog" @designerAdded="handleDesignerAdded" />
    <CoordinatorFormDialog v-model:visible="showCoordinatorFormDialog" @coordinator-added="handleCoordinatorAdded" />
    <CoordinatorFormDialog
      v-model:visible="showCoordinatorProjectFormDialog"
      @coordinator-added="handleCoordinatorProjectAdded"
    />
    <GasDistributionFormDialog
      v-if="showGasDistributionFormDialog"
      @close="showGasDistributionFormDialog = false"
      @gas-distribution-added="handleGasDistributionAdded"
    />
    <DefaultSettingsDialog
      v-if="showDefaultSettingsDialog"
      :section-name="currentSettingsSection"
      :title="
        currentSettingsSection === 'customer'
          ? 'Ustawienia domyślne - Zleceniodawca'
          : currentSettingsSection === 'endCustomer'
            ? 'Ustawienia domyślne - Klient'
            : currentSettingsSection === 'finance'
              ? 'Ustawienia domyślne - Finanse'
              : 'Ustawienia domyślne - Zespół Projektowy'
      "
      @close="showDefaultSettingsDialog = false"
      @saved="handleSettingsSaved"
    />
  </div>
</template>
