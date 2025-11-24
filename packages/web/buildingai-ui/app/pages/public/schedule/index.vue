<script setup lang="ts">
import { apiGetDefaultAiModel } from "@buildingai/service/webapi/ai-conversation";
import {
    apiCreateUserSchedule,
    apiDeleteUserSchedule,
    apiListUserSchedules,
    apiUpdateUserSchedule,
    type ScheduleProposal,
    type UserScheduleEvent,
} from "@buildingai/service/webapi/user-schedule";
import { computed, onMounted, ref, watch } from "vue";

import QuadrantCard from "./components/quadrant-card.vue";
import ScheduleModal from "./components/schedule-modal.vue";
import { categoryIcons } from "./constants";
import type { ScheduleItem } from "./types";
import {
    formatDateLocal,
    formatDisplayDateFromString,
    getLocalDate,
    parseLocalDate,
} from "./utils";

definePageMeta({
    layout: "default",
    title: "menu.schedule",
    auth: false,
    inSystem: true,
    inLinkSelector: true,
});

const currentDate = ref(new Date());
const selectedDate = ref(new Date());
const scheduleItems = ref<ScheduleItem[]>([]);
const showAddModal = ref(false);
const showAIChat = ref(false);
const editingItem = ref<ScheduleItem | null>(null);
const dailyGoals = ref<Record<string, string>>({});
const loadingTasks = ref(false);
const fetchError = ref<string | null>(null);
const isSavingSchedule = ref(false);
const deletingScheduleId = ref<string | null>(null);

