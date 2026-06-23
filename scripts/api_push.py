"""
Push git commit via GitHub API (when git push over 443 is blocked)
"""
import subprocess
import json
import base64
import sys

OWNER = 'leowanglei-bit'
REPO = 'stock-dashboard'
B=*** rest of script...

def gh(method, path, data=None):
    url = f'https://api.github.com/repos/{OWNER}/{REPO}/{path}'
    cmd = ['curl', '-s', '-X', method, url,
           '-H', f'Authorization: Bearer {TOKEN}',
           '-H', 'Accept: application/vnd.github+json']
    if data:
        cmd += ['-H', 'Content-Type: application/json', '-d', json.dumps(data)]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    return json.loads(r.stdout)

# Get current ref
ref = gh('GET', 'git/refs/heads/main')
print(f"Current commit: {ref['object']['sha']}")
parent_sha = ref['object']['sha']

# Get the current tree
commit = gh('GET', f'git/commits/{parent_sha}')
print(f"Current tree: {commit['tree']['sha']}")
base_tree = commit['tree']['sha']

# Read changed files
def read_file(path):
    with open(path, 'rb') as f:
        return base64.b64encode(f.read()).decode()

changes = [
    ('src/App.tsx', '100644'),
    ('src/data/apiClient.ts', '100644'),
    ('.github/workflows/deploy.yml', '100644'),
    ('src/App.module.css', '100644'),
]

tree_items = []
for path, mode in changes:
    content = read_file(path)
    blob = gh('POST', 'git/blobs', {'content': content, 'encoding': 'base64'})
    tree_items.append({
        'path': path,
        'mode': mode,
        'type': 'blob',
        'sha': blob['sha']
    })
    print(f"  Blob {path}: {blob['sha'][:12]}")

# Create tree
new_tree = gh('POST', 'git/trees', {'base_tree': base_tree, 'tree': tree_items})
print(f"New tree: {new_tree['sha'][:12]}")

# Create commit
new_commit = gh('POST', 'git/commits', {
    'message': 'fix: prevent empty data from overwriting server boards.json',
    'tree': new_tree['sha'],
    'parents': [parent_sha]
})
print(f"New commit: {new_commit['sha'][:12]}")

# Update ref
update = gh('PATCH', 'git/refs/heads/main', {
    'sha': new_commit['sha'],
    'force': False
})
print(f"Updated ref: {update['ref']} -> {update['object']['sha'][:12]}")
print("DONE")
