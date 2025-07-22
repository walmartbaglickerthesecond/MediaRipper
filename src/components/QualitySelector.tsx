import React from 'react';
import { MediaQuality } from '../types';

interface QualitySelectorProps {
  quality: MediaQuality;
  onChange: (quality: MediaQuality) => void;
  disabled?: boolean;
  format?: 'mp3' | 'mp4';
}

const QualitySelector: React.FC<QualitySelectorProps> = ({ 
  quality, 
  onChange,
  disabled = false,
  format = 'mp3'
}) => {
  const qualityLabel = format === 'mp3' ? 'Audio Quality' : 'Quality';

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-sm text-gray-400">{qualityLabel}</label>
      <div className="grid grid-cols-3 bg-gray-900 rounded-lg p-1 gap-1">
        <button
          className={`flex items-center justify-center py-2 px-2 rounded-md transition-all duration-300 ${
            quality === 'low'
              ? 'bg-gray-800 text-yellow-500 shadow-md'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => !disabled && onChange('low')}
          disabled={disabled}
          aria-pressed={quality === 'low'}
        >
          Low
        </button>
        <button
          className={`flex items-center justify-center py-2 px-2 rounded-md transition-all duration-300 ${
            quality === 'medium'
              ? 'bg-gray-800 text-orange-500 shadow-md'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => !disabled && onChange('medium')}
          disabled={disabled}
          aria-pressed={quality === 'medium'}
        >
          Medium
        </button>
        <button
          className={`flex items-center justify-center py-2 px-2 rounded-md transition-all duration-300 ${
            quality === 'high'
              ? 'bg-gray-800 text-green-500 shadow-md'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => !disabled && onChange('high')}
          disabled={disabled}
          aria-pressed={quality === 'high'}
        >
          High
        </button>
      </div>
    </div>
  );
};

export default QualitySelector;