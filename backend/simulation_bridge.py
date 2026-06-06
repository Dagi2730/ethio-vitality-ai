"""
Serial bridge: reads Proteus simulation output and POSTs to the FastAPI ingest endpoint.
Run: python simulation_bridge.py --port COM3  (Windows) or --port /dev/ttyUSB0  (Linux)

Expected serial format (one JSON per line):
{"heart_rate": 75, "stress_level": 40, "spo2": 97.5}
"""
from __future__ import annotations

import argparse
import json
import os
import time

import requests
from dotenv import load_dotenv

load_dotenv()

INGEST_URL = os.getenv("INGEST_URL", "import.meta.env.VITE_API_URL")
DEMO_TOKEN = os.getenv("BRIDGE_TOKEN", "")


def parse_line(line: str) -> dict | None:
    line = line.strip()
    if not line:
        return None
    try:
        return json.loads(line)
    except json.JSONDecodeError:
        pass
    parts = line.split(",")
    if len(parts) >= 2:
        try:
            return {
                "heart_rate": int(parts[0]),
                "stress_level": int(parts[1]),
                "spo2": float(parts[2]) if len(parts) > 2 else 98.0,
                "source": "proteus",
            }
        except ValueError:
            pass
    return None


def run_bridge(port: str, baud: int = 9600) -> None:
    try:
        import serial
    except ImportError:
        print("Install pyserial: pip install pyserial")
        return

    if not DEMO_TOKEN:
        print("Warning: set BRIDGE_TOKEN in .env to a valid JWT (login as user@ethio.dev)")

    print(f"Connecting to {port} at {baud} baud...")
    with serial.Serial(port, baud, timeout=2) as ser:
        print("Bridge running. Ctrl+C to stop.")
        while True:
            try:
                raw = ser.readline().decode("utf-8", errors="ignore")
                if not raw.strip():
                    continue
                data = parse_line(raw)
                if data:
                    data["source"] = "proteus"
                    headers = {"Content-Type": "application/json"}
                    if DEMO_TOKEN:
                        headers["Authorization"] = f"Bearer {DEMO_TOKEN}"
                    resp = requests.post(INGEST_URL, json=data, headers=headers, timeout=3)
                    print(f"→ {data} | status {resp.status_code}")
                else:
                    print(f"[skip] unparseable: {raw!r}")
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"[error] {e}")
                time.sleep(1)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", default="COM3")
    ap.add_argument("--baud", type=int, default=9600)
    args = ap.parse_args()
    run_bridge(args.port, args.baud)
