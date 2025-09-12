"use client";
import React from 'react';
import Link from 'next/link';

export interface Crumb {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: Crumb[];
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {items.map((c) => {
          const key = (c.href || '') + '|' + c.label;
          const isLast = items[items.length - 1] === c;
          const content = c.href && !isLast ? (
            <Link href={c.href} className="hover:text-foreground focus:outline-none focus:underline">
              {c.label}
            </Link>
          ) : (
            <span className={isLast ? 'text-foreground font-medium' : ''}>{c.label}</span>
          );
          return (
            <li key={key} className="flex items-center gap-2">
              {content}
              {!isLast && <span className="select-none opacity-70">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
