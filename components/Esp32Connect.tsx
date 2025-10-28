import React, { useState } from 'react';

interface Esp32ConnectProps {
  onConnect: (ip: string) => void;
  error: string | null;
}

const Esp32Connect: React.FC<Esp32ConnectProps> = ({ onConnect, error }) => {
  const [ipAddress, setIpAddress] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ipAddress.trim()) {
      onConnect(ipAddress.trim());
    }
  };

  return (
    <div className="text-center bg-gray-800 bg-opacity-90 p-8 rounded-2xl shadow-2xl max-w-sm w-full">
      <h1 className="text-4xl font-bold text-cyan-300 mb-4">Vision</h1>
      <p className="text-lg text-gray-300 mb-6">Enter the IP address of your ESP32 camera to begin.</p>
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={ipAddress}
          onChange={(e) => setIpAddress(e.target.value)}
          placeholder="e.g., 192.168.1.105"
          className="w-full px-4 py-3 bg-gray-700 text-white border-2 border-gray-600 rounded-lg mb-4 focus:outline-none focus:border-cyan-400 text-center"
          aria-label="ESP32 Camera IP Address"
        />
        <button
          type="submit"
          className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300"
        >
          Connect
        </button>
      </form>

      {error && (
        <div className="mt-4 bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg" role="alert">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default Esp32Connect;