#!/usr/bin/env python3
"""
Backend Synchronization Script for HackCBS
Pulls NEW commits touching /Backend-SIH from https://github.com/Abhay-Pratap-Singh-7/SIH-26
and groups them into feature-wise commits in this repo under /backend, then pushes to origin.

Commit messages mirror the original repo's commit messages.
Secrets (hardcoded API keys) are scrubbed before committing.
"""

import os
import sys
import json
import io
import re
import shutil
import tarfile
import subprocess
from datetime import datetime

# Configuration
REPO_ROOT = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(REPO_ROOT, "backend")
REMOTE_NAME = "sih"
REMOTE_URL = "https://github.com/Abhay-Pratap-Singh-7/SIH-26"
REMOTE_BRANCH = "main"
SOURCE_SUBDIR = "Backend-SIH"
STATE_FILE = os.path.join(REPO_ROOT, ".backend_sync_state.json")

# Default Meko configuration
MEKO_CONFIG = {
    "url": "https://mcp.mekodata.ai/mcp",
    "api_key": "mko_tkn_sz36o244sxwkvdj4zt7ridslvy4o5ejgsmddtbq",
    "datapack_id": "18666721-2dd5-4d14-8e0d-bbbe30a3287b",
    "agent_id": "antigravity:hackcbs",
    "conversation_id": "deb181a3-063e-4243-a0c9-6d0a871d3217"
}

# Secrets to scrub from files before committing (pattern -> replacement)
SECRET_PATTERNS = [
    (r'gsk_[A-Za-z0-9]{50,}', 'your_groq_api_key'),
]

# ─── Feature grouping rules ───────────────────────────────────────────────────
# Each group: (commit_message, list_of_path_globs_relative_to_backend/)
FEATURE_GROUPS = [
    (
        "feat(backend): implement multi-role auth, OTP verification, rate limiting, JWT tokens and OAuth",
        [
            "package.json", ".env.example", ".gitignore",
            "src/app.js", "src/server.js",
            "src/config/db.js", "src/config/security.js",
            "src/middlewares/authMiddleware.js",
            "src/middlewares/errorHandlerMiddleware.js",
            "src/middlewares/rateLimiterMiddleware.js",
            "src/middlewares/recaptchaMiddleware.js",
            "src/models/User.js", "src/models/Otp.js", "src/models/RefreshToken.js",
            "src/validations/authValidation.js",
            "src/routes/authRoutes.js",
            "src/controllers/authController.js",
            "src/services/emailService.js",
            "src/services/oauthService.js",
        ]
    ),
    (
        "feat(problems): add problem submission API with Groq AI classification, GPS normalization and auto-title",
        [
            "src/models/ProblemStatement.js",
            "src/validations/problemValidation.js",
            "src/routes/problemRoutes.js",
            "src/controllers/problemController.js",
            "src/services/aiService.js",
            "src/services/pythonAiService.js",
        ]
    ),
    (
        "feat(ai): integrate FAISS deduplication, HuggingFace Gradio client, College/Industry/Company Matcher ML models",
        [
            "ai/",
            "test_deduplication.py", "test_problem_analyzer.py", "test_out.txt",
            "backend_ai_deduplication_integration_guide.md",
        ]
    ),
    (
        "feat(dashboards): add university, industry and govt dashboards, team registration, solution submission and Cloudinary media upload",
        [
            "src/models/Team.js", "src/models/Company.js",
            "src/validations/teamValidation.js",
            "src/routes/universityRoutes.js", "src/routes/industryRoutes.js",
            "src/routes/govtRoutes.js", "src/routes/dashboardRoutes.js",
            "src/routes/uploadRoutes.js",
            "src/controllers/universityController.js",
            "src/controllers/industryController.js",
            "src/controllers/govtController.js",
            "src/controllers/dashboardController.js",
            "src/controllers/teamController.js",
            "src/controllers/uploadController.js",
        ]
    ),
    (
        "feat(notifications): implement FCM push notifications, follow issue badge updates and diagnostic push routes",
        [
            "src/config/firebase.js",
            "src/models/Notification.js", "src/models/Comment.js",
            "src/routes/notificationRoutes.js",
            "src/controllers/notificationController.js",
            "src/services/pushNotificationService.js",
        ]
    ),
    (
        "perf: add Redis caching, async email dispatch and implement dynamic multi-language translation pipeline",
        [
            "src/config/redis.js",
            "src/middlewares/cacheMiddleware.js",
            "src/services/translationService.js",
            "src/routes/translationRoutes.js",
            "package-lock.json",
        ]
    ),
]


