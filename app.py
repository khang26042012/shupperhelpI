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
app.secret_key = os.environ.get("SESSION_SECRET", "default_secret_key")
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload size
app.config['UPLOAD_FOLDER'] = os.path.join('static', 'uploads')
app.config['GOOGLE_AI_API_KEY'] = os.environ.get("GOOGLE_AI_API_KEY", "")

# Create upload folder if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# List of supported subjects
SUBJECTS = [
    "Toán học", 
    "Ngữ văn", 
    "Tiếng Anh", 
    "Vật lý", 
    "Hóa học", 
    "Sinh học", 
    "Lịch sử", 
    "Địa lý", 
    "Công nghệ", 
    "Giáo dục công dân", 
    "Tin học"
]

# Allowed file extensions for image upload
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
    
    return render_template('index.html', subjects=SUBJECTS)

@app.route('/send_message', methods=['POST'])
def send_message():
    """Process a message sent by the user and return AI response."""
    try:
        data = request.json
        user_message = data.get('message', '')
        subject = data.get('subject', 'Tổng hợp')
        mode = data.get('mode', 'trợ lý')
        
        # Log incoming request
        logger.debug(f"Received message request - Subject: {subject}, Mode: {mode}")
        
        if not user_message:
            return jsonify({"error": "Tin nhắn không được để trống"}), 400
        
        # Get AI response based on the subject and mode
        context = f"Môn học: {subject}, Chế độ: {mode}"
        
        # Sử dụng API specialized cho Google Gemini
        response_text = get_specialized_ai_response(user_message, subject, mode)
        
        # Save to history
        if 'chat_history' not in session:
            session['chat_history'] = []
        
        session['chat_history'].append({
            'user': user_message,
            'bot': response_text,
            'subject': subject,
            'mode': mode
        })
        
        session.modified = True
        
        return jsonify({
            "response": response_text,
            "subject": subject,
            "mode": mode
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
    """Process an uploaded image and return AI analysis."""
    try:
        # Check if image exists in request
        if 'image' not in request.files and 'image_data' not in request.form:
            return jsonify({"error": "Không tìm thấy file ảnh"}), 400
        
        subject = request.form.get('subject', 'Toán học')
        
        # Tạo thư mục upload nếu chưa tồn tại
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        
        # Process camera image
        if 'image_data' in request.form:
            try:
                # Get base64 image data
                image_data = request.form['image_data']
                if image_data.startswith('data:image'):
                    # Remove the data URL prefix
                    try:
                        image_data = image_data.split(',')[1]
                    except IndexError:
                        logger.error(f"Invalid image data format: {image_data[:30]}...")
                        return jsonify({"error": "Định dạng dữ liệu hình ảnh không hợp lệ"}), 400
                
                try:
                    # Decode base64 image
                    image_bytes = base64.b64decode(image_data)
                    image = Image.open(io.BytesIO(image_bytes))
                except Exception as decode_error:
                    logger.error(f"Error decoding image data: {str(decode_error)}")
                    return jsonify({"error": "Không thể giải mã dữ liệu hình ảnh"}), 400
                
                # Generate unique filename
                filename = f"camera_{subject}_{os.urandom(8).hex()}.jpg"
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                
                # Save the image
                image.save(filepath)
                logger.debug(f"Camera image saved to {filepath}")
            except Exception as e:
                logger.error(f"Error processing camera image: {str(e)}")
                return jsonify({"error": f"Lỗi khi xử lý ảnh từ camera: {str(e)}"}), 500
        else:
            try:
                # Process uploaded file
                file = request.files['image']
                if file.filename == '':
                    return jsonify({"error": "Không có file nào được chọn"}), 400
                    
                if not allowed_file(file.filename):
                    return jsonify({"error": "Loại file không được hỗ trợ"}), 400
                    
                # Generate unique filename
                filename = f"upload_{subject}_{os.urandom(8).hex()}.{file.filename.rsplit('.', 1)[1].lower()}"
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                
                # Save the file
                file.save(filepath)
                logger.debug(f"Uploaded file saved to {filepath}")
            except Exception as e:
                logger.error(f"Error processing uploaded file: {str(e)}")
                return jsonify({"error": f"Lỗi khi xử lý file tải lên: {str(e)}"}), 500
        
        # Get image URL
        image_url = url_for('static', filename=f'uploads/{filename}')
        
        # Analyze the image with AI - sử dụng API Gemini
        prompt = f"Đây là bài tập môn {subject} trong hình ảnh. Hãy giải bài tập trong ảnh này. Trả lời bằng tiếng Việt."
        
        # Sử dụng specialized API với chế độ giải bài tập
        response_text = get_specialized_ai_response(prompt, subject, "giải bài tập")
        
        # Store in history
        if 'chat_history' not in session:
            session['chat_history'] = []
        
        session['chat_history'].append({
            'user': f"[Hình ảnh bài tập môn {subject}]",
            'user_image': image_url,
            'bot': response_text,
            'subject': subject,
            'mode': 'giải bài tập'
        })
        
        session.modified = True
        
        return jsonify({
            "response": response_text,
            "subject": subject,
            "mode": "giải bài tập",
            "image_url": image_url
        })
    
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        return jsonify({"error": f"Đã xảy ra lỗi khi xử lý ảnh: {str(e)}"}), 500

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
