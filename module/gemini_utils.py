import google.generativeai as genai
import logging
import time
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

# Set up logging
logger = logging.getLogger(__name__)

# 🔑 Replace with your actual API key
API_KEY = os.getenv("GEMINI_API_KEY")

def configure_gemini():
    """Configure Gemini API with error handling"""
    try:
        genai.configure(api_key=API_KEY)
        logger.info("Gemini API configured successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to configure Gemini API: {e}")
        return False

def get_gemini_model():
    """Get Gemini model with fallback options"""
    models_to_try = [
        "gemini-2.0-flash-exp",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-pro"
    ]
    
    for model_name in models_to_try:
        try:
            model = genai.GenerativeModel(model_name)
            logger.info(f"Successfully initialized model: {model_name}")
            return model
        except Exception as e:
            logger.warning(f"Failed to initialize {model_name}: {e}")
            continue
    
    logger.error("All model initialization attempts failed")
    return None

# Initialize configuration and model
configure_gemini()
model = get_gemini_model()

def ask_gemini(prompt: str, max_retries: int = 3, retry_delay: float = 1.0) -> str:
    """
    Ask Gemini with robust error handling and retries
    
    Args:
        prompt: The prompt to send to Gemini
        max_retries: Maximum number of retry attempts
        retry_delay: Delay between retries in seconds
    
    Returns:
        Response text or error message
    """
    global model
    
    # Input validation
    if not prompt or not prompt.strip():
        return "Error: Empty prompt provided"
    
    # Check if model is available
    if model is None:
        logger.error("Gemini model not available")
        return "Error: Gemini model not initialized. Please check your API key and internet connection."
    
    # Truncate very long prompts
    if len(prompt) > 30000:
        prompt = prompt[:30000] + "...[truncated]"
        logger.warning("Prompt truncated due to length")
    
    for attempt in range(max_retries):
        try:
            logger.info(f"Sending request to Gemini (attempt {attempt + 1}/{max_retries})")
            
            # Configure generation parameters for better reliability
            generation_config = genai.types.GenerationConfig(
                candidate_count=1,
                max_output_tokens=2048,
                temperature=0.7,
                top_p=0.8,
                top_k=40
            )
            
            # Add safety settings
            safety_settings = [
                {
                    "category": "HARM_CATEGORY_HARASSMENT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
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
            
            response = model.generate_content(
                prompt,
                generation_config=generation_config,
                safety_settings=safety_settings
            )
            
            # Check if response was blocked
            if hasattr(response, 'prompt_feedback') and response.prompt_feedback:
                if hasattr(response.prompt_feedback, 'block_reason'):
                    return f"Request blocked: {response.prompt_feedback.block_reason}"
            
            # Check if response has text
            if hasattr(response, 'text') and response.text:
                logger.info("Successfully received response from Gemini")
                return response.text.strip()
            elif hasattr(response, 'candidates') and response.candidates:
                # Try to get text from candidates
                for candidate in response.candidates:
                    if hasattr(candidate, 'content') and candidate.content:
                        if hasattr(candidate.content, 'parts') and candidate.content.parts:
                            text_parts = []
                            for part in candidate.content.parts:
                                if hasattr(part, 'text'):
                                    text_parts.append(part.text)
                            if text_parts:
                                return ' '.join(text_parts).strip()
                
                return "Error: No text content in response"
            else:
                return "Error: Empty response from Gemini"
                
        except Exception as e:
            error_msg = str(e).lower()
            
            # Handle specific error types
            if "quota" in error_msg or "rate" in error_msg:
                logger.warning(f"Rate limit/quota error on attempt {attempt + 1}: {e}")
                if attempt < max_retries - 1:
                    sleep_time = retry_delay * (2 ** attempt)  # Exponential backoff
                    logger.info(f"Waiting {sleep_time} seconds before retry...")
                    time.sleep(sleep_time)
                    continue
                else:
                    return "Error: API quota exceeded. Please try again later."
            
            elif "api" in error_msg and "key" in error_msg:
                logger.error(f"API key error: {e}")
                return "Error: Invalid API key. Please check your Gemini API key."
            
            elif "network" in error_msg or "connection" in error_msg:
                logger.warning(f"Network error on attempt {attempt + 1}: {e}")
                if attempt < max_retries - 1:
                    logger.info(f"Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                    continue
                else:
                    return "Error: Network connection failed. Please check your internet connection."
            
            else:
                logger.error(f"Unexpected error on attempt {attempt + 1}: {e}")
                if attempt < max_retries - 1:
                    logger.info(f"Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                    continue
                else:
                    return f"Error: Failed to get response from Gemini after {max_retries} attempts. Last error: {e}"
    
    return "Error: Max retries exceeded"

def test_gemini_connection() -> bool:
    """Test if Gemini API is working"""
    try:
        response = ask_gemini("Hello, please respond with 'OK' if you can hear me.")
        return "ok" in response.lower() and not response.startswith("Error:")
    except Exception as e:
        logger.error(f"Gemini connection test failed: {e}")
        return False

# Test connection on import (optional)
if __name__ == "__main__":
    print("Testing Gemini connection...")
    if test_gemini_connection():
        print("✅ Gemini API is working!")
    else:
        print("❌ Gemini API connection failed!")