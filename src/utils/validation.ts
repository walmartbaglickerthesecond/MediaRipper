export const isValidYoutubeUrl = (url: string): boolean => {
  // Basic validation for YouTube URLs
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
  return youtubeRegex.test(url);
};

export const isValidSpotifyUrl = (url: string): boolean => {
  // Basic validation for Spotify URLs
  const spotifyRegex = /^(https?:\/\/)?(open\.spotify\.com)\/.+/;
  return spotifyRegex.test(url);
};

export const validateUrl = (url: string, platform: 'youtube' | 'spotify'): string | null => {
  if (!url.trim()) {
    return 'URL is required';
  }

  if (platform === 'youtube' && !isValidYoutubeUrl(url)) {
    return 'Please enter a valid YouTube URL';
  }

  if (platform === 'spotify' && !isValidSpotifyUrl(url)) {
    return 'Please enter a valid Spotify URL';
  }

  return null;
};