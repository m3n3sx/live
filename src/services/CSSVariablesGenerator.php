<?php
/**
 * CSS Variables Generator - Dynamic CSS Variables System
 * 
 * FAZA 5: Advanced Performance & UX
 * Inteligentny generator zmiennych CSS z automatycznym obliczaniem
 * 
 * @package ModernAdminStyler
 * @version 3.2.0
 */

namespace ModernAdminStyler\Services;

class CSSVariablesGenerator {
    
    private $serviceFactory;
    private $cacheManager;
    private $generatedVariables = [];
    
    // 🎨 Typy zmiennych CSS
    const TYPE_COLOR = 'color';
    const TYPE_DIMENSION = 'dimension';
    const TYPE_SCALE = 'scale';
    const TYPE_FONT = 'font';
    const TYPE_SHADOW = 'shadow';
    const TYPE_ANIMATION = 'animation';
    
    // 📱 Breakpointy responsywne
    const BREAKPOINT_MOBILE = '480px';
    const BREAKPOINT_TABLET = '768px';
    const BREAKPOINT_DESKTOP = '1024px';
    const BREAKPOINT_WIDE = '1200px';
    
    public function __construct($serviceFactory) {
        $this->serviceFactory = $serviceFactory;
        $this->cacheManager = $serviceFactory->getAdvancedCacheManager();
    }
    
    /**
     * 🎨 Generuj wszystkie zmienne CSS
     */
    public function generateAllVariables($settings = null) {
        $startTime = microtime(true);
        
        if ($settings === null) {
            $settings = $this->serviceFactory->getSettingsManager()->getSettings();
        }
        
        // Sprawdź cache
        $cacheKey = 'css_variables_' . md5(serialize($settings));
        $cached = $this->cacheManager->get($cacheKey);
        
        if ($cached !== null) {
            return $cached;
        }
        
        // Generuj zmienne
        $variables = [];
        
        // 1. Kolory podstawowe i pochodne
        $variables = array_merge($variables, $this->generateColorVariables($settings));
        
        // 2. Wymiary i skale
        $variables = array_merge($variables, $this->generateDimensionVariables($settings));
        
        // 3. Typografia
        $variables = array_merge($variables, $this->generateTypographyVariables($settings));
        
        // 4. Cienie i efekty
        $variables = array_merge($variables, $this->generateEffectVariables($settings));
        
        // 5. Animacje
        $variables = array_merge($variables, $this->generateAnimationVariables($settings));
        
        // 6. Responsywne warianty
        $variables = array_merge($variables, $this->generateResponsiveVariables($variables, $settings));
        
        $generationTime = microtime(true) - $startTime;
        
        $result = [
            'variables' => $variables,
            'css' => $this->variablesToCSS($variables),
            'generation_time' => $generationTime,
            'variable_count' => count($variables),
            'timestamp' => current_time('mysql')
        ];
        
        // Cache wynik
        $this->cacheManager->set($cacheKey, $result, 1800); // 30 minut
        
        return $result;
    }
    
    /**
     * 🌈 Generuj zmienne kolorów
     */
    private function generateColorVariables($settings) {
        $variables = [];
        
        // Kolory podstawowe
        $primaryColor = $settings['primary_color'] ?? '#007cba';
        $secondaryColor = $settings['secondary_color'] ?? '#50575e';
        $accentColor = $settings['accent_color'] ?? '#00a0d2';
        
        // Podstawowe kolory
        $variables['--mas-primary'] = $primaryColor;
        $variables['--mas-secondary'] = $secondaryColor;
        $variables['--mas-accent'] = $accentColor;
        
        // Automatyczne warianty jasności/ciemności
        $variables = array_merge($variables, $this->generateColorShades($primaryColor, 'primary'));
        $variables = array_merge($variables, $this->generateColorShades($secondaryColor, 'secondary'));
        $variables = array_merge($variables, $this->generateColorShades($accentColor, 'accent'));
        
        // Kolory semantyczne
        $variables['--mas-success'] = $this->adjustBrightness($primaryColor, 20);
        $variables['--mas-warning'] = '#f0b849';
        $variables['--mas-error'] = '#dc3232';
        $variables['--mas-info'] = $accentColor;
        
        // Kolory interfejsu
        $variables['--mas-background'] = $settings['background_color'] ?? '#ffffff';
        $variables['--mas-surface'] = $this->adjustBrightness($variables['--mas-background'], -5);
        $variables['--mas-border'] = $this->adjustBrightness($secondaryColor, 60);
        $variables['--mas-text'] = $settings['text_color'] ?? '#1e1e1e';
        $variables['--mas-text-muted'] = $this->adjustBrightness($variables['--mas-text'], 40);
        
        // Kolory hover/focus
        $variables['--mas-primary-hover'] = $this->adjustBrightness($primaryColor, -10);
        $variables['--mas-secondary-hover'] = $this->adjustBrightness($secondaryColor, -10);
        $variables['--mas-accent-hover'] = $this->adjustBrightness($accentColor, -10);
        
        return $variables;
    }
    
