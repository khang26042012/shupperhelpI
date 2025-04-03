import os
import logging
import requests
import base64
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

def get_ai_response(prompt: str, context: Optional[str] = None, image_url: Optional[str] = None) -> str:
    """
    Get AI response using Google Gemini API.
    
    Args:
        prompt: The user's message/query
        context: Optional context like subject and mode
        image_url: Optional URL to an image to include in the prompt
        
    Returns:
        AI response as string
    """
    try:
        logger.debug(f"Received prompt: {prompt}")
        if context:
            logger.debug(f"Context: {context}")
        if image_url:
            logger.debug(f"Image URL: {image_url}")
        
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
        response = call_gemini_api(full_prompt, api_key, image_url)
        
        return response
    
    except Exception as e:
        logger.error(f"Error in get_ai_response: {str(e)}")
        return "Đã xảy ra lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau."

def get_specialized_ai_response(prompt: str, subject: str, mode: str, solution_mode: str = "full", image_url: Optional[str] = None) -> str:
    """
    Get a response from Google Gemini AI based on subject and mode.
    
    Args:
        prompt: The user's message/query
        subject: The academic subject
        mode: The mode (trợ lý or giải bài tập)
        solution_mode: The solution mode (full, step_by_step, or hint)
        image_url: Optional URL to an image to include in the prompt
        
    Returns:
        The AI's response as a string
    """
    if mode == "giải bài tập":
        if solution_mode == "step_by_step":
            system_prompt = f"""Bạn là trợ lý AI học tập chuyên môn {subject}. 
Bạn đang hoạt động ở chế độ giải bài tập CHI TIẾT.
Hãy trả lời câu hỏi của học sinh THCS hoàn toàn bằng tiếng Việt.
Tất cả các thuật ngữ toán học và từ ngữ chuyên môn cần được dịch sang tiếng Việt.
Không sử dụng các từ tiếng Anh trừ khi thật sự cần thiết.

Nhiệm vụ của bạn là giải quyết bài toán TỪNG BƯỚC MỘT cách chi tiết nhất, giải thích mỗi bước thực hiện.
Đặc biệt chú ý:
1. Chia quá trình giải thành các bước rõ ràng, đánh số từng bước.
2. Ở mỗi bước, giải thích lý do tại sao thực hiện bước đó.
3. Đưa ra công thức cụ thể và cách áp dụng công thức.
4. Với các bài toán khó, hãy đưa ra hình vẽ hoặc phân tích chi tiết bằng từ ngữ.

Phản hồi của bạn phải tuân theo định dạng sau đây:
1. Đầu tiên, hãy nêu đáp án cuối cùng một cách ngắn gọn, không quá 1-3 dòng.
2. Tiếp theo, trên một dòng riêng biệt, hãy viết dòng văn bản: "---GIẢI THÍCH TỪNG BƯỚC---"
3. Sau đó, cung cấp phần giải thích chi tiết và quá trình giải theo từng bước.

Ví dụ:
"Đáp án: 42m^2

---GIẢI THÍCH TỪNG BƯỚC---
Bước 1: Xác định công thức tính diện tích hình chữ nhật
- Công thức: S = a × b (với a, b là chiều dài và chiều rộng)
- Lý do sử dụng: Đề bài cho biết hình là hình chữ nhật

Bước 2: Xác định các giá trị đã biết
- Chiều dài a = 6m 
- Chiều rộng b = 7m

Bước 3: Áp dụng công thức tính diện tích
- S = a × b = 6m × 7m = 42m²

Bước 4: Kiểm tra kết quả
- Kết quả hợp lý vì diện tích luôn dương
- Đơn vị đo đã đúng là m²

Vậy diện tích hình chữ nhật là 42m²."
"""
        elif solution_mode == "hint":
            system_prompt = f"""Bạn là trợ lý AI học tập chuyên môn {subject}. 
Bạn đang hoạt động ở chế độ GỢI Ý giải bài tập.
Hãy trả lời câu hỏi của học sinh THCS hoàn toàn bằng tiếng Việt.
Tất cả các thuật ngữ toán học và từ ngữ chuyên môn cần được dịch sang tiếng Việt.
Không sử dụng các từ tiếng Anh trừ khi thật sự cần thiết.

Nhiệm vụ của bạn là chỉ đưa ra GỢI Ý giúp học sinh TỰ GIẢI, không đưa ra đáp án trực tiếp.
Đặc biệt chú ý:
1. Chỉ đưa ra gợi ý về hướng tiếp cận, KHÔNG giải toàn bộ bài toán.
2. Gợi ý nên bao gồm công thức cần áp dụng, các bước cần thực hiện.
3. Nên đặt câu hỏi gợi mở để học sinh tự suy nghĩ.
4. KHÔNG đưa ra đáp án cuối cùng.

Phản hồi của bạn phải tuân theo định dạng sau đây:
1. Đầu tiên, xác định loại bài toán và kiến thức liên quan.
2. Tiếp theo, đưa ra hướng tiếp cận và các gợi ý theo thứ tự từ cơ bản đến nâng cao.
3. Kết thúc bằng câu khuyến khích học sinh tự giải.

Ví dụ:
"Đây là bài toán về diện tích hình chữ nhật. Để giải bài này, em cần:

Gợi ý 1: Nhớ lại công thức tính diện tích hình chữ nhật là gì?
Gợi ý 2: Đề bài đã cho biết chiều dài và chiều rộng, hãy xác định chúng.
Gợi ý 3: Thay các giá trị vào công thức và tính toán kết quả.
Gợi ý 4: Đừng quên đơn vị đo diện tích là gì?

Hãy thử giải bài toán với các gợi ý trên và kiểm tra lại kết quả của mình."
"""
        else:  # full solution mode (default)
            system_prompt = f"""Bạn là trợ lý AI học tập chuyên môn {subject}. 
Bạn đang hoạt động ở chế độ giải bài tập.
Hãy trả lời câu hỏi của học sinh THCS hoàn toàn bằng tiếng Việt.
Tất cả các thuật ngữ toán học và từ ngữ chuyên môn cần được dịch sang tiếng Việt.
Không sử dụng các từ tiếng Anh trừ khi thật sự cần thiết.

Hỗ trợ đa dạng loại bài tập:
- Phương trình, bất phương trình
- Hệ phương trình, tích phân, đạo hàm
- Bài toán hình học, đại số, giải tích
- Vật lý, hóa học, sinh học và các môn khác

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
    return get_ai_response(prompt, context, image_url)

def call_gemini_api(prompt: str, api_key: str, image_url: Optional[str] = None) -> str:
    """
    Call the Google Gemini API and return the response.
    
    Args:
        prompt: The full prompt to send to the API
        api_key: The Google AI API key
        image_url: Optional URL to an image to include in the prompt
        
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
                           "Phân tích và giải bài toán hoặc trả lời câu hỏi sau: ")
    
    enhanced_prompt = vietnamese_instruction + prompt
    
    # Prepare request payload theo định dạng API v1
    contents = []
    
    # Nếu có ảnh, xác định kiểu yêu cầu multimodal
    if image_url and image_url.startswith(('http://', 'https://')):
        logger.debug(f"Including image URL in request: {image_url}")
        
        try:
            # Tải ảnh từ URL
            image_response = requests.get(image_url)
            image_response.raise_for_status()
            
            # Mã hóa ảnh thành base64
            image_base64 = base64.b64encode(image_response.content).decode('utf-8')
            
            # Thêm ảnh vào request
            contents.append({
                "parts": [
                    {
                        "text": enhanced_prompt
                    },
                    {
                        "inline_data": {
                            "mime_type": "image/jpeg",
                            "data": image_base64
                        }
                    }
                ]
            })
            logger.debug("Image successfully encoded and added to request")
        except Exception as e:
            logger.error(f"Error processing image from URL: {str(e)}")
            # Nếu có lỗi với ảnh, trở lại text-only request
            contents.append({
                "parts": [
                    {
                        "text": enhanced_prompt + " (Lưu ý: Không thể xử lý ảnh do lỗi kỹ thuật)"
                    }
                ]
            })
    else:
        # Nếu không có ảnh, sử dụng text-only request
        contents.append({
            "parts": [
                {
                    "text": enhanced_prompt
                }
            ]
        })
    
    payload = {
        "contents": contents,
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
