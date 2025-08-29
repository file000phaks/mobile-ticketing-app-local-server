import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import { 
  Camera, 
  Video, 
  Mic, 
  Upload, 
  FileText,
  X,
  Plus
} from 'lucide-react';
import FileUpload, { UploadedFile } from './FileUpload';
import VoiceRecorder from './VoiceRecorder';
import CameraCapture from './CameraCapture';
import { toast } from './ui/use-toast';

interface EnhancedMediaCaptureProps {
  onMediaAdd?: (media: MediaFile[]) => void;
  onClose?: () => void;
  ticketId?: string;
  maxFiles?: number;
}

interface MediaFile {
  id: string;
  type: 'photo' | 'video' | 'audio' | 'document';
  name: string;
  url: string;
  size?: number;
  duration?: number;
  timestamp: Date;
}

export default function EnhancedMediaCapture({ 
  onMediaAdd, 
  onClose, 
  ticketId,
  maxFiles = 20 
}: EnhancedMediaCaptureProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [showCamera, setShowCamera] = useState(false);

  const handleFileUpload = (files: UploadedFile[]) => {
    const newMediaFiles: MediaFile[] = files
      .filter(f => f.status === 'completed')
      .map(f => ({
        id: f.id,
        type: f.type.startsWith('image/') ? 'photo' : 
              f.type.startsWith('video/') ? 'video' :
              f.type.startsWith('audio/') ? 'audio' : 'document',
        name: f.name,
        url: f.url || '',
        size: f.size,
        timestamp: new Date()
      }));

    setMediaFiles(prev => [...prev, ...newMediaFiles]);
    onMediaAdd?.(newMediaFiles);
  };

  const handleVoiceRecording = (audioBlob: Blob, duration: number) => {
    const url = URL.createObjectURL(audioBlob);
    const mediaFile: MediaFile = {
      id: Date.now().toString(),
      type: 'audio',
      name: `voice-memo-${new Date().toISOString().slice(0, 19)}.webm`,
      url,
      size: audioBlob.size,
      duration,
      timestamp: new Date()
    };

    setMediaFiles(prev => [...prev, mediaFile]);
    onMediaAdd?.([mediaFile]);
  };

  const handlePhotoCapture = (photoBlob: Blob, photoUrl: string) => {
    const mediaFile: MediaFile = {
      id: Date.now().toString(),
      type: 'photo',
      name: `photo-${new Date().toISOString().slice(0, 19)}.jpg`,
      url: photoUrl,
      size: photoBlob.size,
      timestamp: new Date()
    };

    setMediaFiles(prev => [...prev, mediaFile]);
    onMediaAdd?.([mediaFile]);
    setShowCamera(false);
  };

  const removeMedia = (id: string) => {
    setMediaFiles(prev => {
      const media = prev.find(m => m.id === id);
      if (media) {
        URL.revokeObjectURL(media.url);
      }
      return prev.filter(m => m.id !== id);
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Media to Ticket
        </CardTitle>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="files" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="files" className="gap-2">
              <Upload className="w-4 h-4" />
              Files
            </TabsTrigger>
            <TabsTrigger value="camera" className="gap-2">
              <Camera className="w-4 h-4" />
              Camera
            </TabsTrigger>
            <TabsTrigger value="voice" className="gap-2">
              <Mic className="w-4 h-4" />
              Voice
            </TabsTrigger>
            <TabsTrigger value="media" className="gap-2">
              <FileText className="w-4 h-4" />
              Media ({mediaFiles.length})
            </TabsTrigger>
          </TabsList>

          {/* File Upload Tab */}
          <TabsContent value="files" className="mt-6">
            <FileUpload
              ticketId={ticketId}
              maxFiles={maxFiles}
              onFilesChange={handleFileUpload}
            />
          </TabsContent>

          {/* Camera Tab */}
          <TabsContent value="camera" className="mt-6">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-semibold mb-2">Camera</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Take photos directly from your device camera
                </p>
              </div>
              
              <Dialog open={showCamera} onOpenChange={setShowCamera}>
                <DialogTrigger asChild>
                  <Button size="lg" className="w-full gap-2">
                    <Camera className="w-5 h-5" />
                    Open Camera
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl p-0">
                  <CameraCapture
                    onPhotoCapture={handlePhotoCapture}
                    onClose={() => setShowCamera(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>

          {/* Voice Recording Tab */}
          <TabsContent value="voice" className="mt-6">
            <VoiceRecorder
              onRecordingComplete={handleVoiceRecording}
              maxDuration={600} // 10 minutes
            />
          </TabsContent>

          {/* Media List Tab */}
          <TabsContent value="media" className="mt-6">
            {mediaFiles.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium mb-2">No media files yet</p>
                <p className="text-sm">Add photos, videos, audio, or documents to your ticket</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Attached Media</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setMediaFiles([])}
                  >
                    Clear All
                  </Button>
                </div>
                
                {mediaFiles.map((media) => (
                  <Card key={media.id} className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        {media.type === 'photo' && <Camera className="w-5 h-5" />}
                        {media.type === 'video' && <Video className="w-5 h-5" />}
                        {media.type === 'audio' && <Mic className="w-5 h-5" />}
                        {media.type === 'document' && <FileText className="w-5 h-5" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{media.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="capitalize">{media.type}</span>
                          {media.size && (
                            <span>• {(media.size / 1024).toFixed(1)}KB</span>
                          )}
                          {media.duration && (
                            <span>• {Math.floor(media.duration / 60)}:{(media.duration % 60).toString().padStart(2, '0')}</span>
                          )}
                          <span>• {media.timestamp.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeMedia(media.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        {mediaFiles.length > 0 && (
          <div className="flex gap-2 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={() => {
                toast({
                  title: 'Media attached',
                  description: `${mediaFiles.length} file(s) attached to ticket`
                });
                onClose?.();
              }} 
              className="flex-1"
            >
              <Plus className="w-4 h-4 mr-2" />
              Attach Media ({mediaFiles.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
