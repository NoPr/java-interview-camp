# Java 面试冲刺 30 天交互式 Dashboard

> 基于 React 18 + TypeScript + Vite 的 Java 面试冲刺学习仪表盘，结构化拆解 30 天复习计划，IndexedDB 本地持久化，支持勾选打卡、薄弱标记、复习队列、拖拽排序。

## 🌐 在线访问

**[https://nopr.github.io/java-interview-camp/](https://nopr.github.io/java-interview-camp/)**

## ✨ 核心特性

- **30 天结构化学习计划**：按周分组，按 Day 展开，覆盖 Java 集合/并发/JVM/MySQL/Redis/Kafka/Flink 等简历技术栈
- **三类区块勾选追踪**：重点知识 / 必会题 / 模拟题，逐项勾选记录进度
- **IndexedDB 本地持久化**：刷新与关闭浏览器不丢数据，300ms 防抖写入
- **薄弱知识点标记 + 复习队列**：自动归集薄弱项，按紧迫度排序
- **拖拽排序**：重点知识、必会题、模拟题支持自定义顺序
- **JSON 导入/导出**：支持备份与多设备迁移
- **简历技术栈全覆盖**：Java 17/21 新特性、JVM OOM 排查、MySQL 索引调优、Redis 分布式锁、Kafka 可靠性、Flink ETL 链路等

## 🚀 快速开始

### 环境要求

- Node.js ≥ 18
- npm ≥ 9

### 安装与开发

```bash
git clone git@github.com:NoPr/java-interview-camp.git
cd java-interview-camp
npm install
npm run dev      # 启动开发服务器 http://localhost:5173
```

### 构建与测试

```bash
npm run build    # 生产构建，输出到 dist/
npm run test     # 运行单元测试（watch 模式）
npm run test:run # 单次运行测试
```

## 💾 数据持久化

- **主存储**：IndexedDB（自动持久化，300ms 防抖写入）
- **版本控制**：内置 `STATE_VERSION`，schema 升级可识别旧数据
- **备份**：JSON 导出/导入，支持跨设备迁移

## 📜 License

MIT
