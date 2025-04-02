import { serve } from "https://deno.land/std/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts"; // Correct import for DOMParser

// Function to get TikTok download links
async function getTikTokDownloadLinks(videoUrl) {
    try {
        const headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
            "Referer": "https://tiktokio.com/"
        };

        const data = new URLSearchParams({
            "prefix": "dtGslxrcdcG9raW8uY29t",
            "vid": videoUrl
        });

        // Use fetch to call the TikTok API
        const response = await fetch("https://tiktokio.com/api/v1/tk-htmx", {
            method: 'POST',
            headers: headers,
            body: data
        });

        const html = await response.text();

        // Use DOMParser to extract the links
        const doc = new DOMParser().parseFromString(html, "text/html");
        const links = {};

        // Extract download links from the page
        doc?.querySelectorAll('.tk-down-link a').forEach((element) => {
            const text = element.textContent?.trim() || '';
            const href = element.getAttribute('href') || '';
            links[text] = href;
        });

        return links;
    } catch (error) {
        return { error: "Failed to fetch TikTok video download links" };
    }
}

// Handle incoming requests to the API
async function handleRequest(req) {
    const url = new URL(req.url);
    
    if (url.pathname === "/download" && req.method === "POST") {
        try {
            const formData = await req.json(); // Get the JSON body
            const videoUrl = formData.video_url;

            if (!videoUrl) {
                return new Response(JSON.stringify({ error: "Missing 'video_url' parameter" }), {
                    status: 400,
                    headers: { "Content-Type": "application/json" }
                });
            }

            // Get download links
            const links = await getTikTokDownloadLinks(videoUrl);

            // Return the links as JSON
            return new Response(JSON.stringify(links), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        } catch (error) {
            return new Response(JSON.stringify({ error: "Invalid JSON format" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }
    }

    return new Response(JSON.stringify({ error: "Not Found" }), { status: 404 });
}

// Start the server
const PORT = 3000;
console.log(`Server running on http://localhost:${PORT}`);

await serve(handleRequest, { port: PORT });
