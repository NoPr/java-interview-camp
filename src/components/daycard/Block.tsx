import type { BlockVariant } from './helpers';
import type { ReactNode } from 'react';

// 任务区块（Editorial Hybrid 单色系 + 章节编号）
export function Block({
    variant,
    num,
    title,
    count,
    desc,
    featured,
    children,
}: {
    variant: BlockVariant;
    num?: string;
    title: string;
    count?: string;
    desc?: string;
    featured?: boolean;
    children: ReactNode;
}) {
    return (
        <section
            className={`ed-block ed-block--${variant}${featured ? ' ed-block--featured' : ''}`}
        >
            <div className="ed-block-header">
                {num && <span className="ed-block-num">{num}</span>}
                <h3 className="ed-block-title">{title}</h3>
                {count && <span className="ed-block-count">{count}</span>}
            </div>
            {desc && <p className="ed-block-desc">{desc}</p>}
            <div className="ed-block-body">{children}</div>
        </section>
    );
}
