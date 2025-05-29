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
    const { url } = await req.json();

    if (!url) {
      throw new Error("URL is required");
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      throw new Error("Invalid URL provided");
    }

    // Forward the request to the URL and stream the response
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch media: ${response.statusText}`);
    }

    // Get the content type from the response
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    
    // Extract filename from URL or use a default
    const urlObj = new URL(url);
    const filename = urlObj.pathname.split("/").pop() || "download";

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