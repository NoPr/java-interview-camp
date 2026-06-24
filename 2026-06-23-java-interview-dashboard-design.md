# Java 面试冲刺 30 天交互式 Dashboard - 设计文档

> 日期：2026-06-23
> 作者：蔡光耀 + Rapid Prototyper
> 状态：已实现（v3，2563 行单文件 HTML），文档与实现对齐

---

## 一、核心假设

**验证假设**：结构化的交互式学习计划能否比纯 Markdown 文档提升学习执行力和完成率。

**验证指标**：
- 连续打卡天数（执行力指标）
- 每日任务完成率
- 复盘日 🟡 知识点补完率
- 关键词卡片自评 ❌ 比例趋势

---

## 二、技术方案

- **单文件 HTML**：零依赖，双击即开
- **存储**：localStorage 自动持久化 + JSON 导出/导入手动备份
- **视觉风格**：Notion 极简清爽，白底 + 蓝色主色调

---

## 三、内容调整（基于简历对齐）

### 3.1 简历技术栈覆盖

| 技术 | 简历描述 | 计划覆盖 |
|---|---|---|
| Java 集合/并发/线程池/AQS/CAS | 有实战经验 | Day 1-6 ✅ |
| **Java 17/21 新特性** | record/sealed/pattern matching/虚拟线程 | Day 1（record/sealed/pattern）+ Day 6（虚拟线程）✅ 新增 |
| JVM/OOM 排查 | 有 OOM 修复实战 | Day 8-11 ✅ |
| MySQL 索引/事务/MVCC | 有索引调优经历 | Day 12-14 ✅ |
| Redis 缓存/分布式锁 | Spring Cloud 生态使用 | Day 16-18 ✅ |
| Spring/SpringBoot/SpringCloud | 熟练使用 | Day 19-21 ✅ |
| **Kafka** | 处理过消息丢失/重复/积压 | Day 23-24 ✅（改为 Kafka 专项） |
| **Flink** | 熟悉批处理模式，2个项目使用 | Day 28 ✅（项目案例打磨+Flink 专项） |
| **MyBatis-Plus** | 熟练使用 | Day 14 ✅（合并） |
| **Elasticsearch** | 熟练使用 | Day 18 后半段 ✅（新增） |
| **MongoDB** | 熟练使用 | 🟢 加分清单 |
| Docker | 使用 | Day 25 ✅ |
| 分布式事务/锁/幂等 | 有经验 | Day 26 ✅ |
| **Linux** | 面试被问2次，常用命令+排查链路 | Day 2/6/11/16/20/25（6 处 tier6 扩展专题）✅ 新增 |

### 3.2 具体调整

| 调整 | 原内容 | 调整后 |
|---|---|---|
| Day 1 | Java 基础总复盘 | Java 基础 + Java 17 新特性（record/sealed/pattern matching） |
| Day 6 | 线程池 | 线程池 + Java 21 虚拟线程（与线程池对比） |
| Day 7 | 复盘日 mock 原题重复 | 复盘日 mock 改为变形/综合题，tips 标注对应原题 |
| Day 11 | OOM 排查 + JVM 缓冲日 | OOM 排查专项（Flink 移至 Day 28） |
| Day 14 | MySQL 锁 + 慢SQL + 分库分表 | MySQL 锁 + 慢SQL + MyBatis（分库分表移到 🟡 扩展） |
| Day 18 | Redis 持久化 + 高可用 | 上午：Redis 持久化+高可用；下午：Elasticsearch |
| Day 23 | MQ 基础（泛化） | MQ 基础(30min) + Kafka 架构（分区/副本/ISR/rebalance/高性能） |
| Day 24 | MQ 可靠性（RocketMQ 为主） | Kafka 可靠性（acks/幂等/exactly-once/丢失/重复/积压） |
| Day 27 | 行为面试 + 系统设计入门（4案例） | 行为面试 + 短链系统设计（IM/配置中心移至 Day 29） |
| Day 28 | 算法复盘（一） | 项目案例打磨 + Flink 专项（承接 Day 11 移出的 Flink） |
| Day 29 | 算法复盘（二）+ 系统设计 | 系统设计 + 模拟面试（上）（承接 Day 27 移出的 IM/配置中心） |
| Day 30 | 模拟面试（下）+ 查漏补缺 | 模拟面试（下）：3 个项目案例即兴讲解 + 2 道高频八股快速口述 |

### 3.3 项目案例关键词卡片（7个）

