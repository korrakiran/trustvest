import os
import uuid
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from google import genai
from google.genai import types
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
import bcrypt
from datetime import datetime
import boto3
from botocore.exceptions import ClientError

# Load environment variables
load_dotenv()
API_KEY = os.getenv("API_KEY")
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/")

# AWS S3 configuration (for KYC photo uploads)
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET")
S3_CLIENT = None
if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY and AWS_S3_BUCKET:
    try:
        S3_CLIENT = boto3.client(
            "s3",
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION,
        )
        print("✓ AWS S3 configured for KYC photo uploads")
    except Exception as e:
        print(f"⚠ S3 client init error: {e}")
        S3_CLIENT = None

# MongoDB connection
try:
    client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
    # Test connection
    client.admin.command('ping')
    db = client.trustvest
    users_collection = db.users
    
    # Create unique index on email/username to prevent duplicates
    # Use background=True to avoid blocking, and handle if index already exists
    try:
        users_collection.create_index("email", unique=True, background=True)
        users_collection.create_index("username", unique=True, background=True)
    except Exception as idx_error:
        # Index might already exist, that's okay
        pass
    
    print("✓ Connected to MongoDB")
except Exception as e:
    print(f"⚠ MongoDB connection error: {e}")
    print("⚠ Continuing without database (some features may not work)")
    print("⚠ To use authentication, ensure MongoDB is running and MONGO_URL is set in .env")
    client = None
    db = None
    users_collection = None

app = FastAPI()

# Allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Types ---

class ChatMessage(BaseModel):
    role: str
    text: str

class ChatRequest(BaseModel):
    history: list[ChatMessage]
    user_name: str

class UserProfile(BaseModel):
    behaviorTags: list[str]
    emotionalScore: int

class DebateRequest(BaseModel):
    asset_name: str
    asset_risk: str
    amount: float
    user: UserProfile

# Authentication Models
class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    name: str
    kycVerified: bool
    riskScore: int
    walletBalance: float
    emotionalScore: int
    behaviorTags: list[str]

# --- Authentication Endpoints ---

@app.post("/register")
def register(request: RegisterRequest):
    """Register a new user with unique username/email"""
    if users_collection is None:
        raise HTTPException(status_code=503, detail="Database not available")
    
    # Check if email or username already exists
    existing_user = users_collection.find_one({
        "$or": [
            {"email": request.email.lower()},
            {"username": request.username.lower()}
        ]
    })
    
    if existing_user:
        if existing_user.get("email") == request.email.lower():
            raise HTTPException(status_code=400, detail="Email already registered")
        else:
            raise HTTPException(status_code=400, detail="Username already taken")
    
    # Hash password
    password_hash = bcrypt.hashpw(request.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Create new user
    user_doc = {
        "username": request.username.lower(),
        "email": request.email.lower(),
        "password_hash": password_hash,
        "name": request.username,  # Default name to username
        "kycVerified": False,
        "riskScore": 10,
        "walletBalance": 1000.0,
        "emotionalScore": 80,
        "behaviorTags": ["New Investor"],
        "createdAt": datetime.utcnow(),
        "lastLogin": None
    }
    
    try:
        result = users_collection.insert_one(user_doc)
        user_doc["_id"] = str(result.inserted_id)
        
        # Remove password hash from response
        user_doc.pop("password_hash", None)
        user_doc.pop("_id", None)
        user_doc["id"] = str(result.inserted_id)
        
        return {"message": "User registered successfully", "user": user_doc}
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    except Exception as e:
        print(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")

@app.post("/login")
def login(request: LoginRequest):
    """Login user with email and password"""
    if users_collection is None:
        raise HTTPException(status_code=503, detail="Database not available")
    
    # Find user by email
    user = users_collection.find_one({"email": request.email.lower()})
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not bcrypt.checkpw(request.password.encode('utf-8'), user["password_hash"].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Update last login
    users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"lastLogin": datetime.utcnow()}}
    )
    
    # Prepare response (remove sensitive data)
    user_response = {
        "id": str(user["_id"]),
        "username": user["username"],
        "email": user["email"],
        "name": user.get("name", user["username"]),
        "kycVerified": user.get("kycVerified", False),
        "riskScore": user.get("riskScore", 10),
        "walletBalance": user.get("walletBalance", 1000.0),
        "emotionalScore": user.get("emotionalScore", 80),
        "behaviorTags": user.get("behaviorTags", ["New Investor"])
    }
    
    return {"message": "Login successful", "user": user_response}

@app.get("/user/{user_id}")
def get_user(user_id: str):
    """Get user profile by ID"""
    if users_collection is None:
        raise HTTPException(status_code=503, detail="Database not available")
    
    from bson import ObjectId
    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_response = {
            "id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"],
            "name": user.get("name", user["username"]),
            "kycVerified": user.get("kycVerified", False),
            "riskScore": user.get("riskScore", 10),
            "walletBalance": user.get("walletBalance", 1000.0),
            "emotionalScore": user.get("emotionalScore", 80),
            "behaviorTags": user.get("behaviorTags", ["New Investor"])
        }
        return user_response
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid user ID")

# --- KYC (with S3 photo upload) ---

class KYCSubmitRequest(BaseModel):
    user_id: str
    fullName: str
    dob: str
    pan: str
    consent: bool
    photoUrl: str | None = None  # S3 URL after upload

