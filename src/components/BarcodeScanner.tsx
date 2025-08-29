import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  QrCode, 
  Camera, 
  X, 
  Flashlight,
  FlashlightOff,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  SwitchCamera
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from './ui/use-toast';

interface BarcodeScannerProps {
  onScanResult?: (data: ScanResult) => void;
  onClose?: () => void;
  scanTypes?: ('qr' | 'barcode' | 'datamatrix')[];
  className?: string;
}

interface ScanResult {
  data: string;
  format: string;
  timestamp: Date;
  confidence?: number;
}

interface Equipment {
  id: string;
  name: string;
  type: string;
  model: string;
  location: string;
  serialNumber: string;
  qrCode?: string;
  barcode?: string;
}

// Mock equipment database for demonstration
const mockEquipmentDB: Equipment[] = [
  {
    id: 'eq-001',
    name: 'HVAC Unit A-2',
    type: 'Air Conditioning',
    model: 'Carrier 30XA',
    location: 'Building A - Floor 2',
    serialNumber: 'CAR-2024-001',
    qrCode: 'EQ001-HVAC-A2-CAR2024001',
    barcode: '1234567890123'
  },
  {
    id: 'eq-002',
    name: 'Elevator B-1',
    type: 'Elevator',
    model: 'Otis Gen2',
    location: 'Building B - Lobby',
    serialNumber: 'OTIS-2023-002',
    qrCode: 'EQ002-ELEV-B1-OTIS2023002',
    barcode: '2345678901234'
  },
  {
    id: 'eq-003',
    name: 'Fire Safety System C',
    type: 'Fire Safety',
    model: 'Honeywell FS90',
    location: 'Building C - All Floors',
    serialNumber: 'HON-2023-003',
    qrCode: 'EQ003-FIRE-C-HON2023003',
    barcode: '3456789012345'
  }
];

