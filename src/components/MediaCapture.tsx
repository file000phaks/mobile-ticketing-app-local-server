import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Camera, 
  Video, 
  Image, 
  Upload, 
  X, 
  Play, 
  Pause,
  Download,
  FileImage,
  FileVideo,
  Loader2
} from 'lucide-react';
import { toast } from './ui/use-toast';
// import { uploadFile, getFileUrl, supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface MediaFile {
  id: string;
  file: File;
  type: 'image' | 'video';
  preview: string;
  uploaded?: boolean;
  uploading?: boolean;
  progress?: number;
  storage_path?: string;
  url?: string;
}

interface MediaCaptureProps {
  ticketId?: string;
  onMediaUpload?: (media: MediaFile[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  allowedTypes?: ('image' | 'video')[];
}

export default function MediaCapture({ 
  ticketId,
  onMediaUpload,
  maxFiles = 10,
  maxFileSize = 50,
  allowedTypes = ['image', 'video']
}: MediaCaptureProps) {
  const { user } = useAuth();
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [videoRecording, setVideoRecording] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const validateFile = (file: File): string | null => {
    const fileSizeMB = file.size / (1024 * 1024);
    
    if (fileSizeMB > maxFileSize) {
      return `File size must be less than ${maxFileSize}MB`;
    }
    
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      return 'File must be an image or video';
    }
    
    if (isImage && !allowedTypes.includes('image')) {
      return 'Images are not allowed';
    }
    
    if (isVideo && !allowedTypes.includes('video')) {
      return 'Videos are not allowed';
    }
    
    return null;
  };

  const createMediaFile = (file: File): MediaFile => {
    const isVideo = file.type.startsWith('video/');
    const preview = URL.createObjectURL(file);
    
    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      file,
      type: isVideo ? 'video' : 'image',
      preview,
      uploaded: false,
      uploading: false,
      progress: 0
    };
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (mediaFiles.length + files.length > maxFiles) {
      toast({
        title: 'Too many files',
        description: `You can only upload up to ${maxFiles} files`,
        variant: 'destructive'
      });
      return;
    }
    
    const validFiles: MediaFile[] = [];
    
    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        toast({
          title: 'Invalid file',
          description: `${file.name}: ${error}`,
          variant: 'destructive'
        });
        continue;
      }
      
