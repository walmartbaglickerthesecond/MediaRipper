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

// Try YT1s.com API (working as of 2024)
async function tryYT1sAPI(videoId: string, format: string) {
  try {
    console.log('Trying YT1s API...');
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    // Step 1: Analyze the video
    const analyzeResponse = await fetch('https://yt1s.com/api/ajaxSearch/index', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://yt1s.com',
        'Referer': 'https://yt1s.com/'
      },
      body: new URLSearchParams({
        q: videoUrl,
        vt: format === 'mp3' ? 'mp3' : 'mp4'
      })
    });

    console.log('YT1s analyze response status:', analyzeResponse.status);
    
    if (!analyzeResponse.ok) {
      throw new Error(`YT1s analyze failed: ${analyzeResponse.status}`);
    }

    const analyzeData = await analyzeResponse.json();
    console.log('YT1s analyze data:', JSON.stringify(analyzeData, null, 2));

    if (analyzeData.status === 'ok' && analyzeData.links) {
      const links = format === 'mp3' ? analyzeData.links.mp3 : analyzeData.links.mp4;
      
      if (links) {
        // Map quality preference to actual available qualities
        const qualities = Object.keys(links);
        console.log('Available qualities:', qualities);
        
        let selectedQuality;
        
        if (format === 'mp3') {
          // For MP3, look for common bitrates
          const qualityMap = {
            'high': ['320', '256', '192', '128'],
            'medium': ['192', '128', '320', '256'],
            'low': ['128', '96', '64', '192', '256', '320']
          };
          
          const preferredQualities = qualityMap[quality] || qualityMap['medium'];
          selectedQuality = preferredQualities.find(q => qualities.includes(q)) || qualities[0];
        } else {
          // For MP4, look for common resolutions
          const qualityMap = {
            'high': ['1080', '720', '480', '360'],
            'medium': ['720', '480', '360', '1080'],
            'low': ['360', '480', '720', '1080']
          };
          
          const preferredQualities = qualityMap[quality] || qualityMap['medium'];
          selectedQuality = preferredQualities.find(q => qualities.includes(q)) || qualities[0];
        }
        
        console.log('Selected quality:', selectedQuality);
        
        if (qualities.length > 0) {
          const linkData = links[selectedQuality];
          console.log('Link data for selected quality:', linkData);
          
          if (linkData && linkData.k) {
            // Step 2: Get download link
            const convertResponse = await fetch('https://yt1s.com/api/ajaxConvert/convert', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Origin': 'https://yt1s.com',
                'Referer': 'https://yt1s.com/'
              },
              body: new URLSearchParams({
                vid: analyzeData.vid,
                k: linkData.k
              })
            });

            console.log('YT1s convert response status:', convertResponse.status);

            if (convertResponse.ok) {
              const convertData = await convertResponse.json();
              console.log('YT1s convert data:', JSON.stringify(convertData, null, 2));
              
              if (convertData.status === 'ok' && convertData.dlink) {
                return convertData.dlink;
              }
            }
          }
        }
      }
    }
    
    throw new Error('No download link found in YT1s response');
  } catch (error) {
    console.error('YT1s API failed:', error);
    throw error;
  }
}

// Try Y2mate.com API (alternative endpoint)
async function tryY2mateAPI(videoId: string, format: string) {
  try {
    console.log('Trying Y2mate API...');
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    // Step 1: Analyze
    const analyzeResponse = await fetch('https://www.y2mate.com/mates/analyzeV2/ajax', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://www.y2mate.com',
        'Referer': 'https://www.y2mate.com/'
      },
      body: new URLSearchParams({
        k_query: videoUrl,
        k_page: 'home',
        hl: 'en',
        q_auto: '0'
      })
    });

    console.log('Y2mate analyze response status:', analyzeResponse.status);

    if (analyzeResponse.ok) {
      const analyzeData = await analyzeResponse.json();
      console.log('Y2mate analyze data keys:', Object.keys(analyzeData));
      
      if (analyzeData.status === 'ok' && analyzeData.links) {
        const links = format === 'mp3' ? analyzeData.links.mp3 : analyzeData.links.mp4;
        
        if (links) {
          // Map quality preference to actual available qualities
          const qualities = Object.keys(links);
          console.log('Y2mate available qualities:', qualities);
          
          let selectedQuality;
          
          if (format === 'mp3') {
            // For MP3, look for common bitrates
            const qualityMap = {
              'high': ['320', '256', '192', '128'],
              'medium': ['192', '128', '320', '256'],
              'low': ['128', '96', '64', '192', '256', '320']
            };
            
            const preferredQualities = qualityMap[quality] || qualityMap['medium'];
            selectedQuality = preferredQualities.find(q => qualities.includes(q)) || qualities[0];
          } else {
            // For MP4, look for common resolutions
            const qualityMap = {
              'high': ['1080', '720', '480', '360'],
              'medium': ['720', '480', '360', '1080'],
              'low': ['360', '480', '720', '1080']
            };
            
            const preferredQualities = qualityMap[quality] || qualityMap['medium'];
            selectedQuality = preferredQualities.find(q => qualities.includes(q)) || qualities[0];
          }
          
          console.log('Y2mate selected quality:', selectedQuality);
          
          if (qualities.length > 0) {
            const linkData = links[selectedQuality];
            console.log('Y2mate link data for selected quality:', linkData);
            
            if (linkData && linkData.k) {
              // Step 2: Convert
              const convertResponse = await fetch('https://www.y2mate.com/mates/convertV2/index', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                  'Accept': '*/*',
                  'Accept-Language': 'en-US,en;q=0.9',
                  'Origin': 'https://www.y2mate.com',
                  'Referer': 'https://www.y2mate.com/'
                },
                body: new URLSearchParams({
                  vid: analyzeData.vid,
                  k: linkData.k
                })
              });

              if (convertResponse.ok) {
                const convertData = await convertResponse.json();
                console.log('Y2mate convert data keys:', Object.keys(convertData));
                
                if (convertData.status === 'ok' && convertData.dlink) {
                  return convertData.dlink;
                }
              }
            }
          }
        }
      }
    }
    
    throw new Error('Y2mate API failed');
  } catch (error) {
    console.error('Y2mate API failed:', error);
    throw error;
  }
}

