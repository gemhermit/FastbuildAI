<script setup lang="ts">
import { ref, watch } from "vue";

import type { ScheduleItem } from "../types";
import { formatDateLocal } from "../utils";

const props = defineProps<{
    isOpen: boolean;
    editingItem: ScheduleItem | null;
    selectedDate: Date;
}>();

const emit = defineEmits<{
    (e: "close"): void;
    (e: "save", item: Omit<ScheduleItem, "id">): void;
}>();

const formData = ref({
    title: "",
    description: "",
    date: "",
    time: "09:00",
    priority: "medium" as "high" | "medium" | "low",
    category: "work" as "work" | "personal" | "meeting" | "reminder",
    completed: false,
    isImportant: false,
    isUrgent: false,
    meetingAgenda: "",
    attendees: "",
});

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
                date,
                time,
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
                priority: "medium",
                category: "work",
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
    emit("save", formData.value);
};
</script>

<template>
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div class="mx-4 w-full max-w-md rounded-lg bg-white">
            <div class="p-5">
                <h3 class="mb-3 text-base font-semibold">
                    {{ editingItem ? "编辑日程" : "添加日程" }}
                </h3>

                <form @submit.prevent="handleSubmit" class="space-y-4">
                    <div>
                        <label class="mb-1 block text-sm font-medium text-gray-700"> 标题 </label>
                        <input
                            type="text"
                            v-model="formData.title"
                            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label class="mb-1 block text-sm font-medium text-gray-700"> 描述 </label>
                        <textarea
                            v-model="formData.description"
                            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            rows="3"
                        />
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="mb-1 block text-sm font-medium text-gray-700">
                                日期
                            </label>
                            <input
                                type="date"
                                v-model="formData.date"
                                class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label class="mb-1 block text-sm font-medium text-gray-700">
                                时间
                            </label>
                            <input
                                type="time"
                                v-model="formData.time"
                                class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="flex items-center gap-2">
                            <input
                                id="important"
                                type="checkbox"
                                v-model="formData.isImportant"
                                class="h-4 w-4"
                            />
                            <label htmlFor="important" class="text-sm text-gray-700"> 重要 </label>
                        </div>
                        <div class="flex items-center gap-2">
                            <input
                                id="urgent"
                                type="checkbox"
                                v-model="formData.isUrgent"
                                class="h-4 w-4"
                            />
                            <label htmlFor="urgent" class="text-sm text-gray-700"> 紧急 </label>
                        </div>
                    </div>

                    <template v-if="formData.category === 'meeting'">
                        <div>
                            <label class="mb-1 block text-sm font-medium text-gray-700">
                                会议事项/议程
                            </label>
                            <input
                                type="text"
                                v-model="formData.meetingAgenda"
                                class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                placeholder="例如：需求评审、方案定稿、问题清单"
                            />
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-gray-700">
                                与会人
                            </label>
                            <input
                                type="text"
                                v-model="formData.attendees"
                                class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                placeholder="例如：产品、研发、测试、市场"
                            />
                        </div>
                    </template>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="mb-1 block text-sm font-medium text-gray-700">
                                优先级
                            </label>
                            <select
                                v-model="formData.priority"
                                class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                <option value="low">低</option>
                                <option value="medium">中</option>
                                <option value="high">高</option>
                            </select>
                        </div>

                        <div>
                            <label class="mb-1 block text-sm font-medium text-gray-700">
                                类别
                            </label>
                            <select
                                v-model="formData.category"
                                class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                <option value="work">工作</option>
                                <option value="personal">个人</option>
                                <option value="meeting">会议</option>
                                <option value="reminder">提醒</option>
                            </select>
                        </div>
                    </div>

                    <div class="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            @click="emit('close')"
                            class="rounded-md border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-50"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            class="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                        >
                            {{ editingItem ? "更新" : "添加" }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>
