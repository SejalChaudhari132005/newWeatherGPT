from pydantic import BaseModel, Field

class HealthCheckResponse(BaseModel):
    status: str = Field(..., json_schema_extra={"example": "ok"})
    service: str = Field(..., json_schema_extra={"example": "WeatherGPT API"})
