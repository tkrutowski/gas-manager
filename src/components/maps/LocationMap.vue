<script setup lang="ts">
  import { ref, watch, onMounted } from 'vue';
  import { LMap, LTileLayer, LMarker } from '@vue-leaflet/vue-leaflet';
  import 'leaflet/dist/leaflet.css';
  import L from 'leaflet';
  import type { Map } from 'leaflet';

  // Fix dla domyślnej ikony markera w Leaflet
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });

  const props = defineProps<{
    latitude?: string | number;
    longitude?: string | number;
    readonly?: boolean;
    draggable?: boolean;
  }>();

  const emit = defineEmits<{
    (e: 'update:position', payload: { lat: number; lng: number }): void;
  }>();

  const zoom = ref(15);
  const center = ref<[number, number]>([52.2297, 21.0122]); // Domyślnie Warszawa
  const markerPosition = ref<[number, number] | null>(null);
  const leafletMapRef = ref<Map | null>(null);

  const onMapReady = (map: Map) => {
    leafletMapRef.value = map;
  };

  /** Wywołaj po rozwinięciu panelu, gdy mapa była wcześniej ukryta – przelicza rozmiar i odświeża kafelki */
  const invalidateSize = () => {
    leafletMapRef.value?.invalidateSize();
  };

  defineExpose({ invalidateSize });

  const onMapClick = (e: any) => {
    if (props.readonly) return;
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    center.value = [lat, lng];
    markerPosition.value = [lat, lng];
    emit('update:position', { lat, lng });
  };

  // Emituj aktualizacje pozycji markera, np. po jego przeciągnięciu
  watch(
    () => markerPosition.value,
    val => {
      if (val && Array.isArray(val) && val.length === 2) {
        emit('update:position', { lat: val[0], lng: val[1] });
      }
    }
  );

  // Aktualizuj centrum mapy i marker gdy zmienią się współrzędne
  watch(
    () => [props.latitude, props.longitude],
    ([lat, lng]) => {
      if (lat !== undefined && lat !== null && lng !== undefined && lng !== null) {
        const latNum = typeof lat === 'string' ? parseFloat(lat) : Number(lat);
        const lngNum = typeof lng === 'string' ? parseFloat(lng) : Number(lng);
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

  onMounted(() => {
    if (props.latitude && props.longitude) {
      const latNum = typeof props.latitude === 'string' ? parseFloat(props.latitude) : Number(props.latitude);
      const lngNum = typeof props.longitude === 'string' ? parseFloat(props.longitude) : Number(props.longitude);
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
          @click="onMapClick"
          @ready="onMapReady"
        >
          <l-tile-layer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            layer-type="base"
            name="OpenStreetMap"
          />
          <l-marker
            v-if="markerPosition"
            v-model:lat-lng="markerPosition"
            :draggable="!props.readonly && props.draggable !== false"
          />
        </l-map>
      </div>
    </div>
  </div>
</template>
