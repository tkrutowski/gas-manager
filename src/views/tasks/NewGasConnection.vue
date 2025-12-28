<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import SidebarMenu from '@/components/tasks/SidebarMenu.vue';
import GasConnectionForm from '@/components/tasks/GasConnectionForm.vue';
import type { GasConnection } from '@/types/GasConnection';

const router = useRouter();

const handleSubmit = (data: GasConnection) => {
    console.log('Zapisano dane:', data);
    // TODO: Implementacja zapisu do API
    router.push('/tasks/gas-connections');
};

const handleCancel = () => {
    router.push('/tasks/gas-connections');
};
</script>

<template>
    <div class="flex h-screen bg-[#0a0a0a] overflow-hidden">
        <!-- Sidebar Menu -->
        <SidebarMenu />

        <!-- Main Content -->
        <div class="flex-1 overflow-y-auto">
            <GasConnectionForm @submit="handleSubmit" @cancel="handleCancel" />
        </div>
    </div>
</template>

