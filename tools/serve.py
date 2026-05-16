import http.server
import os
import sys

os.chdir(r'c:\Users\劳润杰\WorkBuddy\20260314143049')
port = 8765

handler = http.server.SimpleHTTPRequestHandler
httpd = http.server.HTTPServer(('localhost', port), handler)
print(f'Game server running at http://localhost:{port}/game_standalone.html')
sys.stdout.flush()
httpd.serve_forever()
