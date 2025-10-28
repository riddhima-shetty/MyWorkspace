import React from 'react';
import { AppStatus } from '../types';

interface StatusDisplayProps {
  status: AppStatus;
  error?: string | null;
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({ status, error }) => {
  const getStatusInfo = () => {
    switch (status) {
      case AppStatus.ESP32_DISCONNECTED:
        return { icon: '📷', text: 'Connect to Camera', detail: 'Please enter the IP address of your ESP32 camera.' };
      case AppStatus.ESP32_CONNECTING:
         return { icon: <Spinner />, text: 'Connecting...', detail: 'Attempting to connect to the camera stream.' };
      case AppStatus.MIC_PERMISSION_REQUIRED:
        return { icon: '🙏', text: 'Permissions Required', detail: 'Please allow microphone access to use voice commands.' };
      case AppStatus.READY:
        return { icon: '🗣️', text: "Say 'Vision' to Start", detail: 'Listening for activation command.' };
      case AppStatus.ACTIVATING:
        return { icon: '🚀', text: 'Activating Vision...', detail: 'Getting ready to analyze your surroundings.' };
      case AppStatus.ACTIVE_LISTENING:
        return { icon: '👁️', text: 'Vision is Active', detail: 'Detecting obstacles. Say "describe" for details.' };
      case AppStatus.ANALYZING:
        return { icon: <Spinner />, text: 'Analyzing...', detail: 'Looking at your surroundings.' };
      case AppStatus.SPEAKING:
        return { icon: '🔊', text: 'Speaking...', detail: 'Providing feedback.' };
      case AppStatus.ERROR:
        return { icon: '⚠️', text: 'Connection Error', detail: error || 'An unknown error occurred.' };
      default:
        return { icon: '❔', text: 'Unknown Status', detail: '' };
    }
  };

  const { icon, text, detail } = getStatusInfo();

  return (
    <div className="text-center bg-black bg-opacity-70 p-8 rounded-2xl shadow-2xl max-w-md w-full">
      <div className="text-6xl mb-4 flex justify-center items-center h-16">{icon}</div>
      <h1 className="text-3xl font-bold text-cyan-300 mb-2">{text}</h1>
      <p className="text-lg text-gray-300">{detail}</p>
    </div>
  );
};

const Spinner: React.FC = () => (
  <svg className="animate-spin h-12 w-12 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default StatusDisplay;