import DayCard from './components/DayCard';
import Header from './components/Header';
import Overview from './components/Overview';
import Sidebar from './components/Sidebar';
import { TechStackView } from './components/TechStackView';
import { AppStateProvider, useAppState } from './hooks/useAppState';

// 主内容区：根据 currentView 切换 Overview / DayCard / TechStackView
function MainContent() {
    const { state } = useAppState();
    if (state.currentView === 'overview') return <Overview />;
    if (state.currentView === 'techstack') return <TechStackView />;
    return <DayCard />;
}

// 应用骨架：侧边栏 + 顶栏 + 主内容
// 窄屏（<900px）下侧边栏改为抽屉式，由遮罩层覆盖主内容
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
                <MainContent />
            </div>
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
