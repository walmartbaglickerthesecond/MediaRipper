import React from 'react';
import { Download, X, AlertCircle, CheckCircle } from 'lucide-react';
import { DownloadItem } from '../types';
import ProgressBar from './ProgressBar';

interface DownloadCardProps {
  item: DownloadItem;
  onRemove: (id: string) => void;
}

const DownloadCard: React.FC<DownloadCardProps> = ({ item, onRemove }) => {
  const getStatusIcon = () => {
    switch (item.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'downloading':
        return <Download className="h-5 w-5 text-blue-500 animate-pulse" />;
      default:
        return <Download className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4 shadow-md border border-gray-800 hover:border-gray-700 transition-all">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <h3 className="font-medium text-white truncate max-w-[200px]">
            {item.title || 'Untitled'}
          </h3>
        </div>
        <button
          onClick={() => onRemove(item.id)}
          className="text-gray-500 hover:text-gray-300 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
      
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-300">
          {item.platform}
        </span>
        <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-300">
          {item.format}
        </span>
        <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-300">
          {item.quality}
        </span>
      </div>
      
      {item.thumbnail && (
        <div className="mb-3 relative rounded-lg overflow-hidden">
          <img 
            src={item.thumbnail} 
            alt={item.title} 
            className="w-full aspect-video object-cover" 
            loading="lazy"
          />
        </div>
      )}
      
      <ProgressBar progress={item.progress} status={item.status} />
      
      {item.error && (
        <div className="mt-2 p-2 bg-red-900/20 border border-red-800 rounded text-xs text-red-400 max-w-full">
          <strong>Error:</strong> 
          <span className="block mt-1 break-words">{item.error}</span>
        </div>
      )}
      
      {item.status === 'completed' && (
        <div className="mt-2 p-2 bg-green-900/20 border border-green-800 rounded text-xs text-green-400">
          <strong>Success:</strong> File downloaded to your Downloads folder
        </div>
      )}
      
      <div className="mt-3 text-right">
        <span className="text-xs text-gray-500">
          {new Date(item.timestamp).toLocaleString()}
        </span>
      </div>
    </div>
  );
};

export default DownloadCard;