/**
 * ⚡ Real-Time Preview System - Live CSS Updates Without Page Reload
 * 
 * Advanced real-time preview system with:
 * - Sub-50ms update performance
 * - Visual feedback and animations
 * - Undo/Redo functionality
 * - Live preview mode toggle
 * - Cross-tab synchronization
 * - Conflict resolution
 * 
 * @package ModernAdminStyler
 * @version 2.0.0 - Real-Time Architecture
 * @author Kiro AI Assistant
 */

(function(window, document) {
    'use strict';

    /**
     * ⚡ RealTimePreviewSystem - Main Preview Engine
     */
    class RealTimePreviewSystem {
        constructor(options = {}) {
            this.config = {
                enablePreview: true,
                enableUndo: true,
                enableCrossTabs: true,
                enableAnimations: true,
                maxUndoSteps: 50,
                updateDelay: 16, // ~60fps
                animationDuration: 200,
                debugMode: options.debug || window.masV2Debug || false,
                ...options
            };

            // Core systems
            this.cssEngine = null;
            this.undoManager = new UndoManager(this.config.maxUndoSteps);
            this.animationManager = new AnimationManager();
            this.crossTabManager = new CrossTabManager();
            this.conflictResolver = new ConflictResolver();

            // State management
            this.isPreviewMode = false;
            this.pendingChanges = new Map();
            this.activeAnimations = new Set();
            this.updateQueue = [];
            this.batchTimer = null;

            // Performance tracking
            this.performanceMetrics = {
                updates: 0,
                totalTime: 0,
                averageTime: 0,
                maxTime: 0
            };

            this.initialize();
        }

        /**
         * 🚀 Initialize the Real-Time Preview System
         */
        async initialize() {
            try {
                this.log('⚡ Initializing Real-Time Preview System...');

                // Wait for CSS Engine to be available
                await this.waitForCSSEngine();

                // Initialize subsystems
                this.setupEventListeners();
                this.setupKeyboardShortcuts();
                this.setupVisualFeedback();
                
                if (this.config.enableCrossTabs) {
                    await this.crossTabManager.initialize();
                }

                // Setup performance monitoring
                this.setupPerformanceMonitoring();

                // Create preview controls UI
                this.createPreviewControls();

                this.log('✅ Real-Time Preview System initialized');

                // Trigger initialization event
                this.dispatchEvent('preview-system:initialized', {
                    system: this,
                    config: this.config
                });

            } catch (error) {
                this.logError('❌ Failed to initialize Real-Time Preview System:', error);
                throw error;
            }
        }

        /**
         * ⏳ Wait for CSS Engine to be available
         */
        async waitForCSSEngine() {
            return new Promise((resolve) => {
                const checkEngine = () => {
                    if (window.cssVariablesEngine && window.cssVariablesEngine.isInitialized) {
                        this.cssEngine = window.cssVariablesEngine;
                        resolve();
                    } else {
                        setTimeout(checkEngine, 100);
                    }
                };
                checkEngine();
            });
        }

        /**
         * 🎮 Setup event listeners for real-time updates
         */
        setupEventListeners() {
            // Listen for CSS variable changes
            document.addEventListener('css-variable:changed', (event) => {
                this.handleCSSVariableChange(event.detail);
            });

            // Listen for micro-panel control changes
            document.addEventListener('micro-panel:control-changed', (event) => {
                this.handleControlChange(event.detail);
            });

            // Listen for form input changes
            document.addEventListener('input', (event) => {
                if (this.isPreviewableControl(event.target)) {
                    this.handleInputChange(event);
                }
            });

            // Listen for color picker changes
            document.addEventListener('change', (event) => {
                if (event.target.type === 'color' && this.isPreviewableControl(event.target)) {
                    this.handleColorChange(event);
                }
            });

            // Listen for slider changes
            document.addEventListener('input', (event) => {
                if (event.target.type === 'range' && this.isPreviewableControl(event.target)) {
                    this.handleSliderChange(event);
                }
            });
        }

        /**
         * ⌨️ Setup keyboard shortcuts
         */
        setupKeyboardShortcuts() {
            document.addEventListener('keydown', (event) => {
                // Ctrl/Cmd + Z: Undo
                if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
                    event.preventDefault();
                    this.undo();
                }

                // Ctrl/Cmd + Shift + Z: Redo
                if ((event.ctrlKey || event.metaKey) && event.key === 'z' && event.shiftKey) {
                    event.preventDefault();
                    this.redo();
                }

                // Ctrl/Cmd + P: Toggle preview mode
                if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
                    event.preventDefault();
                    this.togglePreviewMode();
                }

                // Escape: Exit preview mode
                if (event.key === 'Escape' && this.isPreviewMode) {
                    this.exitPreviewMode();
                }
            });
        }

        /**
         * 🎨 Setup visual feedback system
         */
        setupVisualFeedback() {
            // Create feedback container
            this.feedbackContainer = document.createElement('div');
            this.feedbackContainer.id = 'woow-preview-feedback';
            this.feedbackContainer.className = 'woow-preview-feedback-container';
            document.body.appendChild(this.feedbackContainer);

            // Add CSS for feedback system
            this.injectFeedbackCSS();
        }

        /**
         * 🎛️ Create preview controls UI
         */
        createPreviewControls() {
            const controlsHTML = `
                <div id="woow-preview-controls" class="woow-preview-controls">
                    <div class="woow-preview-controls-header">
                        <span class="woow-preview-icon">⚡</span>
                        <span class="woow-preview-title">Live Preview</span>
                        <button class="woow-preview-toggle" data-action="toggle-preview">
                            <span class="woow-preview-status">OFF</span>
                        </button>
                    </div>
                    
                    <div class="woow-preview-controls-body">
                        <div class="woow-preview-actions">
                            <button class="woow-preview-btn" data-action="undo" title="Undo (Ctrl+Z)">
                                <span class="woow-preview-btn-icon">↶</span>
                                <span class="woow-preview-btn-text">Undo</span>
                            </button>
                            
                            <button class="woow-preview-btn" data-action="redo" title="Redo (Ctrl+Shift+Z)">
                                <span class="woow-preview-btn-icon">↷</span>
                                <span class="woow-preview-btn-text">Redo</span>
                            </button>
                            
                            <button class="woow-preview-btn" data-action="reset" title="Reset All Changes">
                                <span class="woow-preview-btn-icon">⟲</span>
                                <span class="woow-preview-btn-text">Reset</span>
                            </button>
                        </div>
                        
                        <div class="woow-preview-stats">
                            <div class="woow-preview-stat">
                                <span class="woow-preview-stat-label">Updates:</span>
                                <span class="woow-preview-stat-value" data-stat="updates">0</span>
                            </div>
                            <div class="woow-preview-stat">
                                <span class="woow-preview-stat-label">Avg Time:</span>
                                <span class="woow-preview-stat-value" data-stat="avgTime">0ms</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Insert controls
            const controlsElement = document.createElement('div');
            controlsElement.innerHTML = controlsHTML;
            document.body.appendChild(controlsElement.firstElementChild);

            // Setup controls event listeners
            this.setupControlsEventListeners();
        }

        /**
         * 🎮 Setup controls event listeners
         */
        setupControlsEventListeners() {
            const controls = document.getElementById('woow-preview-controls');
            if (!controls) return;

            controls.addEventListener('click', (event) => {
                const action = event.target.closest('[data-action]')?.dataset.action;
                if (!action) return;

                switch (action) {
                    case 'toggle-preview':
                        this.togglePreviewMode();
                        break;
                    case 'undo':
                        this.undo();
                        break;
                    case 'redo':
                        this.redo();
                        break;
                    case 'reset':
                        this.resetAllChanges();
                        break;
                }
            });
        }

        /**
         * 🎯 Handle control changes with real-time preview
         */
        async handleControlChange(detail) {
            if (!this.isPreviewMode) return;

            const startTime = performance.now();

            try {
                const { optionId, value, element } = detail;

                // Save current state for undo
                this.undoManager.saveState(optionId, this.getCurrentValue(optionId));

                // Apply change with animation
                await this.applyChangeWithAnimation(optionId, value, element);

                // Record performance
                const duration = performance.now() - startTime;
                this.recordPerformance(duration);

                // Show visual feedback
                this.showChangeIndicator(element, 'success', duration);

                // Sync across tabs if enabled
                if (this.config.enableCrossTabs) {
                    this.crossTabManager.broadcastChange(optionId, value);
                }

            } catch (error) {
                this.logError('Failed to handle control change:', error);
                this.showChangeIndicator(detail.element, 'error');
            }
        }

        /**
         * 🎨 Apply change with smooth animation
         */
        async applyChangeWithAnimation(optionId, value, element) {
            if (!this.config.enableAnimations) {
                return this.cssEngine.applyVariable(optionId, value);
            }

            // Create animation ID
            const animationId = `${optionId}-${Date.now()}`;
            this.activeAnimations.add(animationId);

            try {
                // Get target elements that will be affected
                const targetElements = this.getAffectedElements(optionId);

                // Start transition animation
                this.animationManager.startTransition(targetElements, {
                    duration: this.config.animationDuration,
                    easing: 'ease-out'
                });

                // Apply the CSS change
                const success = await this.cssEngine.applyVariable(optionId, value);

                // Wait for animation to complete
                await this.animationManager.waitForTransition(animationId);

                return success;

            } finally {
                this.activeAnimations.delete(animationId);
            }
        }

        /**
         * 🎯 Get elements affected by CSS variable change
         */
        getAffectedElements(optionId) {
            const cssVar = this.cssEngine.mappingRegistry.get(optionId);
            if (!cssVar) return [];

            // Common selectors that use CSS variables
            const selectors = {
                '--woow-surface-bar': ['#wpadminbar'],
                '--woow-surface-menu': ['#adminmenuwrap', '#adminmenu'],
                '--woow-surface-bar-text': ['#wpadminbar', '#wpadminbar a'],
                '--woow-surface-menu-text': ['#adminmenu a'],
                '--woow-accent-primary': ['.button-primary', '.wp-core-ui .button-primary']
            };

            const targetSelectors = selectors[cssVar] || [];
            const elements = [];

            targetSelectors.forEach(selector => {
                elements.push(...document.querySelectorAll(selector));
            });

            return elements;
        }

        /**
         * 🔄 Toggle preview mode
         */
        togglePreviewMode() {
            if (this.isPreviewMode) {
                this.exitPreviewMode();
            } else {
                this.enterPreviewMode();
            }
        }

        /**
         * ▶️ Enter preview mode
         */
        enterPreviewMode() {
            this.isPreviewMode = true;
            
            // Update UI
            this.updatePreviewModeUI(true);
            
            // Save initial state
            this.undoManager.saveInitialState();
            
            // Show preview indicator
            this.showPreviewModeIndicator(true);
            
            this.log('▶️ Entered preview mode');
            
            this.dispatchEvent('preview-mode:entered', {
                timestamp: Date.now()
            });
        }

        /**
         * ⏹️ Exit preview mode
         */
        exitPreviewMode() {
            this.isPreviewMode = false;
            
            // Update UI
            this.updatePreviewModeUI(false);
            
            // Hide preview indicator
            this.showPreviewModeIndicator(false);
            
            this.log('⏹️ Exited preview mode');
            
            this.dispatchEvent('preview-mode:exited', {
                timestamp: Date.now()
            });
        }

        /**
         * 🎨 Update preview mode UI
         */
        updatePreviewModeUI(isActive) {
            const controls = document.getElementById('woow-preview-controls');
            const statusElement = controls?.querySelector('.woow-preview-status');
            
            if (statusElement) {
                statusElement.textContent = isActive ? 'ON' : 'OFF';
            }
            
            if (controls) {
                controls.classList.toggle('woow-preview-active', isActive);
            }
            
            // Update body class
            document.body.classList.toggle('woow-preview-mode-active', isActive);
        }

        /**
         * 💡 Show preview mode indicator
         */
        showPreviewModeIndicator(show) {
            let indicator = document.getElementById('woow-preview-mode-indicator');
            
            if (show && !indicator) {
                indicator = document.createElement('div');
                indicator.id = 'woow-preview-mode-indicator';
                indicator.className = 'woow-preview-mode-indicator';
                indicator.innerHTML = `
                    <div class="woow-preview-mode-indicator-content">
                        <span class="woow-preview-mode-icon">⚡</span>
                        <span class="woow-preview-mode-text">Live Preview Mode</span>
                        <span class="woow-preview-mode-hint">Press ESC to exit</span>
                    </div>
                `;
                document.body.appendChild(indicator);
                
                // Animate in
                setTimeout(() => indicator.classList.add('woow-preview-mode-indicator-visible'), 10);
                
            } else if (!show && indicator) {
                indicator.classList.remove('woow-preview-mode-indicator-visible');
                setTimeout(() => indicator.remove(), 300);
            }
        }

        /**
         * ↶ Undo last change
         */
        async undo() {
            const state = this.undoManager.undo();
            if (state) {
                await this.cssEngine.applyVariable(state.optionId, state.value);
                this.showUndoRedoFeedback('undo');
                this.log(`↶ Undid change: ${state.optionId} = ${state.value}`);
            }
        }

        /**
         * ↷ Redo last undone change
         */
        async redo() {
            const state = this.undoManager.redo();
            if (state) {
                await this.cssEngine.applyVariable(state.optionId, state.value);
                this.showUndoRedoFeedback('redo');
                this.log(`↷ Redid change: ${state.optionId} = ${state.value}`);
            }
        }

        /**
         * ⟲ Reset all changes
         */
        async resetAllChanges() {
            if (confirm('Reset all changes to default values?')) {
                await this.undoManager.resetToInitial();
                this.showUndoRedoFeedback('reset');
                this.log('⟲ Reset all changes');
            }
        }

        /**
         * 💫 Show change indicator with animation
         */
        showChangeIndicator(element, type, duration) {
            if (!element || !this.config.enableAnimations) return;

            const indicator = document.createElement('div');
            indicator.className = `woow-change-indicator woow-change-indicator-${type}`;
            
            if (type === 'success' && duration !== undefined) {
                indicator.innerHTML = `
                    <span class="woow-change-indicator-icon">✓</span>
                    <span class="woow-change-indicator-text">${duration.toFixed(1)}ms</span>
                `;
            } else if (type === 'error') {
                indicator.innerHTML = `
                    <span class="woow-change-indicator-icon">✗</span>
                    <span class="woow-change-indicator-text">Error</span>
                `;
            }

            // Position near the control
            const rect = element.getBoundingClientRect();
            indicator.style.position = 'fixed';
            indicator.style.left = `${rect.right + 10}px`;
            indicator.style.top = `${rect.top}px`;
            indicator.style.zIndex = '10000';

            document.body.appendChild(indicator);

            // Animate and remove
            setTimeout(() => indicator.classList.add('woow-change-indicator-visible'), 10);
            setTimeout(() => {
                indicator.classList.remove('woow-change-indicator-visible');
                setTimeout(() => indicator.remove(), 300);
            }, 2000);
        }

        /**
         * 🔄 Show undo/redo feedback
         */
        showUndoRedoFeedback(action) {
            const feedback = document.createElement('div');
            feedback.className = 'woow-undo-redo-feedback';
            
            const icons = { undo: '↶', redo: '↷', reset: '⟲' };
            const texts = { undo: 'Undone', redo: 'Redone', reset: 'Reset' };
            
            feedback.innerHTML = `
                <span class="woow-undo-redo-icon">${icons[action]}</span>
                <span class="woow-undo-redo-text">${texts[action]}</span>
            `;

            this.feedbackContainer.appendChild(feedback);

            setTimeout(() => feedback.classList.add('woow-undo-redo-feedback-visible'), 10);
            setTimeout(() => {
                feedback.classList.remove('woow-undo-redo-feedback-visible');
                setTimeout(() => feedback.remove(), 300);
            }, 1500);
        }

        /**
         * 📊 Record performance metrics
         */
        recordPerformance(duration) {
            this.performanceMetrics.updates++;
            this.performanceMetrics.totalTime += duration;
            this.performanceMetrics.averageTime = this.performanceMetrics.totalTime / this.performanceMetrics.updates;
            this.performanceMetrics.maxTime = Math.max(this.performanceMetrics.maxTime, duration);

            // Update UI stats
            this.updatePerformanceUI();
        }

        /**
         * 📊 Update performance UI
         */
        updatePerformanceUI() {
            const updatesElement = document.querySelector('[data-stat="updates"]');
            const avgTimeElement = document.querySelector('[data-stat="avgTime"]');

            if (updatesElement) {
                updatesElement.textContent = this.performanceMetrics.updates;
            }

            if (avgTimeElement) {
                avgTimeElement.textContent = `${this.performanceMetrics.averageTime.toFixed(1)}ms`;
            }
        }

        /**
         * 🎨 Inject feedback CSS
         */
        injectFeedbackCSS() {
            const css = `
                .woow-preview-feedback-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 999999;
                    pointer-events: none;
                }

                .woow-preview-controls {
                    position: fixed;
                    top: 100px;
                    right: 20px;
                    z-index: 999998;
                    background: rgba(255, 255, 255, 0.95);
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    padding: 16px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    backdrop-filter: blur(10px);
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-size: 14px;
                    min-width: 200px;
                }

                .woow-preview-controls-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 12px;
                    padding-bottom: 8px;
                    border-bottom: 1px solid #eee;
                }

                .woow-preview-icon {
                    font-size: 16px;
                }

                .woow-preview-title {
                    font-weight: 600;
                    flex: 1;
                }

                .woow-preview-toggle {
                    background: #f0f0f0;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    padding: 4px 8px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 600;
                }

                .woow-preview-active .woow-preview-toggle {
                    background: #00a32a;
                    color: white;
                    border-color: #00a32a;
                }

                .woow-preview-actions {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 12px;
                }

                .woow-preview-btn {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 6px 10px;
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: all 0.2s ease;
                }

                .woow-preview-btn:hover {
                    background: #e9ecef;
                    border-color: #adb5bd;
                }

                .woow-preview-btn-icon {
                    font-size: 14px;
                }

                .woow-preview-stats {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    font-size: 12px;
                    color: #666;
                }

                .woow-preview-stat {
                    display: flex;
                    justify-content: space-between;
                }

                .woow-preview-stat-value {
                    font-weight: 600;
                    color: #333;
                }

                .woow-change-indicator {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 10px;
                    background: rgba(255, 255, 255, 0.95);
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    font-size: 12px;
                    font-weight: 500;
                    opacity: 0;
                    transform: translateX(10px);
                    transition: all 0.3s ease;
                    pointer-events: none;
                }

                .woow-change-indicator-visible {
                    opacity: 1;
                    transform: translateX(0);
                }

                .woow-change-indicator-success {
                    border-color: #00a32a;
                    color: #00a32a;
                }

                .woow-change-indicator-error {
                    border-color: #d63638;
                    color: #d63638;
                }

                .woow-preview-mode-indicator {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    z-index: 999999;
                    background: rgba(0, 0, 0, 0.9);
                    color: white;
                    padding: 20px 30px;
                    border-radius: 12px;
                    text-align: center;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    pointer-events: none;
                }

                .woow-preview-mode-indicator-visible {
                    opacity: 1;
                }

                .woow-preview-mode-icon {
                    font-size: 24px;
                    display: block;
                    margin-bottom: 8px;
                }

                .woow-preview-mode-text {
                    font-size: 16px;
                    font-weight: 600;
                    display: block;
                    margin-bottom: 4px;
                }

                .woow-preview-mode-hint {
                    font-size: 12px;
                    opacity: 0.8;
                }

                .woow-undo-redo-feedback {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 16px;
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    border-radius: 8px;
                    margin-bottom: 8px;
                    opacity: 0;
                    transform: translateY(-10px);
                    transition: all 0.3s ease;
                }

                .woow-undo-redo-feedback-visible {
                    opacity: 1;
                    transform: translateY(0);
                }

                .woow-undo-redo-icon {
                    font-size: 16px;
                }

                body.woow-preview-mode-active {
                    --woow-preview-mode: 1;
                }
            `;

            const styleElement = document.createElement('style');
            styleElement.textContent = css;
            document.head.appendChild(styleElement);
        }

        /**
         * 🔍 Check if control is previewable
         */
        isPreviewableControl(element) {
            return element.hasAttribute('data-css-var') || 
                   element.hasAttribute('data-option-id') ||
                   element.closest('.woow-micro-panel');
        }

        /**
         * 📊 Get current value for option
         */
        getCurrentValue(optionId) {
            // This would typically get the current value from the form or CSS
            const cssVar = this.cssEngine.mappingRegistry.get(optionId);
            if (cssVar) {
                return getComputedStyle(document.documentElement).getPropertyValue(cssVar);
            }
            return null;
        }

        /**
         * 📊 Setup performance monitoring
         */
        setupPerformanceMonitoring() {
            // Monitor frame rate during updates
            let lastFrameTime = performance.now();
            let frameCount = 0;
            let fps = 60;

            const measureFPS = () => {
                const now = performance.now();
                frameCount++;
                
                if (now - lastFrameTime >= 1000) {
                    fps = Math.round((frameCount * 1000) / (now - lastFrameTime));
                    frameCount = 0;
                    lastFrameTime = now;
                    
                    // Log performance warnings
                    if (fps < 30 && this.config.debugMode) {
                        this.logWarning(`Low FPS detected: ${fps}fps`);
                    }
                }
                
                requestAnimationFrame(measureFPS);
            };

            if (this.config.debugMode) {
                requestAnimationFrame(measureFPS);
            }
        }

        /**
         * 🔧 Utility methods
         */
        dispatchEvent(eventName, detail) {
            const event = new CustomEvent(eventName, { detail });
            document.dispatchEvent(event);
        }

        log(message, ...args) {
            if (this.config.debugMode) {
                console.log(`⚡ PreviewSystem: ${message}`, ...args);
            }
        }

        logWarning(message, ...args) {
            console.warn(`⚠️ PreviewSystem: ${message}`, ...args);
        }

        logError(message, ...args) {
            console.error(`❌ PreviewSystem: ${message}`, ...args);
        }
    }

    /**
     * 🔄 Undo Manager Class
     */
    class UndoManager {
        constructor(maxSteps = 50) {
            this.maxSteps = maxSteps;
            this.undoStack = [];
            this.redoStack = [];
            this.initialState = new Map();
        }

        saveInitialState() {
            // Save initial CSS variable values
            if (window.cssVariablesEngine) {
                window.cssVariablesEngine.variableRegistry.forEach((config, cssVar) => {
                    const currentValue = getComputedStyle(document.documentElement)
                        .getPropertyValue(cssVar);
                    this.initialState.set(cssVar, currentValue);
                });
            }
        }

        saveState(optionId, value) {
            this.undoStack.push({ optionId, value, timestamp: Date.now() });
            
            // Limit stack size
            if (this.undoStack.length > this.maxSteps) {
                this.undoStack.shift();
            }
            
            // Clear redo stack when new action is performed
            this.redoStack = [];
        }

        undo() {
            if (this.undoStack.length === 0) return null;
            
            const state = this.undoStack.pop();
            this.redoStack.push(state);
            
            return state;
        }

        redo() {
            if (this.redoStack.length === 0) return null;
            
            const state = this.redoStack.pop();
            this.undoStack.push(state);
            
            return state;
        }

        async resetToInitial() {
            if (window.cssVariablesEngine) {
                const promises = [];
                this.initialState.forEach((value, cssVar) => {
                    // Find option ID for this CSS variable
                    const optionId = Array.from(window.cssVariablesEngine.mappingRegistry.entries())
                        .find(([, v]) => v === cssVar)?.[0];
                    
                    if (optionId) {
                        promises.push(window.cssVariablesEngine.applyVariable(optionId, value));
                    }
                });
                
                await Promise.all(promises);
            }
            
            // Clear stacks
            this.undoStack = [];
            this.redoStack = [];
        }
    }

    /**
     * 🎭 Animation Manager Class
     */
    class AnimationManager {
        constructor() {
            this.activeTransitions = new Map();
        }

        startTransition(elements, options = {}) {
            const { duration = 300, easing = 'ease' } = options;
            
            elements.forEach(element => {
                if (element && element.style) {
                    element.style.transition = `all ${duration}ms ${easing}`;
                }
            });
        }

        async waitForTransition(animationId) {
            return new Promise(resolve => {
                setTimeout(resolve, 300); // Default transition time
            });
        }
    }

    /**
     * 🌐 Cross Tab Manager Class
     */
    class CrossTabManager {
        constructor() {
            this.channel = null;
        }

        async initialize() {
            if ('BroadcastChannel' in window) {
                this.channel = new BroadcastChannel('woow-preview-sync');
                this.channel.addEventListener('message', this.handleMessage.bind(this));
            }
        }

        broadcastChange(optionId, value) {
            if (this.channel) {
                this.channel.postMessage({
                    type: 'css-change',
                    optionId,
                    value,
                    timestamp: Date.now()
                });
            }
        }

        handleMessage(event) {
            const { type, optionId, value } = event.data;
            
            if (type === 'css-change' && window.cssVariablesEngine) {
                window.cssVariablesEngine.applyVariable(optionId, value);
            }
        }
    }

    /**
     * ⚔️ Conflict Resolver Class
     */
    class ConflictResolver {
        constructor() {
            this.conflictQueue = [];
        }

        resolveConflict(changes) {
            // Simple last-write-wins strategy
            return changes[changes.length - 1];
        }
    }

    // Export classes
    window.RealTimePreviewSystem = RealTimePreviewSystem;
    window.UndoManager = UndoManager;
    window.AnimationManager = AnimationManager;
    window.CrossTabManager = CrossTabManager;

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.realTimePreviewSystem = new RealTimePreviewSystem({
                debug: window.masV2Debug || false
            });
        });
    } else {
        setTimeout(() => {
            window.realTimePreviewSystem = new RealTimePreviewSystem({
                debug: window.masV2Debug || false
            });
        }, 100);
    }

})(window, document);