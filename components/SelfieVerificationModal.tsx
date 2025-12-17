"use client"
import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Check, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';

interface SelfieVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (selfieUrl: string) => void;
  signatureId: string;
}

export const SelfieVerificationModal: React.FC<SelfieVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerified,
  signatureId,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setError(null);
      setCameraReady(false);

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user' // Front camera
        }
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraReady(true);
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraReady(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image as base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageData);
    stopCamera();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setError(null);
    startCamera();
  };

  const uploadSelfie = async () => {
    if (!capturedImage) return;

    setUploading(true);
    setError(null);

    try {
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
      };

      const response = await fetch(`/api/signature/${signatureId}/selfie`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selfieImage: capturedImage,
          deviceInfo: deviceInfo,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to upload selfie');
      }

      console.log('✅ Selfie uploaded successfully');
      onVerified(data.selfieUrl);

    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload selfie. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                <Camera className="h-6 w-6 text-purple-600" />
                Identity Verification
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Take a selfie to verify your identity before signing
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
              disabled={uploading}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Camera View or Captured Image */}
          <div className="relative bg-slate-900 rounded-lg overflow-hidden aspect-video mb-4">
            {!capturedImage ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {!cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  </div>
                )}
                {/* Face oval guide */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-4 border-white/50 rounded-full w-64 h-80" 
                       style={{ borderStyle: 'dashed' }} />
                </div>
              </>
            ) : (
              <img
                src={capturedImage}
                alt="Captured selfie"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Instructions */}
          {!capturedImage && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">📸 Instructions:</p>
              <ul className="text-sm text-blue-800 space-y-1 ml-4">
                <li>• Position your face within the oval guide</li>
                <li>• Ensure good lighting on your face</li>
                <li>• Look directly at the camera</li>
                <li>• Remove sunglasses, hats, or masks</li>
                <li>• Make sure your face is clearly visible</li>
              </ul>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            {!capturedImage ? (
              <>
                <button
                  onClick={onClose}
                  disabled={uploading}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={capturePhoto}
                  disabled={!cameraReady || uploading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                >
                  <Camera className="h-5 w-5" />
                  Capture Photo
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={retakePhoto}
                  disabled={uploading}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retake
                </button>
                <button
                  onClick={uploadSelfie}
                  disabled={uploading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Check className="h-5 w-5" />
                      Confirm & Continue
                    </>
                  )}
                </button>
              </>
            )}
          </div>

          {/* Privacy Notice */}
          <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg p-3">
            <p className="text-xs text-slate-600">
              <strong>🔒 Privacy:</strong> Your selfie will be securely stored and used only for identity verification purposes. It will be attached to this document's audit trail.
            </p>
          </div>
        </div>

        {/* Hidden canvas for capturing */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};