import { NextRequest, NextResponse } from "next/server";

const KB_URL = process.env.NEXT_PUBLIC_KB_URL || "http://localhost:8000";
console.log("PROXY KB_URL INITIALIZED TO:", KB_URL);

// Function to filter out problematic headers that shouldn't be forwarded
function filterHeaders(headers: Headers) {
  const newHeaders = new Headers();
  for (const [key, value] of headers.entries()) {
    // Skip problematic headers that shouldn't be forwarded
    if (!["host", "content-length", "connection"].includes(key.toLowerCase())) {
      newHeaders.set(key, value);
    }
  }
  return newHeaders;
}

export async function GET(req: NextRequest, context: { params: { path: string[] } }) {
  // Await params as per Next.js 15 guidelines
  const params = context.params;
  const url = `${KB_URL}/${params.path.join("/")}${req.nextUrl.search}`;
  try {
    const res = await fetch(url, { headers: filterHeaders(req.headers) });
    const resText = await res.text();
    
    // Return the response with proper headers
    return new NextResponse(resText, { 
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "application/json"
      }
    });
  } catch (err) {
    console.error(`Error proxying GET to ${url}:`, err);
    return new NextResponse(JSON.stringify({ error: "Failed to connect to knowledge base service" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function POST(req: NextRequest, context: { params: { path: string[] } }) {
  // Await params as per Next.js 15 guidelines
  const params = context.params;
  const url = `${KB_URL}/${params.path.join("/")}`;
  const contentType = req.headers.get('content-type') || '';
  
  try {
    // Special handling for file uploads (multipart/form-data)
    if (contentType.includes('multipart/form-data')) {
      console.log(`Proxying file upload request to ${url}`);
      
      const res = await fetch(url, {
        method: "POST",
        // Only forward filtered headers to avoid issues
        headers: filterHeaders(req.headers),
        body: req.body,
        // @ts-ignore // Required for streaming bodies in Node.js fetch
        duplex: 'half', 
      });
      
      console.log(`Upload response status: ${res.status}`);
      const resText = await res.text();
      
      let jsonValid = true;
      let parsedJson = null;
      try {
        if (resText.trim()) {
          parsedJson = JSON.parse(resText);
        }
      } catch (e) {
        console.warn("Response from backend for file upload was not valid JSON:", resText.slice(0, 200));
        jsonValid = false;
      }
      
      if (!jsonValid) {
        if (res.ok) {
          // If backend returned non-JSON but status is OK (e.g. plain text success message)
          return new NextResponse(JSON.stringify({ 
            success: true, 
            message: "File upload processed, backend returned non-JSON success.",
            details: resText.slice(0, 200)
          }), { 
            status: 200, 
            headers: { "Content-Type": "application/json" } 
          });
        } else {
          return new NextResponse(JSON.stringify({ 
            error: "Upload failed on backend", 
            details: resText.slice(0, 200) 
          }), { 
            status: res.status, 
            headers: { "Content-Type": "application/json" } 
          });
        }
      }
      
      // If it was valid JSON, return it as is
      return new NextResponse(resText, { 
        status: res.status,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Regular JSON request handling
    const body = await req.text();
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    
    const txt = await res.text();
    return new NextResponse(txt, { 
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "application/json"
      }
    });
  } catch (err: any) {
    console.error(`Error proxying POST to ${url}:`, err);
    // Ensure duplex error is clearly reported if it's the cause
    const errorMessage = err.message && err.message.includes('duplex option is required') 
      ? `Fetch error: ${err.message}. This often means the 'duplex: \'half\'' option is missing for streaming POST requests.`
      : (err.message || String(err));

    return new NextResponse(JSON.stringify({ 
      error: "Failed to connect to knowledge base service",
      details: errorMessage
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
} 