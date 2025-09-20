import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Search } from 'lucide-react';
import type { TranscriptMessage } from '../../lib/types';
import { getAuthorInitials, formatTimestamp } from '../../lib/utils';

interface TranscriptTimelineProps {
  messages: TranscriptMessage[];
  onMessageClick?: (message: TranscriptMessage) => void;
}

const speakerColors = {
  'speaker-1': '#059669', // green
  'speaker-2': '#dc2626', // red  
  'speaker-3': '#7c3aed', // purple
  'speaker-4': '#ea580c', // orange
  'speaker-5': '#0891b2', // cyan
};

const getSpeakerColor = (speakerId: string): string => {
  return speakerColors[speakerId as keyof typeof speakerColors] || '#6b7280';
};

const getSpeakerName = (speakerId: string): string => {
  const names: Record<string, string> = {
    'speaker-1': 'Kirsten',
    'speaker-2': 'Jennifer',
    'speaker-3': 'Alex',
    'speaker-4': 'Nate',
    'speaker-5': 'Speaker 5',
  };
  return names[speakerId] || speakerId;
};

export const TranscriptTimeline: React.FC<TranscriptTimelineProps> = ({ 
  messages, 
  onMessageClick 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMessages, setFilteredMessages] = useState(messages);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMessages(messages);
    } else {
      const filtered = messages.filter(msg => 
        msg.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getSpeakerName(msg.speaker_id).toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMessages(filtered);
    }
  }, [searchQuery, messages]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-heading font-semibold text-gray-900">
          💬 Discussion Transcript
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Chronological conversation with speaker attribution
        </p>

        {/* Search */}
        <div className="mt-3 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages or speakers..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredMessages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages found matching "{searchQuery}"</p>
          </div>
        ) : (
          filteredMessages.map((message, index) => (
            <motion.div
              key={message.message_id}
              className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onMessageClick?.(message)}
            >
              {/* Message Header */}
              <div className="flex items-center gap-3 mb-3">
                {/* Speaker Avatar */}
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                  style={{ backgroundColor: getSpeakerColor(message.speaker_id) }}
                >
                  {getAuthorInitials(getSpeakerName(message.speaker_id))}
                </div>

                {/* Speaker & Time */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      {getSpeakerName(message.speaker_id)}
                    </span>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                      {message.speaker_id}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                    <Clock size={12} />
                    <span>{formatTimestamp(message.startTime)}</span>
                    <span>•</span>
                    <span>Position {message.position}</span>
                  </div>
                </div>
              </div>

              {/* Message Text */}
              <p className="text-gray-700 leading-relaxed">
                {searchQuery && message.text.toLowerCase().includes(searchQuery.toLowerCase()) ? (
                  <span dangerouslySetInnerHTML={{
                    __html: message.text.replace(
                      new RegExp(`(${searchQuery})`, 'gi'),
                      '<mark class="bg-accent-amber/30">$1</mark>'
                    )
                  }} />
                ) : (
                  message.text
                )}
              </p>
            </motion.div>
          ))
        )}
      </div>

      {/* Stats */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between text-sm text-gray-600">
          <span>{filteredMessages.length} messages</span>
          <span>{new Set(filteredMessages.map(m => m.speaker_id)).size} speakers</span>
        </div>
      </div>
    </div>
  );
};
