<script setup lang="ts">
import { ProModal, ProScrollArea, useMessage } from "@fastbuildai/ui";
import { useVModel } from "@vueuse/core";
import { computed, nextTick, ref, useTemplateRef, watch } from "vue";

import { useChat } from "@/common/composables/useChat";
import { uuid } from "@/common/utils/helper";
import type { AiMessage } from "@/models/ai-conversation";
import { apiChatStream, apiGetDefaultAiModel } from "@/services/web/ai-conversation";

// ==================== Props ====================
interface ScheduleItem {
    id: string;
    title: string;
    date: string;
    time: string;
    priority: "high" | "medium" | "low";
}

const props = defineProps<{
    isOpen: boolean;
    scheduleItems?: ScheduleItem[];
}>();

const emit = defineEmits<{
    "update:isOpen": [value: boolean];
}>();

// ==================== Composables ====================
const toast = useMessage();

const selectedModelId = ref<string>("");
const selectedMcpServerIds = ref<string[]>([]);
const isModelReady = computed(() => Boolean(selectedModelId.value));
const conversationId = ref<string | undefined>();

// ==================== State ====================
const isOpenModel = useVModel(props, "isOpen", emit);
const scrollAreaRef = useTemplateRef<InstanceType<typeof ProScrollArea>>("scrollAreaRef");

const ensureModelSelected = async () => {
    if (typeof window === "undefined") return;
    if (selectedModelId.value) return;

    const cachedModel = window.localStorage.getItem("modelId");
    if (cachedModel) {
        selectedModelId.value = cachedModel;
        return;
    }

    try {
        const defaultModel = await apiGetDefaultAiModel();
        if (defaultModel?.id) {
            selectedModelId.value = defaultModel.id;
            window.localStorage.setItem("modelId", defaultModel.id);
        }
    } catch (error) {
        console.error("加载默认模型失败:", error);
        toast.error("获取默认AI模型失败");
    }
};

const loadSelectedMcpServers = () => {
    if (typeof window === "undefined") return;
    try {
        const raw = window.localStorage.getItem("mcpIds");
        const parsed = raw ? JSON.parse(raw) : [];
        selectedMcpServerIds.value = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.warn("读取MCP配置失败", error);
        selectedMcpServerIds.value = [];
    }
};

watch(selectedModelId, (value) => {
    if (typeof window === "undefined") return;
    if (value) {
        window.localStorage.setItem("modelId", value);
    } else {
        window.localStorage.removeItem("modelId");
    }
});

// 计算系统提示词 - 包含日程上下文
const getSystemPrompt = () => {
    const basePrompt =
        "你是一个专业的AI日程助手。你可以帮助用户管理日程、设置提醒、分析时间安排、提供时间管理建议。请用中文回复。";

    if (!props.scheduleItems || props.scheduleItems.length === 0) {
        return basePrompt;
    }

    const scheduleText = props.scheduleItems
        .map((item) => `- ${item.time} ${item.title} (优先级: ${item.priority})`)
        .join("\n");

    return (
        `${basePrompt}\n\n当前日程安排如下:\n${scheduleText}\n\n` +
        "请基于以上日程信息给出相关建议和帮助。"
    );
};

// ==================== useChat Integration ====================
const { messages, input, handleSubmit, status, stop } = useChat({
    api: apiChatStream,
    initialMessages: [],
    body: {
        saveConversation: true,
        get modelId() {
            return selectedModelId.value;
        },
        get conversationId() {
            return conversationId.value;
        },
        get title() {
            return "AI日程助手";
        },
        get mcpServers() {
            return selectedMcpServerIds.value;
        },
    },
    onUpdate(chunk) {
        if (chunk.type === "metadata" && chunk.metadata?.type === "conversation_id") {
            conversationId.value = chunk.metadata.data as string;
        }
    },
    onError(err) {
        toast.error("消息发送失败");
        console.error("Chat error:", err);
    },
    onFinish(message) {
        // 自动滚动到底部
        nextTick(() => {
            scrollToBottom();
        });
    },
});

// ==================== Methods ====================
const handleSend = async () => {
    if (!input.value.trim()) return;

    if (!isModelReady.value) {
        await ensureModelSelected();
        if (!isModelReady.value) {
            toast.warning("未找到可用的AI模型，请先在聊天页面选择模型");
            return;
        }
    }

    try {
        // 如果是第一条消息，添加系统提示词作为前导消息
        if (messages.value.length === 0) {
            const systemContent = getSystemPrompt();
            // 先添加系统消息到历史（但不显示）
            messages.value.push({
                id: uuid(),
                role: "system",
                content: systemContent,
            } as AiMessage);
        }

        await handleSubmit();
        nextTick(() => {
            scrollToBottom();
        });
    } catch (err) {
        console.error("Send message failed:", err);
    }
};

