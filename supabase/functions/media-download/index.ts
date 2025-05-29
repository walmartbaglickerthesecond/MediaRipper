import { createClient } from "npm:@supabase/supabase-js@2.39.0";
import { FFmpeg } from "npm:@ffmpeg/ffmpeg@0.12.7";
import { fetchFile, toBlobURL } from "npm:@ffmpeg/util@0.12.1";
import { load } from "npm:@ffmpeg/core@0.12.4";

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
    const { url, format } = await req.json();

    if (!url) {
      throw new Error("URL is required");
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      throw new Error("Invalid URL provided");
    }

    // Fetch the media content
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch media: ${response.statusText}`);
    }

    // If MP3 conversion is requested
    if (format === "mp3") {
      const ffmpeg = new FFmpeg();
      
      // Load FFmpeg
      await ffmpeg.load({
        coreURL: await toBlobURL(
          await load(),
          "application/wasm"
        )
      });

      // Get the input data
      const inputData = await response.arrayBuffer();
      const inputFileName = "input" + (response.headers.get("content-type")?.includes("audio") ? ".mp3" : ".mp4");
      const outputFileName = "output.mp3";

      // Write input file
      await ffmpeg.writeFile(inputFileName, new Uint8Array(inputData));

      // Run FFmpeg command
      await ffmpeg.exec([
        "-i", inputFileName,
        "-vn", // Remove video
        "-acodec", "libmp3lame",
        "-ab", "192k",
        "-ar", "44100",
        "-y", // Overwrite output
        outputFileName
      ]);

      // Read the output file
      const outputData = await ffmpeg.readFile(outputFileName);

      return new Response(outputData, {
        headers: {
          ...corsHeaders,
          "Content-Type": "audio/mpeg",
          "Content-Disposition": `attachment; filename="converted.mp3"`,
        }
      });
    }

    // For non-MP3 requests, stream the original content
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const filename = new URL(url).pathname.split("/").pop() || "download";

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Transfer-Encoding": "chunked"
      }
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
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