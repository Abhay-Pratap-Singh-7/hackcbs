#!/usr/bin/env python3
"""
Continuous Background Sync Daemon for HackCBS Backend
Runs sync_backend.py every 20 minutes (1200 seconds).
"""

import time
import os
import sys
from datetime import datetime
from sync_backend import sync

INTERVAL_SECONDS = 20 * 60  # 20 minutes

def run_loop():
    print(f"[{datetime.now().isoformat()}] Backend sync daemon started. Running every 20 minutes.")
    while True:
        try:
            print(f"\n[{datetime.now().isoformat()}] --- Starting 20-minute sync cycle ---")
            sync()
            print(f"[{datetime.now().isoformat()}] Cycle completed. Next run in 20 minutes.")
        except Exception as e:
            print(f"[{datetime.now().isoformat()}] Error during sync: {e}")
        
        try:
            time.sleep(INTERVAL_SECONDS)
        except KeyboardInterrupt:
            print("\n[Daemon] Stopped by user.")
            break

if __name__ == "__main__":
    run_loop()

