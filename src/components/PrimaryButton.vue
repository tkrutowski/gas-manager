<script setup lang="ts">
  interface Props {
    type?: 'button' | 'submit' | 'reset';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    text?: string;
    withIcon?: boolean;
    icon?: string; // PrimeIcons class, np. "pi pi-download"
    iconPos?: 'left' | 'right'; // Pozycja ikony PrimeVue
  }

  const props = withDefaults(defineProps<Props>(), {
    type: 'button',
    size: 'md',
    disabled: false,
    text: '',
    withIcon: false,
    icon: undefined,
    iconPos: 'left',
  });

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-3 py-2 text-lg font-medium',
    lg: 'text-lg px-6 py-2 font-medium',
  };

  const iconSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="[
      sizeClasses[size],
      'bg-primary-400 hover:bg-primary-300 text-black rounded-lg transition-colors font-medium',
      (withIcon || icon) && 'flex items-center gap-2',
      disabled && 'opacity-50 cursor-not-allowed hover:bg-primary-400',
    ]"
  >
    <!-- PrimeIcons ikona po lewej -->
    <i v-if="icon && iconPos === 'left'" :class="[icon, iconSizeClasses[size]]"></i>

    <!-- Slot lub text -->
    <slot>{{ text }}</slot>

    <!-- PrimeIcons ikona po prawej -->
    <i v-if="icon && iconPos === 'right'" :class="[icon, iconSizeClasses[size]]"></i>
  </button>
</template>
