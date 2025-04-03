import os
import logging
import base64
import io
import cv2
import numpy as np
import pytesseract
from PIL import Image
from flask import Flask, render_template, request, jsonify, session, url_for, redirect
from dotenv import load_dotenv
from werkzeug.utils import secure_filename

# Load environment variables from .env file
load_dotenv()
from utils.huggingface_api import get_ai_response, get_specialized_ai_response

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
# Đặt API key trực tiếp để đảm bảo hoạt động
app.config['GOOGLE_AI_API_KEY'] = "AIzaSyBN0yBx3BRSJeuHxglNqbG4qfBor9grnKk"

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
        solution_mode = data.get('solution_mode', 'full')  # full, step_by_step, or hint
        subject = data.get('subject', 'toán học')  # Mặc định là "toán học"
        mode = data.get('mode', 'giải bài tập')  # Mặc định là "giải bài tập"
        
        # Log incoming request
        logger.debug(f"Received message request: {user_message[:50]}...")
        logger.debug(f"Solution mode: {solution_mode}, Subject: {subject}, Mode: {mode}")
        
        if not user_message:
            return jsonify({"error": "Tin nhắn không được để trống"}), 400
        
        # Sử dụng API Gemini để lấy phản hồi với chế độ giải bài phù hợp
        if mode == "giải bài tập":
            response_text = get_specialized_ai_response(user_message, subject, mode, solution_mode)
        else:
            response_text = get_ai_response(user_message)
        
        # Save to history
        if 'chat_history' not in session:
            session['chat_history'] = []
        
        session['chat_history'].append({
            'user': user_message,
            'bot': response_text,
            'solution_mode': solution_mode,
            'subject': subject,
            'mode': mode
        })
        
        session.modified = True
        
        return jsonify({
            "response": response_text,
            "solution_mode": solution_mode
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
    """Tính năng tải ảnh và trích xuất chữ viết tay."""
    try:
        if 'image' not in request.files:
            return jsonify({"error": "Không tìm thấy hình ảnh nào"}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({"error": "Không có tên tệp"}), 400
        
        if file and allowed_file(file.filename):
            # Lưu tệp tạm thời
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            # Xử lý ảnh
            # Đọc ảnh bằng OpenCV
            image = cv2.imread(filepath)
            
            # Chuyển đổi ảnh sang độ xám
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Tiền xử lý ảnh để cải thiện chất lượng nhận dạng
            # Áp dụng GaussianBlur để giảm nhiễu
            blur = cv2.GaussianBlur(gray, (5, 5), 0)
            
            # Áp dụng phân ngưỡng để tạo ảnh nhị phân
            _, binary = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
            
            # Sử dụng pytesseract để nhận dạng chữ
            # Đặt config để nhận dạng cả chữ Việt và chữ số
            custom_config = r'--oem 3 --psm 6'
            
            try:
                # Thử nhận dạng với pytesseract
                extracted_text = pytesseract.image_to_string(binary, config=custom_config, lang='vie+eng')
            except Exception as e:
                logger.error(f"Lỗi khi nhận dạng văn bản: {str(e)}")
                # Thử nhận dạng không có lang nếu gặp lỗi
                extracted_text = pytesseract.image_to_string(binary, config=custom_config)
            
            # Tiền xử lý văn bản đã trích xuất
            extracted_text = extracted_text.strip()
            
            # Lưu ảnh đã xử lý để debug
            processed_filename = f"processed_{filename}"
            processed_filepath = os.path.join(app.config['UPLOAD_FOLDER'], processed_filename)
            cv2.imwrite(processed_filepath, binary)
            
            # Mã hóa ảnh đã xử lý để gửi về client
            _, buffer = cv2.imencode('.jpg', binary)
            processed_image_b64 = base64.b64encode(buffer).decode('utf-8')
            
            # Trả về kết quả
            return jsonify({
                "status": "success",
                "extracted_text": extracted_text,
                "original_image": url_for('static', filename=f'uploads/{filename}'),
                "processed_image": url_for('static', filename=f'uploads/{processed_filename}'),
                "processed_image_b64": processed_image_b64
            }), 200
        else:
            return jsonify({"error": "Định dạng tệp không được hỗ trợ"}), 400
    
    except Exception as e:
        logger.error(f"Lỗi khi xử lý ảnh: {str(e)}")
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