export default function BarcodeScanner({
  onScanResult,
  onClose,
  scanTypes = ['qr', 'barcode'],
  className
}: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasFlash, setHasFlash] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      setError(null);
      
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      streamRef.current = stream;
      setIsScanning(true);

      // Check for flash capability
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      setHasFlash('torch' in capabilities);

      // Start scanning loop
      startScanningLoop();
      
      toast({
        title: 'Scanner active',
        description: 'Point your camera at a QR code or barcode'
      });
      
    } catch (error) {
      console.error('Error starting scanner:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        component: 'BarcodeScanner',
        operation: 'startScanning',
        error: error
      });
      setError('Could not access camera. Please check permissions.');
      toast({
        title: 'Scanner error',
        description: 'Could not access camera. Please check permissions.',
        variant: 'destructive'
      });
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    setIsScanning(false);
    setFlashEnabled(false);
  };

  const switchCamera = async () => {
    stopScanning();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setTimeout(startScanning, 100);
  };

  const toggleFlash = async () => {
    if (!streamRef.current) return;
    
    const track = streamRef.current.getVideoTracks()[0];
    
    try {
      await track.applyConstraints({
        advanced: [{ torch: !flashEnabled } as any]
      });
      setFlashEnabled(!flashEnabled);
    } catch (error) {
      console.error('Error toggling flash:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        component: 'BarcodeScanner',
        operation: 'toggleFlash',
        error: error
      });
    }
  };

  const startScanningLoop = () => {
    scanIntervalRef.current = setInterval(() => {
      scanFrame();
    }, 500); // Scan every 500ms
  };

  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.videoWidth === 0) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data for scanning
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // Simulate barcode/QR code detection
    // In a real implementation, you would use a library like @zxing/library or quagga2
    detectCodeInImageData(imageData);
  };

  // Simulate code detection (replace with actual barcode/QR scanning library)
  const detectCodeInImageData = (imageData: ImageData) => {
    // This is a mock implementation
    // In reality, you would use a proper scanning library
    
    // Simulate random detection for demo purposes
    if (Math.random() < 0.1) { // 10% chance of detection per frame
      const mockCodes = [
        'EQ001-HVAC-A2-CAR2024001',
        'EQ002-ELEV-B1-OTIS2023002',
        'EQ003-FIRE-C-HON2023003',
        '1234567890123',
        '2345678901234',
        '3456789012345'
      ];
      
      const randomCode = mockCodes[Math.floor(Math.random() * mockCodes.length)];
      const isQR = randomCode.includes('-');
      
      handleScanSuccess({
        data: randomCode,
        format: isQR ? 'QR_CODE' : 'CODE_128',
        timestamp: new Date(),
        confidence: 0.95
      });
    }
  };

  const handleScanSuccess = (result: ScanResult) => {
    setScanResult(result);
    stopScanning();
    
    // Look up equipment by scanned code
    const foundEquipment = mockEquipmentDB.find(eq => 
      eq.qrCode === result.data || eq.barcode === result.data
    );
    
    if (foundEquipment) {
      setEquipment(foundEquipment);
      toast({
        title: 'Equipment found',
        description: `Identified: ${foundEquipment.name}`
      });
    } else {
      toast({
        title: 'Code scanned',
        description: `Scanned: ${result.data}`,
        variant: 'secondary'
      });
    }
    
    onScanResult?.(result);
  };

  const resetScanner = () => {
    setScanResult(null);
    setEquipment(null);
    setError(null);
    startScanning();
  };

  const handleScanAnother = () => {
    setScanResult(null);
    setEquipment(null);
    startScanning();
  };

  return (
    <Card className={cn("w-full max-w-2xl mx-auto", className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          Barcode Scanner
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Scanner View */}
        {!scanResult && (
          <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden">
            {isScanning ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                
                {/* Scanner Overlay */}
                <div className="absolute inset-0 flex flex-col">
                  {/* Top Controls */}
                  <div className="flex justify-between items-center p-4">
                    <Badge className="bg-black/50 text-white">
                      Scanning...
                    </Badge>
                    
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
                          {flashEnabled ? <Flashlight className="w-4 h-4" /> : <FlashlightOff className="w-4 h-4" />}
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
                  
                  {/* Scanning Frame */}
                  <div className="flex-1 flex items-center justify-center p-8">
                    <div className="relative">
                      <div className="w-64 h-64 border-2 border-white rounded-lg">
                        {/* Corner indicators */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
                        
                        {/* Scanning line animation */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 animate-pulse"></div>
                      </div>
                      
                      <p className="text-white text-center mt-4">
                        Position QR code or barcode within the frame
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-white">
                <QrCode className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Scanner Ready</p>
                <p className="text-sm opacity-75 text-center">
                  Scan QR codes and barcodes to identify equipment
                </p>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Scan Result */}
        {scanResult && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Code successfully scanned: {scanResult.format}
              </AlertDescription>
            </Alert>

            {/* Equipment Information */}
            {equipment ? (
              <Card className="border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-700">Equipment Identified</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                      <p className="font-medium">{equipment.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Type</Label>
                      <p>{equipment.type}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Model</Label>
                      <p>{equipment.model}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Serial Number</Label>
                      <p className="font-mono text-sm">{equipment.serialNumber}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                    <p className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {equipment.location}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Scanned Data</Label>
                    <p className="font-mono text-sm bg-muted p-2 rounded">
                      {scanResult.data}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Format: {scanResult.format}</span>
                      {scanResult.confidence && (
                        <span>Confidence: {(scanResult.confidence * 100).toFixed(1)}%</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!isScanning && !scanResult && (
            <Button onClick={startScanning} className="flex-1 gap-2">
              <Camera className="w-4 h-4" />
              Start Scanner
            </Button>
          )}

          {isScanning && (
            <Button onClick={stopScanning} variant="destructive" className="flex-1">
              Stop Scanning
            </Button>
          )}

          {scanResult && (
            <>
              <Button onClick={handleScanAnother} variant="outline" className="flex-1 gap-2">
                <RotateCcw className="w-4 h-4" />
                Scan Another
              </Button>
              {equipment && (
                <Button onClick={() => {
                  toast({
                    title: 'Equipment selected',
                    description: `Selected: ${equipment.name}`
                  });
                  onClose?.();
                }} className="flex-1">
                  Use Equipment
                </Button>
              )}
            </>
          )}
        </div>

        {/* Supported Formats */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Supports: QR Codes, Barcodes, Data Matrix</p>
        </div>
      </CardContent>
      
      {/* Hidden Canvas for Image Processing */}
      <canvas ref={canvasRef} className="hidden" />
    </Card>
  );
}

const Label = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={className}>{children}</div>
);

const MapPin = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
