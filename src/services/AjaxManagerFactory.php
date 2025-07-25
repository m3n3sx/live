<?php
/**
 * AJAX Manager Factory - Creates and manages AJAX system instances
 * 
 * Provides factory methods to create and configure the unified AJAX system
 * with proper dependency injection and service initialization.
 * 
 * @package ModernAdminStyler
 * @version 2.4.0 - Security Overhaul
 */

namespace ModernAdminStyler\Services;

require_once __DIR__ . '/UnifiedAjaxManager.php';

class AjaxManagerFactory {
    
    private static $instance = null;
    private static $unified_manager = null;
    
    /**
     * Get singleton instance
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Create unified AJAX manager with proper dependencies
     * 
     * @param object $settings_manager Settings manager instance
     * @return UnifiedAjaxManager
     */
    public function createUnifiedManager($settings_manager) {
        if (self::$unified_manager === null) {
            self::$unified_manager = new UnifiedAjaxManager($settings_manager);
        }
        return self::$unified_manager;
    }
    
    /**
     * Get existing unified manager instance
     * 
     * @return UnifiedAjaxManager|null
     */
    public function getUnifiedManager() {
        return self::$unified_manager;
    }
    
    /**
     * Initialize AJAX system for plugin
     * 
     * @param object $settings_manager Settings manager instance
     * @return UnifiedAjaxManager
     */
    public static function initialize($settings_manager) {
        $factory = self::getInstance();
        return $factory->createUnifiedManager($settings_manager);
    }
    
    /**
     * Check if unified manager is initialized
     * 
     * @return bool
     */
    public static function isInitialized() {
        return self::$unified_manager !== null;
    }
    
    /**
     * Reset factory (for testing)
     */
    public static function reset() {
        self::$instance = null;
        self::$unified_manager = null;
    }
}