const todoSortBy = ref<"time" | "importance">("time");
const todoFilterCategory = ref<"all" | "work" | "personal" | "meeting" | "reminder">("all");
const showCompletedInList = ref(false);
const defaultModelId = ref<string>("");
const browserTimezone = ref(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");

const isMounted = ref(false);
onMounted(async () => {
    isMounted.value = true;
    try {
        const defaultModel = await apiGetDefaultAiModel();
        if (defaultModel?.id) {
            defaultModelId.value = defaultModel.id;
        }
    } catch (e) {
        console.error("Failed to load default model", e);
    }
});

const mockScheduleData: ScheduleItem[] = [
    {
        id: "1",
        title: "团队会议",
        description: "讨论Q4项目进展",
        date: getLocalDate(0, 0),
        time: "09:00",
        priority: "high",
        category: "meeting",
        completed: false,
        isImportant: true,
        isUrgent: true,
        meetingAgenda: "项目进展、阻塞点、下周计划",
        attendees: "产品、研发、测试",
    },
    {
        id: "2",
        title: "AI项目评审",
        description: "评估新AI功能的技术方案",
        date: getLocalDate(0, 0),
        time: "14:30",
        priority: "high",
        category: "work",
        completed: false,
        isImportant: true,
        isUrgent: false,
    },
    {
        id: "3",
        title: "健身训练",
        description: "跑步30分钟 + 力量训练",
        date: getLocalDate(0, 1),
        time: "07:00",
        priority: "medium",
        category: "personal",
        completed: true,
        isImportant: false,
        isUrgent: false,
    },
    {
        id: "4",
        title: "客户电话",
        description: "与张总讨论合作细节",
        date: getLocalDate(0, 1),
        time: "10:00",
        priority: "high",
        category: "work",
        completed: false,
        isImportant: true,
        isUrgent: true,
    },
    {
        id: "5",
        title: "药物提醒",
        description: "记得服用维生素",
        date: getLocalDate(0, 2),
        time: "08:00",
        priority: "low",
        category: "reminder",
        completed: false,
        isImportant: false,
        isUrgent: false,
    },
];

const DEFAULT_EVENT_DURATION = 60 * 60 * 1000;
const DRAFT_ID_PREFIX = "__draft__";

const combineLocalDateTime = (dateStr: string, timeStr: string) => {
    const normalizedTime = timeStr && timeStr.length >= 4 ? timeStr : "00:00";
    const date = new Date(`${dateStr}T${normalizedTime}`);
    if (Number.isNaN(date.getTime())) {
        throw new Error("Invalid date or time");
    }
    return date;
};

const buildScheduleRequest = (
    item: Omit<ScheduleItem, "id">,
    existing?: ScheduleItem | null,
) => {
    const start = combineLocalDateTime(item.date, item.time);

    let end: Date | undefined;
    if (item.endTime) {
        const parsedEnd = new Date(`${item.date}T${item.endTime}`);
        if (!Number.isNaN(parsedEnd.getTime())) {
            end = parsedEnd;
        }
    }
    if (!end && existing?.endDateTime) {
        const parsedEnd = new Date(existing.endDateTime);
        if (!Number.isNaN(parsedEnd.getTime())) {
            end = parsedEnd;
        }
    }
    if (!end) {
        end = new Date(start.getTime() + DEFAULT_EVENT_DURATION);
    }

    const combinedDescription = [item.description, item.meetingAgenda]
        .map((text) => text?.trim())
        .filter(Boolean)
        .join("\n");

    const attendees = item.attendees?.trim();

    return {
        title: item.title,
        description: combinedDescription || undefined,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        attendees: attendees || undefined,
        category: item.category,
        priority: item.priority,
        isImportant: item.isImportant,
        isUrgent: item.isUrgent,
        timezone: existing?.timezone || browserTimezone.value,
    };
};

const convertProposalToScheduleItem = (proposal: ScheduleProposal): ScheduleItem => {
    const data = proposal.data;
    const startDate = data.startTime ? new Date(data.startTime) : new Date();
    const endDate = data.endTime ? new Date(data.endTime) : undefined;
    const date = formatDateLocal(startDate);
    const draftId =
        globalThis.crypto?.randomUUID?.() !== undefined
            ? globalThis.crypto.randomUUID()
            : `${Date.now()}`;
    return {
        id: `${DRAFT_ID_PREFIX}${draftId}`,
        title: data.title || proposal.summary,
        description: data.description || proposal.summary,
        date,
        time: formatTimeFromIso(data.startTime) || "09:00",
        endTime: formatTimeFromIso(data.endTime),
        startDateTime: data.startTime,
        endDateTime: data.endTime,
        priority: data.priority || "medium",
        category: data.category || "work",
        completed: false,
        isImportant: data.isImportant,
        isUrgent: data.isUrgent,
        meetingAgenda: data.description,
        attendees: data.attendees,
        timezone: data.timezone || browserTimezone.value,
    };
};

const loadTasksFromApi = async (range: { start: Date; end: Date }) => {
    loadingTasks.value = true;
    fetchError.value = null;
    try {
        const { items } = await apiListUserSchedules({
            start: range.start.toISOString(),
            end: range.end.toISOString(),
        });
        const tasks = items.map((event) => mapEventToScheduleItem(event));
        const map = new Map<string, ScheduleItem>();
        const startMillis = range.start.getTime();
        const endMillis = range.end.getTime();

        scheduleItems.value.forEach((existing) => {
            const date = parseLocalDate(existing.date);
            const time = date.getTime();
            if (time < startMillis || time > endMillis) {
                map.set(existing.id, existing);
            }
        });

        tasks.forEach((t) => map.set(t.id, t));
        scheduleItems.value = Array.from(map.values());
    } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.warn("Task API load failed, using mock data. Error:", error);
        fetchError.value = error.message || "Failed to fetch tasks";
        const map = new Map<string, ScheduleItem>();
        mockScheduleData.forEach((t) => map.set(t.id, t));
        const startMillis = range.start.getTime();
        const endMillis = range.end.getTime();
        scheduleItems.value.forEach((existing) => {
            const date = parseLocalDate(existing.date);
            const time = date.getTime();
            if (time < startMillis || time > endMillis) {
                map.set(existing.id, existing);
            }
        });
        scheduleItems.value = Array.from(map.values());
    } finally {
        loadingTasks.value = false;
    }
};

const getCalendarDays = () => {
    const year = currentDate.value.getFullYear();
    const month = currentDate.value.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        days.push(date);
    }
    return days;
};

const getScheduleForDate = (date: Date) => {
    const dateStr = formatDateLocal(date);
    return scheduleItems.value.filter((item) => item.date === dateStr);
};

const handleSaveSchedule = async (item: Omit<ScheduleItem, "id">) => {
    if (isSavingSchedule.value) return;
    isSavingSchedule.value = true;
    try {
        const payload = buildScheduleRequest(item, editingItem.value);
        const isDraftEdit = editingItem.value?.id.startsWith(DRAFT_ID_PREFIX) ?? false;
        let saved: UserScheduleEvent;
        if (editingItem.value && !isDraftEdit) {
            saved = await apiUpdateUserSchedule(editingItem.value.id, payload);
        } else {
            saved = await apiCreateUserSchedule(payload);
        }
        upsertScheduleItem(mapEventToScheduleItem(saved));
        showAddModal.value = false;
        editingItem.value = null;
    } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("Failed to save schedule", error);
        fetchError.value = error.message || "保存日程失败";
    } finally {
        isSavingSchedule.value = false;
    }
};

