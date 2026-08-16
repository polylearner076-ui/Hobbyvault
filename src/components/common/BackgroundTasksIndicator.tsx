import React from 'react';
import { useVault } from '../../context/VaultContext';
import { Sparkles, Loader2, CheckCircle2, AlertCircle, X, ExternalLink } from 'lucide-react';

export const BackgroundTasksIndicator: React.FC = () => {
  const { agentBackgroundTasks, dismissBackgroundTask, setActiveSandboxId, setActiveView } = useVault();

  if (!agentBackgroundTasks || agentBackgroundTasks.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {agentBackgroundTasks.map((task) => {
        const isRunning = task.status === 'running';
        const isCompleted = task.status === 'completed';
        const isError = task.status === 'error';

        return (
          <div
            key={task.id}
            id={`bg-task-${task.id}`}
            className="pointer-events-auto p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-black/[0.08] shadow-xl text-[#1C1C1E] flex items-center justify-between gap-3 animate-in slide-in-from-bottom-3 duration-200"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                  isRunning
                    ? 'bg-purple-100 text-purple-700'
                    : isCompleted
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {isRunning && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isCompleted && <Sparkles className="w-3.5 h-3.5" />}
                {isError && <AlertCircle className="w-3.5 h-3.5" />}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
                    {isRunning ? 'Agent Background Task' : isCompleted ? 'Agent Completed' : 'Task Failed'}
                  </span>
                  <span className="text-[10px] text-[#8E8E93] font-mono">{task.model}</span>
                </div>
                <p className="text-xs font-semibold truncate text-[#1C1C1E]">
                  {task.prompt}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {isCompleted && task.createdSandboxId && (
                <button
                  id={`btn-view-agent-window-${task.id}`}
                  onClick={() => {
                    setActiveSandboxId(task.createdSandboxId!);
                    setActiveView('portfolio');
                    dismissBackgroundTask(task.id);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer transition-transform hover:scale-105"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>View</span>
                </button>
              )}

              <button
                onClick={() => dismissBackgroundTask(task.id)}
                className="p-1 rounded-lg text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-black/[0.05] transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
