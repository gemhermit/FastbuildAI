import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios'; // 给服务员配“手机”（发请求用）
import { AgentService } from './agent.service'; // 服务员的工作流程
import { AgentController } from './agent.controller'; // 服务员的接单窗口

@Module({
  imports: [HttpModule], // 分配“手机”
  controllers: [AgentController], // 注册接单窗口
  providers: [AgentService], // 注册工作流程
})
export class AgentModule {}