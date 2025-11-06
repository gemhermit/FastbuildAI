<script setup lang="ts">
// ==================== Props ====================
const props = defineProps<{
    isOpen: boolean;
    editingItem: any;
    selectedDate: Date;
    formatDateLocal: (d: Date) => string;
}>();

const emit = defineEmits<{
    "update:isOpen": [value: boolean];
    "update:editingItem": [item: any];
    submit: [data: any];
}>();

// ==================== Reactive Data ====================
const formData = reactive({
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

// ==================== Watchers ====================
watch(
    () => props.editingItem,
    (newItem) => {
        if (newItem) {
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
            } = newItem;
            Object.assign(formData, {
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
            });
        } else {
            Object.assign(formData, {
                title: "",
                description: "",
                date: props.formatDateLocal(props.selectedDate),
                time: "09:00",
                priority: "medium",
                category: "work",
                completed: false,
                isImportant: false,
                isUrgent: false,
                meetingAgenda: "",
                attendees: "",
            });
        }
    },
    { immediate: true },
);

// ==================== Methods ====================
const handleClose = () => {
    emit("update:isOpen", false);
    emit("update:editingItem", null);
};

const handleSubmit = (e: Event) => {
    e.preventDefault();
    emit("submit", formData);
};
</script>

<template>
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div class="bg-background border-border mx-4 w-full max-w-md rounded-lg border shadow-xl">
            <div class="p-5">
                <h3 class="text-foreground mb-3 text-base font-semibold">
                    {{ editingItem ? "编辑日程" : "添加日程" }}
                </h3>

                <form @submit="handleSubmit" class="space-y-4">
                    <div>
                        <label class="text-foreground mb-1 block text-sm font-medium"> 标题 </label>
                        <input
                            v-model="formData.title"
                            type="text"
                            class="border-border focus:ring-primary bg-background text-foreground w-full rounded-md border px-3 py-2 focus:ring-2 focus:outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label class="text-foreground mb-1 block text-sm font-medium"> 描述 </label>
                        <textarea
                            v-model="formData.description"
                            class="border-border focus:ring-primary bg-background text-foreground w-full rounded-md border px-3 py-2 focus:ring-2 focus:outline-none"
                            rows="3"
                        />
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-foreground mb-1 block text-sm font-medium">
                                日期
                            </label>
                            <input
                                v-model="formData.date"
                                type="date"
                                class="border-border focus:ring-primary bg-background text-foreground w-full rounded-md border px-3 py-2 focus:ring-2 focus:outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label class="text-foreground mb-1 block text-sm font-medium">
                                时间
                            </label>
                            <input
                                v-model="formData.time"
                                type="time"
                                class="border-border focus:ring-primary bg-background text-foreground w-full rounded-md border px-3 py-2 focus:ring-2 focus:outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="flex items-center gap-2">
                            <input
                                id="important"
                                v-model="formData.isImportant"
                                type="checkbox"
                                class="border-border h-4 w-4 rounded"
                            />
                            <label for="important" class="text-foreground text-sm"> 重要 </label>
                        </div>
                        <div class="flex items-center gap-2">
                            <input
                                id="urgent"
                                v-model="formData.isUrgent"
                                type="checkbox"
                                class="border-border h-4 w-4 rounded"
                            />
                            <label for="urgent" class="text-foreground text-sm"> 紧急 </label>
                        </div>
                    </div>

                    <div v-if="formData.category === 'meeting'">
                        <label class="text-foreground mb-1 block text-sm font-medium">
                            会议事项/议程
                        </label>
                        <input
                            v-model="formData.meetingAgenda"
                            type="text"
                            class="border-border focus:ring-primary bg-background text-foreground w-full rounded-md border px-3 py-2 focus:ring-2 focus:outline-none"
                            placeholder="例如：需求评审、方案定稿、问题清单"
                        />
                    </div>

                    <div v-if="formData.category === 'meeting'">
                        <label class="text-foreground mb-1 block text-sm font-medium">
                            与会人
                        </label>
                        <input
                            v-model="formData.attendees"
                            type="text"
                            class="border-border focus:ring-primary bg-background text-foreground w-full rounded-md border px-3 py-2 focus:ring-2 focus:outline-none"
                            placeholder="例如：产品、研发、测试、市场"
                        />
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-foreground mb-1 block text-sm font-medium">
                                优先级
                            </label>
                            <select
                                v-model="formData.priority"
                                class="border-border focus:ring-primary bg-background text-foreground w-full rounded-md border px-3 py-2 focus:ring-2 focus:outline-none"
                            >
                                <option value="low">低</option>
                                <option value="medium">中</option>
                                <option value="high">高</option>
                            </select>
                        </div>

                        <div>
                            <label class="text-foreground mb-1 block text-sm font-medium">
                                类别
                            </label>
                            <select
                                v-model="formData.category"
                                class="border-border focus:ring-primary bg-background text-foreground w-full rounded-md border px-3 py-2 focus:ring-2 focus:outline-none"
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
                            @click="handleClose"
                            class="text-foreground border-border hover:bg-muted rounded-md border px-4 py-2 transition-colors"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            class="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 transition-colors"
                        >
                            {{ editingItem ? "更新" : "添加" }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>
