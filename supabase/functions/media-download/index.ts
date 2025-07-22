import { createClient } from "npm:@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// YouTube video info extraction
async function getVideoInfo(videoUrl: string) {
  try {
    // Extract video ID from URL
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    // Use YouTube's internal API to get video info
    const infoUrl = `https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8`;
    
    const response = await fetch(infoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'WEB',
            clientVersion: '2.20230728.00.00'
          }
        },
        videoId: videoId
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch video info');
    }

    const data = await response.json();
    
    if (!data.streamingData || !data.streamingData.adaptiveFormats) {
      throw new Error('No streaming data available');
    }

    return {
      title: data.videoDetails?.title || 'Unknown Title',
      formats: data.streamingData.adaptiveFormats,
      videoId: videoId
    };
  } catch (error) {
    console.error('Error getting video info:', error);
    throw error;
  }
}

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

function getBestFormat(formats: any[], requestedFormat: string, quality: string) {
  let filteredFormats;
  
  if (requestedFormat === 'mp3') {
    // For audio, get audio-only streams
    filteredFormats = formats.filter(f => 
      f.mimeType && f.mimeType.includes('audio') && 
      (f.mimeType.includes('mp4') || f.mimeType.includes('webm'))
    );
  } else {
    // For video, get video streams with audio
    filteredFormats = formats.filter(f => 
      f.mimeType && f.mimeType.includes('video') && 
      f.mimeType.includes('mp4') &&
      f.audioChannels // Has audio
    );
  }

  if (filteredFormats.length === 0) {
    // Fallback to any available format
    filteredFormats = formats.filter(f => f.url);
  }

  // Sort by quality
  filteredFormats.sort((a, b) => {
    const aQuality = parseInt(a.height || a.audioBitrate || '0');
    const bQuality = parseInt(b.height || b.audioBitrate || '0');
    
    if (quality === 'high') {
      return bQuality - aQuality; // Descending
    } else if (quality === 'low') {
      return aQuality - bQuality; // Ascending
    } else {
      // Medium quality - try to get something in the middle
      const midPoint = Math.max(aQuality, bQuality) / 2;
      return Math.abs(aQuality - midPoint) - Math.abs(bQuality - midPoint);
    }
  });

  return filteredFormats[0];
}

async function downloadAndConvert(format: any, requestedFormat: string, title: string) {
  try {
    const response = await fetch(format.url);
    
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status}`);
    }

    // For now, we'll stream the original format
    // In a production environment, you'd want to use FFmpeg for conversion
    const contentType = requestedFormat === 'mp3' ? 'audio/mpeg' : 'video/mp4';
    const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.${requestedFormat}`;

    return {
      stream: response.body,
      contentType,
      filename
    };
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
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

    console.log(`Processing ${format} download for: ${url}`);

    // Get video information and available formats
    const videoInfo = await getVideoInfo(url);
    
    // Select the best format based on user preferences
    const selectedFormat = getBestFormat(videoInfo.formats, format, quality);
    
    if (!selectedFormat) {
      throw new Error('No suitable format found');
    }

    console.log(`Selected format: ${selectedFormat.mimeType}, Quality: ${selectedFormat.height || selectedFormat.audioBitrate}`);

    // Download and convert the video
    const result = await downloadAndConvert(selectedFormat, format, videoInfo.title);

    // Return the stream with appropriate headers
    return new Response(result.stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": result.contentType,
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "Cache-Control": "no-cache",
      }
    });

  } catch (error) {
    console.error("Error:", error);
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