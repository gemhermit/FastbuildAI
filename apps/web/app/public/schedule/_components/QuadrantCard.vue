<script setup lang="ts">
// ==================== Props ====================
const props = defineProps<{
    title: string;
    items: any[];
    categoryIcons: any;
    priorityColors: any;
}>();

const emit = defineEmits<{
    toggleComplete: [id: string];
    toggleImportant: [id: string];
    toggleUrgent: [id: string];
    edit: [item: any];
    delete: [id: string];
}>();
</script>

<template>
    <div class="border-border bg-card rounded-lg border p-3">
        <div class="mb-2 text-center">
            <h4 class="text-foreground text-sm font-semibold">{{ title }}</h4>
        </div>

        <div class="max-h-32 space-y-1 overflow-y-auto">
            <div v-if="items.length === 0" class="text-muted-foreground py-4 text-center text-xs">
                暂无任务
            </div>
            <div
                v-for="item in items"
                :key="item.id"
                class="bg-muted/30 border-border rounded p-2 text-xs"
            >
                <div class="mb-1 flex items-center justify-between">
                    <span
                        class="truncate font-medium"
                        :class="
                            item.completed
                                ? 'text-muted-foreground line-through'
                                : 'text-foreground'
                        "
                    >
                        {{ item.title }}
                    </span>
                    <span class="text-xs">{{ categoryIcons[item.category] }}</span>
                </div>

                <div class="text-muted-foreground mb-2 text-xs">
                    {{ item.time }} | {{ item.description }}
                </div>

                <div class="flex items-center justify-between">
                    <div class="flex gap-1">
                        <button
                            @click="$emit('toggleComplete', item.id)"
                            :title="item.completed ? '标记未完成' : '标记完成'"
                            class="rounded px-1 py-0.5 text-[10px] transition-colors"
                            :class="
                                item.completed
                                    ? 'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400'
                                    : 'bg-muted hover:bg-muted/80 text-foreground'
                            "
                        >
                            ✓
                        </button>
                        <button
                            @click="$emit('toggleImportant', item.id)"
                            title="切换重要"
                            class="rounded px-1 py-0.5 text-[10px] transition-colors"
                            :class="
                                item.isImportant
                                    ? 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400'
                                    : 'bg-muted hover:bg-muted/80 text-foreground'
                            "
                        >
                            重
                        </button>
                        <button
                            @click="$emit('toggleUrgent', item.id)"
                            title="切换紧急"
                            class="rounded px-1 py-0.5 text-[10px] transition-colors"
                            :class="
                                item.isUrgent
                                    ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400'
                                    : 'bg-muted hover:bg-muted/80 text-foreground'
                            "
                        >
                            急
                        </button>
                    </div>

                    <div class="flex gap-1">
                        <button
                            @click="$emit('edit', item)"
                            title="编辑"
                            class="rounded p-0.5 text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50"
                        >
                            <Icon name="lucide:edit-2" class="h-3 w-3" />
                        </button>
                        <button
                            @click="$emit('delete', item.id)"
                            title="删除"
                            class="rounded p-0.5 text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
                        >
                            <Icon name="lucide:trash-2" class="h-3 w-3" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
