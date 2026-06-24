# React 工程化设计文档

> 状态：设计确认，待原型验证
> 日期：2026-06-23
> 作者：蔡光耀

## 一、背景

当前 v3 单文件 HTML（2563 行）已实现 16 项功能，但存在限制：
- 数据存 localStorage，清缓存会丢
- 单文件难以维护和扩展
- 无法用现代前端工具链（TypeScript/热更新/组件化）

## 二、产品形态演进

从 **单文件 HTML 原型** → **React + TypeScript 工程项目**

## 三、技术决策

| 层 | 选择 | 理由 |
|----|------|------|
| 构建工具 | Vite | 快速、现代、热更新好 |
| 框架 | React 18 + TypeScript | 生态大、面试加分、类型安全 |
| 状态管理 | React Context + useReducer | 项目规模不大，不需要 Redux |
| 数据持久化 | IndexedDB（主）+ JSON 导出/导入（备份） | 容量大、清缓存不怕（有备份） |
| UI | 原生 CSS（从 v3 迁移样式） | 不引入 UI 库，保持轻量 |
| IndexedDB 封装 | 待定（原型阶段用原生 API，后续评估 Dexie） | 先验证可行性 |

## 四、运行方式

```bash
npm install      # 安装依赖
npm run dev      # 启动开发服务器（localhost:5173）
```

本地 dev 模式，自己单机用。

## 五、开发流程

```
1. 先做 React 原型（核心交互 + UI 框架，2-3 天示例数据）
         ↓
2. 用户看原型，给修改意见
         ↓
3. 根据意见生成详细设计文档 + 实现计划
         ↓
4. 执行实现（渐进式：核心功能 → 扩展功能）
```

## 六、原型范围

原型不包含 v3 全部 16 项功能，只展示核心交互和 UI 框架：

### 原型包含

| 功能 | 说明 |
|------|------|
| 侧边栏导航 | Week/Day 列表，可展开折叠 |
| Day 卡片展开 | 重点知识/必会题/mock 题，逐项勾选 |
| 勾选交互 + IndexedDB 持久化 | 勾选状态存 IndexedDB，刷新不丢 |
| 档位切换 | 3h/5h/6h 切换，tier5/tier6 动态显示 |
| 顶部栏 | 打卡按钮/复习按钮/档位切换 |
| 路线图总览 | 简化版，展示每周完成率 |

### 原型不包含

- 全部 30 天数据（只放 Day 1-3 示例）
- 关键词卡片库
- 项目案例
- 系统设计
- 复习清单弹窗
- 易错清单增删
- JSON 导出/导入

### 原型数据

从 v3 提取 Day 1-3 的真实数据作为示例，确保原型能真实反映使用体验。

## 七、项目结构（原型阶段）

```
30days/
├── src/
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── DayCard.tsx
│   │   ├── Overview.tsx
│   │   └── Header.tsx
│   ├── data/
│   │   └── plan.ts          # Day 1-3 示例数据
│   ├── hooks/
│   │   └── useAppState.ts   # Context + Reducer
│   ├── utils/
│   │   └── indexeddb.ts     # IndexedDB 封装
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── styles.css           # 从 v3 迁移样式
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 八、UI 设计原则

- 仿照 v3 的视觉风格（配色/布局/字体）
- 保持原有的侧边栏 + 主内容区布局
- 勾选交互保持一致（点击切换/进度条/完成率）
- 档位切换的 tier5/tier6 显示逻辑保持一致

## 九、后续演进（原型验证通过后）

1. 补全 30 天数据
2. 迁移扩展功能（关键词卡片/项目案例/系统设计/复习清单/易错清单）
3. 加 JSON 导出/导入
4. 加测试（Vitest）
5. 可选：部署到云端（Vercel/Netlify）
