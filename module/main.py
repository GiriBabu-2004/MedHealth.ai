from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from ocr_utils import extract_text_from_pdf, extract_text_from_image
from gemini_utils import ask_gemini

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# ✅ CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Add detailed logging
        logger.info(f"Received file: {file.filename}")
        logger.info(f"Content type: {file.content_type}")
        logger.info(f"File size: {file.size if hasattr(file, 'size') else 'unknown'}")
        
        # Validate file exists and has content
        if not file.filename:
            logger.error("No filename provided")
            raise HTTPException(status_code=400, detail="No file uploaded")
        
        filename = file.filename.lower()
        logger.info(f"Processing filename: {filename}")
        
        # Check file type before reading
        supported_extensions = (
            '.pdf', 
            '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.tif', 
            '.webp', '.svg', '.ico', '.heic', '.heif', '.raw', '.cr2', 
            '.nef', '.arw', '.dng', '.orf', '.rw2', '.pef', '.srw'
        )
        if not filename.endswith(supported_extensions):
            logger.error(f"Unsupported file type: {filename}")
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type. Supported: {', '.join(supported_extensions)}"
            )
        
        # Read file content
        file_bytes = await file.read()
        logger.info(f"File read successfully, size: {len(file_bytes)} bytes")
        
        # Validate file content
        if not file_bytes:
            logger.error("File is empty")
            raise HTTPException(status_code=400, detail="File is empty")
        
        # OCR processing
        logger.info("Starting OCR processing...")
        if filename.endswith(".pdf"):
            text = extract_text_from_pdf(file_bytes)
        elif filename.endswith((
            '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.tif', 
            '.webp', '.svg', '.ico', '.heic', '.heif', '.raw', '.cr2', 
            '.nef', '.arw', '.dng', '.orf', '.rw2', '.pef', '.srw'
        )):
            text = extract_text_from_image(file_bytes)
        
        logger.info(f"OCR completed, extracted text length: {len(text) if text else 0}")
        
        # Validate extracted text
        if not text or not text.strip():
            logger.warning("No text extracted from file")
            return JSONResponse({
                "error": "No text could be extracted from the file",
                "text": "",
                "analysis": "Unable to analyze - no text found"
            }, status_code=400)
        
        # Ask Gemini for medicine details
        logger.info("Sending to Gemini for analysis...")
        prompt = f"""You are a medical assistant. Analyze this prescription or label:

{text}

Tell me:
1. What is the medicine for?
2. What are the correct dosages?
3. Any important warnings or advice?

Explain clearly."""
        
        gemini_reply = ask_gemini(prompt)
        logger.info("Gemini analysis completed")

        return {
            "text": text.strip(), 
            "analysis": gemini_reply,
            "filename": file.filename
        }
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Add a health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Add an endpoint to check supported file types
@app.get("/supported-types")
async def supported_types():
    return {
        "supported_extensions": [
            ".pdf", 
            ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".tif", 
            ".webp", ".svg", ".ico", ".heic", ".heif", ".raw", ".cr2", 
            ".nef", ".arw", ".dng", ".orf", ".rw2", ".pef", ".srw"
        ],
        "max_file_size": "No explicit limit set"
    }