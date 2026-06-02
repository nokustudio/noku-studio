import subprocess
import sys
import os

def run_command(cmd):
    try:
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        return result.stdout.strip(), None
    except subprocess.CalledProcessError as e:
        return None, e.stderr.strip() or e.stdout.strip() or str(e)

def get_current_branch():
    out, err = run_command(['git', 'rev-parse', '--abbrev-ref', 'HEAD'])
    return out if out else 'main'

def main():
    print('\n--- Git Push Utility (Python) ---')
    
    # Check if inside a git repository
    if not os.path.exists('.git'):
        out, err = run_command(['git', 'rev-parse', '--is-inside-work-tree'])
        if err:
            print("[ERROR] Not a git repository or git is not installed.")
            sys.exit(1)

    # 1. Show Git Status
    print("\n[INFO] Checking git status...")
    status_out, err = run_command(['git', 'status', '--short'])
    if err:
        print(f"[ERROR] Failed to run git status: {err}")
        sys.exit(1)
        
    if not status_out:
        print("[INFO] Working tree clean. Nothing to commit or push.")
        sys.exit(0)

    print("\nModified/Untracked files:")
    print("----------------------------------------")
    print(status_out)
    print("----------------------------------------")

    # 2. Get Commit Message
    default_msg = "refactor: optimize layout and compress video loop"
    msg = input(f"\nEnter commit message [{default_msg}]: ").strip()
    commit_msg = msg if msg else default_msg

    # Safety Check: Scan for heavy files or original backups
    print("\n[INFO] Scanning for heavy files/original backups...")
    heavy_files = []
    original_backups = []
    for root, dirs, files in os.walk('.'):
        if '.git' in root or 'node_modules' in root or '.claude' in root or 'backup' in root or 'scratch' in root:
            continue
        for f in files:
            filepath = os.path.join(root, f)
            try:
                size_mb = os.path.getsize(filepath) / (1024 * 1024)
                if f.endswith('_original.mp4'):
                    original_backups.append((filepath, size_mb))
                elif (f.endswith('.mp4') or f.endswith('.zip') or f.endswith('.glb')) and size_mb > 15:
                    heavy_files.append((filepath, size_mb))
            except OSError:
                pass

    if original_backups:
        print("Found original video backups (ignored via .gitignore):")
        for path, size in original_backups:
            print(f"  - {path} ({size:.1f} MB)")
            
    if heavy_files:
        print("\n[WARNING] Found heavy files (>15MB) in the worktree:")
        for path, size in heavy_files:
            print(f"  - {path} ({size:.1f} MB)")
        confirm = input("Are you sure you want to proceed with staging? [y/N]: ").strip().lower()
        if confirm != 'y':
            print("[INFO] Aborted by user.")
            sys.exit(0)

    # 3. Stage All Changes
    print("\n[INFO] Staging all changes (git add -A)...")
    _, err = run_command(['git', 'add', '-A'])
    if err:
        print(f"[ERROR] Failed to stage files: {err}")
        sys.exit(1)

    # 4. Commit Changes
    print(f"[INFO] Committing changes with message: '{commit_msg}'...")
    _, err = run_command(['git', 'commit', '-m', commit_msg])
    if err:
        print(f"[ERROR] Commit failed: {err}")
        sys.exit(1)

    # 5. Push Changes
    branch = get_current_branch()
    print(f"[INFO] Pushing changes to origin/{branch} (git push origin {branch})...")
    push_out, err = run_command(['git', 'push', 'origin', branch])
    if err:
        print(f"[ERROR] Push failed: {err}")
        # Offer to undo commit if push fails
        undo = input("\nWould you like to undo the commit (keeping staged changes)? [y/N]: ").strip().lower()
        if undo == 'y':
            run_command(['git', 'reset', '--soft', 'HEAD~1'])
            print("[INFO] Commit undone. Files remain staged.")
        sys.exit(1)

    print('\n========================================')
    print('[SUCCESS] ALL CHANGES COMMITTED AND PUSHED!')
    print('========================================')
    if push_out:
        print(push_out)
    print(f"- Branch: origin/{branch}")
    print(f"- Commit: '{commit_msg}'")
    print('========================================\n')

if __name__ == '__main__':
    main()
