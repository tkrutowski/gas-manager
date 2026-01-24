<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import SidebarMenu from '@/components/SidebarMenu.vue';
import GasConnectionForm from '@/components/tasks/GasConnectionForm.vue';
import { useGasConnectionsStore } from '@/stores/gasConnections';
import type { GasConnection } from '@/types/GasConnection';

const router = useRouter();
const route = useRoute();
const gasConnectionsStore = useGasConnectionsStore();

const gasConnection = ref<GasConnection | undefined>(undefined);

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

const handleSubmit = (data: GasConnection) => {
  const { id, ...rest } = data;
  if (id != null && !isNaN(Number(id))) {
    gasConnectionsStore.updateGasConnection(id, rest);
  } else {
    gasConnectionsStore.addGasConnection(rest);
  }
  router.push('/tasks/gas-connections');
};

const handleCancel = () => {
  router.push('/tasks/gas-connections');
};
</script>

<template>
  <div class="flex h-screen bg-surface-50 dark:bg-surface-900 overflow-hidden">
    <!-- Sidebar Menu -->
    <SidebarMenu />

    <!-- Main Content -->
    <div class="flex-1 overflow-y-auto">
      <GasConnectionForm :gasConnection="gasConnection" @submit="handleSubmit" @cancel="handleCancel" />
    </div>
  </div>
</template>
