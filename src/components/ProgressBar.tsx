import React from 'react';

interface ProgressBarProps {
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'error';
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'downloading':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'downloading':
        return `Downloading ${progress}%`;
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Error';
      default:
        return '';
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between mb-1">
        <span className="text-xs text-gray-400">{getStatusText()}</span>
        {status === 'downloading' && (
          <span className="text-xs text-gray-400">{progress}%</span>
        )}
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
        <div 
          className={`h-2.5 rounded-full transition-all duration-300 ${getStatusColor()}`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;