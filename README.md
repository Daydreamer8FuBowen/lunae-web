# Lunae — Personal Index

Lunae 的个人项目索引与作品集网站。这里集中整理个人完成的网页实验、视觉项目和日常效率工具，当前包含个人项目首页、JSON 工具箱、AURA Wellness、prmpt Archive，以及收录 5 个滚动动效示例的 Motion Lab。

这是一个持续迭代的个人工作台：项目既用于对外展示作品，也用于验证新的交互、动效和页面叙事方式。

## 开始使用

```bash
npm install
npm run dev
```

常用命令：

```bash
npm run build   # 类型检查并构建生产版本
npm test        # 运行 Vitest 测试
npm run lint    # 运行 ESLint
npm run preview # 预览生产构建
```

## 路由

- `/`：跳转到工具箱
- `/tools`：工具箱
- `/tools/formatter`：格式化（JSON、标准 HTML、Shopify HTML、JavaScript）
- `/tools/xuyu`：须臾集，工具页第三个项目；文字／照片生成水粉画、收藏与 PNG 导出。
- `/tools/demos`：效果展示，通过 Tab 切换疗愈生活、灵感档案、动效实验、3D 创作、飞鸽与瀑布，切换不改变路由。瀑布保留原首页效果，Get started 按钮跳转到工具箱。

旧 `/demo`、`/demos`、`/showcase`、`/demos/*` 页面地址会跳转到 `/tools/demos`，项目旧地址会选中对应 Tab；旧格式化地址会跳转到 `/tools/formatter`。

## 须臾集与部署

`code1/` 保留须臾集源码与独立测试。根目录 `npm run build` 同时构建主站和 `code1/index.html`，图片会打包为带哈希的资源；主站通过 iframe 隔离须臾集的样式。`npm test` 同时运行主站和须臾集测试。

本地 `npm run dev` 自动挂载图片接口，读取 `code1/.env.local` 中的服务端配置。生产预览需分别运行 `node --env-file=code1/.env.local code1/server/start.js` 与 `npm run preview`，后者将 `/api` 代理到本机 5180 端口。密钥不会进入前端构建或 Git。

线上使用 Nginx 托管 `dist/`，将 `/api/` 反向代理到独立 Node 22 服务。部署配置与持久化目录见 [deploy/README.md](deploy/README.md)。本地生成记录、原始大图、环境文件和依赖目录不随源码上传。

## 目录结构

展示页面在独立 iframe 中运行，保留各项目的固定导航、滚动和动画环境。React demo 使用 `demo-preview.html` 作为构建入口；Motion Lab 和 Jack 3D Creator 使用 `public/demos/` 中的静态文档。部分媒体和字体仍使用原项目外链，需要网络连接。

```text
src/
├─ app/                 # 路由与项目入口配置
├─ features/json-tool/  # JSON Formatter 功能
├─ pages/               # 首页与页面级样式
├─ demos/               # AURA、prmpt 与 Motion Lab 互动展示页面
└─ styles/              # 全局样式
public/                 # favicon、SVG 与 Motion Lab 原始 demo 文档
```
