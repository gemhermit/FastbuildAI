<script setup lang="ts">
import { computed } from "vue";

import type { ScheduleItem } from "../types";
import { formatDateLocal } from "../utils";
import ListView from "./list-view.vue";

type CalendarMode = "day" | "week" | "month";

const props = defineProps<{
    currentDate: Date;
    selectedDate: Date;
    scheduleItems: ScheduleItem[];
    mode: CalendarMode;
    loading?: boolean;
    deletingId?: string | null;
}>();

const emit = defineEmits<{
    (e: "update:selectedDate", value: Date): void;
    (e: "update:currentDate", value: Date): void;
    (e: "change-mode", value: CalendarMode): void;
    (e: "create", value: Date): void;
    (e: "edit", value: ScheduleItem): void;
    (e: "open-ai"): void;
    (e: "toggle-complete", id: string): void;
    (e: "toggle-important", id: string): void;
    (e: "toggle-urgent", id: string): void;
    (e: "delete", id: string): void;
    (e: "update-title", payload: { id: string; title: string }): void;
}>();

const weekdays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

const monthDays = computed(() => buildMonthDays(props.currentDate));
const weekDays = computed(() => buildWeekDays(props.selectedDate));

const sortByTime = (list: ScheduleItem[]) => {
    return [...list].sort((a, b) => (a.time || "00:00").localeCompare(b.time || "00:00"));
};

const daySchedules = computed(() => sortByTime(getScheduleForDate(props.selectedDate)));

const headerTitle = computed(() => {
    if (props.mode === "day") {
        return props.selectedDate.toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "long",
        });
    }
    if (props.mode === "week") {
        const days = weekDays.value;
        const start = days[0];
        const end = days[days.length - 1];
        if (!start || !end) return "";
        return `${start.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })} - ${end.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}`;
    }
    return `${props.currentDate.getFullYear()} 年 ${props.currentDate.getMonth() + 1} 月`;
});

const modeItems: { key: CalendarMode; label: string }[] = [
    { key: "day", label: "日" },
    { key: "week", label: "周" },
    { key: "month", label: "月" },
];

const getWeekStart = (date: Date) => {
    const copy = new Date(date);
    const day = copy.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Monday as the first day
    copy.setDate(copy.getDate() + diff);
    copy.setHours(0, 0, 0, 0);
    return copy;
};

const buildMonthDays = (base: Date) => {
    const year = base.getFullYear();
    const month = base.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    const offset = (firstDay.getDay() + 6) % 7;
    startDate.setDate(startDate.getDate() - offset);

    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        days.push(date);
    }
    return days;
};

const buildWeekDays = (anchor: Date) => {
    const start = getWeekStart(anchor);
    return Array.from({ length: 7 }, (_, idx) => {
        const day = new Date(start);
        day.setDate(start.getDate() + idx);
        return day;
    });
};

const getScheduleForDate = (date: Date) => {
    const dateStr = formatDateLocal(date);
    return props.scheduleItems.filter((item) => item.date === dateStr);
};

const setSelectedDate = (date: Date) => {
    emit("update:selectedDate", date);
    emit("update:currentDate", date);
};

const shiftPeriod = (direction: -1 | 1) => {
    const base = new Date(props.selectedDate);
    if (props.mode === "day") {
        base.setDate(base.getDate() + direction);
    } else if (props.mode === "week") {
        base.setDate(base.getDate() + direction * 7);
    } else {
        base.setMonth(base.getMonth() + direction);
        base.setDate(1);
    }
    setSelectedDate(base);
};

const goToday = () => {
    setSelectedDate(new Date());
};

const goPrevWeek = () => {
    const target = new Date(props.selectedDate);
    target.setDate(target.getDate() - 7);
    setSelectedDate(target);
};

const goNextWeek = () => {
    const target = new Date(props.selectedDate);
    target.setDate(target.getDate() + 7);
    setSelectedDate(target);
};

const isToday = (date: Date) => date.toDateString() === new Date().toDateString();
</script>

