<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";

import { categoryIcons } from "../constants";
import type { ScheduleItem } from "../types";
import { parseLocalDate } from "../utils";
import EmptyHoverActions from "./empty-hover-actions.vue";

const props = withDefaults(
    defineProps<{
        selectedDate: Date;
        scheduleItems: ScheduleItem[];
        deletingId: string | null;
        variant?: "default" | "compact";
        sortBy?: "time" | "importance";
        showCompleted?: boolean;
    }>(),
    {
        showCompleted: undefined,
    },
);

const emit = defineEmits<{
    (e: "toggleComplete", id: string): void;
    (e: "toggleImportant", id: string): void;
    (e: "toggleUrgent", id: string): void;
    (e: "edit", item: ScheduleItem): void;
    (e: "delete", id: string): void;
    (e: "create"): void;
    (e: "openAi"): void;
    (e: "updateTitle", payload: { id: string; title: string }): void;
}>();

const todoSortBy = ref<"time" | "importance">(props.sortBy ?? "time");
const sortOrder = ref<"asc" | "desc">("asc");
const todoFilterCategory = ref<
    "all" | "work" | "personal" | "meeting" | "reminder" | "uncategorized"
>("all");
const showCompletedInList = ref(true);
const filterImportantOnly = ref(false);
const filterUrgentOnly = ref(false);
const LIST_PREF_KEY = "schedule:list-view-prefs";

