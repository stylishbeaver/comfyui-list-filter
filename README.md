# ComfyUI List Filter

A ComfyUI extension that provides dynamic list filtering with an inline toggle UI. Unlike standard nodes that require predefined inputs, this extension creates toggleable pills dynamically based on your actual list data - works with any list size!

## Features

- ✅ **Truly Dynamic**: Creates toggle pills at runtime based on actual list data
- ✅ **Unlimited Items**: Works with 5 items or 500 items equally well
- ✅ **Inline Toggle UI**: Toggleable pills directly in the node (inspired by EreNodes)
- ✅ **Click to Toggle**: Simply click any item to enable/disable it
- ✅ **State Preservation**: Toggle states persist when the input list changes
- ✅ **User-Friendly**: All items active by default for easy filtering
- ✅ **Single Node**: One node handles both input and filtered output

## Installation

1. Navigate to your ComfyUI custom nodes directory:
   ```bash
   cd ComfyUI/custom_nodes/
   ```

2. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/comfyui-list-filter.git
   ```

3. Restart ComfyUI

4. Verify installation by checking the console for:
   ```
   [List Filter] Extension loaded successfully
   ```

## Usage

### Basic Workflow (Toggle UI - Recommended)

1. **Add a ListFilterToggle node** to your workflow
   - Category: `list/filtering`
   - Node name: "List Filter (Toggle UI)"

2. **Enter your list as JSON** in the `items_json` field:
   ```json
   ["apple", "banana", "cherry", "date", "elderberry"]
   ```

3. **Items appear as toggle pills** directly in the node (all active by default)

4. **Click any pill to toggle it** on/off
   - Active items: Blue toggle, white text
   - Inactive items: Gray toggle, dimmed text

5. **Connect the outputs** to other nodes:
   - `filtered_items`: JSON array of active items only
   - `count`: Number of active items

### Example Workflow

```
┌──────────────────────────────┐
│ List Filter (Toggle UI)      │
│                               │
│ ● apple         (active)      │
│ ○ banana        (inactive)    │
│ ● cherry        (active)      │
│ ○ date          (inactive)    │
│                               │
│ filtered_items: ["apple", "cherry"]
│ count: 2                      │
└──────────────┬───────────────┘
               │
               ▼
         (Your workflow)
```

### Toggle UI Features

- **Direct Interaction**: Click any item to toggle on/off
- **Visual Feedback**: Active items clearly distinguished from inactive
- **State Persistence**: Toggle states preserved when input list changes
- **No Modal**: Everything happens inline in the node
- **Full-Width Pills**: Easy to read and click
- **Automatic Layout**: Scrolls naturally with long lists

### Legacy Modal Workflow

For backward compatibility, the old modal-based nodes are still available:
- `List Filter Input (Deprecated)`
- `List Filter Output (Deprecated)`

These work the same as before but the new Toggle UI is recommended for a better user experience.

## API Endpoints

The extension provides the following API endpoints:

### `POST /list_filter/apply`

Filters a list based on selected indices.

**Request:**
```json
{
  "items": ["item1", "item2", "item3"],
  "selected_indices": [0, 2]
}
```

**Response:**
```json
{
  "filtered": ["item1", "item3"],
  "count": 2
}
```

### `GET /list_filter/health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

## Nodes

### ListFilterToggle (Recommended)

**Category:** `list/filtering`
**Display Name:** "List Filter (Toggle UI)"

**Inputs:**
- `items_json` (STRING): JSON array of items to filter

**Outputs:**
- `filtered_items` (STRING): JSON array of active items only
- `count` (INT): Number of active items

**Features:**
- Inline toggle pill UI (no modal required)
- Click any pill to toggle on/off
- State persistence when input list changes
- Visual feedback for active/inactive items

### ListFilterInput (Deprecated)

**Category:** `list/filtering`

**Inputs:**
- `items_json` (STRING): JSON array of items to filter

**Outputs:**
- `items` (STRING): The input JSON (validated)

### ListFilterOutput (Deprecated)

**Category:** `list/filtering`

**Inputs:**
- `filtered_json` (STRING): Filtered JSON from modal

**Outputs:**
- `filtered_items` (STRING): JSON array of filtered items
- `count` (INT): Number of items in filtered list

## Technical Details

### Architecture

- **Backend**: Python (ComfyUI nodes with JSON handling)
- **Frontend**: JavaScript ES6 modules (inline toggle UI with custom canvas drawing)
- **Rendering**: Custom onDrawForeground override for dynamic pill rendering
- **State Management**: Node properties for toggle state persistence

### File Structure

```
comfyui-list-filter/
├── __init__.py                    # Extension registration
├── server_routes.py               # API endpoints (legacy modal)
├── nodes.py                       # ComfyUI nodes
├── web/
│   ├── js/
│   │   ├── list_filter.js         # Legacy modal extension
│   │   ├── list_filter_toggle.js  # New toggle UI extension
│   │   └── ui/
│   │       └── modal.js           # Modal component (legacy)
│   └── css/
│       └── style.css              # Modal styling (legacy)
├── README.md
└── requirements.txt
```

## Requirements

- ComfyUI (latest version recommended)
- Python 3.8+
- No additional Python packages required

## Troubleshooting

### Extension not loading

- Check ComfyUI console for errors
- Verify `[List Filter] Extension loaded successfully` appears in console
- Ensure the extension is in the `custom_nodes` directory

### "List Filter" button not appearing

- Verify the extension loaded successfully
- Check browser console (F12) for JavaScript errors
- Reload the ComfyUI page (Ctrl+R or Cmd+R)

### Modal not opening

- Ensure you selected a **ListFilterInput** node before clicking the button
- Check that the `items_json` field contains valid JSON array
- Check browser console for errors

### Invalid JSON error

- Ensure your input is a JSON array: `["item1", "item2"]`
- Use double quotes, not single quotes
- No trailing commas

## Development

### Testing Locally

1. Clone the repository
2. Make changes to the code
3. Restart ComfyUI
4. Test with various list sizes and edge cases

### Running Tests

```bash
# Health check
curl http://localhost:8188/list_filter/health

# Test filtering
curl -X POST http://localhost:8188/list_filter/apply \
  -H "Content-Type: application/json" \
  -d '{"items": ["a","b","c"], "selected_indices": [0,2]}'
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Credits

Created as a proof-of-concept for dynamic UI in ComfyUI extensions.

Inspired by:
- **ComfyUI-EreNodes** (toggle pill UI approach and custom canvas drawing)
- ComfyUI-Visionatrix (node patterns)
- ComfyUI-HF-Downloader (extension structure)
- Civicomfy (modal UI patterns)

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

**Note**: This extension demonstrates that TRUE dynamic widgets in ComfyUI require JavaScript extensions with custom canvas drawing. By overriding `onDrawForeground` and `onMouseDown`, you can create fully dynamic UI elements that respond to runtime data - a technique pioneered by extensions like EreNodes. Standard ComfyUI nodes cannot create dynamic UI elements at runtime since their inputs must be predefined at class registration time.
