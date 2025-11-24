<script setup lang="ts">
import { computed } from "vue";

import QuadrantCard from "./quadrant-card.vue";
import type { ScheduleItem } from "../types";
import { formatDateLocal } from "../utils";

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
}>();

const quadrants = computed(() => {
    const selectedKey = formatDateLocal(props.selectedDate);
    const todays = props.scheduleItems.filter((i) => i.date === selectedKey);
    return {
        IU: todays.filter((i) => (i.isImportant ?? i.priority === "high") && (i.isUrgent ?? false)),
        IN: todays.filter(
            (i) => (i.isImportant ?? i.priority !== "low") && !(i.isUrgent ?? false),
        ),
        NU: todays.filter((i) => !(i.isImportant ?? false) && (i.isUrgent ?? false)),
        NN: todays.filter((i) => !(i.isImportant ?? false) && !(i.isUrgent ?? false)),
    };
});

const title = computed(() =>
    props.selectedDate.toLocaleDateString("zh-CN", {
        month: "long",
        day: "numeric",
        weekday: "long",
    }),
);
</script>

<template>
    <div class="rounded-2xl bg-white p-6 shadow-lg">
        <div class="mb-4 flex items-center justify-between gap-3">
            <div>
                <p class="text-sm text-gray-500">四象限视图</p>
                <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
            </div>
            <input
                type="text"
                :value="dailyGoal"
                @input="emit('update:dailyGoal', ($event.target as HTMLInputElement).value)"
                placeholder="当日目标..."
                class="w-64 rounded-full border border-gray-200 px-3 py-1.5 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
        </div>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <QuadrantCard
                :title="`重要且紧急 (${quadrants.IU.length})`"
                :items="quadrants.IU"
                :deleting-id="deletingId"
                @toggleComplete="emit('toggleComplete', $event)"
                @toggleImportant="emit('toggleImportant', $event)"
                @toggleUrgent="emit('toggleUrgent', $event)"
                @edit="emit('edit', $event)"
                @delete="emit('delete', $event)"
            />
            <QuadrantCard
                :title="`重要不紧急 (${quadrants.IN.length})`"
                :items="quadrants.IN"
                :deleting-id="deletingId"
                @toggleComplete="emit('toggleComplete', $event)"
                @toggleImportant="emit('toggleImportant', $event)"
                @toggleUrgent="emit('toggleUrgent', $event)"
                @edit="emit('edit', $event)"
                @delete="emit('delete', $event)"
            />
            <QuadrantCard
                :title="`不重要但紧急 (${quadrants.NU.length})`"
                :items="quadrants.NU"
                :deleting-id="deletingId"
                @toggleComplete="emit('toggleComplete', $event)"
                @toggleImportant="emit('toggleImportant', $event)"
                @toggleUrgent="emit('toggleUrgent', $event)"
                @edit="emit('edit', $event)"
                @delete="emit('delete', $event)"
            />
            <QuadrantCard
                :title="`不重要不紧急 (${quadrants.NN.length})`"
                :items="quadrants.NN"
                :deleting-id="deletingId"
                @toggleComplete="emit('toggleComplete', $event)"
                @toggleImportant="emit('toggleImportant', $event)"
                @toggleUrgent="emit('toggleUrgent', $event)"
                @edit="emit('edit', $event)"
                @delete="emit('delete', $event)"
            />
        </div>
    </div>
</template>
