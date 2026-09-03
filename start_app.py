"""Dual-Mode Launcher for German Acquisition Companion.

1. Starts Cloudflare Instant Secure HTTPS Tunnel (Zero SSL warnings, instant Camera/Mic on Android).
2. Prints QR code and phone link for Xiaomi 13 Pro.
3. Runs FastAPI backend with 6-Key Auto-Rotation Pool.
"""

import sys
import os
import uvicorn
import qrcode
from pycloudflared import try_cloudflare

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')


def print_qr_code(url: str):
    qr = qrcode.QRCode(border=1)
    qr.add_data(url)
    qr.make(fit=True)
    print("\n📱 SCAN MIT DEINEM HANDY (Scan with Phone Camera):")
    qr.print_ascii(invert=True)


def main():
    port = 8000
    
    print("=" * 72)
    print("  🇩🇪 DEUTSCH LIVE ACQUISITION COMPANION — AUTO-KEY & CLOUDFLARE HTTPS")
    print("=" * 72)
    
    # 1. Start Cloudflare Tunnel for valid HTTPS on mobile (Enables Camera & Mic without warnings!)
    print("\n🌐 Starte sicheren Cloudflare HTTPS Tunnel für dein Handy...")
    try:
        tunnel = try_cloudflare(port=port)
        tunnel_url = tunnel.tunnel
    except Exception as e:
        print("Tunnel notice:", e)
        tunnel_url = f"http://localhost:{port}"

    print(f"\n💻 Am PC öffnen:              http://localhost:{port}")
    print(f"📱 Direkt auf deinem HANDY:   {tunnel_url}")
    
    if tunnel_url.startswith("https"):
        print_qr_code(tunnel_url)

    print("-" * 72)
    print("✨ KAMERA & MIKROFON AUF DEM HANDY:")
    print(f"1. Öffne den obigen Link: {tunnel_url}")
    print("2. Chrome fragt: 'Kamera und Mikrofon erlauben?' -> Tippe auf 'Erlauben'!")
    print("3. Die 6 API Keys rotieren automatisch im Hintergrund!")
    print("=" * 72 + "\n")

    # Run Uvicorn on local port 8000 (tunnel forwards traffic securely)
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=port,
        reload=False
    )


if __name__ == "__main__":
    main()
