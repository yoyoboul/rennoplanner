'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  snapPoints?: number[]; // Percentage heights, e.g., [0.5, 0.9]
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  snapPoints = [0.6, 0.9],
}: BottomSheetProps) {
  const [currentSnapPoint, setCurrentSnapPoint] = React.useState(0);
  const sheetRef = React.useRef<HTMLDivElement>(null);

  // Handle drag end
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const velocity = info.velocity.y;
    const offset = info.offset.y;

    // If dragged down significantly or fast velocity, close
    if (offset > 100 || velocity > 500) {
      onClose();
      return;
    }

    // Otherwise snap to nearest point
    const windowHeight = window.innerHeight;
    // const currentHeight = windowHeight * snapPoints[currentSnapPoint];
    const nextSnapPointIndex = offset < -50 ? Math.min(currentSnapPoint + 1, snapPoints.length - 1) : Math.max(currentSnapPoint - 1, 0);
    
    setCurrentSnapPoint(nextSnapPointIndex);
  };

  // Trap focus inside sheet
  React.useEffect(() => {
    if (!isOpen) return;

    const sheet = sheetRef.current;
    if (!sheet) return;

    const focusableElements = sheet.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscape);

    // Focus first element
    firstElement?.focus();

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const sheetHeight = `${snapPoints[currentSnapPoint] * 100}%`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
            aria-hidden="true"
          />

          {/* Bottom Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            style={{ height: sheetHeight }}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50',
              'bg-white rounded-t-3xl shadow-2xl',
              'flex flex-col',
              'max-h-[95vh]',
              className
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'bottom-sheet-title' : undefined}
            aria-describedby={description ? 'bottom-sheet-description' : undefined}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" aria-hidden="true" />
            </div>

            {/* Header */}
            {(title || description) && (
              <div className="px-6 pb-4 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {title && (
                      <h2
                        id="bottom-sheet-title"
                        className="text-xl font-semibold text-gray-900"
                      >
                        {title}
                      </h2>
                    )}
                    {description && (
                      <p
                        id="bottom-sheet-description"
                        className="mt-1 text-sm text-gray-600"
                      >
                        {description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className={cn(
                      'ml-4 p-2 rounded-full hover:bg-gray-100',
                      'transition-colors',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500'
                    )}
                    aria-label="Fermer"
                  >
                    <X className="w-5 h-5 text-gray-500" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

