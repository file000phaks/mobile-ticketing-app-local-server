import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { 
  Camera, 
  QrCode, 
  Image as ImageIcon, 
  Edit3, 
  Save, 
  X, 
  Maximize2,
  RotateCw,
  Palette,
  Type,
  Circle,
  Square,
  ArrowRight
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Annotation {
  id: string;
  type: 'text' | 'arrow' | 'circle' | 'rectangle';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  color: string;
}

interface PhotoHelperProps {
  onPhotoCapture?: (file: File, annotations?: Annotation[]) => void;
  onBarcodeDetected?: (data: string) => void;
  className?: string;
  showAnnotations?: boolean;
  showBarcode?: boolean;
}

export default function PhotoHelper({ 
  onPhotoCapture, 
  onBarcodeDetected, 
  className,
  showAnnotations = true,
  showBarcode = true 
}: PhotoHelperProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedTool, setSelectedTool] = useState<'text' | 'arrow' | 'circle' | 'rectangle' | null>(null);
  const [selectedColor, setSelectedColor] = useState('#ef4444');
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [scannedData, setScannedData] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const colors = [
    '#ef4444', // red
    '#f97316', // orange  
    '#eab308', // yellow
    '#22c55e', // green
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#ffffff'  // white
  ];

  const capturePhoto = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera if available
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Error accessing camera:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        component: 'PhotoHelper',
        operation: 'startCamera',
        error: error
      });
      // Fallback to file input
      fileInputRef.current?.click();
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageData);
        
        // Stop camera
        const stream = video.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startAnnotating = () => {
    setIsAnnotating(true);
    setSelectedTool('text');
  };

  const addAnnotation = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedTool || !isAnnotating) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    
    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type: selectedTool,
      x,
      y,
      color: selectedColor,
      width: selectedTool === 'rectangle' ? 20 : undefined,
      height: selectedTool === 'rectangle' ? 15 : undefined,
      text: selectedTool === 'text' ? 'Add text...' : undefined
    };
    
    setAnnotations([...annotations, newAnnotation]);
  };

  const simulateBarcodeScanning = () => {
    setShowBarcodeScanner(true);
    // Simulate barcode detection after 2 seconds
    setTimeout(() => {
      const mockBarcodes = [
        'EQUIP-001-2024',
        'MAINT-ABC123',
        'ASSET-DEF456',
        'PART-789XYZ'
      ];
      const randomBarcode = mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)];
      setScannedData(randomBarcode);
      onBarcodeDetected?.(randomBarcode);
      setShowBarcodeScanner(false);
    }, 2000);
  };

  const savePhoto = () => {
    if (capturedImage) {
      // Convert to blob and call callback
      fetch(capturedImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
          onPhotoCapture?.(file, annotations);
        });
    }
  };

  const resetPhoto = () => {
    setCapturedImage(null);
    setAnnotations([]);
    setIsAnnotating(false);
    setSelectedTool(null);
    setScannedData('');
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Photo Helper
          {scannedData && (
            <Badge variant="outline" className="ml-auto">
              <QrCode className="w-3 h-3 mr-1" />
              {scannedData}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!capturedImage ? (
          <div className="space-y-4">
            {/* Camera Controls */}
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={capturePhoto} className="gap-2">
                <Camera className="w-4 h-4" />
                Take Photo
              </Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
                <ImageIcon className="w-4 h-4" />
                Upload
              </Button>
            </div>

            {/* Barcode Scanner */}
            {showBarcode && (
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  onClick={simulateBarcodeScanning}
                  disabled={showBarcodeScanner}
                  className="w-full gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  {showBarcodeScanner ? 'Scanning...' : 'Scan Barcode/QR Code'}
                </Button>
                
                {showBarcodeScanner && (
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="animate-pulse">
                      <QrCode className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Point camera at barcode or QR code...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              capture="environment"
            />

            {/* Video preview */}
            <video
              ref={videoRef}
              className="w-full rounded-lg border"
              style={{ display: videoRef.current?.srcObject ? 'block' : 'none' }}
            />
            
            {videoRef.current?.srcObject && (
              <Button onClick={takePhoto} className="w-full">
                Capture Photo
              </Button>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Photo with annotations */}
            <div 
              className="relative border rounded-lg overflow-hidden cursor-crosshair"
              onClick={addAnnotation}
            >
              <img 
                src={capturedImage} 
                alt="Captured" 
                className="w-full h-auto"
              />
              
              {/* Annotations overlay */}
              {annotations.map((annotation) => (
                <div
                  key={annotation.id}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${annotation.x}%`,
                    top: `${annotation.y}%`,
                    color: annotation.color,
                  }}
                >
                  {annotation.type === 'text' && (
                    <div 
                      className="bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap transform -translate-x-1/2"
                      style={{ color: annotation.color === '#ffffff' ? '#000000' : annotation.color }}
                    >
                      {annotation.text}
                    </div>
                  )}
                  {annotation.type === 'arrow' && (
                    <ArrowRight 
                      className="w-6 h-6 transform -translate-x-1/2 -translate-y-1/2" 
                      style={{ color: annotation.color }}
                    />
                  )}
                  {annotation.type === 'circle' && (
                    <Circle 
                      className="w-8 h-8 transform -translate-x-1/2 -translate-y-1/2" 
                      style={{ color: annotation.color }}
                    />
                  )}
                  {annotation.type === 'rectangle' && (
                    <Square 
                      className="w-8 h-8 transform -translate-x-1/2 -translate-y-1/2" 
                      style={{ color: annotation.color }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Annotation Tools */}
            {showAnnotations && (
              <div className="space-y-3">
                {!isAnnotating ? (
                  <Button onClick={startAnnotating} variant="outline" className="w-full gap-2">
                    <Edit3 className="w-4 h-4" />
                    Add Annotations
                  </Button>
                ) : (
                  <div className="space-y-3">
                    {/* Tool Selection */}
                    <div className="flex gap-2">
                      <Button
                        variant={selectedTool === 'text' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedTool('text')}
                      >
                        <Type className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={selectedTool === 'arrow' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedTool('arrow')}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={selectedTool === 'circle' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedTool('circle')}
                      >
                        <Circle className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={selectedTool === 'rectangle' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedTool('rectangle')}
                      >
                        <Square className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Color Selection */}
                    <div className="flex gap-2 items-center">
                      <Palette className="w-4 h-4 text-muted-foreground" />
                      {colors.map(color => (
                        <button
                          key={color}
                          className={cn(
                            "w-6 h-6 rounded-full border-2 border-transparent",
                            selectedColor === color && "border-foreground"
                          )}
                          style={{ backgroundColor: color }}
                          onClick={() => setSelectedColor(color)}
                        />
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAnnotating(false)}
                        className="flex-1"
                      >
                        Done
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAnnotations([])}
                        className="flex-1"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={savePhoto} className="gap-2">
                <Save className="w-4 h-4" />
                Save Photo
              </Button>
              <Button variant="outline" onClick={resetPhoto} className="gap-2">
                <X className="w-4 h-4" />
                Retake
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
