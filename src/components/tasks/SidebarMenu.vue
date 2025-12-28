<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import {
    Squares2X2Icon,
    WrenchScrewdriverIcon,
    FolderIcon,
    UserGroupIcon,
    MapPinIcon,
    ChevronRightIcon,
    ChevronLeftIcon,
    ArrowRightOnRectangleIcon,
    MoonIcon,
    SunIcon,
} from '@heroicons/vue/24/outline';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const isCollapsed = ref(false);

// Dark mode management
const getInitialTheme = (): boolean => {
    const saved = localStorage.getItem('theme');
    if (saved === null) {
        // Domyślnie tryb jasny
        return false;
    }
    return saved === 'dark';
};

const isDarkMode = ref<boolean>(getInitialTheme());

const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value;
    updateTheme();
};

const updateTheme = () => {
    if (isDarkMode.value) {
        document.documentElement.classList.add('p-dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.remove('p-dark');
        localStorage.setItem('theme', 'light');
    }
};

onMounted(() => {
    updateTheme();
});

const handleLogout = () => {
    authStore.logout();
    router.push('/login');
};

const userName = computed(() => authStore.user?.name || 'Użytkownik');
const userRole = computed(() => authStore.user?.role || 'Administrator');
const userEmail = computed(() => authStore.user?.email || '');

const menuItems = [
    {
        id: 'dashboard',
        label: 'Pulpit',
        icon: Squares2X2Icon,
        route: '/tasks',
        children: null,
    },
    {
        id: 'gas-connections',
        label: 'Przyłącza gazu',
        icon: WrenchScrewdriverIcon,
        route: null,
        children: [
            { id: 'gas-connections-new', label: 'Nowe', route: '/tasks/gas-connections/new' },
            { id: 'gas-connections-list', label: 'Lista', route: '/tasks/gas-connections' },
        ],
    },
    {
        id: 'designers',
        label: 'Projektanci',
        icon: FolderIcon,
        route: null,
        children: [
            { id: 'designers-new', label: 'Nowy', route: '/tasks/designers/new' },
            { id: 'designers-list', label: 'Lista', route: '/tasks/designers' },
        ],
    },
    {
        id: 'coordinators',
        label: 'Koordynatorzy',
        icon: UserGroupIcon,
        route: null,
        children: [
            { id: 'coordinators-new', label: 'Nowy', route: '/tasks/coordinators/new' },
            { id: 'coordinators-list', label: 'Lista', route: '/tasks/coordinators' },
        ],
    },
    {
        id: 'surveyors',
        label: 'Geodeci',
        icon: MapPinIcon,
        route: null,
        children: [
            { id: 'surveyors-new', label: 'Nowy', route: '/tasks/surveyors/new' },
            { id: 'surveyors-list', label: 'Lista', route: '/tasks/surveyors' },
        ],
    },
];

const expandedItems = ref<string[]>([]);

const toggleExpand = (itemId: string) => {
    const index = expandedItems.value.indexOf(itemId);
    if (index > -1) {
        expandedItems.value.splice(index, 1);
    } else {
        expandedItems.value.push(itemId);
    }
};

const isExpanded = (itemId: string) => {
    return expandedItems.value.includes(itemId);
};

const isActive = (itemRoute: string | null) => {
    if (!itemRoute) return false;
    return route.path === itemRoute;
};

const isChildActive = (children: Array<{ route: string }> | null) => {
    if (!children) return false;
    return children.some(child => route.path === child.route);
};

const handleItemClick = (item: any) => {
    if (item.children) {
        toggleExpand(item.id);
    } else if (item.route) {
        router.push(item.route);
    }
};

const handleChildClick = (childRoute: string) => {
    router.push(childRoute);
};

const toggleCollapse = () => {
    isCollapsed.value = !isCollapsed.value;
    if (isCollapsed.value) {
        expandedItems.value = [];
    }
};
</script>

<template>
    <div :class="[
        'bg-surface-900 dark:bg-surface-950 border-r border-surface-700 dark:border-surface-800 transition-all duration-300 flex flex-col h-screen',
        isCollapsed ? 'w-16' : 'w-64',
    ]">
        <!-- Header -->
        <div class="p-4 border-b border-surface-700 dark:border-surface-800 flex items-center justify-between">
            <div v-if="!isCollapsed" class="flex items-center gap-3">
                <div class="w-10 h-10 bg-[#4a5d23] rounded-lg flex items-center justify-center">
                    <svg class="w-6 h-6 text-primary-400" viewBox="0 0 24 24" fill="currentColor">
                        <!-- Główny płomień (większy kształt) -->
                        <path d="M12 2c0 0 2 3 2 6 0 2-1 4-2 5-1-1-2-3-2-5 0-3 2-6 2-6z" />
                        <!-- Mniejszy płomień u podstawy (kropla) -->
                        <ellipse cx="12" cy="16" rx="2" ry="2.5" />
                    </svg>
                </div>
                <div>
                    <h2 class="text-white dark:text-white font-bold text-lg">GasManager</h2>
                    <p class="text-xs text-gray-400 dark:text-gray-400">Admin Panel</p>
                </div>
            </div>
            <div v-else class="w-10 h-10 bg-[#4a5d23] rounded-lg flex items-center justify-center mx-auto">
                <svg class="w-6 h-6 text-primary-400" viewBox="0 0 24 24" fill="currentColor">
                    <!-- Główny płomień (większy kształt) -->
                    <path d="M12 2c0 0 2 3 2 6 0 2-1 4-2 5-1-1-2-3-2-5 0-3 2-6 2-6z" />
                    <!-- Mniejszy płomień u podstawy (kropla) -->
                    <ellipse cx="12" cy="16" rx="2" ry="2.5" />
                </svg>
            </div>
            <button @click="toggleCollapse"
                class="p-1.5 hover:bg-surface-800 dark:hover:bg-surface-900 rounded-lg transition-colors text-gray-300 dark:text-gray-300 hover:text-white">
                <ChevronLeftIcon v-if="!isCollapsed" class="w-5 h-5" />
                <ChevronRightIcon v-else class="w-5 h-5" />
            </button>
        </div>

        <!-- Menu Items -->
        <nav class="flex-1 overflow-y-auto p-2 space-y-1">
            <div v-for="item in menuItems" :key="item.id" class="group">
                <!-- Parent Item -->
                <button @click="handleItemClick(item)" :class="[
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left',
                    isActive(item.route) || isChildActive(item.children)
                        ? 'bg-primary-400 text-black'
                        : 'text-gray-300 dark:text-gray-300 hover:bg-surface-800 dark:hover:bg-surface-900 hover:text-white',
                ]">
                    <component :is="item.icon" class="w-5 h-5 shrink-0" />
                    <span v-if="!isCollapsed" class="flex-1">{{ item.label }}</span>
                    <ChevronRightIcon v-if="item.children && !isCollapsed" :class="[
                        'w-4 h-4 transition-transform',
                        isExpanded(item.id) ? 'rotate-90' : '',
                    ]" />
                </button>

                <!-- Children -->
                <div v-if="item.children && (isExpanded(item.id) || isCollapsed)" :class="[
                    'mt-1 space-y-1',
                    isCollapsed ? 'hidden' : 'block',
                ]">
                    <button v-for="child in item.children" :key="child.id" @click="handleChildClick(child.route)"
                        :class="[
                            'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ml-6',
                            isActive(child.route)
                                ? 'bg-primary-400/20 text-primary-400 border-l-2 border-primary-400'
                                : 'text-gray-400 dark:text-gray-400 hover:bg-surface-800 dark:hover:bg-surface-900 hover:text-gray-300 dark:hover:text-gray-300',
                        ]">
                        <span class="text-sm">{{ child.label }}</span>
                    </button>
                </div>
            </div>
        </nav>

        <!-- Footer: Dark Mode Toggle & User Info -->
        <div class="border-t border-surface-700 dark:border-surface-800 p-2 space-y-2">
            <!-- Dark Mode Toggle -->
            <button @click="toggleDarkMode" :class="[
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left',
                'text-gray-300 dark:text-gray-300 hover:bg-surface-800 dark:hover:bg-surface-900 hover:text-white',
            ]">
                <MoonIcon v-if="!isDarkMode" class="w-5 h-5 shrink-0" />
                <SunIcon v-else class="w-5 h-5 shrink-0" />
                <span v-if="!isCollapsed" class="flex-1">{{ isDarkMode ? 'Tryb jasny' : 'Tryb ciemny' }}</span>
            </button>

            <!-- User Info -->
            <div v-if="!isCollapsed" class="bg-[#4a5d23] rounded-lg p-3 flex items-center gap-3">
                <!-- Avatar -->
                <div class="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center shrink-0">
                    <svg class="w-6 h-6 text-orange-800" viewBox="0 0 24 24" fill="currentColor">
                        <path
                            d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                </div>
                <!-- User Info Text -->
                <div class="flex-1 min-w-0">
                    <p class="text-white dark:text-white font-medium text-sm truncate">{{ userName }} {{ userRole }}</p>
                    <p class="text-gray-300 dark:text-gray-300 text-xs truncate">{{ userEmail }}</p>
                </div>
                <!-- Logout Button -->
                <button @click="handleLogout"
                    class="p-1.5 hover:bg-black/20 rounded-lg transition-colors text-gray-300 dark:text-gray-300 hover:text-white shrink-0"
                    title="Wyloguj się">
                    <ArrowRightOnRectangleIcon class="w-5 h-5" />
                </button>
            </div>
            <!-- Collapsed User Avatar -->
            <div v-else class="flex justify-center">
                <button @click="handleLogout"
                    class="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center hover:bg-orange-300 transition-colors"
                    title="Wyloguj się">
                    <svg class="w-6 h-6 text-orange-800" viewBox="0 0 24 24" fill="currentColor">
                        <path
                            d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                </button>
            </div>
        </div>
    </div>
</template>