    /**
     * 🎨 Generuj odcienie koloru
     */
    private function generateColorShades($baseColor, $name) {
        $shades = [];
        
        // Jasne odcienie (50, 100, 200, 300, 400)
        for ($i = 50; $i <= 400; $i += 50) {
            $lightness = ($i / 400) * 80; // 0-80% lightness
            $shades["--mas-{$name}-{$i}"] = $this->adjustBrightness($baseColor, $lightness);
        }
        
        // Bazowy kolor (500)
        $shades["--mas-{$name}-500"] = $baseColor;
        
        // Ciemne odcienie (600, 700, 800, 900)
        for ($i = 600; $i <= 900; $i += 100) {
            $darkness = (($i - 500) / 400) * -60; // 0 do -60% darkness
            $shades["--mas-{$name}-{$i}"] = $this->adjustBrightness($baseColor, $darkness);
        }
        
        return $shades;
    }
    
    /**
     * 📏 Generuj zmienne wymiarów
     */
    private function generateDimensionVariables($settings) {
        $variables = [];
        
        // Podstawowa skala
        $baseSize = $settings['base_font_size'] ?? 16;
        $scale = $settings['scale_ratio'] ?? 1.25;
        
        // Skala typograficzna
        $sizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'];
        foreach ($sizes as $index => $size) {
            $multiplier = pow($scale, $index - 2); // md (index 2) jako bazowy
            $variables["--mas-size-{$size}"] = round($baseSize * $multiplier, 2) . 'px';
        }
        
        // Spacing (marginesy, paddingi)
        $baseSpacing = $settings['base_spacing'] ?? 8;
        for ($i = 0; $i <= 20; $i++) {
            $variables["--mas-space-{$i}"] = ($baseSpacing * $i) . 'px';
        }
        
        // Specjalne spacingi
        $variables['--mas-space-px'] = '1px';
        $variables['--mas-space-0.5'] = ($baseSpacing * 0.5) . 'px';
        $variables['--mas-space-1.5'] = ($baseSpacing * 1.5) . 'px';
        $variables['--mas-space-2.5'] = ($baseSpacing * 2.5) . 'px';
        
        // Border radius
        $baseRadius = $settings['border_radius'] ?? 4;
        $variables['--mas-radius-none'] = '0px';
        $variables['--mas-radius-sm'] = ($baseRadius * 0.5) . 'px';
        $variables['--mas-radius'] = $baseRadius . 'px';
        $variables['--mas-radius-md'] = ($baseRadius * 1.5) . 'px';
        $variables['--mas-radius-lg'] = ($baseRadius * 2) . 'px';
        $variables['--mas-radius-xl'] = ($baseRadius * 3) . 'px';
        $variables['--mas-radius-full'] = '9999px';
        
        // Szerokości kontenerów
        $variables['--mas-container-sm'] = '640px';
        $variables['--mas-container-md'] = '768px';
        $variables['--mas-container-lg'] = '1024px';
        $variables['--mas-container-xl'] = '1280px';
        
        return $variables;
    }
    
    /**
     * 🔤 Generuj zmienne typograficzne
     */
    private function generateTypographyVariables($settings) {
        $variables = [];
        
        // Czcionki
        $primaryFont = $settings['primary_font'] ?? 'system-ui, -apple-system, sans-serif';
        $secondaryFont = $settings['secondary_font'] ?? 'Georgia, serif';
        $monoFont = $settings['mono_font'] ?? 'Consolas, monospace';
        
        $variables['--mas-font-primary'] = $primaryFont;
        $variables['--mas-font-secondary'] = $secondaryFont;
        $variables['--mas-font-mono'] = $monoFont;
        
        // Wagi czcionek
        $variables['--mas-font-thin'] = '100';
        $variables['--mas-font-light'] = '300';
        $variables['--mas-font-normal'] = '400';
        $variables['--mas-font-medium'] = '500';
        $variables['--mas-font-semibold'] = '600';
        $variables['--mas-font-bold'] = '700';
        $variables['--mas-font-black'] = '900';
        
        // Line heights
        $variables['--mas-leading-none'] = '1';
        $variables['--mas-leading-tight'] = '1.25';
        $variables['--mas-leading-normal'] = '1.5';
        $variables['--mas-leading-relaxed'] = '1.75';
        $variables['--mas-leading-loose'] = '2';
        
        // Letter spacing
        $variables['--mas-tracking-tighter'] = '-0.05em';
        $variables['--mas-tracking-tight'] = '-0.025em';
        $variables['--mas-tracking-normal'] = '0';
        $variables['--mas-tracking-wide'] = '0.025em';
        $variables['--mas-tracking-wider'] = '0.05em';
        $variables['--mas-tracking-widest'] = '0.1em';
        
        return $variables;
    }
    
