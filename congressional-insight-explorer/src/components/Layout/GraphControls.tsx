import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface GraphControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onFilterClick: () => void;
}

export const GraphControls: React.FC<GraphControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onResetView,
  onFilterClick,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute bottom-6 left-6 bg-white rounded-lg shadow-lg p-2 flex flex-col gap-1"
    >
      <button
        onClick={onZoomIn}
        className={cn(
          'p-2 hover:bg-gray-100 rounded transition-colors',
          'text-gray-700 hover:text-gray-900'
        )}
        aria-label="Zoom in"
      >
        <ZoomIn size={20} />
      </button>
      
      <button
        onClick={onZoomOut}
        className={cn(
          'p-2 hover:bg-gray-100 rounded transition-colors',
          'text-gray-700 hover:text-gray-900'
        )}
        aria-label="Zoom out"
      >
        <ZoomOut size={20} />
      </button>
      
      <button
        onClick={onResetView}
        className={cn(
          'p-2 hover:bg-gray-100 rounded transition-colors',
          'text-gray-700 hover:text-gray-900'
        )}
        aria-label="Reset view"
      >
        <Maximize2 size={20} />
      </button>
      
      <div className="h-px bg-gray-200 my-1" />
      
      <button
        onClick={onFilterClick}
        className={cn(
          'p-2 hover:bg-gray-100 rounded transition-colors',
          'text-gray-700 hover:text-gray-900'
        )}
        aria-label="Filter"
      >
        <Filter size={20} />
      </button>
    </motion.div>
  );
};
