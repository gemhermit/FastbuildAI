<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";

import type { ScheduleItem } from "../types";
import ListView from "./list-view.vue";

const props = defineProps<{
    selectedDate: Date;
    scheduleItems: ScheduleItem[];
    deletingId: string | null;
    dailyGoal: string;
}>();

const emit = defineEmits<{
    (e: "update:dailyGoal", value: string): void;
    (e: "toggleComplete", id: string): void;
    (e: "toggleImportant", id: string): void;
    (e: "toggleUrgent", id: string): void;
    (e: "edit", item: ScheduleItem): void;
    (e: "delete", id: string): void;
    (e: "create"): void;
    (e: "openAi"): void;
    (e: "updateTitle", payload: { id: string; title: string }): void;
}>();

const priorityIsHigh = (priority: ScheduleItem["priority"]) => priority === "high";
const priorityIsAtLeastMedium = (priority: ScheduleItem["priority"]) =>
    priority === "high" || priority === "medium";

const quadrants = computed(() => ({
    IU: props.scheduleItems.filter(
        (i) => (i.isImportant ?? priorityIsHigh(i.priority)) && (i.isUrgent ?? false),
    ),
    IN: props.scheduleItems.filter(
        (i) => (i.isImportant ?? priorityIsAtLeastMedium(i.priority)) && !(i.isUrgent ?? false),
    ),
    NU: props.scheduleItems.filter((i) => !(i.isImportant ?? false) && (i.isUrgent ?? false)),
    NN: props.scheduleItems.filter((i) => !(i.isImportant ?? false) && !(i.isUrgent ?? false)),
}));

const sortMode = ref<"time" | "importance">("time");
const QUADRANT_PREF_KEY = "schedule:quadrant-sort";

const restoreQuadrantPrefs = () => {
    if (typeof window === "undefined") return;
    try {
        const raw = window.localStorage.getItem(QUADRANT_PREF_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<{ sortMode: "time" | "importance" }>;
        if (parsed.sortMode) sortMode.value = parsed.sortMode;
    } catch (err) {
        console.warn("Failed to restore quadrant prefs", err);
    }
};

const persistQuadrantPrefs = () => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(QUADRANT_PREF_KEY, JSON.stringify({ sortMode: sortMode.value }));
};

onMounted(() => {
    restoreQuadrantPrefs();
});

watch(sortMode, persistQuadrantPrefs);

const timeValue = (item: ScheduleItem) => {
    const [h = "00", m = "00"] = (item.time || "00:00").split(":");
    return Number(h) * 60 + Number(m);
};

const importanceValue = (item: ScheduleItem) => {
    if (item.isImportant) return 3;
    if (item.priority === "high") return 2;
    if (item.priority === "medium") return 1;
    return 0;
};

const sortItems = (items: ScheduleItem[]) => {
    const copy = [...items];
    if (sortMode.value === "time") {
        copy.sort((a, b) => timeValue(a) - timeValue(b));
    } else {
        copy.sort((a, b) => importanceValue(b) - importanceValue(a));
    }
    return copy;
};

const getQuadrantItems = (key: keyof typeof quadrants.value) => sortItems(quadrants.value[key]);
</script>

<template>
    <div
        class="flex min-h-0 flex-col rounded-2xl border border-gray-200 bg-white p-5 text-gray-900 shadow-sm"
        style="min-height: calc(100vh - 220px)"
    >
        <div class="mb-4 flex items-center justify-between gap-3">
            <h3 class="text-lg font-semibold text-gray-900">四象限视图</h3>
            <input
                type="text"
                :value="dailyGoal"
                @input="emit('update:dailyGoal', ($event.target as HTMLInputElement).value)"
                placeholder="当日目标..."
                class="w-64 rounded-full border border-gray-200 px-3 py-1.5 text-xs placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
        </div>
        <div
            class="grid min-h-0 flex-1 auto-rows-fr grid-cols-1 divide-y divide-gray-200 md:grid-cols-2 md:divide-x md:divide-y-0"
        >
            <div
                v-for="quad in [
                    { key: 'IU', title: '重要且紧急', color: 'text-red-600' },
                    { key: 'IN', title: '重要不紧急', color: 'text-amber-600' },
                    { key: 'NU', title: '不重要但紧急', color: 'text-emerald-600' },
                    { key: 'NN', title: '不重要不紧急', color: 'text-gray-800' },
                ]"
                :key="quad.key"
                class="flex h-full min-h-0 flex-col border border-gray-200 bg-white p-4 text-sm"
            >
                <div class="mb-3 flex items-center justify-between">
                    <div :class="['font-semibold', quad.color]">
                        {{ quad.title }} ({{
                            quadrants[quad.key as keyof typeof quadrants].length
                        }})
                    </div>
                    <div class="flex items-center gap-2">
                        <button
                            @click="emit('create')"
                            class="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100"
                            title="新建日程"
                        >
                            <UIcon name="i-lucide-plus" class="h-4 w-4" />
                        </button>
                        <div class="group relative">
                            <button
                                class="rounded-full border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
                                title="排序"
                            >
                                ...
                            </button>
                            <div
                                class="invisible absolute top-full right-0 z-10 mt-1 w-28 rounded-lg border border-gray-200 bg-white p-2 text-[12px] text-gray-800 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100"
                            >
                                <label class="flex cursor-pointer items-center gap-2">
                                    <input
                                        type="radio"
                                        value="time"
                                        v-model="sortMode"
                                        class="h-3 w-3"
                                    />
                                    按时间
                                </label>
                                <label class="mt-1 flex cursor-pointer items-center gap-2">
                                    <input
                                        type="radio"
                                        value="importance"
                                        v-model="sortMode"
                                        class="h-3 w-3"
                                    />
                                    按重要程度
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="flex-1 overflow-auto pr-1 text-gray-900">
                    <ListView
                        variant="compact"
                        :selected-date="selectedDate"
                        :schedule-items="getQuadrantItems(quad.key as keyof typeof quadrants)"
                        :deleting-id="deletingId"
                        :sort-by="sortMode"
                        :show-completed="true"
                        @toggleComplete="emit('toggleComplete', $event)"
                        @toggleImportant="emit('toggleImportant', $event)"
                        @toggleUrgent="emit('toggleUrgent', $event)"
                        @updateTitle="emit('updateTitle', $event)"
                        @edit="emit('edit', $event)"
                        @delete="emit('delete', $event)"
                        @create="emit('create')"
                        @openAi="emit('openAi')"
                    />
                </div>
            </div>
        </div>
    </div>
</template>
