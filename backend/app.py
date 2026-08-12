
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room
import sqlite3
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
CORS(app, origins='*')
socketio = SocketIO(app, cors_allowed_origins='*', async_mode='threading')

# ===== SQLITE DATABASE =====
DB_PATH = os.path.join(os.path.dirname(__file__), 'chat.db')

def init_db():
    """Create tables if not exists"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Users table
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            company_name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Messages table
    c.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_name TEXT NOT NULL,
            sender_id INTEGER NOT NULL,
            sender_username TEXT NOT NULL,
            message_text TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sender_id) REFERENCES users(id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✅ SQLite database initialized")

# Initialize database
init_db()

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# ===== TEST ROUTE =====
@app.route('/')
def home():
    return jsonify({"status": "ok", "message": "Chat System Backend Running"})

# ===== REGISTER API =====
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.json
        username = data.get('username', '').strip()
        company_name = data.get('company_name', '').strip()
        
        if not username or not company_name:
            return jsonify({'error': 'Username and company name required'}), 400
        
        conn = get_db()
        c = conn.cursor()
        
        # Check if user exists
        c.execute("SELECT id, username, company_name FROM users WHERE username = ?", (username,))
        user = c.fetchone()
        
        if user:
            conn.close()
            return jsonify({
                'user_id': user['id'],
                'username': user['username'],
                'company_name': user['company_name'],
                'room_id': user['company_name']
            })
        
        # Create new user
        c.execute(
            "INSERT INTO users (username, company_name) VALUES (?, ?)",
            (username, company_name)
        )
        conn.commit()
        user_id = c.lastrowid
        conn.close()
        
        return jsonify({
            'user_id': user_id,
            'username': username,
            'company_name': company_name,
            'room_id': company_name
        }), 201
        
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return jsonify({'error': str(e)}), 500

# ===== GET MESSAGES =====
@app.route('/api/messages/<company_name>', methods=['GET'])
def get_messages(company_name):
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute(
            "SELECT id, sender_id, sender_username, message_text, timestamp "
            "FROM messages WHERE company_name = ? ORDER BY timestamp DESC LIMIT 100",
            (company_name,)
        )
        messages = c.fetchall()
        conn.close()
        
        # Reverse to show oldest first
        messages = list(messages)[::-1]
        
        return jsonify([{
            'id': m['id'],
            'sender_id': m['sender_id'],
            'sender_username': m['sender_username'],
            'message_text': m['message_text'],
            'timestamp': m['timestamp']
        } for m in messages])
        
    except Exception as e:
        print(f"❌ Error fetching messages: {e}")
        return jsonify([]), 200

# ===== GET ONLINE USERS =====
@app.route('/api/online/<company_name>', methods=['GET'])
def get_online_users(company_name):
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute("SELECT id, username FROM users WHERE company_name = ?", (company_name,))
        users = c.fetchall()
        conn.close()
        
        return jsonify([{
            'user_id': u['id'],
            'username': u['username']
        } for u in users])
        
    except Exception as e:
        print(f"❌ Error fetching users: {e}")
        return jsonify([]), 200

# ===== SOCKET.IO EVENTS =====
@socketio.on('connect')
def handle_connect():
    print('✅ Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('❌ Client disconnected')

@socketio.on('join_room')
def handle_join_room(data):
    print(f"🔵 Join room: {data}")
    join_room(data.get('company_name'))

@socketio.on('send_message')
def handle_send_message(data):
    print(f"💬 Message: {data}")
    
    conn = get_db()
    c = conn.cursor()
    c.execute(
        "INSERT INTO messages (company_name, sender_id, sender_username, message_text) VALUES (?, ?, ?, ?)",
        (data['company_name'], data['sender_id'], data['username'], data['text'])
    )
    conn.commit()
    conn.close()
    
    emit('receive_message', data, room=data['company_name'])

# ===== RUN SERVER =====
if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print(f"🚀 Server running on port {port}")
    socketio.run(app, host='0.0.0.0', port=port, debug=True)
