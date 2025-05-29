import { createClient } from "npm:@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const RAPID_API_KEY = Deno.env.get("RAPID_API_KEY");
const RAPID_API_HOST = "youtube-mp36.p.rapidapi.com";

async function getDownloadUrl(videoUrl: string) {
  // First, get the conversion ID
  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': RAPID_API_KEY,
      'X-RapidAPI-Host': RAPID_API_HOST
    }
  };

  const response = await fetch(
    `https://${RAPID_API_HOST}/dl?url=${encodeURIComponent(videoUrl)}`,
    options
  );

  if (!response.ok) {
    throw new Error('Failed to initiate conversion');
  }

  const data = await response.json();
  
  if (data.status === 'fail') {
    throw new Error(data.msg || 'Conversion failed');
  }

  return data.link;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, format } = await req.json();

    if (!url) {
      throw new Error("URL is required");
    }

    if (!RAPID_API_KEY) {
      throw new Error("API key not configured");
    }

    // Get the download URL from Rapid API
    const downloadUrl = await getDownloadUrl(url);

    // Fetch the converted file
    const response = await fetch(downloadUrl);
    
    if (!response.ok) {
      throw new Error('Failed to download converted file');
    }

    // Stream the response back to the client
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": format === "mp3" ? "audio/mpeg" : "video/mp4",
        "Content-Disposition": `attachment; filename="download.${format}"`,
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