import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppStatus } from './types';
import CameraFeed, { CameraFeedHandle } from './components/CameraFeed';
import StatusDisplay from './components/StatusDisplay';
import Esp32Connect from './components/Esp32Connect';
import { analyzeImageForObstacles, describeSurroundings, answerQuestionAboutImage } from './services/geminiService';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';

const OBSTACLE_ANALYSIS_INTERVAL = 4000; // 4 seconds

export default function App() {
  const [status, setStatus] = useState<AppStatus>(AppStatus.ESP32_DISCONNECTED);
  const [esp32Ip, setEsp32Ip] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const cameraRef = useRef<CameraFeedHandle>(null);
  const analysisIntervalRef = useRef<number | null>(null);
  const lastSpokenTextRef = useRef<string>('');
  const isProcessingRef = useRef(false);

  const { speak, isSpeaking } = useSpeechSynthesis(() => {
    if (status === AppStatus.SPEAKING) {
      setStatus(AppStatus.ACTIVE_LISTENING);
    }
  });

  const analyzeObstacles = useCallback(async () => {
    if (isProcessingRef.current || isSpeaking || status !== AppStatus.ACTIVE_LISTENING) return;

    const frame = cameraRef.current?.captureFrame();
    if (!frame) return;

    isProcessingRef.current = true;
    try {
      const obstacleDescription = await analyzeImageForObstacles(frame);
      if (obstacleDescription && obstacleDescription !== 'Path is clear.' && obstacleDescription !== lastSpokenTextRef.current) {
        lastSpokenTextRef.current = obstacleDescription;
        setStatus(AppStatus.SPEAKING);
        speak(obstacleDescription);
      }
    } catch (e: any) {
      console.error('Failed during background obstacle analysis:', e);
    } finally {
      isProcessingRef.current = false;
    }
  }, [isSpeaking, status, speak]);

  const handleDescribeSurroundings = useCallback(async () => {
    if (isProcessingRef.current || isSpeaking) return;
    const frame = cameraRef.current?.captureFrame();
    if (!frame) return;
    isProcessingRef.current = true;
    setStatus(AppStatus.ANALYZING);
    try {
      const description = await describeSurroundings(frame);
      setStatus(AppStatus.SPEAKING);
      speak(description);
    } catch (e: any) {
      console.error(e);
      setLastError('Failed to describe surroundings.');
      setStatus(AppStatus.ERROR);
      speak("Sorry, I couldn't describe what I see right now.");
    } finally {
      isProcessingRef.current = false;
    }
  }, [isSpeaking, speak]);

  const handleGeneralQuestion = useCallback(async (question: string) => {
    if (isProcessingRef.current || isSpeaking) return;
    const frame = cameraRef.current?.captureFrame();
    if (!frame) return;
    isProcessingRef.current = true;
    setStatus(AppStatus.ANALYZING);
    try {
      const answer = await answerQuestionAboutImage(frame, question);
      setStatus(AppStatus.SPEAKING);
      speak(answer);
    } catch (e: any) {
      console.error(e);
      setLastError('Failed to answer the question.');
      setStatus(AppStatus.ERROR);
      speak("Sorry, I couldn't answer that question right now.");
    } finally {
      isProcessingRef.current = false;
    }
  }, [isSpeaking, speak]);

  const processTranscript = useCallback((transcript: string) => {
    const lowerCaseTranscript = transcript.toLowerCase();
    if (status === AppStatus.READY && lowerCaseTranscript.includes('vision')) {
      setStatus(AppStatus.ACTIVATING);
      speak("Vision activated. I am now watching for obstacles.", () => {
        setStatus(AppStatus.ACTIVE_LISTENING);
      });
    } else if (status === AppStatus.ACTIVE_LISTENING) {
      if (isProcessingRef.current || isSpeaking) return;
      if (lowerCaseTranscript.includes('describe') || lowerCaseTranscript.includes('what do you see')) {
        handleDescribeSurroundings();
      } else if (lowerCaseTranscript.includes('stop') || lowerCaseTranscript.includes('deactivate')) {
        speak("Deactivating Vision. Goodbye.", () => {
          setStatus(AppStatus.READY);
        });
      } else {
        handleGeneralQuestion(transcript);
      }
    }
  }, [status, isSpeaking, speak, handleDescribeSurroundings, handleGeneralQuestion]);

  const { startListening, stopListening, isListening } = useSpeechRecognition(processTranscript);

  const handleConnect = (ip: string) => {
    setLastError(null);
    setEsp32Ip(ip);
    setStatus(AppStatus.ESP32_CONNECTING);
  };

  const handleStreamLoad = useCallback(async () => {
    try {
      // We need to request microphone permissions after the camera is confirmed to be working
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // We don't need to do anything with the stream, just successfully get it.
      mediaStream.getTracks().forEach(track => track.stop());
      setStatus(AppStatus.READY);
    } catch (err) {
      console.error("Error getting microphone:", err);
      setLastError("Microphone access was denied.");
      setStatus(AppStatus.MIC_PERMISSION_REQUIRED);
    }
  }, []);

  const handleStreamError = () => {
    setLastError(`Could not connect to the camera stream at ${esp32Ip}. Please check the IP address and your network connection.`);
    setStatus(AppStatus.ERROR);
  };

  useEffect(() => {
    if ((status === AppStatus.READY || status === AppStatus.ACTIVE_LISTENING) && !isSpeaking) {
      if (!isListening) startListening();
    } else {
      if (isListening) stopListening();
    }
  }, [status, isListening, isSpeaking, startListening, stopListening]);

  useEffect(() => {
    if (status === AppStatus.ACTIVE_LISTENING && !analysisIntervalRef.current) {
      if (isProcessingRef.current || isSpeaking) return;
      analysisIntervalRef.current = window.setInterval(analyzeObstacles, OBSTACLE_ANALYSIS_INTERVAL);
    } else if (status !== AppStatus.ACTIVE_LISTENING && analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    };
  }, [status, analyzeObstacles, isSpeaking]);

  const showConnectScreen = status === AppStatus.ESP32_DISCONNECTED || status === AppStatus.ERROR;

  if (showConnectScreen) {
    return (
      <main className="relative w-screen h-screen flex items-center justify-center p-4">
        <Esp32Connect onConnect={handleConnect} error={lastError} />
      </main>
    );
  }

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      {esp32Ip && (
        <CameraFeed
          ipAddress={esp32Ip}
          ref={cameraRef}
          onLoad={handleStreamLoad}
          onError={handleStreamError}
        />
      )}
      <div className="absolute inset-0 flex items-center justify-center z-10 p-4">
        <StatusDisplay status={status} error={lastError} />
      </div>
    </main>
  );
}