import os
import json
from typing import List, Any, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

def _get_default_cors_origins() -> List[str]:
    raw = os.getenv("CORS_ORIGINS", "")
    if not raw:
        return [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000"
        ]
    if raw.startswith("[") and raw.endswith("]"):
        try:
            return json.loads(raw)
        except Exception:
            pass
    return [origin.strip() for origin in raw.split(",") if origin.strip()]

class Settings(BaseSettings):
    PROJECT_NAME: str = "WeatherGPT API"
    PROJECT_DESCRIPTION: str = "AI-Powered Conversational Weather Intelligence Platform"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # Server configuration
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # CORS origins configuration
    CORS_ORIGINS: Any = _get_default_cors_origins()
    
    # Server-Side Supabase configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", os.getenv("VITE_SUPABASE_URL", ""))
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    # Server-Side Google Maps API Key for Reverse Geocoding & Places Search
    GOOGLE_MAPS_API_KEY: str = os.getenv("GOOGLE_MAPS_API_KEY", "")

    # Official India Meteorological Department (IMD) configuration
    IMD_API_KEY: str = os.getenv("IMD_API_KEY", "")
    IMD_API_BASE_URL: str = os.getenv("IMD_API_BASE_URL", "https://api.imd.gov.in/api/v1")
    IMD_CACHE_TTL_SECONDS: int = int(os.getenv("IMD_CACHE_TTL_SECONDS", "900"))
    IMD_TIMEOUT_SECONDS: float = float(os.getenv("IMD_TIMEOUT_SECONDS", "10.0"))

    # LLM Provider Configuration
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "auto")  # "groq", "openai", "gemini", "mock", or "auto"
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    LLM_TEMPERATURE: float = float(os.getenv("LLM_TEMPERATURE", "0.2"))
    LLM_MAX_TOKENS: int = int(os.getenv("LLM_MAX_TOKENS", "600"))

    # BHASHINI (National Language Translation Mission) Configuration
    BHASHINI_USER_ID: str = os.getenv("BHASHINI_USER_ID", "")
    BHASHINI_API_KEY: str = os.getenv("BHASHINI_API_KEY", "")
    BHASHINI_INFERENCE_KEY: str = os.getenv("BHASHINI_INFERENCE_KEY", "")
    BHASHINI_PIPELINE_ID: str = os.getenv("BHASHINI_PIPELINE_ID", "")
    BHASHINI_PIPELINE_URL: str = os.getenv(
        "BHASHINI_PIPELINE_URL",
        "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline"
    )
    BHASHINI_DEFAULT_INFERENCE_URL: str = os.getenv(
        "BHASHINI_DEFAULT_INFERENCE_URL",
        "https://dhruva-api.bhashini.gov.in/services/inference/pipeline"
    )
    BHASHINI_CACHE_TTL_SECONDS: int = int(os.getenv("BHASHINI_CACHE_TTL_SECONDS", "3600"))
    BHASHINI_TIMEOUT_SECONDS: float = float(os.getenv("BHASHINI_TIMEOUT_SECONDS", "15.0"))

    model_config = SettingsConfigDict(case_sensitive=True, extra="ignore")

settings = Settings()
