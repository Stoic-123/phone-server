def to_dict(obj):
    if hasattr(obj, "model_dump"):
        return obj.model_dump()
    if hasattr(obj, "dict"):
        return obj.dict()
    if hasattr(obj, "__dict__"):
        return {k: to_dict(v) for k, v in obj.__dict__.items() if not k.startswith("_")}
    if isinstance(obj, list):
        return [to_dict(i) for i in obj]
    if isinstance(obj, dict):
        return {k: to_dict(v) for k, v in obj.items()}
    return obj

try:
    from pydantic import BaseModel as _PydanticBaseModel, Field
    class BaseModel(_PydanticBaseModel):
        def model_dump(self, *args, **kwargs):
            return to_dict(super().model_dump(*args, **kwargs) if hasattr(super(), "model_dump") else super().dict(*args, **kwargs))
        def dict(self, *args, **kwargs):
            return self.model_dump(*args, **kwargs)
except ImportError:
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
