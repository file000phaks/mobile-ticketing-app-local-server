import React, { useState, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Camera, 
  X, 
  RotateCcw,
  Check,
  Download,
  Trash2,
  SwitchCamera,
  Zap,
  ZapOff
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from './ui/use-toast';

interface CameraCaptureProps {
  onPhotoCapture?: (photoBlob: Blob, photoUrl: string) => void;
  onClose?: () => void;
  className?: string;
}

interface CapturedPhoto {
  blob: Blob;
  url: string;
  timestamp: Date;
}

export default function CameraCapture({
  onPhotoCapture,
  onClose,
  className
}: CameraCaptureProps) {
  const [isActive, setIsActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasFlash, setHasFlash] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      streamRef.current = stream;
      setIsActive(true);

      // Check for flash capability
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      setHasFlash('torch' in capabilities);
      
      toast({
        title: 'Camera ready',
        description: 'Position your camera and tap to capture'
      });
      
    } catch (error) {
      console.error('Error accessing camera:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        component: 'CameraCapture',
        operation: 'startCamera',
        error: error
      });
      toast({
        title: 'Camera error',
        description: 'Could not access camera. Please check permissions.',
        variant: 'destructive'
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsActive(false);
    setFlashEnabled(false);
  };

  const switchCamera = async () => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setTimeout(startCamera, 100);
  };

  const toggleFlash = async () => {
    if (!streamRef.current) return;
    
    const track = streamRef.current.getVideoTracks()[0];
    const capabilities = track.getCapabilities();
    
    if ('torch' in capabilities) {
      try {
        await track.applyConstraints({
          advanced: [{ torch: !flashEnabled } as any]
        });
        setFlashEnabled(!flashEnabled);
      } catch (error) {
        console.error('Error toggling flash:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          component: 'CameraCapture',
          operation: 'toggleFlash',
          error: error
        });
      }
    }
  };

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setCapturedPhoto({
          blob,
          url,
          timestamp: new Date()
        });
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  }, []);

  const retakePhoto = () => {
    if (capturedPhoto) {
      URL.revokeObjectURL(capturedPhoto.url);
      setCapturedPhoto(null);
    }
    startCamera();
  };

  const savePhoto = () => {
    if (capturedPhoto) {
      onPhotoCapture?.(capturedPhoto.blob, capturedPhoto.url);
      
      toast({
        title: 'Photo saved',
        description: 'Photo has been added to the ticket'
      });
      
      setCapturedPhoto(null);
      onClose?.();
    }
  };

  const downloadPhoto = () => {
    if (capturedPhoto) {
      const a = document.createElement('a');
      a.href = capturedPhoto.url;
      a.download = `photo-${capturedPhoto.timestamp.toISOString().slice(0, 19)}.jpg`;
      a.click();
    }
  };

  const discardPhoto = () => {
    if (capturedPhoto) {
      URL.revokeObjectURL(capturedPhoto.url);
      setCapturedPhoto(null);
    }
    onClose?.();
  };

  return (
    <Card className={cn("w-full max-w-2xl mx-auto", className)}>
      <CardContent className="p-0">
        <div className="relative aspect-[4/3] bg-black rounded-t-lg overflow-hidden">
          {/* Camera View */}
          {isActive && !capturedPhoto && (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              
              {/* Camera Controls Overlay */}
              <div className="absolute inset-0 flex flex-col">
                {/* Top Controls */}
                <div className="flex justify-between items-center p-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onClose}
                    className="bg-black/50 hover:bg-black/70 text-white border-none"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  
                  <div className="flex gap-2">
                    {hasFlash && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={toggleFlash}
                        className={cn(
                          "bg-black/50 hover:bg-black/70 border-none",
                          flashEnabled ? "text-yellow-400" : "text-white"
                        )}
                      >
                        {flashEnabled ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
                      </Button>
                    )}
                    
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={switchCamera}
                      className="bg-black/50 hover:bg-black/70 text-white border-none"
                    >
                      <SwitchCamera className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Center Guidelines */}
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-64 h-64 border-2 border-white/30 rounded-lg"></div>
                </div>
                
                {/* Bottom Controls */}
                <div className="flex justify-center items-center p-8">
                  <Button
                    onClick={capturePhoto}
                    size="lg"
                    className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 border-4 border-white"
                  >
                    <Camera className="w-6 h-6 text-white" />
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Photo Preview */}
          {capturedPhoto && (
            <div className="relative w-full h-full">
              <img
                src={capturedPhoto.url}
                alt="Captured photo"
                className="w-full h-full object-cover"
              />
              
              {/* Photo Info Overlay */}
              <div className="absolute top-4 left-4">
                <Badge className="bg-black/50 text-white">
                  {capturedPhoto.timestamp.toLocaleString()}
                </Badge>
              </div>
            </div>
          )}

          {/* Initial State */}
          {!isActive && !capturedPhoto && (
            <div className="flex flex-col items-center justify-center h-full text-white">
              <Camera className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Camera</p>
              <p className="text-sm opacity-75">Take photos for your ticket</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 space-y-3">
          {!isActive && !capturedPhoto && (
            <Button onClick={startCamera} className="w-full" size="lg">
              <Camera className="w-5 h-5 mr-2" />
              Open Camera
            </Button>
          )}

          {capturedPhoto && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button 
                  onClick={retakePhoto} 
                  variant="outline" 
                  className="flex-1"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retake
                </Button>
                <Button 
                  onClick={downloadPhoto} 
                  variant="outline"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={discardPhoto} 
                  variant="destructive" 
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Discard
                </Button>
                <Button 
                  onClick={savePhoto} 
                  className="flex-1"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Save Photo
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      {/* Hidden Canvas for Photo Capture */}
      <canvas ref={canvasRef} className="hidden" />
    </Card>
  );
}
