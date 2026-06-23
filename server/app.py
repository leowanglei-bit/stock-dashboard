"""
灵犀茶馆 后端服务
Flask + SQLite + 单密码登录
API 端口: 5000
"""

import os
import json
import hashlib
import secrets
import sqlite3
from datetime import datetime, timedelta
from functools import wraps

from flask import Flask, request, jsonify, g, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder='../dist', static_url_path='')
CORS(app)

# ───── 配置 ─────
DB_PATH = os.path.join(os.path.dirname(__file__), 'data.db')
PASSWORD = os.environ.get('LXCG_PASSWORD', 'lingxichaguan2024')
TOKEN_EXPIRE_HOURS = 24

# 内存 token 存储 {token: username}
_tokens: dict[str, datetime] = {}

# ───── 数据库 ─────
def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db

def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()

app.teardown_appcontext(close_db)

def init_db():
    db = sqlite3.connect(DB_PATH)
    db.execute('CREATE TABLE IF NOT EXISTS boards (id TEXT PRIMARY KEY, data TEXT NOT NULL)')
    db.execute('CREATE TABLE IF NOT EXISTS board_order (id TEXT PRIMARY KEY, data TEXT NOT NULL)')
    # 初始化默认行
    db.execute('INSERT OR IGNORE INTO boards (id, data) VALUES (?, ?)', ('main', '{}'))
    db.execute('INSERT OR IGNORE INTO board_order (id, data) VALUES (?, ?)', ('main', '[]'))
    db.commit()
    db.close()

init_db()

# ───── 认证 ─────
def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if token not in _tokens:
            return jsonify({'error': '未登录'}), 401
        expire = _tokens[token]
        if datetime.now() > expire:
            del _tokens[token]
            return jsonify({'error': '登录已过期'}), 401
        return f(*args, **kwargs)
    return decorated

# ───── API ─────

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or data.get('password') != PASSWORD:
        return jsonify({'error': '密码错误'}), 403
    token = secrets.token_hex(32)
    _tokens[token] = datetime.now() + timedelta(hours=TOKEN_EXPIRE_HOURS)
    return jsonify({'token': token})

@app.route('/api/boards', methods=['GET'])
@require_auth
def get_boards():
    db = get_db()
    boards_row = db.execute('SELECT data FROM boards WHERE id=?', ('main',)).fetchone()
    order_row = db.execute('SELECT data FROM board_order WHERE id=?', ('main',)).fetchone()
    return jsonify({
        'boards': json.loads(boards_row['data']) if boards_row else {},
        'boardOrder': json.loads(order_row['data']) if order_row else [],
    })

@app.route('/api/boards', methods=['PUT'])
@require_auth
def save_boards():
    data = request.get_json()
    if not data:
        return jsonify({'error': '无效数据'}), 400
    db = get_db()
    db.execute('UPDATE boards SET data=? WHERE id=?', (json.dumps(data.get('boards', {})), 'main'))
    db.execute('UPDATE board_order SET data=? WHERE id=?', (json.dumps(data.get('boardOrder', [])), 'main'))
    db.commit()
    return jsonify({'ok': True})

@app.route('/api/ping', methods=['GET'])
def ping():
    return jsonify({'ok': True, 'server': 'lingxichaguan'})

# ───── 前端静态文件 ─────
@app.route('/')
def index():
    return send_from_directory('../dist', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    # API 路由不走这里
    if path.startswith('api/'):
        return jsonify({'error': 'not found'}), 404
    try:
        return send_from_directory('../dist', path)
    except:
        return send_from_directory('../dist', 'index.html')

# ───── 启动 ─────
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f'灵犀茶馆 后端启动 http://0.0.0.0:{port}')
    print(f'默认密码: {PASSWORD} (通过 LXCG_PASSWORD 环境变量修改)')
    app.run(host='0.0.0.0', port=port, debug=True)
