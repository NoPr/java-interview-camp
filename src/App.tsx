import { AsidePanel } from './components/AsidePanel';
import DayCard from './components/DayCard';
import Header from './components/Header';
import Overview from './components/Overview';
import Sidebar from './components/Sidebar';
import { TechStackView } from './components/TechStackView';
import { WeakDecisionDialog } from './components/WeakDecisionDialog';
import { AppStateProvider, useAppState } from './hooks/useAppState';

// 骨架屏：IndexedDB 加载完成前的占位
function Skeleton() {
    return (
        <div className="content skeleton-wrap">
            <div className="content-header">
                <div className="skeleton-line short" style={{ height: 14 }} />
                <div className="skeleton-line medium" style={{ height: 20, marginTop: 6 }} />
            </div>
            <div className="skeleton-block">
                <div className="skeleton-header">
                    <div className="skeleton-line" style={{ width: 24, height: 12 }} />
                    <div className="skeleton-line medium" style={{ height: 14 }} />
                </div>
                <div className="skeleton-body">
                    {[1, 2, 3, 4].map((i) => (
                        <div className="skeleton-item" key={i}>
                            <div className="skeleton-checkbox" />
                            <div className="skeleton-line long" />
                        </div>
                    ))}
                </div>
            </div>
            <div className="skeleton-block">
                <div className="skeleton-header">
                    <div className="skeleton-line" style={{ width: 24, height: 12 }} />
                    <div className="skeleton-line medium" style={{ height: 14 }} />
                </div>
                <div className="skeleton-body">
                    {[1, 2, 3].map((i) => (
                        <div className="skeleton-item" key={i}>
                            <div className="skeleton-checkbox" />
                            <div className="skeleton-line long" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// 主内容区：根据 currentView 切换 Overview / DayCard / TechStackView
function MainContent() {
    const { state } = useAppState();
    if (!state.loaded) return <Skeleton />;
    if (state.currentView === 'overview') return <Overview />;
    if (state.currentView === 'techstack') return <TechStackView />;
    return <DayCard />;
}

// 应用骨架：侧边栏 + 顶栏 + 主内容区（content + aside 双列布局）
function AppLayout() {
    const { state, dispatch } = useAppState();
    return (
        <div className="app">
            <Sidebar />
            {state.sidebarOpen && (
                <div
                    className="ed-sidebar-overlay"
                    onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
                />
            )}
            <div className="main">
                <Header />
                <div className="main-body">
                    <MainContent />
                    <AsidePanel />
                </div>
            </div>
            <WeakDecisionDialog />
        </div>
    );
}

export default function App() {
    return (
        <AppStateProvider>
            <AppLayout />
        </AppStateProvider>
    );
}
