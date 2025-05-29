import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { download } from "https://deno.land/x/download@v2.0.2/mod.ts";
import { join } from "https://deno.land/std@0.168.0/path/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, format, quality } = await req.json();

    if (!url) {
      throw new Error("URL is required");
    }

    // Create temporary directory
    const tempDir = await Deno.makeTempDir();
    const outputPath = join(tempDir, `output.${format}`);

    // Prepare yt-dlp command
    const qualityMap = {
      low: format === 'mp3' ? '128K' : '480p',
      medium: format === 'mp3' ? '192K' : '720p',
      high: format === 'mp3' ? '320K' : '1080p'
    };

    const selectedQuality = qualityMap[quality as keyof typeof qualityMap];
    
    // Download yt-dlp binary
    const ytDlpUrl = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp";
    const ytDlpPath = join(tempDir, "yt-dlp");
    await download(ytDlpUrl, { file: ytDlpPath });
    await Deno.chmod(ytDlpPath, 0o755);

    // Prepare command arguments
    const args = [
      format === 'mp3' 
        ? ['-x', '--audio-format', 'mp3', '--audio-quality', selectedQuality]
        : ['-f', `bestvideo[height<=${selectedQuality.replace('p', '')}]+bestaudio/best[height<=${selectedQuality.replace('p', '')}]`],
      '-o', outputPath,
      url
    ].flat();

    // Execute yt-dlp
    const process = new Deno.Command(ytDlpPath, { args });
    const { success } = await process.output();

    if (!success) {
      throw new Error("Failed to download media");
    }

    // Read the file
    const file = await Deno.readFile(outputPath);

    // Clean up
    await Deno.remove(tempDir, { recursive: true });

    // Get content type
    const contentType = format === 'mp3' ? 'audio/mpeg' : 'video/mp4';

    // Extract filename from URL
    const urlObj = new URL(url);
    const videoId = urlObj.searchParams.get('v') || urlObj.pathname.split('/').pop();
    const filename = `${videoId}.${format}`;

    return new Response(file, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': file.length.toString()
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});