| # | 案例 | 关键词锚点 | 来源 |
|---|---|---|---|
| 1 | 线程池 OOM | 数据采集任务量大 \| 无界队列堆积 \| jmap+MAT \| 堆撑爆 \| 有界队列+CallerRunsPolicy+分批提交+背压 \| 压测稳定 | 简历项目2 |
| 2 | 慢 SQL 优化 | 接口响应慢 \| 慢查询日志 \| Explain type/rows/Extra \| 全表扫描 \| 加联合索引+覆盖索引 \| 查询时间下降 | 通用 |
| 3 | Kafka 消息积压+丢失 | 消费速度跟不上 \| 生产者 acks=0 丢消息 \| min.insync.replicas \| 消费者 rebalance 耗时 \| 临时扩容消费者+并行消费 \| 幂等+offset 提交策略 | 简历项目2 |
| 4 | Nacos 长轮询+OpenFeign | 客户端长轮询 \| 服务端 hold 29.5s \| 配置变更立即返回 \| OpenFeign 动态代理→负载均衡→HTTP 调用 | 简历项目3 |
| 5 | Flink ETL 链路 | Flink BATCH 模式 \| DAG 调度 \| SPI 机制 17 种 ETL 节点动态加载 \| 新增节点无需修改框架 \| 策略模式+模板方法 | 简历项目2 |
| 6 | 多源异构数据统一接入 | 7种关系型+3种文件存储 \| 策略模式+模板方法适配体系 \| 新增数据源只需实现类 \| Apache Seatunnel 多线程分片 \| 自适应批处理 | 简历项目2 |
| 7 | 语义数据治理平台 | RDFS/OWL 标准 \| RDF 三元组存储 \| 关系型+RDF 双存储 \| 命名空间-概念-属性-谓词四层架构 \| Graph 可视化 \| SPARQL 查询 | 简历项目1 |

### 3.4 tier5/tier6 扩展内容体系

30 天计划中，每个非复盘日（共 25 天）配置两档扩展内容，由 Header 的时间档位开关控制显示：

- **3h 档**：仅显示核心知识 + 必会题 + 卡片 + 算法 + 模拟题（基础闭环）
- **5h 档**：在 3h 基础上显示 tier5（源码深读 + 动手实操）
- **6h 档**：在 5h 基础上显示 tier6（跨主题扩展专题）

#### 3.4.1 tier5 内容分布（源码深读 + 动手实操）

tier5 围绕当日主题做深度延伸，包含两类：源码深读（看核心源码思路）+ 动手实操（写代码验证）。

| Day | 主题 | tier5 内容 |
|---|---|---|
| 1 | Java 基础 | 源码：String hashCode() 缓存、intern()；实操：验证 String 不可变 |
| 2 | HashMap | 源码：putVal()、resize()、treeifyBin()；实操：IDEA debug 跟踪 put + 扩容 |
| 3 | ConcurrentHashMap | 源码：putVal() 的 CAS + synchronized；实操：对比 HashMap 和 CHM 并发写入 |
| 4 | volatile + CAS | 源码：AtomicInteger compareAndSet() + Unsafe；实操：验证 volatile 不保证原子性 |
| 5 | ThreadLocal + 锁 + AQS | 源码：ReentrantLock lock()→acquire()→tryAcquire()；实操：复现死锁 + jstack 排查 |
| 6 | 线程池 | 源码：ThreadPoolExecutor execute() + addWorker()；实操：触发四种拒绝策略 |
| 8 | JVM 内存 | 实操：写递归触发 SOF + 写循环创建对象触发 OOM |
| 9 | GC | 实操：配置不同 GC 参数，用 jstat -gc 观察 |
| 10 | 类加载 | 源码：ClassLoader.loadClass()；实操：手写自定义类加载器 |
| 11 | OOM 排查 + Flink | 实操：jmap dump + MAT 分析 + jstack 死锁 + top -Hp CPU 飙高 |
| 12 | MySQL 索引 | 实操：建表 + 加索引 + Explain 对比前后 |
| 13 | MySQL 事务 + MVCC | 实操：开两个会话复现脏读/不可重复读/幻读 |
| 14 | MySQL 锁 + 慢SQL + MyBatis | 实操：写慢 SQL + Explain 分析 + 加索引优化 + 对比 |
| 16 | Redis 基础 | 源码：跳表源码思路（zslInsert）；实操：redis-cli 操作五种数据结构 + OBJECT ENCODING |
| 17 | Redis 分布式锁 | 源码：Redisson 看门狗源码（renewExpiration）；实操：用 Redisson 写分布式锁 + 断点看续期 |
| 18 | Redis 高可用 + ES | 实操：搭 Redis 主从 + 哨兵（Docker Compose）；ES 下午专项：倒排索引、分词器、跟 MySQL 对比、使用场景 |
| 19 | Spring 核心 | 源码：DefaultSingletonBeanRegistry 三级缓存；实操：IDEA debug 跟踪 Bean 创建全流程 |
| 20 | Spring 事务 + SpringBoot | 源码：@Transactional 代理源码 + DataSourceTransactionManager；实操：复现事务失效 3 种场景 |
| 21 | SpringCloud | 源码：Nacos 客户端长轮询源码（ConfigService.getConfig）；实操：搭 Nacos + 写 Feign 调用 + debug 跟踪 |
| 23 | Kafka 架构 | 实操：Docker 搭 Kafka + 命令行生产消费 |
| 24 | Kafka 可靠性 | 实操：写生产者+消费者+模拟消息丢失/重复 |
| 25 | Docker | 实操：写 Dockerfile + docker build + docker run + docker logs |
| 26 | 分布式基础 | 实操：手写令牌桶限流 + 一致性哈希 |
| 27 | 行为面试 + 短链系统设计 | 无 tier5（核心内容：行为面试 5 大问题 + 短链系统设计） |
| 28 | 项目案例打磨 + Flink 专项 | 无 tier5（专注项目案例即兴讲解 + Flink 专项） |
| 29 | 系统设计 + 模拟面试（上） | 无 tier5（专注 IM/配置中心/秒杀系统设计 + LRU/TopK 重写） |

