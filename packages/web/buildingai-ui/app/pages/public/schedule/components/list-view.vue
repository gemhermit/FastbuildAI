<script setup lang="ts">
import { computed, ref } from "vue";

import { categoryIcons } from "../constants";
import type { ScheduleItem } from "../types";
import { formatDateLocal, formatDisplayDateFromString, parseLocalDate } from "../utils";

const props = defineProps<{
    selectedDate: Date;
    scheduleItems: ScheduleItem[];
    deletingId: string | null;
}>();

const emit = defineEmits<{
    (e: "toggleComplete", id: string): void;
    (e: "toggleImportant", id: string): void;
    (e: "toggleUrgent", id: string): void;
    (e: "edit", item: ScheduleItem): void;
    (e: "delete", id: string): void;
    (e: "create"): void;
    (e: "openAi"): void;
}>();

const todoSortBy = ref<"time" | "importance">("time");
const todoFilterCategory = ref<"all" | "work" | "personal" | "meeting" | "reminder">("all");
const showCompletedInList = ref(false);

const todayKey = computed(() => formatDateLocal(new Date()));
const selectedKey = computed(() => formatDateLocal(props.selectedDate));

const filteredTasks = computed(() =>
    props.scheduleItems.filter((task) => {
        if (todoFilterCategory.value !== "all" && task.category !== todoFilterCategory.value)
            return false;
        if (!showCompletedInList.value && task.completed) return false;
        return true;
    }),
);

const sortList = (list: ScheduleItem[]) => {
    const copy = [...list];
    if (todoSortBy.value === "time") {
        copy.sort((a, b) => (a.time || "00:00").localeCompare(b.time || "00:00"));
    } else {
        const priRank = (p: string) => (p === "high" ? 3 : p === "medium" ? 2 : 1);
        copy.sort((a, b) => {
            const ai = a.isImportant ? 1 : 0;
            const bi = b.isImportant ? 1 : 0;
            if (ai !== bi) return bi - ai;
            return priRank(String(b.priority)) - priRank(String(a.priority));
        });
    }
    return copy;
};

const todoPanels = computed(() => {
    const todayList = filteredTasks.value.filter((t) => t.date === todayKey.value);
    const within3List = filteredTasks.value.filter((t) => {
        const d = parseLocalDate(t.date);
        const diff = Math.round(
            (d.getTime() - parseLocalDate(todayKey.value).getTime()) / (24 * 3600 * 1000),
        );
        return diff >= 1 && diff <= 3;
    });
    const within7List = filteredTasks.value.filter((t) => {
        const d = parseLocalDate(t.date);
        const diff = Math.round(
            (d.getTime() - parseLocalDate(todayKey.value).getTime()) / (24 * 3600 * 1000),
        );
        return diff >= 4 && diff <= 7;
    });

    return {
        today: sortList(todayList),
        within3: sortList(within3List),
        within7: sortList(within7List),
    };
});

const panelConfigs = [
    { key: "today", title: "今日待办" },
    { key: "within3", title: "未来 3 天" },
    { key: "within7", title: "未来 7 天" },
] as const;

const dateTitle = computed(() =>
    props.selectedDate.toLocaleDateString("zh-CN", {
        month: "long",
        day: "numeric",
        weekday: "long",
    }),
);
</script>

