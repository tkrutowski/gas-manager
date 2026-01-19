<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import SidebarMenu from '@/components/tasks/SidebarMenu.vue';
import ProjectTab from '@/components/tasks/ProjectTab.vue';
import ProjectCdTab from '@/components/tasks/ProjectCdTab.vue';
import ConstructionTab from '@/components/tasks/ConstructionTab.vue';
import FinanceTab from '@/components/tasks/FinanceTab.vue';
import WorkRangeTab from '@/components/tasks/WorkRangeTab.vue';
import FilesTab from '@/components/tasks/FilesTab.vue';
import { useGasConnectionsStore } from '@/stores/gasConnections';
import type { GasConnection } from '@/types/GasConnection';
import { getPersonDisplayName, formatDate, formatMoney } from '@/utils/tableFormatters';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import Divider from 'primevue/divider';

const router = useRouter();
const route = useRoute();
const gasConnectionsStore = useGasConnectionsStore();

const gasConnection = ref<GasConnection | undefined>(undefined);
const isReadonly = computed(() => route.query.readonly === 'true');
const activeTab = ref<string>('projekt');

onMounted(() => {
    const id = route.query.id;
    if (id) {
        const connectionId = typeof id === 'string' ? parseInt(id, 10) : Number(id);
        if (!isNaN(connectionId)) {
            const connection = gasConnectionsStore.getGasConnection(connectionId);
            if (connection) {
                gasConnection.value = connection;
            }
        }
    }
});

// Nazwisko klienta
const customerName = computed(() => {
    if (!gasConnection.value?.customer) return '-';
    const customer = gasConnection.value.customer;
    if (customer.customerType === 'person') {
        return `${customer.lastName || ''} ${customer.firstName || ''}`.trim() || '-';
    }
    return customer.companyName || '-';
});

// Gmina / Miasto
const location = computed(() => {
    if (!gasConnection.value?.address) return '-';
    const addr = gasConnection.value.address;
    const parts = [];
    if (addr.commune) parts.push(addr.commune);
    if (addr.city) parts.push(addr.city);
    return parts.join(' / ') || '-';
});

// Ulica, działka
const streetAndPlot = computed(() => {
    const parts = [];
    if (gasConnection.value?.address?.street) {
        parts.push(gasConnection.value.address.street);
    }
    if (gasConnection.value?.plots && gasConnection.value.plots.length > 0) {
        const plotNumbers = gasConnection.value.plots.map(p => `dz. ${p.plotNumber}`).join(', ');
        if (plotNumbers) parts.push(plotNumbers);
    }
    return parts.join(', ') || '-';
});
</script>