const handleDeleteSchedule = async (id: string) => {
    deletingScheduleId.value = id;
    try {
        await apiDeleteUserSchedule(id);
        scheduleItems.value = scheduleItems.value.filter((item) => item.id !== id);
        if (editingItem.value && editingItem.value.id === id) {
            editingItem.value = null;
            showAddModal.value = false;
        }
    } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("Failed to delete schedule", error);
        fetchError.value = error.message || "删除日程失败";
    } finally {
        if (deletingScheduleId.value === id) {
            deletingScheduleId.value = null;
        }
    }
};

const handleProposalEdit = (proposal: ScheduleProposal) => {
    const draft = convertProposalToScheduleItem(proposal);
    editingItem.value = draft;
    showAddModal.value = true;
    showAIChat.value = false;
};

const toggleComplete = (id: string) => {
    const item = scheduleItems.value.find((i) => i.id === id);
    if (item) item.completed = !item.completed;
};

const toggleImportant = (id: string) => {
    const item = scheduleItems.value.find((i) => i.id === id);
    if (item) item.isImportant = !item.isImportant;
};

const toggleUrgent = (id: string) => {
    const item = scheduleItems.value.find((i) => i.id === id);
    if (item) item.isUrgent = !item.isUrgent;
};

const formatTimeFromIso = (value?: string) => {
    if (!value) return "00:00";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value.slice(11, 16) || value;
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const mapEventToScheduleItem = (event: UserScheduleEvent): ScheduleItem => {
    const start = new Date(event.startTime);
    return {
        id: event.id,
        title: event.title,
        description: event.description ?? "",
        date: formatDateLocal(start),
        time: formatTimeFromIso(event.startTime),
        endTime: formatTimeFromIso(event.endTime),
        startDateTime: event.startTime,
        endDateTime: event.endTime,
        priority: event.priority,
        category: event.category,
        completed: false,
        isImportant: event.isImportant,
        isUrgent: event.isUrgent,
        meetingAgenda: event.description,
        attendees: event.attendees,
        timezone: event.timezone,
    };
};

const upsertScheduleItem = (item: ScheduleItem) => {
    const index = scheduleItems.value.findIndex((existing) => existing.id === item.id);
    if (index === -1) {
        scheduleItems.value.push(item);
    } else {
        scheduleItems.value[index] = item;
    }
};

const quadrants = computed(() => {
    const selectedKey = formatDateLocal(selectedDate.value);
    const todays = scheduleItems.value.filter((i) => i.date === selectedKey);
    return {
        IU: todays.filter((i) => (i.isImportant ?? i.priority === "high") && (i.isUrgent ?? false)),
        IN: todays.filter((i) => (i.isImportant ?? i.priority !== "low") && !(i.isUrgent ?? false)),
        NU: todays.filter((i) => !(i.isImportant ?? false) && (i.isUrgent ?? false)),
        NN: todays.filter((i) => !(i.isImportant ?? false) && !(i.isUrgent ?? false)),
    };
});

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
    const todayStr = formatDateLocal(new Date());
    const base = scheduleItems.value.filter((t) => {
        if (todoFilterCategory.value !== "all" && t.category !== todoFilterCategory.value)
            return false;
        if (!showCompletedInList.value && t.completed) return false;
        return true;
    });

    const todayList = base.filter((t) => t.date === todayStr);

    const within3List = base.filter((t) => {
        const d = parseLocalDate(t.date);
        const diff = Math.round(
            (d.getTime() - parseLocalDate(todayStr).getTime()) / (24 * 3600 * 1000),
        );
        return diff >= 1 && diff <= 3;
    });

    const within7List = base.filter((t) => {
        const d = parseLocalDate(t.date);
        const diff = Math.round(
            (d.getTime() - parseLocalDate(todayStr).getTime()) / (24 * 3600 * 1000),
        );
        return diff >= 4 && diff <= 7;
    });

    return {
        today: sortList(todayList),
        within3: sortList(within3List),
        within7: sortList(within7List),
    };
});

const getPanelItems = (key: string) => {
    return todoPanels.value[key as keyof typeof todoPanels.value];
};

const calendarDays = computed(() => getCalendarDays());

const calendarRange = computed(() => {
    const days = calendarDays.value;
    if (!days.length) return null;
    const firstDay = days[0];
    const lastDay = days[days.length - 1];
    if (!firstDay || !lastDay) return null;
    const start = new Date(firstDay);
    start.setHours(0, 0, 0, 0);
    const end = new Date(lastDay);
    end.setHours(23, 59, 59, 999);
    return { start, end };
});

