
// FIX: Import `useRef` from react to resolve reference error.
import { useState, useCallback, useEffect, useRef } from 'react';

export const useSpeechSynthesis = (onSpeechEnd?: () => void) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const speak = useCallback((text: string, onEndCallback?: () => void) => {
    if (synthRef.current && text) {
      // Cancel any ongoing speech to prioritize the new message
      synthRef.current.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => {
        setIsSpeaking(true);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        if (onSpeechEnd) onSpeechEnd();
        if (onEndCallback) onEndCallback();
      };
      utterance.onerror = (event) => {
        console.error('SpeechSynthesisUtterance.onerror', event);
        setIsSpeaking(false);
        if (onSpeechEnd) onSpeechEnd();
        if (onEndCallback) onEndCallback();
      };
      
      synthRef.current.speak(utterance);
    }
  }, [onSpeechEnd]);

  return { isSpeaking, speak };
};