<template>
    <div class="rounded-2xl bg-white p-6 shadow-lg">
        <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
                <p class="text-sm text-gray-500">智能日历</p>
                <h3 class="text-xl font-semibold text-gray-900">{{ headerTitle }}</h3>
                <div class="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <button
                        @click="shiftPeriod(-1)"
                        class="rounded-full border border-gray-200 px-3 py-1 transition hover:bg-gray-50"
                    >
                        上一{{ mode === "month" ? "月" : mode === "week" ? "周" : "天" }}
                    </button>
                    <button
                        @click="goToday"
                        class="rounded-full bg-blue-600 px-3 py-1.5 text-white shadow hover:bg-blue-700"
                    >
                        今天
                    </button>
                    <button
                        @click="shiftPeriod(1)"
                        class="rounded-full border border-gray-200 px-3 py-1 transition hover:bg-gray-50"
                    >
                        下一{{ mode === "month" ? "月" : mode === "week" ? "周" : "天" }}
                    </button>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <div class="flex rounded-full bg-gray-100 p-1 text-sm">
                    <button
                        v-for="item in modeItems"
                        :key="item.key"
                        @click="emit('change-mode', item.key)"
                        class="rounded-full px-4 py-1.5 transition"
                        :class="
                            mode === item.key
                                ? 'bg-white text-gray-900 shadow'
                                : 'text-gray-600 hover:text-gray-900'
                        "
                    >
                        {{ item.label }}
                    </button>
                </div>
            </div>
        </div>

        <!-- <div
            v-if="loading"
            class="mb-3 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700"
        >
            正在同步日程...
        </div> -->

        <div v-if="mode === 'month'" class="space-y-3">
            <div class="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-gray-500">
                <div v-for="day in weekdays" :key="day">
                    {{ day }}
                </div>
            </div>
            <div class="grid grid-cols-7 gap-2">
                <div
                    v-for="(date, index) in monthDays"
                    :key="index"
                    @click="setSelectedDate(date)"
                    class="group relative h-24 cursor-pointer rounded-xl border border-transparent bg-gray-50 p-2 text-left transition hover:border-blue-100 hover:bg-white"
                    :class="[
                        date.getMonth() === currentDate.getMonth()
                            ? 'text-gray-900'
                            : 'text-gray-400',
                        isToday(date) ? 'border-blue-200 bg-blue-50' : '',
                        date.toDateString() === selectedDate.toDateString()
                            ? 'ring-2 ring-blue-500'
                            : '',
                    ]"
                >
                    <div class="flex items-center justify-between">
                        <span class="text-sm font-semibold">{{ date.getDate() }}</span>
                        <span
                            v-if="getScheduleForDate(date).length > 1"
                            class="rounded-full bg-blue-100 px-1 text-[10px] font-semibold text-blue-700"
                        >
                            +{{ getScheduleForDate(date).length - 1 }}
                        </span>
                    </div>
                    <div class="mt-1 space-y-1">
                        <div
                            v-for="schedule in getScheduleForDate(date).slice(0, 2)"
                            :key="schedule.id"
                            class="w-full truncate rounded-md px-1 py-0.5 text-[10px]"
                            :class="
                                schedule.completed
                                    ? 'bg-gray-200 text-gray-600 line-through'
                                    : 'bg-blue-100 text-blue-800'
                            "
                        >
                            {{ schedule.title }}
                        </div>
                    </div>
                    <button
                        v-if="date.toDateString() === selectedDate.toDateString()"
                        @click.stop="emit('create', date)"
                        title="添加日程"
                        class="absolute right-2 bottom-2 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white opacity-0 shadow-lg transition group-hover:opacity-100"
                    >
                        <UIcon name="i-lucide-plus" class="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>

        <div v-else-if="mode === 'week'" class="space-y-3">
            <div class="relative rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div class="grid grid-cols-7 gap-3">
                    <button
                        v-for="(date, idx) in weekDays"
                        :key="idx"
                        @click="setSelectedDate(date)"
                        class="flex flex-col items-center rounded-lg px-3 py-2 text-xs transition"
                        :class="[
                            date.toDateString() === selectedDate.toDateString()
                                ? 'bg-blue-600 text-white shadow'
                                : 'text-gray-700 hover:bg-gray-100',
                        ]"
                    >
                        <span class="text-[13px] font-semibold">{{ weekdays[idx] }}</span>
                        <span class="text-lg leading-tight font-bold">{{ date.getDate() }}</span>
                    </button>
                </div>
                <button
                    @click="goPrevWeek"
                    class="absolute top-1/2 -left-6 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 text-gray-600 shadow-sm transition hover:bg-gray-50"
                >
                    <UIcon name="i-lucide-chevron-left" class="h-5 w-5" />
                </button>
                <button
                    @click="goNextWeek"
                    class="absolute top-1/2 -right-6 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 text-gray-600 shadow-sm transition hover:bg-gray-50"
                >
                    <UIcon name="i-lucide-chevron-right" class="h-5 w-5" />
                </button>
            </div>
            <div class="grid grid-cols-7 gap-3">
                <div
                    v-for="(date, idx) in weekDays"
                    :key="idx"
                    class="flex min-h-[360px] flex-col rounded-xl border border-gray-100 bg-white/70 p-3 shadow-sm"
                >
                    <!-- <div class="mb-2 flex justify-end">
                        <button
                            @click="emit('create', date)"
                            class="rounded-full bg-blue-50 p-1 text-blue-600 transition hover:bg-blue-100"
                        >
                            <UIcon name="i-lucide-plus" class="h-4 w-4" />
                        </button>
                    </div> -->
                    <div class="flex-1 space-y-2">
                        <div
                            v-if="getScheduleForDate(date).length === 0"
                            class="rounded-lg border border-dashed border-gray-200 px-2 py-4 text-center text-xs text-gray-400"
                        >
                            暂无安排
                        </div>
                        <div
                            v-else
                            v-for="item in sortByTime(getScheduleForDate(date))"
                            :key="item.id"
                            class="rounded-lg bg-amber-200/80 px-2 py-1 text-xs text-gray-800 shadow"
                        >
                            <div class="flex items-center justify-between font-semibold">
                                <span class="truncate">{{ item.title }}</span>
                                <button
                                    class="text-blue-700 hover:text-blue-900"
                                    @click="emit('edit', item)"
                                >
                                    <UIcon name="i-lucide-edit" class="h-4 w-4" />
                                </button>
                            </div>
                            <div class="mt-1 text-[11px] text-gray-700">{{ item.time }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-else class="space-y-4">
            <div
                class="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3"
            >
                <div class="flex w-full items-center gap-3">
                    <button
                        @click="goPrevWeek"
                        class="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:bg-gray-50"
                    >
                        <UIcon name="i-lucide-chevron-left" class="h-5 w-5" />
                    </button>
                    <div class="grid flex-1 grid-cols-7 gap-3">
                        <button
                            v-for="(date, idx) in weekDays"
                            :key="idx"
                            @click="setSelectedDate(date)"
                            class="flex flex-col items-center rounded-lg px-3 py-2 text-xs transition"
                            :class="[
                                date.toDateString() === selectedDate.toDateString()
                                    ? 'bg-blue-600 text-white shadow'
                                    : 'text-gray-700 hover:bg-gray-100',
                            ]"
                        >
                            <span class="text-[13px] font-semibold">{{ weekdays[idx] }}</span>
                            <span class="text-lg leading-tight font-bold">{{
                                date.getDate()
                            }}</span>
                        </button>
                    </div>
                    <button
                        @click="goNextWeek"
                        class="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:bg-gray-50"
                    >
                        <UIcon name="i-lucide-chevron-right" class="h-5 w-5" />
                    </button>
                </div>
            </div>
            <ListView
                :selected-date="selectedDate"
                :schedule-items="daySchedules"
                :deleting-id="props.deletingId ?? null"
                @create="emit('create', selectedDate)"
                @openAi="emit('open-ai')"
                @toggleComplete="emit('toggle-complete', $event)"
                @toggleImportant="emit('toggle-important', $event)"
                @toggleUrgent="emit('toggle-urgent', $event)"
                @updateTitle="emit('update-title', $event)"
                @edit="emit('edit', $event)"
                @delete="emit('delete', $event)"
            />
        </div>
    </div>
</template>