      validFiles.push(createMediaFile(file));
    }
    
    setMediaFiles(prev => [...prev, ...validFiles]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setMediaStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        component: 'MediaCapture',
        operation: 'startCamera',
        error: error
      });
      toast({
        title: 'Camera access denied',
        description: 'Please allow camera access to capture photos and videos',
        variant: 'destructive'
      });
    }
  };

  const stopCamera = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    if (context) {
      context.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
          const mediaFile = createMediaFile(file);
          setMediaFiles(prev => [...prev, mediaFile]);
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const startVideoRecording = () => {
    if (!mediaStream) return;
    
    recordedChunksRef.current = [];
    
    const mediaRecorder = new MediaRecorder(mediaStream, {
      mimeType: 'video/webm;codecs=vp9'
    });
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const file = new File([blob], `video_${Date.now()}.webm`, { type: 'video/webm' });
      const mediaFile = createMediaFile(file);
      setMediaFiles(prev => [...prev, mediaFile]);
    };
    
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setVideoRecording(true);
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && videoRecording) {
      mediaRecorderRef.current.stop();
      setVideoRecording(false);
    }
  };

  const removeMediaFile = (id: string) => {
    setMediaFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file && file.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const uploadFiles = async () => {
    if (!user || !ticketId) {
      toast({
        title: 'Upload failed',
        description: 'User not authenticated or no ticket ID provided',
        variant: 'destructive'
      });
      return;
    }

    const filesToUpload = mediaFiles.filter(f => !f.uploaded && !f.uploading);
    if (filesToUpload.length === 0) return;

    setUploading(true);

    try {
      const uploadPromises = filesToUpload.map(async (mediaFile) => {
        // Update UI to show uploading
        setMediaFiles(prev => prev.map(f => 
          f.id === mediaFile.id 
            ? { ...f, uploading: true, progress: 0 }
            : f
        ));

        const fileExt = mediaFile.file.name.split('.').pop();
        const fileName = `${ticketId}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

        try {
          // Upload to Supabase Storage
          const uploadData = await uploadFile('ticket-media', fileName, mediaFile.file);
          
          // Get public URL
          const publicUrl = getFileUrl('ticket-media', uploadData.path);

          // Save to database
          const { data, error } = await supabase
            .from('ticket_media')
            .insert({
              ticket_id: ticketId,
              file_name: mediaFile.file.name,
              file_type: mediaFile.file.type,
              file_size: mediaFile.file.size,
              storage_path: uploadData.path,
              uploaded_by: user.id
            })
            .select()
            .single();

          if (error) throw error;

          // Update UI to show success
          setMediaFiles(prev => prev.map(f => 
            f.id === mediaFile.id 
              ? { 
                  ...f, 
                  uploading: false, 
                  uploaded: true, 
                  progress: 100,
                  storage_path: uploadData.path,
                  url: publicUrl
                }
              : f
          ));

          return { ...mediaFile, uploaded: true, storage_path: uploadData.path, url: publicUrl };
        } catch (error) {
          console.error('Upload failed for file:', mediaFile.file.name, error);
          
          // Update UI to show error
          setMediaFiles(prev => prev.map(f => 
            f.id === mediaFile.id 
              ? { ...f, uploading: false, progress: 0 }
              : f
          ));

          throw error;
        }
      });

      const results = await Promise.allSettled(uploadPromises);
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.filter(r => r.status === 'rejected').length;

      if (successCount > 0) {
        toast({
          title: 'Upload successful',
          description: `${successCount} file(s) uploaded successfully${failCount > 0 ? `, ${failCount} failed` : ''}`,
        });
      }

      if (failCount > 0 && successCount === 0) {
        toast({
          title: 'Upload failed',
          description: 'All files failed to upload',
          variant: 'destructive'
        });
      }

      // Notify parent component
      if (onMediaUpload) {
        const uploadedFiles = mediaFiles.filter(f => f.uploaded);
        onMediaUpload(uploadedFiles);
      }

    } catch (error: any) {
      console.error('Upload error:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        component: 'MediaCapture',
        operation: 'uploadFiles',
        filesCount: files?.length,
        error: error
      });
      toast({
        title: 'Upload failed',
        description: error.message || 'An error occurred during upload',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Camera Controls */}
      {allowedTypes.includes('image') || allowedTypes.includes('video') ? (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {!mediaStream ? (
                <Button onClick={startCamera} className="w-full">
                  <Camera className="w-4 h-4 mr-2" />
                  Open Camera
                </Button>
              ) : (
                <>
                  <div className="relative rounded-lg overflow-hidden bg-black">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-48 object-cover"
                    />
                    {videoRecording && (
                      <Badge variant="destructive" className="absolute top-2 left-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1" />
                        Recording
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {allowedTypes.includes('image') && (
                      <Button onClick={capturePhoto} variant="outline" className="flex-1">
                        <Camera className="w-4 h-4 mr-2" />
                        Photo
                      </Button>
                    )}
                    
                    {allowedTypes.includes('video') && (
                      <Button 
                        onClick={videoRecording ? stopVideoRecording : startVideoRecording}
                        variant={videoRecording ? "destructive" : "outline"}
                        className="flex-1"
                      >
                        {videoRecording ? (
                          <>
                            <Pause className="w-4 h-4 mr-2" />
                            Stop
                          </>
                        ) : (
                          <>
                            <Video className="w-4 h-4 mr-2" />
                            Record
                          </>
                        )}
                      </Button>
                    )}
                    
                    <Button onClick={stopCamera} variant="outline">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* File Upload */}
      <Card>
        <CardContent className="p-4">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={`${allowedTypes.includes('image') ? 'image/*' : ''}${allowedTypes.includes('image') && allowedTypes.includes('video') ? ',' : ''}${allowedTypes.includes('video') ? 'video/*' : ''}`}
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button 
            onClick={() => fileInputRef.current?.click()}
            variant="outline" 
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Files
          </Button>
          
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Max {maxFiles} files, {maxFileSize}MB each
          </p>
        </CardContent>
      </Card>

      {/* Media Preview */}
      {mediaFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Media Files ({mediaFiles.length})</h4>
                {ticketId && mediaFiles.some(f => !f.uploaded && !f.uploading) && (
                  <Button 
                    onClick={uploadFiles} 
                    disabled={uploading}
                    size="sm"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3 h-3 mr-1" />
                        Upload All
                      </>
                    )}
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {mediaFiles.map((media) => (
                  <div key={media.id} className="relative">
                    <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                      {media.type === 'image' ? (
                        <img 
                          src={media.preview} 
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileVideo className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      
                      {/* Upload status overlay */}
                      {media.uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="text-white text-center">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-1" />
                            <div className="text-xs">Uploading...</div>
                            {media.progress !== undefined && (
                              <Progress value={media.progress} className="w-16 mt-1" />
                            )}
                          </div>
                        </div>
                      )}
                      
                      {media.uploaded && (
                        <div className="absolute top-1 right-1">
                          <Badge variant="default" className="text-xs">
                            ✓ Uploaded
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-medium truncate flex-1">
                          {media.file.name}
                        </p>
                        <Button
                          onClick={() => removeMediaFile(media.id)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>{formatFileSize(media.file.size)}</span>
                        <div className="flex items-center gap-1">
                          {media.type === 'image' ? (
                            <FileImage className="w-3 h-3" />
                          ) : (
                            <FileVideo className="w-3 h-3" />
                          )}
                          <span className="capitalize">{media.type}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
