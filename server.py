import http.server
import socketserver
import os

PORT = 8001

class CleanURLHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Separate path from query string / anchor
        url_parts = self.path.split('?', 1)
        clean_path = url_parts[0].split('#', 1)[0]
        query = '?' + url_parts[1] if len(url_parts) > 1 else ''

        full_path = self.translate_path(clean_path)

        # If file does not exist, check if appending .html matches a file
        if not os.path.exists(full_path) and os.path.exists(full_path + '.html'):
            self.path = clean_path + '.html' + query

        return super().do_GET()

if __name__ == '__main__':
    # Allow address reuse to restart server immediately
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), CleanURLHandler) as httpd:
        print(f"Local development server running at http://localhost:{PORT}")
        httpd.serve_forever()
