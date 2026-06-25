import type { ReactNode } from 'react';

// 可勾选任务项
export function TaskItem({
    checked,
    onClick,
    onDelete,
    children,
    isCustom,
}: {
    checked: boolean;
    onClick: () => void;
    onDelete?: () => void;
    children: ReactNode;
    isCustom?: boolean;
}) {
    return (
        <div
            className={`task-item content-item ${checked ? 'done' : ''} ${isCustom ? 'custom-item' : ''}`}
            onClick={onClick}
        >
            <div className={`checkbox ${checked ? 'checked' : ''}`} />
            <div className="task-text">{children}</div>
            {onDelete && (
                <button
                    className="delete-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    title="删除"
                >
                    ×
                </button>
            )}
        </div>
    );
}
