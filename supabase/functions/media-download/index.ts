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
      thumbnail: data.thumbnail_url,
      author: data.author_name || 'Unknown'
    };
  } catch (error) {
    console.error('Error fetching video info:', error);
    return {
      title: 'YouTube Video',
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      author: 'Unknown'
    };
  }
}

// Use a more reliable approach with multiple fallback services
async function getDownloadUrl(videoId: string, format: string, quality: string) {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  
  // Try multiple services in order of reliability
  const services = [
    {
      name: 'SaveFrom',
      url: 'https://ssyoutube.com/api/convert',
      method: 'POST',
      body: JSON.stringify({
        url: videoUrl,
        format: format,
        quality: quality
      })
    },
    {
      name: 'YT1s',
      url: 'https://www.yt1s.com/api/ajaxSearch/index',
      method: 'POST',
      body: new URLSearchParams({
        q: videoUrl,
        vt: format === 'mp3' ? 'mp3' : 'mp4'
      })
    }
  ];

  for (const service of services) {
    try {
      console.log(`Trying ${service.name} service...`);
      
      const response = await fetch(service.url, {
        method: service.method,
        headers: {
          'Content-Type': service.body instanceof URLSearchParams ? 
            'application/x-www-form-urlencoded' : 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        body: service.body
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`${service.name} response:`, data);
        
        // Parse response based on service
        if (service.name === 'SaveFrom' && data.url) {
          return data.url;
        } else if (service.name === 'YT1s' && data.links) {
          const links = format === 'mp3' ? data.links.mp3 : data.links.mp4;
          if (links && Object.keys(links).length > 0) {
            return Object.values(links)[0].url;
          }
        }
      }
    } catch (error) {
      console.error(`${service.name} failed:`, error);
      continue;
    }
  }

  // If all services fail, return a helpful error with instructions
  throw new Error('Download services are currently unavailable. Please try again later or use a different YouTube downloader.');
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
    
    // For now, return video info and suggest alternative approach
    // since most download APIs are unreliable or blocked
    return new Response(
      JSON.stringify({
        error: "Direct downloads are currently unavailable due to API restrictions",
        suggestion: "Please use a browser extension or dedicated YouTube downloader",
        videoInfo: {
          title: videoInfo.title,
          author: videoInfo.author,
          thumbnail: videoInfo.thumbnail,
          youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
          videoId: videoId
        },
        alternatives: [
          "Use browser extensions like 'YouTube Video Downloader'",
          "Try online services like y2mate.com, savefrom.net, or yt1s.com",
          "Use desktop applications like 4K Video Downloader or youtube-dl"
        ]
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );

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