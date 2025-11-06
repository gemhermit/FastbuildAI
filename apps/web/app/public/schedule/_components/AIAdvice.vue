<template>
    <div class="bg-card border-border rounded-lg border p-5 shadow-sm">
        <div class="mb-3 flex items-center">
            <Icon name="lucide:bot" class="text-primary mr-2 h-5 w-5" />
            <h3 class="text-foreground text-base font-semibold">AI智能建议</h3>
        </div>
        <div class="space-y-3">
            <div class="bg-muted/50 border-border rounded-lg border p-3">
                <div class="flex items-start">
                    <Icon
                        name="lucide:alert-triangle"
                        class="mt-0.5 mr-2 h-4 w-4 text-orange-500"
                    />
                    <div>
                        <p class="text-foreground text-sm font-medium">时间冲突提醒</p>
                        <p class="text-muted-foreground text-xs">
                            今天14:30的会议可能与其他安排有冲突
                        </p>
                    </div>
                </div>
            </div>
            <div class="bg-muted/50 border-border rounded-lg border p-3">
                <div class="flex items-start">
                    <Icon name="lucide:check-circle" class="mt-0.5 mr-2 h-4 w-4 text-green-500" />
                    <div>
                        <p class="text-foreground text-sm font-medium">效率建议</p>
                        <p class="text-muted-foreground text-xs">建议将类似任务集中在上午处理</p>
                    </div>
                </div>
            </div>
            <div class="bg-muted/50 border-border rounded-lg border p-3">
                <div class="flex items-start">
                    <Icon name="lucide:coffee" class="mt-0.5 mr-2 h-4 w-4 text-blue-500" />
                    <div>
                        <p class="text-foreground text-sm font-medium">休息提醒</p>
                        <p class="text-muted-foreground text-xs">连续工作2小时，建议适当休息</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
