<script setup lang="ts">
// ==================== Props ====================
const props = defineProps<{
    todoPanels: any;
    todoSortBy: string;
    todoFilterCategory: string;
    showCompletedInList: boolean;
    categoryIcons: any;
    formatDisplayDateFromString: (s: string) => string;
}>();

const emit = defineEmits<{
    "update:todoSortBy": [value: string];
    "update:todoFilterCategory": [value: string];
    "update:showCompletedInList": [value: boolean];
    toggleComplete: [id: string];
    toggleImportant: [id: string];
    toggleUrgent: [id: string];
    editSchedule: [item: any];
    deleteSchedule: [id: string];
}>();

// ==================== Methods ====================
const handleSortChange = (value: string) => {
    emit("update:todoSortBy", value);
};

const handleFilterChange = (value: string) => {
    emit("update:todoFilterCategory", value);
};

const handleShowCompletedChange = (value: boolean) => {
    emit("update:showCompletedInList", value);
};
</script>

<template>
    <div class="bg-card border-border rounded-lg border p-4 shadow-sm">
        <div class="mb-3 flex items-center justify-between">
            <h4 class="text-foreground text-sm font-semibold">日程面板</h4>
            <div class="flex items-center gap-2">
                <select
                    :value="todoSortBy"
                    @change="handleSortChange(($event.target as HTMLSelectElement).value)"
                    class="border-border bg-background text-foreground rounded border px-2 py-1 text-sm"
                >
                    <option value="time">按时间排序</option>
                    <option value="importance">按重要性排序</option>
                </select>
                <select
                    :value="todoFilterCategory"
                    @change="handleFilterChange(($event.target as HTMLSelectElement).value)"
                    class="border-border bg-background text-foreground rounded border px-2 py-1 text-sm"
                >
                    <option value="all">所有类别</option>
                    <option value="work">工作</option>
                    <option value="personal">个人</option>
                    <option value="meeting">会议</option>
                    <option value="reminder">提醒</option>
                </select>
                <label class="flex cursor-pointer items-center space-x-2 text-sm">
                    <input
                        :checked="showCompletedInList"
                        @change="
                            handleShowCompletedChange(($event.target as HTMLInputElement).checked)
                        "
                        type="checkbox"
                        class="border-border rounded"
                    />
                    <span class="text-foreground">显示已完成</span>
                </label>
            </div>
        </div>

        <div class="flex max-h-[500px] flex-col space-y-3 overflow-y-auto">
            <div
                v-for="panel in [
                    { key: 'today', title: '今日' },
                    { key: 'within3', title: '3 天内' },
                    { key: 'within7', title: '7 天内' },
                ]"
                :key="panel.key"
                class="rounded p-3"
            >
                <div class="mb-2 flex items-center justify-between">
                    <div class="text-foreground text-sm font-medium">
                        {{ panel.title }} ({{ todoPanels[panel.key].length }})
                    </div>
                </div>
                <div class="space-y-2">
                    <div
                        v-if="todoPanels[panel.key].length === 0"
                        class="text-muted-foreground text-xs"
                    >
                        暂无任务
                    </div>
                    <div
                        v-for="t in todoPanels[panel.key]"
                        :key="t.id"
                        class="border-border bg-card flex items-center justify-between rounded border p-2"
                    >
                        <div class="flex min-w-0 items-center gap-3">
                            <div class="flex min-w-[56px] flex-col items-start text-left">
                                <div class="text-muted-foreground text-xs">
                                    {{ t.time }}
                                </div>
                                <div class="text-muted-foreground text-xs">
                                    {{ formatDisplayDateFromString(t.date) }}
                                </div>
                            </div>
                            <div class="min-w-0 flex-1">
                                <div
                                    class="truncate text-sm"
                                    :class="
                                        t.completed
                                            ? 'text-muted-foreground line-through'
                                            : 'text-foreground'
                                    "
                                >
                                    {{ t.title }}
                                </div>
                                <div class="text-muted-foreground text-xs">
                                    {{ t.description }}
                                </div>
                            </div>
                            <div class="text-xs">
                                {{ categoryIcons[t.category] }}
                            </div>
                        </div>
                        <div class="flex items-center gap-1">
                            <button
                                @click="$emit('toggleComplete', t.id)"
                                :title="t.completed ? '标记未完成' : '标记完成'"
                                class="rounded px-2 py-1 text-xs transition-colors"
                                :class="
                                    t.completed
                                        ? 'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400'
                                        : 'bg-muted hover:bg-muted/80 text-foreground'
                                "
                            >
                                ✓
                            </button>
                            <button
                                @click="$emit('toggleImportant', t.id)"
                                title="切换重要"
                                class="rounded px-2 py-1 text-xs transition-colors"
                                :class="
                                    t.isImportant
                                        ? 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400'
                                        : 'bg-muted hover:bg-muted/80 text-foreground'
                                "
                            >
                                重
                            </button>
                            <button
                                @click="$emit('toggleUrgent', t.id)"
                                title="切换紧急"
                                class="rounded px-2 py-1 text-xs transition-colors"
                                :class="
                                    t.isUrgent
                                        ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400'
                                        : 'bg-muted hover:bg-muted/80 text-foreground'
                                "
                            >
                                急
                            </button>
                            <button
                                @click="$emit('editSchedule', t)"
                                title="编辑"
                                class="rounded p-1 text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50"
                            >
                                <Icon name="lucide:edit-2" class="h-4 w-4" />
                            </button>
                            <button
                                @click="$emit('deleteSchedule', t.id)"
                                title="删除"
                                class="rounded p-1 text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
                            >
                                <Icon name="lucide:trash-2" class="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