@app.post("/kyc/upload-photo")
async def kyc_upload_photo(
    file: UploadFile = File(...),
    user_id: str = Form(...),
):
    """Upload KYC selfie/photo to S3. Returns the public URL."""
    if S3_CLIENT is None:
        raise HTTPException(
            status_code=503,
            detail="S3 not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET, and optionally AWS_REGION in .env",
        )
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")

    # Validate file type
    allowed = ("image/jpeg", "image/jpg", "image/png", "image/webp")
    if file.content_type not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed)}",
        )

    ext = "jpg"
    if file.content_type == "image/png":
        ext = "png"
    elif file.content_type == "image/webp":
        ext = "webp"

    key = f"kyc/{user_id}/{uuid.uuid4().hex}.{ext}"

    try:
        contents = await file.read()
        S3_CLIENT.put_object(
            Bucket=AWS_S3_BUCKET,
            Key=key,
            Body=contents,
            ContentType=file.content_type or "image/jpeg",
        )
        url = f"https://{AWS_S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{key}"
        return {"url": url, "key": key}
    except ClientError as e:
        print(f"S3 upload error: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload photo to S3")

@app.post("/kyc/submit")
def kyc_submit(request: KYCSubmitRequest):
    """Submit KYC form and optionally save photo URL to user in MongoDB."""
    if users_collection is None:
        raise HTTPException(status_code=503, detail="Database not available")

    from bson import ObjectId
    try:
        result = users_collection.update_one(
            {"_id": ObjectId(request.user_id)},
            {
                "$set": {
                    "name": request.fullName,
                    "kycVerified": True,
                    "kycPhotoUrl": request.photoUrl,
                    "kycSubmittedAt": datetime.utcnow(),
                    "kycDob": request.dob,
                    "kycPan": request.pan,
                }
            },
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        return {"message": "KYC submitted successfully", "kycVerified": True}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="KYC submit failed")

# --- AI Logic ---

@app.get("/")
def health_check():
    db_status = "connected" if users_collection is not None else "disconnected"
    return {
        "status": "ok", 
        "message": "TrustVest AI Backend is running",
        "database": db_status
    }

@app.get("/status")
def connection_status():
    """Check MongoDB and AWS S3 connection status."""
    mongodb_connected = users_collection is not None
    aws_s3_configured = S3_CLIENT is not None
    aws_s3_ok = False
    aws_error = None
    if S3_CLIENT and AWS_S3_BUCKET:
        try:
            S3_CLIENT.head_bucket(Bucket=AWS_S3_BUCKET)
            aws_s3_ok = True
        except ClientError as e:
            aws_error = str(e.response.get("Error", {}).get("Message", e))
        except Exception as e:
            aws_error = str(e)
    return {
        "mongodb": "connected" if mongodb_connected else "disconnected",
        "aws_s3": "connected" if aws_s3_ok else ("configured" if aws_s3_configured else "not_configured"),
        "aws_s3_error": aws_error,
    }

@app.post("/chat")
def chat_endpoint(request: ChatRequest):
    if not API_KEY:
        raise HTTPException(status_code=500, detail="API Key not configured in backend")
    
    try:
        client = genai.Client(api_key=API_KEY)
        
        system_instruction = f"""
        You are a friendly and secure financial assistant for a beginner investor named {request.user_name}.
        Keep your answers short, simple, and encouraging.
        Focus on educating the user about safety and basics.
        """
        
        # Convert Pydantic models to Gemini compatible history
        formatted_history = []
        for msg in request.history[:-1]: # Exclude last message (input)
            # Filter out any role that isn't user or model
            if msg.role in ["user", "model"]:
                formatted_history.append(types.Content(
                    role=msg.role,
                    parts=[types.Part.from_text(text=msg.text)]
                ))
        
        chat = client.chats.create(
            model="gemini-3-flash-preview",
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                max_output_tokens=1000,
            ),
            history=formatted_history
        )
        
        last_msg = request.history[-1].text
        response = chat.send_message(last_msg)
        
        return {"text": response.text}

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/debate")
def debate_endpoint(request: DebateRequest):
    if not API_KEY:
        raise HTTPException(status_code=500, detail="API Key not configured")

    try:
        client = genai.Client(api_key=API_KEY)
        
        prompt = f"""
        You are a Multi-Agent Financial Debate Engine. 
        User Profile: {', '.join(request.user.behaviorTags)}. Emotional Score: {request.user.emotionalScore}/100.
        Action: User wants to invest {request.amount} in {request.asset_name} ({request.asset_risk} Risk).
        
        Generate a debate between 3 agents:
        1. Optimist (Focus on gains/growth)
        2. Risk (Focus on downside/security)
        3. Data (Focus on historical stats)
        
        Then provide a final synthesis conclusion.
        """
        
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema={
                    "type": "OBJECT",
                    "properties": {
                        "turns": {
                            "type": "ARRAY",
                            "items": {
                                "type": "OBJECT",
                                "properties": {
                                    "agent": {"type": "STRING", "description": "One of: Optimist, Risk, Data"},
                                    "message": {"type": "STRING"}
                                },
                                "required": ["agent", "message"]
                            }
                        },
                        "conclusion": {"type": "STRING"},
                        "verdict": {"type": "STRING", "description": "One of: PROCEED, CAUTION, WAIT"}
                    },
                    "required": ["turns", "conclusion", "verdict"]
                }
            )
        )
        
        return response.parsed

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))