import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AgentService } from './agent.service';

// 顾客点餐时的订单格式（和 service 里的 AgentChatDto 对应）
class ChatBody {
  userMessage: string; // 顾客输入的问题
  userId?: string; // 顾客编号（可选）
}

@Controller('agent') // 点餐窗口的“区域名”（接口前缀：/agent）
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  // 接单接口：POST /agent/chat（顾客从这个窗口点餐）
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async chat(@Body() body: ChatBody) {
    // 调用服务员的工作流程，返回菜品给顾客
    const reply = await this.agentService.chatWithAgent(body);
    return { success: true, data: { reply } };
  }
}