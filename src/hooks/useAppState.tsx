import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useReducer,
    type ReactNode,
} from 'react';
import type { AppState, Tier, ContentType, CustomItem, QuestionPriority, WeakReason, MasteryLevel, ReviewUrgency, WeakDecisionInput } from '../types';
import { loadState, saveState } from '../utils/indexeddb';
import { computeUrgency } from '../utils/reviewUrgency';

// ===================== Action 类型定义 =====================
export type Action =
    // 切换任务勾选，payload: { key, value? }
    | { type: 'TOGGLE_TASK'; key: string; value?: boolean }
    // 切换模拟题勾选，payload: { key, value? }
    | { type: 'TOGGLE_MOCK'; key: string; value?: boolean }
    // 切换算法题勾选，payload: { key, value? }
    | { type: 'TOGGLE_ALGO'; key: string; value?: boolean }
    // 切换档位
    | { type: 'SET_TIER'; tier: Tier }
    // 设置当前 Day
    | { type: 'SET_CURRENT_DAY'; day: number }
    // 切换视图（day / overview / techstack）
    | { type: 'SET_CURRENT_VIEW'; view: 'day' | 'overview' | 'techstack' }
    // 展开/折叠某一周
    | { type: 'TOGGLE_WEEK'; week: number }
    // 当日打卡/取消打卡，payload: 日期字符串 "2026-06-23"
    | { type: 'CHECKIN'; date: string }
    // 添加自定义内容，payload: { day, contentType, item }
    // day 为数字时表示 Day 卡片，为 `techStack-${stackId}` 字符串时表示技术栈详情页
    | { type: 'ADD_CONTENT'; day: number | string; contentType: ContentType; item: CustomItem }
    // 删除自定义内容，payload: { day, contentType, id }
    | { type: 'DELETE_CUSTOM'; day: number | string; contentType: ContentType; id: string }
    // 隐藏预置内容，payload: { day, contentType, index }
    | { type: 'HIDE_PRESET'; day: number | string; contentType: ContentType; index: number }
    // 恢复预置内容，payload: { day, contentType, index }
    | { type: 'RESTORE_PRESET'; day: number | string; contentType: ContentType; index: number }
    // 切换侧边栏视图模式（按时间 / 按技术栈）
    | { type: 'SET_SIDEBAR_VIEW'; view: 'time' | 'techstack' }
    // 设置当前技术栈，stackId 为 null 表示取消选中
    | { type: 'SET_TECH_STACK'; stackId: string | null }
    // 切换面试题掌握状态
    | { type: 'TOGGLE_QUESTION_MASTERED'; questionId: string }
    // 设置面试题优先级
    | { type: 'SET_QUESTION_PRIORITY'; questionId: string; priority: QuestionPriority }
    // Editorial Hybrid 新增 Action
    // 切换卡片评估（pass/fail）
    | { type: 'TOGGLE_CARD_EVAL'; day: number; cardIndex: number; result: 'pass' | 'fail' }
    // 切换题目复习标记
    | { type: 'TOGGLE_QUESTION_REVIEW'; questionId: string }
    // 切换模拟题要点展开
    | { type: 'TOGGLE_MOCK_TIPS'; day: number; index: number }
    // 设置技术栈筛选
    | { type: 'SET_TECHSTACK_FILTER'; filter: 'all' | 'unmastered' | 'interview' }
    // 切换侧边栏开合
    | { type: 'TOGGLE_SIDEBAR' }
    // 批量加入复习
    | { type: 'ADD_TO_REVIEW'; items: string[] }
    // 导入部分状态（用于迁移/同步）
    | { type: 'IMPORT_STATE'; state: Partial<AppState> }
    // 调整内容排序，payload: { day, contentType, order }
    // order 为新的全量条目 id 顺序
    | { type: 'REORDER_CONTENT'; day: number | string; contentType: ContentType; order: string[] }
    // 从 IndexedDB 加载状态
    | { type: 'LOAD_STATE'; state: AppState }
    // ===================== 不牢固决策与复习队列 =====================
    // 提交决策弹窗：一次性设置 weakReason + masteryLevel + weakMeta +（跳过时）questionReview + reviewUrgency
    | { type: 'WEAK_DECISION'; key: string; payload: WeakDecisionInput }
    // 手动设置不掌握原因
    | { type: 'SET_WEAK_REASON'; key: string; reason: WeakReason }
    // 手动设置掌握程度（与 questionStatus.mastered 双向同步）
    | { type: 'SET_MASTERY_LEVEL'; key: string; level: MasteryLevel }
    // 手动设置复习紧迫度
    | { type: 'SET_REVIEW_URGENCY'; key: string; urgency: ReviewUrgency }
    // 打开决策弹窗
    | { type: 'OPEN_WEAK_DIALOG'; key: string; text: string; priority: QuestionPriority }
    // 关闭决策弹窗
    | { type: 'CLOSE_WEAK_DIALOG' };

