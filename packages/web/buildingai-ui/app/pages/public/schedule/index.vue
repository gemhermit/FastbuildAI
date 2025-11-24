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

import CalendarView from "./components/calendar-view.vue";
import ListView from "./components/list-view.vue";
import QuadrantView from "./components/quadrant-view.vue";
import ScheduleModal from "./components/schedule-modal.vue";
import type { ScheduleItem } from "./types";
import { formatDateLocal, getLocalDate, parseLocalDate } from "./utils";

definePageMeta({
    layout: "default",
    title: "menu.schedule",
    auth: false,
    inSystem: true,
    inLinkSelector: true,
});

const currentDate = ref(new Date());
const selectedDate = ref(new Date());
const activeView = ref<"list" | "calendar" | "quadrant">("calendar");
const calendarViewMode = ref<"day" | "week" | "month">("month");
const scheduleItems = ref<ScheduleItem[]>([]);
const showAddModal = ref(false);
const showAIChat = ref(false);
const editingItem = ref<ScheduleItem | null>(null);
const dailyGoals = ref<Record<string, string>>({});
const loadingTasks = ref(false);
const fetchError = ref<string | null>(null);
const isSavingSchedule = ref(false);
const deletingScheduleId = ref<string | null>(null);

const defaultModelId = ref<string>("");
const browserTimezone = ref(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
const viewTabs = [
    { key: "list", label: "清单视图" },
    { key: "calendar", label: "日历视图" },
    { key: "quadrant", label: "四象限视图" },
] as const;

const selectedDateLabel = computed(() =>
    selectedDate.value.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
    }),
);

onMounted(async () => {
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

const buildScheduleRequest = (item: Omit<ScheduleItem, "id">, existing?: ScheduleItem | null) => {
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

const getWeekStart = (date: Date) => {
    const copy = new Date(date);
    const day = copy.getDay();
    const diff = day === 0 ? -6 : 1 - day;
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

const calendarDays = computed(() => buildMonthDays(currentDate.value));

const calendarRange = computed(() => {
    if (calendarViewMode.value === "day") {
        const start = new Date(selectedDate.value);
        start.setHours(0, 0, 0, 0);
        const end = new Date(selectedDate.value);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    }

    if (calendarViewMode.value === "week") {
        const start = getWeekStart(selectedDate.value);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    }

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

const handleEdit = (item: ScheduleItem) => {
    editingItem.value = item;
    showAddModal.value = true;
};

const setSelectedDate = (date: Date) => {
    selectedDate.value = date;
    currentDate.value = new Date(date);
};

const handleCalendarCursorChange = (value: Date) => {
    currentDate.value = value;
};

const updateDailyGoal = (value: string) => {
    dailyGoals.value[formatDateLocal(selectedDate.value)] = value;
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
        <div class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p class="text-sm text-gray-500">公共日程</p>
                    <h1 class="text-2xl font-semibold text-gray-900">智能时间管理</h1>
                    <p class="mt-1 text-xs text-gray-500">当前选择：{{ selectedDateLabel }}</p>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    <button
                        @click="showAIChat = true"
                        class="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
                    >
                        AI 助手
                    </button>
                    <button
                        @click="
                            editingItem = null;
                            showAddModal = true;
                        "
                        class="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700"
                    >
                        新建日程
                    </button>
                    <div class="flex rounded-full bg-white p-1 text-sm shadow-sm ring-1 ring-gray-200">
                        <button
                            v-for="tab in viewTabs"
                            :key="tab.key"
                            @click="activeView = tab.key"
                            class="rounded-full px-4 py-1.5 transition"
                            :class="
                                activeView === tab.key
                                    ? 'bg-blue-600 text-white shadow'
                                    : 'text-gray-600 hover:text-blue-700'
                            "
                        >
                            {{ tab.label }}
                        </button>
                    </div>
                </div>
            </div>

            <div
                v-if="fetchError"
                class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
                加载日程失败：{{ fetchError }}
            </div>

            <ListView
                v-if="activeView === 'list'"
                :selected-date="selectedDate"
                :schedule-items="scheduleItems"
                :deleting-id="deletingScheduleId"
                @toggleComplete="toggleComplete"
                @toggleImportant="toggleImportant"
                @toggleUrgent="toggleUrgent"
                @edit="handleEdit"
                @delete="handleDeleteSchedule"
                @create="
                    editingItem = null;
                    showAddModal = true;
                "
                @openAi="showAIChat = true"
            />

            <CalendarView
                v-else-if="activeView === 'calendar'"
                :current-date="currentDate"
                :selected-date="selectedDate"
                :schedule-items="scheduleItems"
                :mode="calendarViewMode"
                :loading="loadingTasks"
                @update:selectedDate="setSelectedDate"
                @update:currentDate="handleCalendarCursorChange"
                @change-mode="calendarViewMode = $event"
                @create="
                    setSelectedDate($event);
                    editingItem = null;
                    showAddModal = true;
                "
                @edit="handleEdit"
            />

            <QuadrantView
                v-else
                :selected-date="selectedDate"
                :schedule-items="scheduleItems"
                :deleting-id="deletingScheduleId"
                :daily-goal="dailyGoals[formatDateLocal(selectedDate)] || ''"
                @update:dailyGoal="updateDailyGoal"
                @toggleComplete="toggleComplete"
                @toggleImportant="toggleImportant"
                @toggleUrgent="toggleUrgent"
                @edit="handleEdit"
                @delete="handleDeleteSchedule"
            />
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
