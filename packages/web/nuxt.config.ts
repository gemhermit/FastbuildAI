import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
  // 开发工具（可选，调试用，不影响运行）
  devtools: { enabled: true },

  // 🔥 修复位置 1：开发服务器配置（端口、主机）应该放在 devServer 下
  devServer: {
    port: 4091, // 前端开发端口（热更新生效，按前辈要求）
    host: '0.0.0.0', // 允许局域网访问（可选）
  },

  // 🔥 修复位置 2：nitro 配置中移除了错误的 server 属性
  nitro: {
    // 路由规则（Route Rules）是正确的
    routeRules: {
      // 匹配所有 /api/** 路径，转发到后端 4090 端口
      '/api/**': {
        proxy: {
          to: 'http://localhost:4090/**', // 用 ** 实现路径重写（去掉 /api 前缀）
          headers: {
            // 解决跨域，设置 Host
            host: 'localhost:4090',
          },
        },
      },
    },
  },

  // 其他基础配置（确保前端正常运行，按需保留）
  app: {
    head: {
      title: '你的项目名称', // 可自定义页面标题
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        { name: 'description', content: '对接 Coze Agent 的项目' },
      ],
    },
  },

  // 全局 CSS（可选，若有全局样式可添加路径）
  css: [],

  // 项目依赖模块（可选，若有 Pinia、Nuxt UI 等可添加）
  modules: [],
});