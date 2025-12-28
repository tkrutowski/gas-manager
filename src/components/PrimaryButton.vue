<script setup lang="ts">
interface Props {
    type?: 'button' | 'submit' | 'reset';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    text?: string;
}

const props = withDefaults(defineProps<Props>(), {
    type: 'button',
    size: 'md',
    disabled: false,
    text: '',
});

const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-3 py-2 text-lg font-medium',
    lg: 'text-lg px-6 py-2 font-medium',
};
</script>

<template>
    <button :type="type" :disabled="disabled" :class="[
        sizeClasses[size],
        'bg-primary-400 hover:bg-primary-300 text-black rounded-lg transition-colors font-medium',
        disabled && 'opacity-50 cursor-not-allowed hover:bg-primary-400',
    ]">
        <slot>{{ text }}</slot>
    </button>
</template>
