/**
 * ComfyUI List Filter Extension
 *
 * Adds a "List Filter" button to ComfyUI menu that opens a modal with dynamic checkboxes.
 * Integrates with ComfyUI workflow through ListFilterInput and ListFilterOutput nodes.
 */

import { app } from "../../scripts/app.js";
import { ListFilterModal } from "./ui/modal.js";

// Global modal instance
let listFilterModal = null;

// Add CSS
function addStyles() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = '/extensions/comfyui-list-filter/css/style.css';
    document.head.appendChild(link);
}

// Find ListFilterInput node and extract items
function getListFromNode(node) {
    if (!node) {
        return null;
    }

    // Check if it's a ListFilterInput node
    if (node.type === "ListFilterInput") {
        // Get the items_json widget value
        const widget = node.widgets?.find(w => w.name === "items_json");
        if (widget && widget.value) {
            try {
                const items = JSON.parse(widget.value);
                if (Array.isArray(items)) {
                    return items;
                }
            } catch (e) {
                console.error("[List Filter] Invalid JSON in node:", e);
                return null;
            }
        }
    }

    return null;
}

// Update node with filtered results
function updateNodeWithFilteredList(node, filteredItems) {
    if (!node) return;

    // Find connected ListFilterOutput node
    if (node.outputs && node.outputs[0]) {
        const output = node.outputs[0];
        if (output.links && output.links.length > 0) {
            // Update the output value
            const filteredJson = JSON.stringify(filteredItems);

            // Find connected nodes
            output.links.forEach(linkId => {
                const link = app.graph.links[linkId];
                if (link) {
                    const targetNode = app.graph.getNodeById(link.target_id);
                    if (targetNode && targetNode.type === "ListFilterOutput") {
                        // Update the target node's input
                        const widget = targetNode.widgets?.find(w => w.name === "filtered_json");
                        if (widget) {
                            widget.value = filteredJson;
                        }
                    }
                }
            });

            console.log("[List Filter] Applied filter:", filteredItems);
        }
    }
}

// Register extension with ComfyUI
app.registerExtension({
    name: "ListFilter",

    async setup() {
        console.log("[List Filter] Setting up extension");

        // Load CSS
        addStyles();

        // Create modal instance
        listFilterModal = new ListFilterModal();

        // Add button to ComfyUI menu
        const menuDiv = document.querySelector(".comfy-menu");
        if (menuDiv) {
            const listFilterButton = document.createElement("button");
            listFilterButton.textContent = "List Filter";
            listFilterButton.className = "comfy-queue-btn";
            listFilterButton.title = "Open List Filter Modal";

            listFilterButton.onclick = () => {
                // Get selected node
                const selectedNodes = app.canvas.selected_nodes;
                if (!selectedNodes || Object.keys(selectedNodes).length === 0) {
                    alert("Please select a ListFilterInput node first");
                    return;
                }

                // Get the first selected node
                const nodeId = Object.keys(selectedNodes)[0];
                const selectedNode = selectedNodes[nodeId];

                // Extract list from node
                const items = getListFromNode(selectedNode);

                if (!items) {
                    alert("Selected node must be a ListFilterInput node with valid JSON array");
                    return;
                }

                // Open modal with items
                listFilterModal.open(items, (filteredItems) => {
                    // Update the connected output node
                    updateNodeWithFilteredList(selectedNode, filteredItems);

                    // Force canvas redraw
                    app.graph.setDirtyCanvas(true, true);
                });
            };

            menuDiv.appendChild(listFilterButton);
            console.log("[List Filter] Menu button added");
        } else {
            console.warn("[List Filter] Could not find .comfy-menu element");
        }
    },

    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        // Add custom behavior to ListFilterInput nodes if needed
        if (nodeData.name === "ListFilterInput") {
            console.log("[List Filter] Registered ListFilterInput node type");
        }
    }
});

console.log("[List Filter] Extension loaded");
