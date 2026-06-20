'use client';

import React, { useState, useEffect } from 'react';
import TaskCard from './TaskCard';
import CreateTaskDialog from './CreateTaskDialog';

interface TasksViewProps {}

export default function TasksView({}: TasksViewProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'PHYSICAL' | 'MENTAL' | 'ECONOMIC'>('MENTAL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleTaskAction = () => {
    fetchTasks();
  };

  // Filter tasks by active tab area
  const areaTasks = tasks.filter(t => (t.area || t.portfolio) === activeTab);
  
  const pinnedTask = areaTasks.find(t => t.isPinned && t.status !== 'COMPLETED');
  const activeTasks = areaTasks.filter(t => t.status === 'ACTIVE' && t.id !== pinnedTask?.id);
  const completedTasks = areaTasks.filter(t => t.status === 'COMPLETED');

  // Sort active tasks
  activeTasks.sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div style={{ paddingBottom: '100px' }}>
      
      {/* Horizontal Tabs */}
      <div className="tab-bar" style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-lg)', overflowX: 'auto', paddingBottom: '4px' }}>
        {[
          { id: 'PHYSICAL', label: 'Física', icon: '🏋️' },
          { id: 'MENTAL', label: 'Mental', icon: '🧠' },
          { id: 'ECONOMIC', label: 'Económica', icon: '💰' }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          const colorVar = `var(--color-${tab.id.toLowerCase()})`;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                flex: 1,
                minWidth: '100px',
                padding: 'var(--space-sm) var(--space-md)',
                background: isActive ? `var(--color-${tab.id.toLowerCase()}-soft)` : 'var(--bg-elevated)',
                border: `1px solid ${isActive ? colorVar : 'var(--glass-border)'}`,
                borderRadius: 'var(--radius-md)',
                color: isActive ? colorVar : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <span style={{ fontSize: '1rem' }}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 'var(--space-xl) 0' }}>Cargando tareas...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          
          {/* Misión Principal (Pinned Task) */}
          <section>
            <h2 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-sm)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: `var(--color-${activeTab.toLowerCase()})` }}>★</span> Misión Principal
            </h2>
            {pinnedTask ? (
              <TaskCard task={pinnedTask} onUpdate={handleTaskAction} />
            ) : (
              <div className="glass-card" style={{ padding: 'var(--space-md)', textAlign: 'center', borderStyle: 'dashed', opacity: 0.7 }}>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', margin: 0 }}>No hay ninguna tarea fijada.</p>
              </div>
            )}
          </section>

          {/* Active Tasks */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
              <h2 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                Tareas Activas ({activeTasks.length})
              </h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {activeTasks.length > 0 ? (
                activeTasks.map(t => (
                  <TaskCard key={t.id} task={t} onUpdate={handleTaskAction} />
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: 'var(--space-md) 0', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                  No hay tareas activas en esta área.
                </div>
              )}
            </div>
          </section>

          {/* Completed Tasks (Collapsible) */}
          {completedTasks.length > 0 && (
            <details style={{ marginTop: 'var(--space-md)' }}>
              <summary style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 'var(--space-xs) 0', userSelect: 'none' }}>
                Completadas ({completedTasks.length})
              </summary>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)', opacity: 0.7 }}>
                {completedTasks.map(t => (
                  <TaskCard key={t.id} task={t} onUpdate={handleTaskAction} />
                ))}
              </div>
            </details>
          )}

          {/* Create Button */}
          <button 
            className={`btn btn--lg btn--${activeTab.toLowerCase()}`}
            onClick={() => setIsCreateOpen(true)}
            style={{ width: '100%', marginTop: 'var(--space-md)' }}
          >
            + Nueva Tarea
          </button>

        </div>
      )}

      {isCreateOpen && (
        <CreateTaskDialog
          open={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onCreated={handleTaskAction}
          initialArea={activeTab}
        />
      )}
    </div>
  );
}
