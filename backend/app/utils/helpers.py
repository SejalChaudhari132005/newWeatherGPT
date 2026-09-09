from typing import Dict, Any

def sanitize_log_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Remove sensitive keys like tokens, secrets, or keys from dictionary data before logging."""
    sensitive_keys = {"token", "secret", "password", "key", "authorization", "api_key"}
    sanitized = {}
    for k, v in data.items():
        if any(sk in k.lower() for sk in sensitive_keys):
            sanitized[k] = "***MASKED***"
        else:
            sanitized[k] = v
    return sanitized
