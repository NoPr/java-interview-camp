import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useReducer,
    useRef,
    type ReactNode,
} from 'react';
import type { AppState, Tier, ContentType, CustomItem, QuestionPriority, WeakReason, MasteryLevel, ReviewUrgency, WeakDecisionInput } from '../types';
import { loadState, saveState } from '../utils/indexeddb';
import { computeUrgency } from '../utils/reviewUrgency';
import { toggleKey } from '../utils/toggleKey';

// ===================== Action 类型定义 =====================
export type Action =
    // 切换任务勾选，payload: { key, value? }；value 未传时为 toggle 语义
    | { type: 'TOGGLE_TASK'; key: string; value?: boolean }
    // 切换模拟题勾选，payload: { key, value? }
    | { type: 'TOGGLE_MOCK'; key: string; value?: boolean }
    // 切换算法题勾选，payload: { key, value? }
    | { type: 'TOGGLE_ALGO'; key: string; value?: boolean }
    | { type: 'SET_TIER'; tier: Tier }
    | { type: 'SET_CURRENT_DAY'; day: number }
    | { type: 'SET_CURRENT_VIEW'; view: 'day' | 'overview' | 'techstack' }
    | { type: 'TOGGLE_WEEK'; week: number }
    // 当日打卡/取消打卡，payload: 日期字符串 "2026-06-23"
    | { type: 'CHECKIN'; date: string }
    // 添加自定义内容，payload: { day, contentType, item }
    // day 为数字时表示 Day 卡片，为 `techStack-${stackId}` 字符串时表示技术栈详情页
    | { type: 'ADD_CONTENT'; day: number | string; contentType: ContentType; item: CustomItem }
    | { type: 'DELETE_CUSTOM'; day: number | string; contentType: ContentType; id: string }
    | { type: 'HIDE_PRESET'; day: number | string; contentType: ContentType; index: number }
    | { type: 'RESTORE_PRESET'; day: number | string; contentType: ContentType; index: number }
    | { type: 'SET_SIDEBAR_VIEW'; view: 'time' | 'techstack' }
    // 设置当前技术栈，stackId 为 null 表示取消选中
    | { type: 'SET_TECH_STACK'; stackId: string | null }
    | { type: 'TOGGLE_QUESTION_MASTERED'; questionId: string }
    | { type: 'SET_QUESTION_PRIORITY'; questionId: string; priority: QuestionPriority }
    // Editorial Hybrid 新增 Action
    | { type: 'TOGGLE_CARD_EVAL'; day: number; cardIndex: number; result: 'pass' | 'fail' }
    | { type: 'TOGGLE_QUESTION_REVIEW'; questionId: string }
    // 设置模拟题要点展开状态，payload: { day, index, value }；value 取自 details.toggle 后的真实 open 值
    // 注意：必须用 SET 而非 TOGGLE，否则受控 details 的 open 纠正会触发额外 toggle 事件导致方向不确定的拉锯抖动
    | { type: 'SET_MOCK_TIPS'; day: number; index: number; value: boolean }
    | { type: 'SET_TECHSTACK_FILTER'; filter: 'all' | 'unmastered' | 'interview' }
    | { type: 'TOGGLE_SIDEBAR' }
    | { type: 'ADD_TO_REVIEW'; items: string[] }
    | { type: 'IMPORT_STATE'; state: Partial<AppState> }
    // 调整内容排序，payload: { day, contentType, order }
    // order 为新的全量条目 id 顺序
    | { type: 'REORDER_CONTENT'; day: number | string; contentType: ContentType; order: string[] }
    | { type: 'LOAD_STATE'; state: AppState }
    // ===================== 不牢固决策与复习队列 =====================
    // 提交决策弹窗：一次性设置 weakReason + masteryLevel + weakMeta +（跳过时）questionReview + reviewUrgency
    | { type: 'WEAK_DECISION'; key: string; payload: WeakDecisionInput }
    | { type: 'SET_WEAK_REASON'; key: string; reason: WeakReason }
    // 手动设置掌握程度（与 questionStatus.mastered 双向同步）
    | { type: 'SET_MASTERY_LEVEL'; key: string; level: MasteryLevel }
    | { type: 'SET_REVIEW_URGENCY'; key: string; urgency: ReviewUrgency }
    | { type: 'OPEN_WEAK_DIALOG'; key: string; text: string; priority: QuestionPriority }
    | { type: 'CLOSE_WEAK_DIALOG' }
    // 清除某题所有不牢固标记，回到从未标记状态
    | { type: 'CLEAR_WEAK_MARK'; key: string };

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
    loaded: false,
};

// ===================== Reducer =====================
export function reducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case 'TOGGLE_TASK':
            return { ...state, tasks: toggleKey(state.tasks, action.key, action.value) };
        case 'TOGGLE_MOCK':
            return { ...state, mock: toggleKey(state.mock, action.key, action.value) };
        case 'TOGGLE_ALGO':
            return { ...state, algo: toggleKey(state.algo, action.key, action.value) };
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
        case 'SET_MOCK_TIPS': {
            const key = `${action.day}-${action.index}`;
            return {
                ...state,
                mockTipsExpanded: {
                    ...state.mockTipsExpanded,
                    [key]: action.value,
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
            return { ...initialState, ...action.state, loaded: true };
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
            // 已掌握的题留在复习队列，归入"已掌握"分组置底展示（不再自动移出）
            return { ...state, masteryLevel, questionStatus };
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
        case 'CLEAR_WEAK_MARK': {
            const key = action.key;
            const weakReason = { ...state.weakReason };
            const masteryLevel = { ...state.masteryLevel };
            const reviewUrgency = { ...state.reviewUrgency };
            const weakMeta = { ...state.weakMeta };
            const questionReview = { ...state.questionReview };
            delete weakReason[key];
            delete masteryLevel[key];
            delete reviewUrgency[key];
            delete weakMeta[key];
            delete questionReview[key];
            // 同步 questionStatus.mastered（若存在）
            const questionStatus = { ...state.questionStatus };
            if (questionStatus[key]) {
                questionStatus[key] = { ...questionStatus[key], mastered: false };
            }
            return {
                ...state,
                weakReason,
                masteryLevel,
                reviewUrgency,
                weakMeta,
                questionReview,
                questionStatus,
            };
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
            if (cancelled) return;
            // loaded 为 null 时（首次访问 / 版本不匹配 / 加载失败）使用 initialState 作为默认状态
            const migratedState: AppState = loaded
                ? { ...initialState, ...loaded }
                : { ...initialState };
            // 迁移：确保新字段存在（兼容旧数据）
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
        });
        return () => {
            cancelled = true;
        };
    }, []);

    // 状态变化时自动保存到 IndexedDB
    // - 跳过未加载完成的保存（避免用 initialState 覆盖磁盘数据）
    // - 300ms 防抖：高频勾选时合并为一次写入，避免 IndexedDB I/O 阻塞 UI
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (!state.loaded) return;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            void saveState(state);
        }, 300);
        return () => {
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
                saveTimerRef.current = null;
            }
        };
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
