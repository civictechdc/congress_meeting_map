import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag, MessageCircle, Users, ArrowRight } from 'lucide-react';
import type { Cluster, Author, GraphEdge, GraphNode } from '../../lib/types';
import { useStore } from '../../lib/store';
import { ThreadAccordion } from './ThreadAccordion.tsx';
import { IdeaBadge } from './IdeaBadge.tsx';
import { cn } from '../../lib/utils';

interface ClusterDetailProps {
  cluster: Cluster | null;
  authors: Author[];
  edges: GraphEdge[];
  nodes: GraphNode[];
}

export const ClusterDetail: React.FC<ClusterDetailProps> = ({ cluster, authors, edges, nodes }) => {
  const { detailPaneOpen, setDetailPaneOpen, setSelectedEdge } = useStore();

  if (!cluster) return null;

  const totalComments = cluster['cx:threads'].reduce(
    (sum, thread) => sum + thread['cx:comments'].length,
    0
  );

  const relatedEdges = edges.filter(
    (e) => e.source === cluster['@id'] || e.target === cluster['@id']
  );

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
          <div className="bg-gradient-to-r from-primary-blue to-secondary-blue text-white p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-heading font-bold flex-1 mr-4">
                {cluster.name}
              </h2>
              <button
                onClick={() => setDetailPaneOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Close detail pane"
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="text-blue-100 text-sm leading-relaxed">
              {cluster.description}
            </p>

            {/* Stats */}
            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-1">
                <Tag size={16} />
                <span className="text-sm">{cluster.itemListElement.length} ideas</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle size={16} />
                <span className="text-sm">{totalComments} comments</span>
              </div>
              <div className="flex items-center gap-1">
                <Users size={16} />
                <span className="text-sm">{cluster['cx:threads'].length} threads</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Key Ideas */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-heading font-semibold mb-4 text-gray-900">
                Key Ideas
              </h3>
              <div className="space-y-2">
                {cluster.itemListElement.map((idea) => (
                  <IdeaBadge key={idea['@id']} idea={idea} />
                ))}
              </div>
            </div>

            {/* Connections */}
            {relatedEdges.length > 0 && (
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-heading font-semibold mb-4 text-gray-900">
                  Connections
                </h3>
                <div className="space-y-2">
                  {relatedEdges.map((edge) => {
                    const isSource = edge.source === cluster['@id'];
                    const otherId = isSource ? (edge.target as string) : (edge.source as string);
                    const otherNode = nodes.find((n) => n.id === otherId);
                    const edgeId = edge.id || `edge-${edge.source}-${edge.target}`;
                    return (
                      <button
                        key={edgeId}
                        onClick={() => setSelectedEdge(edgeId)}
                        className="w-full text-left flex items-center justify-between p-3 rounded-md hover:bg-gray-50 border border-gray-200"
                        title="View relationship details"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-gray-500">
                            {isSource ? 'From' : 'To'}
                          </span>
                          <div className="flex items-center gap-2">
                            {isSource ? (
                              <>
                                <span className="text-sm font-semibold text-gray-900">{cluster.name}</span>
                                <ArrowRight size={16} className="text-gray-500" />
                                <span className="text-sm text-gray-800">{otherNode?.name || otherId}</span>
                              </>
                            ) : (
                              <>
                                <span className="text-sm text-gray-800">{otherNode?.name || otherId}</span>
                                <ArrowRight size={16} className="text-gray-500" />
                                <span className="text-sm font-semibold text-gray-900">{cluster.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-gray-600 truncate max-w-[40%]">{edge.relation}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Discussion Threads */}
            <div className="p-6">
              <h3 className="text-lg font-heading font-semibold mb-4 text-gray-900">
                Discussion Threads
              </h3>
              <div className="space-y-3">
                {cluster['cx:threads'].map((thread) => (
                  <ThreadAccordion 
                    key={thread['@id']} 
                    thread={thread} 
                    authors={authors}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
