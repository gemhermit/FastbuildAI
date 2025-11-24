<script setup lang="ts">
const props = defineProps<{
    message?: string;
    createLabel?: string;
    aiLabel?: string;
}>();

const emit = defineEmits<{
    (e: "create"): void;
    (e: "openAi"): void;
}>();
</script>

<template>
    <div
        class="group relative rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400 transition hover:border-blue-200 hover:bg-blue-50/40"
    >
        {{ props.message || "还没有日程" }}
        <div
            class="pointer-events-none absolute inset-0 flex items-center justify-center gap-4 opacity-0 transition group-hover:opacity-100"
        >
            <button
                class="pointer-events-auto rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700"
                @click.stop="emit('create')"
            >
                {{ props.createLabel || "新建日程" }}
            </button>
            <button
                class="pointer-events-auto rounded-full bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-purple-700"
                @click.stop="emit('openAi')"
            >
                {{ props.aiLabel || "AI写待办" }}
            </button>
        </div>
    </div>
</template>
