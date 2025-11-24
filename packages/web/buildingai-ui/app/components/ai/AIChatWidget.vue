<script setup lang="ts">
import {
    apiExecuteUserSchedule,
    apiParseUserSchedule,
    type ExecuteScheduleRequest,
    type ParseScheduleResponse,
    type ScheduleIntent,
    type ScheduleProposal,
    type UserScheduleEvent,
} from "@buildingai/service/webapi/user-schedule";
import { computed, nextTick, ref, watch } from "vue";

import ScheduleCard from "./ScheduleCard.vue";

interface ChatMessage {
    id: string;
    role: "assistant" | "user";
    content: string;
    timestamp: number;
}

const props = defineProps<{
    open: boolean;
    modelId?: string;
    timezone?: string;
}>();

const emit = defineEmits<{
    (e: "update:open", value: boolean): void;
    (e: "event-created", event: UserScheduleEvent): void;
    (e: "event-updated", event: UserScheduleEvent): void;
    (e: "event-deleted", eventId: string): void;
    (e: "query-result", events: UserScheduleEvent[]): void;
    (e: "edit-proposal", proposal: ScheduleProposal): void;
}>();

const messages = ref<ChatMessage[]>([
    {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "您好，我是您的 AI 日程助手。告诉我您想安排或查询的事情吧～",
        timestamp: Date.now(),
    },
]);
const inputValue = ref("");
const isLoading = ref(false);
const executing = ref(false);
const activeProposal = ref<ScheduleProposal | null>(null);
const errorMessage = ref<string | null>(null);
const containerRef = ref<HTMLElement | null>(null);

watch(
    () => props.open,
    async (open) => {
        if (open) {
            await nextTick();
            scrollToBottom();
        } else {
            inputValue.value = "";
            activeProposal.value = null;
        }
    },
);

watch(messages, () => scrollToBottom(), { deep: true });

const timezone = computed(
    () => props.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
);

const scrollToBottom = () => {
    const container = containerRef.value;
    if (!container) return;

    requestAnimationFrame(() => {
        const target = containerRef.value ?? container;
        target.scrollTop = target.scrollHeight;
    });
};

const sendMessage = async () => {
    const trimmed = inputValue.value.trim();
    if (!trimmed || isLoading.value) return;

    errorMessage.value = null;
    pushMessage("user", trimmed);
    inputValue.value = "";
    isLoading.value = true;

    try {
        const response = await apiParseUserSchedule({
            message: trimmed,
            timezone: timezone.value,
            modelId: props.modelId,
        });
        handleParseResponse(response);
    } catch (error) {
        console.error("AI schedule parse failed", error);
        pushMessage("assistant", "抱歉，我暂时无法响应，请稍后重试。");
    } finally {
        isLoading.value = false;
    }
};

const handleParseResponse = (data: ParseScheduleResponse) => {
    streamAssistantMessage(data.reply);
    activeProposal.value = data.proposal ?? null;

    if (data.requiresClarification && data.followUpQuestion) {
        pushMessage("assistant", data.followUpQuestion);
    }
};

const confirmProposal = async () => {
    if (!activeProposal.value || executing.value) return;

    const proposal = activeProposal.value;
    const payload: ExecuteScheduleRequest = {
        intent: proposal.intent,
        scheduleId: proposal.originalEventId,
        data: proposal.data,
        summary: proposal.summary,
    };

    executing.value = true;
    errorMessage.value = null;

    try {
        const result = await apiExecuteUserSchedule(payload);
        handleExecutionResult(result.intent, result.event, result.events);
        streamAssistantMessage(result.message);
        activeProposal.value = null;
    } catch (error) {
        errorMessage.value = "执行失败，请稍后再试。";
        console.error("Execute schedule failed", error);
    } finally {
        executing.value = false;
    }
};

const handleExecutionResult = (
    intent: ScheduleIntent,
    event?: UserScheduleEvent,
    events?: UserScheduleEvent[],
) => {
    if (intent === "create" && event) {
        emit("event-created", event);
    } else if (intent === "update" && event) {
        emit("event-updated", event);
    } else if (intent === "delete" && event) {
        emit("event-deleted", event.id);
    } else if (intent === "query" && events) {
        emit("query-result", events);
    }
};

const cancelProposal = () => {
    activeProposal.value = null;
};

const handleProposalEdit = () => {
    if (!activeProposal.value) return;
    emit("edit-proposal", activeProposal.value);
    activeProposal.value = null;
};

const pushMessage = (role: "assistant" | "user", content: string) => {
    messages.value.push({
        id: crypto.randomUUID(),
        role,
        content,
        timestamp: Date.now(),
    });
};

const streamAssistantMessage = (text: string) => {
    if (!text) {
        pushMessage("assistant", "");
        return;
    }
    const message: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        timestamp: Date.now(),
    };
    messages.value.push(message);
    let index = 0;
    const interval = setInterval(() => {
        message.content += text[index] ?? "";
        index += 1;
        if (index >= text.length) {
            clearInterval(interval);
        }
    }, 25);
};
</script>

<template>
    <Transition name="fade">
        <div
            v-if="open"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
            <div class="flex h-full w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white">
                <header class="flex items-center justify-between border-b px-5 py-3">
                    <div class="flex items-center gap-2">
                        <UIcon name="i-lucide-bot" class="text-blue-600" />
                        <div>
                            <p class="text-sm font-semibold">AI 日程助手</p>
                            <p class="text-xs text-gray-500">自动识别意图与拟定日程</p>
                        </div>
                    </div>
                    <UButton
                        icon="i-lucide-x"
                        size="xs"
                        color="neutral"
                        variant="ghost"
                        @click="emit('update:open', false)"
                    />
                </header>

                <div
                    ref="containerRef"
                    class="flex-1 space-y-4 overflow-y-auto bg-gray-50 px-4 py-5"
                >
                    <div
                        v-for="message in messages"
                        :key="message.id"
                        :class="['flex', message.role === 'user' ? 'justify-end' : 'justify-start']"
                    >
                        <div
                            :class="[
                                'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
                                message.role === 'user'
                                    ? 'rounded-br-none bg-blue-600 text-white'
                                    : 'rounded-bl-none bg-white text-gray-800 shadow',
                            ]"
                        >
                            {{ message.content }}
                        </div>
                    </div>

                    <ScheduleCard
                        v-if="activeProposal"
                        :proposal="activeProposal"
                        :pending="executing"
                        @confirm="confirmProposal"
                        @cancel="cancelProposal"
                        @edit="handleProposalEdit"
                    />

                    <div
                        v-if="errorMessage"
                        class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
                    >
                        {{ errorMessage }}
                    </div>
                </div>

                <footer class="border-t bg-white p-4">
                    <form class="flex gap-3" @submit.prevent="sendMessage">
                        <UInput
                            v-model="inputValue"
                            placeholder="例如：明天下午3点和小王开个会"
                            :disabled="isLoading"
                            class="flex-1"
                        />
                        <UButton
                            type="submit"
                            color="primary"
                            :loading="isLoading"
                            :disabled="!inputValue.trim()"
                        >
                            发送
                        </UButton>
                    </form>
                    <p class="mt-2 text-xs text-gray-400">时区：{{ timezone }}</p>
                </footer>
            </div>
        </div>
    </Transition>
</template>
