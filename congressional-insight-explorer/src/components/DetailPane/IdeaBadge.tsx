import React from 'react';
import { Lightbulb } from 'lucide-react';
import type { Idea } from '../../lib/types';
import { motion } from 'framer-motion';

interface IdeaBadgeProps {
  idea: Idea;
}

export const IdeaBadge: React.FC<IdeaBadgeProps> = ({ idea }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.02 }}
      className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors"
    >
      <Lightbulb size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-gray-800 leading-relaxed">
        {idea.text}
      </p>
    </motion.div>
  );
};
