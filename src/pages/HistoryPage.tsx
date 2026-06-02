import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Clock, Target, BarChart3, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import type { TaskRecord } from '../types';
import { getAllHistory } from '../lib/history';
import { getDailyStats, getWeekTotal, getTaskCount, getAverageSession, getTodayTotal } from '../lib/stats';
import { formatTime } from '../lib/time';

function StatCard({
  icon: Icon,
  value,
  label,
  subValue,
  delay = 0
}: {
  icon: any;
  value: string;
  label: string;
  subValue?: string;
  delay?: number;
}) {
  return (
    <div
      className="bg-flow-surface/50 backdrop-blur-sm p-4 rounded-2xl border border-white/5 animate-slide-up"
      style={{ animationDelay: `${delay * 0.1}s` }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-white/5 rounded-lg">
          <Icon size={18} className="text-flow-text" />
        </div>
        <div className="font-mono text-2xl text-white">{value}</div>
      </div>
      <div className="text-flow-muted/60 text-sm font-display uppercase tracking-wider">
        {label}
      </div>
      {subValue && (
        <div className="mt-1 font-mono text-xs text-flow-muted/40">
          {subValue}
        </div>
      )}
    </div>
  );
}

function TaskItem({ record, delay }: { record: TaskRecord; delay: number }) {
  const [expanded, setExpanded] = useState(false);

  const finishedDate = new Date(record.finishedAt);
  const dateStr = finishedDate.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div
      className="bg-flow-surface/30 backdrop-blur-sm rounded-xl border border-white/5 overflow-hidden animate-slide-up hover:bg-flow-surface/40 transition-colors"
      style={{ animationDelay: `${delay * 0.05}s` }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="font-mono text-white truncate">{record.task}</div>
          <div className="flex items-center gap-3 mt-1 text-flow-muted/50 text-xs font-mono">
            <span>{formatTime(record.flowDurationSec)}</span>
            {record.pausedDurationSec > 0 && (
              <span className="opacity-60">暂停 {formatTime(record.pausedDurationSec)}</span>
            )}
            <span className="opacity-40">•</span>
            <span className="opacity-40">{dateStr}</span>
          </div>
        </div>
        <div className="ml-3 flex-shrink-0 text-flow-muted/30">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {expanded && record.summary && (
        <div className="px-4 pb-4 pt-0 border-t border-white/5">
          <div className="mt-3 p-3 bg-white/5 rounded-lg">
            <div className="text-flow-muted/40 text-xs font-display uppercase tracking-wider mb-1">总结</div>
            <div className="text-white/70 font-mono text-sm whitespace-pre-wrap">{record.summary}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export function HistoryPage() {
  const history = useMemo(() => getAllHistory(), []);
  const dailyStats = useMemo(() => getDailyStats(history), [history]);
  const weekTotal = useMemo(() => getWeekTotal(history), [history]);
  const taskCount = useMemo(() => getTaskCount(history), [history]);
  const avgSession = useMemo(() => getAverageSession(history), [history]);
  const todayTotal = useMemo(() => getTodayTotal(history), [history]);

  const chartData = dailyStats.map(d => ({
    date: d.date.slice(5),
    minutes: d.totalSec / 60
  }));

  return (
    <div className="min-h-dvh bg-flow-bg noise-bg">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <header className="flex items-center gap-4 mb-8 animate-fade-in">
          <Link
            to="/"
            className="p-2 -ml-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="font-display text-2xl text-white">任务后台</h1>
            <p className="text-flow-muted/60 font-mono text-sm">你的专注记录</p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 mb-8">
          <StatCard
            icon={Clock}
            value={formatTime(todayTotal)}
            label="今日专注"
            delay={0}
          />
          <StatCard
            icon={BarChart3}
            value={formatTime(weekTotal)}
            label="本周总计"
            delay={1}
          />
          <StatCard
            icon={Target}
            value={String(taskCount)}
            label="完成任务"
            subValue="共"
            delay={2}
          />
          <StatCard
            icon={Calendar}
            value={formatTime(avgSession)}
            label="平均时长"
            delay={3}
          />
        </section>

        {taskCount > 0 && (
          <section className="mb-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="bg-flow-surface/30 backdrop-blur-sm rounded-2xl border border-white/5 p-4">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={16} className="text-flow-muted/60" />
                <span className="text-flow-muted/60 font-display text-sm uppercase tracking-wider">
                  最近两周
                </span>
              </div>
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="rgba(255,255,255,0.2)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontFamily: 'JetBrains Mono, monospace' }}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.2)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontFamily: 'JetBrains Mono, monospace' }}
                      tickFormatter={(value) => `${value}m`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        fontFamily: 'JetBrains Mono, monospace'
                      }}
                      itemStyle={{ color: '#f87171' }}
                      formatter={(value: number) => [`${value.toFixed(1)} 分钟`, '专注']}
                    />
                    <Bar
                      dataKey="minutes"
                      fill="#f87171"
                      radius={[4, 4, 0, 0]}
                      opacity={0.8}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center gap-2 mb-4 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <Clock size={16} className="text-flow-muted/60" />
            <span className="text-flow-muted/60 font-display text-sm uppercase tracking-wider">
              历史记录
            </span>
          </div>

          {taskCount === 0 ? (
            <div className="text-center py-16 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <div className="text-flow-muted/40 font-display text-lg mb-2">还没有专注记录</div>
              <div className="text-flow-muted/30 font-mono text-sm">去开始第一个任务吧</div>
              <Link
                to="/"
                className="inline-block mt-6 px-6 py-3 bg-flow-text text-flow-bg font-bold rounded-xl hover:brightness-110 transition-all font-display"
              >
                开始专注
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((record, index) => (
                <TaskItem key={record.id} record={record} delay={index} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
