# Agent 开发指南

本文档是本项目中所有自动化 Agent 和协作者的通用工作约定。

## 项目概览

这是 Lunae 的个人项目索引与作品集网站，集中展示个人完成的网页实验、视觉项目和日常效率工具。项目采用根目录单一入口的 React 19 + TypeScript + Vite 前端架构，使用 React Router 管理页面路由，Tailwind CSS、GSAP 和 Motion 提供样式与动画能力。

项目定位不是面向多用户的商业平台，而是 Lunae 用来整理、展示和持续迭代个人项目的长期工作台。新增内容应优先保持个人作品集的清晰感、实验性和可访问性，避免引入与个人项目无关的复杂后台或业务系统。

主要页面：

- `/`：Lunae 个人项目首页
- `/tools`：工具箱入口
- `/tools/json-formatter`：JSON Formatter 工具
- `/showcase`：项目效果展示
- `/demos/aura`：AURA Wellness 互动页面
- `/demos/prmpt`：prmpt Archive 互动页面

## 目录约定

- `src/app/`：路由和应用级配置。
- `src/features/`：按功能划分的可复用业务模块。
- `src/pages/`：页面组件及页面级样式。
- `src/demos/`：独立视觉实验页面及其专属资源、样式。
- `src/styles/`：全局 CSS、设计令牌和基础样式。
- `public/`：无需经过打包处理的公共资源。
- `docs/superpowers/`：本地规划文档，已被 `.gitignore` 忽略，不提交 Git。

## 开发命令

在项目根目录执行：

```bash
npm install       # 安装依赖
npm run dev       # 启动 Vite 开发服务器
npm run build     # 类型检查并构建生产版本
npm test          # 运行 Vitest
npm run lint      # 运行 ESLint
npm run preview   # 预览生产构建
```

完成代码修改后，至少运行与改动相关的测试；涉及构建、路由或 TypeScript 时，运行完整的 `npm run lint`、`npm test` 和 `npm run build`。

## 编码规范

- 优先使用 TypeScript；已有 `.jsx` 文件只有在迁移成本明确可控时才改为 `.tsx`。
- 遵循现有函数组件、Hooks 和 React Router 写法，不引入新的状态管理库，除非需求明确要求。
- 页面视觉改动应复用现有 CSS 变量和组件风格；不要随意覆盖全局样式。
- 动画需考虑 `prefers-reduced-motion`，避免阻塞首屏或引入无必要的持续循环。
- 图片和视频必须提供有意义的 `alt` 或等价的无障碍处理；交互控件应有可见焦点状态和 `aria` 信息。
- 保持路由路径兼容；修改路由时同步更新 `src/app/routes.ts` 及其测试。

## 变更流程

1. 先阅读相关源码、测试和 README，确认现有行为。
2. 对新增功能或行为变更，先明确需求和页面交互，再修改代码。
3. 只修改完成任务所需的文件，保留用户已有的未相关改动。
4. 使用 `apply_patch` 编辑文本文件；不要用破坏性命令覆盖整个工作区。
5. 完成后检查 `git diff` 和 `git status`，确认没有误加入构建产物或敏感文件。
6. 在最终说明中列出实际修改、验证命令和仍存在的限制。

## Git 约定

- 当前仓库默认分支为 `master`。
- 不要提交 `node_modules/`、`dist/`、`.vite/`、环境变量文件、日志或 `docs/superpowers/`。
- 提交前确认 `.gitignore` 已覆盖本地生成文件。
- 除非用户明确要求，不执行 `git reset --hard`、强制推送或大范围删除。

## 安全边界

- 不读取、输出或提交 API 密钥、令牌、密码及个人凭据。
- 不擅自下载或替换外部媒体资源；如外链失效，先说明并提供最小范围的替代方案。
- 删除文件前先确认目标路径和范围，优先保留可恢复副本。
