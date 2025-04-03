import os
import logging
import requests
from typing import Optional, Dict, Any

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Lời chào mở đầu
GREETING_MESSAGES = [
    "Xin chào! Tôi là trợ lý AI học tập. Bạn cần giúp gì không?",
    "Chào bạn! Tôi có thể giúp bạn với các bài tập và câu hỏi học tập.",
    "Xin chào! Tôi sẵn sàng hỗ trợ bạn trong việc học tập."
]

def get_ai_response(prompt: str, context: Optional[str] = None) -> str:
    """
    Get AI response using Google Gemini API.
    
    Args:
        prompt: The user's message/query
        context: Optional context like subject and mode
        
    Returns:
        AI response as string
    """
    try:
        logger.debug(f"Received prompt: {prompt}")
        if context:
            logger.debug(f"Context: {context}")
        
        # Get API key from Flask app config or environment
        from flask import current_app
        
        # Try to get API key from app config first (preferred)
        api_key = None
        try:
            api_key = current_app.config.get('GOOGLE_AI_API_KEY')
        except:
            # If Flask app context is not available, try from environment
            pass
        
        # Fall back to environment variable
        if not api_key:
            api_key = os.environ.get("GOOGLE_AI_API_KEY")
            
        if not api_key:
            logger.error("API key not found in app config or environment")
            return "Lỗi xác thực API. Vui lòng nhập API key trong trang cài đặt."
        
        # Prepare prompt with context if available
        full_prompt = prompt
        if context:
            full_prompt = f"{context}\n\n{prompt}"
        
        # Call Google Gemini API
        response = call_gemini_api(full_prompt, api_key)
        
        return response
    
    except Exception as e:
        logger.error(f"Error in get_ai_response: {str(e)}")
        return "Đã xảy ra lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau."

def get_specialized_ai_response(prompt: str, subject: str, mode: str) -> str:
    """
    Get a response from Google Gemini AI based on subject and mode.
    
    Args:
        prompt: The user's message/query
        subject: The academic subject
        mode: The mode (trợ lý or giải bài tập)
        
    Returns:
        The AI's response as a string
    """
    if mode == "giải bài tập":
        system_prompt = f"""Bạn là trợ lý AI học tập chuyên môn {subject}. 
Bạn đang hoạt động ở chế độ giải bài tập.
Hãy trả lời câu hỏi của học sinh THCS hoàn toàn bằng tiếng Việt.
Tất cả các thuật ngữ toán học và từ ngữ chuyên môn cần được dịch sang tiếng Việt.
Không sử dụng các từ tiếng Anh trừ khi thật sự cần thiết.
Phản hồi của bạn phải tuân theo định dạng sau đây:
1. Đầu tiên, hãy nêu đáp án cuối cùng một cách ngắn gọn, không quá 1-3 dòng.
2. Tiếp theo, trên một dòng riêng biệt, hãy viết dòng văn bản: "---GIẢI THÍCH---"
3. Sau đó, cung cấp phần giải thích chi tiết và quá trình giải.

Ví dụ:
"Đáp án: 42m^2

---GIẢI THÍCH---
Để tính diện tích hình chữ nhật, ta dùng công thức S = a × b
Với a = 6m và b = 7m
S = 6 × 7 = 42 (m^2)
Vậy diện tích hình chữ nhật là 42m^2."
"""
    else:
        system_prompt = f"""Bạn là trợ lý AI học tập chuyên môn {subject}. 
Bạn đang hoạt động ở chế độ trợ lý.
Hãy trả lời câu hỏi của học sinh THCS bằng tiếng Việt.
Hãy giải thích chi tiết và giúp học sinh hiểu vấn đề."""

    context = f"{system_prompt}\nMôn học: {subject}, Chế độ: {mode}"
    return get_ai_response(prompt, context)

def call_gemini_api(prompt: str, api_key: str) -> str:
    """
    Call the Google Gemini API and return the response.
    
    Args:
        prompt: The full prompt to send to the API
        api_key: The Google AI API key
        
    Returns:
        The text response from the API
    """
    # URL theo phiên bản v1 với model gemini-1.5-pro
    url = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent"
    headers = {
        "Content-Type": "application/json"
    }
    
    # Add API key as query parameter
    url = f"{url}?key={api_key}"
    
    # Thêm yêu cầu trả lời bằng tiếng Việt cho tất cả các trường hợp
    vietnamese_instruction = ("Trả lời hoàn toàn bằng tiếng Việt. "
                           "Tất cả các thuật ngữ toán học, khoa học và các giải thích phải được viết bằng tiếng Việt. "
                           "Không sử dụng tiếng Anh trong câu trả lời. "
                           "Đây là câu hỏi: ")
    
    enhanced_prompt = vietnamese_instruction + prompt
    
    # Prepare request payload theo định dạng API v1
    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": enhanced_prompt
                    }
                ]
            }
        ],
        "generation_config": {
            "temperature": 0.7,
            "top_k": 40,
            "top_p": 0.95,
            "max_output_tokens": 800
        }
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()  # Raise exception for HTTP errors
        
        data = response.json()
        
        # Extract text from response
        if "candidates" in data and len(data["candidates"]) > 0:
            content = data["candidates"][0]["content"]
            if "parts" in content and len(content["parts"]) > 0:
                return content["parts"][0]["text"]
        
        # If we can't extract text properly, return error
        logger.error(f"Unexpected API response format: {data}")
        return "Lỗi khi xử lý phản hồi từ API. Vui lòng thử lại sau."
    
    except requests.exceptions.RequestException as e:
        logger.error(f"API request failed: {str(e)}")
        return "Không thể kết nối với Google AI API. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau."
