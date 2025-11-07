<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import AddScheduleModal from "./_components/AddScheduleModal.vue";
import AIAdvice from "./_components/AIAdvice.vue";
import AIChatModal from "./_components/AIChatModal.vue";
import CalendarView from "./_components/CalendarView.vue";
import QuadrantView from "./_components/QuadrantView.vue";
import ScheduleList from "./_components/ScheduleList.vue";

// ==================== 类型定义 ====================

interface ScheduleItem {
    id: string;
    title: string;
    description: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:mm
    priority: "high" | "medium" | "low";
    category: "work" | "personal" | "meeting" | "reminder";
    completed: boolean;
    isImportant?: boolean;
    isUrgent?: boolean;
    meetingAgenda?: string;
    attendees?: string;
    owner_id?: string;
    deadline?: string;
}

// ==================== 页面元数据 ====================

definePageMeta({
    layout: "default",
    title: "menu.schedule",
    inSystem: true,
    inLinkSelector: true,
});

// ==================== 工具函数 ====================

// 获取本地时区的 YYYY-MM-DD 日期
const getLocalDate = (offsetMonth = 0, offsetDay = 0) => {
    const date = new Date();
    date.setMonth(date.getMonth() + offsetMonth);
    date.setDate(date.getDate() + offsetDay);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

// 将 Date -> 本地 YYYY-MM-DD（避免 toISOString() 的 UTC 偏移）
const formatDateLocal = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

// 用于将 YYYY-MM-DD 字符串按本地时间解析为 Date（避免时区偏移）
const parseLocalDate = (s: string) => {
    const [y, m, d] = s.split("-");
    return new Date(Number(y), Number(m) - 1, Number(d));
};

// 将 YYYY-MM-DD 转为展示用字符串，如 "8月5日"
const formatDisplayDateFromString = (s: string) => {
    try {
        const d = parseLocalDate(s);
        return `${d.getMonth() + 1}月${d.getDate()}日`;
    } catch {
        return s;
    }
};

// ==================== 响应式状态 ====================

const currentDate = ref(new Date());
const selectedDate = ref(new Date());
const scheduleItems = ref<ScheduleItem[]>([]);
const showAddModal = ref(false);
const showAIChat = ref(false);
const editingItem = ref<ScheduleItem | null>(null);
const dailyGoals = ref<Record<string, string>>({});
const loadingTasks = ref(false);
const fetchError = ref<string | null>(null);

// Todoist 列表状态：排序、筛选、是否显示已完成
const todoSortBy = ref<"time" | "importance">("time");
const todoFilterCategory = ref<"all" | "work" | "personal" | "meeting" | "reminder">("all");
const showCompletedInList = ref<boolean>(false);

const isMounted = ref(false);
onMounted(() => {
    isMounted.value = true;
});

// ==================== 模拟数据 ====================

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

// ==================== 数据加载 ====================

const loadTasksFromApi = async () => {
    loadingTasks.value = true;
    fetchError.value = null;
    try {
        const dateKey = formatDateLocal(selectedDate.value);
        const res = await $fetch(`/api/tasks?date=${dateKey}`);

        let tasks: ScheduleItem[] = [];

        if (res && (res as any).quadrants) {
            const { quadrants } = res as any;
            tasks = [
                ...(quadrants.IU || []),
                ...(quadrants.IN || []),
                ...(quadrants.NU || []),
                ...(quadrants.NN || []),
            ].map((t: any) => ({
                id: String(t.id ?? Date.now()),
                title: t.title ?? "",
                description: t.description ?? "",
                date: t.date ?? t.deadline ?? dateKey,
                time: t.time ?? "09:00",
                priority: t.priority ?? "medium",
                category: t.category ?? "work",
                completed: !!t.completed,
                isImportant: !!t.isImportant || !!t.important,
                isUrgent: !!t.isUrgent || !!t.urgent,
                meetingAgenda: t.meetingAgenda,
                attendees: t.attendees,
                owner_id: t.owner_id,
                deadline: t.deadline,
            }));
        } else if (Array.isArray(res)) {
            tasks = (res as any[]).map((t: any) => ({
                id: String(t.id ?? Date.now()),
                title: t.title ?? "",
                description: t.description ?? "",
                date: t.date ?? t.deadline ?? dateKey,
                time: t.time ?? "09:00",
                priority: t.priority ?? "medium",
                category: t.category ?? "work",
                completed: !!t.completed,
                isImportant: !!t.isImportant || !!t.important,
                isUrgent: !!t.isUrgent || !!t.urgent,
                meetingAgenda: t.meetingAgenda,
                attendees: t.attendees,
                owner_id: t.owner_id,
                deadline: t.deadline,
            }));
        } else {
            throw new Error("Unexpected API response");
        }

        // 合并 API 返回和本地已有项，优先保留本地
        scheduleItems.value = ((prev) => {
            const map = new Map<string, ScheduleItem>();
            tasks.forEach((t) => map.set(t.id, t));
            prev.forEach((p) => map.set(p.id, p));
            return Array.from(map.values());
        })(scheduleItems.value);
    } catch (err: any) {
        console.warn("Task API load failed, using mock data. Error:", err);
        fetchError.value = err.message || "Failed to fetch tasks";
        // 合并 mock 数据与本地，保留本地修改
        scheduleItems.value = ((prev) => {
            const map = new Map<string, ScheduleItem>();
            mockScheduleData.forEach((t) => map.set(t.id, t));
            prev.forEach((p) => map.set(p.id, p));
            return Array.from(map.values());
        })(scheduleItems.value);
    } finally {
        loadingTasks.value = false;
    }
};

// 当选择的日期改变时，重新加载任务
watch(
    selectedDate,
    () => {
        loadTasksFromApi();
    },
    { immediate: true },
);

// ==================== 日历功能 ====================

const getCalendarDays = () => {
    const year = currentDate.value.getFullYear();
    const month = currentDate.value.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: Date[] = [];
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

// ==================== AI 助手 ====================

// 将日程项传给 AI 助手
const getScheduleContextForAI = () => {
    const dateStr = formatDateLocal(selectedDate.value);
    return scheduleItems.value.filter((item) => item.date === dateStr);
};

// ==================== 任务管理 ====================

const handleSaveSchedule = (item: Omit<ScheduleItem, "id">) => {
    if (editingItem.value) {
        scheduleItems.value = scheduleItems.value.map((scheduleItem) =>
            scheduleItem.id === editingItem.value!.id
                ? { ...item, id: editingItem.value!.id }
                : scheduleItem,
        );
        editingItem.value = null;
    } else {
        const newItem: ScheduleItem = {
            ...item,
            id: Date.now().toString(),
        };
        scheduleItems.value = [...scheduleItems.value, newItem];
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
    scheduleItems.value = scheduleItems.value.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
    );
};

// ==================== 四象限视图 ====================

const priorityColors: Record<"high" | "medium" | "low", string> = {
    high: "bg-red-500",
    medium: "bg-yellow-500",
    low: "bg-green-500",
};

const categoryIcons: Record<"work" | "personal" | "meeting" | "reminder", string> = {
    work: "💼",
    personal: "👤",
    meeting: "🤝",
    reminder: "⏰",
};

const getQuadrants = (items: ScheduleItem[]) => {
    const selectedKey = formatDateLocal(selectedDate.value);
    const todays = items.filter((i) => i.date === selectedKey);
    return {
        IU: todays.filter((i) => (i.isImportant ?? i.priority === "high") && (i.isUrgent ?? false)),
        IN: todays.filter((i) => (i.isImportant ?? i.priority !== "low") && !(i.isUrgent ?? false)),
        NU: todays.filter((i) => !(i.isImportant ?? false) && (i.isUrgent ?? false)),
        NN: todays.filter((i) => !(i.isImportant ?? false) && !(i.isUrgent ?? false)),
    };
};

const quadrants = computed(() => getQuadrants(scheduleItems.value));

// ==================== 任务列表视图 ====================

// 排序助手（不修改原数组）
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

// 返回三个面板的数据：today / within3 (1-3 天后) / within7 (4-7 天后)
const getTodoPanels = () => {
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
};

const todoPanels = computed(() => getTodoPanels());

// ==================== 操作按钮 ====================

const toggleImportant = (id: string) => {
    scheduleItems.value = scheduleItems.value.map((i) =>
        i.id === id ? { ...i, isImportant: !i.isImportant } : i,
    );
};

const toggleUrgent = (id: string) => {
    scheduleItems.value = scheduleItems.value.map((i) =>
        i.id === id ? { ...i, isUrgent: !i.isUrgent } : i,
    );
};

// ==================== 事件处理方法 ====================

const handleAddScheduleClick = () => {
    editingItem.value = null;
    showAddModal.value = true;
};

const handleEditSchedule = (item: ScheduleItem) => {
    editingItem.value = item;
    showAddModal.value = true;
};

const handleScheduleFormSubmit = (data: any) => {
    handleSaveSchedule(data);
};
</script>

<script lang="ts">
export default {
    name: "SchedulePage",
};
</script>

<template>
    <div
        class="dark:to-primary-950 min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-neutral-900 dark:via-neutral-800"
    >
        <!-- Header -->
        <div class="container mx-auto w-full px-4 pt-4 pb-4">
            <div class="text-center">
                <h1 class="text-foreground mb-4 text-4xl font-bold">
                    {{ $t("schedule.title") }}
                </h1>
                <p class="text-md text-accent-foreground mb-4">
                    {{ $t("schedule.subtitle") }}
                </p>
            </div>
        </div>

        <!-- 主要内容区域 -->
        <div class="container mx-auto px-4 pb-8">
            <section class="flex flex-col">
                <!-- 功能按钮区域 -->
                <div class="mb-6 flex items-center justify-end gap-2">
                    <button
                        @click="showAIChat = !showAIChat"
                        class="bg-primary hover:bg-primary/90 flex items-center rounded-lg px-4 py-2 text-white transition-colors"
                    >
                        <Icon name="lucide:bot" class="mr-2 h-5 w-5" />
                        {{ $t("schedule.buttons.aiAssistant") }}
                    </button>
                    <button
                        @click="handleAddScheduleClick"
                        class="flex items-center rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                    >
                        <Icon name="lucide:plus" class="mr-2 h-5 w-5" />
                        {{ $t("schedule.buttons.addSchedule") }}
                    </button>
                </div>

                <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <!-- 日历和任务列表 -->
                    <div class="flex flex-col gap-4 lg:col-span-2">
                        <!-- 日历视图 -->
                        <CalendarView
                            :current-date="currentDate"
                            :selected-date="selectedDate"
                            :schedule-items="scheduleItems"
                            :get-calendar-days="getCalendarDays"
                            :get-schedule-for-date="getScheduleForDate"
                            :format-date-local="formatDateLocal"
                            @update:current-date="currentDate = $event"
                            @update:selected-date="selectedDate = $event"
                            @show-add-modal="handleAddScheduleClick"
                        />

                        <!-- Todoist 列表 -->
                        <ScheduleList
                            :todo-panels="todoPanels"
                            :todo-sort-by="todoSortBy"
                            :todo-filter-category="todoFilterCategory"
                            :show-completed-in-list="showCompletedInList"
                            :category-icons="categoryIcons"
                            :format-display-date-from-string="formatDisplayDateFromString"
                            @update:todo-sort-by="todoSortBy = $event as 'time' | 'importance'"
                            @update:todo-filter-category="
                                todoFilterCategory = $event as
                                    | 'all'
                                    | 'work'
                                    | 'personal'
                                    | 'meeting'
                                    | 'reminder'
                            "
                            @update:show-completed-in-list="showCompletedInList = $event"
                            @toggle-complete="toggleComplete"
                            @toggle-important="toggleImportant"
                            @toggle-urgent="toggleUrgent"
                            @edit-schedule="handleEditSchedule"
                            @delete-schedule="handleDeleteSchedule"
                        />
                    </div>

                    <!-- 右侧面板 -->
                    <div class="space-y-6">
                        <!-- 四象限 -->
                        <QuadrantView
                            :selected-date="selectedDate"
                            :daily-goals="dailyGoals"
                            :quadrants="quadrants"
                            :format-date-local="formatDateLocal"
                            :priority-colors="priorityColors"
                            :category-icons="categoryIcons"
                            :is-mounted="isMounted"
                            @update:daily-goals="dailyGoals = $event"
                            @toggle-complete="toggleComplete"
                            @toggle-important="toggleImportant"
                            @toggle-urgent="toggleUrgent"
                            @edit-schedule="handleEditSchedule"
                            @delete-schedule="handleDeleteSchedule"
                        />

                        <!-- AI智能建议 -->
                        <AIAdvice />
                    </div>
                </div>
            </section>
        </div>

        <!-- AI Chat Modal -->
        <AIChatModal
            :is-open="showAIChat"
            :schedule-items="getScheduleContextForAI()"
            @update:is-open="showAIChat = $event"
        />

        <!-- Add Schedule Modal -->
        <AddScheduleModal
            :is-open="showAddModal"
            :editing-item="editingItem"
            :selected-date="selectedDate"
            :format-date-local="formatDateLocal"
            @update:is-open="showAddModal = $event"
            @update:editing-item="editingItem = $event"
            @submit="handleScheduleFormSubmit"
        />
    </div>
</template>
