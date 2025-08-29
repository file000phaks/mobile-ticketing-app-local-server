import React, { useState, useCallback, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { 
  Upload, 
  X, 
  FileText, 
  Image, 
  Video, 
  Music,
  Camera,
  Loader2,
  Download,
  Eye,
  Trash2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from './ui/use-toast';

interface FileUploadProps {
  ticketId?: string;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  onFilesChange?: (files: UploadedFile[]) => void;
  existingFiles?: UploadedFile[];
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  progress?: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export default function FileUpload({
  ticketId,
  maxFiles = 10,
  maxFileSize = 50, // 50MB
  acceptedTypes = ['image/*', 'video/*', 'audio/*', '.pdf', '.doc', '.docx', '.txt'],
  onFilesChange,
  existingFiles = []
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>(existingFiles);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Video;
    if (type.startsWith('audio/')) return Music;
    return FileText;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size exceeds ${maxFileSize}MB limit`;
    }

    // Check file type
    const isAccepted = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      return file.type.match(type.replace('*', '.*'));
    });

    if (!isAccepted) {
      return 'File type not supported';
    }

    return null;
  };

  const simulateUpload = async (file: File): Promise<string> => {
    // Simulate file upload with progress
    return new Promise((resolve, reject) => {
      const fileId = Math.random().toString(36).substring(7);
      let progress = 0;
      
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          
          // Simulate upload completion
          setTimeout(() => {
            // In a real app, this would return the actual file URL from the server
            const mockUrl = URL.createObjectURL(file);
            resolve(mockUrl);
          }, 200);
        }
        
        setFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, progress } : f
        ));
      }, 200);
    });
  };

  const uploadFile = async (file: File) => {
    const fileId = Math.random().toString(36).substring(7);
    
    const uploadedFile: UploadedFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
      status: 'uploading'
    };

    setFiles(prev => [...prev, uploadedFile]);

    try {
      const url = await simulateUpload(file);
      
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, url, progress: 100, status: 'completed' }
          : f
      ));

      toast({
        title: 'File uploaded',
        description: `${file.name} has been uploaded successfully.`
      });
    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'error', error: 'Upload failed' }
          : f
      ));

      toast({
        title: 'Upload failed',
        description: `Failed to upload ${file.name}. Please try again.`,
        variant: 'destructive'
      });
    }
  };

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const fileArray = Array.from(selectedFiles);
    
    // Check total file limit
    if (files.length + fileArray.length > maxFiles) {
      toast({
        title: 'Too many files',
        description: `Maximum ${maxFiles} files allowed. You can upload ${maxFiles - files.length} more files.`,
        variant: 'destructive'
      });
      return;
    }

    // Validate and upload each file
    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        toast({
          title: 'Invalid file',
          description: `${file.name}: ${error}`,
          variant: 'destructive'
        });
        continue;
      }

      await uploadFile(file);
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const newFiles = prev.filter(f => f.id !== fileId);
      onFilesChange?.(newFiles);
      return newFiles;
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [files.length]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  // Camera capture for mobile
  const capturePhoto = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card 
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          "hover:border-primary hover:bg-primary/5"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="p-8 text-center">
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">Upload Files</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Drag and drop files here, or click to browse
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button type="button" variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Choose Files
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={(e) => {
              e.stopPropagation();
              capturePhoto();
            }}>
              <Camera className="w-4 h-4 mr-2" />
              Take Photo
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Max {maxFiles} files, {maxFileSize}MB each. 
            Supports images, videos, audio, and documents.
          </p>
        </CardContent>
      </Card>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
      />

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Uploaded Files ({files.length}/{maxFiles})</h4>
          {files.map((file) => {
            const Icon = getFileIcon(file.type);
            return (
              <Card key={file.id} className="p-4">
                <div className="flex items-center gap-3">
                  <Icon className="w-8 h-8 text-muted-foreground flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{file.name}</span>
                      <Badge 
                        variant={
                          file.status === 'completed' ? 'default' :
                          file.status === 'error' ? 'destructive' : 'secondary'
                        }
                        className="text-xs"
                      >
                        {file.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>
                      <span>{file.type}</span>
                    </div>
                    
                    {file.status === 'uploading' && file.progress !== undefined && (
                      <Progress value={file.progress} className="mt-2 h-2" />
                    )}
                    
                    {file.status === 'error' && file.error && (
                      <p className="text-red-600 text-sm mt-1">{file.error}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {file.status === 'completed' && file.url && (
                      <>
                        {file.type.startsWith('image/') && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => window.open(file.url, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            const a = document.createElement('a');
                            a.href = file.url!;
                            a.download = file.name;
                            a.click();
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    
                    {file.status === 'uploading' && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeFile(file.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
