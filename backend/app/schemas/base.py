try:
    from pydantic import BaseModel, Field
except ImportError:
    # Pure Python zero-dependency fallback for Python 3.14 on Android/Termux
    class BaseModel:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
        def dict(self):
            return {k: v for k, v in self.__dict__.items() if not k.startswith("_")}
        def model_dump(self):
            return self.dict()

    def Field(default=None, default_factory=None, **kwargs):
        if default_factory is not None:
            return default_factory()
        return default
