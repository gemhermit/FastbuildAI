<script setup lang="ts">
import { computed } from "vue";

import type { ScheduleItem } from "../types";
import { formatDateLocal } from "../utils";

type CalendarMode = "day" | "week" | "month";

const props = defineProps<{
    currentDate: Date;
    selectedDate: Date;
    scheduleItems: ScheduleItem[];
    mode: CalendarMode;
    loading?: boolean;
}>();

const emit = defineEmits<{
    (e: "update:selectedDate", value: Date): void;
    (e: "update:currentDate", value: Date): void;
    (e: "change-mode", value: CalendarMode): void;
    (e: "create", value: Date): void;
    (e: "edit", value: ScheduleItem): void;
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
        const start = weekDays.value[0];
        const end = weekDays.value[weekDays.value.length - 1];
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

        <div
            v-if="loading"
            class="mb-3 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700"
        >
            正在同步日程...
        </div>

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
                        date.getMonth() === currentDate.getMonth() ? 'text-gray-900' : 'text-gray-400',
                        isToday(date) ? 'border-blue-200 bg-blue-50' : '',
                        date.toDateString() === selectedDate.toDateString() ? 'ring-2 ring-blue-500' : '',
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
                        class="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white opacity-0 shadow-lg transition group-hover:opacity-100"
                    >
                        <UIcon name="i-lucide-plus" class="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>

        <div v-else-if="mode === 'week'" class="space-y-3">
            <div class="grid grid-cols-7 gap-3">
                <div
                    v-for="(date, idx) in weekDays"
                    :key="idx"
                    class="flex flex-col rounded-xl border border-gray-100 bg-gray-50 p-3"
                >
                    <div class="mb-2 flex items-center justify-between">
                        <div>
                            <div class="text-xs text-gray-500">{{ weekdays[idx] }}</div>
                            <div class="text-sm font-semibold text-gray-900">
                                {{ date.getMonth() + 1 }}/{{ date.getDate() }}
                            </div>
                        </div>
                        <button
                            @click="emit('create', date)"
                            class="rounded-full bg-white p-1 text-gray-500 shadow hover:text-blue-600"
                        >
                            <UIcon name="i-lucide-plus" class="h-4 w-4" />
                        </button>
                    </div>
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
                            class="rounded-lg border border-gray-200 bg-white p-2 text-xs shadow-sm"
                        >
                            <div class="flex items-center justify-between">
                                <div class="font-semibold text-gray-800">{{ item.title }}</div>
                                <button
                                    class="text-blue-600 hover:text-blue-800"
                                    @click="emit('edit', item)"
                                >
                                    <UIcon name="i-lucide-edit" class="h-4 w-4" />
                                </button>
                            </div>
                            <div class="mt-1 text-[11px] text-gray-500">
                                {{ item.time }}
                            </div>
                            <div class="text-[11px] text-gray-400">{{ item.description }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-else class="space-y-4">
            <div class="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div class="text-sm font-semibold text-gray-900">
                    {{ selectedDate.toLocaleDateString("zh-CN", { month: "long", day: "numeric" }) }}
                </div>
                <button
                    @click="emit('create', selectedDate)"
                    class="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-blue-700"
                >
                    添加日程
                </button>
            </div>
            <div class="space-y-3">
                <div
                    v-if="daySchedules.length === 0"
                    class="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400"
                >
                    还没有日程，点击右上角添加吧
                </div>
                <div
                    v-else
                    v-for="item in daySchedules"
                    :key="item.id"
                    class="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                    <div class="flex flex-col items-center text-xs text-gray-500">
                        <span class="rounded-full bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
                            {{ item.time }}
                        </span>
                        <span
                            v-if="item.endTime"
                            class="mt-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600"
                        >
                            {{ item.endTime }}
                        </span>
                    </div>
                    <div class="min-w-0 flex-1">
                        <div class="flex items-center justify-between">
                            <div class="text-sm font-semibold text-gray-900">{{ item.title }}</div>
                            <button
                                class="rounded-full p-1 text-blue-600 hover:bg-blue-50"
                                @click="emit('edit', item)"
                            >
                                <UIcon name="i-lucide-edit" class="h-4 w-4" />
                            </button>
                        </div>
                        <div class="text-xs text-gray-500">{{ item.description }}</div>
                        <div class="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-500">
                            <span
                                v-if="item.isImportant"
                                class="rounded-full bg-red-50 px-2 py-0.5 text-red-600"
                            >
                                重要
                            </span>
                            <span
                                v-if="item.isUrgent"
                                class="rounded-full bg-orange-50 px-2 py-0.5 text-orange-600"
                            >
                                紧急
                            </span>
                            <span class="rounded-full bg-gray-100 px-2 py-0.5">
                                {{ item.category }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
