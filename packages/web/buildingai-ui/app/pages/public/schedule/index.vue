<script setup lang="ts">
import { apiChatStream, apiGetDefaultAiModel } from "@buildingai/service/webapi/ai-conversation";
import { computed, nextTick, onMounted, ref, watch } from "vue";

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

interface ApiTask {
    id?: string | number;
    title?: string;
    description?: string;
    date?: string;
    deadline?: string;
    time?: string;
    priority?: string;
    category?: string;
    completed?: boolean;
    isImportant?: boolean;
    important?: boolean;
    isUrgent?: boolean;
    urgent?: boolean;
    meetingAgenda?: string;
    attendees?: string | string[];
    owner_id?: string;
}

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

const todoSortBy = ref<"time" | "importance">("time");
const todoFilterCategory = ref<"all" | "work" | "personal" | "meeting" | "reminder">("all");
const showCompletedInList = ref(false);
const defaultModelId = ref<string>("");

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

const {
    messages: aiMessages,
    input: aiInput,
    handleSubmit: sendAIMessage,
    status,
} = useChat({
    api: apiChatStream,
    initialMessages: [
        {
            id: "welcome",
            role: "assistant",
            content:
                "您好！我是您的AI日程助手。我可以帮您管理日程、设置提醒、分析时间安排。有什么需要帮助的吗？",
        },
    ],
    body: {
        get modelId() {
            return defaultModelId.value;
        },
    },
    onError: (err) => {
        console.error("Chat error:", err);
    },
});

const messagesContainer = ref<HTMLElement | null>(null);

const scrollToBottom = async () => {
    await nextTick();
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
};

watch(
    () => aiMessages.value,
    () => {
        scrollToBottom();
    },
    { deep: true, flush: "post" },
);

const isLoading = computed(() => status.value === "loading");

