from flask import Flask, render_template, request, redirect, url_for
import requests
from bs4 import BeautifulSoup

app = Flask(__name__)

def get_tiktok_download_links(video_url):
    session = requests.Session()
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
        "Referer": "https://tiktokio.com/"
    }
    
    data = {
        "prefix": "dtGslxrcdcG9raW8uY29t",
        "vid": video_url
    }
    
    response = session.post("https://tiktokio.com/api/v1/tk-htmx", headers=headers, data=data)
    
    if response.status_code == 200:
        soup = BeautifulSoup(response.text, "html.parser")
        links = {a.text.strip(): a['href'] for a in soup.select(".tk-down-link a")}
        return links
    else:
        return {"error": "Failed to fetch data"}

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        video_url = request.form['video_url']
        links = get_tiktok_download_links(video_url)
        return render_template('index.html', links=links)
    return render_template('index.html', links=None)

if __name__ == "__main__":
    app.run(debug=True)