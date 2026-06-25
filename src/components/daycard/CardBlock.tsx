import { useState } from 'react';
import type { ContentType, CustomItem, PresetOverride } from '../../types';
import { useAppState } from '../../hooks/useAppState';
import { PLAN } from '../../data/plan';
import { Block } from './Block';
import { AddRestoreControls, InlineInput } from './AddRestoreControls';
import { resolvePresetCard } from './helpers';

// 渲染知识卡片区块（3D 翻转 + 自评，支持增删）
//
// 统一卡片列表：预置卡片 index 0，自定义卡片 index 1+
// cardEval 的 key 为 `${day}-${idx}`，自定义卡片自评 pass 时同步标记 task 完成以保留统计
export function CardBlock({ currentDay }: { currentDay: number }) {
    const { state, dispatch } = useAppState();
    const [addingType, setAddingType] = useState<ContentType | null>(null);
    const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
    const [editingId, setEditingId] = useState<string | null>(null);

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
                    const isEditingPreset = !card.isCustom && editingId === 'p-0';
                    const isEditingCustom = card.isCustom && editingId === `custom-${card.customId}`;
                    const resolved = card.isCustom
                        ? { title: card.title, keywords: card.keywords }
                        : resolvePresetCard(state, currentDay, 0, { title: card.title, keywords: card.keywords });

                    if (isEditingPreset || isEditingCustom) {
                        return (
                            <InlineInput
                                key={card.isCustom ? `c-${card.customId}` : 'p-0'}
                                type={type}
                                initial={{ v1: resolved.title, v2: resolved.keywords }}
                                isPreset={!card.isCustom}
                                onRestoreOriginal={
                                    !card.isCustom
                                        ? () =>
                                              dispatch({
                                                  type: 'CLEAR_PRESET_OVERRIDE',
                                                  day: currentDay,
                                                  contentType: type,
                                                  index: 0,
                                              })
                                        : undefined
                                }
                                onConfirm={(payload) => {
                                    if (card.isCustom) {
                                        dispatch({
                                            type: 'UPDATE_CUSTOM',
                                            day: currentDay,
                                            contentType: type,
                                            id: card.customId!,
                                            patch: (payload as { patch: Partial<CustomItem> }).patch,
                                        });
                                    } else {
                                        dispatch({
                                            type: 'SET_PRESET_OVERRIDE',
                                            day: currentDay,
                                            contentType: type,
                                            index: 0,
                                            patch: (payload as { patch: PresetOverride }).patch,
                                        });
                                    }
                                    setEditingId(null);
                                }}
                                onCancel={() => setEditingId(null)}
                            />
                        );
                    }

                    return (
                        <div
                            key={card.isCustom ? `c-${card.customId}` : 'p-0'}
                            className={`ed-card ${isFlipped ? 'flipped' : ''} ${evalResult ? `eval-${evalResult}` : ''}`}
                            onClick={() => {
                                if (editingId) return;
                                toggleFlip(cardKey);
                            }}
                        >
                            <div className="ed-card-inner">
                                <div className="ed-card-front">
                                    <button
                                        className="ed-card-edit"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingId(card.isCustom ? `custom-${card.customId}` : 'p-0');
                                        }}
                                        title="编辑"
                                    >
                                        ✏️
                                    </button>
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
                                    <div className="ed-card-title">{resolved.title}</div>
                                    <div className="ed-card-hint">点击翻转自测</div>
                                </div>
                                <div className="ed-card-back">
                                    <div className="ed-card-answer">{resolved.keywords}</div>
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
