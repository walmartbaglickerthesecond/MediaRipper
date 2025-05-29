import { useState, useCallback } from 'react';
import { DownloadItem, Platform, MediaFormat, MediaQuality } from '../types';
import { fetchMetadata } from '../utils/metadata';

const downloadMedia = async (
  url: string,
  format: MediaFormat,
  quality: MediaQuality,
  onProgress: (progress: number) => void
): Promise<void> => {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/media-download`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, format })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Download failed');
  }

  const reader = response.body!.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    chunks.push(value);
    // Simulate progress since we can't get it from the API
    onProgress(Math.floor(Math.random() * 20) + 80);
  }

  const blob = new Blob(chunks, {
    type: format === 'mp3' ? 'audio/mpeg' : 'video/mp4'
  });
  const downloadUrl = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `download.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
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
            ? { ...item, status: 'error', error: error instanceof Error ? error.message : 'Download failed' } 
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