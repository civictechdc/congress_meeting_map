import React from 'react';
import { Clock } from 'lucide-react';
import type { Comment, Author } from '../../lib/types';
import { formatTimestamp, getAuthorInitials } from '../../lib/utils';
import { motion } from 'framer-motion';

interface CommentCardProps {
  comment: Comment;
  author?: Author;
}

export const CommentCard: React.FC<CommentCardProps> = ({ comment, author }) => {
  const authorName = author?.name || comment.author;
  const initials = getAuthorInitials(authorName);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="comment-card"
    >
      <div className="flex items-start gap-3">
        {/* Author Avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-blue to-secondary-blue flex items-center justify-center text-white font-semibold text-sm">
            {initials}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">
                {authorName}
              </span>
              {author?.position && (
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                  Speaker {author.position}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1 text-gray-500">
              <Clock size={12} />
              <span className="text-xs">
                {formatTimestamp(comment.startTime)}
              </span>
            </div>
          </div>

          {/* Comment Text */}
          <p className="text-sm text-gray-700 leading-relaxed">
            {comment.text}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
