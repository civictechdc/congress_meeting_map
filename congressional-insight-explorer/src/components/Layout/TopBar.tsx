import React from 'react';
import { getPublicAssetUrl } from '../../lib/utils';

const civicTechLogoUrl = getPublicAssetUrl('civictechdc.svg');

export const TopBar: React.FC = () => {
  return (
    <div className="w-full bg-primary-blue text-white z-50">
      <div className="container mx-auto px-4 py-1">
        <div className="flex items-center justify-center gap-2">
          <a href="https://civictechdc.org" target="_blank" rel="noopener noreferrer" aria-label="Civic Tech DC website">
            <img src={civicTechLogoUrl} alt="Civic Tech DC" className="w-4 h-4" />
          </a>
          <p className="text-xs">
            Built by{' '}
            <a
              href="https://civictechdc.org"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline-offset-2 hover:underline"
            >
              Civic Tech DC
            </a>{' '}
            and{' '}
            <a
              href="https://www.linkedin.com/in/michael-deeb/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline-offset-2 hover:underline"
            >
              Michael Deeb
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
