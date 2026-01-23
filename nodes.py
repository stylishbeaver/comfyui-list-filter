"""
List Filter node with inline toggle UI for ComfyUI.

This node displays a list of items as toggleable pills directly in the node UI.
Users can click pills to enable/disable items without opening a modal.
"""

import json
import logging


logger = logging.getLogger("comfyui-list-filter")
logger.setLevel(logging.INFO)


# Wildcard type that accepts any input - trick from ComfyUI-Impact-Pack
class AnyType(str):
    """Special type that matches any ComfyUI type for input validation."""
    def __ne__(self, __value: object) -> bool:
        return False


any_typ = AnyType("*")


class ListFilterToggle:
    """
    Node that accepts a list and outputs filtered items based on toggle state.

    The UI displays each item as a toggleable pill. Only active items are included
    in the output. Toggle states are preserved when the input list changes.
    """

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "items": (any_typ, {
                    "default": "[]",
                }),
                "trigger": ("INT", {
                    "default": 0,
                    "min": 0,
                    "max": 999999,
                }),
            },
            "hidden": {"unique_id": "UNIQUE_ID", "extra_pnginfo": "EXTRA_PNGINFO"}
        }

    RETURN_TYPES = ("LIST", "INT")
    RETURN_NAMES = ("filtered_items", "count")
    FUNCTION = "filter_items"
    OUTPUT_NODE = True
    CATEGORY = "list/filtering"

    def filter_items(self, items, trigger=0, unique_id="", extra_pnginfo=None):
        """
        Filter items based on toggle state stored in node properties.

        The JavaScript extension manages the toggle state in node.properties._itemsData.
        This function reads that state from the workflow metadata and returns only active items.

        Accepts any input type:
        - Python list/tuple (from LIST connections)
        - JSON string (from STRING connections)
        - Comma-separated string

        Args:
            trigger: Hidden counter that increments on refresh to force re-execution
        """
        try:
            # Parse input into a list
            logger.info(
                "[ListFilterToggle] filter_items start (node_id=%s, has_workflow=%s)",
                unique_id,
                bool(extra_pnginfo and "workflow" in extra_pnginfo),
            )
            logger.info("[ListFilterToggle] raw items=%s", items)
            logger.info("[ListFilterToggle] items type=%s", type(items).__name__)

            # Handle different input types
            items_raw = None

            # Direct list/tuple from LIST connections
            if isinstance(items, (list, tuple)):
                items_raw = list(items)
                logger.info("[ListFilterToggle] received list (count=%d)", len(items_raw))

            # String input (JSON or comma-separated)
            elif isinstance(items, str):
                items_raw = None
                if items.strip():
                    # Try JSON first
                    if items.lstrip().startswith("["):
                        try:
                            items_raw = json.loads(items)
                            logger.info("[ListFilterToggle] parsed JSON (count=%d)", len(items_raw))
                        except json.JSONDecodeError:
                            items_raw = None

                    # Fall back to comma-separated
                    if not isinstance(items_raw, list):
                        items_raw = [part.strip() for part in items.split(",") if part.strip()]
                        logger.info("[ListFilterToggle] split string (count=%d)", len(items_raw))

                if not isinstance(items_raw, list):
                    items_raw = []

            else:
                logger.warning(
                    "[ListFilterToggle] unexpected input type: %s",
                    type(items).__name__,
                )
                items_raw = []

            # Convert all items to strings for consistency
            items_list = [str(item) for item in items_raw]
            logger.info("[ListFilterToggle] parsed items count=%d", len(items_list))

            # Default: all items active
            active_map = {name: True for name in items_list}

            # Load toggle state from workflow metadata
            if extra_pnginfo and "workflow" in extra_pnginfo:
                workflow = extra_pnginfo["workflow"]
                if "nodes" in workflow:
                    for node in workflow["nodes"]:
                        if str(node.get("id")) == str(unique_id):
                            properties = node.get("properties", {})
                            items_data_json = properties.get("_itemsData", "[]")

                            try:
                                items_data = json.loads(items_data_json)
                                if isinstance(items_data, list):
                                    logger.info(
                                        "[ListFilterToggle] loaded toggle state (%d items)",
                                        len(items_data),
                                    )
                                    for item in items_data:
                                        name = str(item.get("name", ""))
                                        if name in active_map:
                                            active_map[name] = bool(item.get("active", True))
                            except (json.JSONDecodeError, KeyError) as e:
                                logger.warning(
                                    "[ListFilterToggle] failed to parse _itemsData: %s", e
                                )
                            break

            # Filter based on active state
            filtered = [name for name in items_list if active_map.get(name, True)]

            logger.info("[ListFilterToggle] filtered count=%d/%d", len(filtered), len(items_list))
            for idx, name in enumerate(filtered):
                logger.info("[ListFilterToggle] output[%d]=%s", idx, name)

            # Return LIST type (Python list), not JSON string
            return {
                "ui": {"items": (items_list,)},
                "result": (filtered, len(filtered))
            }

        except Exception as e:
            logger.error("[ListFilterToggle] error: %s", e, exc_info=True)
            return {"ui": {"items": ([],)}, "result": ([], 0)}


# Keep old nodes for backward compatibility but mark as deprecated
class ListFilterInput:
    """DEPRECATED: Use ListFilterToggle instead."""

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "items_json": ("STRING", {
                    "default": '["item1", "item2", "item3"]',
                    "multiline": True
                }),
            }
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("items",)
    FUNCTION = "pass_through"
    CATEGORY = "list/filtering"

    def pass_through(self, items_json):
        try:
            items = json.loads(items_json)
            if not isinstance(items, list):
                return ('[]',)
            return (items_json,)
        except (json.JSONDecodeError, TypeError):
            return ('[]',)


class ListFilterOutput:
    """DEPRECATED: Use ListFilterToggle instead."""

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "filtered_json": ("STRING", {"forceInput": True}),
            }
        }

    RETURN_TYPES = ("STRING", "INT")
    RETURN_NAMES = ("filtered_items", "count")
    FUNCTION = "output"
    CATEGORY = "list/filtering"

    def output(self, filtered_json):
        try:
            items = json.loads(filtered_json)
            if not isinstance(items, list):
                return ('[]', 0)
            return (filtered_json, len(items))
        except (json.JSONDecodeError, TypeError):
            return ('[]', 0)


# Node registration for ComfyUI
NODE_CLASS_MAPPINGS = {
    "ListFilterToggle": ListFilterToggle,
    "ListFilterInput": ListFilterInput,
    "ListFilterOutput": ListFilterOutput,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "ListFilterToggle": "List Filter (Toggle UI)",
    "ListFilterInput": "List Filter Input (Deprecated)",
    "ListFilterOutput": "List Filter Output (Deprecated)",
}
