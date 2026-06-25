import type { QuestionPriority } from '../../types';

// 优先级标记：根据面试题库匹配结果渲染小圆角标签
// 仅 red（必考）和 yellow（常考）显示标记，其他不显示
export function PriorityBadge({ priority }: { priority: QuestionPriority | null }) {
    if (priority !== 'red' && priority !== 'yellow') return null;
    const label = priority === 'red' ? '必考' : '常考';
    return (
        <span className={`mock-priority-badge ${priority}`} title={label}>
            {label}
        </span>
    );
}
