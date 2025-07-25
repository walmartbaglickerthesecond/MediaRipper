import { Platform } from '../types';

export const extractYoutubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu.be\/)([^&\n?#]+)/,
    /youtube.com\/shorts\/([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

export const extractSpotifyId = (url: string): string | null => {
  const pattern = /spotify.com\/track\/([a-zA-Z0-9]+)/;
  const match = url.match(pattern);
  return match ? match[1] : null;
};

export const fetchMetadata = async (url: string, platform: Platform) => {
  try {
    if (platform === 'youtube') {
      const videoId = extractYoutubeId(url);
      if (!videoId) throw new Error('Invalid YouTube URL');

      // Try YouTube oEmbed API first
      try {
        const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        
        if (response.ok) {
          const data = await response.json();
          return {
            title: data.title || 'YouTube Video',
            thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
          };
        }
      } catch (e) {
        console.warn('oEmbed failed, using fallback');
      }
      
      // Fallback to basic metadata
      return {
        title: 'YouTube Video',
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      };
    } else {
      const trackId = extractSpotifyId(url);
      if (!trackId) throw new Error('Invalid Spotify URL');

      try {
        const response = await fetch(`https://open.spotify.com/oembed?url=https://open.spotify.com/track/${trackId}`);
        
        if (response.ok) {
          const data = await response.json();
          return {
            title: data.title || 'Spotify Track',
            thumbnail: data.thumbnail_url || 'https://images.pexels.com/photos/2479312/pexels-photo-2479312.jpeg'
          };
        }
      } catch (e) {
        console.warn('Spotify oEmbed failed, using fallback');
      }

      // Fallback to basic metadata
      return {
        title: 'Spotify Track',
        thumbnail: 'https://images.pexels.com/photos/2479312/pexels-photo-2479312.jpeg'
      };
    }
  } catch (error) {
    console.error('Metadata fetch error:', error);
    // Return fallback metadata instead of throwing
    return {
      title: platform === 'youtube' ? 'YouTube Video' : 'Spotify Track',
      thumbnail: platform === 'youtube' 
        ? 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg'
        : 'https://images.pexels.com/photos/2479312/pexels-photo-2479312.jpeg'
    };
  }
};