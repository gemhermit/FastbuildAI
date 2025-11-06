<script setup lang="ts">
// ==================== Props ====================
const props = defineProps<{
    selectedDate: Date;
    dailyGoals: Record<string, string>;
    quadrants: any;
    formatDateLocal: (d: Date) => string;
    priorityColors: any;
    categoryIcons: any;
    isMounted: boolean;
}>();

const emit = defineEmits<{
    "update:dailyGoals": [goals: Record<string, string>];
    toggleComplete: [id: string];
    toggleImportant: [id: string];
    toggleUrgent: [id: string];
    editSchedule: [item: any];
    deleteSchedule: [id: string];
}>();

// ==================== Methods ====================
const handleGoalInput = (dateKey: string, value: string) => {
    const newGoals = { ...props.dailyGoals, [dateKey]: value };
    emit("update:dailyGoals", newGoals);
};
</script>

<template>
    <div class="bg-card border-border rounded-lg border p-5 shadow-sm">
        <div class="mb-3 flex items-center justify-between">
            <h3 class="text-foreground text-base font-semibold">
                {{ selectedDate.getMonth() + 1 }}月{{ selectedDate.getDate() }}日
            </h3>
            <input
                :value="dailyGoals[formatDateLocal(selectedDate)]"
                @input="
                    handleGoalInput(
                        formatDateLocal(selectedDate),
                        ($event.target as HTMLInputElement).value,
                    )
                "
                type="text"
                :placeholder="'当日目标...'"
                class="border-border focus:ring-primary bg-background text-foreground w-56 rounded-md border px-2 py-1 text-xs focus:ring-2 focus:outline-none"
            />
        </div>
        <div class="grid grid-cols-2 gap-2">
            <QuadrantCard
                :title="isMounted ? `重要且紧急 (${quadrants.IU.length})` : '重要且紧急'"
                :items="quadrants.IU"
                :category-icons="categoryIcons"
                :priority-colors="priorityColors"
                @toggle-complete="$emit('toggleComplete', $event)"
                @toggle-important="$emit('toggleImportant', $event)"
                @toggle-urgent="$emit('toggleUrgent', $event)"
                @edit="$emit('editSchedule', $event)"
                @delete="$emit('deleteSchedule', $event)"
            />
            <QuadrantCard
                :title="isMounted ? `重要不紧急 (${quadrants.IN.length})` : '重要不紧急'"
                :items="quadrants.IN"
                :category-icons="categoryIcons"
                :priority-colors="priorityColors"
                @toggle-complete="$emit('toggleComplete', $event)"
                @toggle-important="$emit('toggleImportant', $event)"
                @toggle-urgent="$emit('toggleUrgent', $event)"
                @edit="$emit('editSchedule', $event)"
                @delete="$emit('deleteSchedule', $event)"
            />
            <QuadrantCard
                :title="isMounted ? `不重要但紧急 (${quadrants.NU.length})` : '不重要但紧急'"
                :items="quadrants.NU"
                :category-icons="categoryIcons"
                :priority-colors="priorityColors"
                @toggle-complete="$emit('toggleComplete', $event)"
                @toggle-important="$emit('toggleImportant', $event)"
                @toggle-urgent="$emit('toggleUrgent', $event)"
                @edit="$emit('editSchedule', $event)"
                @delete="$emit('deleteSchedule', $event)"
            />
            <QuadrantCard
                :title="isMounted ? `不重要不紧急 (${quadrants.NN.length})` : '不重要不紧急'"
                :items="quadrants.NN"
                :category-icons="categoryIcons"
                :priority-colors="priorityColors"
                @toggle-complete="$emit('toggleComplete', $event)"
                @toggle-important="$emit('toggleImportant', $event)"
                @toggle-urgent="$emit('toggleUrgent', $event)"
                @edit="$emit('editSchedule', $event)"
                @delete="$emit('deleteSchedule', $event)"
            />
        </div>
    </div>
</template>
