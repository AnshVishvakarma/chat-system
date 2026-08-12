from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room
import pymysql
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# ===== APP INITIALIZATION =====
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
CORS(app, origins='*')
socketio = SocketIO(app, cors_allowed_origins='*', async_mode='threading')

# ===== DATABASE CONNECTION =====
def get_db_connection():
    """Create database connection"""
    return pymysql.connect(
        host=os.getenv('DB_HOST', '127.0.0.1'),
        user=os.getenv('DB_USER', 'dev_user'),
        password=os.getenv('DB_PASSWORD', 'password123'),
        database=os.getenv('DB_NAME', 'company_chat'),
        port=int(os.getenv('DB_PORT', 3306)),
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False
    )

# ===== ONLINE USERS TRACKING =====
online_users = {}

# ===== CREATE DATABASE AND TABLES =====
def init_database():
    """Create database and tables if not exists"""
    try:
        # First connect without database to create it
        connection = pymysql.connect(
            host=os.getenv('DB_HOST', '127.0.0.1'),
            user=os.getenv('DB_USER', 'dev_user'),
            password=os.getenv('DB_PASSWORD', 'password123'),
            port=int(os.getenv('DB_PORT', 3306)),
            cursorclass=pymysql.cursors.DictCursor
        )
        
        with connection.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {os.getenv('DB_NAME', 'company_chat')}")
            connection.commit()
            print(f"✅ Database '{os.getenv('DB_NAME', 'company_chat')}' created/verified")
        
        connection.close()
        
        # Now connect to the database and create tables
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # Create users table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    username VARCHAR(100) UNIQUE NOT NULL,
                    company_name VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_company (company_name)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """)
            
            # Create messages table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    company_name VARCHAR(255) NOT NULL,
                    sender_id INT NOT NULL,
                    sender_username VARCHAR(100) NOT NULL,
                    message_text TEXT NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_company_time (company_name, timestamp),
                    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """)
            
            conn.commit()
            print("✅ Database tables created successfully!")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Database initialization error: {e}")
        print("Please check your MySQL credentials and ensure MySQL is running.")

# Initialize database on startup
init_database()

# ===== HELPER FUNCTIONS =====
def execute_query(query, params=None, fetch_one=False, fetch_all=False):
    """Execute query with connection handling"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(query, params or ())
            if fetch_one:
                result = cursor.fetchone()
            elif fetch_all:
                result = cursor.fetchall()
            else:
                result = None
            conn.commit()
            return result
    except Exception as e:
        print(f"Database error: {e}")
        raise e
    finally:
        conn.close()

def get_last_insert_id():
    """Get last inserted ID"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT LAST_INSERT_ID() as id")
            result = cursor.fetchone()
            return result['id'] if result else None
    except Exception as e:
        print(f"Error getting last insert ID: {e}")
        return None
    finally:
        conn.close()

# ===== REST APIs =====
@app.route('/api/register', methods=['POST'])
def register():
    """Register a new user or get existing user"""
    data = request.json
    username = data.get('username', '').strip()
    company_name = data.get('company_name', '').strip()
    
    if not username or not company_name:
        return jsonify({'error': 'Username and company name required'}), 400
    
    try:
        # Check if user exists
        user = execute_query(
            "SELECT id, username, company_name FROM users WHERE username = %s",
            (username,),
            fetch_one=True
        )
        
        if user:
            return jsonify({
                'user_id': user['id'],
                'username': user['username'],
                'company_name': user['company_name'],
                'room_id': user['company_name']
            })
        
        # Create new user
        execute_query(
            "INSERT INTO users (username, company_name) VALUES (%s, %s)",
            (username, company_name)
        )
        user_id = get_last_insert_id()
        
        return jsonify({
            'user_id': user_id,
            'username': username,
            'company_name': company_name,
            'room_id': company_name
        }), 201
        
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return jsonify({'error': 'Registration failed'}), 500

@app.route('/api/messages/<company_name>', methods=['GET'])
def get_messages(company_name):
    """Get last 100 messages for a company"""
    try:
        messages = execute_query(
            """SELECT id, sender_id, sender_username, message_text, timestamp 
               FROM messages 
               WHERE company_name = %s 
               ORDER BY timestamp DESC 
               LIMIT 100""",
            (company_name,),
            fetch_all=True
        )
        
        # Reverse to show oldest first
        messages.reverse()
        
        return jsonify([{
            'id': m['id'],
            'sender_id': m['sender_id'],
            'sender_username': m['sender_username'],
            'message_text': m['message_text'],
            'timestamp': m['timestamp'].isoformat() if m['timestamp'] else None
        } for m in messages])
        
    except Exception as e:
        print(f"❌ Error fetching messages: {e}")
        return jsonify([]), 200

@app.route('/api/online/<company_name>', methods=['GET'])
def get_online_users(company_name):
    """Get all users in a company"""
    try:
        users = execute_query(
            "SELECT id, username FROM users WHERE company_name = %s",
            (company_name,),
            fetch_all=True
        )
        
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
    """Handle user disconnection"""
    sid = request.sid
    if sid in online_users:
        user_id = online_users[sid]
        company = online_users.get(f'{user_id}_company')
        if company:
            emit('user_left', {'user_id': user_id}, room=company)
            print(f'👋 User {user_id} left {company}')
        del online_users[sid]
        if f'{user_id}_company' in online_users:
            del online_users[f'{user_id}_company']
    print('❌ Client disconnected')

@socketio.on('join_room')
def handle_join_room(data):
    """Join a company room"""
    user_id = data.get('user_id')
    username = data.get('username')
    company_name = data.get('company_name')
    
    sid = request.sid
    
    # Store user info
    online_users[sid] = user_id
    online_users[f'{user_id}_company'] = company_name
    
    # Join room
    join_room(company_name)
    
    # Notify others
    emit('user_joined', {
        'user_id': user_id,
        'username': username
    }, room=company_name)
    
    print(f'👤 User {username} joined {company_name}')

@socketio.on('send_message')
def handle_send_message(data):
    """Send and save a message"""
    company_name = data.get('company_name')
    sender_id = data.get('sender_id')
    username = data.get('username')
    text = data.get('text', '').strip()
    
    if not all([company_name, sender_id, username, text]):
        emit('error', {'message': 'Missing required fields'})
        return
    
    try:
        # Save message to database
        execute_query(
            """INSERT INTO messages (company_name, sender_id, sender_username, message_text) 
               VALUES (%s, %s, %s, %s)""",
            (company_name, sender_id, username, text)
        )
        message_id = get_last_insert_id()
        
        # Get timestamp
        result = execute_query(
            "SELECT timestamp FROM messages WHERE id = %s",
            (message_id,),
            fetch_one=True
        )
        timestamp = result['timestamp'].isoformat() if result else datetime.now().isoformat()
        
        # Broadcast to room
        emit('receive_message', {
            'id': message_id,
            'sender_id': sender_id,
            'sender_username': username,
            'message_text': text,
            'timestamp': timestamp
        }, room=company_name)
        
        print(f'💬 Message from {username} in {company_name}: {text[:50]}...')
        
    except Exception as e:
        print(f"❌ Error saving message: {e}")
        emit('error', {'message': 'Failed to send message'})

# ===== RUN SERVER =====
if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print("\n" + "="*50)
    print(f"🚀 Server running on http://localhost:{port}")
    print(f"📊 Database: {os.getenv('DB_NAME', 'company_chat')}")
    print("="*50 + "\n")
    socketio.run(app, host='0.0.0.0', port=port, debug=True)