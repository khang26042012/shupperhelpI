import os
import logging
import base64
import io
from flask import Flask, render_template, request, jsonify, session, url_for, redirect
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
from utils.huggingface_api import get_ai_response, get_specialized_ai_response
from PIL import Image

# Set environment variables directly in code

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
# Đặt secret key trực tiếp để đảm bảo hoạt động
app.secret_key = "your_secure_secret_key_for_sessions_123456789"
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload size
app.config['UPLOAD_FOLDER'] = os.path.join('static', 'uploads')
app.config['GOOGLE_AI_API_KEY'] = os.environ.get("GOOGLE_AI_API_KEY", "")

# Create upload folder if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Không cần danh sách môn học nữa do đã loại bỏ tính năng này

# Định nghĩa định dạng file được phép (vẫn cần cho phương thức allowed_file)
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

@app.route('/api_key', methods=['GET', 'POST'])
def set_api_key():
    """Set Google AI API key."""
    error = None
    success = None
    
    if request.method == 'POST':
        api_key = request.form.get('api_key')
        if api_key:
            # Update application configuration
            app.config['GOOGLE_AI_API_KEY'] = api_key
            # Store in session for persistence
            session['google_ai_api_key'] = api_key
            success = "API key đã được lưu thành công!"
        else:
            error = "API key không được để trống!"
    
    return render_template('api_key_form.html', error=error, success=success)

@app.route('/')
def index():
    """Render the main page of the application."""
    # Initialize chat history if not present
    if 'chat_history' not in session:
        session['chat_history'] = []
    
    # Check if API key is set, if not redirect to set API key page
    if not app.config['GOOGLE_AI_API_KEY'] and 'google_ai_api_key' not in session:
        return redirect(url_for('set_api_key'))
    
    # Use session API key if available
    if 'google_ai_api_key' in session:
        app.config['GOOGLE_AI_API_KEY'] = session['google_ai_api_key']
    
    return render_template('index.html')

@app.route('/send_message', methods=['POST'])
def send_message():
    """Process a message sent by the user and return AI response."""
    try:
        data = request.json
        user_message = data.get('message', '')
        
        # Log incoming request
        logger.debug(f"Received message request: {user_message[:50]}...")
        
        if not user_message:
            return jsonify({"error": "Tin nhắn không được để trống"}), 400
        
        # Sử dụng API Gemini để lấy phản hồi
        response_text = get_ai_response(user_message)
        
        # Save to history
        if 'chat_history' not in session:
            session['chat_history'] = []
        
        session['chat_history'].append({
            'user': user_message,
            'bot': response_text
        })
        
        session.modified = True
        
        return jsonify({
            "response": response_text
        })
    
    except Exception as e:
        logger.error(f"Error processing message: {str(e)}")
        return jsonify({"error": f"Đã xảy ra lỗi: {str(e)}"}), 500

def allowed_file(filename):
    """Check if file has an allowed extension."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload_image', methods=['POST'])
def upload_image():
    """Lỗi: Tính năng tải ảnh đã bị loại bỏ."""
    return jsonify({"error": "Chức năng tải ảnh lên đã bị loại bỏ do gặp lỗi"}), 400

@app.route('/clear_history', methods=['POST'])
def clear_history():
    """Clear the chat history."""
    try:
        session.pop('chat_history', None)
        return jsonify({"status": "success", "message": "Lịch sử đã được xóa"})
    except Exception as e:
        logger.error(f"Error clearing history: {str(e)}")
        return jsonify({"error": f"Đã xảy ra lỗi khi xóa lịch sử: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
