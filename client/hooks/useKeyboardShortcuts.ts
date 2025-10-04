import { useEffect } from 'react';

export interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: (event: KeyboardEvent) => void;
  description?: string;
}

/**
 * Detects if the current platform is Mac
 */
export const isMac = (): boolean => {
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform);
};

/**
 * Checks if the event target is an input field where we should ignore shortcuts
 */
const isInputField = (element: EventTarget | null): boolean => {
  if (!element || !(element instanceof HTMLElement)) return false;
  const tagName = element.tagName.toLowerCase();
  const isEditable = element.isContentEditable;
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || isEditable;
};

/**
 * Checks if a keyboard event matches the specified shortcut configuration
 */
const matchesShortcut = (
  event: KeyboardEvent,
  config: ShortcutConfig
): boolean => {
  const mac = isMac();
  const cmdCtrl = mac ? event.metaKey : event.ctrlKey;

  // Handle special cases for modifier keys
  const ctrl = config.ctrl ?? false;
  const shift = config.shift ?? false;
  const alt = config.alt ?? false;

  return (
    event.key.toLowerCase() === config.key.toLowerCase() &&
    cmdCtrl === ctrl &&
    event.shiftKey === shift &&
    event.altKey === alt
  );
};

/**
 * Custom hook for keyboard shortcuts
 * @param shortcuts - Array of shortcut configurations
 * @param enabled - Whether shortcuts are enabled (default: true)
 * @param ignoreInputs - Whether to ignore shortcuts when typing in inputs (default: true)
 */
export const useKeyboardShortcuts = (
  shortcuts: ShortcutConfig[],
  enabled: boolean = true,
  ignoreInputs: boolean = true
) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore shortcuts when typing in input fields
      if (ignoreInputs && isInputField(event.target)) {
        return;
      }

      // Check each shortcut configuration
      for (const config of shortcuts) {
        if (matchesShortcut(event, config)) {
          event.preventDefault();
          event.stopPropagation();
          config.handler(event);
          break; // Only trigger the first matching shortcut
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled, ignoreInputs]);
};

/**
 * Gets the display name for the modifier key based on OS
 */
export const getModKeyDisplay = (): string => {
  return isMac() ? '⌘' : 'Ctrl';
};

/**
 * Formats a shortcut for display
 */
export const formatShortcut = (config: Omit<ShortcutConfig, 'handler'>): string => {
  const parts: string[] = [];
  const modKey = getModKeyDisplay();

  if (config.ctrl) parts.push(modKey);
  if (config.shift) parts.push('Shift');
  if (config.alt) parts.push('Alt');
  parts.push(config.key.toUpperCase());

  return parts.join(' + ');
};
