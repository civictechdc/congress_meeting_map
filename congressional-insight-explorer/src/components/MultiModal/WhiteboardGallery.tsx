import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface WhiteboardGalleryProps {
  onImageClick?: (imageIndex: number) => void;
}

const images = [
  { src: '/images/board_1.jpg', title: 'Whiteboard 1', alt: 'Congressional committee modernization whiteboard notes 1' },
  { src: '/images/board_2.jpg', title: 'Whiteboard 2', alt: 'Congressional committee modernization whiteboard notes 2' },
];

export const WhiteboardGallery: React.FC<WhiteboardGalleryProps> = ({ onImageClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
    setZoom(1);
    onImageClick?.(index);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setZoom(1);
  };

  const navigate = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
    } else {
      setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
    }
    setZoom(1);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setZoom(prev => {
      if (direction === 'in') return Math.min(prev * 1.5, 4);
      return Math.max(prev / 1.5, 0.5);
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-heading font-semibold text-gray-900">
          📸 Whiteboard Photos
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Original visual notes from the discussion
        </p>
      </div>

      {/* Gallery Grid */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        <div className="grid grid-cols-1 gap-4">
          {images.map((image, index) => (
            <motion.div
              key={image.src}
              className="relative group cursor-pointer bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              whileHover={{ scale: 1.02 }}
              onClick={() => openLightbox(index)}
            >
              <div className="aspect-[4/3] relative">
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <ZoomIn className="opacity-0 group-hover:opacity-100 text-white w-8 h-8 transition-opacity" />
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-gray-900">{image.title}</h3>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Controls */}
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <button
                onClick={() => handleZoom('out')}
                className="p-2 bg-white/20 hover:bg-white/30 rounded text-white transition-colors"
                aria-label="Zoom out"
              >
                <ZoomOut size={20} />
              </button>
              <button
                onClick={() => handleZoom('in')}
                className="p-2 bg-white/20 hover:bg-white/30 rounded text-white transition-colors"
                aria-label="Zoom in"
              >
                <ZoomIn size={20} />
              </button>
              <button
                onClick={closeLightbox}
                className="p-2 bg-white/20 hover:bg-white/30 rounded text-white transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => navigate('prev')}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/30 rounded text-white transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={() => navigate('next')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/30 rounded text-white transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Image */}
            <div className="w-full h-full flex items-center justify-center p-8">
              <motion.div
                className="relative max-w-full max-h-full overflow-auto"
                animate={{ scale: zoom }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              >
                <img
                  src={images[currentIndex].src}
                  alt={images[currentIndex].alt}
                  className="max-w-none h-auto"
                  style={{ maxWidth: zoom > 1 ? 'none' : '100%' }}
                />
              </motion.div>
            </div>

            {/* Image info */}
            <div className="absolute bottom-4 left-4 text-white">
              <h3 className="font-semibold">{images[currentIndex].title}</h3>
              <p className="text-sm text-white/80">
                Image {currentIndex + 1} of {images.length}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
