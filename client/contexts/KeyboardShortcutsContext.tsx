import React, { createContext, useContext, useState, ReactNode } from 'react';

interface KeyboardShortcutsContextType {
  isHelpVisible: boolean;
  showHelp: () => void;
  hideHelp: () => void;
  toggleHelp: () => void;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | undefined>(undefined);

export const useKeyboardShortcutsHelp = () => {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error('useKeyboardShortcutsHelp must be used within KeyboardShortcutsProvider');
  }
  return context;
};

interface KeyboardShortcutsProviderProps {
  children: ReactNode;
}

export const KeyboardShortcutsProvider: React.FC<KeyboardShortcutsProviderProps> = ({ children }) => {
  const [isHelpVisible, setIsHelpVisible] = useState(false);

  const showHelp = () => setIsHelpVisible(true);
  const hideHelp = () => setIsHelpVisible(false);
  const toggleHelp = () => setIsHelpVisible(prev => !prev);

  const value: KeyboardShortcutsContextType = {
    isHelpVisible,
    showHelp,
    hideHelp,
    toggleHelp,
  };

  return (
    <KeyboardShortcutsContext.Provider value={value}>
      {children}
    </KeyboardShortcutsContext.Provider>
  );
};

