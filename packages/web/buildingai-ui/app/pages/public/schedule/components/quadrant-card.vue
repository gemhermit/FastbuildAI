<script setup lang="ts">
import { categoryIcons, priorityColors } from "../constants";
import type { ScheduleItem } from "../types";

defineProps<{
    title: string;
    items: ScheduleItem[];
}>();

const emit = defineEmits<{
    (e: "toggleComplete", id: string): void;
    (e: "toggleImportant", id: string): void;
    (e: "toggleUrgent", id: string): void;
    (e: "edit", item: ScheduleItem): void;
    (e: "delete", id: string): void;
}>();
</script>

<template>
    <div class="flex aspect-square flex-col rounded-xl border bg-white p-3">
        <div class="mb-2 text-sm font-semibold text-gray-800">{{ title }}</div>
        <div class="flex-1 space-y-2 overflow-auto pr-1">
            <div v-if="items.length === 0" class="pt-6 text-center text-xs text-gray-400">
                暂无事项
            </div>
            <div
                v-else
                v-for="schedule in items"
                :key="schedule.id"
                class="rounded-lg border p-2"
                :class="
                    schedule.completed ? 'border-gray-200 bg-gray-50' : 'border-gray-200 bg-white'
                "
            >
                <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0 flex-1">
                        <div class="mb-1 flex items-center gap-2">
                            <span class="text-base">{{ categoryIcons[schedule.category] }}</span>
                            <span
                                class="truncate text-sm font-medium"
                                :class="
                                    schedule.completed
                                        ? 'text-gray-500 line-through'
                                        : 'text-gray-900'
                                "
                            >
                                {{ schedule.title }}
                            </span>
                            <span
                                class="h-2 w-2 rounded-full"
                                :class="priorityColors[schedule.priority]"
                            ></span>
                        </div>
                        <div
                            v-if="schedule.description"
                            class="mb-1 truncate text-xs text-gray-600"
                        >
                            {{ schedule.description }}
                        </div>
                        <div class="flex items-center text-[11px] text-gray-500">
                            <UIcon name="i-lucide-clock" class="mr-1 h-3 w-3" />
                            {{ schedule.time }}
                        </div>
                        <div
                            v-if="
                                schedule.category === 'meeting' &&
                                (schedule.meetingAgenda || schedule.attendees)
                            "
                            class="mt-1 space-y-0.5 text-[11px] text-gray-600"
                        >
                            <div v-if="schedule.meetingAgenda">
                                议程：{{ schedule.meetingAgenda }}
                            </div>
                            <div v-if="schedule.attendees">与会：{{ schedule.attendees }}</div>
                        </div>
                    </div>
                    <div class="flex shrink-0 flex-col items-center gap-1">
                        <button
                            @click="emit('toggleComplete', schedule.id)"
                            class="rounded px-2 py-0.5 text-xs"
                            :class="
                                schedule.completed
                                    ? 'bg-green-50 text-green-700'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                            "
                            :title="schedule.completed ? '标记未完成' : '标记完成'"
                        >
                            ✓
                        </button>
                        <button
                            @click="emit('toggleImportant', schedule.id)"
                            class="rounded px-2 py-0.5 text-xs"
                            :class="
                                schedule.isImportant
                                    ? 'bg-red-50 text-red-700'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                            "
                            title="切换重要"
                        >
                            重
                        </button>
                        <button
                            @click="emit('toggleUrgent', schedule.id)"
                            class="rounded px-2 py-0.5 text-xs"
                            :class="
                                schedule.isUrgent
                                    ? 'bg-orange-50 text-orange-700'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                            "
                            title="切换紧急"
                        >
                            急
                        </button>
                        <button
                            @click="emit('edit', schedule)"
                            class="rounded p-1 text-blue-600 hover:bg-blue-50"
                            title="编辑"
                        >
                            <UIcon name="i-lucide-edit" class="h-4 w-4" />
                        </button>
                        <button
                            @click="emit('delete', schedule.id)"
                            class="rounded p-1 text-red-600 hover:bg-red-50"
                            title="删除"
                        >
                            <UIcon name="i-lucide-trash" class="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
