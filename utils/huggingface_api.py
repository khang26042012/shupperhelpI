import os
import logging
import random
from typing import Optional

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Lời chào mở đầu
GREETING_MESSAGES = [
    "Xin chào! Tôi là trợ lý AI học tập. Bạn cần giúp gì không?",
    "Chào bạn! Tôi có thể giúp bạn với các bài tập và câu hỏi học tập.",
    "Xin chào! Tôi sẵn sàng hỗ trợ bạn trong việc học tập."
]

# Danh sách tên các loại AI
AI_TYPES = """
Các loại AI theo mức độ phát triển:
1. AI hẹp (Narrow/Weak AI)
2. AI tổng quát (General AI)
3. AI siêu việt (Superintelligent AI)

Các loại AI theo phương pháp học:
1. Machine Learning (Học máy)
2. Deep Learning (Học sâu)
3. Reinforcement Learning (Học tăng cường)

Các loại AI theo ứng dụng:
1. Computer Vision (Thị giác máy tính)
2. Natural Language Processing (Xử lý ngôn ngữ tự nhiên)
3. Robotics (Robot học)
4. Expert Systems (Hệ thống chuyên gia)
5. Speech Recognition (Nhận dạng giọng nói)
"""

# Câu trả lời mẫu cho các môn học
SUBJECT_RESPONSES = {
    "Toán học": [
        "Để giải bài toán này, bạn cần áp dụng công thức...",
        "Đây là một bài toán về hình học không gian. Trước tiên, chúng ta cần xác định...",
        "Bài tập này thuộc phần đại số. Cách giải như sau..."
    ],
    "Ngữ văn": [
        "Tác phẩm này thuộc thể loại truyện ngắn, được sáng tác vào thời kỳ...",
        "Nhân vật chính trong tác phẩm này có đặc điểm...",
        "Phân tích đoạn văn này, ta thấy tác giả sử dụng nhiều biện pháp tu từ như..."
    ],
    "Tiếng Anh": [
        "Cấu trúc ngữ pháp này được sử dụng để diễn tả...",
        "Đây là một phrasal verb, có nghĩa là...",
        "Để viết một email formal, bạn nên sử dụng những cụm từ như..."
    ],
    "Vật lý": [
        "Hiện tượng này được giải thích bởi định luật...",
        "Để tính được lực tác dụng, ta áp dụng công thức...",
        "Bài toán này liên quan đến chuyển động của vật. Ta có thể giải như sau..."
    ],
    "Hóa học": [
        "Phản ứng này thuộc loại phản ứng oxi hóa khử...",
        "Để cân bằng phương trình hóa học này, ta thực hiện các bước sau...",
        "Hợp chất này có cấu tạo phân tử gồm..."
    ],
    "Sinh học": [
        "Quá trình trao đổi chất này diễn ra ở bào quan...",
        "Cấu trúc của tế bào gồm các thành phần chính là...",
        "Đặc điểm phân loại của sinh vật này là..."
    ],
    "Lịch sử": [
        "Sự kiện này diễn ra vào thời kỳ...",
        "Nhân vật lịch sử này có đóng góp quan trọng là...",
        "Cuộc cách mạng này có ảnh hưởng sâu rộng đến..."
    ],
    "Địa lý": [
        "Vùng địa lý này có đặc điểm khí hậu...",
        "Dân cư ở khu vực này chủ yếu sống bằng nghề...",
        "Đây là vùng núi được hình thành do quá trình..."
    ],
    "Công nghệ": [
        "Quy trình sản xuất sản phẩm này gồm các bước...",
        "Nguyên lý hoạt động của thiết bị này dựa trên...",
        "Khi lập trình, ta cần lưu ý các cấu trúc điều khiển như..."
    ],
    "Giáo dục công dân": [
        "Quyền và nghĩa vụ công dân được quy định trong Hiến pháp bao gồm...",
        "Đạo đức xã hội được thể hiện qua các chuẩn mực như...",
        "Khi giải quyết tình huống này, cần căn cứ vào pháp luật về..."
    ],
    "Tin học": [
        "Thuật toán này có độ phức tạp là...",
        "Để thiết kế cơ sở dữ liệu, ta cần phân tích các thực thể và mối quan hệ...",
        "Ngôn ngữ lập trình này có các cấu trúc điều khiển như..."
    ]
}

def get_ai_response(prompt: str, context: Optional[str] = None) -> str:
    """
    Get a simulated AI response without using Hugging Face API.
    
    Args:
        prompt: The user's message/query
        context: Optional context like subject and mode
        
    Returns:
        A simulated AI response
    """
    try:
        logger.debug(f"Received prompt: {prompt}")
        if context:
            logger.debug(f"Context: {context}")
        
        # Extract subject from context if available
        subject = "Toán học"  # Default subject
        if context and "Môn học:" in context:
            subject_part = context.split("Môn học:")[1].strip()
            subject = subject_part.split(",")[0].strip()
        
        # Check for specific questions about AI types
        if "loại ai" in prompt.lower() or "các loại ai" in prompt.lower() or "phân loại ai" in prompt.lower():
            return AI_TYPES
        
        # If it's a very short prompt, might be a greeting
        if len(prompt) < 10 and any(word in prompt.lower() for word in ["chào", "hi", "hello", "xin chào"]):
            return random.choice(GREETING_MESSAGES)
        
        # Get responses for the subject
        responses = SUBJECT_RESPONSES.get(subject, SUBJECT_RESPONSES["Toán học"])
        
        # Return a random response from the subject
        return random.choice(responses)
    
    except Exception as e:
        logger.error(f"Error in get_ai_response: {str(e)}")
        return "Đã xảy ra lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau."

# Alternative implementation using different models based on the context
def get_specialized_ai_response(prompt: str, subject: str, mode: str) -> str:
    """
    Get a response from a specialized Hugging Face model based on subject.
    
    Args:
        prompt: The user's message/query
        subject: The academic subject
        mode: The mode (trợ lý or giải bài tập)
        
    Returns:
        The AI's response as a string
    """
    # This would be implemented to use different models based on the subject
    # For now, we'll use the default implementation
    context = f"Môn học: {subject}, Chế độ: {mode}"
    return get_ai_response(prompt, context)
