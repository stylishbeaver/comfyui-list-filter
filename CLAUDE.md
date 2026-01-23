# ComfyUI List Filter - Development Rules

## MANDATORY: Identifier Change Protocol

**CRITICAL:** When renaming, removing, or adding ANY identifier (variable, function, class, property, widget name, etc.), you MUST:

1. **Search for ALL occurrences** using grep/find before making any changes
2. **Update EVERY occurrence** - no exceptions
3. **Verify the change** by searching again to confirm nothing was missed

### Examples of identifiers that must be traced:

- Widget names: `items_json` → `items`
- Function names: `filter_items` → `filterItems`
- Property names: `_itemsData` → `_toggleState`
- Class names: `ListFilterToggle` → `ListFilter`
- Parameter names: `items_list` → `items_array`

### Process:

```bash
# 1. Before renaming, find all occurrences
grep -r "old_name" . --include="*.js" --include="*.py"

# 2. Make changes to ALL files

# 3. Verify nothing was missed
grep -r "old_name" . --include="*.js" --include="*.py"
# Should return ZERO results
```

**Failure to follow this process will break the node and waste time debugging.**

---

## Overview

Custom ComfyUI node for filtering lists with an inline toggle UI.

### Key Components

- `nodes.py` - Python backend (input handling, filtering logic)
- `web/list_filter_toggle.js` - Frontend UI (drawing toggles, click handling)
- `__init__.py` - Node registration

### Architecture

**Data Flow:**
1. Input connects → Python receives data
2. Python returns `ui: {items: [...]}`
3. JS receives via `onExecuted()` → calls `applyItemsFromServer()`
4. Items stored in `node.properties._itemsData` as JSON
5. `onDrawForeground()` reads `_itemsData` and draws toggle pills
6. User clicks toggle → updates `_itemsData` → triggers refresh
7. Refresh increments `trigger` input → forces Python re-execution
8. Python reads toggle state from `extra_pnginfo.workflow.nodes[].properties._itemsData`

### Critical Implementation Details

**Widget Lifecycle:**
- Widget exists when input is **disconnected** (has default value)
- Widget is **removed** when input is **connected** to another node
- Code must handle both states gracefully

**Type System:**
- Uses `AnyType("*")` wildcard to accept any input type
- Input parsing handles: LIST, STRING (JSON), STRING (comma-separated)
- Returns `("LIST", "INT")` - proper LIST type, not JSON string

**Cache Busting:**
- Toggle state is in `properties`, not function inputs
- ComfyUI caches based on function inputs only
- `trigger` input increments to force re-execution
- Without trigger, toggling wouldn't cause output updates

### Common Pitfalls

1. **Widget checks failing:** Always handle case where widget doesn't exist (input connected)
2. **Drawing not triggering:** Ensure `setDirtyCanvas(true, true)` is called
3. **State not persisting:** Must use `node.properties` and serialize/configure properly
4. **Output not updating:** Increment `trigger` value to break cache

### Development Workflow

1. Edit Python/JS files
2. Test in ComfyUI (may need browser refresh for JS changes)
3. Check console logs: `[List Filter Toggle] ...`
4. Check Python logs in terminal
5. Commit with descriptive message
6. Push to trigger auto-reload in running instances
