import React from 'react';
import { ClockIcon } from './icons';

interface TimelineEvent {
  id: string;
  timestamp: string;
  source: string;
  content: string;
  type: string;
  device?: string;
}

interface MiniTimelineProps {
  events: TimelineEvent[];
  height?: number;
  onExpandClick?: () => void;
}

const MiniTimeline: React.FC<MiniTimelineProps> = ({ 
  events, 
  height = 300,
  onExpandClick 
}) => {
  // Sort events by timestamp
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Group events by date
  const groupedByDate: Record<string, TimelineEvent[]> = {};
  sortedEvents.forEach(event => {
    const dateKey = formatDate(event.timestamp);
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = [];
    }
    groupedByDate[dateKey].push(event);
  });

  return (
    <div className="mini-timeline bg-slate-900/50 rounded-lg border border-slate-700" style={{ maxHeight: height }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center gap-2">
          <ClockIcon className="h-5 w-5 text-cyan-400" />
          <h4 className="text-sm font-semibold text-white">Timeline View</h4>
          <span className="text-xs text-slate-400">({sortedEvents.length} events)</span>
        </div>
        {onExpandClick && (
          <button
            onClick={onExpandClick}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            📊 Open Full Timeline →
          </button>
        )}
      </div>

      {/* Timeline Content */}
      <div className="overflow-y-auto p-4 space-y-4" style={{ maxHeight: height - 60 }}>
        {Object.entries(groupedByDate).map(([date, dateEvents]) => (
          <div key={date} className="space-y-3">
            {/* Date Header */}
            <div className="flex items-center gap-2 sticky top-0 bg-slate-900/90 py-1 z-10">
              <div className="h-px flex-1 bg-slate-700"></div>
              <span className="text-xs font-medium text-slate-400 px-2">{date}</span>
              <div className="h-px flex-1 bg-slate-700"></div>
            </div>

            {/* Events for this date */}
            {dateEvents.map((event, idx) => (
              <div key={event.id} className="flex items-start gap-3 group">
                {/* Timeline Line */}
                <div className="flex flex-col items-center flex-shrink-0 w-20">
                  <span className="text-xs text-slate-500 font-mono">{formatTime(event.timestamp)}</span>
                  <div className="flex flex-col items-center flex-1 mt-1">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 ring-4 ring-cyan-500/20"></div>
                    {idx < dateEvents.length - 1 && (
                      <div className="w-px flex-1 bg-slate-700 min-h-[40px]"></div>
                    )}
                  </div>
                </div>

                {/* Event Content */}
                <div className="flex-1 bg-slate-800/50 rounded-lg p-3 border border-slate-700 hover:border-cyan-500/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-sm font-medium text-cyan-300">{event.source}</span>
                      {event.device && (
                        <span className="text-xs text-slate-500 ml-2">• {event.device}</span>
                      )}
                    </div>
                    <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">
                      {event.type}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 line-clamp-2">
                    {event.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-slate-700 bg-slate-800/50">
        <p className="text-xs text-slate-500">
          💡 Tip: Events are chronologically ordered from earliest to latest
        </p>
      </div>
    </div>
  );
};

export default MiniTimeline;
