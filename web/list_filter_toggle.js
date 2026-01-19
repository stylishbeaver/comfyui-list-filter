/**
 * ComfyUI List Filter - Toggle UI Extension
 *
 * Implements inline toggle pill UI for list filtering, inspired by EreNodes.
 * Items from the input list are displayed as toggleable pills directly in the node.
 */

import { app } from "../../scripts/app.js";

app.registerExtension({
    name: "ListFilterToggle",

    async setup() {
        console.log("[List Filter Toggle] Setting up extension");
    },

    beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name !== "ListFilterToggle") return;

        console.log("[List Filter Toggle] Registering node type");

        // Layout constants for pill drawing
        const pillX = 10;
        const pillY = 30;
        const pillH = 28;
        const pillSpacing = 5;
        const pillPadding = 5;
        const pillRadius = 6;
        const toggleWidth = 40;
        const toggleHeight = 20;

        // Parse items data from JSON string
        const parseItems = (value) => {
            try {
                const parsed = JSON.parse(value || "[]");
                if (Array.isArray(parsed)) return parsed;
            } catch {}
            return [];
        };

        // Override onNodeCreated to initialize our custom UI
        const origCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            if (origCreated) origCreated.apply(this, arguments);

            const node = this;

            // Initialize properties
            node.properties = node.properties || {};
            if (!node.properties._itemsData) {
                node.properties._itemsData = "[]";
            }

            // Find and hide the input widget
            const inputWidget = node.widgets?.find(w => w.name === "items_json");
            if (inputWidget) {
                inputWidget.computeSize = () => [0, 0];
                inputWidget.hidden = true;

                // Store original callback
                const origCallback = inputWidget.callback;

                // Override callback to sync with toggle data
                inputWidget.callback = function () {
                    if (origCallback) origCallback.apply(this, arguments);
                    node.syncItemsData();
                };
            }

            // Initialize items data from widget value
            node.syncItemsData = function() {
                const inputWidget = this.widgets?.find(w => w.name === "items_json");
                if (!inputWidget) return;

                try {
                    const items = JSON.parse(inputWidget.value || "[]");
                    if (!Array.isArray(items)) {
                        this.properties._itemsData = "[]";
                        return;
                    }

                    // Parse existing toggle state
                    const existingData = parseItems(this.properties._itemsData || "[]");
                    const existingStates = new Map(existingData.map(i => [i.name, i.active]));

                    // Create new items data, preserving existing toggle states
                    const newItemsData = items.map(item => ({
                        name: String(item),
                        active: existingStates.has(String(item)) ? existingStates.get(String(item)) : true
                    }));

                    this.properties._itemsData = JSON.stringify(newItemsData);
                    this.updateOutputWidget();
                } catch (e) {
                    console.error("[List Filter Toggle] Error syncing items:", e);
                    this.properties._itemsData = "[]";
                }
            };

            // Update the filtered output widget value based on active items
            node.updateOutputWidget = function() {
                const itemsData = parseItems(this.properties._itemsData || "[]");
                const activeItems = itemsData.filter(i => i.active).map(i => i.name);

                // The actual filtering happens in Python, but we update internal state
                // This ensures the visual state matches what will be output
                this._filteredItems = activeItems;

                // Mark graph as dirty to trigger recomputation
                app.graph.setDirtyCanvas(true, true);
            };

            // Handle mouse clicks on pills
            node.onMouseDown = function(e, pos) {
                const [x, y] = pos;

                // Check if click is within the pills area
                const bgX = pillX;
                const bgY = pillY;
                const bgW = this.size[0] - bgX * 2;
                const bgH = this._tagAreaBottom - bgY;

                if (x >= bgX && x <= bgX + bgW && y >= bgY && y <= bgY + bgH) {
                    // Find which pill was clicked
                    let clickedPill = null;
                    for (const pill of this._pillMap || []) {
                        if (x >= pill.x && x <= pill.x + pill.w &&
                            y >= pill.y && y <= pill.y + pill.h) {
                            clickedPill = pill;
                            break;
                        }
                    }

                    if (clickedPill) {
                        this.onPillClick(clickedPill);
                        return true;
                    }
                }

                return false;
            };

            // Handle pill click to toggle active state
            node.onPillClick = function(pill) {
                const itemsData = parseItems(this.properties._itemsData || "[]");
                const item = itemsData.find(i => i.name === pill.label);

                if (item) {
                    item.active = !item.active;
                    this.properties._itemsData = JSON.stringify(itemsData);
                    this.updateOutputWidget();
                    app.graph.setDirtyCanvas(true, true);
                }
            };

            // Initial sync
            node.syncItemsData();
        };

        // Override onDrawForeground to draw toggle pills
        nodeType.prototype.onDrawForeground = function(ctx) {
            const inputWidget = this.widgets?.find(w => w.name === "items_json");
            if (!inputWidget || this.flags?.collapsed) return;

            const itemsData = parseItems(this.properties._itemsData || "[]");

            if (itemsData.length === 0) {
                // Draw a message when no items
                ctx.font = "12px monospace";
                ctx.fillStyle = "#999";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("No items to display", this.size[0] / 2, pillY + 20);
                this._measuredHeight = pillY + 60;
                this._tagAreaBottom = pillY + 40;
                return;
            }

            ctx.font = "13px sans-serif";

            const pillMaxWidth = this.size[0] - pillX * 2;
            let currentX = pillX;
            let currentY = pillY;

            const positions = [];

            // Calculate positions for each pill
            for (const item of itemsData) {
                const label = item.name;
                const textWidth = ctx.measureText(label).width;

                // Full-width pill with toggle on the left
                const pillW = pillMaxWidth;

                // Check if we need to wrap to next row
                if (currentX + pillW > pillX + pillMaxWidth) {
                    currentX = pillX;
                    currentY += pillH + pillSpacing;
                }

                positions.push({
                    x: currentX,
                    y: currentY,
                    w: pillW,
                    h: pillH,
                    label: label,
                    active: item.active
                });

                currentX = pillX; // Always reset for full-width pills
                currentY += pillH + pillSpacing;
            }

            // Draw each pill
            this._pillMap = [];

            for (const p of positions) {
                // Draw pill background
                ctx.beginPath();
                ctx.fillStyle = p.active ? LiteGraph.WIDGET_BGCOLOR : "#2a2a2a";
                ctx.roundRect(p.x, p.y, p.w, p.h, pillRadius);
                ctx.fill();

                ctx.strokeStyle = p.active ? "#444" : "#333";
                ctx.lineWidth = 1;
                ctx.stroke();

                // Draw toggle switch background
                const toggleX = p.x + 8;
                const toggleY = p.y + (p.h - toggleHeight) / 2;

                ctx.beginPath();
                ctx.fillStyle = "#1a1a1a";
                ctx.roundRect(toggleX, toggleY, toggleWidth, toggleHeight, toggleHeight / 2);
                ctx.fill();

                // Draw toggle knob
                ctx.beginPath();
                const knobRadius = (toggleHeight - 4) / 2;
                const knobX = p.active
                    ? toggleX + toggleWidth - knobRadius - 4
                    : toggleX + knobRadius + 4;
                const knobY = toggleY + toggleHeight / 2;

                ctx.fillStyle = p.active ? "#4a9eff" : "#666";
                ctx.arc(knobX, knobY, knobRadius, 0, 2 * Math.PI);
                ctx.fill();

                // Draw label text
                ctx.textAlign = "left";
                ctx.textBaseline = "middle";
                ctx.fillStyle = p.active ? "#fff" : "#888";

                const textX = toggleX + toggleWidth + 12;
                const textY = p.y + p.h / 2;

                // Truncate text if too long
                let displayText = p.label;
                const maxTextWidth = p.w - (textX - p.x) - 10;
                if (ctx.measureText(displayText).width > maxTextWidth) {
                    while (displayText.length > 0 && ctx.measureText(displayText + "...").width > maxTextWidth) {
                        displayText = displayText.slice(0, -1);
                    }
                    displayText += "...";
                }

                ctx.fillText(displayText, textX, textY);

                // Store pill position for click detection
                this._pillMap.push({
                    x: p.x,
                    y: p.y,
                    w: p.w,
                    h: p.h,
                    label: p.label
                });
            }

            // Calculate total height
            this._tagAreaBottom = currentY;
            this._measuredHeight = currentY + pillPadding;

            // Resize node if needed
            if (isFinite(this._measuredHeight) && this._measuredHeight && this.size[1] !== this._measuredHeight) {
                this.setSize([this.size[0], this._measuredHeight]);
                this.setDirtyCanvas(true, true);
            }
        };

        // Override onResize to maintain height
        const origResize = nodeType.prototype.onResize;
        nodeType.prototype.onResize = function() {
            if (origResize) origResize.apply(this, arguments);

            if (!this._measuredHeight) return;

            if (this.size[1] !== this._measuredHeight) {
                this.setSize([this.size[0], this._measuredHeight]);
            }
        };

        // Override serialize to include our custom data
        const origSerialize = nodeType.prototype.serialize;
        nodeType.prototype.serialize = function() {
            const data = origSerialize ? origSerialize.apply(this) : {};
            data.properties = data.properties || {};
            data.properties._itemsData = this.properties._itemsData;
            return data;
        };

        // Override configure to restore our custom data
        const origConfigure = nodeType.prototype.configure;
        nodeType.prototype.configure = function(info) {
            if (origConfigure) origConfigure.apply(this, arguments);

            if (info.properties && info.properties._itemsData) {
                this.properties._itemsData = info.properties._itemsData;
            }

            if (this.syncItemsData) {
                this.syncItemsData();
            }
        };
    }
});

console.log("[List Filter Toggle] Extension loaded");