#### 3.4.2 tier6 内容分布（跨主题扩展专题）

tier6 是 6h 深度档独有的跨主题扩展，按多个主题系列分布：

| 主题系列 | 出现 Day | 次数 | 具体内容 |
|---|---|---|---|
| **Linux 扩展专题** | 2/6/11/16/20/25 | 6 | top/free/df 基础命令；tail/grep/awk 日志查看；文件权限+软硬链接；netstat/lsof 网络排查；crontab+shell 脚本基础；性能排查（top -Hp, strace） |
| **设计模式扩展专题** | 3/8/12/17/21/26 | 6 | 单例模式 4 种写法；工厂+抽象工厂；策略+观察者；责任链+装饰器；模板方法+适配器；Spring 中用到的设计模式复盘 |
| **网络扩展专题** | 1/5/10/14/19/24 | 6 | TCP 三次握手/四次挥手；HTTP/1.1 vs HTTP/2；HTTPS 握手过程；TCP 粘包拆包；DNS/CDN/反向代理；TCP 拥塞控制 |
| **K8s 扩展专题** | 4/9/13/18/23 | 5 | Pod/Container 概念；Service/Deployment；ConfigMap/Secret；探针+滚动更新；Ingress/网络策略 |
| **系统设计加练** | 26/28 | 2 | 分布式 ID 生成器（雪花算法/号段模式/时钟回拨）；配置中心（长轮询 vs 长连接、版本管理、灰度发布） |
| **Flink 专项** | 28 | 1 | Flink 架构(JobManager/TaskManager/Slot)、批处理 vs 流处理、状态管理、项目 ETL 链路设计 |
| **分库分表 🟡 扩展** | 14 | 1 | 垂直拆分 vs 水平拆分、Sharding-JDBC / MyCat、分片键选择、跨库查询 |
| **终极大模拟** | 29 | 1 | 60 分钟完整 10 题流程 + 行为面试 + 系统设计（秒杀）+ 算法（TopK） |

> 注：Day 7/15/22/30 为复盘日（详见第七章），不配置 tier5/tier6 扩展内容；Day 27 为行为面试+系统设计专题日，核心内容已满，亦不配置扩展。

---

## 四、功能设计（16项）

### 4.1 内容结构

