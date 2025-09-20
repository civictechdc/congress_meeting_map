import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, Image, MessageSquare, Network } from 'lucide-react';
import { WhiteboardGallery } from './WhiteboardGallery';
import { TranscriptTimeline } from './TranscriptTimeline';
import { ForceDirectedGraph } from '../Graph/ForceDirectedGraph';
import { ClusterDetail } from '../DetailPane/ClusterDetail';
import { EdgeDetail } from '../DetailPane/EdgeDetail';
import type { TranscriptData, TranscriptMessage, CongressionalData, GraphData } from '../../lib/types';
import { useStore } from '../../lib/store';
import { cn } from '../../lib/utils';

interface ExplorerShellProps {
  transcriptData: TranscriptData;
  congressionalData: CongressionalData;
  graphData: GraphData;
}

type ActivePanel = 'photos' | 'transcript' | 'knowledge';

export const ExplorerShell: React.FC<ExplorerShellProps> = ({
  transcriptData,
  congressionalData,
  graphData,
}) => {
  const [activePanel, setActivePanel] = useState<ActivePanel>('knowledge');
  const { selectedClusterId, selectedEdgeId, detailPaneOpen } = useStore();

  const edgesWithIds = graphData.edges.map((edge, index) => ({
    ...edge,
    id: edge.id || `edge-${edge.source}-${edge.target}-${index}`,
  }));

  const selectedCluster = selectedClusterId 
    ? congressionalData.hasPart.find(cluster => cluster['@id'] === selectedClusterId) || null
    : null;

  const selectedEdge = selectedEdgeId
    ? edgesWithIds.find(edge => edge.id === selectedEdgeId) || null
    : null;

  const handleImageClick = (imageIndex: number) => {
    console.log('Image clicked:', imageIndex);
    // Could implement cross-linking logic here
  };

  const handleMessageClick = (message: TranscriptMessage) => {
    console.log('Message clicked:', message);
    // Could implement cross-linking logic here
  };

  const tabs = [
    { id: 'knowledge', label: 'Knowledge Graph', icon: Network },
    { id: 'photos', label: 'Photos', icon: Image },
    { id: 'transcript', label: 'Transcript', icon: MessageSquare },
  ] as const;

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-4">
        <div className="flex space-x-8">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActivePanel(id)}
              className={cn(
                'flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors',
                activePanel === id
                  ? 'border-primary-blue text-primary-blue'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Panel Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Panel */}
        <div className={cn(
          'flex-1 transition-all duration-300',
          detailPaneOpen && activePanel === 'knowledge' ? 'md:pr-[400px] lg:pr-[480px]' : ''
        )}>
          <motion.div
            key={activePanel}
            className="h-full"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activePanel === 'photos' && (
              <WhiteboardGallery onImageClick={handleImageClick} />
            )}
            
            {activePanel === 'transcript' && (
              <TranscriptTimeline 
                messages={transcriptData.messages}
                onMessageClick={handleMessageClick}
              />
            )}
            
            {activePanel === 'knowledge' && (
              <div className="h-full relative">
                <ForceDirectedGraph
                  data={graphData}
                />
              </div>
            )}
          </motion.div>
        </div>

        {/* Detail Pane (only for knowledge graph) */}
        {activePanel === 'knowledge' && (
          <>
            {selectedCluster && (
              <ClusterDetail 
                cluster={selectedCluster} 
                authors={congressionalData.authors}
                edges={edgesWithIds}
                nodes={graphData.nodes}
              />
            )}
            {selectedEdge && (
              <EdgeDetail 
                edge={selectedEdge} 
                nodes={graphData.nodes}
              />
            )}
          </>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>📸 {2} photos</span>
            <span>💬 {transcriptData.messages.length} messages</span>
            <span>🕸️ {graphData.nodes.length} clusters</span>
          </div>
          <div className="flex items-center gap-1">
            <Layers size={12} />
            <span>Multi-Modal Explorer</span>
          </div>
        </div>
      </div>
    </div>
  );
};
