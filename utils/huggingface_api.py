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
        
        # Get API key from environment
        api_key = os.environ.get("GOOGLE_AI_API_KEY")
        if not api_key:
            logger.error("API key not found in environment")
            return "Lỗi xác thực API. Vui lòng liên hệ quản trị viên."
        
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
    system_prompt = f"""Bạn là trợ lý AI học tập chuyên môn {subject}. 
Bạn đang hoạt động ở chế độ {mode}.
Hãy trả lời câu hỏi của học sinh THCS bằng tiếng Việt.
Nếu là chế độ giải bài tập, hãy tập trung vào cung cấp câu trả lời ngắn gọn.
Nếu là chế độ trợ lý, hãy giải thích chi tiết và giúp học sinh hiểu vấn đề."""

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
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
    headers = {
        "Content-Type": "application/json"
    }
    
    # Add API key as query parameter
    url = f"{url}?key={api_key}"
    
    # Prepare request payload
    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.7,
            "topK": 40,
            "topP": 0.95,
            "maxOutputTokens": 800
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