// ===================== 初始状态 =====================
export const initialState: AppState = {
    tasks: {},
    mock: {},
    algo: {},
    checkins: [],
    tier: '5h',
    currentDay: 1,
    currentView: 'day',
    expandedWeeks: [1],
    customContent: {},
    hiddenContent: {},
    sidebarView: 'time',
    currentTechStack: null,
    questionStatus: {},
    // Editorial Hybrid 新增字段默认值
    cardEval: {},
    questionReview: {},
    mockTipsExpanded: {},
    techStackFilter: 'all' as const,
    sidebarOpen: false,
    contentOrder: {},
    // 不牢固决策与复习队列
    weakReason: {},
    masteryLevel: {},
    reviewUrgency: {},
    weakMeta: {},
    dialogState: null,
};

// ===================== Reducer =====================
export function reducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case 'TOGGLE_TASK': {
            const next = { ...state.tasks };
            const nextValue = action.value ?? !next[action.key];
            if (nextValue) {
                next[action.key] = true;
            } else {
                delete next[action.key];
            }
            return { ...state, tasks: next };
        }
        case 'TOGGLE_MOCK': {
            const next = { ...state.mock };
            const nextValue = action.value ?? !next[action.key];
            if (nextValue) {
                next[action.key] = true;
            } else {
                delete next[action.key];
            }
            return { ...state, mock: next };
        }
        case 'TOGGLE_ALGO': {
            const next = { ...state.algo };
            const nextValue = action.value ?? !next[action.key];
            if (nextValue) {
                next[action.key] = true;
            } else {
                delete next[action.key];
            }
            return { ...state, algo: next };
        }
        case 'SET_TIER':
            return { ...state, tier: action.tier };
        case 'SET_CURRENT_DAY':
            return { ...state, currentDay: action.day, currentView: 'day' };
        case 'SET_CURRENT_VIEW':
            return { ...state, currentView: action.view };
        case 'TOGGLE_WEEK': {
            const exists = state.expandedWeeks.includes(action.week);
            const expandedWeeks = exists
                ? state.expandedWeeks.filter((w) => w !== action.week)
                : [...state.expandedWeeks, action.week];
            return { ...state, expandedWeeks };
        }
        case 'CHECKIN': {
            const exists = state.checkins.includes(action.date);
            const checkins = exists
                ? state.checkins.filter((d) => d !== action.date)
                : [...state.checkins, action.date].sort();
            return { ...state, checkins };
        }
        case 'ADD_CONTENT': {
            const key = `${action.day}-${action.contentType}`;
            const arr = state.customContent[key] || [];
            return {
                ...state,
                customContent: { ...state.customContent, [key]: [...arr, action.item] },
            };
        }
        case 'DELETE_CUSTOM': {
            const key = `${action.day}-${action.contentType}`;
            const arr = state.customContent[key] || [];
            const deletedId = `custom-${action.id}`;
            const order = state.contentOrder[key];
            return {
                ...state,
                customContent: {
                    ...state.customContent,
                    [key]: arr.filter((i) => i.id !== action.id),
                },
                contentOrder: order
                    ? { ...state.contentOrder, [key]: order.filter((id) => id !== deletedId) }
                    : state.contentOrder,
            };
        }
        case 'HIDE_PRESET': {
            const key = `${action.day}-${action.contentType}`;
            const arr = state.hiddenContent[key] || [];
            if (arr.includes(action.index)) return state;
            return {
                ...state,
                hiddenContent: { ...state.hiddenContent, [key]: [...arr, action.index] },
            };
        }
        case 'RESTORE_PRESET': {
            const key = `${action.day}-${action.contentType}`;
            const arr = state.hiddenContent[key] || [];
            return {
                ...state,
                hiddenContent: {
                    ...state.hiddenContent,
                    [key]: arr.filter((i) => i !== action.index),
                },
            };
        }
        case 'SET_SIDEBAR_VIEW':
            return { ...state, sidebarView: action.view };
        case 'SET_TECH_STACK':
            return {
                ...state,
                currentTechStack: action.stackId,
                currentView: action.stackId ? 'techstack' : state.currentView,
            };
        case 'TOGGLE_QUESTION_MASTERED': {
            const current = state.questionStatus[action.questionId] || {
                mastered: false,
                priority: 'yellow' as QuestionPriority,
            };
            return {
                ...state,
                questionStatus: {
                    ...state.questionStatus,
                    [action.questionId]: { ...current, mastered: !current.mastered },
                },
            };
        }
        case 'SET_QUESTION_PRIORITY': {
            const current = state.questionStatus[action.questionId] || {
                mastered: false,
                priority: action.priority,
            };
            return {
                ...state,
                questionStatus: {
                    ...state.questionStatus,
                    [action.questionId]: { ...current, priority: action.priority },
                },
            };
        }
        case 'TOGGLE_CARD_EVAL': {
            const key = `${action.day}-${action.cardIndex}`;
            return {
                ...state,
                cardEval: { ...state.cardEval, [key]: action.result },
            };
        }
        case 'TOGGLE_QUESTION_REVIEW': {
            return {
                ...state,
                questionReview: {
                    ...state.questionReview,
                    [action.questionId]: !state.questionReview[action.questionId],
                },
            };
        }
        case 'TOGGLE_MOCK_TIPS': {
            const key = `${action.day}-${action.index}`;
            return {
                ...state,
                mockTipsExpanded: {
                    ...state.mockTipsExpanded,
                    [key]: !state.mockTipsExpanded[key],
                },
            };
        }
        case 'SET_TECHSTACK_FILTER':
            return { ...state, techStackFilter: action.filter };
        case 'TOGGLE_SIDEBAR':
            return { ...state, sidebarOpen: !state.sidebarOpen };
        case 'REORDER_CONTENT': {
            // 防御性校验：order 必须为数组
            if (!Array.isArray(action.order)) return state;
            const key = `${action.day}-${action.contentType}`;
            return {
                ...state,
                contentOrder: { ...state.contentOrder, [key]: action.order },
            };
        }
        case 'ADD_TO_REVIEW': {
            const newReview = { ...state.questionReview };
            action.items.forEach((id) => {
                newReview[id] = true;
            });
            return { ...state, questionReview: newReview };
        }
        case 'IMPORT_STATE':
            return { ...state, ...action.state };
        case 'LOAD_STATE':
            // 与 initialState 合并，兼容旧版本缺少 customContent/hiddenContent 的状态
            return { ...initialState, ...action.state };
        case 'WEAK_DECISION': {
            const { reason, mastery, decision, isPrerequisite, priority, day, text } = action.payload;
            const key = action.key;
            const weakReason = { ...state.weakReason, [key]: reason };
            const masteryLevel = { ...state.masteryLevel, [key]: mastery };
            const weakMeta = { ...state.weakMeta, [key]: { day, text } };
            let questionReview = state.questionReview;
            let reviewUrgency = state.reviewUrgency;
            if (decision === 'skip') {
                questionReview = { ...questionReview, [key]: true };
                reviewUrgency = {
                    ...reviewUrgency,
                    [key]: computeUrgency(isPrerequisite, mastery, priority),
                };
            }
            return { ...state, weakReason, masteryLevel, weakMeta, questionReview, reviewUrgency };
        }
        case 'SET_WEAK_REASON': {
            return {
                ...state,
                weakReason: { ...state.weakReason, [action.key]: action.reason },
            };
        }
        case 'SET_MASTERY_LEVEL': {
            const masteryLevel = { ...state.masteryLevel, [action.key]: action.level };
            // 同步 questionStatus.mastered（面试题）
            const questionStatus = { ...state.questionStatus };
            if (questionStatus[action.key]) {
                questionStatus[action.key] = {
                    ...questionStatus[action.key],
                    mastered: action.level === 'mastered',
                };
            }
            // 若标记为已掌握，自动从复习队列移除
            let questionReview = state.questionReview;
            if (action.level === 'mastered' && questionReview[action.key]) {
                questionReview = { ...questionReview, [action.key]: false };
            }
            return { ...state, masteryLevel, questionStatus, questionReview };
        }
        case 'SET_REVIEW_URGENCY': {
            return {
                ...state,
                reviewUrgency: { ...state.reviewUrgency, [action.key]: action.urgency },
            };
        }
        case 'OPEN_WEAK_DIALOG': {
            return {
                ...state,
                dialogState: {
                    open: true,
                    key: action.key,
                    text: action.text,
                    priority: action.priority,
                },
            };
        }
        case 'CLOSE_WEAK_DIALOG': {
            return { ...state, dialogState: null };
        }
        default:
            return state;
    }
}

