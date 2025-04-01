import os
import logging
import requests
from typing import Optional

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Get API key from environment variable
API_KEY = os.environ.get("HUGGINGFACE_API_KEY", "")

# Default model to use
DEFAULT_MODEL = "google/flan-t5-xxl"  # Or other Vietnamese-compatible model

def get_ai_response(prompt: str, context: Optional[str] = None) -> str:
    """
    Get a response from the Hugging Face API.
    
    Args:
        prompt: The user's message/query
        context: Optional context like subject and mode
        
    Returns:
        The AI's response as a string
    """
    try:
        # Check if API key exists
        if not API_KEY:
            logger.warning("No Hugging Face API key found. Using fallback.")
            return "Xin lỗi, không thể kết nối với trợ lý AI. Vui lòng kiểm tra cài đặt API."
        
        # Prepare the API request
        api_url = f"https://api-inference.huggingface.co/models/{DEFAULT_MODEL}"
        
        # Format prompt with context if available
        full_prompt = prompt
        if context:
            full_prompt = f"{context}\n\n{prompt}"
            
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "inputs": full_prompt,
            "parameters": {
                "max_length": 1024,
                "temperature": 0.7,
                "top_p": 0.9,
                "do_sample": True
            },
            "options": {
                "wait_for_model": True
            }
        }
        
        # Make API request
        logger.debug(f"Sending request to Hugging Face API: {api_url}")
        response = requests.post(api_url, headers=headers, json=payload)
        response.raise_for_status()
        
        # Parse the response
        result = response.json()
        
        # Extract generated text
        if isinstance(result, list) and len(result) > 0:
            # Different models have different response formats
            if isinstance(result[0], dict) and "generated_text" in result[0]:
                return result[0]["generated_text"]
            
        # Fallback when response format is different
        return str(result)
    
    except requests.exceptions.RequestException as e:
        logger.error(f"Error making request to Hugging Face API: {str(e)}")
        return f"Lỗi kết nối với trợ lý AI: {str(e)}"
    
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
