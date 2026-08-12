
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room
import pymysql
import os
from datetime import datetime
from dotenv import load_dotenv
import traceback

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
CORS(app, origins='*')
socketio = SocketIO(app, cors_allowed_origins='*', async_mode='threading')

# Database connection
def get_db_connection():
    try:
        return pymysql.connect(
            host=os.getenv('DB_HOST', '127.0.0.1'),
            user=os.getenv('DB_USER', 'dev_user'),
            password=os.getenv('DB_PASSWORD', 'password123'),
            database=os.getenv('DB_NAME', 'company_chat'),
            port=int(os.getenv('DB_PORT', 3306)),
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=False
        )
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return None

# Test route
@app.route('/')
def home():
    return jsonify({"status": "ok", "message": "Chat System Backend Running"})

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.json
        print(f"📥 Registration request: {data}")
        
        username = data.get('username', '').strip()
        company_name = data.get('company_name', '').strip()
        
        if not username or not company_name:
            return jsonify({'error': 'Username and company name required'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        try:
            with conn.cursor() as cursor:
                # Check if user exists
                cursor.execute("SELECT id, username, company_name FROM users WHERE username = %s", (username,))
                user = cursor.fetchone()
                
                if user:
                    return jsonify({
                        'user_id': user['id'],
                        'username': user['username'],
                        'company_name': user['company_name'],
                        'room_id': user['company_name']
                    })
                
                # Create new user
                cursor.execute(
                    "INSERT INTO users (username, company_name) VALUES (%s, %s)",
                    (username, company_name)
                )
                conn.commit()
                user_id = cursor.lastrowid
                
                return jsonify({
                    'user_id': user_id,
                    'username': username,
                    'company_name': company_name,
                    'room_id': company_name
                }), 201
                
        except Exception as e:
            print(f"❌ Database error: {e}")
            print(traceback.format_exc())
            return jsonify({'error': f'Database error: {str(e)}'}), 500
        finally:
            conn.close()
            
    except Exception as e:
        print(f"❌ Registration error: {e}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/api/messages/<company_name>', methods=['GET'])
def get_messages(company_name):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify([]), 200
            
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    """SELECT id, sender_id, sender_username, message_text, timestamp 
                       FROM messages 
                       WHERE company_name = %s 
                       ORDER BY timestamp DESC 
                       LIMIT 100""",
                    (company_name,)
                )
                messages = cursor.fetchall()
                messages.reverse()
                
                return jsonify([{
                    'id': m['id'],
                    'sender_id': m['sender_id'],
                    'sender_username': m['sender_username'],
                    'message_text': m['message_text'],
                    'timestamp': m['timestamp'].isoformat() if m['timestamp'] else None
                } for m in messages])
        finally:
            conn.close()
    except Exception as e:
        print(f"❌ Error fetching messages: {e}")
        return jsonify([]), 200

@app.route('/api/online/<company_name>', methods=['GET'])
def get_online_users(company_name):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify([]), 200
            
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT id, username FROM users WHERE company_name = %s",
                    (company_name,)
                )
                users = cursor.fetchall()
                return jsonify([{
                    'user_id': u['id'],
                    'username': u['username']
                } for u in users])
        finally:
            conn.close()
    except Exception as e:
        print(f"❌ Error fetching users: {e}")
        return jsonify([]), 200

# Socket.IO events
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

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print(f"🚀 Server running on port {port}")
    socketio.run(app, host='0.0.0.0', port=port, debug=True)