def load_env():
    env_file = os.path.join(REPO_ROOT, ".env")
    if os.path.exists(env_file):
        with open(env_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    key = key.strip(); val = val.strip().strip("'\"")
                    if key == "MEKO_API_KEY": MEKO_CONFIG["api_key"] = val
                    elif key == "MEKO_DATAPACK_ID": MEKO_CONFIG["datapack_id"] = val
                    elif key == "MEKO_URL": MEKO_CONFIG["url"] = val


def meko_memory_add(text):
    import urllib.request, urllib.error
    url = MEKO_CONFIG["url"]
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "Authorization": f"Bearer {MEKO_CONFIG['api_key']}"
    }
    payload = {
        "jsonrpc": "2.0", "id": 1, "method": "tools/call",
        "params": {"name": "memory_add", "arguments": {
            "agent_id": MEKO_CONFIG["agent_id"],
            "conversation_id": MEKO_CONFIG["conversation_id"],
            "datapack_id": MEKO_CONFIG["datapack_id"],
            "text": text
        }}
    }
    try:
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers)
        with urllib.request.urlopen(req, timeout=30) as resp:
            resp.read()
            print("[Meko] Memory recorded.")
            return True
    except Exception as e:
        print(f"[Meko] Failed: {e}")
        return False


def run_git(args, check=True, env=None):
    result = subprocess.run(
        ["git"] + args, cwd=REPO_ROOT,
        stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        text=True, check=check, env=env
    )
    return result.stdout.strip()


def ensure_remote():
    remotes = run_git(["remote"]).splitlines()
    if REMOTE_NAME not in remotes:
        run_git(["remote", "add", REMOTE_NAME, REMOTE_URL])


def fetch_remote():
    print(f"[Git] Fetching {REMOTE_NAME}/{REMOTE_BRANCH}...")
    run_git(["fetch", REMOTE_NAME, REMOTE_BRANCH])


def scrub_secrets(content):
    """Remove hardcoded secrets from file content."""
    for pattern, replacement in SECRET_PATTERNS:
        content = re.sub(pattern, replacement, content)
    return content


def extract_backend_from_commit(commit_sha):
    """Extract Backend-SIH from a commit into BACKEND_DIR, scrubbing secrets."""
    if os.path.exists(BACKEND_DIR):
        for item in os.listdir(BACKEND_DIR):
            item_path = os.path.join(BACKEND_DIR, item)
            if os.path.isdir(item_path):
                shutil.rmtree(item_path, ignore_errors=True)
            else:
                try: os.remove(item_path)
                except OSError: pass
    else:
        os.makedirs(BACKEND_DIR, exist_ok=True)

    proc = subprocess.run(
        ["git", "archive", commit_sha, SOURCE_SUBDIR],
        cwd=REPO_ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True
    )
    prefix = f"{SOURCE_SUBDIR}/"
    TEXT_EXTENSIONS = {'.js', '.ts', '.py', '.json', '.md', '.txt', '.env', '.example',
                       '.sh', '.yaml', '.yml', '.toml', '.cfg', '.ini', '.html', '.css'}

    with tarfile.open(fileobj=io.BytesIO(proc.stdout)) as tar:
        for member in tar.getmembers():
            if member.name == SOURCE_SUBDIR:
                continue
            rel_path = member.name[len(prefix):] if member.name.startswith(prefix) else member.name
            target_path = os.path.join(BACKEND_DIR, rel_path)
            if member.isdir():
                os.makedirs(target_path, exist_ok=True)
            else:
                os.makedirs(os.path.dirname(target_path), exist_ok=True)
                with tar.extractfile(member) as source:
                    raw = source.read()
                ext = os.path.splitext(rel_path)[1].lower()
                if ext in TEXT_EXTENSIONS:
                    try:
                        content = raw.decode("utf-8")
                        content = scrub_secrets(content)
                        raw = content.encode("utf-8")
                    except UnicodeDecodeError:
                        pass
                with open(target_path, "wb") as dest:
                    dest.write(raw)


def get_backend_all_files():
    """Return list of all files in BACKEND_DIR relative to REPO_ROOT."""
    result = []
    for root, dirs, files in os.walk(BACKEND_DIR):
        for f in files:
            full = os.path.join(root, f)
            rel = os.path.relpath(full, REPO_ROOT).replace("\\", "/")
            result.append(rel)
    return result


def stage_feature_group(group_paths):
    """Stage only the files matching group_paths globs."""
    backend_rel = os.path.relpath(BACKEND_DIR, REPO_ROOT).replace("\\", "/")
    staged_any = False
    for pattern in group_paths:
        full_pattern = f"{backend_rel}/{pattern}"
        # If it ends with /, stage directory recursively
        if pattern.endswith("/"):
            dir_path = os.path.join(BACKEND_DIR, pattern.rstrip("/"))
            if os.path.exists(dir_path):
                run_git(["add", full_pattern.rstrip("/")])
                staged_any = True
        else:
            file_path = os.path.join(BACKEND_DIR, pattern.replace("/", os.sep))
            if os.path.exists(file_path):
                run_git(["add", full_pattern])
                staged_any = True
    return staged_any