const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    } else if (e.key === "Enter" && e.shiftKey) {
        // Shift+Enter 换行
        input.value += "\n";
    } else if (e.key === "Escape") {
        // ESC 关闭对话框
        isOpenModel.value = false;
    }
};

const scrollToBottom = async () => {
    if (!scrollAreaRef.value) return;

    await nextTick();
    // 使用 scrollAreaRef 提供的方法进行滚动
    const scrollElement = scrollAreaRef.value.$el?.querySelector(
        "[data-radix-scroll-area-viewport]",
    );
    if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
    }
};

// ==================== Lifecycle ====================
watch(
    () => props.isOpen,
    async (newVal) => {
        if (newVal) {
            await ensureModelSelected();
            loadSelectedMcpServers();
            if (messages.value.length === 0) {
                messages.value.push({
                    id: uuid(),
                    role: "assistant",
                    content:
                        "我可以帮助你快速创建和管理日程。先告诉我需要安排的事项、时间或优先级！",
                    status: "completed",
                    mcpToolCalls: [],
                });
            }
            await nextTick();
            scrollToBottom();
        }
        if (!newVal) {
            conversationId.value = undefined;
            messages.value = [];
            input.value = "";
        }
    },
);
</script>

<template>
    <ProModal
        v-model="isOpenModel"
        title="AI日程助手"
        :ui="{ content: 'max-w-2xl h-3/4 flex flex-col' }"
        :overlay="true"
        :dismissible="true"
        :close-on-esc="true"
    >
        <template #default>
            <!-- 消息显示区域 -->
            <ProScrollArea ref="scrollAreaRef" class="w-full flex-1" type="auto" :shadow="true">
                <div class="space-y-3 px-4 py-4">
                    <div
                        v-for="message in messages.filter((m) => m.role !== 'system')"
                        :key="message.id"
                        class="flex"
                        :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
                    >
                        <div
                            class="max-w-xs rounded-xl px-3.5 py-2 lg:max-w-md"
                            :class="
                                message.role === 'user'
                                    ? 'bg-primary text-white'
                                    : 'bg-muted text-foreground'
                            "
                        >
                            {{ message.content }}
                        </div>
                    </div>

                    <!-- 加载状态 -->
                    <div v-if="status === 'loading'" class="flex justify-start">
                        <div class="bg-muted text-foreground rounded-xl px-3.5 py-2">
                            <div class="flex items-center gap-2">
                                <UIcon name="i-lucide-loader-2" class="size-4 animate-spin" />
                                思考中...
                            </div>
                        </div>
                    </div>
                </div>
            </ProScrollArea>

            <!-- 输入区域 -->
            <div class="border-border border-t p-4">
                <div class="flex flex-col gap-3">
                    <ModelSelect
                        v-model="selectedModelId"
                        :supportedModelTypes="['llm']"
                        :show-billingRule="true"
                        :open-local-storage="true"
                        :allowed-model-names="['GLM-4.5v']"
                        placeholder="选择或搜索模型..."
                    />

                    <div class="flex gap-2">
                        <textarea
                            v-model="input"
                            @keypress="handleKeyPress"
                            :placeholder="
                                isModelReady
                                    ? '输入您的需求，AI助手会帮您管理日程...'
                                    : '正在加载默认模型，请稍候或前往聊天页选择模型'
                            "
                            :disabled="status === 'loading'"
                            rows="2"
                            class="border-border focus:ring-primary bg-background text-foreground flex-1 resize-none rounded-md border px-3 py-2 focus:ring-2 focus:outline-none disabled:opacity-50"
                        />
                        <div class="flex flex-col gap-2">
                            <UButton
                                @click="handleSend"
                                icon="i-lucide-send"
                                :disabled="!input.trim() || status === 'loading' || !isModelReady"
                                :loading="status === 'loading'"
                                color="primary"
                            />
                            <UButton
                                v-if="status === 'loading'"
                                @click="stop"
                                icon="i-lucide-square"
                                color="error"
                                variant="ghost"
                                size="sm"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </ProModal>
</template>