<template>
    <div class="rounded-2xl bg-white p-6 shadow-lg">
        <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
                <p class="text-sm text-gray-500">当前日期</p>
                <h3 class="text-xl font-semibold text-gray-900">
                    {{ dateTitle }}
                </h3>
            </div>
            <div class="flex items-center gap-2">
                <button
                    type="button"
                    @click="emit('openAi')"
                    class="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
                >
                    打开 AI 助手
                </button>
                <button
                    type="button"
                    @click="emit('create')"
                    class="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700"
                >
                    新建日程
                </button>
            </div>
        </div>

        <div class="mb-5 flex flex-wrap items-center gap-3">
            <select
                v-model="todoSortBy"
                class="rounded-full border border-gray-200 px-3 py-1 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
                <option value="time">按时间排序</option>
                <option value="importance">按重要性排序</option>
            </select>
            <select
                v-model="todoFilterCategory"
                class="rounded-full border border-gray-200 px-3 py-1 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
                <option value="all">所有类别</option>
                <option value="work">工作</option>
                <option value="personal">个人</option>
                <option value="meeting">会议</option>
                <option value="reminder">提醒</option>
            </select>
            <label class="inline-flex items-center gap-2 text-sm text-gray-700">
                <input v-model="showCompletedInList" type="checkbox" class="h-4 w-4 rounded" />
                显示已完成
            </label>
            <div class="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                <span>今日：{{ formatDisplayDateFromString(todayKey) }}</span>
                <span class="h-3 w-px bg-gray-300"></span>
                <span>已选：{{ formatDisplayDateFromString(selectedKey) }}</span>
            </div>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div
                v-for="panel in panelConfigs"
                :key="panel.key"
                class="rounded-2xl border border-gray-100 bg-gray-50 p-4 shadow-sm"
            >
                <div class="mb-3 flex items-center justify-between">
                    <div class="text-sm font-semibold text-gray-800">
                        {{ panel.title }} ({{ todoPanels[panel.key].length }})
                    </div>
                    <UIcon name="i-lucide-chevron-right" class="h-4 w-4 text-gray-400" />
                </div>
                <div class="space-y-2">
                    <div
                        v-if="todoPanels[panel.key].length === 0"
                        class="rounded-lg border border-dashed border-gray-200 px-3 py-6 text-center text-xs text-gray-400"
                    >
                        暂无任务
                    </div>
                    <div
                        v-else
                        v-for="t in todoPanels[panel.key]"
                        :key="t.id"
                        class="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-3 shadow-sm"
                    >
                        <div class="flex min-w-0 items-center gap-3">
                            <div class="flex min-w-[56px] flex-col items-start text-left">
                                <div class="text-xs text-gray-500">
                                    {{ t.time }}
                                </div>
                                <div class="text-xs text-gray-400">
                                    {{ formatDisplayDateFromString(t.date) }}
                                </div>
                            </div>
                            <div class="min-w-0 flex-1">
                                <div
                                    class="truncate text-sm"
                                    :class="
                                        t.completed ? 'text-gray-400 line-through' : 'text-gray-900'
                                    "
                                >
                                    {{ t.title }}
                                </div>
                                <div class="text-xs text-gray-500">
                                    {{ t.description }}
                                </div>
                            </div>
                            <div class="ml-2 text-xs">
                                {{ categoryIcons[t.category] }}
                            </div>
                        </div>
                        <div class="flex items-center gap-1">
                            <button
                                @click="emit('toggleComplete', t.id)"
                                :title="t.completed ? '标记未完成' : '标记完成'"
                                class="rounded-full px-3 py-1 text-xs font-medium transition"
                                :class="
                                    t.completed
                                        ? 'bg-green-50 text-green-700'
                                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                "
                            >
                                ✓
                            </button>
                            <button
                                @click="emit('toggleImportant', t.id)"
                                title="切换重要"
                                class="rounded-full px-3 py-1 text-xs font-medium transition"
                                :class="
                                    t.isImportant
                                        ? 'bg-red-50 text-red-700'
                                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                "
                            >
                                重
                            </button>
                            <button
                                @click="emit('toggleUrgent', t.id)"
                                title="切换紧急"
                                class="rounded-full px-3 py-1 text-xs font-medium transition"
                                :class="
                                    t.isUrgent
                                        ? 'bg-orange-50 text-orange-700'
                                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                "
                            >
                                急
                            </button>
                            <button
                                @click="emit('edit', t)"
                                title="编辑"
                                class="rounded-full p-1 text-blue-600 transition hover:bg-blue-50"
                            >
                                <UIcon name="i-lucide-edit" class="h-4 w-4" />
                            </button>
                            <button
                                @click="emit('delete', t.id)"
                                title="删除"
                                class="rounded-full p-1 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                :disabled="deletingId === t.id"
                            >
                                <UIcon name="i-lucide-trash" class="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
