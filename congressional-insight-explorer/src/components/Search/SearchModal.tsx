import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { SearchEngine } from '../../lib/search-engine';
import type { CongressionalData, SearchResult } from '../../lib/types';
import { useStore } from '../../lib/store';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  data: CongressionalData;
}

export const SearchModal: React.FC<SearchModalProps> = ({ open, onClose, data }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const engineRef = useRef<SearchEngine | null>(null);
  const { setSelectedCluster } = useStore();

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new SearchEngine();
      engineRef.current.buildIndex(data);
    }
  }, [data]);

  useEffect(() => {
    const id = setTimeout(() => {
      if (engineRef.current) {
        setResults(engineRef.current.search(query));
      }
    }, 120);
    return () => clearTimeout(id);
  }, [query]);

  const handleSelect = (r: SearchResult) => {
    setSelectedCluster(r.clusterId);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black/40 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="absolute left-1/2 top-20 -translate-x-1/2 w-[90vw] max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header/Search Bar */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-200">
              <Search size={18} className="text-gray-500" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search clusters, ideas, threads, comments..."
                className="flex-1 outline-none text-sm"
              />
              <button onClick={onClose} className="p-2 rounded hover:bg-gray-100" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {results.length === 0 && query && (
                <div className="p-6 text-sm text-gray-500">No results</div>
              )}
              {results.length > 0 && (
                <ul className="divide-y divide-gray-100">
                  {results.map(r => (
                    <li key={`${r.type}:${r.id}`}>
                      <button
                        onClick={() => handleSelect(r)}
                        className="w-full text-left p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {r.text}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {r.type} • {r.clusterId}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">score {r.score.toFixed(2)}</div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};


