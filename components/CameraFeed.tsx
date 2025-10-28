import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';

export interface CameraFeedHandle {
  captureFrame: () => string | null;
}

interface CameraFeedProps {
  ipAddress: string;
  onLoad: () => void;
  onError: () => void;
}

const CameraFeed = forwardRef<CameraFeedHandle, CameraFeedProps>(({ ipAddress, onLoad, onError }, ref) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (img && ipAddress) {
      // The :81/stream path is standard for many ESP32 camera webserver examples.
      img.src = `http://${ipAddress}:81/stream`;
    }
  }, [ipAddress]);

  useImperativeHandle(ref, () => ({
    captureFrame: () => {
      const image = imgRef.current;
      const canvas = canvasRef.current;
      if (image && canvas && image.complete && image.naturalWidth > 0) {
        const context = canvas.getContext('2d');
        if (context) {
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          context.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);
          // Returns base64 encoded image string, removing the data URL prefix
          return canvas.toDataURL('image/jpeg').split(',')[1];
        }
      }
      return null;
    },
  }));

  return (
    <>
      <img
        ref={imgRef}
        onLoad={onLoad}
        onError={onError}
        crossOrigin="anonymous" // Required for drawing a network image onto a canvas
        alt="Live feed from ESP32 camera"
        className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2 object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />
    </>
  );
});

export default CameraFeed;