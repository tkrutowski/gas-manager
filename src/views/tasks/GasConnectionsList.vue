<script setup lang="ts">
import SidebarMenu from '@/components/tasks/SidebarMenu.vue';
</script>

<template>
    <div class="flex h-screen bg-[#0a0a0a] overflow-hidden">
        <!-- Sidebar Menu -->
        <SidebarMenu />

        <!-- Main Content -->
        <div class="flex-1 overflow-y-auto p-6">
            <div class="max-w-7xl mx-auto">
                <h1 class="text-3xl font-bold text-white mb-6">Lista Przyłączy Gazu</h1>
                <div class="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
                    <p class="text-white/60">Lista przyłączy gazu - do implementacji</p>
                </div>
            </div>
        </div>
    </div>
</template>
