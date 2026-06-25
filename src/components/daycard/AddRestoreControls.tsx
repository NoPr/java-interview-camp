import { useState } from 'react';
import type { ContentType, CustomItem } from '../../types';
import { generateId } from './helpers';

// inline 输入框：根据类型显示不同字段
// knowledge/mustKnow/tier5/tier6: 1 个文本框；mock: 问题+要点；card: 标题+关键词；question: 题目
export function InlineInput({
    type,
    onConfirm,
    onCancel,
}: {
    type: ContentType;
    onConfirm: (item: CustomItem) => void;
    onCancel: () => void;
}) {
    const [v1, setV1] = useState('');
    const [v2, setV2] = useState('');

    const isMock = type === 'mock';
    const isCard = type === 'card';
    const isQuestion = type === 'question';
    const placeholder1 = isMock ? '问题' : isCard ? '标题' : isQuestion ? '题目' : '内容';
    const placeholder2 = isMock ? '答题要点' : '关键词';

    const handleConfirm = () => {
        const text1 = v1.trim();
        if (!text1) return;
        const id = generateId();
        if (isMock) {
            onConfirm({ id, content: '', q: text1, tips: v2.trim() });
        } else if (isCard) {
            onConfirm({ id, content: '', title: text1, keywords: v2.trim() });
        } else {
            onConfirm({ id, content: text1 });
        }
    };

    return (
        <div className="inline-input">
            <textarea
                placeholder={placeholder1}
                value={v1}
                onChange={(e) => setV1(e.target.value)}
                rows={2}
                autoFocus
            />
            {(isMock || isCard) && (
                <textarea
                    placeholder={placeholder2}
                    value={v2}
                    onChange={(e) => setV2(e.target.value)}
                    rows={2}
                />
            )}
            <div className="inline-input-actions">
                <button className="btn btn-active" onClick={handleConfirm}>
                    确认
                </button>
                <button className="btn" onClick={onCancel}>
                    取消
                </button>
            </div>
        </div>
    );
}

// 增删控制区：添加按钮 / inline 输入框 / 恢复链接
export function AddRestoreControls({
    type,
    addingType,
    setAddingType,
    onAdd,
    hiddenCount,
    onRestore,
    label = '添加',
}: {
    type: ContentType;
    addingType: ContentType | null;
    setAddingType: (t: ContentType | null) => void;
    onAdd: (item: CustomItem) => void;
    hiddenCount: number;
    onRestore: () => void;
    label?: string;
}) {
    const isAdding = addingType === type;
    return (
        <div className="add-delete-controls">
            {isAdding ? (
                <InlineInput
                    type={type}
                    onConfirm={(item) => {
                        onAdd(item);
                        setAddingType(null);
                    }}
                    onCancel={() => setAddingType(null)}
                />
            ) : (
                <>
                    <button className="add-btn" onClick={() => setAddingType(type)}>
                        + {label}
                    </button>
                    {hiddenCount > 0 && (
                        <span className="restore-link" onClick={onRestore}>
                            已删除 {hiddenCount} 项 [恢复]
                        </span>
                    )}
                </>
            )}
        </div>
    );
}
