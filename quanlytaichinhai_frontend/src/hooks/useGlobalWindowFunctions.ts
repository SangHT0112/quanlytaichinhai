import { useEffect } from 'react';

interface ExtendedWindow extends Window {
  sendChatMessage: (message: string, imageData?: FormData) => void;
  setInputValue: (value: string) => void;
  inputValue: string;
}

export const useGlobalWindowFunctions = (
  handleSendMessage: (message: string, imageData?: FormData) => void,
  setInputValue: (value: string) => void,
  inputValue: string
) => {
  useEffect(() => {
    const extendedWindow = window as unknown as ExtendedWindow;
    extendedWindow.sendChatMessage = handleSendMessage;
    extendedWindow.setInputValue = setInputValue;
    extendedWindow.inputValue = inputValue;
  }, [handleSendMessage, setInputValue, inputValue]);
};