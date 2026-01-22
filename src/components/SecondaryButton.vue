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
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-2 text-base',
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
      'bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-900 dark:text-white',
      (withIcon || icon) && 'flex items-center gap-2',
      disabled && 'opacity-50 cursor-not-allowed hover:bg-surface-50 dark:hover:bg-surface-900',
    ]"
  >
    <!-- PrimeIcons ikona po lewej -->
    <i v-if="icon && iconPos === 'left'" :class="[icon, iconSizeClasses[size]]"></i>

    <!-- Slot lub text -->
    <slot>{{ text }}</slot>

    <!-- PrimeIcons ikona po prawej -->
    <i v-if="icon && iconPos === 'right'" :class="[icon, iconSizeClasses[size], 'pr-5']"></i>
  </button>
</template>
