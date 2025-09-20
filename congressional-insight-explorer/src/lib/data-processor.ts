import type { 
  CongressionalData, 
  GraphData, 
  GraphNode, 
  GraphEdge, 
  Cluster, 
  Thread,
  Edge 
} from './types';

export class CongressionalDataProcessor {
  private colorMap: Record<string, string> = {
    'cx:cluster-appropriations-intake': '#059669',
    'cx:cluster-hearings-modernization': '#7c3aed', 
    'cx:cluster-witness-management': '#ea580c',
    'cx:cluster-data-standards': '#0891b2',
    'cx:cluster-transparency-oversight': '#dc2626',
    'cx:cluster-staff-capacity': '#4338ca',
    'cx:cluster-public-feedback': '#65a30d',
    'cx:cluster-joint-hearings-mra': '#be123c',
    'cx:cluster-committee-memory': '#a21caf',
  };

  parseJsonLD(data: CongressionalData): GraphData {
    const nodes = this.buildNodes(data.hasPart);
    const edges = this.buildEdges(data['cx:edges']);
    
    return { nodes, edges };
  }

  private buildNodes(clusters: Cluster[]): GraphNode[] {
    return clusters.map(cluster => {
      const commentCount = this.countComments(cluster['cx:threads']);
      
      return {
        id: cluster['@id'],
        name: cluster.name,
        description: cluster.description,
        size: this.calculateNodeSize(commentCount),
        color: this.colorMap[cluster['@id']] || '#6b7280',
        ideas: cluster.itemListElement,
        threads: cluster['cx:threads'],
        commentCount,
      };
    });
  }

  private buildEdges(edges: Edge[]): GraphEdge[] {
    // First, count outgoing edges per source to identify hub nodes
    const sourceOutgoingCount = new Map<string, number>();
    const targetIncomingCount = new Map<string, number>();
    
    edges.forEach(edge => {
      sourceOutgoingCount.set(edge.from, (sourceOutgoingCount.get(edge.from) || 0) + 1);
      targetIncomingCount.set(edge.to, (targetIncomingCount.get(edge.to) || 0) + 1);
    });

    // Group edges by source-target pairs to detect multiple edges
    const edgeGroups = new Map<string, Edge[]>();
    edges.forEach(edge => {
      const key = `${edge.from}->${edge.to}`;
      if (!edgeGroups.has(key)) {
        edgeGroups.set(key, []);
      }
      edgeGroups.get(key)!.push(edge);
    });

    // Group edges by source for fan-out effect on hub nodes
    const sourceGroups = new Map<string, Edge[]>();
    edges.forEach(edge => {
      if (!sourceGroups.has(edge.from)) {
        sourceGroups.set(edge.from, []);
      }
      sourceGroups.get(edge.from)!.push(edge);
    });

    const result: GraphEdge[] = [];
    edgeGroups.forEach((groupEdges, key) => {
      groupEdges.forEach((edge, index) => {
        const sourceEdges = sourceGroups.get(edge.from) || [];
        const sourceEdgeIndex = sourceEdges.findIndex(e => e.from === edge.from && e.to === edge.to && e.relation === edge.relation);
        const isHub = sourceEdges.length >= 4; // Consider 4+ edges as hub
        
        // Calculate curve offset for hub nodes (fan pattern) or multiple same-pair edges
        let curveOffset = 0;
        if (groupEdges.length > 1) {
          // Multiple edges between same pair
          curveOffset = index > 0 ? (index % 2 === 1 ? index * 30 : -index * 30) : 0;
        } else if (isHub && sourceEdges.length > 1) {
          // Hub node - spread edges in fan pattern
          const totalEdges = sourceEdges.length;
          const fanAngle = Math.PI / (totalEdges > 6 ? 3 : 4); // Spread arc
          const angleStep = fanAngle / Math.max(1, totalEdges - 1);
          const startAngle = -fanAngle / 2;
          curveOffset = (startAngle + sourceEdgeIndex * angleStep) * 60;
        }

        result.push({
          source: edge.from,
          target: edge.to,
          relation: edge.relation,
          strength: this.calculateEdgeStrength(edge.relation),
          id: `${key}-${index}`,
          curveOffset,
          isMultiple: groupEdges.length > 1 || isHub,
          groupIndex: index,
          groupTotal: groupEdges.length,
          isHub,
          hubIndex: sourceEdgeIndex,
          hubTotal: sourceEdges.length,
        });
      });
    });

    return result;
  }

  private countComments(threads: Thread[]): number {
    return threads.reduce((total, thread) => 
      total + thread['cx:comments'].length, 0
    );
  }

  private calculateNodeSize(commentCount: number): number {
    // Logarithmic scaling for better visual balance
    const baseSize = 20;
    const scaleFactor = 5;
    return baseSize + Math.log(commentCount + 1) * scaleFactor;
  }

  private calculateEdgeStrength(relation: string): number {
    // Different relationships have different visual strengths
    const strengthMap: Record<string, number> = {
      'operational dependency': 1.0,
      'learning loop': 0.8,
      'resource constraint': 0.9,
      'resourcing pressure': 0.9,
      'outputs and artifacts': 0.7,
      'reporting on outcomes': 0.7,
      'tagging and retrieval': 0.6,
      'cross-docket tagging': 0.6,
      'improved data structure': 0.7,
      'historical context indexing': 0.6,
    };
    
    return strengthMap[relation] || 0.5;
  }

  // Search index building
  buildSearchIndex(data: CongressionalData): SearchDocument[] {
    const documents: SearchDocument[] = [];
    
    data.hasPart.forEach(cluster => {
      // Index cluster
      documents.push({
        type: 'cluster',
        id: cluster['@id'],
        clusterId: cluster['@id'],
        text: `${cluster.name} ${cluster.description}`,
        metadata: { name: cluster.name },
      });
      
      // Index ideas
      cluster.itemListElement.forEach(idea => {
        documents.push({
          type: 'idea',
          id: idea['@id'],
          clusterId: cluster['@id'],
          text: idea.text,
          metadata: { clusterId: cluster['@id'] },
        });
      });
      
      // Index threads and comments
      cluster['cx:threads'].forEach(thread => {
        documents.push({
          type: 'thread',
          id: thread['@id'],
          clusterId: cluster['@id'],
          text: `${thread.name} ${thread.summary}`,
          metadata: { clusterId: cluster['@id'] },
        });
        
        thread['cx:comments'].forEach(comment => {
          documents.push({
            type: 'comment',
            id: comment['@id'],
            clusterId: cluster['@id'],
            text: comment.text,
            metadata: {
              author: comment.author,
              timestamp: comment.startTime,
              threadId: thread['@id'],
              clusterId: cluster['@id'],
            },
          });
        });
      });
    });
    
    return documents;
  }
}

interface SearchDocument {
  type: 'cluster' | 'thread' | 'comment' | 'idea';
  id: string;
  clusterId: string;
  text: string;
  metadata: Record<string, any>;
}
