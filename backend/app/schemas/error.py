from typing import Optional, Any
from pydantic import BaseModel

class ErrorResponse(BaseModel):
    error: bool = True
    message: str
    status_code: int
    details: Optional[Any] = None
