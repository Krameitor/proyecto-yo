'use client';

import React, { useRef, useEffect, useState } from 'react';
import TimeBlockCard from './TimeBlockCard';

interface CalendarGridProps {
  blocks: any[];
  onStartBlock: (id: string) => void;
  onEndBlock: (id: string) => void;
  onDeleteBlock: (id: string) => void;
  onTaskToggle: (taskId: string, completed: boolean) => void;
  onAssignTask: (blockId: string, area: string) => void;
  onEmptyClick: (hour: number) => void;
  isToday: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function CalendarGrid({
  blocks,
  onStartBlock,
  onEndBlock,
  onDeleteBlock,
  onTaskToggle,
  onAssignTask,
  onEmptyClick,
  isToday,
}: CalendarGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  // Update current time line every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());
    }, 60000);
    
    // Initial scroll to current time (offset slightly so it's vertically centered)
    if (containerRef.current) {
      const now = new Date();
      const currentMin = now.getHours() * 60 + now.getMinutes();
      // center the line in the viewport (assuming ~400px height for the viewport)
      containerRef.current.scrollTop = Math.max(0, currentMin - 200);
    }
    
    return () => clearInterval(interval);
  }, []);

  const getBlockStyles = (block: any) => {
    const start = new Date(block.startTime);
    const end = new Date(block.endTime);
    
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    let durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    
    // Ensure minimum height so it's clickable
    durationMinutes = Math.max(durationMinutes, 30);
    
    // Handle blocks that span past midnight (cap at midnight)
    if (startMinutes + durationMinutes > 1440) {
      durationMinutes = 1440 - startMinutes;
    }

    return {
      top: `${startMinutes}px`, // 1px = 1 min
      height: `${durationMinutes}px`,
    };
  };

  return (
    <div className="calendar-grid-scroll" ref={containerRef}>
      <div className="calendar-grid" style={{ height: '1440px' }}>
        
        {/* Current Time Indicator */}
        {isToday && (
          <div 
            className="calendar-current-time-line" 
            style={{ top: `${currentTimeMinutes}px` }} 
          />
        )}

        {/* 24 Hour Rows */}
        {HOURS.map((hour) => (
          <div key={hour} className="calendar-row">
            <div className="calendar-time-label">
              {hour.toString().padStart(2, '0')}:00
            </div>
            <div className="calendar-row-content">
              {/* Clickable area to create new block */}
              <div 
                className="calendar-clickable-area"
                onClick={() => onEmptyClick(hour)}
                title="Hacer click para crear bloque"
              />
            </div>
          </div>
        ))}

        {/* Render Blocks */}
        {blocks.map((block) => {
          const styles = getBlockStyles(block);
          const isCompact = parseInt(styles.height) < 80;
          return (
            <div 
              key={block.id} 
              className={`calendar-block-wrapper ${isCompact ? 'compact' : ''}`}
              style={styles}
            >
              <TimeBlockCard
                block={block}
                onStartBlock={onStartBlock}
                onEndBlock={onEndBlock}
                onDeleteBlock={onDeleteBlock}
                onTaskToggle={onTaskToggle}
                onAssignTask={onAssignTask}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
