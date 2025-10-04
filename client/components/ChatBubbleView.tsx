import React from 'react';

interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  type: 'sent' | 'received';
  app?: string;
}

interface ChatBubbleViewProps {
  messages: ChatMessage[];
  height?: number;
}

const ChatBubbleView: React.FC<ChatBubbleViewProps> = ({ messages, height = 400 }) => {
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
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  // Group messages by date
  const groupedByDate: Record<string, ChatMessage[]> = {};
  messages.forEach(msg => {
    const dateKey = formatDate(msg.timestamp);
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = [];
    }
    groupedByDate[dateKey].push(msg);
  });

  return (
    <div className="chat-bubbles-view bg-slate-900/50 rounded-lg border border-slate-700" style={{ maxHeight: height }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center gap-2">
          <span className="text-lg">💬</span>
          <h4 className="text-sm font-semibold text-white">Conversation View</h4>
          <span className="text-xs text-slate-400">({messages.length} messages)</span>
        </div>
        {messages[0]?.app && (
          <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded">
            {messages[0].app}
          </span>
        )}
      </div>

      {/* Chat Content */}
      <div className="overflow-y-auto p-4 space-y-4" style={{ maxHeight: height - 120 }}>
        {Object.entries(groupedByDate).map(([date, dateMessages]) => (
          <div key={date} className="space-y-3">
            {/* Date Separator */}
            <div className="flex items-center justify-center py-2">
              <span className="px-3 py-1 bg-slate-800 text-slate-400 text-xs rounded-full border border-slate-700">
                {date}
              </span>
            </div>

            {/* Messages */}
            {dateMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%] ${msg.type === 'sent' ? 'order-2' : ''}`}>
                  {/* Sender Name (for received messages) */}
                  {msg.type === 'received' && (
                    <div className="text-xs text-slate-500 mb-1 px-2">
                      {msg.sender}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl px-4 py-2 shadow-lg ${
                      msg.type === 'sent'
                        ? 'bg-cyan-600 text-white rounded-br-sm'
                        : 'bg-slate-700 text-slate-100 rounded-bl-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>

                  {/* Timestamp */}
                  <div
                    className={`text-xs text-slate-500 mt-1 px-2 ${
                      msg.type === 'sent' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-slate-700 bg-slate-800/50">
        <p className="text-xs text-slate-500">
          💡 Forensic chat reconstruction from evidence data
        </p>
      </div>
    </div>
  );
};

export default ChatBubbleView;
