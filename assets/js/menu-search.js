/**
 * Modern Admin Styler V2 - Menu Search & Custom Blocks
 * Advanced search functionality and custom HTML blocks management
 */

(function($) {
    'use strict';

    // Initialize when document is ready
    $(document).ready(function() {
        initMenuSearch();
        initCustomBlocks();
        initSearchHotkeys();
    });

    /**
     * Initialize menu search functionality
     */
    function initMenuSearch() {
        // Get search settings from PHP (we'll need to localize these)
        const searchEnabled = $('#menu_search_enabled').is(':checked');
        
        if (searchEnabled) {
            renderMenuSearch();
        }
        
        // Listen for changes to search enabled setting
        $('#menu_search_enabled').on('change', function() {
            if ($(this).is(':checked')) {
                renderMenuSearch();
            } else {
                removeMenuSearch();
            }
        });
        
        // Update search appearance when settings change
        $('#menu_search_style, #menu_search_position').on('change', updateSearchAppearance);
        $('#menu_search_background, #menu_search_text_color, #menu_search_border_color').on('change', updateSearchColors);
    }

    /**
     * Render the menu search box
     */
    function renderMenuSearch() {
        // Remove existing search if present
        removeMenuSearch();
        
        const position = $('#menu_search_position').val() || 'top';
        const style = $('#menu_search_style').val() || 'modern';
        const placeholder = $('#menu_search_placeholder').val() || 'Szukaj w menu...';
        const animation = $('#menu_search_animation').is(':checked');
        
        // Create search HTML
        const searchHTML = `
            <div class="mas-menu-search mas-search-${style}" data-animation="${animation}">
                <div class="mas-search-container">
                    ${style === 'modern' ? '<div class="mas-search-icon">🔍</div>' : ''}
                    <input type="text" 
                           class="mas-search-input" 
                           placeholder="${placeholder}"
                           autocomplete="off"
                           spellcheck="false">
                    <div class="mas-search-clear" title="Wyczyść">✕</div>
                </div>
                <div class="mas-search-results"></div>
            </div>
        `;
        
        // Insert search based on position
        const $adminMenu = $('#adminmenu');
        if (position === 'top') {
            $adminMenu.prepend(searchHTML);
        } else {
            $adminMenu.append(searchHTML);
        }
        
        // Initialize search functionality
        initSearchBehavior();
        updateSearchColors();
        
        // Animation on render
        if (animation) {
            $('.mas-menu-search').addClass('mas-search-animate-in');
        }
    }

    /**
     * Remove menu search
     */
    function removeMenuSearch() {
        $('.mas-menu-search').remove();
    }

    /**
     * Initialize search behavior and events
     */
    function initSearchBehavior() {
        const $searchInput = $('.mas-search-input');
        const $searchClear = $('.mas-search-clear');
        const $searchResults = $('.mas-search-results');
        const liveFilter = $('#menu_search_live_filter').is(':checked');
        const highlightMatches = $('#menu_search_highlight_matches').is(':checked');
        
        // Input event for live filtering
        $searchInput.on('input', function() {
            const query = $(this).val().toLowerCase().trim();
            
            if (query.length === 0) {
                clearSearch();
                return;
            }
            
            if (liveFilter) {
                performSearch(query, highlightMatches);
            }
            
            // Show/hide clear button
            $searchClear.toggle(query.length > 0);
        });
        
        // Enter key for search
        $searchInput.on('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = $(this).val().toLowerCase().trim();
                if (query.length > 0) {
                    performSearch(query, highlightMatches);
                }
            }
            
            // Escape to clear
            if (e.key === 'Escape') {
                clearSearch();
                $(this).blur();
            }
        });
        
        // Clear button
        $searchClear.on('click', clearSearch);
        
        // Focus/blur effects
        $searchInput.on('focus', function() {
            $('.mas-menu-search').addClass('mas-search-focused');
        }).on('blur', function() {
            // Delay to allow clicking on results
            setTimeout(() => {
                $('.mas-menu-search').removeClass('mas-search-focused');
            }, 150);
        });
    }

    /**
     * Perform search through menu items
     */
    function performSearch(query, highlightMatches) {
        const $menuItems = $('#adminmenu .menu-top');
        const $searchResults = $('.mas-search-results');
        let matchCount = 0;
        let resultsHTML = '';
        
        // Hide all menu items first
        $menuItems.hide();
        
        // Search through menu items
        $menuItems.each(function() {
            const $item = $(this);
            const $link = $item.find('> a');
            const text = $link.text().toLowerCase();
            const url = $link.attr('href') || '';
            
            if (text.includes(query)) {
                matchCount++;
                $item.show();
                
                // Add to results
                let displayText = $link.text();
                if (highlightMatches) {
                    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
                    displayText = displayText.replace(regex, '<mark>$1</mark>');
                }
                
                resultsHTML += `
                    <div class="mas-search-result" data-url="${url}">
                        <div class="mas-result-text">${displayText}</div>
                        <div class="mas-result-icon">${$item.find('.wp-menu-image').html() || '📄'}</div>
                    </div>
                `;
                
                // Highlight matches in actual menu
                if (highlightMatches) {
                    highlightTextInElement($link, query);
                }
            }
        });
        
        // Show results
        if (matchCount > 0) {
            $searchResults.html(`
                <div class="mas-search-header">
                    Znaleziono ${matchCount} ${matchCount === 1 ? 'element' : 'elementów'}
                </div>
                ${resultsHTML}
            `).show();
        } else {
            $searchResults.html(`
                <div class="mas-search-no-results">
                    <div class="mas-no-results-icon">🔍</div>
                    <div class="mas-no-results-text">Brak wyników dla "${query}"</div>
                </div>
            `).show();
        }
        
        // Bind result clicks
        $('.mas-search-result').on('click', function() {
            const url = $(this).data('url');
            if (url) {
                window.location.href = url;
            }
        });
    }

    /**
     * Clear search and restore menu
     */
    function clearSearch() {
        $('.mas-search-input').val('');
        $('.mas-search-clear').hide();
        $('.mas-search-results').hide();
        
        // Show all menu items
        $('#adminmenu .menu-top').show();
        
        // Remove highlights
        removeHighlights();
    }

    /**
     * Highlight text in element
     */
    function highlightTextInElement($element, query) {
        const text = $element.text();
        const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
        const highlightedText = text.replace(regex, '<mark class="mas-search-highlight">$1</mark>');
        
        // Store original text for restoration
        if (!$element.data('original-text')) {
            $element.data('original-text', text);
        }
        
        $element.html(highlightedText);
    }

    /**
     * Remove all highlights
     */
    function removeHighlights() {
        $('#adminmenu .menu-top a').each(function() {
            const $this = $(this);
            const originalText = $this.data('original-text');
            if (originalText) {
                $this.text(originalText);
            }
        });
    }

    /**
     * Escape regex special characters
     */
    function escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Update search appearance
     */
    function updateSearchAppearance() {
        if ($('.mas-menu-search').length) {
            renderMenuSearch(); // Re-render with new settings
        }
    }

    /**
     * Update search colors from settings
     */
    function updateSearchColors() {
        const background = $('#menu_search_background').val();
        const textColor = $('#menu_search_text_color').val();
        const borderColor = $('#menu_search_border_color').val();
        const focusColor = $('#menu_search_focus_color').val();
        const iconColor = $('#menu_search_icon_color').val();
        
        let css = '';
        
        if (background) {
            css += `.mas-menu-search .mas-search-input { background: ${background} !important; }`;
        }
        if (textColor) {
            css += `.mas-menu-search .mas-search-input { color: ${textColor} !important; }`;
            css += `.mas-menu-search .mas-search-input::placeholder { color: ${textColor}80 !important; }`;
        }
        if (borderColor) {
            css += `.mas-menu-search .mas-search-container { border-color: ${borderColor} !important; }`;
        }
        if (focusColor) {
            css += `.mas-menu-search.mas-search-focused .mas-search-container { border-color: ${focusColor} !important; box-shadow: 0 0 0 2px ${focusColor}40 !important; }`;
        }
        if (iconColor) {
            css += `.mas-menu-search .mas-search-icon { color: ${iconColor} !important; }`;
        }
        
        // Update or create style element
        $('#mas-search-custom-styles').remove();
        if (css) {
            $('<style id="mas-search-custom-styles">' + css + '</style>').appendTo('head');
        }
    }

    /**
     * Initialize search hotkeys
     */
    function initSearchHotkeys() {
        const hotkey = $('#menu_search_hotkey').val();
        if (!hotkey || hotkey === 'none') return;
        
        $(document).on('keydown', function(e) {
            let shouldTrigger = false;
            
            switch (hotkey) {
                case 'ctrl+k':
                    shouldTrigger = e.ctrlKey && e.key === 'k';
                    break;
                case 'ctrl+slash':
                    shouldTrigger = e.ctrlKey && e.key === '/';
                    break;
                case 'alt+s':
                    shouldTrigger = e.altKey && e.key === 's';
                    break;
            }
            
            if (shouldTrigger) {
                e.preventDefault();
                
                // Focus search if exists, or show notification
                const $searchInput = $('.mas-search-input');
                if ($searchInput.length) {
                    $searchInput.focus().select();
                    $('.mas-menu-search').addClass('mas-search-hotkey-activated');
                    setTimeout(() => {
                        $('.mas-menu-search').removeClass('mas-search-hotkey-activated');
                    }, 300);
                } else {
                    showSearchNotification('Wyszukiwarka menu jest wyłączona');
                }
            }
        });
    }

    /**
     * Show search notification
     */
    function showSearchNotification(message) {
        const notification = $(`
            <div class="mas-search-notification">
                ${message}
            </div>
        `);
        
        $('body').append(notification);
        
        setTimeout(() => {
            notification.addClass('mas-notification-show');
        }, 10);
        
        setTimeout(() => {
            notification.removeClass('mas-notification-show');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    /**
     * Initialize custom blocks functionality
     */
    function initCustomBlocks() {
        const blocksEnabled = $('#menu_custom_blocks_enabled').is(':checked');
        
        if (blocksEnabled) {
            renderCustomBlocks();
        }
        
        // Listen for changes
        $('#menu_custom_blocks_enabled').on('change', function() {
            if ($(this).is(':checked')) {
                renderCustomBlocks();
            } else {
                removeCustomBlocks();
            }
        });
        
        // Listen for individual block changes
        $('[name*="menu_custom_blocks"][name*="[enabled]"]').on('change', function() {
            if ($('#menu_custom_blocks_enabled').is(':checked')) {
                renderCustomBlocks();
            }
        });
    }

    /**
     * Render custom blocks in menu
     */
    function renderCustomBlocks() {
        removeCustomBlocks();
        
        const $adminMenu = $('#adminmenu');
        
        // Process each block
        for (let i = 1; i <= 3; i++) {
            const enabled = $(`input[name="menu_custom_blocks[block_${i}][enabled]"]`).is(':checked');
            if (!enabled) continue;
            
            const content = $(`textarea[name="menu_custom_blocks[block_${i}][content]"]`).val();
            const position = $(`select[name="menu_custom_blocks[block_${i}][position]"]`).val();
            const style = $(`select[name="menu_custom_blocks[block_${i}][style]"]`).val();
            const animation = $(`select[name="menu_custom_blocks[block_${i}][animation]"]`).val();
            
            if (!content.trim()) continue;
            
            const blockHTML = `
                <div class="mas-custom-block mas-block-${style} mas-block-${i}" 
                     data-animation="${animation}">
                    <div class="mas-block-content">
                        ${content}
                    </div>
                </div>
            `;
            
            // Insert based on position
            if (position === 'top') {
                $adminMenu.prepend(blockHTML);
            } else {
                $adminMenu.append(blockHTML);
            }
            
            // Apply animation
            if (animation !== 'none') {
                const $block = $(`.mas-block-${i}`);
                setTimeout(() => {
                    $block.addClass(`mas-animate-${animation}`);
                }, 100 * i); // Stagger animations
            }
        }
    }

    /**
     * Remove custom blocks
     */
    function removeCustomBlocks() {
        $('.mas-custom-block').remove();
    }

    /**
     * Update hotkey listener when setting changes
     */
    $(document).on('change', '#menu_search_hotkey', function() {
        // Re-initialize hotkeys with new setting
        $(document).off('keydown.mas-search');
        initSearchHotkeys();
    });

})(jQuery); 