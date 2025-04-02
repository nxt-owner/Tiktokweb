const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

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

        const $ = cheerio.load(response.data);
        let links = {};

        $('.tk-down-link a').each((_, element) => {
            links[$(element).text().trim()] = $(element).attr('href');
        });

        return links;
    } catch (error) {
        return { error: "Failed to fetch data" };
    }
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/download', async (req, res) => {
    const videoUrl = req.body.video_url;
    const links = await getTikTokDownloadLinks(videoUrl);
    res.json(links);
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