| # | 功能 | 决策 |
|---|---|---|
| 1 | 关键词卡片与每日任务关系 | **卡片跟天对齐** — 每天必会题绑定关键词卡片，学完即自测 |
| 2 | 复盘日聚合边界 | **按复盘区间划分** — 每个复盘日只处理自己那段的 🟡/🟢，已完成不重复 |
| 3 | 模拟题参考要点 | **折叠参考要点** — 默认隐藏，点击展开。先答再对答案 |
| 4 | 复习清单触发方式 | **Header 全局常驻按钮** — 随时生成，不依赖走到第几天 |
| 5 | 关键词卡片管理 | **按周分组 + 筛选器** — Week 1-5 分组，共 23 张卡片（非复盘日每天 1 张），筛选全部/未测/❌/已掌握 |
| 6 | 打卡断签逻辑 | **滚动 7 天窗口允许 1 天空缺** — 对应原计划弹性时间，1天空缺不断签（详见第八章） |
| 7 | 时间档位与扩展内容触发 | **3h/5h/6h 三档切换** — 3h 隐藏 tier5/tier6；5h 显示 tier5（源码深读+动手实操）；6h 显示 tier5+tier6（跨主题扩展专题）。详见 3.4 节 |

### 4.2 交互功能

| # | 功能 | 细节 |
|---|---|---|
| 8 | 自定义知识点 + 优先级标签 | 每天卡片内添加，选 🔴/🟡/🟢，纳入进度计算 |
| 9 | 🔴 阻塞型当天高亮 | 状态点变红 + 顶部提示条 |
| 10 | 模拟面试计时器 | 点击开始计时，2分钟黄、3分钟红、超时标记 ⏰ |
| 11 | 连续打卡天数 🔥 | 当天勾选 ≥1 项即打卡，滚动 7 天窗口允许 1 天豁免（详见第八章） |
| 12 | 一键生成复习清单 | Header 按钮，聚合易错+🟡未完成+卡片❌+🟢加分（详见第九章） |
| 13 | JSON 导出/导入 | Header 按钮，全量状态备份恢复 |
| 14 | 模拟题扩写为完整问题 | 30 天所有模拟题从关键词改为完整面试问题 |
| 15 | 关键词卡片自评 ✅/❌ | 翻转后点 ✅/❌，❌ 自动进入复习清单 |
| 16 | 关键词卡片用户自定义增删 | 预置不可删，自定义可删 |

> **内容规模汇总**：30 天共 23 张关键词卡片（非复盘日每天 1 张）、25 个算法题（跟天走，非复盘日每天 1 个，Day 28-29 为综合复盘无 LC 题号）、7 个项目案例、5 个系统设计案例、12 条默认易错点。

> **LC 题 URL 映射规则**：普通题走 `https://leetcode.cn/problems/{lc}`；3 个二叉树遍历题使用语义化路径——LC 144→`binary-tree-preorder-traversal`、94→`binary-tree-inorder-traversal`、145→`binary-tree-postorder-traversal`。LC 题号为 null 时不生成链接。

---

## 五、数据结构设计

```javascript
// localStorage key: 'java-interview-state'

state = {
  tasks: {          // 每日任务勾选状态
    "day1_t0": true,          // knowledge 知识点：day{N}_t{idx}
    "day1_t1": false,
    "day1_t100": true,        // mustKnow 必会题：day{N}_t{100+idx}
    "day1_t5_0": true,        // tier5 扩展内容：day{N}_t5_{idx}
    "day1_t6_0": false,       // tier6 扩展内容：day{N}_t6_{idx}
    "day7_rt0": true,         // 复盘日任务：day{N}_rt{idx}
    ...
  },
  mock: {           // 模拟题勾选状态
    "day1_m0": true,
    ...
  },
  mockTimers: {     // 模拟题计时记录
    "day1_m0": { duration: 135, status: "done" },
    ...
  },
  algo: {           // 算法题勾选状态
    "lc206": true,
    ...
  },
  errors: [         // 易错清单
    { text: "CHM 不要说成 JDK 1.8 还是 Segment", done: false },
    ...
  ],
  customKps: [      // 自定义知识点
    { id: "kp_001", day: 2, text: "(n-1) & hash 等价取模", priority: "yellow", done: false },
    { id: "kp_002", day: 2, text: "Maven 依赖冲突排查", priority: "red", done: true },
    ...
  ],
  cardEval: {       // 关键词卡片自评
    "card_day2_0": "pass",   // pass / fail / null
    "card_day5_0": "fail",
    ...
  },
  customCards: [    // 用户自定义关键词卡片
    { id: "cc_001", title: "ThreadLocal 内存泄漏", keywords: "ThreadLocalMap | 弱引用 | Entry | remove()", eval: null },
    ...
  },
  checkins: [       // 打卡记录（日期数组）
    "2026-06-23",
    "2026-06-24",
    ...
  ],
  tier: "5h",       // 当前时间档位 3h/5h/6h

  // ===== 运行时状态（UI 导航与计时器，不持久化也无妨，但 v3 会持久化） =====
  currentDay: 1,        // 当前查看的 Day
  currentView: 'day',   // 当前视图：day / overview / cards / errors / cases / design
  lastDay: 1,           // 上一次访问的 Day（用于刷新后恢复）
  expandedWeeks: [1],   // 侧边栏展开的周次列表
  timerInterval: null,  // 当前计时器 setInterval 句柄（运行时，不入库）
  timerKey: null        // 当前计时的 mock 题 key（运行时，不入库）
}
```

