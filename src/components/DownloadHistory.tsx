import React from 'react';
import { DownloadItem } from '../types';
import DownloadCard from './DownloadCard';

interface DownloadHistoryProps {
  downloads: DownloadItem[];
  onRemoveDownload: (id: string) => void;
}

const DownloadHistory: React.FC<DownloadHistoryProps> = ({ 
  downloads, 
  onRemoveDownload 
}) => {
  if (downloads.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No download history yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {downloads.map((download) => (
        <DownloadCard
          key={download.id}
          item={download}
          onRemove={onRemoveDownload}
        />
      ))}
    </div>
  );
};

export default DownloadHistory;