import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MessageSquare, Link2 } from 'lucide-react';
import type { Thread, Author } from '../../lib/types';
import { CommentCard } from './CommentCard';
import { useStore } from '../../lib/store';

interface ThreadAccordionProps {
  thread: Thread;
  authors: Author[];
}

export const ThreadAccordion: React.FC<ThreadAccordionProps> = ({ thread, authors }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { focusTranscriptMessage } = useStore();

  const getAuthor = (authorRef: string) => {
    return authors.find(a => 
      a.name === authorRef || 
      a['@id'].includes(authorRef.toLowerCase().replace(' ', '_'))
    );
  };

  const mapCommentToTranscriptMessageId = (commentId: string, authorId: string): string | null => {
    const match = commentId.match(/msg-(\d+)/);
    if (!match) return null;
    const numericId = match[1];
    const normalizedAuthor = authorId.startsWith('speaker-')
      ? authorId
      : authorId.trim().toLowerCase().replace(/\s+/g, '-');
    return `msg:${numericId}:${normalizedAuthor}`;
  };

  const handleCommentSelect = (comment: Thread['cx:comments'][number]) => {
    const transcriptId = mapCommentToTranscriptMessageId(comment['@id'], comment.author);
    focusTranscriptMessage(transcriptId ?? null);
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 mr-2">
            <h4 className="font-semibold text-gray-900 mb-1">
              {thread.name}
            </h4>
            <p className="text-sm text-gray-600 line-clamp-2">
              {thread.summary}
            </p>
            
            {/* Referenced Idea Badge */}
            <div className="flex items-center gap-2 mt-2">
              <Link2 size={14} className="text-gray-400" />
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                {thread['ref:idea'].name}
              </span>
            </div>
            
            {/* Comment count */}
            <div className="flex items-center gap-1 mt-2 text-gray-500">
              <MessageSquare size={14} />
              <span className="text-xs">
                {thread['cx:comments'].length} comments
              </span>
            </div>
          </div>
          
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 ml-2"
          >
            <ChevronDown size={20} className="text-gray-400" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-3 border-t border-gray-100">
              {thread['cx:comments'].map((comment) => (
                <CommentCard 
                  key={comment['@id']} 
                  comment={comment}
                  author={getAuthor(comment.author)}
                  onSelect={handleCommentSelect}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
