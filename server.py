#!/usr/bin/env python3
"""
3ilm+ Educational Streaming Platform Server
A simple HTTP server for serving the educational streaming application
"""

import os
import sys
import http.server
import socketserver
import mimetypes
import urllib.parse
from pathlib import Path

# Configuration
DEFAULT_PORT = 5000
DEFAULT_HOST = '0.0.0.0'

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom HTTP request handler with enhanced features for the 3ilm+ platform"""
    
    def __init__(self, *args, **kwargs):
        # Set the directory to serve files from
        super().__init__(*args, directory=os.getcwd(), **kwargs)
    
    def end_headers(self):
        """Add custom headers for security and functionality"""
        # Security headers
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('X-XSS-Protection', '1; mode=block')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        
        # CORS headers for development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        
        # Cache control for static assets
        if self.path.endswith(('.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico')):
            self.send_header('Cache-Control', 'public, max-age=86400')  # 1 day
        else:
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        
        super().end_headers()
    
    def do_GET(self):
        """Handle GET requests with custom routing"""
        # Parse the URL
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        
        # Remove leading slash for file system operations
        if path.startswith('/'):
            path = path[1:]
        
        # Default to index.html for root path
        if path == '' or path == '/':
            path = 'index.html'
        
        # Handle environment variables injection for js/env.js
        if path == 'js/env.js':
            self.serve_env_js()
            return
        
        # Handle SPA routing - redirect unknown paths to index.html
        # This allows client-side routing to work properly
        if not os.path.exists(path) and not path.startswith(('js/', 'css/', 'assets/', 'api/')):
            # Check if it's a known page route
            known_routes = [
                'home.html', 'login.html', 'register.html', 'profile.html', 
                'admin.html', 'watch.html', '404.html'
            ]
            
            # If it's not a file extension and not a known route, serve 404.html
            if '.' not in path.split('/')[-1]:
                if not any(route in path for route in known_routes):
                    path = '404.html'
        
        # Set the path for the parent class
        self.path = '/' + path
        
        # Call parent method to handle the request
        super().do_GET()
    
    def send_head(self):
        """Override send_head to ensure proper MIME types"""
        path = self.translate_path(self.path)
        
        # Check if file exists
        if not os.path.exists(path):
            self.send_error(404, "File not found")
            return None
        
        # Get MIME type - handle both string and tuple returns
        ctype_result = self.guess_type(path)
        if isinstance(ctype_result, tuple):
            ctype = ctype_result[0] or 'application/octet-stream'
        else:
            ctype = ctype_result or 'application/octet-stream'
        
        # Ensure HTML files have correct MIME type
        if path.endswith('.html'):
            ctype = 'text/html; charset=utf-8'
        
        try:
            f = open(path, 'rb')
        except OSError:
            self.send_error(404, "File not found")
            return None
        
        try:
            fs = os.fstat(f.fileno())
            self.send_response(200)
            self.send_header("Content-type", ctype)
            self.send_header("Content-Length", str(fs[6]))
            
            # Cache control based on file type
            if self.path.endswith(('.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico')):
                self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
                self.send_header("Cache-Control", "public, max-age=86400")
            else:
                # For HTML files, no caching
                self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
                self.send_header("Pragma", "no-cache")
                self.send_header("Expires", "0")
            
            self.end_headers()
            return f
        except:
            f.close()
            raise
    
    def serve_env_js(self):
        """Serve environment variables as JavaScript"""
        # Get environment variables
        api_key = os.getenv('VITE_FIREBASE_API_KEY', '')
        project_id = os.getenv('VITE_FIREBASE_PROJECT_ID', '')
        app_id = os.getenv('VITE_FIREBASE_APP_ID', '')
        
        # Create JavaScript content
        js_content = f"""// Environment variables for Firebase configuration
// This file is dynamically generated by the server

// Make environment variables available globally
window.VITE_FIREBASE_API_KEY = "{api_key}";
window.VITE_FIREBASE_PROJECT_ID = "{project_id}";
window.VITE_FIREBASE_APP_ID = "{app_id}";

