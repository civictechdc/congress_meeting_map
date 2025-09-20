import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Network, Info } from 'lucide-react';
import type { GraphEdge, GraphNode } from '../../lib/types';
import { useStore } from '../../lib/store';
import { cn } from '../../lib/utils';

interface EdgeDetailProps {
  edge: GraphEdge | null;
  nodes: GraphNode[];
}

export const EdgeDetail: React.FC<EdgeDetailProps> = ({ edge, nodes }) => {
  const { detailPaneOpen, setDetailPaneOpen, setSelectedCluster } = useStore();

  if (!edge) return null;

  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);

  if (!sourceNode || !targetNode) return null;

  return (
    <AnimatePresence>
      {detailPaneOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className={cn(
            'absolute right-0 inset-y-0 w-full md:w-[400px] lg:w-[480px]',
            'bg-white shadow-2xl border-l border-gray-200 z-50',
            'overflow-hidden flex flex-col'
          )}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-600 to-slate-700 text-white p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-heading font-bold flex-1 mr-4">
                Relationship
              </h2>
              <button
                onClick={() => setDetailPaneOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Close detail pane"
              >
                <X size={20} />
              </button>
            </div>
            {/* Connection Visual */}
            <div className="bg-white/10 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-center space-x-3">
                <button
                  type="button"
                  onClick={() => setSelectedCluster(sourceNode.id)}
                  className="text-center px-2 py-1 rounded hover:bg-white/20 transition-colors"
                  aria-label={`Open source cluster ${sourceNode.name}`}
                  title="Open source cluster"
                >
                  <div className="text-xs text-slate-200 mb-1">FROM</div>
                  <div className="text-sm font-medium">{sourceNode.name}</div>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCluster(targetNode.id)}
                  className="text-center px-2 py-1 rounded hover:bg-white/20 transition-colors"
                  aria-label={`Open target cluster ${targetNode.name}`}
                  title="Open target cluster"
                >
                  <div className="text-xs text-slate-200 mb-1">TO</div>
                  <div className="text-sm font-medium">{targetNode.name}</div>
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-4">
              <div className="flex items-center gap-1">
                <Network size={16} />
                <span className="text-sm">
                  {edge.isHub ? 'Hub Connection' : edge.isMultiple ? 'Multiple Edge' : 'Direct Link'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Info size={16} />
                <span className="text-sm">Strength: {edge.strength.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Relationship Description */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-heading font-semibold mb-4 text-gray-900">
                How They Connect
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-800 leading-relaxed">
                  {edge.relation}
                </p>
              </div>
            </div>

            {/* Source Cluster Info */}
            <button
              type="button"
              onClick={() => setSelectedCluster(sourceNode.id)}
              className="p-6 border-b border-gray-200 text-left w-full hover:bg-gray-50 transition-colors"
              title="Open source cluster"
            >
              <h3 className="text-lg font-heading font-semibold mb-3 text-gray-900">
                Source: {sourceNode.name}
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                {sourceNode.description}
              </p>
              <div className="flex gap-4 text-sm text-gray-500">
                <span>{sourceNode.ideas.length} ideas</span>
                <span>{sourceNode.commentCount} comments</span>
                <span>{sourceNode.threads.length} threads</span>
              </div>
            </button>

            {/* Target Cluster Info */}
            <button
              type="button"
              onClick={() => setSelectedCluster(targetNode.id)}
              className="p-6 text-left w-full hover:bg-gray-50 transition-colors"
              title="Open target cluster"
            >
              <h3 className="text-lg font-heading font-semibold mb-3 text-gray-900">
                Target: {targetNode.name}
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                {targetNode.description}
              </p>
              <div className="flex gap-4 text-sm text-gray-500">
                <span>{targetNode.ideas.length} ideas</span>
                <span>{targetNode.commentCount} comments</span>
                <span>{targetNode.threads.length} threads</span>
              </div>
            </button>

            {/* Edge Properties */}
            {(edge.isHub || edge.isMultiple) && (
              <div className="p-6 border-t border-gray-200">
                <h3 className="text-lg font-heading font-semibold mb-3 text-gray-900">
                  Connection Properties
                </h3>
                <div className="space-y-2">
                  {edge.isHub && (
                    <div className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded">
                      <span className="text-sm text-blue-800">Hub Connection</span>
                      <span className="text-xs text-blue-600">
                        {edge.hubIndex! + 1} of {edge.hubTotal} edges
                      </span>
                    </div>
                  )}
                  {edge.isMultiple && (
                    <div className="flex items-center justify-between py-2 px-3 bg-purple-50 rounded">
                      <span className="text-sm text-purple-800">Multiple Relationship</span>
                      <span className="text-xs text-purple-600">
                        {edge.groupIndex! + 1} of {edge.groupTotal} connections
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
