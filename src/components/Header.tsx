import { useState, useEffect, type ChangeEvent } from 'react';
import { getTechStackById } from '../data/techStacks';
import { useAppState } from '../hooks/useAppState';
import type { Tier } from '../types';

// 获取今天的日期字符串 "YYYY-MM-DD"（本地时区）
function getTodayStr(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// 计算连续打卡天数
// 从今天往前数，遇到第一个未打卡的日期即停止
function calcStreak(checkins: string[]): number {
    if (checkins.length === 0) return 0;
    const set = new Set(checkins);
    let streak = 0;
    const cursor = new Date();
    // 从今天开始往前数
    while (true) {
        const y = cursor.getFullYear();
        const m = String(cursor.getMonth() + 1).padStart(2, '0');
        const d = String(cursor.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;
        if (set.has(dateStr)) {
            streak++;
            cursor.setDate(cursor.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
}

const TIERS: Tier[] = ['3h', '5h', '6h'];

export default function Header() {
    const { state, dispatch } = useAppState();
    const { tier, currentDay, currentView, currentTechStack, checkins } = state;
    const today = getTodayStr();
    const checkedInToday = checkins.includes(today);
    const streak = calcStreak(checkins);
    const selectedStackName = currentTechStack ? getTechStackById(currentTechStack)?.name ?? '' : '';

    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const dark = stored === 'dark' || (!stored && prefersDark);
        setIsDark(dark);
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    }, []);

    const toggleTheme = () => {
        const next = !isDark;
        setIsDark(next);
        document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
        localStorage.setItem('theme', next ? 'dark' : 'light');
    };

    // 导出当前状态为 JSON 文件，文件名带日期便于归档
    const handleExport = () => {
        const data = JSON.stringify(state, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `java-interview-30days-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // 从 JSON 文件导入状态，格式错误时给出友好提示
    const handleImport = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result as string);
                dispatch({ type: 'IMPORT_STATE', state: data });
            } catch {
                alert('导入失败：文件格式错误');
            }
        };
        reader.readAsText(file);
        // 重置 value，便于重复导入同一文件
        e.target.value = '';
    };

    return (
        <header className="header">
            <div className="header-left">
                <button
                    className="ed-hamburger"
                    onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
                    aria-label="切换菜单"
                >
                    ☰
                </button>
                <span className="header-logo">Java 面试冲刺 30 天</span>
                <div className="ed-breadcrumb">
                    {currentView === 'techstack' ? (
                        <>
                            <span>按技术栈</span>
                            <span className="ed-breadcrumb-sep">/</span>
                            <span className="ed-breadcrumb-current">{selectedStackName || '未选择'}</span>
                        </>
                    ) : currentView === 'overview' ? (
                        <span className="ed-breadcrumb-current">路线图总览</span>
                    ) : (
                        <>
                            <span>Week {Math.ceil(currentDay / 7)}</span>
                            <span className="ed-breadcrumb-sep">/</span>
                            <span className="ed-breadcrumb-current">Day {currentDay}</span>
                        </>
                    )}
                </div>
            </div>
            <div className="header-right">
                <button
                    className="ed-header-btn ed-theme-toggle"
                    onClick={toggleTheme}
                    aria-label="切换深色模式"
                    title={isDark ? '切换到浅色模式' : '切换到深色模式'}
                >
                    {isDark ? '☀️' : '🌙'}
                </button>
                <div className="ed-header-actions">
                    <button className="ed-header-btn" onClick={handleExport}>
                        导出
                    </button>
                    <label className="ed-header-btn">
                        导入
                        <input
                            type="file"
                            accept=".json"
                            style={{ display: 'none' }}
                            onChange={handleImport}
                        />
                    </label>
                </div>
                <span className="streak">🔥 {streak} 天</span>
                <div className="tier-switch">
                    {TIERS.map((t) => (
                        <button
                            className={`tier-btn ${tier === t ? 'active' : ''}`}
                            key={t}
                            onClick={() => dispatch({ type: 'SET_TIER', tier: t })}
                        >
                            {t}
                        </button>
                    ))}
                </div>
                <button
                    className={`btn ${checkedInToday ? 'btn-active' : ''}`}
                    onClick={() => dispatch({ type: 'CHECKIN', date: today })}
                >
                    {checkedInToday ? '✅ 已打卡' : '📍 打卡'}
                </button>
            </div>
        </header>
    );
}