watch(
    calendarRange,
    (range) => {
        if (range) {
            loadTasksFromApi(range);
        }
    },
    { immediate: true },
);

const handlePrevMonth = () => {
    currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1);
};

const handleNextMonth = () => {
    currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1);
};

const handleToday = () => {
    const today = new Date();
    currentDate.value = today;
    selectedDate.value = today;
};

const handleEdit = (item: ScheduleItem) => {
    editingItem.value = item;
    showAddModal.value = true;
};

const handleAiEventCreated = (event: UserScheduleEvent) => {
    upsertScheduleItem(mapEventToScheduleItem(event));
};

const handleAiEventUpdated = (event: UserScheduleEvent) => {
    upsertScheduleItem(mapEventToScheduleItem(event));
};

const handleAiEventDeleted = (id: string) => {
    scheduleItems.value = scheduleItems.value.filter((item) => item.id !== id);
};

const handleAiQueryResult = (events: UserScheduleEvent[]) => {
    events.forEach((event) => upsertScheduleItem(mapEventToScheduleItem(event)));
};
</script>

<template>
    <div class="min-h-screen bg-gray-50 py-8">
        <div class="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <div class="mb-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-500 p-6 text-white shadow-2xl">
                <div class="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p class="text-sm text-white/80">当前日期</p>
                        <p class="text-3xl font-semibold">
                            {{ selectedDate.getMonth() + 1 }}月{{ selectedDate.getDate() }}日
                        </p>
                        <p class="text-sm text-white/70">
                            时区：{{ browserTimezone }}
                        </p>
                    </div>
                    <div class="flex flex-wrap gap-3">
                        <button
                            @click="showAIChat = true"
                            type="button"
                            class="rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/30"
                        >
                            打开 AI 助手
                        </button>
                        <button
                            type="button"
                            @click="
                                editingItem = null;
                                showAddModal = true;
                            "
                            class="rounded-full bg-white px-5 py-2 text-sm font-semibold text-blue-600 shadow-md transition hover:bg-blue-50"
                        >
                            新建日程
                        </button>
                    </div>
                </div>
                <div class="mt-6 grid gap-4 md:grid-cols-3">
                    <div class="rounded-xl bg-white/10 p-4">
                        <p class="text-sm uppercase tracking-wide text-white/80">今日任务</p>
                        <p class="text-2xl font-semibold">
                            {{ todoPanels.today.length }}
                        </p>
                    </div>
                    <div class="rounded-xl bg-white/10 p-4">
                        <p class="text-sm uppercase tracking-wide text-white/80">重要事项</p>
                        <p class="text-2xl font-semibold">
                            {{ quadrants.IU.length + quadrants.IN.length }}
                        </p>
                    </div>
                    <div class="rounded-xl bg-white/10 p-4">
                        <p class="text-sm uppercase tracking-wide text-white/80">已安排日程</p>
                        <p class="text-2xl font-semibold">
                            {{ scheduleItems.length }}
                        </p>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div class="space-y-6 lg:col-span-2">
                    <div class="rounded-2xl bg-white p-6 shadow-lg">
                        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p class="text-sm text-gray-500">
                                    {{ currentDate.getFullYear() }} 年
                                </p>
                                <h2 class="text-2xl font-semibold text-gray-900">
                                    {{ currentDate.getMonth() + 1 }} 月
                                </h2>
                            </div>
                            <div class="flex items-center gap-2">
                                <button
                                    @click="handlePrevMonth"
                                    class="rounded-full border border-white/40 bg-white/80 px-3 py-1 text-gray-700 transition hover:bg-white"
                                >
                                    上一月
                                </button>
                                <button
                                    @click="handleToday"
                                    class="rounded-full bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-blue-700"
                                >
                                    今天
                                </button>
                                <button
                                    @click="handleNextMonth"
                                    class="rounded-full border border-white/40 bg-white/80 px-3 py-1 text-gray-700 transition hover:bg-white"
                                >
                                    下一月
                                </button>
                            </div>
                        </div>

                        <div class="mb-4 grid grid-cols-7 gap-2 text-center text-xs font-semibold text-gray-500">
                            <div v-for="day in ['日', '一', '二', '三', '四', '五', '六']" :key="day">
                                {{ day }}
                            </div>
                        </div>

                        <div class="grid grid-cols-7 gap-2">
                            <div
                                v-for="(date, index) in calendarDays"
                                :key="index"
                                @click="selectedDate = date"
                                class="group relative h-24 cursor-pointer rounded-xl border border-transparent bg-gray-50 p-3 text-left transition hover:border-blue-100 hover:bg-white"
                                :class="[
                                    date.getMonth() === currentDate.getMonth()
                                        ? 'text-gray-900'
                                        : 'text-gray-400',
                                    date.toDateString() === new Date().toDateString()
                                        ? 'border-blue-200 bg-blue-50'
                                        : '',
                                    date.toDateString() === selectedDate.toDateString()
                                        ? 'ring-2 ring-blue-500'
                                        : '',
                                ]"
                            >
                                <div class="flex items-center justify-between">
                                    <span class="text-sm font-semibold">{{ date.getDate() }}</span>
                                    <span
                                        v-if="getScheduleForDate(date).length > 2"
                                        class="rounded-full bg-blue-100 px-2 text-[11px] font-semibold text-blue-700"
                                    >
                                        +{{ getScheduleForDate(date).length - 2 }}
                                    </span>
                                </div>
                                <div class="mt-2 space-y-1">
                                    <div
                                        v-for="schedule in getScheduleForDate(date).slice(0, 2)"
                                        :key="schedule.id"
                                        class="w-full truncate rounded-md px-2 py-0.5 text-[11px]"
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
                                    @click.stop="
                                        editingItem = null;
                                        showAddModal = true;
                                    "
                                    title="添加日程"
                                    class="absolute -bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white opacity-0 shadow transition group-hover:opacity-100"
                                >
                                    <UIcon name="i-lucide-plus" class="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="rounded-2xl bg-white p-5 shadow-lg">
                        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p class="text-sm text-gray-500">今日概览</p>
                                <h4 class="text-lg font-semibold text-gray-900">日程面板</h4>
                            </div>
                            <div class="flex flex-wrap items-center gap-3">
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
                                <label class="flex items-center space-x-2 text-sm text-gray-600">
                                    <input type="checkbox" class="rounded" v-model="showCompletedInList" />
                                    <span>显示已完成</span>
                                </label>
                            </div>
                        </div>

                        <div class="flex flex-col space-y-4">
                            <div
                                v-for="panel in [
                                    { key: 'today', title: '今日' },
                                    { key: 'within3', title: '3 天内' },
                                    { key: 'within7', title: '7 天内' },
                                ]"
                                :key="panel.key"
                                class="rounded-2xl border border-gray-100 bg-gray-50 p-4"
                            >
                                <div class="mb-2 flex items-center justify-between">
                                    <div class="text-sm font-medium text-gray-900">
                                        {{ panel.title }} ({{ getPanelItems(panel.key).length }})
                                    </div>
                                </div>
                                <div class="space-y-2">
                                    <div
                                        v-if="getPanelItems(panel.key).length === 0"
                                        class="rounded-lg border border-dashed border-gray-200 px-3 py-6 text-center text-xs text-gray-400"
                                    >
                                        暂无任务
                                    </div>
                                    <div
                                        v-else
                                        v-for="t in getPanelItems(panel.key)"
                                        :key="t.id"
                                        class="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-3 shadow-sm"
                                    >
                                        <div class="flex min-w-0 items-center gap-3">
                                            <div
                                                class="flex min-w-[56px] flex-col items-start text-left"
                                            >
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
                                                        t.completed
                                                            ? 'text-gray-400 line-through'
                                                            : 'text-gray-900'
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
                                                @click="toggleComplete(t.id)"
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
                                                @click="toggleImportant(t.id)"
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
                                                @click="toggleUrgent(t.id)"
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
                                                @click="handleEdit(t)"
                                                title="编辑"
                                                class="rounded-full p-1 text-blue-600 transition hover:bg-blue-50"
                                            >
                                                <UIcon name="i-lucide-edit" class="h-4 w-4" />
                                            </button>
                                            <button
                                                @click="handleDeleteSchedule(t.id)"
                                                title="删除"
                                                class="rounded-full p-1 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                :disabled="deletingScheduleId === t.id"
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

                <div class="space-y-6">
                    <div class="rounded-2xl bg-white p-5 shadow-lg">
                        <div class="mb-4 flex items-center justify-between">
                            <h3 class="text-lg font-semibold text-gray-900">
                                {{ selectedDate.getMonth() + 1 }}月{{ selectedDate.getDate() }}日
                            </h3>
                            <div class="flex items-center gap-2">
                                <input
                                    type="text"
                                    v-model="dailyGoals[formatDateLocal(selectedDate)]"
                                    placeholder="当日目标..."
                                    class="w-56 rounded-full border border-gray-200 px-3 py-1.5 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <QuadrantCard
                                :title="
                                    isMounted ? `重要且紧急 (${quadrants.IU.length})` : '重要且紧急'
                                "
                                :items="quadrants.IU"
                                :deleting-id="deletingScheduleId"
                                @toggleComplete="toggleComplete"
                                @toggleImportant="toggleImportant"
                                @toggleUrgent="toggleUrgent"
                                @edit="handleEdit"
                                @delete="handleDeleteSchedule"
                            />
                            <QuadrantCard
                                :title="
                                    isMounted ? `重要不紧急 (${quadrants.IN.length})` : '重要不紧急'
                                "
                                :items="quadrants.IN"
                                :deleting-id="deletingScheduleId"
                                @toggleComplete="toggleComplete"
                                @toggleImportant="toggleImportant"
                                @toggleUrgent="toggleUrgent"
                                @edit="handleEdit"
                                @delete="handleDeleteSchedule"
                            />
                            <QuadrantCard
                                :title="
                                    isMounted
                                        ? `不重要但紧急 (${quadrants.NU.length})`
                                        : '不重要但紧急'
                                "
                                :items="quadrants.NU"
                                :deleting-id="deletingScheduleId"
                                @toggleComplete="toggleComplete"
                                @toggleImportant="toggleImportant"
                                @toggleUrgent="toggleUrgent"
                                @edit="handleEdit"
                                @delete="handleDeleteSchedule"
                            />
                            <QuadrantCard
                                :title="
                                    isMounted
                                        ? `不重要不紧急 (${quadrants.NN.length})`
                                        : '不重要不紧急'
                                "
                                :items="quadrants.NN"
                                :deleting-id="deletingScheduleId"
                                @toggleComplete="toggleComplete"
                                @toggleImportant="toggleImportant"
                                @toggleUrgent="toggleUrgent"
                                @edit="handleEdit"
                                @delete="handleDeleteSchedule"
                            />
                        </div>
                    </div>

                    <div class="rounded-2xl bg-white p-5 shadow-lg">
                        <div class="mb-4 flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <UIcon name="i-lucide-bot" class="text-blue-600" />
                                <h3 class="text-lg font-semibold text-gray-900">AI 智能建议</h3>
                            </div>
                            <UButton
                                size="xs"
                                color="primary"
                                variant="soft"
                                @click="showAIChat = true"
                            >
                                AI 助手
                            </UButton>
                        </div>
                        <div class="space-y-3">
                            <div class="rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
                                <div class="flex items-start">
                                    <UIcon
                                        name="i-lucide-alert-circle"
                                        class="mt-0.5 mr-2 h-4 w-4 text-orange-500"
                                    />
                                    <div>
                                        <p class="text-sm font-medium text-gray-900">
                                            时间冲突提醒
                                        </p>
                                        <p class="text-xs text-gray-600">
                                            今天14:30的会议可能与其他安排有冲突
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div class="rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
                                <div class="flex items-start">
                                    <div
                                        class="mt-0.5 mr-2 h-4 w-4 rounded-full bg-green-500"
                                    ></div>
                                    <div>
                                        <p class="text-sm font-medium text-gray-900">效率建议</p>
                                        <p class="text-xs text-gray-600">
                                            建议将类似任务集中在上午处理
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div class="rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
                                <div class="flex items-start">
                                    <div class="mt-0.5 mr-2 h-4 w-4 rounded-full bg-blue-500"></div>
                                    <div>
                                        <p class="text-sm font-medium text-gray-900">休息提醒</p>
                                        <p class="text-xs text-gray-600">
                                            连续工作2小时，建议适当休息
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <AIChatWidget
            v-model:open="showAIChat"
            :model-id="defaultModelId || undefined"
            :timezone="browserTimezone"
            @event-created="handleAiEventCreated"
            @event-updated="handleAiEventUpdated"
            @event-deleted="handleAiEventDeleted"
            @query-result="handleAiQueryResult"
            @edit-proposal="handleProposalEdit"
        />

        <ScheduleModal
            :isOpen="showAddModal"
            :editingItem="editingItem"
            :selectedDate="selectedDate"
            :saving="isSavingSchedule"
            @close="
                showAddModal = false;
                editingItem = null;
            "
            @save="handleSaveSchedule"
        />
    </div>
</template>
