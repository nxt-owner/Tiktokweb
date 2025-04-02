import express from "npm:express";
import axios from "npm:axios";
import { JSDOM } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts"; // Use Deno's DOM parser
import { join, dirname } from "https://deno.land/std/path/mod.ts";
import { ensureDir } from "https://deno.land/std/fs/mod.ts";
import { fileURLToPath } from "node:url";

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(join(__dirname, "public")));

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

        const response = await axios.post("https://tiktokio.com/api/v1/tk-htmx", data, { headers });

        // Parse HTML with deno-dom
        const dom = new JSDOM(response.data);
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

app.get("/", (req, res) => {
    res.sendFile(join(__dirname, "public", "index.html"));
});

app.post("/download", async (req, res) => {
    const videoUrl = req.body.video_url;
    const links = await getTikTokDownloadLinks(videoUrl);
    res.json(links);
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Ensure public directory exists
await ensureDir(join(__dirname, "public"));
