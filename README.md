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

- `/`：个人项目首页
- `/tools`：工具箱
- `/tools/json-formatter`：JSON Formatter
- `/showcase`：效果展示
- `/showcase/aura`、`/demos/aura`：AURA Wellness 详情与互动页面
- `/showcase/prmpt`、`/demos/prmpt`：prmpt Archive 详情与互动页面
- `/demos/motion-lab`：Motion Lab 动效实验入口（Scroll Trigger、Scroll Progress、Sticky Scroll、Text Reveal、Parallax）

## 目录结构

```text
src/
├─ app/                 # 路由与项目入口配置
├─ features/json-tool/  # JSON Formatter 功能
├─ pages/               # 首页与页面级样式
├─ demos/               # AURA、prmpt 与 Motion Lab 互动展示页面
└─ styles/              # 全局样式
public/                 # favicon、SVG 与 Motion Lab 原始 demo 文档
```
