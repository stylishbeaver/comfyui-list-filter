"""
List Filter node with inline toggle UI for ComfyUI.

This node displays a list of items as toggleable pills directly in the node UI.
Users can click pills to enable/disable items without opening a modal.
"""

import json
import logging


logger = logging.getLogger("comfyui-list-filter")
logger.setLevel(logging.INFO)


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
                "items_json": ("STRING", {
                    "default": "[]",
                    "multiline": True
                }),
            },
            "optional": {
                "items_list": ("LIST",),
            },
            "hidden": {"unique_id": "UNIQUE_ID", "extra_pnginfo": "EXTRA_PNGINFO"}
        }

    RETURN_TYPES = ("STRING", "INT")
    RETURN_NAMES = ("filtered_items", "count")
    FUNCTION = "filter_items"
    OUTPUT_NODE = True
    CATEGORY = "list/filtering"

    def filter_items(self, items_json, items_list=None, unique_id="", extra_pnginfo=None):
        """
        Filter items based on toggle state stored in node properties.

        The JavaScript extension manages the toggle state in node.properties._itemsData.
        This function reads that state from the workflow metadata and returns only active items.
        """
        try:
            # Parse input list
            logger.info(
                "[ListFilterToggle] filter_items start (node_id=%s, has_workflow=%s)",
                unique_id,
                bool(extra_pnginfo and "workflow" in extra_pnginfo),
            )
            logger.info("[ListFilterToggle] raw items_json=%s", items_json)
            logger.info("[ListFilterToggle] raw items_list=%s", items_list)
            logger.info(
                "[ListFilterToggle] items_json type=%s",
                type(items_json).__name__,
            )
            logger.info(
                "[ListFilterToggle] items_list type=%s",
                type(items_list).__name__,
            )

            items_raw = None
            if isinstance(items_list, (list, tuple)):
                items_raw = list(items_list)
                logger.info(
                    "[ListFilterToggle] using items_list (count=%d)",
                    len(items_raw),
                )
            elif isinstance(items_json, (list, tuple)):
                items_raw = list(items_json)
                logger.info(
                    "[ListFilterToggle] using items_json list (count=%d)",
                    len(items_raw),
                )
            else:
                if isinstance(items_json, str):
                    items_raw = json.loads(items_json)
                    if not isinstance(items_raw, list):
                        logger.info(
                            "[ListFilterToggle] items_json is not a list (type=%s)",
                            type(items_raw).__name__,
                        )
                        items_raw = []
                else:
                    logger.info(
                        "[ListFilterToggle] items_json not usable (type=%s)",
                        type(items_json).__name__,
                    )
                    items_raw = []

            items = [str(item) for item in items_raw]
            for idx, name in enumerate(items):
                logger.info("[ListFilterToggle] item[%d]=%s", idx, name)
            logger.info(
                "[ListFilterToggle] parsed items count=%d",
                len(items),
            )
            active_map = {name: True for name in items}

            # Try to get toggle state from workflow metadata
            filtered = items  # Default: return all items

            if extra_pnginfo and "workflow" in extra_pnginfo:
                workflow = extra_pnginfo["workflow"]
                if "nodes" in workflow:
                    # Find this node in the workflow
                    for node in workflow["nodes"]:
                        if str(node.get("id")) == str(unique_id):
                            # Get the toggle state from node properties
                            properties = node.get("properties", {})
                            items_data_json = properties.get("_itemsData", "[]")

                            try:
                                items_data = json.loads(items_data_json)
                                if isinstance(items_data, list):
                                    logger.info(
                                        "[ListFilterToggle] toggle state items=%d",
                                        len(items_data),
                                    )
                                    for item in items_data:
                                        name = str(item.get("name", ""))
                                        if name in active_map:
                                            active_map[name] = bool(item.get("active", True))
                            except (json.JSONDecodeError, KeyError):
                                logger.info(
                                    "[ListFilterToggle] failed to parse _itemsData"
                                )
                                pass
                            break

            filtered = [name for name in items if active_map.get(name, True)]
            filtered_json = json.dumps(filtered) if filtered else "[]"
            for idx, name in enumerate(filtered):
                logger.info("[ListFilterToggle] output[%d]=%s", idx, name)
            logger.info(
                "[ListFilterToggle] filtered count=%d",
                len(filtered),
            )
            logger.info("[ListFilterToggle] output json=%s", filtered_json)
            return {"ui": {"items": items}, "result": (filtered_json, len(filtered))}

        except (json.JSONDecodeError, TypeError):
            logger.info("[ListFilterToggle] invalid JSON input")
            return {"ui": {"items": []}, "result": ("[]", 0)}


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