    /**
     * ✨ Generuj zmienne efektów
     */
    private function generateEffectVariables($settings) {
        $variables = [];
        
        // Cienie
        $shadowColor = $settings['shadow_color'] ?? 'rgba(0, 0, 0, 0.1)';
        $shadowIntensity = $settings['shadow_intensity'] ?? 1;
        
        $variables['--mas-shadow-sm'] = "0 1px 2px 0 {$shadowColor}";
        $variables['--mas-shadow'] = "0 1px 3px 0 {$shadowColor}, 0 1px 2px 0 {$shadowColor}";
        $variables['--mas-shadow-md'] = "0 4px 6px -1px {$shadowColor}, 0 2px 4px -1px {$shadowColor}";
        $variables['--mas-shadow-lg'] = "0 10px 15px -3px {$shadowColor}, 0 4px 6px -2px {$shadowColor}";
        $variables['--mas-shadow-xl'] = "0 20px 25px -5px {$shadowColor}, 0 10px 10px -5px {$shadowColor}";
        $variables['--mas-shadow-2xl'] = "0 25px 50px -12px {$shadowColor}";
        $variables['--mas-shadow-inner'] = "inset 0 2px 4px 0 {$shadowColor}";
        
        // Blur effects
        $variables['--mas-blur-sm'] = 'blur(4px)';
        $variables['--mas-blur'] = 'blur(8px)';
        $variables['--mas-blur-md'] = 'blur(12px)';
        $variables['--mas-blur-lg'] = 'blur(16px)';
        $variables['--mas-blur-xl'] = 'blur(24px)';
        
        // Opacity
        $variables['--mas-opacity-0'] = '0';
        $variables['--mas-opacity-25'] = '0.25';
        $variables['--mas-opacity-50'] = '0.5';
        $variables['--mas-opacity-75'] = '0.75';
        $variables['--mas-opacity-100'] = '1';
        
        return $variables;
    }
    
    /**
     * 🎬 Generuj zmienne animacji
     */
    private function generateAnimationVariables($settings) {
        $variables = [];
        
        // Czasy trwania
        $variables['--mas-duration-75'] = '75ms';
        $variables['--mas-duration-100'] = '100ms';
        $variables['--mas-duration-150'] = '150ms';
        $variables['--mas-duration-200'] = '200ms';
        $variables['--mas-duration-300'] = '300ms';
        $variables['--mas-duration-500'] = '500ms';
        $variables['--mas-duration-700'] = '700ms';
        $variables['--mas-duration-1000'] = '1000ms';
        
        // Easing functions
        $variables['--mas-ease-linear'] = 'linear';
        $variables['--mas-ease-in'] = 'cubic-bezier(0.4, 0, 1, 1)';
        $variables['--mas-ease-out'] = 'cubic-bezier(0, 0, 0.2, 1)';
        $variables['--mas-ease-in-out'] = 'cubic-bezier(0.4, 0, 0.2, 1)';
        $variables['--mas-ease-back'] = 'cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        $variables['--mas-ease-bounce'] = 'cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        
        // Transformacje
        $variables['--mas-scale-0'] = 'scale(0)';
        $variables['--mas-scale-50'] = 'scale(0.5)';
        $variables['--mas-scale-75'] = 'scale(0.75)';
        $variables['--mas-scale-90'] = 'scale(0.9)';
        $variables['--mas-scale-95'] = 'scale(0.95)';
        $variables['--mas-scale-100'] = 'scale(1)';
        $variables['--mas-scale-105'] = 'scale(1.05)';
        $variables['--mas-scale-110'] = 'scale(1.1)';
        $variables['--mas-scale-125'] = 'scale(1.25)';
        $variables['--mas-scale-150'] = 'scale(1.5)';
        
        return $variables;
    }
    
