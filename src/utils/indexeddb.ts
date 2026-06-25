import type { AppState } from '../types';

// IndexedDB 配置
const DB_NAME = 'java-interview-dashboard';
const DB_VERSION = 1;
const STORE_NAME = 'state';
const KEY = 'appState';

// 持久化数据版本号：当 AppState 结构发生破坏性变更时递增
// 旧版本数据将在 loadState 中被识别并丢弃，避免运行时崩溃
const STATE_VERSION = 1;

// 持久化包装结构：{ v: 版本号, state: 实际状态 }
interface PersistedState {
    v: number;
    state: AppState;
}

// 初始化数据库，返回 Promise<IDBDatabase>
export function initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * 校验从 IndexedDB 读出的数据是否为当前版本的合法 PersistedState
 *
 * 校验维度：
 * 1. 顶层是对象且包含数字类型 v 字段
 * 2. v 等于当前 STATE_VERSION（版本不匹配直接丢弃）
 * 3. state 是对象，且包含 AppState 必需的关键字段（tier / currentDay / checkins）
 *    —— 仅校验关键字段，避免字段增删时频繁误判
 */
function isValidPersisted(data: unknown): data is PersistedState {
    if (!data || typeof data !== 'object') return false;
    const obj = data as Record<string, unknown>;
    if (typeof obj.v !== 'number') return false;
    if (obj.v !== STATE_VERSION) return false;
    if (!obj.state || typeof obj.state !== 'object') return false;
    const s = obj.state as Record<string, unknown>;
    if (typeof s.tier !== 'string') return false;
    if (typeof s.currentDay !== 'number') return false;
    if (!Array.isArray(s.checkins)) return false;
    return true;
}

/**
 * 从 IndexedDB 加载应用状态
 *
 * - 数据不存在 / 版本不匹配 / 校验失败 → 返回 null，由调用方使用默认状态
 * - 版本不匹配时打印 warn，方便排查用户报告的"数据丢失"问题
 */
export async function loadState(): Promise<AppState | null> {
    try {
        const db = await initDB();
        return await new Promise<AppState | null>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(KEY);

            request.onsuccess = () => {
                const raw = request.result;
                if (!raw) return resolve(null);
                if (isValidPersisted(raw)) {
                    resolve(raw.state);
                    return;
                }
                // 兼容识别：旧版无版本包裹的 AppState（含 tier 字段）
                if (raw && typeof raw === 'object' && 'tier' in raw && !('v' in raw)) {
                    console.warn(
                        '[IndexedDB] 检测到无版本号的旧版数据（v0），已丢弃并使用默认状态。下次保存将写入 v' + STATE_VERSION,
                    );
                    resolve(null);
                    return;
                }
                console.warn('[IndexedDB] 数据格式或版本不匹配，已丢弃。', raw);
                resolve(null);
            };
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        // 读取失败不抛出，返回 null 让上层使用默认状态
        console.error('[IndexedDB] loadState 失败:', err);
        return null;
    }
}

/**
 * 保存应用状态到 IndexedDB
 *
 * 失败时仅打印日志，不抛出异常，避免影响主流程。
 * 调用方应自行做防抖（本项目在 useAppState 中以 300ms 防抖调用）。
 */
export async function saveState(state: AppState): Promise<void> {
    try {
        const db = await initDB();
        const payload: PersistedState = { v: STATE_VERSION, state };
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.put(payload, KEY);

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (err) {
        console.error('[IndexedDB] saveState 失败:', err);
    }
}

// 导出 STATE_VERSION 供测试使用
export { STATE_VERSION };
