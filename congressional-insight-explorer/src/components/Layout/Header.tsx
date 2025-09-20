import React from 'react';
import { Search, Info, Github } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderProps {
  onSearchClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearchClick }) => {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-gradient-to-r from-primary-blue to-secondary-blue text-white shadow-lg z-40"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏛️</span>
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold">
                Congressional Insight Explorer
              </h1>
              <p className="text-sm text-blue-100">
                Interactive Knowledge Graph of Committee Discussions
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onSearchClick}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Search"
            >
              <Search size={20} />
            </button>
            
            <button
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="About"
            >
              <Info size={20} />
            </button>
            
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="View on GitHub"
            >
              <Github size={20} />
            </a>
          </div>
        </div>
      </div>
    </motion.header>
  );
};
