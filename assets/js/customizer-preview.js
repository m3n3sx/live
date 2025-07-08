/**
 * Modern Admin Styler V2 - Customizer Live Preview
 *
 * Ten skrypt sprawia, że sam interfejs Customizera reaguje na zmiany w czasie rzeczywistym.
 * Działa poprzez aktualizację zmiennych CSS i przełączanie klas na elemencie body.
 */
(function ($) {
  'use strict';

  const root = document.documentElement;
  const body = document.body;

  /**
   * Funkcja pomocnicza do wiązania ustawienia Customizera ze zmienną CSS.
   * @param {string} settingName - Nazwa ustawienia (np. 'mas_v2_settings[admin_bar_text_color]').
   * @param {string} cssVarName - Nazwa zmiennej CSS (np. '--mas-admin-bar-text-color').
   * @param {string} [unit=''] - Jednostka do dodania do wartości (np. 'px').
   */
  function bindCssVar(settingName, cssVarName, unit = '') {
    wp.customize(settingName, function (value) {
      value.bind(function (newVal) {
        root.style.setProperty(cssVarName, newVal + unit);
      });
    });
  }

  /**
   * Funkcja pomocnicza do wiązania ustawienia Customizera (przełącznika) z klasą na body.
   * @param {string} settingName - Nazwa ustawienia.
   * @param {string} className - Klasa do przełączania.
   */
  function bindBodyClass(settingName, className) {
    wp.customize(settingName, function (value) {
      value.bind(function (newVal) {
        body.classList.toggle(className, !!newVal && newVal !== '0');
      });
    });
  }

  /**
   * Funkcja pomocnicza do wiązania ustawienia, które kontroluje zestaw wzajemnie wykluczających się klas.
   * @param {string} settingName - Nazwa ustawienia.
   * @param {string} classPrefix - Prefiks dla klas (np. 'mas-v2-scheme-').
   * @param {string[]} possibleValues - Tablica możliwych wartości (np. ['light', 'dark', 'auto']).
   */
  function bindExclusiveBodyClass(settingName, classPrefix, possibleValues) {
    wp.customize(settingName, function (value) {
      value.bind(function (newVal) {
        // Najpierw usuń wszystkie możliwe klasy z tej grupy
        possibleValues.forEach(val => {
          body.classList.remove(classPrefix + val);
        });
        // Dodaj nową, aktywną klasę
        body.classList.add(classPrefix + newVal);
      });
    });
  }

  // --- Powiązania Ustawień (Bindings) ---

  // Pasek Admina
  bindCssVar('mas_v2_settings[admin_bar_text_color]', '--woow-surface-bar-text');
  bindCssVar('mas_v2_settings[admin_bar_bg_color]', '--woow-surface-bar');
  bindCssVar('mas_v2_settings[admin_bar_height]', '--woow-surface-bar-height', 'px');
  bindBodyClass('mas_v2_settings[admin_bar_floating]', 'mas-v2-admin-bar-floating');

  // Menu Boczne
  bindCssVar('mas_v2_settings[menu_width]', '--mas-menu-width', 'px');
  bindBodyClass('mas_v2_settings[menu_floating]', 'mas-v2-menu-floating');

  // Wygląd Ogólny
  bindExclusiveBodyClass('mas_v2_settings[color_scheme]', 'mas-v2-scheme-', ['light', 'dark', 'auto']);
  bindExclusiveBodyClass('mas_v2_settings[color_palette]', 'mas-v2-palette-', ['modern', 'white', 'green']); // Załóżmy, że to są wartości
  bindBodyClass('mas_v2_settings[glassmorphism_enabled]', 'mas-v2-glassmorphism-enabled');
  bindBodyClass('mas_v2_settings[animations_enabled]', 'mas-v2-animations-enabled');


})(jQuery);