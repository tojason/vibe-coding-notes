#!/usr/bin/env python3
"""
Development server with hot reload for static files
Usage: python dev-server.py
"""

import http.server
import socketserver
import os
import time
import threading
from pathlib import Path

class ReloadHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add hot reload script to HTML files
        if self.path.endswith('.html'):
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        if self.path.endswith('.html'):
            # Inject hot reload script
            try:
                file_path = self.path[1:] if self.path.startswith('/') else self.path
                if not file_path:
                    file_path = 'src/index.html'
                
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Inject hot reload script before closing head tag
                hot_reload_script = '''
                <script>
                    let lastModified = {};
                    
                    function checkForUpdates() {
                        fetch('/api/check-updates')
                            .then(response => response.json())
                            .then(data => {
                                let needsReload = false;
                                for (const [file, modified] of Object.entries(data)) {
                                    if (lastModified[file] && lastModified[file] !== modified) {
                                        needsReload = true;
                                        break;
                                    }
                                    lastModified[file] = modified;
                                }
                                if (needsReload) {
                                    console.log('🔄 Files changed, reloading...');
                                    window.location.reload();
                                }
                            })
                            .catch(() => {}); // Ignore errors
                    }
                    
                    // Check for updates every 1 second
                    setInterval(checkForUpdates, 1000);
                    
                    // Initial check
                    setTimeout(checkForUpdates, 100);
                </script>
                '''
                
                if '</head>' in content:
                    content = content.replace('</head>', hot_reload_script + '\n</head>')
                else:
                    content = hot_reload_script + '\n' + content
                
                self.send_response(200)
                self.send_header('Content-type', 'text/html')
                self.send_header('Content-Length', str(len(content.encode())))
                self.end_headers()
                self.wfile.write(content.encode())
                return
                
            except FileNotFoundError:
                pass
        
        elif self.path == '/api/check-updates':
            # Return file modification times
            files_to_watch = [
                'src/index.html',
                'src/styles/main.css', 
                'src/scripts/main.js'
            ]
            
            file_times = {}
            for file_path in files_to_watch:
                try:
                    stat = os.stat(file_path)
                    file_times[file_path] = stat.st_mtime
                except FileNotFoundError:
                    pass
            
            import json
            response = json.dumps(file_times)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Content-Length', str(len(response)))
            self.end_headers()
            self.wfile.write(response.encode())
            return
        
        # Default behavior for other files
        super().do_GET()

def start_server(port=8000):
    handler = ReloadHandler
    
    with socketserver.TCPServer(("", port), handler) as httpd:
        print(f"🚀 Development server running at http://localhost:{port}")
        print(f"📁 Serving directory: {os.getcwd()}")
        print("🔥 Hot reload enabled - files will auto-refresh on changes")
        print("📝 Watching: src/index.html, src/styles/main.css, src/scripts/main.js")
        print("\nPress Ctrl+C to stop the server")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped")

if __name__ == "__main__":
    start_server()