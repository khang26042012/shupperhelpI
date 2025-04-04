import os
import logging
import requests
import base64
from typing import Optional, Dict, Any

# Set up logging - tăng mức log để dễ debug
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
        
        # Get API key with additional debug info
        api_key = None
        app_key = None
        env_key = None
        
        # Ưu tiên lấy từ environment variable trước
        env_key = os.environ.get("GOOGLE_AI_API_KEY")
        if env_key:
            logger.debug(f"API key found in environment (length: {len(env_key)})")
            # Lấy vài ký tự đầu và cuối để debug
            masked_env_key = f"{env_key[:4]}...{env_key[-4:]}" if len(env_key) > 8 else "***"
            logger.debug(f"Environment API key (masked): {masked_env_key}")
            api_key = env_key  # Luôn dùng env_key nếu có
        
        # Chỉ khi không có từ environment variable, mới lấy từ app config
        if not api_key:
            try:
                app_key = current_app.config.get('GOOGLE_AI_API_KEY')
                if app_key:
                    logger.debug(f"API key found in app config (length: {len(app_key)})")
                    # Lấy vài ký tự đầu và cuối để debug
                    masked_app_key = f"{app_key[:4]}...{app_key[-4:]}" if len(app_key) > 8 else "***"
                    logger.debug(f"App config API key (masked): {masked_app_key}")
                    api_key = app_key
            except Exception as e:
                logger.debug(f"Error getting API key from app config: {e}")
                # If Flask app context is not available, pass
                pass
        
        # Final check
        if not api_key:
            logger.error("API key not found in app config or environment")
            return "Không thể kết nối với Google AI API. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau. Nếu lỗi vẫn tiếp tục, hãy nhập lại API key trong trang cài đặt bằng cách truy cập /api_key"
        
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
    # Xử lý mọi loại câu hỏi
    general_instruction = """Bạn là trợ lý AI học tập thông minh, có thể trả lời mọi câu hỏi từ học sinh.
Hãy trả lời hoàn toàn bằng tiếng Việt, sử dụng ngôn ngữ dễ hiểu và phù hợp.
Với các câu hỏi mở như văn học, lịch sử, hoặc các chủ đề xã hội, hãy đưa ra câu trả lời đầy đủ, khách quan và có tính giáo dục.
Với câu hỏi yêu cầu viết văn, hãy cung cấp bài văn hoàn chỉnh theo yêu cầu, tuân thủ cấu trúc bài văn và phong cách văn học phù hợp."""
    
    if mode == "giải bài tập":
        if solution_mode == "step_by_step":
            system_prompt = f"""Bạn là trợ lý AI học tập thông minh, hỗ trợ mọi môn học và chủ đề. 
Bạn đang hoạt động ở chế độ giải bài tập CHI TIẾT.
Hãy trả lời câu hỏi của học sinh THCS hoàn toàn bằng tiếng Việt.
Tất cả các thuật ngữ chuyên môn cần được dịch sang tiếng Việt.
Không sử dụng các từ tiếng Anh trừ khi thật sự cần thiết.

Nhiệm vụ của bạn là giải quyết bài tập TỪNG BƯỚC MỘT cách chi tiết nhất, giải thích mỗi bước thực hiện.
Đặc biệt chú ý:
1. Chia quá trình giải thành các bước rõ ràng, đánh số từng bước.
2. Ở mỗi bước, giải thích lý do tại sao thực hiện bước đó.
3. Đưa ra công thức cụ thể và cách áp dụng (nếu có).
4. Với các bài tập khó, hãy đưa ra phân tích chi tiết bằng từ ngữ.

{general_instruction}

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
            system_prompt = f"""Bạn là trợ lý AI học tập thông minh, hỗ trợ mọi môn học và chủ đề. 
Bạn đang hoạt động ở chế độ GỢI Ý giải bài tập.
Hãy trả lời câu hỏi của học sinh THCS hoàn toàn bằng tiếng Việt.
Tất cả các thuật ngữ chuyên môn cần được dịch sang tiếng Việt.
Không sử dụng các từ tiếng Anh trừ khi thật sự cần thiết.

Nhiệm vụ của bạn là chỉ đưa ra GỢI Ý giúp học sinh TỰ GIẢI, không đưa ra đáp án trực tiếp.
Đặc biệt chú ý:
1. Chỉ đưa ra gợi ý về hướng tiếp cận, KHÔNG giải toàn bộ bài tập.
2. Gợi ý nên bao gồm các kiến thức cần áp dụng, các bước cần thực hiện.
3. Nên đặt câu hỏi gợi mở để học sinh tự suy nghĩ.
4. KHÔNG đưa ra đáp án cuối cùng.

