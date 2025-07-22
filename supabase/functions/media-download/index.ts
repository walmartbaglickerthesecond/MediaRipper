import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Simple YouTube video ID extraction
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

// Get video info using YouTube's oembed API
async function getVideoInfo(videoId: string) {
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    if (!response.ok) {
      throw new Error('Failed to fetch video info');
    }
    const data = await response.json();
    return {
      title: data.title || 'YouTube Video',
      thumbnail: data.thumbnail_url
    };
  } catch (error) {
    console.error('Error fetching video info:', error);
    return {
      title: 'YouTube Video',
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    };
  }
}

// Use Y2Mate API as alternative
async function getDownloadUrl(videoId: string, format: string, quality: string) {
  try {
    // Use Y2Mate API
    const apiUrl = `https://www.y2mate.com/mates/analyzeV2/ajax`;
    
    const formData = new FormData();
    formData.append('k_query', `https://www.youtube.com/watch?v=${videoId}`);
    formData.append('k_page', 'home');
    formData.append('hl', 'en');
    formData.append('q_auto', '0');

    console.log('Sending request to Y2Mate API for video:', videoId);

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData
    });

    console.log('Y2Mate API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Y2Mate API error response:', errorText);
      throw new Error(`Y2Mate API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Y2Mate API response data:', JSON.stringify(data, null, 2));
    
    if (data.status !== 'ok' || !data.links) {
      throw new Error(data.mess || 'Download service error');
    }

    // Find the appropriate download link based on format and quality
    let selectedLink = null;
    
    if (format === 'mp3') {
      // Look for MP3 links
      const mp3Links = data.links.mp3;
      if (mp3Links) {
        // Try to find the best quality MP3
        const qualityMap = { 'high': '320', 'medium': '192', 'low': '128' };
        const targetQuality = qualityMap[quality] || '192';
        
        selectedLink = mp3Links[targetQuality] || mp3Links['192'] || mp3Links['128'] || Object.values(mp3Links)[0];
      }
    } else {
      // Look for MP4 links
      const mp4Links = data.links.mp4;
      if (mp4Links) {
        const qualityMap = { 'high': '720', 'medium': '480', 'low': '360' };
        const targetQuality = qualityMap[quality] || '480';
        
        selectedLink = mp4Links[targetQuality] || mp4Links['480'] || mp4Links['360'] || Object.values(mp4Links)[0];
      }
    }

    if (!selectedLink || !selectedLink.k) {
      throw new Error('No suitable download link found');
    }

    // Get the actual download URL
    const convertFormData = new FormData();
    convertFormData.append('vid', videoId);
    convertFormData.append('k', selectedLink.k);

    const convertResponse = await fetch('https://www.y2mate.com/mates/convertV2/index', {
      method: 'POST',
      body: convertFormData
    });

    if (!convertResponse.ok) {
      throw new Error('Failed to get download URL');
    }

    const convertData = await convertResponse.json();
    
    if (convertData.status !== 'ok' || !convertData.dlink) {
      throw new Error('Failed to generate download link');
    }

    return convertData.dlink;
  } catch (error) {
    console.error('Error getting download URL:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, format = 'mp3', quality = 'medium' } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return new Response(
        JSON.stringify({ error: "Invalid YouTube URL" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log(`Processing ${format} download for video: ${videoId}`);

    // Get video information
    const videoInfo = await getVideoInfo(videoId);
    
    // Get download URL
    const downloadUrl = await getDownloadUrl(videoId, format, quality);
    
    if (!downloadUrl) {
      throw new Error('Could not get download URL');
    }

    console.log(`Got download URL for ${videoInfo.title}`);

    // Fetch the actual video/audio file
    const mediaResponse = await fetch(downloadUrl);
    
    if (!mediaResponse.ok) {
      throw new Error(`Failed to download media: ${mediaResponse.status}`);
    }

    const contentType = format === 'mp3' ? 'audio/mpeg' : 'video/mp4';
    const filename = `${videoInfo.title.replace(/[^a-zA-Z0-9\s]/g, '').trim()}.${format}`;

    // Stream the response back to the client
    return new Response(mediaResponse.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": mediaResponse.headers.get("Content-Length") || "",
        "Cache-Control": "no-cache",
      }
    });

  } catch (error) {
    console.error("Download error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Download failed',
        details: error.stack
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  }
});