    /**
     * 📱 Generuj responsywne warianty
     */
    private function generateResponsiveVariables($baseVariables, $settings) {
        $responsiveVariables = [];
        
        // Responsywne rozmiary czcionek
        $mobileScale = $settings['mobile_scale'] ?? 0.875;
        $tabletScale = $settings['tablet_scale'] ?? 0.9375;
        
        foreach ($baseVariables as $key => $value) {
            if (strpos($key, '--mas-size-') === 0) {
                $mobileValue = $this->scaleValue($value, $mobileScale);
                $tabletValue = $this->scaleValue($value, $tabletScale);
                
                $responsiveVariables[$key . '-mobile'] = $mobileValue;
                $responsiveVariables[$key . '-tablet'] = $tabletValue;
            }
        }
        
        // Responsywne spacingi
        $mobileSpacingScale = $settings['mobile_spacing_scale'] ?? 0.75;
        
        foreach ($baseVariables as $key => $value) {
            if (strpos($key, '--mas-space-') === 0) {
                $mobileValue = $this->scaleValue($value, $mobileSpacingScale);
                $responsiveVariables[$key . '-mobile'] = $mobileValue;
            }
        }
        
        return $responsiveVariables;
    }
    
    /**
     * 🎨 Konwertuj zmienne do CSS
     */
    private function variablesToCSS($variables) {
        $css = ":root {\n";
        
        foreach ($variables as $name => $value) {
            $css .= "  {$name}: {$value};\n";
        }
        
        $css .= "}\n\n";
        
        // Dodaj media queries dla responsywnych wariantów
        $css .= $this->generateResponsiveCSS($variables);
        
        return $css;
    }
    
    /**
     * 📱 Generuj responsywne CSS
     */
    private function generateResponsiveCSS($variables) {
        $css = '';
        
        // Mobile
        $mobileVars = array_filter($variables, function($key) {
            return strpos($key, '-mobile') !== false;
        }, ARRAY_FILTER_USE_KEY);
        
        if (!empty($mobileVars)) {
            $css .= "@media (max-width: " . self::BREAKPOINT_MOBILE . ") {\n";
            $css .= "  :root {\n";
            foreach ($mobileVars as $name => $value) {
                $baseName = str_replace('-mobile', '', $name);
                $css .= "    {$baseName}: {$value};\n";
            }
            $css .= "  }\n";
            $css .= "}\n\n";
        }
        
        // Tablet
        $tabletVars = array_filter($variables, function($key) {
            return strpos($key, '-tablet') !== false;
        }, ARRAY_FILTER_USE_KEY);
        
        if (!empty($tabletVars)) {
            $css .= "@media (max-width: " . self::BREAKPOINT_TABLET . ") {\n";
            $css .= "  :root {\n";
            foreach ($tabletVars as $name => $value) {
                $baseName = str_replace('-tablet', '', $name);
                $css .= "    {$baseName}: {$value};\n";
            }
            $css .= "  }\n";
            $css .= "}\n\n";
        }
        
        return $css;
    }
    
    /**
     * 🎨 Dostosuj jasność koloru
     */
    private function adjustBrightness($color, $percent) {
        // Konwertuj hex na RGB
        $color = ltrim($color, '#');
        
        if (strlen($color) === 3) {
            $color = $color[0] . $color[0] . $color[1] . $color[1] . $color[2] . $color[2];
        }
        
        $r = hexdec(substr($color, 0, 2));
        $g = hexdec(substr($color, 2, 2));
        $b = hexdec(substr($color, 4, 2));
        
        // Dostosuj jasność
        $r = max(0, min(255, $r + ($r * $percent / 100)));
        $g = max(0, min(255, $g + ($g * $percent / 100)));
        $b = max(0, min(255, $b + ($b * $percent / 100)));
        
        return sprintf('#%02x%02x%02x', $r, $g, $b);
    }
    
    /**
     * 📏 Skaluj wartość CSS
     */
    private function scaleValue($value, $scale) {
        if (preg_match('/^(\d+(?:\.\d+)?)(.*)$/', $value, $matches)) {
            $number = floatval($matches[1]);
            $unit = $matches[2];
            
            return round($number * $scale, 2) . $unit;
        }
        
        return $value;
    }
    
    /**
     * 🔄 Invaliduj cache zmiennych
     */
    public function invalidateCache() {
        $this->cacheManager->delete('css_variables');
        return true;
    }
    
    /**
     * 📊 Pobierz statystyki generatora
     */
    public function getStats() {
        $allVariables = $this->generateAllVariables();
        
        return [
            'total_variables' => $allVariables['variable_count'],
            'generation_time' => $allVariables['generation_time'],
            'css_size' => strlen($allVariables['css']),
            'last_generated' => $allVariables['timestamp']
        ];
    }
} 