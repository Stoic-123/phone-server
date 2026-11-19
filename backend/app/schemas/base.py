def to_dict(obj):
    if obj is None or isinstance(obj, (int, float, str, bool)):
        return obj
    if isinstance(obj, list):
        return [to_dict(i) for i in obj]
    if isinstance(obj, tuple):
        return [to_dict(i) for i in obj]
    if isinstance(obj, dict):
        return {k: to_dict(v) for k, v in obj.items()}
    if hasattr(obj, "__dict__"):
        return {k: to_dict(v) for k, v in obj.__dict__.items() if not k.startswith("_")}
    return str(obj)

class BaseModel:
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)
    def dict(self):
        return to_dict(self)
    def model_dump(self):
        return to_dict(self)

def Field(default=None, default_factory=None, **kwargs):
    if default_factory is not None:
        return default_factory()
    return default
