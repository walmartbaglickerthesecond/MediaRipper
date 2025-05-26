import React from 'react';
import { Youtube, Music } from 'lucide-react';
import { Platform } from '../types';

interface PlatformToggleProps {
  platform: Platform;
  onChange: (platform: Platform) => void;
}

const PlatformToggle: React.FC<PlatformToggleProps> = ({ platform, onChange }) => {
  return (
    <div className="flex bg-gray-900 rounded-lg p-1 w-full max-w-xs mx-auto">
      <button
        className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all duration-300 ${
          platform === 'youtube'
            ? 'bg-gray-800 text-red-500 shadow-md'
            : 'text-gray-400 hover:text-gray-200'
        }`}
        onClick={() => onChange('youtube')}
        aria-pressed={platform === 'youtube'}
      >
        <Youtube size={18} />
        <span>YouTube</span>
      </button>
      <button
        className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all duration-300 ${
          platform === 'spotify'
            ? 'bg-gray-800 text-green-500 shadow-md'
            : 'text-gray-400 hover:text-gray-200'
        }`}
        onClick={() => onChange('spotify')}
        aria-pressed={platform === 'spotify'}
      >
        <Music size={18} />
        <span>Spotify</span>
      </button>
    </div>
  );
};

export default PlatformToggle;