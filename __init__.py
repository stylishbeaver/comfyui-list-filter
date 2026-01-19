"""
ComfyUI List Filter - Dynamic checkbox filtering extension

Provides a modal UI with dynamic checkboxes for filtering lists.
Works with any list size - truly dynamic widget creation.
"""

WEB_DIRECTORY = "./web"

# Simple pass-through nodes for workflow integration
from .nodes import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]

# Register API routes
try:
    from . import server_routes
    print("[List Filter] Extension loaded successfully")
except ImportError:
    pass  # Running in test environment or standalone
