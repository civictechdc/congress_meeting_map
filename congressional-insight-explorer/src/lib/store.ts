import { create } from 'zustand';
import type { AppState } from './types';

interface StoreState extends AppState {
  // Actions
  setSelectedCluster: (id: string | null) => void;
  setHoveredCluster: (id: string | null) => void;
  setSelectedEdge: (id: string | null) => void;
  setHoveredEdge: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterBySpeaker: (speaker: string | null) => void;
  setGraphZoom: (zoom: number) => void;
  setDetailPaneOpen: (open: boolean) => void;
  setActivePanel: (panel: 'knowledge' | 'photos' | 'transcript') => void;
  focusTranscriptMessage: (messageId: string | null) => void;
  clearFocusedTranscriptMessage: () => void;
  resetFilters: () => void;
}

export const useStore = create<StoreState>((set) => ({
  // Initial state
  selectedClusterId: null,
  hoveredClusterId: null,
  selectedEdgeId: null,
  hoveredEdgeId: null,
  searchQuery: '',
  filterBySpeaker: null,
  graphZoom: 1,
  detailPaneOpen: false,
  activePanel: 'knowledge',
  focusedTranscriptMessageId: null,

  // Actions
  setSelectedCluster: (id) => set((state) => ({ 
    selectedClusterId: id, 
    selectedEdgeId: null, // Clear edge selection when selecting cluster
    detailPaneOpen: id !== null,
    activePanel: id ? 'knowledge' : state.activePanel,
  })),
  
  setHoveredCluster: (id) => set({ hoveredClusterId: id }),
  
  setSelectedEdge: (id) => set((state) => ({
    selectedEdgeId: id,
    selectedClusterId: null, // Clear cluster selection when selecting edge
    detailPaneOpen: id !== null,
    activePanel: id ? 'knowledge' : state.activePanel,
  })),
  
  setHoveredEdge: (id) => set({ hoveredEdgeId: id }),
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  setFilterBySpeaker: (speaker) => set({ filterBySpeaker: speaker }),
  
  setGraphZoom: (zoom) => set({ graphZoom: zoom }),
  
  setDetailPaneOpen: (open) => set((state) => ({ 
    detailPaneOpen: open,
    activePanel: open ? 'knowledge' : state.activePanel,
  })),

  setActivePanel: (panel) => set((state) => ({
    activePanel: panel,
    detailPaneOpen: panel === 'knowledge' ? state.detailPaneOpen : false,
  })),

  focusTranscriptMessage: (messageId) => set({
    activePanel: 'transcript',
    focusedTranscriptMessageId: messageId,
    detailPaneOpen: false,
    selectedClusterId: null,
    selectedEdgeId: null,
  }),

  clearFocusedTranscriptMessage: () => set({ focusedTranscriptMessageId: null }),
  
  resetFilters: () => set({
    searchQuery: '',
    filterBySpeaker: null,
  }),
}));
