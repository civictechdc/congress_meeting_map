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

  // Actions
  setSelectedCluster: (id) => set({ 
    selectedClusterId: id, 
    selectedEdgeId: null, // Clear edge selection when selecting cluster
    detailPaneOpen: id !== null 
  }),
  
  setHoveredCluster: (id) => set({ hoveredClusterId: id }),
  
  setSelectedEdge: (id) => set({
    selectedEdgeId: id,
    selectedClusterId: null, // Clear cluster selection when selecting edge
    detailPaneOpen: id !== null
  }),
  
  setHoveredEdge: (id) => set({ hoveredEdgeId: id }),
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  setFilterBySpeaker: (speaker) => set({ filterBySpeaker: speaker }),
  
  setGraphZoom: (zoom) => set({ graphZoom: zoom }),
  
  setDetailPaneOpen: (open) => set({ detailPaneOpen: open }),
  
  resetFilters: () => set({
    searchQuery: '',
    filterBySpeaker: null,
  }),
}));
