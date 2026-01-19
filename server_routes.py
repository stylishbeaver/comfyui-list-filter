"""
Backend API routes for ComfyUI List Filter extension.

Provides endpoints for filtering lists based on user checkbox selections.
"""

import json
from aiohttp import web
import server

# Get ComfyUI's server instance
prompt_server = server.PromptServer.instance


@prompt_server.routes.post("/list_filter/apply")
async def apply_filter(request):
    """
    Receives list and selected indices, returns filtered list.

    Request body:
        {
            "items": ["item1", "item2", "item3"],
            "selected_indices": [0, 2]
        }

    Response:
        {
            "filtered": ["item1", "item3"],
            "count": 2
        }
    """
    try:
        data = await request.json()
        items = data.get("items", [])
        selected_indices = data.get("selected_indices", [])

        # Validate inputs
        if not isinstance(items, list):
            return web.json_response(
                {"error": "items must be a list"},
                status=400
            )

        if not isinstance(selected_indices, list):
            return web.json_response(
                {"error": "selected_indices must be a list"},
                status=400
            )

        # Filter items by selected indices
        filtered = []
        for idx in selected_indices:
            if isinstance(idx, int) and 0 <= idx < len(items):
                filtered.append(items[idx])

        return web.json_response({
            "filtered": filtered,
            "count": len(filtered)
        })

    except json.JSONDecodeError:
        return web.json_response(
            {"error": "Invalid JSON in request body"},
            status=400
        )
    except Exception as e:
        return web.json_response(
            {"error": str(e)},
            status=500
        )


@prompt_server.routes.get("/list_filter/health")
async def health_check(request):
    """
    Health check endpoint to verify extension is loaded.

    Response:
        {"status": "ok"}
    """
    return web.json_response({"status": "ok"})
