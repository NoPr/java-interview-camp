import type { PlanData } from '../types';

// 30 天冲刺计划数据（完整 30 天数据，提取自 v3 HTML）
export const PLAN: PlanData = {
  weeks: [
    { name: 'Week 1', subtitle: 'Java 基础 + 集合 + 并发', days: [1, 2, 3, 4, 5, 6, 7] },
    { name: 'Week 2', subtitle: 'JVM + MySQL + Flink + MyBatis', days: [8, 9, 10, 11, 12, 13, 14, 15] },
    { name: 'Week 3', subtitle: 'Redis + Spring + SpringCloud', days: [16, 17, 18, 19, 20, 21, 22] },
    { name: 'Week 4', subtitle: 'MQ + Docker + 分布式 + 项目打磨', days: [23, 24, 25, 26, 27] },
    { name: 'Week 5', subtitle: '项目打磨 + 系统设计 + 模拟面试 + 查漏补缺', days: [28, 29, 30] },
  ],
  reviewDays: [7, 15, 22, 30],
  reviewRanges: {
    7: [1, 6],
    15: [8, 14],
    22: [16, 21],
    30: [1, 29],
  },
  days: {
    1: {
      title: 'Java 基础总复盘',
      week: 1,
      knowledge: [
        '面向对象三大特性',
        '抽象类和接口',
        'final、static、this、super',
        'equals 和 hashCode',
        'String、StringBuilder、StringBuffer',
        'Java 8 Stream / Lambda（分组、去重、map、reduce）',
        '泛型擦除 + PECS（? extends vs ? super）',
        'Java 17 新特性：record 记录类、sealed class 密封类、pattern matching for instanceof',
      ],
      mustKnow: [
        'equals 和 == 的区别？',
        'String 为什么不可变？',
        'StringBuilder 和 StringBuffer 区别？',
        'Stream 怎么对一个 List 按字段分组去重？',
        '泛型擦除是什么？? extends 和 ? super 区别？',
        'record 和普通类区别？sealed class 解决什么问题？',
      ],
      mock: [
        {
          q: '请说明 equals 和 == 的区别，以及为什么重写 equals 必须重写 hashCode？',
          tips: '== 比较地址/基本类型值 | equals 默认也是比较地址 | 重写 equals 不重写 hashCode → HashMap 中相同值不同地址 | 约定：equals 相同则 hashCode 必须相同',
        },
        {
          q: 'String 为什么设计成不可变的？有什么好处？',
          tips: '线程安全（不可变天然线程安全）| 安全性（类加载器、URL 连接）| 缓存 hashCode（只算一次）| 字符串常量池复用',
        },
        {
          q: '用 Stream 对一个 List<User> 按 department 分组，每组按 age 降序，取前 3 个，怎么写？',
          tips: 'Collectors.groupingBy → 每组 stream().sorted().limit(3) | groupingBy + downstream collector | comparing(Comparator.reverseOrder())',
        },
        {
          q: 'Java 17 的 record 类是什么？跟普通 POJO 有什么区别？',
          tips: 'record 是不可变数据载体 | 自动生成 constructor/getter/equals/hashCode/toString | 不能继承其他类 | 适合 DTO/值对象 | 简化样板代码 | public record Point(int x, int y) {}',
        },
        {
          q: 'sealed class 密封类解决什么问题？pattern matching 怎么配合？',
          tips: 'sealed: 限制哪些类可以继承(permits) | 解决: 接口/抽象类被随意实现导致分支不可控 | 配合pattern: switch+pattern matching实现穷尽检查 | sealed interface Shape permits Circle, Square {} | switch(shape) case Circle c -> ...',
        },
      ],
      card: {
        title: 'Java 基础核心',
        keywords:
          'OOP 三特性 | equals+hashCode 约定 | String 不可变（线程安全+缓存hash） | Stream 分组去重 | 泛型擦除+PECS | Java 17 record/sealed/pattern matching',
      },
      algo: { name: '链表反转（迭代+递归）', lc: '206' },
      tier5: ['源码深读：String hashCode() 缓存、intern()', '动手实操：写代码验证 String 不可变'],
      tier6: ['扩展专题：网络——TCP 三次握手/四次挥手'],
    },
    2: {
      title: 'HashMap',
      week: 1,
      knowledge: [
        'HashMap 底层结构（数组+链表+红黑树）',
        'put 流程（hash→桶定位→链表/树插入）',
        '扩容机制（容量×0.75 负载因子）',
        '链表转红黑树（长度≥8+容量≥64）',
        '为什么线程不安全',
      ],
      mustKnow: [
        'HashMap 底层原理？',
        'HashMap 什么时候扩容？',
        'HashMap 什么时候转红黑树？',
        'HashMap 为什么线程不安全？',
      ],
      mock: [
        {
          q: '请详细描述 HashMap 的 put 操作完整流程，包括 hash 计算和冲突处理。',
          tips: 'hash = (key==null)?0:(h=key.hashCode())^(h>>>16) | (n-1)&hash 定位桶 | 空桶→直接放 | 链表→尾插法 | 红黑树→树插入 | 超过阈值→扩容',
        },
        {
          q: 'HashMap 在什么条件下会触发扩容？扩容过程是什么？',
          tips: 'size > capacity × 0.75 | 扩容为 2 倍 | JDK8：遍历桶，lo/hi 两条链拆分 | 元素位置要么不变要么+oldCap',
        },
        {
          q: 'HashMap 为什么线程不安全？并发下会出现什么具体问题？',
          tips: 'put 数据覆盖 | 扩容时数据丢失（JDK7 环形链表死循环） | size 计算不准 | 并发用 ConcurrentHashMap',
        },
      ],
      card: {
        title: 'HashMap 原理',
        keywords: '拉链法 | 数组+链表+红黑树 | put 三步（hash→桶→插入） | 扩容2倍+尾插法 | 线程不安全→用CHM',
      },
      algo: { name: '链表反转（递归版）', lc: '206' },
      tier5: ['源码深读：putVal()、resize()、treeifyBin()', '动手实操：IDEA debug 跟踪一次 put + 扩容'],
      tier6: ['扩展专题：Linux——top/free/df 基础命令'],
    },
    3: {
      title: 'ConcurrentHashMap',
      week: 1,
      knowledge: [
        'JDK 1.7 Segment 分段锁',
        'JDK 1.8 CAS + synchronized',
        'put 流程（CAS 空桶→synchronized 非空桶）',
        'size 统计（baseCount + CounterCell[]）',
        '扩容协助机制',
      ],
      mustKnow: [
        'ConcurrentHashMap 怎么保证线程安全？',
        'JDK 1.7 和 JDK 1.8 的 ConcurrentHashMap 区别？',
        'ConcurrentHashMap 读操作为什么不加锁？',
      ],
      mock: [
        {
          q: 'ConcurrentHashMap 在 JDK 1.8 中是怎么保证线程安全的？跟 1.7 有什么区别？',
          tips: '1.7: Segment[]+ReentrantLock 分段锁 | 1.8: Node[]+CAS+synchronized | 空桶→CAS | 非空桶→synchronized 链表头节点 | 去掉 Segment 层',
        },
        {
          q: 'ConcurrentHashMap 的读操作为什么不加锁？会不会读到旧数据？',
          tips: 'Node.val 和 next 用 volatile 修饰 | 写完后对其他线程立即可见 | 不会读到中间态 | 弱一致性：迭代器遍历不含后续写入',
        },
        {
          q: 'ConcurrentHashMap 的 size() 是怎么统计的？为什么不用 synchronized？',
          tips: 'baseCount + CounterCell[] 分段计数 | 无竞争→CAS baseCount | 有竞争→CAS 随机 Cell | size = baseCount + sum(Cell[]) | 思想类似 LongAdder',
        },
      ],
      card: {
        title: 'ConcurrentHashMap',
        keywords: '1.7 Segment 分段锁 | 1.8 CAS+synchronized | volatile 读不加锁 | CounterCell 分段计数 | 协助扩容',
      },
      algo: { name: '快慢指针（环检测）', lc: '141' },
      tier5: ['源码深读：putVal() 的 CAS + synchronized', '动手实操：对比 HashMap 和 CHM 并发写入'],
      tier6: ['扩展专题：设计模式——单例模式 4 种写法'],
    },
    4: {
      title: '线程基础 + volatile + CAS',
      week: 1,
      knowledge: [
        '线程生命周期（6 种状态）',
        'Java 内存模型（主内存+工作内存）',
        'volatile 可见性、有序性（禁止指令重排）',
        'CAS 原理（compareAndSet + Unsafe）',
        'ABA 问题（AtomicStampedReference）',
      ],
      mustKnow: [
        'volatile 能保证原子性吗？',
        'CAS 是什么？有什么问题？',
        'AtomicInteger 原理是什么？',
      ],
      mock: [
        {
          q: 'volatile 能保证可见性和有序性，但为什么不能保证原子性？请举例说明。',
          tips: '可见性：volatile 读直接从主内存读 | 有序性：内存屏障禁止重排 | 不保证原子性：i++ 是读-改-写三步，两个线程同时读到相同值→丢失更新 | 用 AtomicInteger 或 synchronized',
        },
        {
          q: '请解释 CAS 的原理，以及它存在什么问题，怎么解决？',
          tips: 'CAS(V,expected,new)：V==expected 则 V=new | Unsafe.compareAndSwap | 问题：ABA→加版本号 AtomicStampedReference | 自旋开销大→自旋次数限制 | 只保证一个变量原子',
        },
        {
          q: 'Java 内存模型（JMM）是怎么定义的？happens-before 规则有哪些？',
          tips: '主内存+工作内存 | 8 种原子操作 | happens-before：程序顺序|管程|volatile|线程启动|终止|中断|对象终结|传递性',
        },
      ],
      card: {
        title: 'volatile + CAS',
        keywords: '可见性(volatile) | 有序性(内存屏障) | 不保证原子性(i++丢更新) | CAS+Unsafe | ABA→版本号',
      },
      algo: { name: '快慢指针（环检测）', lc: '141' },
      tier5: ['源码深读：AtomicInteger compareAndSet() + Unsafe', '动手实操：写代码验证 volatile 不保证原子性'],
      tier6: ['扩展专题：K8s——Pod/Container 概念'],
    },
    5: {
      title: 'ThreadLocal + 锁 + AQS',
      week: 1,
      knowledge: [
        'ThreadLocal 原理（ThreadLocalMap + 弱引用 Entry）',
        'ThreadLocal 内存泄漏原因',
        'synchronized 锁升级（偏向→轻量→重量）',
        'ReentrantLock + 公平锁/非公平锁',
        'AQS 基础（state + CLH 队列）',
      ],
      mustKnow: [
        'ThreadLocal 为什么会导致内存泄漏？',
        'synchronized 和 ReentrantLock 区别？',
        'synchronized 锁升级过程？',
        'AQS 是什么？',
        '公平锁和非公平锁区别？',
      ],
      mock: [
        {
          q: 'ThreadLocal 是怎么实现线程隔离的？为什么会内存泄漏？怎么解决？',
          tips: '每个线程有 ThreadLocalMap | key 是弱引用(value 强引用) | key 被 GC 后 value 仍在→泄漏 | 解决：用完 remove() | 线程池场景更要 remove',
        },
        {
          q: 'synchronized 和 ReentrantLock 有什么区别？各自适用什么场景？',
          tips: 'synchronized: JVM 层面|自动释放|锁升级|不可中断 | ReentrantLock: API 层面|手动 unlock|可公平可响应中断可超时|Condition 精确唤醒 | 性能 JDK6 后接近',
        },
        {
          q: '请描述 AQS 的核心设计，它是怎么实现独占锁和共享锁的？',
          tips: 'state(int) + CLH 双向队列 | 独占：tryAcquire/tryRelease | 共享：tryAcquireShared/tryReleaseShared | 模板方法模式：子类重写 tryXxx | ReentrantLock/Semaphore/CountDownLatch 都基于 AQS',
        },
      ],
      card: {
        title: '锁机制 + AQS',
        keywords: 'synchronized 锁升级(偏向→轻量→重量) | ReentrantLock(API层+Condition) | AQS(state+CLH队列) | 公平 vs 非公平 | ThreadLocal 内存泄漏',
      },
      algo: { name: '快慢指针（倒数第K个）', lc: '19' },
      tier5: ['源码深读：ReentrantLock lock()→acquire()→tryAcquire()', '动手实操：写代码复现死锁 + jstack 排查'],
      tier6: ['扩展专题：网络——HTTP/1.1 vs HTTP/2'],
    },
    6: {
      title: '线程池',
      week: 1,
      knowledge: [
        '七大核心参数（corePoolSize/maxPoolSize/keepAliveTime/unit/workQueue/threadFactory/handler）',
        'execute 执行流程',
        '有界队列 vs 无界队列',
        '四种拒绝策略',
        '线程池 OOM 原因与解决',
        'CompletableFuture / ForkJoinPool',
        'Java 21 虚拟线程（Virtual Thread）与平台线程对比',
      ],
      mustKnow: [
        '线程池核心参数有哪些？',
        '线程池任务提交流程？',
        '为什么不建议用 Executors？',
        '无界队列为什么会导致 OOM？',
        '你项目里线程池 OOM 怎么解决？',
        '虚拟线程和平台线程区别？什么场景用虚拟线程？',
      ],
      mock: [
        {
          q: '请详细描述线程池的 execute() 执行流程，包括核心线程、队列、最大线程、拒绝策略的判断顺序。',
          tips: 'core < corePoolSize → 新建核心线程 | 核心满了 → 入队列 | 队列满了 → 新建非核心线程(到 max) | max 也满了 → 拒绝策略',
        },
        {
          q: '为什么不建议用 Executors.newFixedThreadPool？你在项目中遇到过什么问题？',
          tips: 'newFixedThreadPool → LinkedBlockingQueue 无界队列 → OOM | newCachedThreadPool → maxPoolSize=Integer.MAX_VALUE → 创建大量线程 | 用 ThreadPoolExecutor 手动创建 + 有界队列',
        },
        {
          q: '你项目中线程池 OOM 是怎么排查和解决的？请讲一下完整过程。',
          tips: '数据采集任务量大 | 无界队列堆积 | jmap+MAT 分析堆 dump | 堆撑爆 | 改有界队列+CallerRunsPolicy+分批提交+背压 | 压测稳定',
        },
        {
          q: 'Java 21 虚拟线程是什么？和线程池怎么选？会取代线程池吗？',
          tips: '虚拟线程: 轻量级(JVM调度,非OS线程),IO阻塞不占平台线程 | 创建: Thread.ofVirtual().start() / Executors.newVirtualThreadPerTaskExecutor() | 场景: IO密集型(高并发请求/数据库查询) | 不适合: CPU密集型 | 不会完全取代线程池,但IO密集场景优先用虚拟线程',
        },
      ],
      card: {
        title: '线程池',
        keywords: '7参数(core/max/queue/keepAlive/factory/handler) | execute流程(core→queue→max→reject) | 无界队列→OOM | 有界+CallerRunsPolicy | 项目实战OOM | Java 21虚拟线程(IO密集场景优先)',
      },
      algo: { name: '快慢指针（倒数第K个）', lc: '19' },
      tier5: ['源码深读：ThreadPoolExecutor execute() + addWorker()', '动手实操：写代码触发四种拒绝策略'],
      tier6: ['扩展专题：Linux——tail/grep/awk 日志查看'],
    },
    7: {
      title: '第 1 周复盘',
      week: 1,
      isReview: true,
      tasks: [
        '把 Day 1-6 的问题全部开口讲一遍',
        '重点复述线程池 OOM 案例',
        '整理一版"Java 并发高频题清单"',
        '开始维护"易错清单"',
        '集中处理本周 🟡 关联型知识点',
      ],
      mock: [
        {
          q: 'HashMap 和 ConcurrentHashMap 在高并发场景下怎么选？各自会出现什么问题？',
          tips: '【对应 Day 2 HashMap + Day 3 CHM】HashMap并发: 数据丢失/死循环(JDK7头插法) | CHM: 读不加锁(volatile)写CAS+synchronized | 选型: 并发必用CHM,但注意size()不精确|替代: Collections.synchronizedMap(全锁,性能差)',
        },
        {
          q: 'synchronized 和 ReentrantLock 区别？什么场景用哪个？',
          tips: '【对应 Day 5 synchronized 锁升级】synchronized: JVM层面,自动释放,锁升级(偏向→轻量→重量) | ReentrantLock: API层面,手动unlock,支持公平锁/可中断/tryLock | 场景: 简单同步用synchronized,需要超时/公平/多条件用ReentrantLock',
        },
        {
          q: '线程池核心线程数设多少？为什么不能用 Integer.MAX_VALUE？',
          tips: '【对应 Day 6 线程池 + Day 1 OOM 案例】CPU密集型: N+1 | IO密集型: 2N(或N*(1+等待/计算)) | MAX_VALUE: 无界队列堆积→OOM(线程池OOM案例) | 混合型: 拆分两个池',
        },
        {
          q: 'volatile 和 synchronized 有什么区别？volatile 能替代 synchronized 吗？',
          tips: '【对应 Day 4 volatile】volatile: 可见性+禁止重排序,不保证原子性 | synchronized: 可见性+原子性+互斥 | 替代: 不能,volatile适合状态标志(DCL单例),复合操作必须synchronized/Atomic',
        },
        {
          q: '线程池 OOM 你会怎么排查？根因和解决方案是什么？',
          tips: '【对应 Day 1 线程池 OOM 案例 + Day 6 线程池】案例复盘: 数据采集任务量大→无界队列堆积→OOM | 排查: jmap dump+MAT看队列对象 | 根因: newLinkedBlockingQueue()无界 | 解决: 有界队列+CallerRunsPolicy+分批提交+背压',
        },
      ],
    },
    8: {
      title: 'JVM 内存结构',
      week: 2,
      knowledge: [
        '程序计数器',
        '虚拟机栈（栈帧=局部变量表+操作数栈+动态链接+返回地址）',
        '本地方法栈',
        '堆（新生代 Eden+S0+S1 / 老年代）',
        '方法区 / 元空间（JDK 8+）',
        '直接内存',
      ],
      mustKnow: [
        'JVM 内存结构有哪些？',
        '堆和栈区别？',
        '什么情况下会出现 StackOverflowError / OOM？',
      ],
      mock: [
        {
          q: '请描述 JVM 的内存结构，每个区域存放什么、会抛什么异常？',
          tips: 'PC: 当前指令地址(不会OOM) | 栈: 栈帧(SOF/OOM) | 本地方法栈: native方法 | 堆: 对象(OOM) | 方法区/元空间: 类信息/常量池(OOM) | 直接内存: NIO(OOM)',
        },
        {
          q: '堆和栈有什么区别？为什么方法中定义的局部变量是线程安全的？',
          tips: '堆: 共享+对象+GC | 栈: 私有+栈帧+方法结束自动释放 | 局部变量在栈上→线程私有→天然安全 | 但引用指向的对象在堆上',
        },
        {
          q: '什么情况下会出 OOM？请列举至少 3 种场景及对应区域。',
          tips: '堆OOM: 创建大量对象 | 栈OOM: 递归太深/线程太多 | 元空间OOM: 动态生成大量类 | 直接内存OOM: NIO 大 buffer',
        },
      ],
      card: {
        title: 'JVM 内存结构',
        keywords: 'PC+栈+本地栈+堆+方法区+直接内存 | 堆=Eden+S0+S1+老年代 | 元空间JDK8+ | 栈SOF/堆OOM',
      },
      algo: { name: '二叉树前中后序遍历', lc: '144' },
      tier5: ['动手实操：写递归触发 SOF + 写循环创建对象触发 OOM'],
      tier6: ['扩展专题：设计模式——工厂 + 抽象工厂'],
    },
    9: {
      title: 'GC 与垃圾回收器',
      week: 2,
      knowledge: [
        '判断对象存活（可达性分析 + GC Roots）',
        '标记清除 / 标记复制 / 标记整理',
        '新生代（Minor GC）vs 老年代（Full GC）',
        'CMS（并发标记清除）',
        'G1（Region + SATB）',
        'ZGC（染色指针 + 读屏障）',
      ],
      mustKnow: [
        'Java 怎么判断对象是否存活？',
        '什么是 GC Roots？',
        'Minor GC 和 Full GC 区别？',
        '常见垃圾回收算法有哪些？',
        'G1 和 CMS 区别？',
      ],
      mock: [
        {
          q: 'Java 怎么判断对象是否可以回收？GC Roots 有哪些？',
          tips: '可达性分析: 从 GC Roots 搜索不可达的对象 | GC Roots: 栈中引用|静态字段|常量|JNI引用 | 两次标记: 可达?→finalize()→重新可达?',
        },
        {
          q: 'Minor GC、Major GC、Full GC 有什么区别？各发生在什么区域？',
          tips: 'Minor: 新生代(Eden满)→复制算法→频繁但快 | Major: 老年代 | Full: 整个堆→STW长 | Full GC 触发: 老年代满/元空间满/System.gc()',
        },
        {
          q: 'G1 和 CMS 有什么区别？G1 是怎么做到可预测停顿的？',
          tips: 'CMS: 老年代+并发+标记清除(碎片) | G1: 整堆Region化+标记复制(无碎片) | G1 可预测: -XX:MaxGCPauseMillis 设目标停顿 | Region 分 Eden/Survivor/Old/Humongous',
        },
      ],
      card: {
        title: 'GC 原理',
        keywords: '可达性分析+GC Roots | 标记复制(新生代) | 标记整理(老年代) | CMS(并发碎片) | G1(Region+可预测停顿)',
      },
      algo: { name: '二叉树前中后序遍历', lc: '94' },
      tier5: ['动手实操：配置不同 GC 参数，用 jstat -gc 观察'],
      tier6: ['扩展专题：K8s——Service/Deployment'],
    },
    10: {
      title: '类加载机制 + 双亲委派',
      week: 2,
      knowledge: [
        '类加载过程（加载→验证→准备→解析→初始化）',
        '双亲委派模型',
        'JDK 8: Bootstrap / Extension / Application',
        'JDK 9+: Bootstrap / Platform / Application',
        '打破双亲委派：Tomcat、SPI、线程上下文类加载器',
      ],
      mustKnow: [
        '类加载过程是什么？',
        '双亲委派模型是什么？为什么这样设计？',
        'JDK 8 和 JDK 9+ 类加载器有什么变化？',
        'Tomcat 为什么要打破双亲委派？',
      ],
      mock: [
        {
          q: '请描述类的加载过程，每个阶段做什么？',
          tips: '加载: class→方法区+Class对象 | 验证: 格式/元数据/字节码/符号引用 | 准备: 静态变量默认值 | 解析: 符号引用→直接引用 | 初始化: <clinit>() 执行赋值',
        },
        {
          q: '双亲委派模型是什么？为什么这样设计？',
          tips: '子加载器先委托父加载器 | Bootstrap→Extension→Application | 安全: 防止核心类被篡改(自定义String) | 唯一性: 同一个类只会被加载一次',
        },
        {
          q: 'Tomcat 为什么要打破双亲委派？是怎么打破的？',
          tips: 'Web 应用隔离: 同一 Tomcat 多个 Web 应用有同名类 | Tomcat 每个WebApp 有独立 ClassLoader | 先自己加载(不委托) → 找不到再委托父 | JVM 的隔离机制不够',
        },
      ],
      card: {
        title: '类加载 + 双亲委派',
        keywords: '加载→验证→准备→解析→初始化 | 双亲委派(安全+唯一) | 打破: Tomcat/SPI/TCCL | JDK9 模块化',
      },
      algo: { name: '二叉树前中后序遍历', lc: '145' },
      tier5: ['源码深读：ClassLoader.loadClass() 源码', '动手实操：手写一个自定义类加载器'],
      tier6: ['扩展专题：网络——HTTPS 握手过程'],
    },
    11: {
      title: 'OOM 排查 + JVM 工具',
      week: 2,
      knowledge: [
        'jps、jstack、jmap、jstat、MAT 基本用途',
        'OOM 排查流程（dump→MAT→定位→修复）',
        'CPU 飙高排查（top -Hp → jstack → 定位线程）',
        '死锁排查（jstack → deadlock detection）',
        'Full GC 频繁排查',
      ],
      mustKnow: [
        'OOM 排查流程？',
        'CPU 飙高怎么排查？',
        'jstack 怎么排查死锁？',
        'Full GC 频繁怎么排查？',
      ],
      mock: [
        {
          q: '线上 OOM 了，请描述你的排查流程，会用到哪些工具？',
          tips: 'jmap -dump:format=b,file=xx.pid → MAT 分析 → 定位大对象/泄漏 → 看引用链 → 修复 | jstat -gc 看 GC 频率 | 保留现场: -XX:+HeapDumpOnOutOfMemoryError',
        },
        {
          q: '线上 CPU 飙高到 100%，你怎么排查？',
          tips: 'top → 定位 Java 进程 PID | top -Hp PID → 定位高 CPU 线程 | printf "%x" tid → 十六进制 | jstack PID → 搜索线程 → 看代码栈 | 常见: 死循环/GC频繁/大量计算',
        },
        {
          q: '线上 Full GC 频繁，你怎么排查和解决？',
          tips: 'jstat -gcutil 看 FGCT/FGC | jmap dump 看老年代大对象 | 常见原因: 大对象进老年代/内存泄漏/元空间不足 | 解决: 调大堆/修复泄漏/优化对象生命周期',
        },
      ],
      card: {
        title: 'OOM 排查 + JVM 工具',
        keywords: 'jmap+MAT dump分析 | top -Hp CPU排查 | jstack 死锁 | jstat -gc GC监控 | Full GC排查(老年代大对象)',
      },
      algo: { name: '二叉树层序遍历（BFS）', lc: '102' },
      tier5: ['动手实操：jmap dump + MAT 分析 + jstack 死锁 + top -Hp CPU 飙高'],
      tier6: ['扩展专题：Linux——文件权限 + 软硬链接'],
    },
    12: {
      title: 'MySQL 索引',
      week: 2,
      knowledge: [
        'B+ 树（非叶子节点不存数据→扇出大→IO 少）',
        '聚簇索引（叶子节点存整行数据）',
        '二级索引（叶子节点存主键→回表）',
        '覆盖索引（索引包含查询所有列→不回表）',
        '最左前缀原则',
        '索引失效场景',
      ],
      mustKnow: [
        'MySQL 为什么用 B+ 树？',
        '什么是回表？',
        '什么是覆盖索引？',
        '联合索引为什么遵循最左前缀？',
      ],
      mock: [
        {
          q: 'MySQL 为什么用 B+ 树而不是 B 树或红黑树？',
          tips: 'B+ vs B: 非叶子不存数据→扇出大→3层可存千万级 | 叶子链表→范围查询快 | 红黑树: 二叉→高度太大→IO 太多 | Hash: 不支持范围查询',
        },
        {
          q: '什么是回表？怎么避免回表？',
          tips: '二级索引叶子存主键 → 拿主键回聚簇索引查整行 | 避免方法: 覆盖索引(索引包含查询所有列) | Explain Extra: Using index',
        },
        {
          q: '联合索引 (a,b,c) 遵循最左前缀原则是什么意思？哪些场景会失效？',
          tips: '能命中: a | a,b | a,b,c | 不能命中: b | b,c | a,c(只用到a) | 失效: 函数运算/类型隐式转换/LIKE 左%/OR/!= ',
        },
      ],
      card: {
        title: 'MySQL 索引',
        keywords: 'B+树(扇出大+叶子链表) | 聚簇(存行) vs 二级(存主键→回表) | 覆盖索引(不回表) | 最左前缀 | 索引失效',
      },
      algo: { name: '二叉树层序遍历（BFS）', lc: '102' },
      tier5: ['动手实操：建表 + 加索引 + Explain 对比前后'],
      tier6: ['扩展专题：设计模式——策略 + 观察者'],
    },
    13: {
      title: 'MySQL 事务 + MVCC',
      week: 2,
      knowledge: [
        'ACID（原子性/一致性/隔离性/持久性）',
        '四种隔离级别（RU/RC/RR/Serializable）',
        '脏读、不可重复读、幻读',
        'MVCC（多版本并发控制）',
        'Read View（一致性视图）',
        'undo log 版本链',
        '当前读 vs 快照读',
      ],
      mustKnow: [
        'MySQL 事务隔离级别有哪些？',
        'MVCC 原理是什么？',
        'Read View 是什么？',
        '可重复读怎么解决不可重复读？',
      ],
      mock: [
        {
          q: 'MySQL 的四种事务隔离级别分别解决了什么问题？InnoDB 默认是哪个？',
          tips: 'RU: 脏读 | RC: 不可重复读 | RR: 幻读(InnoDB 间隙锁解决) | Serializable: 全锁 | InnoDB 默认 RR | 可重复读+MVCC+间隙锁',
        },
        {
          q: '请详细描述 MVCC 的原理，Read View 是怎么工作的？',
          tips: '每行隐藏列: trx_id(最后修改事务ID) + roll_pointer(指向undo log) | Read View: 活跃事务ID数组 | 判断: trx_id < min → 可见 | trx_id > max → 不可见 | 在数组中 → 不可见(回滚链找)',
        },
        {
          q: '当前读和快照读有什么区别？各在什么场景下使用？',
          tips: '快照读: 普通 SELECT → MVCC 读旧版本 | 当前读: SELECT...FOR UPDATE/UPDATE/DELETE → 读最新+加锁 | RR 下快照读用第一次读时的 Read View',
        },
      ],
      card: {
        title: 'MVCC',
        keywords: '隐藏列 trx_id+roll_ptr | Read View 活跃事务数组 | undo log 版本链 | 快照读(MVCC) vs 当前读(加锁) | RR用首次ReadView',
      },
      algo: { name: '二叉树最大深度', lc: '104' },
      tier5: ['动手实操：开两个会话，手动复现脏读/不可重复读/幻读'],
      tier6: ['扩展专题：K8s——ConfigMap/Secret'],
    },
    14: {
      title: 'MySQL 锁 + 慢SQL + MyBatis',
      week: 2,
      knowledge: [
        '表锁、行锁、间隙锁、临键锁',
        '死锁排查（SHOW ENGINE INNODB STATUS）',
        'Explain 字段（type/key/rows/Extra）',
        '慢 SQL 优化流程',
        'MyBatis: #{} vs ${}、一级/二级缓存、插件机制',
        'MyBatis-Plus 特性',
      ],
      mustKnow: [
        'MySQL 有哪些锁？',
        '什么是间隙锁？',
        '慢 SQL 怎么排查？',
        'Explain 主要看哪些字段？',
        'MyBatis #{} 和 ${} 区别？',
      ],
      mock: [
        {
          q: 'MySQL 有哪些锁？行锁、间隙锁、临键锁分别锁的是什么？',
          tips: '表锁: 锁整表 | 行锁: 锁索引记录 | 间隙锁: 锁记录之间的间隙(防幻读) | 临键锁: 行锁+间隙锁(左开右闭) | InnoDB RR 默认临键锁',
        },
        {
          q: '线上接口响应慢，你怎么排查慢 SQL？Explain 主要看哪些字段？',
          tips: '慢查询日志定位 → Explain → type(ALL/index/range/ref/eq_ref/const) | key(走了哪个索引) | rows(扫描行数) | Extra(Using index覆盖/Using filesort/Using temporary) | 优化: 加索引/覆盖索引/改SQL',
        },
        {
          q: 'MyBatis 中 #{} 和 ${} 有什么区别？一级缓存和二级缓存的区别？',
          tips: '#{}: PreparedStatement 占位符(防注入) | ${}: 字符串拼接(SQL注入风险,用于表名/列名) | 一级缓存: SqlSession 级别(默认开启) | 二级缓存: Mapper 级别(需配置,跨 Session)',
        },
      ],
      card: {
        title: 'MySQL 锁 + MyBatis',
        keywords: '行锁/间隙锁/临键锁 | Explain type+rows+Extra | #{}(防注入) vs ${}(拼接) | 一级(Session)+二级(Mapper)缓存',
      },
      algo: { name: '二叉树最大深度', lc: '104' },
      tier5: ['动手实操：写慢 SQL + Explain 分析 + 加索引优化 + 对比'],
      tier6: [
        '扩展专题：网络——TCP 粘包拆包',
        '🟡 扩展了解：分库分表（垂直拆分 vs 水平拆分）、Sharding-JDBC / MyCat、分片键选择、跨库查询',
      ],
    },
    15: {
      title: '第 2 周复盘',
      week: 2,
      isReview: true,
      tasks: [
        '整理一个 OOM 排查案例（关键词卡片）',
        '整理一个慢 SQL 优化案例（关键词卡片）',
        '开口复述 JVM + MySQL 高频题',
        '集中处理本周 🟡 关联型知识点',
      ],
      mock: [
        {
          q: '双亲委派模型是什么？Tomcat 为什么要打破？',
          tips: '委托父加载器→安全+唯一 | Tomcat WebApp 隔离→先自己加载',
        },
        {
          q: 'OOM 排查流程？用到什么工具？',
          tips: 'jmap dump→MAT→引用链→修复',
        },
        {
          q: 'MySQL 索引失效场景有哪些？',
          tips: '函数/类型转换/LIKE左%/OR/!= ',
        },
        {
          q: 'MVCC 原理？Read View 怎么判断可见性？',
          tips: 'trx_id+roll_ptr+undo链 | 活跃事务数组判断',
        },
        {
          q: '分库分表方案？分片键怎么选？跨库 join 怎么解决？',
          tips: '垂直(按业务) vs 水平(按哈希/范围) | 分片键: 用户ID/订单ID | 跨库: 应用层join/冗余/数据同步',
        },
      ],
    },
    16: {
      title: 'Redis 基础和缓存问题',
      week: 3,
      knowledge: [
        '五种数据结构（String/Hash/List/Set/ZSet）',
        '底层数据结构（跳表、压缩列表、SDS）',
        '缓存穿透（查不存在的 key）',
        '缓存击穿（热点 key 过期）',
        '缓存雪崩（大量 key 同时过期）',
        '布隆过滤器',
        '淘汰策略（allkeys-lru/volatile-lru/LFU 4.0+）',
      ],
      mustKnow: [
        'Redis 常用数据结构？',
        'ZSet 底层是什么？',
        '缓存穿透 / 击穿 / 雪崩怎么解决？',
        'Redis 内存满了怎么办？',
      ],
      mock: [
        {
          q: 'Redis 常用数据结构有哪些？ZSet 底层是怎么实现的？',
          tips: 'String(SDS) | Hash(ziplist/hashtable) | List(quicklist) | Set(intset/hashtable) | ZSet(ziplist/listpack + dict+skiplist) | 跳表: 多层链表→O(logN) 查找 | 小对象压缩/大对象 dict+skiplist',
        },
        {
          q: '缓存穿透、击穿、雪崩分别是什么？怎么解决？',
          tips: '穿透(查不存在): 布隆过滤器/缓存空值 | 击穿(热点key过期): 互斥锁/热点永不过期 | 雪崩(大量过期): 过期时间加随机值/多级缓存/限流降级',
        },
        {
          q: 'Redis 内存满了怎么办？淘汰策略有哪些？',
          tips: 'noeviction(不淘汰,报错) | allkeys-lru(所有keyLRU) | volatile-lru(有过期LRU) | allkeys-lfu/volatile-lfu(4.0+) | allkeys-random/volatile-random | volatile-ttl | 不要只说LRU→区分allkeys vs volatile+LFU',
        },
      ],
      card: {
        title: 'Redis 基础',
        keywords: '5种类型 | ZSet=跳表+dict | 穿透(布隆)/击穿(互斥锁)/雪崩(随机过期) | 淘汰:allkeys-lru/lfu/volatile',
      },
      algo: { name: '滑动窗口：最长无重复子串', lc: '3' },
      tier5: [
        '源码深读：Redis 跳表源码思路（zslInsert）',
        '动手实操：redis-cli 操作五种数据结构 + OBJECT ENCODING 看底层',
      ],
      tier6: ['扩展专题：Linux——netstat/lsof 网络排查'],
    },
    17: {
      title: 'Redis 分布式锁 + 一致性',
      week: 3,
      knowledge: [
        'set nx ex（原子加锁+过期）',
        '锁过期问题（业务执行超过锁过期时间）',
        '看门狗机制（Redisson 自动续期）',
        '缓存和数据库双写一致性',
        '延迟双删',
        'Canal 订阅 binlog / MQ 异步同步',
      ],
      mustKnow: [
        'Redis 分布式锁怎么实现？',
        'Redis 锁误删怎么办？',
        '缓存和数据库不一致怎么办？',
        '先删缓存还是先更新数据库？',
      ],
      mock: [
        {
          q: 'Redis 分布式锁怎么实现？有什么问题？Redisson 是怎么解决的？',
          tips: 'SET key value NX EX 30 → 原子加锁 | 问题1: 锁过期但业务没执行完→看门狗续期(Redisson renewExpiration 每10s续到30s) | 问题2: 释放别人的锁→value=UUID+Lua脚本判断再删',
        },
        {
          q: '缓存和数据库双写一致性怎么保证？先删缓存还是先更新数据库？',
          tips: '先删缓存→问题:删后另一线程读旧值写回缓存→不一致 | 先更新DB→问题:删缓存失败→不一致 | 延迟双删: 更新DB→删缓存→sleep→再删 | 终极: Canal订阅binlog→MQ→异步删缓存',
        },
        {
          q: '你项目中 Redis 分布式锁是怎么用的？遇到过什么问题？',
          tips: 'Redisson+看门狗 | 锁误删(UUID+Lua) | 业务超时续期 | 集群模式: RedLock(多数节点加锁成功)',
        },
      ],
      card: {
        title: '分布式锁 + 一致性',
        keywords: 'SET NX EX | 看门狗续期 | UUID+Lua防误删 | 先更新DB+延迟双删 | Canal+MQ异步删缓存',
      },
      algo: { name: '滑动窗口：最长无重复子串', lc: '3' },
      tier5: [
        '源码深读：Redisson 看门狗源码思路（renewExpiration）',
        '动手实操：用 Redisson 写分布式锁 + 断点看续期',
      ],
      tier6: ['扩展专题：设计模式——责任链 + 装饰器'],
    },
    18: {
      title: 'Redis 高可用 + Elasticsearch',
      week: 3,
      knowledge: [
        'RDB（快照）vs AOF（追加日志）',
        '主从复制（全量+增量）',
        '哨兵 Sentinel（监控+自动故障转移）',
        'Cluster（16384 槽位 + 一致性哈希）',
        '大 key / 热 key 处理',
        'ES: 倒排索引、分词、跟 MySQL 对比、使用场景',
      ],
      mustKnow: [
        'RDB 和 AOF 区别？',
        'Redis 主从复制原理？',
        '哨兵机制是什么？',
        'Redis Cluster 怎么分片？',
        'ES 倒排索引原理？',
      ],
      mock: [
        {
          q: 'Redis RDB 和 AOF 有什么区别？怎么选？',
          tips: 'RDB: 二进制快照|体积小|恢复快|可能丢数据 | AOF: 命令日志|数据安全|体积大|恢复慢 | 4.0+: 混合持久化(RDB+AOF) | 生产: AOF+everysec',
        },
        {
          q: 'Redis 哨兵机制是什么？主节点挂了怎么自动切换？',
          tips: '监控: 哨兵 ping 主从 | 主观下线: 单个哨兵认为 | 客观下线: 多数哨兵同意 | 选举 leader 哨兵 | 选新主: 优先级→偏移量→runid | 通知客户端',
        },
        {
          q: 'ES 的倒排索引是什么？跟 MySQL 的 B+ 树索引有什么区别？',
          tips: '倒排: 分词→term→文档ID列表 | 正排(B+树): 文档→字段值 | ES: 全文搜索/模糊匹配/相关性评分 | MySQL: 精确匹配/范围查询/事务 | 场景: 搜索用ES,业务用MySQL',
        },
      ],
      card: {
        title: 'Redis 高可用 + ES',
        keywords: 'RDB快照 vs AOF日志 | 主从+哨兵(故障转移) | Cluster 16384槽 | 大key拆分+热key多级 | ES倒排索引(分词→term→docID)',
      },
      algo: { name: '二分查找（查找插入位置）', lc: '35' },
      tier5: [
        '动手实操：搭 Redis 主从 + 哨兵（Docker Compose）',
        'ES 下午专项：倒排索引、分词器、跟 MySQL 对比、使用场景',
      ],
      tier6: ['扩展专题：K8s——探针 + 滚动更新'],
    },
    19: {
      title: 'Spring 核心',
      week: 3,
      knowledge: [
        'IOC / DI（控制反转/依赖注入）',
        'Bean 生命周期（实例化→属性填充→初始化→使用→销毁）',
        'AOP（动态代理 JDK/CGLIB）',
        '循环依赖 + 三级缓存',
        'Spring MVC 流程',
        'Spring 设计模式',
      ],
      mustKnow: [
        'Spring IOC 是什么？',
        'Bean 生命周期？',
        'Spring AOP 原理？',
        'Spring 怎么解决循环依赖？',
        'Spring MVC 请求处理流程？',
      ],
      mock: [
        {
          q: '请描述 Spring Bean 的完整生命周期，包括 BeanPostProcessor 的作用。',
          tips: '实例化→属性填充(setter/字段)→BeanNameAware/BeanFactoryAware→BeanPostProcessor.before→InitializingBean.afterPropertiesSet/init-method→BeanPostProcessor.after→使用→DisposableBean.destroy/destroy-method',
        },
        {
          q: 'Spring 是怎么解决循环依赖的？三级缓存分别存什么？为什么要三级？',
          tips: 'singletonObjects(成品) + earlySingletonObjects(半成品,未代理) + singletonFactories(ObjectFactory,可创建代理) | A 依赖 B, B 依赖 A: A 实例化→放三级缓存→填充B→B 实例化→填充A→三级缓存拿A→放二级→B 完成→A 完成 | 三级: 处理 AOP 代理',
        },
        {
          q: 'Spring AOP 是怎么实现的？JDK 动态代理和 CGLIB 有什么区别？',
          tips: 'JDK: 接口+Proxy+InvocationHandler | CGLIB: 继承+MethodInterceptor+ASM生成子类 | Spring: 有接口用JDK,没接口用CGLIB | AOP: 拦截器链+ReflectiveMethodInvocation',
        },
      ],
      card: {
        title: 'Spring 核心',
        keywords: 'IOC(DI容器) | Bean生命周期(实例化→填充→初始化→销毁) | AOP(JDK代理/CGLIB) | 三级缓存解循环依赖 | MVC(DispatcherServlet)',
      },
      algo: { name: '二分查找（查找插入位置）', lc: '35' },
      tier5: [
        '源码深读：Spring DefaultSingletonBeanRegistry 三级缓存源码',
        '动手实操：IDEA debug 跟踪 Bean 创建全流程',
      ],
      tier6: ['扩展专题：网络——DNS/CDN/反向代理'],
    },
    20: {
      title: 'Spring 事务 + SpringBoot',
      week: 3,
      knowledge: [
        '事务传播行为（REQUIRED/REQUIRES_NEW/NESTED 等 7 种）',
        '事务失效场景（自调用/非 public/异常被吞/非 RuntimeException）',
        'SpringBoot 自动配置原理（@EnableAutoConfiguration → spring.factories）',
        'Starter 原理',
        'SpringBoot 启动流程',
      ],
      mustKnow: [
        'Spring 事务什么时候失效？',
        '事务传播行为有哪些？',
        'SpringBoot 自动配置原理？',
        'SpringBoot 启动流程？',
      ],
      mock: [
        {
          q: 'Spring 事务在什么情况下会失效？请列举至少 3 种场景。',
          tips: '自调用(this.xxx不走代理) | 非 public 方法 | 异常被 try-catch 吞掉 | 抛 checked exception(默认只回滚 RuntimeException) | 数据库不支持事务(MyISAM) | 传播行为 NOT_SUPPORTED',
        },
        {
          q: 'Spring 事务传播行为有哪些？REQUIRED 和 REQUIRES_NEW 的区别？',
          tips: 'REQUIRED(默认): 有就加入,没有就新建 | REQUIRES_NEW: 总是新建,挂起当前 | NESTED: 嵌套(子事务可独立回滚,父回滚子也回滚) | SUPPORTS/MANDATORY/NOT_SUPPORTED/NEVER',
        },
        {
          q: 'SpringBoot 自动配置是怎么实现的？',
          tips: '@SpringBootApplication→@EnableAutoConfiguration→AutoConfigurationImportSelector→读 META-INF/spring.factories→@Conditional 条件注入 | starter: 依赖+自动配置类+spring.factories',
        },
      ],
      card: {
        title: 'Spring 事务 + Boot',
        keywords: '传播(REQUIRED/REQUIRES_NEW/NESTED) | 失效(自调用/非public/吞异常) | Boot自动配置(spring.factories+@Conditional) | Starter',
      },
      algo: { name: '二分查找（查找第一个/最后一个）', lc: '34' },
      tier5: [
        '源码深读：@Transactional 代理源码 + DataSourceTransactionManager',
        '动手实操：写代码复现事务失效 3 种场景',
      ],
      tier6: ['扩展专题：Linux——crontab + shell 脚本基础'],
    },
    21: {
      title: 'SpringCloud / Nacos / Feign / Gateway',
      week: 3,
      knowledge: [
        'Nacos 注册发现（临时实例 AP / 永久实例 CP）',
        'Nacos 配置中心长轮询',
        'OpenFeign 调用链路（动态代理→负载均衡→HTTP）',
        'Gateway 路由（Predicate + Filter）',
        'Sentinel 限流熔断',
      ],
      mustKnow: [
        'Nacos 配置监听长轮询机制？',
        'Nacos 服务发现流程？',
        'Nacos 挂了服务还能调用吗？',
        'OpenFeign 调用链路？',
        'Gateway 工作原理？',
      ],
      mock: [
        {
          q: 'Nacos 配置中心的长轮询机制是怎么实现的？跟短轮询和长连接有什么区别？',
          tips: '客户端发起长轮询请求→服务端 hold 29.5s→配置变更立即返回→否则超时返回空→客户端拉取新配置 | vs 短轮询: 减少无效请求 | vs WebSocket: 更简单,无需维护连接 | 客户端本地缓存+MD5校验',
        },
        {
          q: 'Nacos 挂了服务之间还能调用吗？为什么？',
          tips: '能(短期) | 客户端本地缓存了服务列表 | Feign+Ribbon 从本地缓存取实例→直接 HTTP 调用 | 但新服务上线/下线感知不到 | Nacos AP 模式: 临时实例心跳→Distro 协议同步',
        },
        {
          q: '请描述 OpenFeign 的一次完整调用链路。',
          tips: '@FeignClient→动态代理→拦截请求→编码→Ribbon/LoadBalancer 负载均衡选实例→HTTP 调用(OkHttp/HttpClient)→解码→返回 | 整合 Sentinel: 熔断降级 | 整合 Nacos: 服务发现',
        },
      ],
      card: {
        title: 'SpringCloud',
        keywords: 'Nacos(注册AP/配置长轮询29.5s) | OpenFeign(代理→LB→HTTP) | Gateway(Predicate+Filter) | Sentinel(限流熔断)',
      },
      algo: { name: '二分查找（查找第一个/最后一个）', lc: '34' },
      tier5: [
        '源码深读：Nacos 客户端长轮询源码（ConfigService.getConfig）',
        '动手实操：搭 Nacos + 写 Feign 调用 + debug 跟踪',
      ],
      tier6: ['扩展专题：设计模式——模板方法 + 适配器'],
    },
    22: {
      title: '第 3 周复盘',
      week: 3,
      isReview: true,
      tasks: [
        '整理 Redis 缓存一致性案例（关键词卡片）',
        '整理 Nacos 长轮询回答',
        '整理 OpenFeign + Gateway 调用链路',
        '开口复述 Spring 高频题',
        '集中处理本周 🟡 关联型知识点',
      ],
      mock: [
        {
          q: 'Redis 淘汰策略有哪些？不要只说 LRU。',
          tips: 'noeviction/allkeys-lru/volatile-lru/allkeys-lfu/volatile-lfu/allkeys-random/volatile-random/volatile-ttl',
        },
        {
          q: '缓存和数据库一致性怎么保证？',
          tips: '先更新DB+延迟双删 | Canal+MQ 异步删 | 最终一致',
        },
        {
          q: 'Spring Bean 生命周期？',
          tips: '实例化→填充→初始化→使用→销毁 | BeanPostProcessor',
        },
        {
          q: 'Spring 事务失效场景？',
          tips: '自调用/非public/吞异常/checked exception',
        },
        {
          q: 'Nacos 长轮询机制？',
          tips: 'hold 29.5s→变更立即返回→本地缓存+MD5',
        },
      ],
    },
    23: {
      title: 'MQ 基础 + Kafka 架构',
      week: 4,
      knowledge: [
        'MQ 作用（解耦/削峰/异步）+ 缺点（系统复杂度/可用性/一致性）',
        'Kafka 架构（Broker/Topic/Partition/Replica）',
        '分区副本机制（Leader/Follower/ISR）',
        '消费者组 + Rebalance',
        'Kafka 高性能原因（顺序写/零拷贝/PageCache）',
      ],
      mustKnow: [
        '为什么使用 MQ？',
        'MQ 有什么缺点？',
        'Kafka 分区和副本机制？',
        'Kafka 消费者组 rebalance 怎么触发？',
        'Kafka 为什么快？',
      ],
      mock: [
        {
          q: '为什么要用 MQ？引入 MQ 会带来什么问题？',
          tips: '优点: 解耦/削峰/异步 | 缺点: 系统复杂度↑/可用性↓(MQ挂了)/一致性问题(消息丢失/重复)/消费顺序问题',
        },
        {
          q: 'Kafka 的分区、副本、ISR 是什么？Leader 挂了怎么选新 Leader？',
          tips: 'Partition: 并行度单位 | Replica: 每个 Partition 有多个副本(1 Leader+N Follower) | ISR: 跟上 Leader 的副本集合 | Leader 挂: 从 ISR 中选第一个 | HW(高水位): 保证消费者只看到已同步的消息',
        },
        {
          q: 'Kafka 为什么这么快？',
          tips: '顺序写磁盘(append,比随机写快) | 零拷贝(sendfile,数据不进用户空间) | PageCache(利用OS页缓存) | 批量发送+压缩 | 分区并行',
        },
      ],
      card: {
        title: 'Kafka 架构',
        keywords: 'Partition并行 | Replica(Leader+Follower+ISR) | 消费者组rebalance | 顺序写+零拷贝+PageCache→高性能',
      },
      algo: { name: 'LRU 缓存设计', lc: '146' },
      tier5: ['动手实操：Docker 搭 Kafka + 命令行生产消费'],
      tier6: ['扩展专题：K8s——Ingress/网络策略'],
    },
    24: {
      title: 'Kafka 可靠性',
      week: 4,
      knowledge: [
        '消息丢失（生产者 acks=all + 消费者手动提交 + Broker 副本）',
        '重复消费（幂等生产者 + 消费者幂等）',
        '消息积压（扩消费者 + 并行消费 + 增加 Partition）',
        '顺序消息（单分区）',
        'exactly-once 语义（幂等 + 事务）',
        'offset 管理和重复消费',
      ],
      mustKnow: [
        'Kafka 消息丢失怎么办？',
        'Kafka 重复消费怎么办？',
        'Kafka 消息积压怎么办？',
        '如何保证 Kafka 消息顺序？',
        'Kafka exactly-once 怎么实现？',
      ],
      mock: [
        {
          q: 'Kafka 消息丢失可能发生在哪些环节？怎么防止？',
          tips: '生产者: acks=all + 重试 + min.insync.replicas≥2 | Broker: 副本+ISR | 消费者: 手动提交 offset(不用自动) | 关闭 unclean.leader.election(不允许落后副本当Leader)',
        },
        {
          q: '你项目中 Kafka 消息积压是怎么解决的？',
          tips: '消费速度跟不上生产 | 生产者 acks=0 丢消息→改 acks=all | 消费者 rebalance 耗时→优化 | 临时扩消费者+并行消费(需增加Partition) | 幂等+offset 提交策略',
        },
        {
          q: 'Kafka 怎么实现 exactly-once 语义？',
          tips: '幂等生产者: PID+seq(单分区内不重不漏) | 事务: producer+offset+consumer 一起提交(TxnManager) | 消费者: read_committed 隔离级别 | 跨会话跨分区原子写',
        },
      ],
      card: {
        title: 'Kafka 可靠性',
        keywords: 'acks=all+min.insync.replicas | 幂等生产者(PID+seq) | 积压→扩消费者+并行 | 顺序→单分区 | exactly-once→事务',
      },
      algo: { name: 'LRU 缓存设计', lc: '146' },
      tier5: ['动手实操：写生产者+消费者+模拟消息丢失/重复'],
      tier6: ['扩展专题：网络——TCP 拥塞控制'],
    },
    25: {
      title: 'Docker',
      week: 4,
      knowledge: [
        '镜像 vs 容器',
        'Dockerfile（FROM/RUN/COPY/ADD/ENV/EXPOSE/CMD/ENTRYPOINT）',
        'CMD vs ENTRYPOINT',
        '容器日志（docker logs）',
        'docker exec 进入容器',
        '容器 CPU 飙高排查',
      ],
      mustKnow: [
        'Docker 镜像和容器区别？',
        'CMD 和 ENTRYPOINT 区别？',
        'JVM 参数应该写在哪里？',
        '容器 CPU 飙高怎么排查？',
      ],
      mock: [
        {
          q: 'Docker 镜像和容器是什么关系？',
          tips: '镜像: 只读模板(分层存储) | 容器: 镜像的运行实例(可读写层) | 类比: 镜像=类, 容器=对象 | 一个镜像可启动多个容器',
        },
        {
          q: 'CMD 和 ENTRYPOINT 有什么区别？使用时有什么坑？',
          tips: 'CMD: 容器启动默认命令,可被 docker run 后参数覆盖 | ENTRYPOINT: 固定入口,参数追加而非覆盖 | 坑: CMD 易被覆盖→重要命令用 ENTRYPOINT | JVM 参数: 通过 JAVA_OPTS 环境变量,启动脚本 ENTRYPOINT 读取 | ENV 是环境变量不是 JVM 参数',
        },
        {
          q: 'Docker 容器 CPU 飙高怎么排查？',
          tips: 'docker stats 看容器资源 | docker top 看容器内进程 | docker exec → top/ps | jstack 看线程栈 | 常见: 死循环/GC频繁/线程过多 | -m 限制内存+--cpus 限制CPU',
        },
      ],
      card: {
        title: 'Docker',
        keywords: '镜像(只读分层) vs 容器(可写层) | CMD(可覆盖) vs ENTRYPOINT(追加) | JAVA_OPTS传JVM参数 | docker stats+exec排查',
      },
      algo: { name: 'TopK 问题（堆/快速选择）', lc: '215' },
      tier5: ['动手实操：写 Dockerfile + docker build + docker run + docker logs'],
      tier6: ['扩展专题：Linux——性能排查（top -Hp, strace）'],
    },
    26: {
      title: '分布式基础',
      week: 4,
      knowledge: [
        '分布式锁（Redis/Zookeeper）',
        '分布式事务（2PC/TCC/SAGA/本地消息表/Seata AT）',
        '幂等设计（唯一索引/token/状态机/乐观锁）',
        'CAP / BASE 理论',
        '限流算法（令牌桶/漏桶/滑动窗口）',
        '一致性哈希 + 虚拟节点',
      ],
      mustKnow: [
        '什么是接口幂等？',
        '分布式锁怎么实现？',
        '分布式事务怎么解决？',
        'CAP 和 BASE 理论？',
        '限流有哪些算法？',
        '一致性哈希解决什么问题？',
      ],
      mock: [
        {
          q: '什么是接口幂等？怎么设计一个幂等接口？',
          tips: '幂等: 多次调用结果一致 | 方案: 唯一索引(防重)|token 机制(先获取token,提交时校验)|状态机(只能往前流转)|乐观锁(version)|分布式锁 | 场景: 支付/下单/消息消费',
        },
        {
          q: '分布式事务有哪些解决方案？你项目中用的哪种？',
          tips: '2PC(强一致,阻塞) | TCC(补偿,复杂) | SAGA(长事务,补偿) | 本地消息表(最终一致) | Seata AT(反向SQL回滚,无侵入) | MQ事务消息 | 项目: 本地消息表+MQ最终一致',
        },
        {
          q: 'CAP 和 BASE 理论是什么？限流有哪些算法？',
          tips: 'CAP: 一致性+可用性+分区容错(三选二) | BASE: 基本可用+软状态+最终一致 | 限流: 令牌桶(匀速+突发)|漏桶(匀速)|滑动窗口(计数) | Sentinel 默认滑动窗口',
        },
      ],
      card: {
        title: '分布式基础',
        keywords: '幂等(唯一索引/token/状态机) | 分布式事务(2PC/TCC/SAGA/Seata AT/本地消息表) | CAP+BASE | 限流(令牌桶/漏桶/滑动窗口) | 一致性哈希',
      },
      algo: { name: 'TopK 问题（堆/快速选择）', lc: '215' },
      tier5: ['动手实操：手写令牌桶限流 + 一致性哈希'],
      tier6: [
        '扩展专题：设计模式——Spring 中用到的设计模式复盘',
        '系统设计加练：分布式 ID 生成器（雪花算法/号段模式/时钟回拨）',
      ],
    },
    27: {
      title: '行为面试 + 短链系统设计',
      week: 4,
      knowledge: [
        '行为面试 5 大问题（挑战/分歧/换工作/新技术/职业规划）',
        '系统设计四维分析法（数据量→存储→一致性→容错）',
        '短链系统设计',
      ],
      mustKnow: [
        '讲一件你做过最有挑战的事',
        '你和同事有过技术分歧吗？怎么解决的？',
        '你为什么想换工作？',
        '短链系统怎么设计？',
      ],
      mock: [
        {
          q: '请讲一件你做过的最有挑战的事。',
          tips: 'STAR 法则: Situation→Task→Action→Result | 挑战: 多源异构数据统一接入(7种关系型+3种文件) | Action: 策略模式+模板方法+Seatunnel 多线程分片 | Result: 新增数据源只需实现类',
        },
        {
          q: '你为什么想换工作？',
          tips: '正面表达: 追求更大挑战/技术成长/更好的团队 | 不说: 薪资/抱怨前公司/人际关系 | 关联: 目标公司的技术栈/业务方向',
        },
        {
          q: '设计一个短链系统，日均 1 亿次生成。',
          tips: '数据量: 1亿/天,每条6字符 | 存储: MySQL存映射(短码→长URL),Redis缓存热点 | 发号器: Snowflake/号段 → 转62进制(6字符=620亿) | 容错: 短链过期+防重+限流 | 跳转: 302重定向(统计点击)',
        },
        {
          q: '你和同事有过技术分歧吗？怎么解决的？',
          tips: '数据驱动: 对比方案优劣势 | 求同存异: 找共同目标 | 妥协: 小事让步大事坚持 | 不要说: 我是对的他是错的',
        },
      ],
    },
    28: {
      title: '项目案例打磨 + Flink 专项',
      week: 5,
      knowledge: [
        'Flink 架构（JobManager/TaskManager/Slot）',
        '批处理 vs 流处理',
        '状态管理',
        '项目 ETL 链路设计（SPI 机制 17 种节点动态加载）',
        '7 个项目案例关键词卡片即兴讲解',
      ],
      mustKnow: [
        'Flink 架构核心组件？',
        'Flink 批流处理区别？',
        '你项目中 Flink ETL 链路怎么设计的？',
        '项目案例能即兴讲 2 分钟吗？',
      ],
      mock: [
        {
          q: '请描述你项目中 Flink ETL 链路的设计，SPI 机制是怎么实现的？',
          tips: 'Flink BATCH 模式 | DAG 调度 | SPI 机制 17 种 ETL 节点动态加载 | 新增节点无需修改框架 | 策略模式+模板方法',
        },
        {
          q: '请即兴讲解"线程池 OOM"项目案例（2 分钟内）。',
          tips: '数据采集任务量大 | 无界队列堆积 | jmap+MAT | 有界队列+CallerRunsPolicy+分批提交+背压 | 压测稳定',
        },
        {
          q: '请即兴讲解"多源异构数据统一接入"项目案例（2 分钟内）。',
          tips: '7种关系型+3种文件 | 策略模式+模板方法 | 新增数据源只需实现类 | Seatunnel 多线程分片 | 自适应批处理',
        },
        {
          q: '请即兴讲解"Kafka 消息积压+丢失"项目案例（2 分钟内）。',
          tips: '消费速度跟不上 | acks=0 丢消息 | min.insync.replicas | rebalance 耗时 | 扩消费者+并行消费 | 幂等+offset',
        },
        {
          q: 'Flink 的状态管理是怎么做的？ Exactly-once 怎么保证？',
          tips: '状态: Keyed State(值/列表/映射) + Operator State | Checkpoint: barrier 对齐→快照→恢复 | Exactly-once: Checkpoint + 幂等/事务',
        },
      ],
      algo: { name: '综合复盘：链表三题重写', lc: null },
      tier5: [],
      tier6: ['系统设计加练：设计一个配置中心（长轮询 vs 长连接、配置版本管理、灰度发布）'],
    },
    29: {
      title: '系统设计 + 模拟面试（上）',
      week: 5,
      knowledge: [
        'IM 系统设计（消息可靠投递、在线状态、消息顺序）',
        '配置中心设计（长轮询 vs 长连接、配置版本管理、灰度发布）',
        '秒杀系统设计',
        'LRU 缓存（HashMap + 双向链表）',
        'TopK 问题（堆/快速选择）',
      ],
      mustKnow: [
        'IM 系统怎么设计？消息怎么保证不丢？',
        '配置中心长轮询和长连接区别？',
        '秒杀系统怎么设计？',
        'LRU 怎么实现？',
      ],
      mock: [
        {
          q: '设计一个 IM 系统，10 万在线，消息怎么保证不丢不重？',
          tips: '不丢: 客户端ACK+服务端持久化+离线消息 | 不重: 消息ID去重 | 顺序: 单会话单队列+递增seq | 在线状态: Redis维护+心跳 | 存储: MySQL历史+Redis热数据',
        },
        {
          q: '设计一个配置中心，客户端怎么感知配置变更？',
          tips: '长轮询: 客户端hold 30s,有变更立即返回(简单/兼容好) | 长连接: WebSocket/gRPC stream(实时/资源省) | Nacos用长轮询,hold 29.5s | 配置版本: MD5校验+版本号 | 灰度: 按IP/标签分组发布',
        },
        {
          q: '设计一个秒杀系统，10 万人抢 1000 件。',
          tips: '数据量: 10万QPS | 存储: Redis预扣库存(Lua原子) | 异步: MQ异步落库 | 容错: 限流+熔断+防超卖(Lua) | 分层: CDN+网关限流+应用层+数据层',
        },
        {
          q: 'LRU 缓存怎么实现？时间复杂度？',
          tips: 'HashMap+双向链表 | get/put O(1) | 访问后移到头部 | 满了删尾部 | Java: LinkedHashMap重写removeEldestEntry',
        },
        {
          q: 'TopK 问题怎么解？堆和快速选择区别？',
          tips: '小顶堆: 维护K个元素,O(NlogK),适合大数据流 | 快速选择: O(N)平均,需要全量数据 | TopK大用小顶堆,TopK小用大顶堆',
        },
      ],
      algo: { name: '综合复盘：LRU + TopK 重写', lc: null },
      tier5: [],
      tier6: ['终极大模拟（60 分钟）：完整 10 题流程 + 行为面试 + 系统设计（秒杀）+ 算法（TopK）'],
    },
    30: {
      title: '模拟面试（下）+ 查漏补缺 + 最终背诵',
      week: 5,
      isReview: true,
      tasks: [
        '不学新东西，只做三件事：背高频题、复述项目案例、修正易错清单',
        '处理所有 🟢 加分清单',
        '打印复习清单，面试前 30 分钟看一遍',
      ],
      mock: [
        {
          q: '请即兴讲解"线程池 OOM"项目案例（2 分钟内，含排查+解决+压测）。',
          tips: '数据采集任务量大→无界队列堆积→jmap+MAT看队列对象→根因newLinkedBlockingQueue()无界→有界队列+CallerRunsPolicy+分批提交+背压→压测稳定',
        },
        {
          q: '请即兴讲解"多源异构数据统一接入"项目案例（2 分钟内，含设计+实现）。',
          tips: '7种关系型+3种文件 | 策略模式+模板方法 | 新增数据源只需实现类 | Seatunnel 多线程分片 | 自适应批处理',
        },
        {
          q: '请即兴讲解"Kafka 消息积压+丢失"项目案例（2 分钟内，含根因+解决）。',
          tips: '消费速度跟不上→acks=0丢消息→min.insync.replicas→rebalance耗时→扩消费者+并行消费→幂等+offset提交策略',
        },
        {
          q: 'HashMap 原理？JDK 1.7 和 1.8 区别？（30 秒快速口述）',
          tips: '数组+链表+红黑树(1.8) | hash^(h>>>16)扰动 | (n-1)&hash | 1.7头插法(死循环)→1.8尾插法 | 扩容2倍 | 负载因子0.75',
        },
        {
          q: 'JVM GC 流程？怎么选择垃圾回收器？（30 秒快速口述）',
          tips: '新生代: 复制算法(Eden→S0/S1) | 老年代: 标记清除/标记整理 | CMS(低延迟)/G1(平衡)/ZGC(超低延迟) | 选型: 堆小用CMS,堆大用G1,超低延迟用ZGC',
        },
      ],
    },
  },
};