// ===================== Context =====================
interface ContextValue {
    state: AppState;
    dispatch: React.Dispatch<Action>;
}

const AppStateContext = createContext<ContextValue | null>(null);

// ===================== Provider =====================
export function AppStateProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    // 启动时从 IndexedDB 加载状态
    useEffect(() => {
        let cancelled = false;
        loadState().then((loaded) => {
            if (!cancelled && loaded) {
                // 迁移：确保新字段存在（兼容旧数据）
                const migratedState: AppState = { ...initialState, ...loaded };
                if (!migratedState.cardEval) migratedState.cardEval = {};
                if (!migratedState.questionReview) migratedState.questionReview = {};
                if (!migratedState.mockTipsExpanded) migratedState.mockTipsExpanded = {};
                if (!migratedState.techStackFilter) migratedState.techStackFilter = 'all';
                if (migratedState.sidebarOpen === undefined) migratedState.sidebarOpen = false;
                if (!migratedState.contentOrder) migratedState.contentOrder = {};
                if (!migratedState.weakReason) migratedState.weakReason = {};
                if (!migratedState.masteryLevel) migratedState.masteryLevel = {};
                if (!migratedState.reviewUrgency) migratedState.reviewUrgency = {};
                if (!migratedState.weakMeta) migratedState.weakMeta = {};
                if (!migratedState.dialogState) migratedState.dialogState = null;
                dispatch({ type: 'LOAD_STATE', state: migratedState });
            }
        });
        return () => {
            cancelled = true;
        };
    }, []);

    // 状态变化时自动保存到 IndexedDB（跳过首次未加载完成的保存）
    useEffect(() => {
        saveState(state);
    }, [state]);

    const value = useMemo(() => ({ state, dispatch }), [state]);
    return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

// ===================== Hook =====================
export function useAppState(): ContextValue {
    const ctx = useContext(AppStateContext);
    if (!ctx) {
        throw new Error('useAppState 必须在 AppStateProvider 内部使用');
    }
    return ctx;
}