// Try multiple download services
async function getDownloadUrl(videoId: string, format: string, quality: string) {
  const errors: string[] = [];

  // Try YT1s first
  try {
    const url = await tryYT1sAPI(videoId, format);
    if (url) {
      console.log('Successfully got download URL from YT1s');
      return url;
    }
  } catch (error) {
    errors.push(`YT1s: ${error.message}`);
  }

  // Try Y2mate as fallback
  try {
    const url = await tryY2mateAPI(videoId, format);
    if (url) {
      console.log('Successfully got download URL from Y2mate');
      return url;
    }
  } catch (error) {
    errors.push(`Y2mate: ${error.message}`);
  }

  console.error('All download services failed:', errors);
  throw new Error(`All download services failed: ${errors.join(', ')}`);
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
    console.log('Video info:', videoInfo);

    try {
      // Get download URL
      const downloadUrl = await getDownloadUrl(videoId, format, quality);
      console.log('Download URL obtained:', downloadUrl);

      // Fetch the actual media file
      const mediaResponse = await fetch(downloadUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });

      console.log('Media response status:', mediaResponse.status);
      console.log('Media response headers:', Object.fromEntries(mediaResponse.headers.entries()));

      if (!mediaResponse.ok) {
        throw new Error(`Failed to fetch media: ${mediaResponse.status} ${mediaResponse.statusText}`);
      }

      // Check if we have a body
      if (!mediaResponse.body) {
        throw new Error('No response body received');
      }

      // Get content length for progress tracking
      const contentLength = mediaResponse.headers.get('content-length');
      const totalSize = contentLength ? parseInt(contentLength, 10) : 0;

      console.log(`Starting download, content length: ${totalSize} bytes`);

      // Stream the content
      const reader = mediaResponse.body.getReader();
      const chunks: Uint8Array[] = [];
      let receivedLength = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedLength += value.length;
        
        if (totalSize > 0) {
          const progress = (receivedLength / totalSize) * 100;
          console.log(`Download progress: ${progress.toFixed(1)}%`);
        }
      }

      console.log(`Download completed, total bytes: ${receivedLength}`);

      if (receivedLength === 0) {
        throw new Error('Downloaded file is empty');
      }

      // Create the final blob
      const mediaBlob = new Uint8Array(receivedLength);
      let offset = 0;
      for (const chunk of chunks) {
        mediaBlob.set(chunk, offset);
        offset += chunk.length;
      }

      console.log(`Successfully processed ${mediaBlob.length} bytes`);

      // Return the media file
      return new Response(mediaBlob, {
        headers: {
          ...corsHeaders,
          'Content-Type': format === 'mp3' ? 'audio/mpeg' : 'video/mp4',
          'Content-Disposition': `attachment; filename="${videoInfo.title.replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'download'}.${format}"`,
          'Content-Length': mediaBlob.length.toString()
        }
      });

    } catch (downloadError) {
      console.error('Download failed:', downloadError);
      
      return new Response(
        JSON.stringify({
          error: "Download failed",
          message: downloadError.message,
          videoInfo: {
            title: videoInfo.title,
            author: videoInfo.author,
            thumbnail: videoInfo.thumbnail,
            youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
            videoId: videoId
          },
          suggestions: [
            "Try a different video - some videos may be restricted",
            "Use browser extensions like 'YouTube Video Downloader'",
            "Try desktop applications like 4K Video Downloader or yt-dlp",
            "Use online services like yt1s.com or y2mate.com directly"
          ]
        }),
        {
          status: 503,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }

  } catch (error) {
    console.error("General error:", error);
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