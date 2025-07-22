import { useState, useCallback } from 'react';
import { DownloadItem, Platform, MediaFormat, MediaQuality } from '../types';
import { fetchMetadata } from '../utils/metadata';

const downloadMedia = async (
  url: string,
  format: MediaFormat,
  quality: MediaQuality,
  title: string,
  onProgress: (progress: number) => void
): Promise<void> => {
  try {
    onProgress(10);
    
    // Check if we have Supabase environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing. Please set up your environment variables.');
    }
    
    onProgress(20);
    
    const response = await fetch(`${supabaseUrl}/functions/v1/media-download`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, format, quality })
    });

    onProgress(30);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Download failed';
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    onProgress(40);

    // Get the content length if available
    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;
    
    // Check if response has a body
    if (!response.body) {
      throw new Error('No response body received');
    }
    
    onProgress(50);
    
    const reader = response.body!.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;

    let progressStep = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      received += value.length;
      progressStep++;
      
      // Update progress based on bytes received
      if (total > 0) {
        const progress = Math.min(50 + (received / total) * 40, 90);
        onProgress(Math.floor(progress));
      } else {
        // Fallback progress simulation
        const progress = Math.min(50 + Math.min(progressStep * 5, 40), 90);
        onProgress(progress);
      }
    }

    onProgress(95);

    if (chunks.length === 0) {
      throw new Error('No data received from download service');
    }
    
    const blob = new Blob(chunks, {
      type: format === 'mp3' ? 'audio/mpeg' : 'video/mp4'
    });
    
    if (blob.size === 0) {
      throw new Error('Downloaded file is empty');
    }
    
    onProgress(98);
    
    const downloadUrl = URL.createObjectURL(blob);
    const filename = `${title.replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'download'}.${format}`;

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Clean up the blob URL after a short delay
    setTimeout(() => {
      URL.revokeObjectURL(downloadUrl);
    }, 1000);
    
    onProgress(100);
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
};

export const useDownloadManager = () => {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);

  const addDownload = useCallback(async (
    url: string,
    platform: Platform,
    format: MediaFormat,
    quality: MediaQuality
  ) => {
    const newDownload: DownloadItem = {
      id: `download-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      url,
      platform,
      format,
      quality,
      title: 'Fetching metadata...',
      status: 'pending',
      progress: 0,
      timestamp: Date.now()
    };

    setDownloads(prev => [newDownload, ...prev]);

    try {
      const metadata = await fetchMetadata(url, platform);
      
      setDownloads(prev => 
        prev.map(item => 
          item.id === newDownload.id 
            ? { ...item, ...metadata, status: 'downloading' } 
            : item
        )
      );

      await downloadMedia(
        url,
        format,
        quality,
        metadata.title,
        (progress) => {
          setDownloads(prev => 
            prev.map(item => 
              item.id === newDownload.id 
                ? { ...item, progress } 
                : item
            )
          );
        }
      );

      setDownloads(prev => 
        prev.map(item => 
          item.id === newDownload.id 
            ? { ...item, status: 'completed', progress: 100 } 
            : item
        )
      );
    } catch (error) {
      setDownloads(prev => 
        prev.map(item => 
          item.id === newDownload.id 
            ? { 
                ...item, 
                status: 'error', 
                error: error instanceof Error ? error.message : 'Download failed',
                progress: 0
              } 
            : item
        )
      );
    }

    return newDownload.id;
  }, []);

  const removeDownload = useCallback((id: string) => {
    setDownloads(prev => prev.filter(item => item.id !== id));
  }, []);

  return {
    downloads,
    addDownload,
    removeDownload
  };
};