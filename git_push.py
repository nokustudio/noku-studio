import subprocess
import sys
import os

def run_command(cmd):
    try:
        result = subprocess.run(
            cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            text=True, encoding='utf-8', errors='replace', check=True
        )
        return (result.stdout or '').strip(), None
    except subprocess.CalledProcessError as e:
        stderr = (e.stderr or '').strip()
        stdout = (e.stdout or '').strip()
        return None, stderr or stdout or str(e)
    except Exception as e:
        return None, str(e)

def get_current_branch():
    out, err = run_command(['git', 'rev-parse', '--abbrev-ref', 'HEAD'])
    return out if out else 'main'

def generate_commit_message():
    import re
    # 1. Run git status to see what's changed
    status_out, _ = run_command(['git', 'status', '--short'])
    if not status_out:
        return "chore: clean working tree"

    modified = []
    added = []
    deleted = []
    all_files = []

    for line in status_out.splitlines():
        if not line.strip():
            continue
        # Format of git status --short: XY path
        status_code = line[:2]
        filepath = line[2:].strip().strip('"\'')
        
        all_files.append(filepath)
        if 'M' in status_code:
            modified.append(filepath)
        elif 'A' in status_code or '??' in status_code:
            added.append(filepath)
        elif 'D' in status_code:
            deleted.append(filepath)

    # 2. Get the diff against HEAD to analyze content changes
    diff_out, diff_err = run_command(['git', 'diff', 'HEAD'])
    if not diff_out:
        # Fallback to unstaged diff if HEAD is identical
        diff_out, _ = run_command(['git', 'diff'])
    
    # Truncate very large diffs to avoid performance issues
    diff_text = diff_out if diff_out else ""
    if len(diff_text) > 50000:
        diff_text = diff_text[:50000]
    diff_lower = diff_text.lower()

    # 3. Analyze keywords in the diff
    detected_keywords = []
    inferred_types = []

    # Map of substring pattern -> (keyword description, commit type)
    patterns = [
        (r'mobile-menu-toggle', 'mobile menu toggle', 'refactor'),
        (r'mobile-filter-toggle', 'mobile catalog filters', 'feat'),
        (r'catalog-sidebar', 'catalog sidebar dropdown', 'feat'),
        (r'dimensions-option-group', 'dimensions layout', 'style'),
        (r'slider-arrow|prev-image-btn|next-image-btn', 'product gallery navigation', 'fix'),
        (r'inquiry-modal|btn-inquire|inquire', 'inquiry modal popup', 'feat'),
        (r'zoho', 'zoho form integration', 'feat'),
        (r'carousel-card|featured-carousel', 'carousel safety margin', 'style'),
        (r'git_push\.py', 'git push utility commit naming', 'chore'),
        (r'@media.*768px', 'mobile responsive layout', 'style'),
        (r'height|padding|margin|gap|aspect-ratio', 'layout spacing overrides', 'style'),
        (r'box-shadow|border|color', 'style decoration overrides', 'style'),
        (r'remove|cleanup|duplicate|delete|clean', 'code cleanup', 'refactor'),
        (r'bug|fix|error|resolve|issue', 'bugfix', 'fix'),
    ]

    for pattern, desc, c_type in patterns:
        if re.search(pattern, diff_lower):
            detected_keywords.append(desc)
            inferred_types.append(c_type)

    # Map of file path/extensions to commit types & descriptions
    file_map = {
        '.css': ('style', 'styles'),
        '.js': ('feat', 'script logic'),
        '.html': ('feat', 'page structure'),
        '.md': ('docs', 'documentation'),
        '.py': ('chore', 'script utility'),
    }

    # If no keywords matched in diff, analyze the files themselves
    file_descs = []
    file_types = []
    for filepath in all_files:
        ext = os.path.splitext(filepath)[1]
        basename = os.path.basename(filepath)
        
        # Specific file matches
        if basename == 'git_push.py':
            file_types.append('chore')
            file_descs.append('git push naming logic')
        elif basename in ['walkthrough.md', 'task.md', 'implementation_plan.md']:
            file_types.append('docs')
            file_descs.append(basename.replace('.md', ''))
        elif ext in file_map:
            t, d = file_map[ext]
            file_types.append(t)
            file_descs.append(os.path.splitext(basename)[0] + ' ' + d)
        else:
            file_types.append('chore')
            file_descs.append(basename)

    # Determine commit type based on hierarchy:
    # fix > feat > refactor > style > docs > chore
    type_priority = ['fix', 'feat', 'refactor', 'style', 'docs', 'chore']
    
    resolved_type = 'chore'
    all_inferred_types = inferred_types + file_types
    for t in type_priority:
        if t in all_inferred_types:
            resolved_type = t
            break

    # Determine description:
    # Use keywords if detected, otherwise file descriptions
    if detected_keywords:
        # Remove duplicates while preserving order
        seen = set()
        unique_kws = [x for x in detected_keywords if not (x in seen or seen.add(x))]
        description = "update " + ", ".join(unique_kws[:2])
    elif file_descs:
        seen = set()
        unique_files = [x for x in file_descs if not (x in seen or seen.add(x))]
        description = "modify " + ", ".join(unique_files[:2])
    else:
        description = "update changes"

    # If a specific file delete is staged, reflect that
    if deleted and not modified and not added:
        resolved_type = 'chore'
        description = f"remove {os.path.basename(deleted[0])}"

    # Clean description (max length and trim)
    commit_msg = f"{resolved_type}: {description}"
    if len(commit_msg) > 65:
        commit_msg = commit_msg[:62] + "..."
        
    return commit_msg

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
    default_msg = generate_commit_message()
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
# Test comment to verify git_push.py is working

