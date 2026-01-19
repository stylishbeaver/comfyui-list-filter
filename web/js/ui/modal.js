/**
 * List Filter Modal Component
 *
 * Provides a modal dialog with dynamically generated checkboxes for filtering lists.
 * All checkboxes are selected by default (user preference).
 */

export class ListFilterModal {
    constructor() {
        this.modal = null;
        this.backdrop = null;
        this.checkboxContainer = null;
        this.items = [];
        this.selectedIndices = new Set();
        this.onApplyCallback = null;

        this.createModal();
        this.setupEventListeners();
    }

    /**
     * Create the modal HTML structure
     */
    createModal() {
        // Create backdrop
        this.backdrop = document.createElement('div');
        this.backdrop.className = 'list-filter-backdrop';
        this.backdrop.style.display = 'none';

        // Create modal
        this.modal = document.createElement('div');
        this.modal.className = 'list-filter-modal';
        this.modal.innerHTML = `
            <div class="list-filter-header">
                <h3>Filter List Items</h3>
                <button class="list-filter-close" aria-label="Close">&times;</button>
            </div>
            <div class="list-filter-body">
                <div class="list-filter-toolbar">
                    <button class="list-filter-btn" id="list-filter-select-all">Select All</button>
                    <button class="list-filter-btn" id="list-filter-deselect-all">Deselect All</button>
                    <span class="list-filter-count">0 items selected</span>
                </div>
                <div class="list-filter-checkboxes" id="list-filter-checkboxes">
                    <!-- Checkboxes will be dynamically inserted here -->
                </div>
                <div class="list-filter-message" id="list-filter-message"></div>
            </div>
            <div class="list-filter-footer">
                <button class="list-filter-btn list-filter-btn-secondary" id="list-filter-cancel">Cancel</button>
                <button class="list-filter-btn list-filter-btn-primary" id="list-filter-apply">Apply Filter</button>
            </div>
        `;

        this.backdrop.appendChild(this.modal);
        document.body.appendChild(this.backdrop);

        // Cache DOM elements
        this.checkboxContainer = document.getElementById('list-filter-checkboxes');
        this.messageElement = document.getElementById('list-filter-message');
        this.countElement = this.modal.querySelector('.list-filter-count');
    }

    /**
     * Setup event listeners for modal interactions
     */
    setupEventListeners() {
        // Close button
        this.modal.querySelector('.list-filter-close').addEventListener('click', () => {
            this.close();
        });

        // Cancel button
        document.getElementById('list-filter-cancel').addEventListener('click', () => {
            this.close();
        });

        // Apply button
        document.getElementById('list-filter-apply').addEventListener('click', () => {
            this.apply();
        });

        // Select All button
        document.getElementById('list-filter-select-all').addEventListener('click', () => {
            this.selectAll();
        });

        // Deselect All button
        document.getElementById('list-filter-deselect-all').addEventListener('click', () => {
            this.deselectAll();
        });

        // Backdrop click to close
        this.backdrop.addEventListener('click', (e) => {
            if (e.target === this.backdrop) {
                this.close();
            }
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.backdrop.style.display === 'block') {
                this.close();
            }
        });
    }

    /**
     * Open modal with list of items
     * @param {Array} items - Array of items to display as checkboxes
     * @param {Function} onApply - Callback function when Apply is clicked
     */
    open(items, onApply) {
        if (!Array.isArray(items)) {
            this.showMessage('Error: Invalid list provided', 'error');
            return;
        }

        if (items.length === 0) {
            this.showMessage('No items to filter', 'info');
            return;
        }

        this.items = items;
        this.onApplyCallback = onApply;

        // All selected by default (user preference)
        this.selectedIndices = new Set([...items.keys()]);

        this.render();
        this.backdrop.style.display = 'block';
        this.hideMessage();
    }

    /**
     * Close the modal
     */
    close() {
        this.backdrop.style.display = 'none';
        this.checkboxContainer.innerHTML = '';
        this.items = [];
        this.selectedIndices.clear();
        this.onApplyCallback = null;
    }

    /**
     * Render checkboxes dynamically based on items
     */
    render() {
        // Clear previous checkboxes
        this.checkboxContainer.innerHTML = '';

        // Create checkbox for each item
        this.items.forEach((item, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'checkbox-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `list-filter-item-${index}`;
            checkbox.checked = this.selectedIndices.has(index);
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.selectedIndices.add(index);
                } else {
                    this.selectedIndices.delete(index);
                }
                this.updateCount();
            });

            const label = document.createElement('label');
            label.htmlFor = `list-filter-item-${index}`;
            label.textContent = String(item);

            wrapper.appendChild(checkbox);
            wrapper.appendChild(label);
            this.checkboxContainer.appendChild(wrapper);
        });

        this.updateCount();
    }

    /**
     * Update the selected count display
     */
    updateCount() {
        const count = this.selectedIndices.size;
        this.countElement.textContent = `${count} ${count === 1 ? 'item' : 'items'} selected`;
    }

    /**
     * Select all checkboxes
     */
    selectAll() {
        this.selectedIndices = new Set([...this.items.keys()]);
        this.items.forEach((_, index) => {
            const checkbox = document.getElementById(`list-filter-item-${index}`);
            if (checkbox) checkbox.checked = true;
        });
        this.updateCount();
    }

    /**
     * Deselect all checkboxes
     */
    deselectAll() {
        this.selectedIndices.clear();
        this.items.forEach((_, index) => {
            const checkbox = document.getElementById(`list-filter-item-${index}`);
            if (checkbox) checkbox.checked = false;
        });
        this.updateCount();
    }

    /**
     * Show a message to the user
     * @param {string} message - Message text
     * @param {string} type - Message type: 'info', 'error', 'warning'
     */
    showMessage(message, type = 'info') {
        this.messageElement.textContent = message;
        this.messageElement.className = `list-filter-message list-filter-message-${type}`;
        this.messageElement.style.display = 'block';
    }

    /**
     * Hide the message
     */
    hideMessage() {
        this.messageElement.style.display = 'none';
    }

    /**
     * Apply the filter and call callback
     */
    async apply() {
        if (this.selectedIndices.size === 0) {
            this.showMessage('Warning: No items selected. Output will be empty.', 'warning');
            return;
        }

        try {
            // Send to backend API
            const response = await fetch('/list_filter/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: this.items,
                    selected_indices: Array.from(this.selectedIndices).sort((a, b) => a - b)
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Filter request failed');
            }

            const result = await response.json();

            // Call callback with filtered result
            if (this.onApplyCallback) {
                this.onApplyCallback(result.filtered);
            }

            this.close();
        } catch (error) {
            this.showMessage(`Error: ${error.message}`, 'error');
            console.error('[List Filter] Apply error:', error);
        }
    }
}
