<script setup lang="ts">
// ==================== Props ====================
const props = defineProps<{
    currentDate: Date;
    selectedDate: Date;
    scheduleItems: any[];
    getCalendarDays: () => Date[];
    getScheduleForDate: (date: Date) => any[];
    formatDateLocal: (d: Date) => string;
}>();

const emit = defineEmits<{
    "update:currentDate": [date: Date];
    "update:selectedDate": [date: Date];
    showAddModal: [];
}>();

// ==================== Methods ====================
const handlePrevMonth = () => {
    emit(
        "update:currentDate",
        new Date(props.currentDate.getFullYear(), props.currentDate.getMonth() - 1),
    );
};

const handleNextMonth = () => {
    emit(
        "update:currentDate",
        new Date(props.currentDate.getFullYear(), props.currentDate.getMonth() + 1),
    );
};

const handleToday = () => {
    const today = new Date();
    emit("update:currentDate", today);
    emit("update:selectedDate", today);
};

const handleDateSelect = (date: Date) => {
    emit("update:selectedDate", date);
};

const handleAddSchedule = (date: Date, e: Event) => {
    e.stopPropagation();
    emit("update:selectedDate", date);
    emit("showAddModal");
};
</script>

<template>
    <div class="bg-card border-border rounded-lg border p-5 shadow-sm">
        <div class="mb-4 flex items-center justify-between">
            <h2 class="text-foreground text-base font-semibold">
                {{ currentDate.getFullYear() }}年{{ currentDate.getMonth() + 1 }}月
            </h2>
            <div class="flex space-x-1">
                <button
                    @click="handlePrevMonth"
                    class="hover:bg-muted text-foreground rounded-md px-2 py-1 transition-colors"
                >
                    <Icon name="lucide:chevron-left" class="h-4 w-4" />
                </button>
                <button
                    @click="handleToday"
                    class="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-1.5 text-sm text-white transition-colors"
                >
                    今天
                </button>
                <button
                    @click="handleNextMonth"
                    class="hover:bg-muted text-foreground rounded-md px-2 py-1 transition-colors"
                >
                    <Icon name="lucide:chevron-right" class="h-4 w-4" />
                </button>
            </div>
        </div>

        <div class="mb-3 grid grid-cols-7 gap-1">
            <div
                v-for="day in ['日', '一', '二', '三', '四', '五', '六']"
                :key="day"
                class="text-muted-foreground p-2 text-center text-xs font-semibold"
            >
                {{ day }}
            </div>
        </div>

        <div class="grid grid-cols-7 gap-1">
            <div
                v-for="(date, index) in getCalendarDays()"
                :key="index"
                @click="handleDateSelect(date)"
                class="group relative"
            >
                <div
                    class="border-border relative h-20 cursor-pointer rounded-md border p-2 transition-colors select-none"
                    :class="{
                        'bg-card': date.getMonth() === currentDate.getMonth(),
                        'bg-muted/30 text-muted-foreground':
                            date.getMonth() !== currentDate.getMonth(),
                        'bg-primary/10 border-primary':
                            date.toDateString() === new Date().toDateString(),
                        'ring-primary ring-2': date.toDateString() === selectedDate.toDateString(),
                        'hover:bg-muted/90': date.getMonth() === currentDate.getMonth(),
                    }"
                >
                    <div class="text-foreground mb-1 text-sm font-medium">
                        {{ date.getDate() }}
                    </div>
                    <div class="flex flex-col space-y-1">
                        <div
                            v-for="schedule in getScheduleForDate(date).slice(0, 2)"
                            :key="schedule.id"
                            class="inline-block w-fit truncate rounded-md px-1.5 py-0.5 text-[11px]"
                            :class="
                                schedule.completed
                                    ? 'bg-muted text-muted-foreground line-through'
                                    : 'bg-primary/10 text-primary'
                            "
                        >
                            {{ schedule.title }}
                        </div>
                        <div
                            v-if="getScheduleForDate(date).length > 2"
                            class="text-muted-foreground text-[11px]"
                        >
                            +{{ getScheduleForDate(date).length - 2 }}
                        </div>
                    </div>

                    <!-- 添加按钮 -->
                    <button
                        v-if="date.toDateString() === selectedDate.toDateString()"
                        @click="handleAddSchedule(date, $event)"
                        title="添加日程"
                        class="bg-primary text-primary-foreground absolute top-1 right-1 flex h-7 w-7 items-center justify-center rounded-full text-sm leading-none opacity-0 transition-opacity group-hover:opacity-100"
                    >
                        <Icon name="lucide:plus" class="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