---

## 六、UI 布局

```
┌─────────────────────────────────────────────────────────┐
│ Header                                                   │
│ Java 面试冲刺 30 天  |  🔥12天  |  [复习清单] [导出] [导入] │
├──────────┬──────────────────────────────────────────────┤
│ Sidebar  │ Main Content                                  │
│          │                                                │
│ 路线图    │  [路线图总览 / 关键词卡片 / 易错清单 /          │
│ Day 1    │   项目案例 / 系统设计]                        │
│ Day 2    │  （算法题跟天走，内嵌在每日卡片，无独立页面）   │
│ ...      │                                                │
│ Day 30   │  Day 卡片展开：                                │
│          │  ┌──────────────────────────────────────┐    │
│          │  │ ⚠️ 今天有1个阻塞型知识点需优先处理      │    │
│ ──────── │  │                                      │    │
│ 关键词    │  │ 📌 重点知识                          │    │
│ 卡片      │  │ ☐ HashMap 底层结构                   │    │
│          │  │ ☐ put 流程                           │    │
│ 易错清单  │  │                                      │    │
│          │  │ 🎤 晚间模拟（完整问题 + 计时器）       │    │
│ 项目案例  │  │ ☐ 请详细描述 HashMap put 操作完整流程 │    │
│          │  │   [折叠参考要点 ▼]                    │    │
│          │  │                                      │    │
│          │  │ 📝 自定义知识点                       │    │
│ 系统设计  │  │ ☐ Maven 依赖冲突  🔴  ✕              │    │
│          │  │ ☐ (n-1)&hash  🟡  ✕                  │    │
│          │  │ [输入框] [🔴][🟡][🟢] [确认]          │    │
│          │  └──────────────────────────────────────┘    │
└──────────┴──────────────────────────────────────────────┘
```

---

## 七、复盘日聚合逻辑

复盘日共 4 个：Day 7 / 15 / 22 / 30（注意 Day 27 不是复盘日，它是行为面试+系统设计专题日）。

```
Day 7:  聚合 Day 1-6 的 🟡（未完成）+ 🟢（未完成）
Day 15: 聚合 Day 8-14 的 🟡（未完成）+ 🟢（未完成）
Day 22: 聚合 Day 16-21 的 🟡（未完成）+ 🟢（未完成）
Day 30: 聚合所有 🟢（未完成）

已在之前复盘日完成的，不再重复出现。
```

---

## 八、打卡逻辑

```
当天勾选 ≥1 项 → 记录当天日期到 checkins[]

计算连续天数（calcStreak）：
  从今天往回遍历，采用滚动 7 天窗口（非自然周）：
  - 每连续 7 天内允许 1 天空缺不算断签
  - 若 7 天窗口内空缺超过 1 天 → 断签归零
  - 已打卡的天数计入连续计数
```

---

## 九、复习清单生成逻辑

```
点击 [复习清单] → 弹出模态框，聚合 4 类内容：

1. 🔴 必看易错（errors 中 done=false 的）
2. 🟡 待补知识点（customKps 中 priority=yellow 且 done=false 的）
3. 📌 卡片自评 ❌（cardEval 中值为 fail 的）
4. 🟢 加分知识点（customKps 中 priority=green 且 done=false 的）

生成可打印 HTML，支持 Ctrl+P 打印。
```

> **已决定不实现**："高频未复习"（已勾选完成但距离初次完成超过 7 天的任务）——YAGNI，v1 不做。如后续验证需要可再加。

---

## 十、实现计划

1. 数据层：构建 30 天完整数据对象（含调整后的内容）
2. CSS 样式：Notion 极简风格
3. 渲染层：路线图总览 / 每日卡片 / 关键词卡片库 / 易错清单 / 项目案例 / 系统设计（算法题内嵌每日卡片，无独立页面）
4. 交互层：勾选 / 自定义知识点 / 计时器 / 打卡 / 导出导入 / 复习清单
5. 持久化：localStorage 读写
6. 测试：浏览器打开验证所有功能
