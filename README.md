# ComfyUI List Filter

A ComfyUI extension that provides dynamic checkbox filtering for lists. Unlike standard nodes that require predefined inputs, this extension creates checkboxes dynamically based on your actual list data - works with any list size!

## Features

- ✅ **Truly Dynamic**: Creates checkboxes at runtime based on actual list data
- ✅ **Unlimited Items**: Works with 5 items or 500 items equally well
- ✅ **Professional UI**: Polished modal interface with Select All/Deselect All
- ✅ **User-Friendly**: All items selected by default for easy filtering
- ✅ **Responsive**: Scrollable for large lists, mobile-friendly design
- ✅ **Simple Integration**: Two simple nodes for workflow integration

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

### Basic Workflow

1. **Add a ListFilterInput node** to your workflow
   - Category: `list/filtering`
   - Node name: "List Filter Input"

2. **Enter your list as JSON** in the `items_json` field:
   ```json
   ["apple", "banana", "cherry", "date", "elderberry"]
   ```

3. **Select the node** by clicking on it

4. **Click the "List Filter" button** in the ComfyUI menu bar

5. **Modal opens** showing checkboxes for each item (all checked by default)

6. **Uncheck items** you want to exclude

7. **Click "Apply Filter"** to send filtered list to the workflow

8. **Connect to ListFilterOutput node** to use the filtered results

### Example Workflow

```
┌─────────────────────┐
│ List Filter Input   │
│ ["a","b","c","d"]   │
└──────────┬──────────┘
           │
           │ (User clicks "List Filter" button)
           │ (Modal opens with 4 checkboxes)
           │ (User unchecks "b" and "d")
           │
           ▼
┌─────────────────────┐
│ List Filter Output  │
│ ["a","c"]           │
│ count: 2            │
└─────────────────────┘
```

### Modal Features

**Toolbar Actions:**
- **Select All**: Check all checkboxes
- **Deselect All**: Uncheck all checkboxes
- **Item Count**: Shows how many items are selected

**Keyboard Shortcuts:**
- `Escape`: Close modal without applying

**Mouse Actions:**
- Click backdrop to close
- Click × to close

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

### ListFilterInput

**Category:** `list/filtering`

**Inputs:**
- `items_json` (STRING): JSON array of items to filter

**Outputs:**
- `items` (STRING): The input JSON (validated)

### ListFilterOutput

**Category:** `list/filtering`

**Inputs:**
- `filtered_json` (STRING): Filtered JSON from modal

**Outputs:**
- `filtered_items` (STRING): JSON array of filtered items
- `count` (INT): Number of items in filtered list

## Technical Details

### Architecture

- **Backend**: Python (aiohttp routes for filtering logic)
- **Frontend**: JavaScript ES6 modules (modal UI with dynamic rendering)
- **Styling**: CSS3 with dark theme matching ComfyUI

### File Structure

```
comfyui-list-filter/
├── __init__.py               # Extension registration
├── server_routes.py          # API endpoints
├── nodes.py                  # ComfyUI nodes
├── web/
│   ├── js/
│   │   ├── list_filter.js    # Main extension entry
│   │   └── ui/
│   │       └── modal.js      # Modal component
│   └── css/
│       └── style.css         # Modal styling
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
- ComfyUI-Visionatrix (node patterns)
- ComfyUI-HF-Downloader (extension structure)
- Civicomfy (modal UI patterns)

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

**Note**: This extension demonstrates that TRUE dynamic widgets in ComfyUI require JavaScript extensions. Standard ComfyUI nodes cannot create dynamic UI elements at runtime - their inputs must be predefined at class registration time.
