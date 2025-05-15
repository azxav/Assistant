// Flows will be imported for their side effects in this file.

import { NextRequest, NextResponse } from "next/server";

const KB_URL = process.env.NEXT_PUBLIC_KB_URL!;

function filterHeaders(headers: Headers) {
  const newHeaders = new Headers();
  for (const [key, value] of headers.entries()) {
    // Don't forward host/content-length/connection headers
    if (!["host", "content-length", "connection"].includes(key.toLowerCase())) {
      newHeaders.set(key, value);
    }
  }
  return newHeaders;
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const url = `${KB_URL}/${params.path.join("/")}${req.nextUrl.search}`;
  const res = await fetch(url, { headers: filterHeaders(req.headers) });
  const resText = await res.text();
  return new NextResponse(resText, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "application/json"
    }
  });
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  const url = `${KB_URL}/${params.path.join("/")}`;
  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    // Forward the stream body and filtered headers
    const res = await fetch(url, {
      method: "POST",
      headers: filterHeaders(req.headers),
      body: req.body,
    });
    const resText = await res.text();
    return new NextResponse(resText, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "application/json"
      }
    });
  }

  // Regular JSON request
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
}
