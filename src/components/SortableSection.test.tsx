import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SortableSection } from './SortableSection';

// 简单条目渲染
const renderItem = (id: string) => <div data-testid={`item-${id}`}>条目 {id}</div>;

describe('SortableSection', () => {
    it('渲染所有条目且包含拖拽手柄', () => {
        const items = [
            { id: 'a', node: renderItem('a') },
            { id: 'b', node: renderItem('b') },
        ];
        render(<SortableSection items={items} onReorder={() => {}} />);
        expect(screen.getByTestId('item-a')).toBeInTheDocument();
        expect(screen.getByTestId('item-b')).toBeInTheDocument();
        // 每个条目有一个 aria-label="拖动排序" 的手柄按钮
        expect(screen.getAllByLabelText('拖动排序')).toHaveLength(2);
    });

    it('手柄为 button 元素，可聚焦', () => {
        const items = [{ id: 'a', node: renderItem('a') }];
        render(<SortableSection items={items} onReorder={() => {}} />);
        const handle = screen.getByLabelText('拖动排序');
        expect(handle.tagName).toBe('BUTTON');
    });

    it('空列表时不报错', () => {
        const { container } = render(<SortableSection items={[]} onReorder={() => {}} />);
        expect(container).toBeInTheDocument();
    });
});
