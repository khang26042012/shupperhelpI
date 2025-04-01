import os
import logging
import requests
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Get API key from environment variable
API_KEY = os.environ.get("HUGGINGFACE_API_KEY", "")

# Default model to use - use a model that does text generation instead of classification/mask
DEFAULT_MODEL = "gpt2"  # Widely accessible for free API use

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
        # Fake response for testing when API is not working
        # Convert token to include hf_ prefix if not already present
        api_key = API_KEY
        if api_key and not api_key.startswith("hf_"):
            api_key = f"hf_{api_key}"
            
        # Check if API key exists
        if not api_key:
            logger.warning("No Hugging Face API key found. Using fallback.")
            return "Xin lỗi, không thể kết nối với trợ lý AI. Vui lòng kiểm tra cài đặt API."
        
        # Prepare the API request
        api_url = f"https://api-inference.huggingface.co/models/{DEFAULT_MODEL}"
        
        # Format prompt with context if available
        full_prompt = prompt
        if context:
            full_prompt = f"{context}\n\n{prompt}"
            
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # For text-generation API
        if "flan" in DEFAULT_MODEL or "gpt" in DEFAULT_MODEL or "llama" in DEFAULT_MODEL:
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
        else:
            # For fill-mask or text-classification models
            payload = {
                "inputs": full_prompt
            }
            
        # Log the details for debugging
        logger.debug(f"Using API key: {api_key[:5]}...{api_key[-5:]}")
        logger.debug(f"Sending request to Hugging Face API: {api_url}")
        
        # Make API request
        response = requests.post(api_url, headers=headers, json=payload)
        response.raise_for_status()
        
        # Parse the response
        result = response.json()
        logger.debug(f"API Response: {result}")
        
        # Extract generated text based on model type
        if isinstance(result, list) and len(result) > 0:
            # Text generation models
            if isinstance(result[0], dict) and "generated_text" in result[0]:
                return result[0]["generated_text"]
            # Fill-mask models
            elif isinstance(result[0], dict) and "sequence" in result[0]:
                return result[0]["sequence"]
                
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
