"""
Vercel serverless function entry point
"""
import os
import json
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        query_params = parse_qs(parsed_path.query)
        
        try:
            if path == '/':
                # Home page - return HTML
                self.send_response(200)
                self.send_header('Content-type', 'text/html')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                html_content = """
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Mawrid Search Engine</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            max-width: 800px; 
                            margin: 0 auto; 
                            padding: 20px;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            min-height: 100vh;
                        }
                        .container { 
                            text-align: center; 
                            background: rgba(255,255,255,0.1);
                            padding: 40px;
                            border-radius: 20px;
                            backdrop-filter: blur(10px);
                        }
                        h1 { font-size: 3rem; margin-bottom: 20px; }
                        .search-box { 
                            display: flex; 
                            gap: 10px; 
                            margin: 30px 0; 
                            justify-content: center;
                        }
                        input { 
                            padding: 15px 20px; 
                            border: none; 
                            border-radius: 25px; 
                            font-size: 16px;
                            width: 300px;
                        }
                        button { 
                            padding: 15px 30px; 
                            background: white; 
                            color: #667eea; 
                            border: none; 
                            border-radius: 25px; 
                            font-weight: bold;
                            cursor: pointer;
                        }
                        .results { 
                            background: rgba(255,255,255,0.9); 
                            color: #333; 
                            padding: 20px; 
                            border-radius: 10px; 
                            margin-top: 20px; 
                            text-align: left;
                            display: none;
                        }
                        .loading { display: none; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>🔍 Mawrid Search</h1>
                        <p>AI-Powered Search Engine</p>
                        
                        <div class="search-box">
                            <input type="text" id="searchInput" placeholder="Search the web..." />
                            <button onclick="search()">Search</button>
                        </div>
                        
                        <div class="loading" id="loading">🔍 Searching...</div>
                        
                        <div class="results" id="results">
                            <h3>🤖 AI Summary</h3>
                            <p id="summary"></p>
                            <h3>📄 Results</h3>
                            <div id="resultsList"></div>
                        </div>
                    </div>

                    <script>
                        async function search() {
                            const query = document.getElementById('searchInput').value;
                            if (!query) return;
                            
                            document.getElementById('loading').style.display = 'block';
                            document.getElementById('results').style.display = 'none';
                            
                            try {
                                const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
                                const data = await response.json();
                                
                                document.getElementById('summary').textContent = data.ai_summary || 'No summary available';
                                
                                const resultsList = document.getElementById('resultsList');
                                resultsList.innerHTML = '';
                                
                                if (data.results && data.results.length > 0) {
                                    data.results.forEach(result => {
                                        const div = document.createElement('div');
                                        div.innerHTML = `
                                            <h4>${result.title}</h4>
                                            <p style="color: #666;">${result.url}</p>
                                            <p>${result.snippet}</p>
                                            <hr>
                                        `;
                                        resultsList.appendChild(div);
                                    });
                                }
                                
                                document.getElementById('results').style.display = 'block';
                            } catch (error) {
                                alert('Search failed. Please try again.');
                            }
                            
                            document.getElementById('loading').style.display = 'none';
                        }
                        
                        document.getElementById('searchInput').addEventListener('keypress', function(e) {
                            if (e.key === 'Enter') search();
                        });
                    </script>
                </body>
                </html>
                """
                self.wfile.write(html_content.encode())
                
            elif path == '/health':
                # Health check
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                response = {
                    "status": "healthy", 
                    "message": "Mawrid Search Engine is running!",
                    "openai_configured": bool(os.getenv("OPENAI_API_KEY"))
                }
                self.wfile.write(json.dumps(response).encode())
                
            elif path == '/api/search':
                # Search endpoint
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                query = query_params.get('query', ['test'])[0]
                openai_key = os.getenv("OPENAI_API_KEY")
                has_openai = bool(openai_key)
                
                response = {
                    "query": query,
                    "results": [
                        {
                            "title": f"Search result for: {query}",
                            "url": "https://example.com",
                            "snippet": f"This is a sample result for your search: {query}. The Mawrid Search Engine is working perfectly!"
                        }
                    ],
                    "total_results": 1,
                    "processing_time": 0.1,
                    "ai_summary": f"Here's what I found about '{query}'. This is a demo response from the Mawrid Search Engine. The search functionality is working correctly! OpenAI API: {'Connected' if has_openai else 'Not configured'}",
                    "suggestions": [f"{query} tutorial", f"{query} examples", f"{query} guide"],
                    "openai_configured": has_openai
                }
                self.wfile.write(json.dumps(response).encode())
                
            else:
                # 404 for other paths
                self.send_response(404)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                response = {"error": "Not found"}
                self.wfile.write(json.dumps(response).encode())
                
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = {"error": f"Internal server error: {str(e)}"}
            self.wfile.write(json.dumps(response).encode())
    
    def do_OPTIONS(self):
        # Handle CORS preflight
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()