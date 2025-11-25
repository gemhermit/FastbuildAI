<script setup lang="ts">
import type { ScheduleItem } from "../types";
import { formatDateLocal } from "../utils";

const props = defineProps<{
    isOpen: boolean;
    editingItem: ScheduleItem | null;
    selectedDate: Date;
    saving?: boolean;
}>();

const emit = defineEmits<{
    (e: "close"): void;
    (e: "save", item: Omit<ScheduleItem, "id">): void;
}>();

const normalizeTime = (value?: string) => {
    if (!value) return "09:00";
    const match = value.match(/(\d{1,2}):(\d{2})/);
    if (!match || !match[1] || !match[2]) return "09:00";
    const hour = match[1].padStart(2, "0");
    const minute = match[2].padStart(2, "0");
    return `${hour}:${minute}`;
};

const formData = ref({
    title: "",
    description: "",
    date: "",
    time: "09:00",
    priority: "none" as "high" | "medium" | "low" | "none",
    category: "uncategorized" as
        | "work"
        | "personal"
        | "meeting"
        | "reminder"
        | "uncategorized",
    completed: false,
    isImportant: false,
    isUrgent: false,
    meetingAgenda: "",
    attendees: "",
});

const showAdvanced = ref(false);

watch(
    () => [props.editingItem, props.selectedDate],
    () => {
        if (props.editingItem) {
            const {
                title,
                description,
                date,
                time,
                priority,
                category,
                completed,
                isImportant,
                isUrgent,
                meetingAgenda,
                attendees,
            } = props.editingItem;
            formData.value = {
                title,
                description,
                date: date || formatDateLocal(props.selectedDate),
                time: normalizeTime(time),
                priority,
                category,
                completed,
                isImportant: !!isImportant,
                isUrgent: !!isUrgent,
                meetingAgenda: meetingAgenda || "",
                attendees: attendees || "",
            };
        } else {
            formData.value = {
                title: "",
                description: "",
                date: formatDateLocal(props.selectedDate),
                time: "09:00",
                priority: "none",
                category: "uncategorized",
                completed: false,
                isImportant: false,
                isUrgent: false,
                meetingAgenda: "",
                attendees: "",
            };
        }
    },
    { immediate: true },
);

const handleSubmit = () => {
    emit("save", {
        ...formData.value,
        time: normalizeTime(formData.value.time),
    });
};
</script>

<template>
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <div class="mb-4 flex items-center justify-between">
                <div>
                    <p class="text-xs tracking-widest text-gray-400 uppercase">
                        {{ editingItem ? "编辑日程" : "新建日程" }}
                    </p>
                    <h3 class="text-xl font-semibold text-gray-900">
                        {{ formData.title || "输入标题" }}
                    </h3>
                </div>
                <button
                    class="text-gray-400 transition hover:text-gray-600"
                    type="button"
                    @click="emit('close')"
                >
                    <UIcon name="i-lucide-x" class="h-5 w-5" />
                </button>
            </div>

            <form @submit.prevent="handleSubmit" class="space-y-6">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-600">标题</label>
                        <input
                            v-model="formData.title"
                            type="text"
                            placeholder="输入日程标题"
                            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            required
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-600">备注</label>
                        <textarea
                            v-model="formData.description"
                            rows="3"
                            placeholder="添加描述或背景信息..."
                            class="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                </div>

                <div class="rounded-xl border border-dashed border-gray-200 p-4">
                    <button
                        type="button"
                        class="flex w-full items-center justify-between text-sm font-medium text-gray-600"
                        @click="showAdvanced = !showAdvanced"
                    >
                        <span>更多选项</span>
                        <UIcon
                            name="i-lucide-chevron-down"
                            class="h-4 w-4 transition"
                            :class="showAdvanced ? 'rotate-180' : ''"
                        />
                    </button>

                    <div v-if="showAdvanced" class="mt-4 space-y-4 border-t border-gray-100 pt-4">
                        <div class="grid gap-4 md:grid-cols-2">
                            <div>
                                <label class="block text-sm font-medium text-gray-600">日期</label>
                                <input
                                    v-model="formData.date"
                                    type="date"
                                    class="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    required
                                />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-600">时间</label>
                                <div class="flex items-center gap-2">
                                    <input
                                        v-model="formData.time"
                                        type="time"
                                        class="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-600">与会人</label>
                            <input
                                v-model="formData.attendees"
                                type="text"
                                placeholder="添加与会人..."
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        <div class="grid gap-4 md:grid-cols-2">
                            <div>
                                <label class="block text-sm font-medium text-gray-600">类别</label>
                                <select
                                    v-model="formData.category"
                                    class="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                >
                                    <option value="uncategorized">未分类</option>
                                    <option value="work">工作</option>
                                    <option value="personal">个人</option>
                                    <option value="meeting">会议</option>
                                    <option value="reminder">提醒</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-600"
                                    >优先级</label
                                >
                                <select
                                    v-model="formData.priority"
                                    class="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                >
                                    <option value="none">无</option>
                                    <option value="low">低</option>
                                    <option value="medium">中</option>
                                    <option value="high">高</option>
                                </select>
                            </div>
                        </div>

                        <div class="grid gap-3 md:grid-cols-2">
                            <label
                                class="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            >
                                <input
                                    type="checkbox"
                                    class="rounded"
                                    v-model="formData.isImportant"
                                />
                                <span>标记为重要</span>
                            </label>
                            <label
                                class="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            >
                                <input
                                    type="checkbox"
                                    class="rounded"
                                    v-model="formData.isUrgent"
                                />
                                <span>标记为紧急</span>
                            </label>
                        </div>

                        <div v-if="formData.category === 'meeting'" class="space-y-3">
                            <div>
                                <label class="block text-sm font-medium text-gray-600"
                                    >会议议程</label
                                >
                                <input
                                    type="text"
                                    v-model="formData.meetingAgenda"
                                    placeholder="例如：项目评审、方案确认"
                                    class="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end gap-3">
                    <button
                        type="button"
                        @click="emit('close')"
                        class="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                        :disabled="props.saving"
                    >
                        取消
                    </button>
                    <button
                        type="submit"
                        class="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                        :disabled="props.saving"
                    >
                        {{ props.saving ? "保存中..." : editingItem ? "更新日程" : "创建日程" }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>