def has_staged_changes():
    res = subprocess.run(
        ["git", "diff", "--cached", "--quiet"], cwd=REPO_ROOT
    )
    return res.returncode != 0


def commit_group(commit_msg, author_name=None, author_email=None):
    if not has_staged_changes():
        return False
    env = os.environ.copy()
    if author_name:
        env["GIT_AUTHOR_NAME"] = author_name
    if author_email:
        env["GIT_AUTHOR_EMAIL"] = author_email
    proc = subprocess.run(
        ["git", "commit", "-m", commit_msg],
        cwd=REPO_ROOT, env=env,
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
    )
    if proc.returncode != 0:
        print(f"[Git] Commit error: {proc.stderr}")
        return False
    print(f"[Git] Committed: {commit_msg[:80]}")
    return True


def stage_remaining():
    """Stage any remaining backend files not caught by feature groups."""
    run_git(["add", "backend"])
    return has_staged_changes()


def push_to_origin():
    print("[Git] Pushing to origin/main...")
    result = subprocess.run(
        ["git", "push", "origin", "main"],
        cwd=REPO_ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
    )
    if result.returncode != 0:
        print(f"[Git] Push error: {result.stderr}")
        return False
    print("[Git] Pushed successfully.")
    return True


def load_state():
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def save_state(state):
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)


def get_latest_commit_meta(commit_sha):
    output = run_git(["log", "-1", "--format=%an%n%ae", commit_sha])
    parts = output.split("\n", 1)
    return (parts[0].strip() if len(parts) > 0 else ""), (parts[1].strip() if len(parts) > 1 else "")


def sync(dry_run=False):
    load_env()
    ensure_remote()
    fetch_remote()

    state = load_state()
    last_synced_commit = state.get("last_synced_commit")
    remote_ref = f"{REMOTE_NAME}/{REMOTE_BRANCH}"

    if not last_synced_commit:
        print("[Sync] No prior state found. This is initial sync — getting latest state.")
        latest_sha = run_git(["rev-parse", remote_ref])
        commits = [latest_sha]
        is_initial = True
    else:
        log_out = run_git(["log", "--reverse", "--format=%H", f"{last_synced_commit}..{remote_ref}", "--", SOURCE_SUBDIR])
        commits = [c.strip() for c in log_out.splitlines() if c.strip()]
        is_initial = False

    if not commits:
        print(f"[Sync] Already up to date. Last synced: {last_synced_commit[:7] if last_synced_commit else 'none'}")
        return

    latest_sha = commits[-1]
    author_name, author_email = get_latest_commit_meta(latest_sha)
    commit_msg_out = run_git(["log", "-1", "--format=%B", latest_sha])
    first_line = commit_msg_out.strip().splitlines()[0] if commit_msg_out.strip() else ""

    print(f"[Sync] Pulling backend at {latest_sha[:7]}: {first_line}")
    if dry_run:
        print("[Sync] Dry run — no commits made.")
        return

    extract_backend_from_commit(latest_sha)

    committed_count = 0
    for group_msg, group_paths in FEATURE_GROUPS:
        staged = stage_feature_group(group_paths)
        if staged and has_staged_changes():
            if commit_group(group_msg, author_name, author_email):
                committed_count += 1

    # Catch-all: anything not covered by groups
    if stage_remaining():
        if commit_group(f"chore(backend): sync remaining backend files from SIH-26 ({latest_sha[:7]})", author_name, author_email):
            committed_count += 1

    if committed_count > 0:
        print(f"[Sync] Made {committed_count} feature commits. Pushing to origin...")
        push_to_origin()

        memory_text = (
            f"Backend synced from https://github.com/Abhay-Pratap-Singh-7/SIH-26 at {latest_sha[:7]}: "
            f"\"{first_line}\". Committed {committed_count} feature-wise groups into hackcbs /backend and pushed to origin."
        )
        meko_memory_add(memory_text)
    else:
        print("[Sync] No new changes found in backend.")

    state["last_synced_commit"] = latest_sha
    state["last_synced_at"] = datetime.now().isoformat()
    state["total_synced_commits"] = state.get("total_synced_commits", 0) + committed_count
    save_state(state)
    print(f"[Sync] Done. State saved at {latest_sha[:7]}.")


if __name__ == "__main__":
    dry_run = "--dry-run" in sys.argv
    sync(dry_run=dry_run)
