'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav 
      aria-label="Fil d'Ariane" 
      className={cn('flex items-center space-x-1 text-sm', className)}
      role="navigation"
    >
      <ol className="flex items-center space-x-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isFirst = index === 0;

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight 
                  className="w-4 h-4 mx-1 text-gray-400 flex-shrink-0" 
                  aria-hidden="true"
                />
              )}
              
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1.5 hover:text-blue-600 transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-1',
                    isFirst ? 'text-gray-600' : 'text-gray-500'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {isFirst && !item.icon && (
                    <Home className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  )}
                  {item.icon}
                  <span className="truncate max-w-[150px] sm:max-w-none">{item.label}</span>
                </Link>
              ) : (
                <span
                  className={cn(
                    'flex items-center gap-1.5',
                    isLast ? 'text-gray-900 font-medium' : 'text-gray-500'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {isFirst && !item.icon && (
                    <Home className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  )}
                  {item.icon}
                  <span className="truncate max-w-[150px] sm:max-w-none">{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

