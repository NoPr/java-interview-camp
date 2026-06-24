import type { AppState } from '../types';

// IndexedDB 配置
const DB_NAME = 'java-interview-dashboard';
const DB_VERSION = 1;
const STORE_NAME = 'state';
const KEY = 'appState';

// 初始化数据库，返回 Promise<IDBDatabase>
// 若数据库或 store 不存在则创建，已存在则直接复用
export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      // 创建 state store（若不存在）
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 从 IndexedDB 加载应用状态
// 若不存在或读取失败则返回 null，由调用方决定默认值
export async function loadState(): Promise<AppState | null> {
  try {
    const db = await initDB();
    return await new Promise<AppState | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(KEY);

      request.onsuccess = () => {
        resolve((request.result as AppState) ?? null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    // 读取失败不抛出，返回 null 让上层使用默认状态
    console.error('[IndexedDB] loadState 失败:', err);
    return null;
  }
}

// 保存应用状态到 IndexedDB
// 失败时仅打印日志，不抛出异常，避免影响主流程
export async function saveState(state: AppState): Promise<void> {
  try {
    const db = await initDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(state, KEY);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('[IndexedDB] saveState 失败:', err);
  }
}
