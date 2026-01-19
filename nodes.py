"""
Simple pass-through nodes for ComfyUI List Filter extension.

These nodes integrate the list filter modal into ComfyUI workflows.
"""

import json


class ListFilterInput:
    """
    Node that accepts a list (as JSON string) for filtering.

    Users input a JSON array, which can then be filtered using the modal UI.
    """

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
        """
        Validate JSON and pass through.

        Returns empty array if JSON is invalid.
        """
        try:
            items = json.loads(items_json)
            if not isinstance(items, list):
                return ('[]',)
            return (items_json,)
        except (json.JSONDecodeError, TypeError):
            return ('[]',)


class ListFilterOutput:
    """
    Node that outputs filtered list from the modal.

    Returns both the filtered list (as JSON string) and count of items.
    """

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
        """
        Parse filtered JSON and return list + count.

        Returns empty array and 0 if JSON is invalid.
        """
        try:
            items = json.loads(filtered_json)
            if not isinstance(items, list):
                return ('[]', 0)
            return (filtered_json, len(items))
        except (json.JSONDecodeError, TypeError):
            return ('[]', 0)


# Node registration for ComfyUI
NODE_CLASS_MAPPINGS = {
    "ListFilterInput": ListFilterInput,
    "ListFilterOutput": ListFilterOutput,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "ListFilterInput": "List Filter Input",
    "ListFilterOutput": "List Filter Output",
}