const restoreListPrefs = () => {
    if (typeof window === "undefined") return;
    try {
        const raw = window.localStorage.getItem(LIST_PREF_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<{
            sortBy: "time" | "importance";
            sortOrder: "asc" | "desc";
            filter: "all" | "work" | "personal" | "meeting" | "reminder" | "uncategorized";
            showCompleted: boolean;
            importantOnly: boolean;
            urgentOnly: boolean;
        }>;
        if (parsed.sortBy) todoSortBy.value = parsed.sortBy;
        if (parsed.sortOrder) sortOrder.value = parsed.sortOrder;
        if (parsed.filter) todoFilterCategory.value = parsed.filter;
        if (typeof parsed.showCompleted === "boolean")
            showCompletedInList.value = parsed.showCompleted;
        if (typeof parsed.importantOnly === "boolean")
            filterImportantOnly.value = parsed.importantOnly;
        if (typeof parsed.urgentOnly === "boolean") filterUrgentOnly.value = parsed.urgentOnly;
    } catch (err) {
        console.warn("Failed to restore list prefs", err);
    }
};

const persistListPrefs = () => {
    if (typeof window === "undefined") return;
    const payload = {
        sortBy: todoSortBy.value,
        sortOrder: sortOrder.value,
        filter: todoFilterCategory.value,
        showCompleted: showCompletedInList.value,
        importantOnly: filterImportantOnly.value,
        urgentOnly: filterUrgentOnly.value,
    };
    window.localStorage.setItem(LIST_PREF_KEY, JSON.stringify(payload));
};

onMounted(() => {
    restoreListPrefs();
});

watch(
    [
        todoSortBy,
        sortOrder,
        todoFilterCategory,
        showCompletedInList,
        filterImportantOnly,
        filterUrgentOnly,
    ],
    persistListPrefs,
    { deep: false },
);

const effectiveSort = computed(() => props.sortBy ?? todoSortBy.value);
const showCompletedFlag = computed(() => props.showCompleted ?? showCompletedInList.value);

const filteredTasks = computed(() =>
    props.scheduleItems.filter((task) => {
        if (todoFilterCategory.value !== "all" && task.category !== todoFilterCategory.value)
            return false;
        if (!showCompletedFlag.value && task.completed) return false;
        if (filterImportantOnly.value && !task.isImportant) return false;
        if (filterUrgentOnly.value && !task.isUrgent) return false;
        return true;
    }),
);

const sortedTasks = computed(() => sortList(filteredTasks.value));

const sortList = (list: ScheduleItem[]) => {
    const copy = [...list];
    const dir = sortOrder.value === "asc" ? 1 : -1;
    const timeValue = (item: ScheduleItem) => {
        const [h = "00", m = "00"] = (item.time || "00:00").split(":");
        return Number(h) * 60 + Number(m);
    };
    if (effectiveSort.value === "time") {
        copy.sort((a, b) => (timeValue(a) - timeValue(b)) * dir);
    } else {
        const priRank = (p: string) => {
            if (p === "high") return 3;
            if (p === "medium") return 2;
            if (p === "low") return 1;
            return 0;
        };
        copy.sort((a, b) => {
            const ai = a.isImportant ? 1 : 0;
            const bi = b.isImportant ? 1 : 0;
            if (ai !== bi) return (bi - ai) * dir;
            const au = a.isUrgent ? 1 : 0;
            const bu = b.isUrgent ? 1 : 0;
            if (au !== bu) return (bu - au) * dir;
            const priDiff = priRank(String(b.priority)) - priRank(String(a.priority));
            if (priDiff !== 0) return priDiff * dir;
            return (timeValue(a) - timeValue(b)) * dir;
        });
    }
    return copy;
};

const groupedByDate = computed<[string, ScheduleItem[]][]>(() => {
    const map = new Map<string, ScheduleItem[]>();
    sortedTasks.value.forEach((task) => {
        const list = map.get(task.date) ?? [];
        list.push(task);
        map.set(task.date, list);
    });
    const orderedDates = Array.from(map.keys()).sort(
        (a, b) => parseLocalDate(a).getTime() - parseLocalDate(b).getTime(),
    );
    if (sortOrder.value === "desc" && effectiveSort.value === "time") {
        orderedDates.reverse();
    }
    return orderedDates.map((date) => [date, map.get(date) ?? []] as [string, ScheduleItem[]]);
});

const formatCompactDate = (value: string) => {
    const d = parseLocalDate(value);
    return d.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
};

const editingId = ref<string | null>(null);
const editingValue = ref("");

const startEditing = (item: ScheduleItem) => {
    editingId.value = item.id;
    editingValue.value = item.title;
    requestAnimationFrame(() => {
        const el = document.getElementById(`inline-input-${item.id}`) as HTMLInputElement | null;
        el?.focus();
        el?.select();
    });
};

const commitEditing = (item: ScheduleItem) => {
    if (!editingId.value) return;
    const newTitle = editingValue.value.trim();
    if (newTitle && newTitle !== item.title) {
        emit("updateTitle", { id: item.id, title: newTitle });
    }
    editingId.value = null;
    editingValue.value = "";
};

const cancelEditing = () => {
    editingId.value = null;
    editingValue.value = "";
};

const toggleSortOrder = () => {
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
};
</script>

<template>
    <div
        class="rounded-2xl bg-white p-2 shadow-lg"
        :class="props.variant === 'compact' ? 'rounded-none bg-transparent p-0 shadow-none' : ''"
    >
        <div v-if="props.variant !== 'compact'" class="mb-4 flex flex-wrap items-center gap-3">
            <select
                v-model="todoSortBy"
                class="rounded-full border border-gray-200 px-3 py-1 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
                <option value="time">按时间排序</option>
                <option value="importance">按重要性排序</option>
            </select>
            <button
                type="button"
                @click="toggleSortOrder"
                class="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-700 transition hover:border-blue-200 hover:text-blue-700"
            >
                {{ sortOrder === "asc" ? "顺序" : "倒序" }}
                <UIcon
                    :name="
                        sortOrder === 'asc'
                            ? 'i-lucide-arrow-up-narrow-wide'
                            : 'i-lucide-arrow-down-narrow-wide'
                    "
                    class="h-4 w-4"
                />
            </button>
            <select
                v-model="todoFilterCategory"
                class="rounded-full border border-gray-200 px-3 py-1 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
                <option value="all">所有类别</option>
                <option value="work">工作</option>
                <option value="personal">个人</option>
                <option value="meeting">会议</option>
                <option value="reminder">提醒</option>
                <option value="uncategorized">未分类</option>
            </select>
            <label class="inline-flex items-center gap-2 text-sm text-gray-700">
                <input v-model="showCompletedInList" type="checkbox" class="h-4 w-4 rounded" />
                显示已完成
            </label>
            <label class="inline-flex items-center gap-2 text-sm text-gray-700">
                <input v-model="filterImportantOnly" type="checkbox" class="h-4 w-4 rounded" />
                只看重要
            </label>
            <label class="inline-flex items-center gap-2 text-sm text-gray-700">
                <input v-model="filterUrgentOnly" type="checkbox" class="h-4 w-4 rounded" />
                只看紧急
            </label>
        </div>

        <div
            class="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
            :class="props.variant === 'compact' ? 'border-none bg-transparent p-0 shadow-none' : ''"
        >
            <div v-if="groupedByDate.length === 0">
                <EmptyHoverActions
                    message="暂无安排"
                    @create="emit('create')"
                    @openAi="emit('openAi')"
                />
            </div>
            <div v-else class="space-y-4">
                <div v-for="[date, items] in groupedByDate" :key="date" class="space-y-2">
                    <div class="flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <span class="h-2 w-2 rounded-full bg-blue-500"></span>
                        <span>{{ formatCompactDate(date) }}</span>
                    </div>
                    <div class="space-y-1.5">
                        <div
                            v-for="t in items"
                            :key="t.id"
                            class="flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-gray-50"
                            @dblclick="startEditing(t)"
                        >
                            <button
                                class="flex h-4 w-4 items-center justify-center rounded-full border border-blue-400 text-blue-500 transition hover:bg-blue-50"
                                :class="t.completed ? 'bg-blue-500 text-white' : ''"
                                @click="emit('toggleComplete', t.id)"
                                :title="t.completed ? '标记未完成' : '标记完成'"
                            >
                                <UIcon v-if="t.completed" name="i-lucide-check" class="h-3 w-3" />
                            </button>
                            <div class="flex min-w-0 flex-1 flex-col">
                                <div class="relative min-h-[32px]">
                                    <div
                                        class="text-sm transition-colors"
                                        :class="[
                                            t.completed
                                                ? 'text-gray-400 line-through'
                                                : 'text-gray-900',
                                            editingId === t.id ? 'invisible' : '',
                                        ]"
                                    >
                                        {{ t.title }}
                                    </div>
                                    <input
                                        v-if="editingId === t.id"
                                        :id="`inline-input-${t.id}`"
                                        v-model="editingValue"
                                        class="absolute top-0 left-0 h-8 w-full rounded border border-blue-300 bg-white px-2 text-sm leading-tight shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                        @keydown.enter.stop.prevent="commitEditing(t)"
                                        @keydown.esc.stop.prevent="cancelEditing"
                                        @blur="commitEditing(t)"
                                    />
                                </div>
                                <div class="mt-0.5 text-xs text-gray-500">
                                    {{ t.time || "--:--" }} · {{ categoryIcons[t.category] }}
                                </div>
                            </div>
                            <div class="flex items-center gap-2 text-xs text-gray-500">
                                <span
                                    v-if="t.isImportant"
                                    class="rounded-full border border-red-200 px-2 py-0.5 text-red-600"
                                >
                                    重
                                </span>
                                <span
                                    v-if="t.isUrgent"
                                    class="rounded-full border border-orange-200 px-2 py-0.5 text-orange-600"
                                >
                                    急
                                </span>
                                <button
                                    @click="emit('edit', t)"
                                    class="rounded-full p-1 text-blue-600 transition hover:bg-blue-50"
                                >
                                    <UIcon name="i-lucide-edit" class="h-4 w-4" />
                                </button>
                                <button
                                    @click="emit('delete', t.id)"
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
    </div>
</template>
