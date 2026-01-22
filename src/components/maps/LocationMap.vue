<script setup lang="ts">
  import { ref, watch, onMounted } from 'vue';
  import { LMap, LTileLayer, LMarker } from '@vue-leaflet/vue-leaflet';
  import 'leaflet/dist/leaflet.css';
  import L from 'leaflet';
  import { MapPinIcon } from '@heroicons/vue/24/outline';

  // Fix dla domyślnej ikony markera w Leaflet
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });

  const props = defineProps<{
    latitude?: string;
    longitude?: string;
    readonly?: boolean;
  }>();

  const zoom = ref(15);
  const center = ref<[number, number]>([52.2297, 21.0122]); // Domyślnie Warszawa
  const markerPosition = ref<[number, number] | null>(null);

  // Aktualizuj centrum mapy i marker gdy zmienią się współrzędne
  watch(
    () => [props.latitude, props.longitude],
    ([lat, lng]) => {
      if (lat && lng) {
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);
        if (!isNaN(latNum) && !isNaN(lngNum)) {
          center.value = [latNum, lngNum];
          markerPosition.value = [latNum, lngNum];
          zoom.value = 15;
        } else {
          markerPosition.value = null;
        }
      } else {
        markerPosition.value = null;
      }
    },
    { immediate: true }
  );

  // Kontrolki zoom
  const zoomIn = () => {
    zoom.value = Math.min(zoom.value + 1, 18);
  };

  const zoomOut = () => {
    zoom.value = Math.max(zoom.value - 1, 1);
  };

  onMounted(() => {
    if (props.latitude && props.longitude) {
      const latNum = parseFloat(props.latitude);
      const lngNum = parseFloat(props.longitude);
      if (!isNaN(latNum) && !isNaN(lngNum)) {
        center.value = [latNum, lngNum];
        markerPosition.value = [latNum, lngNum];
      }
    }
  });
</script>

<template>
  <div class="relative">
    <div
      class="border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden bg-surface-50 dark:bg-surface-900"
    >
      <!-- Mapa -->
      <div class="relative" style="height: 400px">
        <l-map
          v-model:zoom="zoom"
          v-model:center="center"
          :use-global-leaflet="false"
          style="height: 100%; width: 100%"
        >
          <l-tile-layer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            layer-type="base"
            name="OpenStreetMap"
          />
          <l-marker v-if="markerPosition" :lat-lng="markerPosition" />
        </l-map>
      </div>
    </div>
  </div>
</template>
