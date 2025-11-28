import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

// 顾客订单格式（前端传过来的“点餐信息”）
interface AgentChatDto {
  userMessage: string; // 顾客点的菜（用户输入的问题）
  userId?: string; // 顾客编号（可选，用于区分不同用户）
}

// 后厨回复格式（Coze 返回的“菜品信息”）
interface CozeResponse {
  code: number; // 0 = 成功，其他 = 失败
  msg: string; // 错误提示（比如“没这个菜”）
  data: {
    messages: Array<{
      role: 'assistant' | 'user'; // 谁发的消息（后厨/顾客）
      content: string; // 消息内容（菜品/订单）
    }>;
  };
}

@Injectable()
export class AgentService {
  // 从配置文件拿“后厨地址、门禁卡、菜谱编号”
  private readonly cozeApiKey: string;
  private readonly cozeAgentId: string;
  private readonly cozeBaseUrl: string;

  constructor(
    private readonly httpService: HttpService, // 注入“手机”（发请求）
    private readonly configService: ConfigService, // 注入“配置读取工具”
  ) {
    // 读取配置（后续写在 .env 文件里）
    this.cozeApiKey = this.configService.get<string>('COZE_API_KEY');
    this.cozeAgentId = this.configService.get<string>('COZE_AGENT_ID');
    this.cozeBaseUrl = this.configService.get<string>('COZE_API_BASE_URL');

    // 检查“凭证”是否齐全（没门禁卡不让上岗）
    if (!this.cozeApiKey || !this.cozeAgentId || !this.cozeBaseUrl) {
      throw new Error('Coze 凭证没准备好！请检查 .env 文件');
    }
  }

  // 核心工作流程：接单 → 传给后厨 → 取餐 → 交给前厅
  async chatWithAgent(dto: AgentChatDto): Promise<string> {
    try {
      // 1. 整理订单格式（按后厨要求写“点餐单”）
      const requestData = {
        agent_id: this.cozeAgentId, // 菜谱编号
        user: { user_id: dto.userId || 'default_user' }, // 顾客编号
        messages: [{ role: 'user', content: dto.userMessage }], // 订单内容
        stream: false, // 不要“边做边送”（同步取餐）
      };

      // 2. 打电话给后厨（调用 Coze API）
      const response = await firstValueFrom(
        this.httpService.post<CozeResponse>(this.cozeBaseUrl, requestData, {
          headers: {
            'Authorization': `Bearer ${this.cozeApiKey}`, // 出示门禁卡
            'Content-Type': 'application/json', // 订单格式是 JSON
          },
        }),
      );

      // 3. 处理后厨回复（取餐）
      const cozeData = response.data;
      if (cozeData.code !== 0) {
        throw new Error(`后厨说：${cozeData.msg}`);
      }

      // 4. 提取菜品（找后厨的最后一条回复）
      const agentReply = cozeData.data.messages.findLast(
        (msg) => msg.role === 'assistant',
      );

      return agentReply?.content || '后厨暂时没回复～';
    } catch (error) {
      console.error('对接后厨失败：', error);
      throw new HttpException(
        '调用 AI 助手失败，请稍后重试',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}