console.log('Environment variables loaded successfully');
"""
        
        # Send response
        self.send_response(200)
        self.send_header('Content-Type', 'application/javascript')
        self.send_header('Content-Length', str(len(js_content.encode())))
        self.end_headers()
        self.wfile.write(js_content.encode())
    
    def do_OPTIONS(self):
        """Handle OPTIONS requests for CORS preflight"""
        self.send_response(200)
        self.end_headers()
    
    def guess_type(self, path):
        """Enhanced MIME type guessing with additional types"""
        # Convert path to string if it's a Path object
        path_str = str(path)
        
        # Add custom MIME types for specific extensions
        if path_str.endswith('.html'):
            return 'text/html'
        elif path_str.endswith('.js'):
            return 'application/javascript'
        elif path_str.endswith('.mjs'):
            return 'application/javascript'
        elif path_str.endswith('.css'):
            return 'text/css'
        elif path_str.endswith('.svg'):
            return 'image/svg+xml'
        elif path_str.endswith('.webp'):
            return 'image/webp'
        elif path_str.endswith('.woff2'):
            return 'font/woff2'
        elif path_str.endswith('.woff'):
            return 'font/woff'
        
        # Fallback to default behavior
        return super().guess_type(path)
    
    def log_message(self, format, *args):
        """Enhanced logging with timestamps and request details"""
        import datetime
        timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        # Extract client IP
        client_ip = self.client_address[0]
        
        # Color coding for different status codes
        status_code = args[1] if len(args) > 1 else ''
        
        if status_code.startswith('2'):
            color_code = '\033[92m'  # Green
        elif status_code.startswith('3'):
            color_code = '\033[93m'  # Yellow
        elif status_code.startswith('4'):
            color_code = '\033[91m'  # Red
        elif status_code.startswith('5'):
            color_code = '\033[95m'  # Magenta
        else:
            color_code = '\033[0m'   # Reset
        
        reset_code = '\033[0m'
        
        print(f"{timestamp} - {client_ip} - {color_code}{format % args}{reset_code}")

def check_required_files():
    """Check if required files exist"""
    required_files = [
        'index.html',
        'css/base.css',
        'css/layout.css', 
        'css/style.css',
        'js/main.js'
    ]
    
    missing_files = []
    for file_path in required_files:
        if not os.path.exists(file_path):
            missing_files.append(file_path)
    
    if missing_files:
        print("⚠️  Warning: The following required files are missing:")
        for file_path in missing_files:
            print(f"   - {file_path}")
        print("\nThe application may not work correctly without these files.")
        print("Please ensure all files are present before starting the server.\n")
        return False
    
    return True

def print_server_info(host, port):
    """Print server startup information"""
    print("🚀 3ilm+ Educational Streaming Platform Server")
    print("=" * 50)
    print(f"📡 Server running on: http://{host}:{port}")
    
    if host == '0.0.0.0':
        # Try to get local IP addresses
        import socket
        try:
            # Get local IP
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            local_ip = s.getsockname()[0]
            s.close()
            print(f"🌐 Local network: http://{local_ip}:{port}")
        except:
            pass
        
        print(f"🏠 Localhost: http://127.0.0.1:{port}")
    
    print(f"📁 Serving files from: {os.getcwd()}")
    print("\n📋 Available Pages:")
    pages = [
        ("🏠 Home", "/"),
        ("🔐 Login", "/login.html"),
        ("📝 Register", "/register.html"),
        ("🏠 Dashboard", "/home.html"),
        ("📺 Watch Video", "/watch.html"),
        ("👤 Profile", "/profile.html"),
        ("⚙️  Admin Panel", "/admin.html")
    ]
    
    for name, path in pages:
        print(f"   {name}: http://{host}:{port}{path}")
    
    print("\n💡 Tips:")
    print("   - Press Ctrl+C to stop the server")
    print("   - Ensure your Firebase configuration is set up correctly")
    print("   - Check the browser console for any JavaScript errors")
    print("\n🔄 Server logs:")
    print("-" * 50)

def main():
    """Main server function"""
    # Parse command line arguments
    import argparse
    
    parser = argparse.ArgumentParser(description='3ilm+ Educational Platform Server')
    parser.add_argument('--port', '-p', type=int, default=DEFAULT_PORT,
                      help=f'Port to serve on (default: {DEFAULT_PORT})')
    parser.add_argument('--host', '-H', default=DEFAULT_HOST,
                      help=f'Host to serve on (default: {DEFAULT_HOST})')
    parser.add_argument('--check-files', action='store_true',
                      help='Check for required files before starting')
    
    args = parser.parse_args()
    
    # Check if required files exist
    if args.check_files:
        if not check_required_files():
            response = input("Continue anyway? (y/N): ")
            if response.lower() != 'y':
                sys.exit(1)
    
    # Change to the script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    # Set up MIME types for modern web development
    mimetypes.add_type('application/javascript', '.js')
    mimetypes.add_type('application/javascript', '.mjs')
    mimetypes.add_type('text/css', '.css')
    mimetypes.add_type('image/svg+xml', '.svg')
    mimetypes.add_type('image/webp', '.webp')
    mimetypes.add_type('font/woff2', '.woff2')
    mimetypes.add_type('font/woff', '.woff')
    
    # Create and configure the server
    try:
        with socketserver.TCPServer((args.host, args.port), CustomHTTPRequestHandler) as httpd:
            print_server_info(args.host, args.port)
            
            # Start the server
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n\n🛑 Server stopped by user")
        sys.exit(0)
    except OSError as e:
        if e.errno == 98:  # Address already in use
            print(f"\n❌ Error: Port {args.port} is already in use")
            print(f"Try using a different port: python server.py --port {args.port + 1}")
        else:
            print(f"\n❌ Error starting server: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
