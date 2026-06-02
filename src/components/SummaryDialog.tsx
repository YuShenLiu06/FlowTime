import { useEffect, useRef, useState } from 'react';
import type { TaskRecord } from '../types';
import { formatTime } from '../lib/time';

interface SummaryDialogProps {
  record: TaskRecord;
  isOpen: boolean;
  onSubmit: (text: string) => void;
  onDismiss: () => void;
}

export function SummaryDialog({ record, isOpen, onSubmit, onDismiss }: SummaryDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [text, setText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setText('');
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(text.trim());
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onDismiss}
      className="backdrop:bg-black/60 bg-transparent p-0 fixed inset-0 m-auto w-full max-w-md h-fit max-h-[calc(100vh-2rem)]"
    >
      <div className="bg-flow-surface/95 backdrop-blur-sm p-8 rounded-2xl border border-white/10 animate-slide-up">
        <h2 className="font-display text-2xl text-white mb-2">任务总结</h2>
        <p className="font-mono text-flow-muted text-sm mb-6 truncate">{record.task}</p>

        <div className="flex gap-4 mb-6 p-4 bg-white/5 rounded-xl">
          <div>
            <div className="text-flow-muted/60 text-xs uppercase tracking-wider font-display">专注时长</div>
            <div className="font-mono text-xl text-flow-text">{formatTime(record.flowDurationSec)}</div>
          </div>
          {record.pausedDurationSec > 0 && (
            <div>
              <div className="text-flow-muted/60 text-xs uppercase tracking-wider font-display">暂停时长</div>
              <div className="font-mono text-xl text-flow-muted">{formatTime(record.pausedDurationSec)}</div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="记录一下刚才的收获..."
            className="w-full h-28 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-flow-text/50 resize-none font-mono text-sm"
            autoFocus
          />

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onDismiss}
              className="flex-1 py-3 px-4 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all font-display"
            >
              跳过
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-flow-text text-flow-bg font-bold hover:brightness-110 transition-all font-display"
            >
              保存总结
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
