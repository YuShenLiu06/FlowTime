import { Link } from 'react-router-dom';
import { History } from 'lucide-react';

interface AppNavProps {
  showHistoryLink?: boolean;
  variant?: 'light' | 'dark';
}

export function AppNav({ showHistoryLink = true, variant = 'dark' }: AppNavProps) {
  const isLight = variant === 'light';
  return (
    <nav className="h-14 px-6 flex items-center justify-between">
      <Link
        to="/"
        className={`font-display text-lg font-bold tracking-tight transition-colors ${
          isLight ? 'text-gray-800 hover:text-gray-600' : 'text-white/90 hover:text-white'
        }`}
      >
        FlowTime
      </Link>
      {showHistoryLink && (
        <Link
          to="/history"
          className={`flex items-center gap-2 text-sm font-mono transition-colors ${
            isLight ? 'text-gray-500 hover:text-gray-700' : 'text-white/50 hover:text-white/80'
          }`}
        >
          <History size={16} />
          <span>历史</span>
        </Link>
      )}
    </nav>
  );
}
