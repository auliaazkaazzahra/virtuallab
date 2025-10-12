from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, field_validator
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session
import os

from database import SessionLocal, Base, engine
from models import User

# Konfigurasi
SECRET_KEY = os.getenv("SECRET_KEY", "physicslab-secret-key-2024-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 43200

# Frontend URL dari environment variable
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

Base.metadata.create_all(bind=engine)
app = FastAPI(title="PhysicsLab Virtual API", version="1.0.0")

# CORS configuration untuk production
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://virtuallab-vert.vercel.app/",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    
    @field_validator('name')
    @classmethod
    def name_not_empty(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('Nama harus minimal 2 karakter')
        return v.strip()
    
    @field_validator('password')
    @classmethod
    def password_strength(cls, v):
        if len(v) < 6:
            raise ValueError('Password harus minimal 6 karakter')
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class UpdateProfileRequest(BaseModel):
    name: str
    email: EmailStr
    photo: str = None

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_access_token(user_id: int, email: str):
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": expire
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except (JWTError, ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Token tidak valid")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User tidak ditemukan")
    return user

@app.get("/")
def root():
    return {
        "message": "PhysicsLab Virtual API",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/auth/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    # Cek apakah email sudah terdaftar
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")
    
    # Hash password
    hashed_password = pwd_context.hash(request.password)
    
    # Buat user baru
    new_user = User(
        name=request.name,
        email=request.email,
        password_hash=hashed_password
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "message": "Akun berhasil dibuat",
        "user": new_user.to_dict()
    }

@app.post("/auth/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    # Cari user berdasarkan email
    user = db.query(User).filter(User.email == request.email).first()
    
    # Verifikasi password
    if not user or not pwd_context.verify(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email atau password salah")
    
    # Buat access token
    access_token = create_access_token(user.id, user.email)
    
    return TokenResponse(
        access_token=access_token,
        user=user.to_dict()
    )

@app.get("/auth/profile")
def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "user": current_user.to_dict()
    }

@app.post("/auth/logout")
def logout(current_user: User = Depends(get_current_user)):
    return {
        "message": "Logout berhasil"
    }

@app.put("/auth/profile")
def update_profile(request: UpdateProfileRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Cek apakah email sudah digunakan oleh user lain
    if request.email != current_user.email:
        existing_user = db.query(User).filter(User.email == request.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email sudah digunakan")

    # Update user
    current_user.name = request.name
    current_user.email = request.email
    current_user.photo = request.photo

    db.commit()
    db.refresh(current_user)

    return {
        "message": "Profile berhasil diupdate",
        "user": current_user.to_dict()
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")