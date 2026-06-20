'use client';

import React from 'react';
import SleepUploader from './SleepUploader';
import MealLogger from './MealLogger';
import WeightTracker from './WeightTracker';
import EarningsTracker from './EarningsTracker';
import WeeklyAssessment from './WeeklyAssessment';

interface DataViewProps {}

export default function DataView({}: DataViewProps) {
  const sections = [
    { id: 'sleep', title: 'Sueño y Descanso', icon: '🌙', component: <SleepUploader /> },
    { id: 'meals', title: 'Registro de Comidas', icon: '🍽️', component: <MealLogger /> },
    { id: 'weight', title: 'Control de Peso', icon: '⚖️', component: <WeightTracker /> },
    { id: 'earnings', title: 'Ingresos', icon: '💶', component: <EarningsTracker /> },
    { id: 'assessment', title: 'Assessment Semanal', icon: '📝', component: <WeeklyAssessment /> }
  ];

  return (
    <div style={{ paddingBottom: '100px', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {sections.map((section, index) => (
        <details 
          key={section.id} 
          className="glass-card" 
          open={index === 0}
          style={{ padding: 0, overflow: 'hidden' }}
        >
          <summary 
            style={{ 
              padding: 'var(--space-md)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              userSelect: 'none',
              borderBottom: '1px solid transparent'
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>{section.icon}</span>
            {section.title}
          </summary>
          <div style={{ padding: 'var(--space-md)', borderTop: '1px solid var(--glass-border)' }}>
            {section.component}
          </div>
        </details>
      ))}
    </div>
  );
}
