import { serve } from "https://deno.land/std/http/server.ts";
import { JSDOM } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";
import { join, dirname } from "https://deno.land/std/path/mod.ts";
import { ensureDir } from "https://deno.land/std/fs/mod.ts";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

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

        // Use fetch instead of axios
        const response = await fetch("https://tiktokio.com/api/v1/tk-htmx", {
            method: 'POST',
            headers: headers,
            body: data
        });

        const html = await response.text();

        // Parse HTML with deno-dom
        const dom = new JSDOM(html);
        const links = {};

        // Extract download links from the page
        dom.window.document.querySelectorAll('.tk-down-link a').forEach((element) => {
            const text = element.textContent.trim();
            const href = element.getAttribute('href');
            links[text] = href;
        });

        return links;
    } catch (error) {
        return { error: "Failed to fetch data" };
    }
}

// Serve static files and handle requests manually
async function handleRequest(req) {
    const url = new URL(req.url);
    if (url.pathname === "/") {
        const htmlContent = await Deno.readTextFile(join(__dirname, "public", "index.html"));
        return new Response(htmlContent, {
            headers: { "Content-Type": "text/html" },
        });
    }

    if (url.pathname === "/download" && req.method === "POST") {
        const formData = await req.formData();
        const videoUrl = formData.get("video_url");
        const links = await getTikTokDownloadLinks(videoUrl);
        return new Response(JSON.stringify(links), {
            headers: { "Content-Type": "application/json" },
        });
    }

    return new Response("Not Found", { status: 404 });
}

// Start the server
const PORT = 3000;
console.log(`Server running on http://localhost:${PORT}`);

await ensureDir(join(__dirname, "public"));
const server = serve(handleRequest);
for await (const req of server) {
    await handleRequest(req);
}
