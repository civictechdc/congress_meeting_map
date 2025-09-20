import React, { useState } from 'react';
import { Search, Info, Github, Download, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { getPublicAssetUrl } from '../../lib/utils';

const civicTechLogoUrl = getPublicAssetUrl('civictechdc.svg');
const datasetDownloadUrl = getPublicAssetUrl('files/modern_comm_2025.zip');

interface HeaderProps {
  onSearchClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearchClick }) => {
  const [isInfoOpen, setIsInfoOpen] = useState(false);

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
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center overflow-hidden">
              <img src={civicTechLogoUrl} alt="Civic Tech DC" className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold">
                Congressional Hackathon Breakout Explorer
              </h1>
              <p className="text-sm text-blue-100">
                Interactive Knowledge Graph of the Modern Committee Breakout Discussions
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <a
              href={datasetDownloadUrl}
              download
              className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
              aria-label="Download Modern Communications data"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Download</span>
            </a>

            <button
              onClick={onSearchClick}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Search"
            >
              <Search size={20} />
            </button>
            
            <button
              onClick={() => setIsInfoOpen(true)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="About"
              aria-haspopup="dialog"
              aria-expanded={isInfoOpen}
            >
              <Info size={20} />
            </button>
            
            <a
              href="https://github.com/civictechdc/congress_meeting_map"
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
      <AnimatePresence>
        {isInfoOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="presentation"
            onClick={() => setIsInfoOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="about-dialog-title"
              className="relative w-full max-w-md rounded-2xl bg-white p-6 text-slate-900 shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                onClick={() => setIsInfoOpen(false)}
                className="absolute right-4 top-4 rounded-full p-1 text-slate-500 hover:bg-slate-100"
                aria-label="Close about dialog"
              >
                <X size={18} />
              </button>
              <h2 id="about-dialog-title" className="mb-4 text-lg font-semibold text-primary-blue">
                About Civic Tech DC
              </h2>
              <p className="mb-3 text-sm text-slate-600">
                Civic Tech DC is a community of volunteers, designers, technologists, and
                policy experts building tools that improve civic engagement and government
                transparency. We collaborate to turn complex public data into accessible
                insights for residents and decision makers.
              </p>
              <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-medium text-primary-blue">Michael Deeb</p>
                <p className="mt-1">Organizer &amp; Project Lead</p>
                <a
                  href="mailto:mdeeb@civictechdc.org"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-secondary-blue hover:underline"
                >
                  mdeeb@civictechdc.org
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};
