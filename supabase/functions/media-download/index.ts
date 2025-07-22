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

// Use yt-dlp compatible approach for getting download URLs
async function getDownloadUrl(videoId: string, format: string, quality: string) {
  try {
    // Use a public YouTube download service API
    const apiUrl = `https://api.cobalt.tools/api/json`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        url: `https://www.youtube.com/watch?v=${videoId}`,
        vCodec: format === 'mp4' ? 'h264' : undefined,
        vQuality: quality === 'high' ? '1080' : quality === 'medium' ? '720' : '480',
        aFormat: format === 'mp3' ? 'mp3' : 'best',
        isAudioOnly: format === 'mp3'
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status === 'error') {
      throw new Error(data.text || 'Download service error');
    }

    return data.url;
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