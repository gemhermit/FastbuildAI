<script setup lang="ts">
// ==================== Props ====================
const props = defineProps<{
    isOpen: boolean;
    aiMessages: any[];
    aiInput: string;
}>();

const emit = defineEmits<{
    "update:isOpen": [value: boolean];
    "update:aiInput": [value: string];
    sendMessage: [];
}>();

// ==================== Methods ====================
const handleClose = () => {
    emit("update:isOpen", false);
};

const handleInputChange = (value: string) => {
    emit("update:aiInput", value);
};

const handleSend = () => {
    emit("sendMessage");
};

const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
};
</script>

<template>
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div
            class="bg-background border-border mx-4 flex h-3/4 w-full max-w-2xl flex-col rounded-lg border shadow-xl"
        >
            <div class="border-border flex items-center justify-between border-b p-4">
                <div class="flex items-center">
                    <Icon name="lucide:bot" class="text-primary mr-2 h-5 w-5" />
                    <h3 class="text-foreground text-base font-semibold">AI日程助手</h3>
                </div>
                <button @click="handleClose" class="text-muted-foreground hover:text-foreground">
                    <Icon name="lucide:x" class="h-5 w-5" />
                </button>
            </div>

            <div class="flex-1 space-y-3 overflow-y-auto p-4">
                <div
                    v-for="message in aiMessages"
                    :key="message.id"
                    class="flex"
                    :class="message.type === 'user' ? 'justify-end' : 'justify-start'"
                >
                    <div
                        class="max-w-xs rounded-xl px-3.5 py-2 lg:max-w-md"
                        :class="
                            message.type === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-foreground'
                        "
                    >
                        {{ message.content }}
                    </div>
                </div>
            </div>

            <div class="border-border border-t p-4">
                <div class="flex space-x-2">
                    <input
                        :value="aiInput"
                        @input="handleInputChange(($event.target as HTMLInputElement).value)"
                        @keypress="handleKeyPress"
                        type="text"
                        placeholder="输入您的需求，AI助手会帮您管理日程..."
                        class="border-border focus:ring-primary bg-background text-foreground flex-1 rounded-md border px-3 py-2 focus:ring-2 focus:outline-none"
                    />
                    <button
                        @click="handleSend"
                        class="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 transition-colors"
                    >
                        <Icon name="lucide:send" class="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
