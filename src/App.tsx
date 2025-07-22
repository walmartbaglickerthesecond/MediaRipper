import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import PlatformToggle from './components/PlatformToggle';
import FormatSelector from './components/FormatSelector';
import QualitySelector from './components/QualitySelector';
import UrlInput from './components/UrlInput';
import DownloadHistory from './components/DownloadHistory';
import { validateUrl } from './utils/validation';
import { useDownloadManager } from './hooks/useDownloadManager';
import { FormState, Platform, MediaFormat, MediaQuality } from './types';

function App() {
  const [formState, setFormState] = useState<FormState>({
    url: '',
    platform: 'youtube',
    format: 'mp3',
    quality: 'high'
  });
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { downloads, addDownload, removeDownload } = useDownloadManager();

  const handlePlatformChange = (platform: Platform) => {
    setFormState(prev => ({ 
      ...prev, 
      platform,
      // Reset format to mp3 when switching to Spotify
      format: platform === 'spotify' ? 'mp3' : prev.format
    }));
    setError(null);
  };

  const handleFormatChange = (format: MediaFormat) => {
    setFormState(prev => ({ ...prev, format }));
    setError(null);
  };

  const handleQualityChange = (quality: MediaQuality) => {
    setFormState(prev => ({ ...prev, quality }));
    setError(null);
  };

  const handleUrlChange = (url: string) => {
    setFormState(prev => ({ ...prev, url }));
    setError(null);
  };

  const handleSubmit = () => {
    const validationError = validateUrl(formState.url, formState.platform);
    
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    // In a real app, this would call a backend service
    setTimeout(() => {
      addDownload(
        formState.url,
        formState.platform,
        formState.format,
        formState.quality
      );
      
      // Reset form
      setFormState(prev => ({ ...prev, url: '' }));
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-white">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <section className="max-w-3xl mx-auto mb-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Download Media from YouTube & Spotify
            </h1>
            <p className="text-gray-400">
              Easily convert and download videos and music in MP3 or MP4 format
            </p>
          </div>
          
          <div className="bg-gray-900/50 backdrop-blur-md rounded-xl p-6 border border-gray-800 shadow-xl mb-8">
            <div className="mb-6">
              <PlatformToggle 
                platform={formState.platform} 
                onChange={handlePlatformChange} 
              />
            </div>
            
            <div className="mb-6">
              <UrlInput 
                url={formState.url} 
                onChange={handleUrlChange}
                platform={formState.platform}
                onSubmit={handleSubmit}
                isProcessing={isProcessing}
              />
              {error && (
                <p className="mt-2 text-red-500 text-sm">{error}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <FormatSelector 
                format={formState.format} 
                onChange={handleFormatChange}
                // Disable MP4 option for Spotify
                disabled={formState.platform === 'spotify'}
              />
              <QualitySelector 
                quality={formState.quality} 
                onChange={handleQualityChange} 
                format={formState.format}
              />
            </div>
          </div>
        </section>
        
        <section className="max-w-6xl mx-auto">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
            Download History
          </h2>
          <DownloadHistory 
            downloads={downloads} 
            onRemoveDownload={removeDownload} 
          />
        </section>
      </main>
      
      <Footer />
    </div>
  );
}

export default App;