const loadTasksFromApi = async () => {
    loadingTasks.value = true;
    fetchError.value = null;
    try {
        const dateKey = formatDateLocal(selectedDate.value);
        // Using fetch directly as in the example, but in Nuxt useFetch is preferred.
        // However, since we expect it to fail or return mock structure, I'll keep it simple or just use mock directly if API doesn't exist.
        // The user provided code uses fetch.
        const res = await fetch(`/api/tasks?date=${dateKey}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        let tasks: ScheduleItem[] = [];

        if (data && data.quadrants) {
            const { quadrants } = data;
            tasks = [
                ...(quadrants.IU || []),
                ...(quadrants.IN || []),
                ...(quadrants.NU || []),
                ...(quadrants.NN || []),
            ].map((t: ApiTask) => ({
                id: String(t.id ?? Date.now()),
                title: t.title ?? "",
                description: t.description ?? "",
                date: t.date ?? t.deadline ?? dateKey,
                time: t.time ?? "09:00",
                priority: (t.priority as "high" | "medium" | "low") ?? "medium",
                category: (t.category as "work" | "personal" | "meeting" | "reminder") ?? "work",
                completed: !!t.completed,
                isImportant: !!t.isImportant || !!t.important,
                isUrgent: !!t.isUrgent || !!t.urgent,
                meetingAgenda: t.meetingAgenda,
                attendees: Array.isArray(t.attendees) ? t.attendees.join(", ") : t.attendees,
                owner_id: t.owner_id,
                deadline: t.deadline,
            }));
        } else if (Array.isArray(data)) {
            tasks = data.map((t: ApiTask) => ({
                id: String(t.id ?? Date.now()),
                title: t.title ?? "",
                description: t.description ?? "",
                date: t.date ?? t.deadline ?? dateKey,
                time: t.time ?? "09:00",
                priority: (t.priority as "high" | "medium" | "low") ?? "medium",
                category: (t.category as "work" | "personal" | "meeting" | "reminder") ?? "work",
                completed: !!t.completed,
                isImportant: !!t.isImportant || !!t.important,
                isUrgent: !!t.isUrgent || !!t.urgent,
                meetingAgenda: t.meetingAgenda,
                attendees: Array.isArray(t.attendees) ? t.attendees.join(", ") : t.attendees,
                owner_id: t.owner_id,
                deadline: t.deadline,
            }));
        } else {
            throw new Error("Unexpected API response");
        }

        const map = new Map<string, ScheduleItem>();
        tasks.forEach((t) => map.set(t.id, t));
        scheduleItems.value.forEach((p) => map.set(p.id, p));
        scheduleItems.value = Array.from(map.values());
    } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.warn("Task API load failed, using mock data. Error:", error);
        fetchError.value = error.message || "Failed to fetch tasks";
        const map = new Map<string, ScheduleItem>();
        mockScheduleData.forEach((t) => map.set(t.id, t));
        scheduleItems.value.forEach((p) => map.set(p.id, p));
        scheduleItems.value = Array.from(map.values());
    } finally {
        loadingTasks.value = false;
    }
};

watch(() => selectedDate.value, loadTasksFromApi, { immediate: true });

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

const handleSaveSchedule = (item: Omit<ScheduleItem, "id">) => {
    const currentEditing = editingItem.value;
    if (currentEditing) {
        const index = scheduleItems.value.findIndex((i) => i.id === currentEditing.id);
        if (index !== -1) {
            scheduleItems.value[index] = { ...item, id: currentEditing.id };
        }
        editingItem.value = null;
    } else {
        const newItem: ScheduleItem = {
            ...item,
            id: Date.now().toString(),
        };
        scheduleItems.value.push(newItem);
    }
    showAddModal.value = false;
};

const handleDeleteSchedule = (id: string) => {
    scheduleItems.value = scheduleItems.value.filter((item) => item.id !== id);
    if (editingItem.value && editingItem.value.id === id) {
        editingItem.value = null;
    }
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
</script>

<template>
    <div class="bg-background h-full">
        <div class="mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div class="lg:col-span-2">
                    <div class="rounded-lg bg-white p-5">
                        <div class="mb-4 flex items-center justify-between">
                            <h2 class="text-base font-semibold text-gray-900">
                                {{ currentDate.getFullYear() }}年{{ currentDate.getMonth() + 1 }}月
                            </h2>
                            <div class="flex space-x-1">
                                <button
                                    @click="handlePrevMonth"
                                    class="rounded-md px-2 py-1 text-gray-700 hover:bg-gray-100"
                                >
                                    ←
                                </button>
                                <button
                                    @click="handleToday"
                                    class="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                                >
                                    今天
                                </button>
                                <button
                                    @click="handleNextMonth"
                                    class="rounded-md px-2 py-1 text-gray-700 hover:bg-gray-100"
                                >
                                    →
                                </button>
                            </div>
                        </div>

                        <div class="mb-3 grid grid-cols-7 gap-1">
                            <div
                                v-for="day in ['日', '一', '二', '三', '四', '五', '六']"
                                :key="day"
                                class="p-2 text-center text-xs font-semibold text-gray-700"
                            >
                                {{ day }}
                            </div>
                        </div>

                        <div class="grid grid-cols-7 gap-1">
                            <div
                                v-for="(date, index) in calendarDays"
                                :key="index"
                                @click="selectedDate = date"
                                class="group relative h-20 cursor-pointer border p-2 transition-colors select-none"
                                :class="[
                                    date.getMonth() === currentDate.getMonth()
                                        ? 'border-gray-200 bg-white hover:bg-gray-50'
                                        : 'border-gray-100 bg-gray-50 text-gray-400',
                                    date.toDateString() === new Date().toDateString()
                                        ? 'border-blue-200 bg-blue-50'
                                        : '',
                                    date.toDateString() === selectedDate.toDateString()
                                        ? 'ring-2 ring-blue-500'
                                        : '',
                                ]"
                            >
                                <div class="mb-1 text-sm font-medium text-gray-900">
                                    {{ date.getDate() }}
                                </div>
                                <div class="flex flex-col space-y-1">
                                    <div
                                        v-for="schedule in getScheduleForDate(date).slice(0, 2)"
                                        :key="schedule.id"
                                        class="inline-block w-fit truncate rounded-md px-1.5 py-0.5 text-[11px]"
                                        :class="
                                            schedule.completed
                                                ? 'bg-gray-200 text-gray-600 line-through'
                                                : 'bg-blue-100 text-blue-800'
                                        "
                                    >
                                        {{ schedule.title }}
                                    </div>
                                    <div
                                        v-if="getScheduleForDate(date).length > 2"
                                        class="text-[11px] text-gray-500"
                                    >
                                        +{{ getScheduleForDate(date).length - 2 }}
                                    </div>
                                </div>

                                <button
                                    v-if="date.toDateString() === selectedDate.toDateString()"
                                    @click.stop="
                                        editingItem = null;
                                        showAddModal = true;
                                    "
                                    title="添加日程"
                                    class="absolute top-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-sm leading-none text-white opacity-0 transition-opacity group-hover:opacity-100"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="mt-4 rounded-lg bg-white p-4">
                        <div class="mb-3 flex items-center justify-between">
                            <h4 class="text-sm font-semibold text-gray-900">日程面板</h4>
                            <div class="flex items-center gap-2">
                                <select
                                    v-model="todoSortBy"
                                    class="rounded border px-2 py-1 text-sm"
                                >
                                    <option value="time">按时间排序</option>
                                    <option value="importance">按重要性排序</option>
                                </select>
                                <select
                                    v-model="todoFilterCategory"
                                    class="rounded border px-2 py-1 text-sm"
                                >
                                    <option value="all">所有类别</option>
                                    <option value="work">工作</option>
                                    <option value="personal">个人</option>
                                    <option value="meeting">会议</option>
                                    <option value="reminder">提醒</option>
                                </select>
                                <label class="flex items-center space-x-2 text-sm">
                                    <input type="checkbox" v-model="showCompletedInList" />
                                    <span>显示已完成</span>
                                </label>
                            </div>
                        </div>

                        <div class="flex flex-col space-y-3">
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
                                    <div class="text-sm font-medium text-gray-700">
                                        {{ panel.title }} ({{ getPanelItems(panel.key).length }})
                                    </div>
                                </div>
                                <div class="space-y-2">
                                    <div
                                        v-if="getPanelItems(panel.key).length === 0"
                                        class="text-xs text-gray-400"
                                    >
                                        暂无任务
                                    </div>
                                    <div
                                        v-else
                                        v-for="t in getPanelItems(panel.key)"
                                        :key="t.id"
                                        class="flex items-center justify-between rounded border p-2"
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
                                                class="rounded px-2 py-1 text-xs"
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
                                                class="rounded px-2 py-1 text-xs"
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
                                                class="rounded px-2 py-1 text-xs"
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
                                                class="rounded p-1 text-blue-600 hover:bg-blue-50"
                                            >
                                                <UIcon name="i-lucide-edit" class="h-4 w-4" />
                                            </button>
                                            <button
                                                @click="handleDeleteSchedule(t.id)"
                                                title="删除"
                                                class="rounded p-1 text-red-600 hover:bg-red-50"
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
                    <div class="rounded-lg bg-white p-5">
                        <div class="mb-3 flex items-center justify-between">
                            <h3 class="text-base font-semibold text-gray-900">
                                {{ selectedDate.getMonth() + 1 }}月{{ selectedDate.getDate() }}日
                            </h3>
                            <div class="flex items-center gap-2">
                                <input
                                    type="text"
                                    v-model="dailyGoals[formatDateLocal(selectedDate)]"
                                    placeholder="当日目标..."
                                    class="w-56 rounded-md border border-gray-300 px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <QuadrantCard
                                :title="
                                    isMounted ? `重要且紧急 (${quadrants.IU.length})` : '重要且紧急'
                                "
                                :items="quadrants.IU"
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
                                @toggleComplete="toggleComplete"
                                @toggleImportant="toggleImportant"
                                @toggleUrgent="toggleUrgent"
                                @edit="handleEdit"
                                @delete="handleDeleteSchedule"
                            />
                        </div>
                    </div>

                    <div class="rounded-lg bg-white p-5">
                        <div class="mb-3 flex items-center justify-between">
                            <div class="flex items-center">
                                <UIcon name="i-lucide-bot" class="mr-2 text-blue-600" />
                                <h3 class="text-base font-semibold text-gray-900">AI智能建议</h3>
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
                            <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
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
                            <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
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
                            <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
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

        <div
            v-if="showAIChat"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
            <div
                class="mx-4 flex h-3/4 w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white"
            >
                <div class="flex items-center justify-between border-b p-4">
                    <div class="flex items-center">
                        <UIcon name="i-lucide-bot" class="mr-2 text-blue-600" />
                        <h3 class="text-base font-semibold">AI日程助手</h3>
                    </div>
                    <button @click="showAIChat = false" class="text-gray-500 hover:text-gray-700">
                        <UIcon name="i-lucide-x" />
                    </button>
                </div>

                <div ref="messagesContainer" class="flex flex-1 flex-col overflow-y-auto p-4">
                    <ChatsMessages :messages="aiMessages" class="flex-1" />
                </div>

                <div class="border-t p-4">
                    <ChatsPrompt
                        v-model="aiInput"
                        :rows="1"
                        :is-loading="isLoading"
                        :show-file-upload="false"
                        placeholder="输入您的需求，AI助手会帮您管理日程..."
                        @submit="sendAIMessage"
                    />
                </div>
            </div>
        </div>

        <ScheduleModal
            :isOpen="showAddModal"
            :editingItem="editingItem"
            :selectedDate="selectedDate"
            @close="
                showAddModal = false;
                editingItem = null;
            "
            @save="handleSaveSchedule"
        />
    </div>
</template>
