import React, { useState } from 'react';
import { Link2, X } from 'lucide-react';
import { Platform } from '../types';

interface UrlInputProps {
  url: string;
  onChange: (url: string) => void;
  platform: Platform;
  onSubmit: () => void;
  isProcessing: boolean;
}

const UrlInput: React.FC<UrlInputProps> = ({ 
  url, 
  onChange, 
  platform, 
  onSubmit,
  isProcessing
}) => {
  const [isFocused, setIsFocused] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const clearInput = () => {
    onChange('');
  };

  const placeholder = platform === 'youtube' 
    ? 'Paste YouTube URL here...' 
    : 'Paste Spotify track URL here...';

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <div 
          className={`absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 ${
            isFocused ? 'text-purple-500' : ''
          }`}
        >
          <Link2 size={18} />
        </div>
        <input
          type="url"
          value={url}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-gray-900 text-white border ${
            isFocused ? 'border-purple-500' : 'border-gray-700'
          } rounded-lg py-3 pl-10 pr-12 focus:outline-none transition-colors`}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={isProcessing}
        />
        {url && (
          <button
            type="button"
            onClick={clearInput}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300"
            disabled={isProcessing}
          >
            <X size={18} />
          </button>
        )}
      </div>
      <button
        type="submit"
        disabled={!url.trim() || isProcessing}
        className={`mt-4 w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
          !url.trim() || isProcessing
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
        }`}
      >
        {isProcessing ? 'Processing...' : 'Download'}
      </button>
    </form>
  );
};

export default UrlInput;