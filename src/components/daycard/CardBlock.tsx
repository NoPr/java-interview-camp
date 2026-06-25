import { useState } from 'react';
import type { ContentType } from '../../types';
import { useAppState } from '../../hooks/useAppState';
import { PLAN } from '../../data/plan';
import { Block } from './Block';
import { AddRestoreControls } from './AddRestoreControls';

// 渲染知识卡片区块（3D 翻转 + 自评，支持增删）
//
// 统一卡片列表：预置卡片 index 0，自定义卡片 index 1+
// cardEval 的 key 为 `${day}-${idx}`，自定义卡片自评 pass 时同步标记 task 完成以保留统计
export function CardBlock({ currentDay }: { currentDay: number }) {
    const { state, dispatch } = useAppState();
    const [addingType, setAddingType] = useState<ContentType | null>(null);
    const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

    const type: ContentType = 'card';
    const key = `${currentDay}-${type}`;
    const day = PLAN.days[currentDay];
    const hidden = state.hiddenContent[key] || [];
    const custom = state.customContent[key] || [];
    const presetCard = day.card && !hidden.includes(0) ? day.card : null;

    const allCards: Array<{
        idx: number;
        title: string;
        keywords: string;
        isCustom: boolean;
        customId?: string;
    }> = [];
    if (presetCard) {
        allCards.push({
            idx: 0,
            title: presetCard.title,
            keywords: presetCard.keywords,
            isCustom: false,
        });
    }
    custom.forEach((item, i) => {
        allCards.push({
            idx: presetCard ? i + 1 : i,
            title: item.title || '',
            keywords: item.keywords || '',
            isCustom: true,
            customId: item.id,
        });
    });

    const toggleFlip = (cardKey: string) => {
        setFlippedCards((prev) => ({ ...prev, [cardKey]: !prev[cardKey] }));
    };

    const restoreAll = () => {
        hidden.forEach((idx) =>
            dispatch({ type: 'RESTORE_PRESET', day: currentDay, contentType: type, index: idx }),
        );
    };

    return (
        <Block variant="card" num="02" title="关键词卡片" count="25min" desc="核心概念速览，翻转验证掌握度">
            <div className="task-list">
                {allCards.map((card) => {
                    const cardKey = `${currentDay}-${card.idx}`;
                    const evalResult = state.cardEval?.[cardKey];
                    const isFlipped = flippedCards[cardKey] || false;
                    return (
                        <div
                            key={card.isCustom ? `c-${card.customId}` : 'p-0'}
                            className={`ed-card ${isFlipped ? 'flipped' : ''} ${evalResult ? `eval-${evalResult}` : ''}`}
                            onClick={() => toggleFlip(cardKey)}
                        >
                            <div className="ed-card-inner">
                                <div className="ed-card-front">
                                    <button
                                        className="ed-card-del"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (card.isCustom) {
                                                dispatch({
                                                    type: 'DELETE_CUSTOM',
                                                    day: currentDay,
                                                    contentType: type,
                                                    id: card.customId!,
                                                });
                                            } else {
                                                dispatch({
                                                    type: 'HIDE_PRESET',
                                                    day: currentDay,
                                                    contentType: type,
                                                    index: 0,
                                                });
                                            }
                                        }}
                                        title="删除"
                                    >
                                        ×
                                    </button>
                                    <div className="ed-card-title">{card.title}</div>
                                    <div className="ed-card-hint">点击翻转自测</div>
                                </div>
                                <div className="ed-card-back">
                                    <div className="ed-card-answer">{card.keywords}</div>
                                    <div className="ed-card-actions" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            className="ed-card-eval pass"
                                            onClick={() => {
                                                dispatch({
                                                    type: 'TOGGLE_CARD_EVAL',
                                                    day: currentDay,
                                                    cardIndex: card.idx,
                                                    result: 'pass',
                                                });
                                                // 自定义卡片自评 pass 同步计入统计
                                                if (card.isCustom && card.customId) {
                                                    dispatch({
                                                        type: 'TOGGLE_TASK',
                                                        key: `custom-${card.customId}`,
                                                        value: true,
                                                    });
                                                }
                                                setFlippedCards((prev) => ({ ...prev, [cardKey]: false }));
                                            }}
                                        >
                                            ✅
                                        </button>
                                        <button
                                            className="ed-card-eval fail"
                                            onClick={() => {
                                                dispatch({
                                                    type: 'TOGGLE_CARD_EVAL',
                                                    day: currentDay,
                                                    cardIndex: card.idx,
                                                    result: 'fail',
                                                });
                                                if (card.isCustom && card.customId) {
                                                    dispatch({
                                                        type: 'TOGGLE_TASK',
                                                        key: `custom-${card.customId}`,
                                                        value: false,
                                                    });
                                                }
                                                setFlippedCards((prev) => ({ ...prev, [cardKey]: false }));
                                            }}
                                        >
                                            ❌
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <AddRestoreControls
                type={type}
                addingType={addingType}
                setAddingType={setAddingType}
                onAdd={(item) =>
                    dispatch({
                        type: 'ADD_CONTENT',
                        day: currentDay,
                        contentType: type,
                        item,
                    })
                }
                hiddenCount={hidden.length}
                onRestore={restoreAll}
            />
        </Block>
    );
}
