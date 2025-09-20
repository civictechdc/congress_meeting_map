import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Clock, Pause, Play, Search } from 'lucide-react';
import type { TranscriptMessage } from '../../lib/types';
import { getAuthorInitials, formatTimestamp, cn } from '../../lib/utils';

interface TranscriptTimelineProps {
  messages: TranscriptMessage[];
  onMessageClick?: (message: TranscriptMessage) => void;
  focusedMessageId?: string | null;
  onFocusHandled?: () => void;
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

const parseTimestampToSeconds = (timestamp: string): number => {
  const parts = timestamp.split(':').map(Number).filter(n => !Number.isNaN(n));

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  }

  if (parts.length === 1) {
    return parts[0];
  }

  return 0;
};

const formatSeconds = (totalSeconds: number): string => {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '0:00';

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const TranscriptTimeline: React.FC<TranscriptTimelineProps> = ({ 
  messages, 
  onMessageClick,
  focusedMessageId,
  onFocusHandled,
}) => {
  const baseUrl = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  const audioSource = `${baseUrl}audio/mono.m4a`;
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMessages, setFilteredMessages] = useState(messages);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const messagesWithTimings = useMemo(
    () =>
      messages
        .map(message => ({
          ...message,
          startSeconds: parseTimestampToSeconds(message.startTime),
        }))
        .sort((a, b) => a.startSeconds - b.startSeconds),
    [messages]
  );

  const activeMessageId = useMemo(() => {
    const currentSeconds = currentTime;

    let activeId: string | null = null;
    for (const message of messagesWithTimings) {
      if (message.startSeconds <= currentSeconds + 0.25) {
        activeId = message.message_id;
      } else {
        break;
      }
    }

    return activeId;
  }, [currentTime, messagesWithTimings]);

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

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    const handleTimeUpdate = () => setCurrentTime(audioEl.currentTime);
    const handleLoadedMetadata = () => setDuration(audioEl.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audioEl.addEventListener('timeupdate', handleTimeUpdate);
    audioEl.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioEl.addEventListener('play', handlePlay);
    audioEl.addEventListener('pause', handlePause);
    audioEl.addEventListener('ended', handleEnded);

    return () => {
      audioEl.removeEventListener('timeupdate', handleTimeUpdate);
      audioEl.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioEl.removeEventListener('play', handlePlay);
      audioEl.removeEventListener('pause', handlePause);
      audioEl.removeEventListener('ended', handleEnded);
    };
  }, []);

  const handleTogglePlayback = () => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    if (audioEl.paused) {
      void audioEl.play();
    } else {
      audioEl.pause();
    }
  };

  const handleSeek = (newTime: number) => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    audioEl.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleMessageSelection = (message: TranscriptMessage) => {
    const audioEl = audioRef.current;
    const targetTime = parseTimestampToSeconds(message.startTime);

    if (audioEl) {
      audioEl.currentTime = targetTime;
      setCurrentTime(targetTime);
      if (audioEl.paused) {
        void audioEl.play();
      }
    }

    onMessageClick?.(message);
  };

  useEffect(() => {
    if (!focusedMessageId) return;

    const container = listRef.current;
    const audioEl = audioRef.current;
    if (!container) {
      onFocusHandled?.();
      return;
    }

    const target = container.querySelector<HTMLElement>(`[data-message-id="${focusedMessageId}"]`);
    const targetMessage = messagesWithTimings.find((m) => m.message_id === focusedMessageId);

    if (!target || !targetMessage) {
      onFocusHandled?.();
      return;
    }

    const preferredOffset = target.offsetTop - container.clientHeight * 0.3;
    const maxScrollableTop = Math.max(0, container.scrollHeight - container.clientHeight);
    const idealTop = Math.min(
      Math.max(0, preferredOffset),
      maxScrollableTop
    );
    container.scrollTo({ top: idealTop, behavior: 'smooth' });

    if (audioEl && Number.isFinite(targetMessage.startSeconds)) {
      audioEl.currentTime = targetMessage.startSeconds;
      setCurrentTime(targetMessage.startSeconds);
    }

    setHighlightedId(focusedMessageId);

    const clearHighlight = window.setTimeout(() => setHighlightedId(null), 2200);
    const notifyHandled = window.setTimeout(() => onFocusHandled?.(), 400);

    return () => {
      window.clearTimeout(clearHighlight);
      window.clearTimeout(notifyHandled);
    };
  }, [focusedMessageId, onFocusHandled, messagesWithTimings]);

  return (
    <div className="h-full flex flex-col">
      <audio ref={audioRef} src={audioSource} preload="metadata" hidden />
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-heading font-semibold text-gray-900">
          💬 Discussion Transcript
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Chronological conversation with speaker attribution
        </p>

        {/* Audio Controls */}
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleTogglePlayback}
              className="h-10 w-10 rounded-full bg-primary-blue text-white flex items-center justify-center shadow-sm hover:bg-primary-blue/90 focus:outline-none focus:ring-2 focus:ring-primary-blue"
              aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>{formatSeconds(currentTime)}</span>
                <span>{formatSeconds(duration)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.01}
                value={Number.isFinite(currentTime) ? currentTime : 0}
                onChange={(event) => handleSeek(Number(event.target.value))}
                className="w-full accent-primary-blue"
                aria-label="Audio progress"
              />
            </div>
          </div>
        </div>

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
      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredMessages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages found matching "{searchQuery}"</p>
          </div>
        ) : (
          filteredMessages.map((message, index) => (
            <motion.div
              key={message.message_id}
              data-message-id={message.message_id}
              className={cn(
                'bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer',
                message.message_id === activeMessageId ? 'border-primary-blue ring-2 ring-primary-blue/30 shadow-md' : '',
                highlightedId === message.message_id ? 'ring-4 ring-accent-amber/60 border-accent-amber/70 shadow-lg' : ''
              )}
              initial={index < 12 ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index < 12 ? index * 0.05 : 0 }}
              onClick={() => handleMessageSelection(message)}
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