<template>
    <div class="flex h-screen bg-surface-0 dark:bg-surface-950 overflow-hidden">
        <!-- Sidebar Menu -->
        <SidebarMenu />

        <!-- Main Content -->
        <div class="flex-1 overflow-y-auto p-6">
            <div class="max-w-full mx-auto">
                <div class="mb-6">
                    <div class="flex items-center gap-2 mb-2">
                        <button @click="router.push('/tasks/gas-connections')"
                            class="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 transition-colors cursor-pointer">
                            ← powrót do listy zadań
                        </button>
                    </div>
                    <h1 class="text-3xl font-bold text-surface-700 dark:text-surface-300 mb-2">
                        Szczegóły Przyłącza Gazu
                        <span v-if="isReadonly" class="text-lg font-normal text-surface-600 dark:text-surface-400">
                            (Tylko do odczytu)
                        </span>
                    </h1>
                    <p class="text-sm text-surface-600 dark:text-surface-400">
                        Zarządzanie instalacjami gazowymi • Szczegóły zlecenia
                    </p>
                </div>

                <!-- Kontener z "Dane Zadania" i zakładkami obok siebie -->
                <div v-if="gasConnection" class="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-6 mb-6">
                    <!-- Karta Dane Zadania -->
                    <div
                        class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
                        <h2 class="text-xl font-bold text-surface-700 dark:text-surface-300 mb-6">Dane
                            Zadania</h2>
                        <Divider />
                        <div class="space-y-4">
                            <!-- Pierwszy rząd: NAZWISKO, GMINA / MIASTO, ULICA, DZIAŁKA -->
                            <div class="grid grid-cols-1 gap-2">
                                <div>
                                    <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1 ">
                                        Nazwisko
                                    </label>
                                    <p class="text-sm font-semibold text-surface-700 dark:text-surface-300">
                                        {{ customerName }}
                                    </p>
                                </div>
                                <div>
                                    <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1 ">
                                        Gmina / Miasto
                                    </label>
                                    <p class="text-sm font-semibold text-surface-700 dark:text-surface-300">
                                        {{ location }}
                                    </p>
                                </div>
                                <div>
                                    <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1 ">
                                        Ulica, Działka
                                    </label>
                                    <p class="text-sm font-semibold text-surface-700 dark:text-surface-300">
                                        {{ streetAndPlot }}
                                    </p>
                                </div>
                            </div>
                            <Divider />

                            <!-- Drugi rząd: NR ZLECENIA, NR UMOWY, DATA UMOWY -->
                            <div class="grid grid-cols-2 gap-2">
                                <div>
                                    <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1 ">
                                        Nr Zlecenia
                                    </label>
                                    <p class="text-sm font-semibold text-orange-600 dark:text-orange-400">
                                        {{ gasConnection.taskNo || '-' }}
                                    </p>
                                </div>
                                <div>
                                    <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1 ">
                                        Nr SAP/UP
                                    </label>
                                    <p class="text-sm font-semibold text-orange-600 dark:text-orange-400">
                                        {{ gasConnection.sapUpNo || '-' }}
                                    </p>
                                </div>
                                <div>
                                    <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1 ">
                                        Nr Umowy
                                    </label>
                                    <p class="text-sm font-semibold text-surface-700 dark:text-surface-300">
                                        {{ gasConnection.contractNo || '-' }}
                                    </p>
                                </div>
                                <div>
                                    <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1 ">
                                        Data Umowy
                                    </label>
                                    <p class="text-sm font-semibold text-surface-700 dark:text-surface-300">
                                        {{ formatDate(gasConnection.contractDate) || '-' }}
                                    </p>
                                </div>
                            </div>

                            <Divider />

                            <!-- Trzeci rząd: PROJEKTANT, KOORDYNATOR -->
                            <div class="grid grid-cols-1 gap-2">
                                <div>
                                    <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1 ">
                                        Projektant
                                    </label>
                                    <p class="text-sm font-semibold text-surface-700 dark:text-surface-300">
                                        {{ getPersonDisplayName(gasConnection.designer) || '-' }}
                                    </p>
                                </div>
                                <div>
                                    <label class="block text-xs text-surface-600 dark:text-surface-400 mb-1 ">
                                        Koordynator
                                    </label>
                                    <p class="text-sm font-semibold text-surface-700 dark:text-surface-300">
                                        {{ getPersonDisplayName(gasConnection.coordinator) || '-' }}
                                    </p>
                                </div>
                            </div>

                            <Divider />


                            <!-- Piąty rząd: Wartość proj., Wartość wyk., Wartość zad. -->
                            <div class="space-y-0">
                                <div class="flex items-center justify-between ">
                                    <label class="text-xs text-surface-600 dark:text-surface-400">
                                        Wartość proj.
                                    </label>
                                    <p class="text-sm font-semibold text-surface-700 dark:text-surface-300">
                                        {{ formatMoney(gasConnection.projectValue) || '-' }}
                                    </p>
                                </div>
                                <div class="flex items-center justify-between ">
                                    <label class="text-xs text-surface-600 dark:text-surface-400">
                                        Wartość wyk.
                                    </label>
                                    <p class="text-sm font-semibold text-surface-700 dark:text-surface-300">
                                        {{ formatMoney(gasConnection.constructionValue) || '-' }}
                                    </p>
                                </div>
                                <Divider type="dashed" />
                                <div class="flex items-center justify-between">
                                    <label class="text-xs font-bold text-surface-700 dark:text-surface-300">
                                        Wartość zad.
                                    </label>
                                    <p class="text-base font-bold text-orange-600 dark:text-orange-400">
                                        {{ formatMoney(gasConnection.taskValue) || '-' }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Zakładki -->
                    <div
                        class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
                        <Tabs v-model:value="activeTab">
                            <TabList>
                                <Tab value="projekt">Projekt</Tab>
                                <Tab value="projekt-cd">Projekt cd.</Tab>
                                <Tab value="wykonawstwo">Wykonawstwo</Tab>
                                <Tab value="finanse">Finanse</Tab>
                                <Tab value="finanse-cd">Finanse cd.</Tab>
                                <Tab value="zakres">Zakres</Tab>
                                <Tab value="pliki">Pliki</Tab>
                            </TabList>

                            <TabPanels>
                                <!-- Zakładka Projekt -->
                                <TabPanel value="projekt">
                                    <ProjectTab :gasConnection="gasConnection" :isReadonly="isReadonly" />
                                </TabPanel>

                                <!-- Zakładka Projekt cd. -->
                                <TabPanel value="projekt-cd">
                                    <ProjectCdTab :gasConnection="gasConnection" :isReadonly="isReadonly" />
                                </TabPanel>

                                <!-- Zakładka Wykonawstwo -->
                                <TabPanel value="wykonawstwo">
                                    <ConstructionTab :gasConnection="gasConnection" :isReadonly="isReadonly" />
                                </TabPanel>

                                <!-- Zakładka Finanse -->
                                <TabPanel value="finanse">
                                    <FinanceTab :gasConnection="gasConnection" :isReadonly="isReadonly" />
                                </TabPanel>

                                <!-- Zakładka Finanse cd. -->
                                <TabPanel value="finanse-cd">
                                    <div class="p-6">
                                        <p class="text-surface-600 dark:text-surface-400">Zawartość zakładki Finanse cd.
                                            będzie uzupełniona w późniejszym terminie.</p>
                                    </div>
                                </TabPanel>

                                <!-- Zakładka Zakres -->
                                <TabPanel value="zakres">
                                    <WorkRangeTab :gasConnection="gasConnection" :isReadonly="isReadonly" />
                                </TabPanel>

                                <!-- Zakładka Pliki -->
                                <TabPanel value="pliki">
                                    <FilesTab :gasConnection="gasConnection" :isReadonly="isReadonly" />
                                </TabPanel>
                            </TabPanels>
                        </Tabs>
                    </div>
                </div>

                <!-- Placeholder gdy brak danych -->
                <div v-else
                    class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
                    <p class="text-surface-600 dark:text-surface-400">
                        Brak danych do wyświetlenia.
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>
