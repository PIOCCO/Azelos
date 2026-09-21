#!/usr/bin/env python3
"""
Lab-only HTTP login form for testing Hydra http-post-form (no external deps).

  python3 http_login_server.py --port 8080

Default accounts (change in VALID_USERS or env not supported - edit file for lab):
  alice@lab.test / Alice123!
  bob@lab.test   / Bob123!
"""

from __future__ import annotations

import argparse
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse

VALID_USERS = {
    "alice@lab.test": "Alice123!",
    "bob@lab.test": "Bob123!",
}

LOGIN_HTML = b"""<!DOCTYPE html>
<html><head><title>Lab Login</title></head>
<body>
<h1>Lab login (Hydra test)</h1>
<form method="POST" action="/login">
  <label>User <input name="user" type="text"></label><br>
  <label>Pass <input name="pass" type="password"></label><br>
  <button type="submit">Sign in</button>
</form>
</body></html>
"""


class LoginHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:
        print(f"[{self.address_string()}] {fmt % args}")

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path in ("/", "/login"):
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(LOGIN_HTML)
            return
        self.send_error(404)

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        if path != "/login":
            self.send_error(404)
            return
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length).decode("utf-8", errors="replace")
        data = parse_qs(body)
        user = (data.get("user") or [""])[0]
        password = (data.get("pass") or [""])[0]
        if VALID_USERS.get(user) == password:
            msg = b"<html><body><h1>Welcome</h1><p>Login OK</p></body></html>"
            self.send_response(200)
        else:
            msg = b"<html><body><h1>Invalid credentials</h1></body></html>"
            self.send_response(401)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(msg)


def main() -> None:
    parser = argparse.ArgumentParser(description="Lab HTTP login for Hydra tests")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8080)
    args = parser.parse_args()
    server = HTTPServer((args.host, args.port), LoginHandler)
    print(f"Lab login: http://{args.host}:{args.port}/login")
    print("Users:", ", ".join(VALID_USERS.keys()))
    server.serve_forever()


if __name__ == "__main__":
    main()
