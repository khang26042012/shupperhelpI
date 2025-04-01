import os
import logging
from flask import Flask, render_template, request, jsonify, session
from utils.huggingface_api import get_ai_response

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "default_secret_key")

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

@app.route('/')
def index():
    """Render the main page of the application."""
    # Initialize chat history if not present
    if 'chat_history' not in session:
        session['chat_history'] = []
    
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
        
        response_text = ""
        # In problem-solving mode, construct a specific prompt
        if mode == "giải bài tập":
            prompt = f"Hãy giải bài tập môn {subject} sau đây mà không đưa ra giải thích nào: {user_message}"
            response_text = get_ai_response(prompt, context)
        else:
            # In assistant mode, just send the message to the AI
            prompt = f"Trả lời bằng tiếng Việt về câu hỏi liên quan đến môn {subject}: {user_message}"
            response_text = get_ai_response(prompt, context)
        
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
