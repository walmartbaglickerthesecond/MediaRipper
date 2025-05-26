import { createClient } from "npm:@supabase/supabase-js@2.39.0";
import ytdl from "npm:ytdl-core@4.11.5";
import ffmpeg from "npm:fluent-ffmpeg@2.1.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, format, quality } = await req.json();

    if (!url) {
      throw new Error("URL is required");
    }

    // Get video info
    const info = await ytdl.getInfo(url);
    
    // Select format based on quality
    const qualityMap = {
      low: "lowest",
      medium: "highestaudio",
      high: "highest"
    };

    const stream = ytdl(url, {
      quality: qualityMap[quality as keyof typeof qualityMap],
      filter: format === "mp3" ? "audioonly" : "audioandvideo"
    });

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(new Uint8Array(chunk));
    }
    const buffer = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.length;
    }

    // If MP3 is requested, convert using FFmpeg
    let finalBuffer = buffer;
    if (format === "mp3") {
      finalBuffer = await new Promise((resolve, reject) => {
        ffmpeg(buffer)
          .toFormat("mp3")
          .on("end", resolve)
          .on("error", reject)
          .pipe();
      });
    }

    return new Response(finalBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": format === "mp3" ? "audio/mpeg" : "video/mp4",
        "Content-Disposition": `attachment; filename="${info.videoDetails.title}.${format}"`,
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});