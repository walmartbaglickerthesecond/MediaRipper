import React from 'react';
import { Music, Video } from 'lucide-react';
import { MediaFormat } from '../types';

interface FormatSelectorProps {
  format: MediaFormat;
  onChange: (format: MediaFormat) => void;
  disabled?: boolean;
}

const FormatSelector: React.FC<FormatSelectorProps> = ({ 
  format, 
  onChange,
  disabled = false
}) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-sm text-gray-400">Format</label>
      <div className="flex bg-gray-900 rounded-lg p-1">
        <button
          title="Audio"
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all duration-300 ${
            format === 'mp3'
              ? 'bg-gray-800 text-purple-500 shadow-md'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => !disabled && onChange('mp3')}
          disabled={disabled}
          aria-pressed={format === 'mp3'}
        >
          <Music size={18} />
          <span>MP3</span>
        </button>
        <button
          title="Video"
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all duration-300 ${
            format === 'mp4'
              ? 'bg-gray-800 text-blue-500 shadow-md'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => !disabled && onChange('mp4')}
          disabled={disabled || false}
          aria-pressed={format === 'mp4'}
        >
          <Video size={18} />
          <span>MP4</span>
        </button>
      </div>
    </div>
  );
};

export default FormatSelector;