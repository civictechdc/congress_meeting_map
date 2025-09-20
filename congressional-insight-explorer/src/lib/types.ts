// JSON-LD Context Types
export interface JsonLDContext {
  '@vocab': string;
  cx: string;
  Cluster: string;
  Idea: string;
  Thread: string;
  Comment: string;
  Edge: string;
}

// Author/Person Types
export interface Author {
  '@type': string;
  '@id': string;
  position: number;
  name: string;
}

// Core Data Types
export interface Idea {
  '@type': string;
  '@id': string;
  text: string;
}

export interface Comment {
  '@type': string;
  '@id': string;
  startTime: string;
  text: string;
  author: string;
}

export interface IdeaReference {
  '@type': string;
  '@id': string;
  name: string;
}

export interface Thread {
  '@type': string;
  '@id': string;
  'ref:idea': IdeaReference;
  name: string;
  summary: string;
  'cx:comments': Comment[];
}

export interface Cluster {
  '@id': string;
  '@type': string;
  name: string;
  description: string;
  itemListElement: Idea[];
  'cx:threads': Thread[];
}

export interface Edge {
  '@type': string;
  from: string;
  to: string;
  relation: string;
}

export interface Subject {
  '@type': string;
  name: string;
  '@id': string;
}

export interface Location {
  '@type': string;
  name: string;
}

export interface Event {
  '@type': string;
  name: string;
}

// Main Data Structure
export interface CongressionalData {
  '@context': JsonLDContext;
  '@type': string;
  name: string;
  about: Subject[];
  keywords: string[];
  locationCreated: Location;
  authors: Author[];
  hasPart: Cluster[];
  'cx:edges': Edge[];
  isPartOf: Event;
}

// Graph Visualization Types
export interface GraphNode {
  id: string;
  name: string;
  description: string;
  size: number;
  color: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  ideas: Idea[];
  threads: Thread[];
  commentCount: number;
}

export interface GraphEdge {
  source: string | GraphNode;
  target: string | GraphNode;
  relation: string;
  strength: number;
  id?: string;
  curveOffset?: number;
  isMultiple?: boolean;
  groupIndex?: number;
  groupTotal?: number;
  isHub?: boolean;
  hubIndex?: number;
  hubTotal?: number;
  color?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// UI State Types
export interface AppState {
  selectedClusterId: string | null;
  hoveredClusterId: string | null;
  selectedEdgeId: string | null;
  hoveredEdgeId: string | null;
  searchQuery: string;
  filterBySpeaker: string | null;
  graphZoom: number;
  detailPaneOpen: boolean;
  activePanel: 'knowledge' | 'photos' | 'transcript';
  focusedTranscriptMessageId: string | null;
}

// Transcript Types
export interface TranscriptMessage {
  message_id: string;
  startTime: string;
  position: number;
  speaker_id: string;
  text: string;
}

export interface TranscriptData {
  type: 'BreakoutTranscript';
  conversation_id?: string;
  messages: TranscriptMessage[];
}

// Search Types
export interface SearchResult {
  type: 'cluster' | 'thread' | 'comment' | 'idea';
  id: string;
  clusterId: string;
  text: string;
  matches: string[];
  score: number;
}
