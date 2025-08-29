import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { 
  FileImage, 
  FileVideo, 
  Download, 
  Eye, 
  Calendar,
  User,
  X,
  Play,
  Pause,
  Volume2,
  VolumeX
} from 'lucide-react';
import { TicketMedia } from '../types/ticket';
import { getFileUrl } from '../lib/supabase';

interface MediaGalleryProps {
  media: TicketMedia[];
  showUploader?: boolean;
}

interface MediaViewerProps {
  media: TicketMedia;
  isOpen: boolean;
  onClose: () => void;
}

function MediaViewer({ media, isOpen, onClose }: MediaViewerProps) {
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoMuted, setVideoMuted] = useState(true);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const handleVideoToggle = () => {
    if (videoRef.current) {
      if (videoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setVideoPlaying(!videoPlaying);
    }
  };

  const handleVolumeToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoMuted;
      setVideoMuted(!videoMuted);
    }
  };

  const downloadFile = () => {
    const url = getFileUrl('ticket-media', media.storage_path);
    const link = document.createElement('a');
    link.href = url;
    link.download = media.file_name;
    link.click();
  };

  const isVideo = media.file_type.startsWith('video/');
  const mediaUrl = getFileUrl('ticket-media', media.storage_path);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-lg">{media.file_name}</DialogTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Calendar className="w-3 h-3" />
                <span>{new Date(media.created_at).toLocaleDateString()}</span>
                {media.file_size && (
                  <>
                    <span>•</span>
                    <span>{formatFileSize(media.file_size)}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={downloadFile}>
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="mt-4">
          {isVideo ? (
            <div className="relative rounded-lg overflow-hidden bg-black">
              <video
                ref={videoRef}
                src={mediaUrl}
                className="w-full max-h-[60vh] object-contain"
                controls={false}
                muted={videoMuted}
                onPlay={() => setVideoPlaying(true)}
                onPause={() => setVideoPlaying(false)}
                onEnded={() => setVideoPlaying(false)}
              />
              
              {/* Custom video controls */}
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleVideoToggle}
                    className="bg-black/50 hover:bg-black/70 text-white"
                  >
                    {videoPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleVolumeToggle}
                    className="bg-black/50 hover:bg-black/70 text-white"
                  >
                    {videoMuted ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg overflow-hidden">
              <img
                src={mediaUrl}
                alt={media.file_name}
                className="w-full max-h-[70vh] object-contain bg-muted"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function MediaGallery({ media }: MediaGalleryProps) {
  const [selectedMedia, setSelectedMedia] = useState<TicketMedia | null>(null);

  if (media.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
            <FileImage className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No media files attached</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Media Files ({media.length})</h4>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {media.map((item) => {
                const isVideo = item.file_type.startsWith('video/');
                const mediaUrl = getFileUrl('ticket-media', item.storage_path);
                
                return (
                  <div key={item.id} className="group relative">
                    <div className="aspect-video rounded-lg overflow-hidden bg-muted relative cursor-pointer">
                      {isVideo ? (
                        <div className="w-full h-full flex items-center justify-center relative">
                          <video
                            src={mediaUrl}
                            className="w-full h-full object-cover"
                            muted
                          />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                              <Play className="w-4 h-4 text-white ml-0.5" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <img 
                          src={mediaUrl} 
                          alt={item.file_name}
                          className="w-full h-full object-cover"
                        />
                      )}
                      
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedMedia(item)}
                          className="bg-white/90 hover:bg-white text-black"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </div>
                      
                      {/* File type badge */}
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="text-xs">
                          {isVideo ? (
                            <FileVideo className="w-3 h-3 mr-1" />
                          ) : (
                            <FileImage className="w-3 h-3 mr-1" />
                          )}
                          {isVideo ? 'Video' : 'Image'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-medium truncate" title={item.file_name}>
                        {item.file_name}
                      </p>
                      
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>{item.file_size ? formatFileSize(item.file_size) : 'Unknown size'}</span>
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {selectedMedia && (
        <MediaViewer
          media={selectedMedia}
          isOpen={!!selectedMedia}
          onClose={() => setSelectedMedia(null)}
        />
      )}
    </>
  );
}