{general_instruction}

Phản hồi của bạn phải tuân theo định dạng sau đây:
1. Đầu tiên, xác định loại bài tập và kiến thức liên quan.
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
            system_prompt = f"""Bạn là trợ lý AI học tập thông minh, hỗ trợ mọi môn học và chủ đề. 
Bạn đang hoạt động ở chế độ giải bài tập.
Hãy trả lời câu hỏi của học sinh THCS hoàn toàn bằng tiếng Việt.
Tất cả các thuật ngữ chuyên môn cần được dịch sang tiếng Việt.
Không sử dụng các từ tiếng Anh trừ khi thật sự cần thiết.

Hỗ trợ đa dạng loại bài tập từ tất cả các môn học:
- Toán học: đại số, hình học, giải tích, xác suất thống kê
- Ngữ văn: phân tích văn bản, viết bài văn, tìm hiểu tác phẩm
- Vật lý, hóa học, sinh học và các môn khoa học tự nhiên
- Lịch sử, địa lý và các môn khoa học xã hội
- Tiếng Anh và các môn ngoại ngữ khác
- Các câu hỏi tổng quát, kiến thức đời sống

{general_instruction}

Phản hồi của bạn phải tuân theo định dạng sau đây:
1. Đầu tiên, hãy nêu đáp án cuối cùng một cách ngắn gọn, không quá 1-3 dòng.
2. Tiếp theo, trên một dòng riêng biệt, hãy viết dòng văn bản: "---GIẢI THÍCH---"
3. Sau đó, cung cấp phần giải thích chi tiết và quá trình giải.

Ví dụ cho bài toán:
"Đáp án: 42m^2

---GIẢI THÍCH---
Để tính diện tích hình chữ nhật, ta dùng công thức S = a × b
Với a = 6m và b = 7m
S = 6 × 7 = 42 (m^2)
Vậy diện tích hình chữ nhật là 42m^2."

Ví dụ cho bài văn:
"Bài văn: Cảm nhận về bài thơ "Đất Nước" của Nguyễn Khoa Điềm

---GIẢI THÍCH---
Bài thơ "Đất Nước" được trích từ chương V của trường ca "Mặt đường khát vọng" của Nguyễn Khoa Điềm, viết năm 1971. Bài thơ thể hiện tình yêu đất nước sâu sắc thông qua góc nhìn dân gian, đời thường...
[Nội dung bài văn đầy đủ]"
"""
    else:
        system_prompt = f"""Bạn là trợ lý AI học tập thông minh, hỗ trợ mọi môn học và chủ đề.
Bạn đang hoạt động ở chế độ trợ lý.
Hãy trả lời câu hỏi của học sinh THCS bằng tiếng Việt.
Hãy giải thích chi tiết và giúp học sinh hiểu vấn đề.

{general_instruction}

Khi học sinh đặt câu hỏi:
- Về bất kỳ môn học nào, hãy cung cấp thông tin chính xác và đầy đủ
- Về viết văn, hãy cung cấp các bài văn mẫu hoặc hướng dẫn viết
- Về các vấn đề xã hội, hãy đưa ra góc nhìn đa chiều, khách quan
- Về các lĩnh vực hướng nghiệp, hãy cung cấp thông tin hữu ích

Không giới hạn loại câu hỏi, có thể trả lời mọi thắc mắc miễn là phù hợp với lứa tuổi học sinh."""

    context = f"{system_prompt}\nChế độ: {mode}"
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
    # Xác minh API key
    if not api_key:
        logger.error("API key is empty or None")
        return "Không thể kết nối với Google AI API. API key không được cung cấp."
    
    # Ghi log API key (chỉ vài ký tự đầu và cuối để bảo mật)
    key_len = len(api_key)
    masked_key = f"{api_key[:4]}...{api_key[-4:]}" if key_len > 8 else "***"
    logger.debug(f"Using API key: {masked_key} (length: {key_len})")
    
    # URL theo phiên bản v1 với model gemini-1.5-flash (nhanh hơn)
    url = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent"
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
    if image_url:
        logger.debug(f"Including image URL in request: {image_url}")
        
        try:
            # Đường dẫn tuyệt đối tới file ảnh trên server
            image_file_path = None
            
            # Kiểm tra nếu đây là URL đầy đủ
            if image_url.startswith(('http://', 'https://')):
                # Xử lý URL, lấy đường dẫn tương đối
                parts = image_url.split('/static/')
                if len(parts) > 1:
                    relative_path = 'static/' + parts[1]
                    image_file_path = os.path.join(os.getcwd(), relative_path)
            else:
                # Có thể là đường dẫn tương đối
                image_file_path = os.path.join(os.getcwd(), image_url.lstrip('/'))
            
            logger.debug(f"Looking for image at path: {image_file_path}")
            
            # Kiểm tra file có tồn tại không
            if image_file_path and os.path.exists(image_file_path):
                # Đọc file ảnh trực tiếp từ hệ thống file
                with open(image_file_path, 'rb') as img_file:
                    image_data = img_file.read()
                    
                # Mã hóa ảnh thành base64
                image_base64 = base64.b64encode(image_data).decode('utf-8')
                
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
            else:
                # Không tìm thấy file, thử tải từ URL
                logger.debug(f"File not found, trying to download from URL: {image_url}")
                
                # Nếu đây là URL đầy đủ, thử tải về
                if image_url.startswith(('http://', 'https://')):
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
                    logger.debug("Image successfully downloaded and encoded")
                else:
                    # Không phải URL và không tìm thấy file
                    raise FileNotFoundError(f"Image file not found: {image_file_path}")
                    
        except Exception as e:
            logger.error(f"Error processing image: {str(e)}")
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
    
    # Định dạng payload theo đúng API v1 của Gemini
    payload = {
        "contents": contents,
        "generation_config": {
            "temperature": 0.7,
            "top_k": 40,
            "top_p": 0.95,
            "max_output_tokens": 1000,
            # Kích thước đầu ra tối đa và số lượng phản hồi
            "candidate_count": 1
        },
        "safety_settings": [
            {
                "category": "HARM_CATEGORY_HATE_SPEECH",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            }
        ]
    }
    
    try:
        # Log payload size for debugging
        payload_size = len(str(payload))
        logger.debug(f"Sending request to {url}, payload size: {payload_size} bytes")
        
        # Send request to API
        response = requests.post(url, headers=headers, json=payload)
        
        # Check for HTTP errors and provide detailed error information
        if response.status_code != 200:
            error_detail = ""
            try:
                error_data = response.json()
                if "error" in error_data:
                    error_detail = f"Mã lỗi: {error_data.get('error', {}).get('code')}, " \
                                   f"Lý do: {error_data.get('error', {}).get('message')}"
                    logger.error(f"API error response: {error_detail}")
            except:
                error_detail = f"Lỗi HTTP {response.status_code}"
                logger.error(f"API error response status code: {response.status_code}")
            
            # Đối với lỗi 400, có thể là do API key không hợp lệ
            if response.status_code == 400:
                return f"Lỗi kết nối đến API: API key không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại API key của bạn."
            elif response.status_code == 403:
                return f"Lỗi quyền truy cập API: API key không có quyền sử dụng dịch vụ này. Vui lòng kiểm tra quyền của API key."
            else:
                return f"Lỗi kết nối đến API: {error_detail}. Vui lòng thử lại sau hoặc kiểm tra cài đặt API key."
        
        # Parse response data
        data = response.json()
        logger.debug(f"Received response: {str(data)[:200]}...")
        
        # Extract text from response
        if "candidates" in data and len(data["candidates"]) > 0:
            content = data["candidates"][0]["content"]
            if "parts" in content and len(content["parts"]) > 0:
                return content["parts"][0]["text"]
        
        # If we can't extract text properly, return error
        logger.error(f"Unexpected API response format: {data}")
        return "Lỗi khi xử lý phản hồi từ API. Định dạng phản hồi không đúng như mong đợi. Vui lòng thử lại sau."
    
    except requests.exceptions.RequestException as e:
        logger.error(f"API request failed: {str(e)}")
        if "Invalid API key" in str(e):
            return "Lỗi API key không hợp lệ. Vui lòng kiểm tra và cập nhật API key của bạn."
        elif "Forbidden" in str(e):
            return "API key không có quyền truy cập. Vui lòng kiểm tra quyền của API key."
        else:
            return f"Không thể kết nối với Google AI API: {str(e)}. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau."
