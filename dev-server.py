import http.server
import socketserver
import os

PORT = 8081

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # If the URL has no extension and it's not a directory, try appending .html
        path = self.translate_path(self.path)
        if not os.path.exists(path) and not path.endswith('.html'):
            if os.path.exists(path + '.html'):
                self.path += '.html'
        return super().do_GET()

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving at port {PORT} with .html fallback...")
    httpd.serve_forever()
