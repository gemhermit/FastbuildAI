<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="./apps/web/public/pwa-512x512.png" width="90" alt="Nest Logo" /></a>
</p>

<h1 align="center">羲梦超级智能体</h1>

<p align="center">
  快速构建您的 AI 应用
</p>

<p align="center">
  <a href="https://nestjs.com/"><img src="https://img.shields.io/badge/NestJS-11.x-ea2845" alt="NestJS" /></a>
  <a href="https://typeorm.io/"><img src="https://img.shields.io/badge/Typeorm-0.3.x-ef4100" alt="NestJS" /></a>
  <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-17.x-29527d" alt="NestJS" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.x-3178c6" alt="TypeScript" /></a>
  <a href="https://turbo.build/"><img src="https://img.shields.io/badge/Turbo-2.x-6d5cb3" alt="Turbo" /></a>
  <a href="https://vuejs.org/"><img src="https://img.shields.io/badge/Vue.js-3.x-3aaf78" alt="Vue.js" /></a>
  <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/vite-6.x-646cff" alt="Vite" /></a>
  <a href="https://ui.nuxt.com/"><img src="https://img.shields.io/badge/NuxtUI-3.x-00b95f" alt="NuxtUI" /></a>
  <a href="https://nuxt.com/"><img src="https://img.shields.io/badge/NuxtJS-3.x-00b95f" alt="NuxtJS" /></a>
</p>

<p align="center">
<a href="http://ai.fastbuildai.com/" target="_blank">在线演示</a>｜
<a href="https://www.fastbuildai.com/">官方网站</a>｜
<a href="./README.md">English</a>
</p>

## 快速开始

在项目根目录下运行：

```bash
# 复制示例配置文件
cp .env.production.local.example .env.production.local

# 使用 Docker 启动应用
docker compose -p fastbuildai --env-file ./.env.production.local -f ./docker/docker-compose.yml up -d
```

等待 **2-3 分钟**，直到所有服务启动完成。

启动后，您可以通过以下地址访问应用：

```
http://localhost:4090
```

**默认超级管理员账号**  

- **用户名：** `admin`  
- **密码：** `羲梦超级智能体&123456`  

## 功能特性

- ✅ **AI对话** – 多模型 AI 对话。
- ✅ **MCP调用** – 支持模型上下文协议（Model Context Protocol）。
- ✅ **用户充值** – 用户余额和支付系统。
- ✅ **模型管理** – 管理和部署 AI 模型。
- ✅ **知识库** – 集中式 AI 知识管理。
- ✅ **智能体** – 用于任务的自主代理。
- ⬜ **工作流** – AI 任务自动化。
- ⬜ **插件系统** – 通过插件扩展功能。

## 截图展示

![image](./docs/screenshots/1.png)
![image](./docs/screenshots/2.png)
![image](./docs/screenshots/3.png)
![image](./docs/screenshots/4.png)
![image](./docs/screenshots/5.png)
![image](./docs/screenshots/6.png)
![image](./docs/screenshots/7.png)
![image](./docs/screenshots/8.png)
![image](./docs/screenshots/9.png)
![image](./docs/screenshots/10.png)

## Star 历史

[![Star History Chart](https://api.star-history.com/svg?repos=FastbuildAI/FastbuildAI&type=Date)](https://www.star-history.com/#FastbuildAI/FastbuildAI&Date)

## 许可证

[Apache License 2.0](./LICENSE)
