import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Square, 
  Trash2,
  Download,
  Send,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from './ui/use-toast';

interface VoiceRecorderProps {
  onRecordingComplete?: (audioBlob: Blob, duration: number) => void;
  onRecordingDiscard?: () => void;
  maxDuration?: number; // in seconds
  className?: string;
}

interface RecordingState {
  status: 'idle' | 'recording' | 'paused' | 'completed';
  duration: number;
  audioBlob?: Blob;
  audioUrl?: string;
}

export default function VoiceRecorder({
  onRecordingComplete,
  onRecordingDiscard,
  maxDuration = 300, // 5 minutes default
  className
}: VoiceRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    status: 'idle',
    duration: 0
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [audioStream]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      setAudioStream(stream);
      
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      chunksRef.current = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { 
          type: recorder.mimeType || 'audio/webm' 
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setRecordingState(prev => ({
          ...prev,
          status: 'completed',
          audioBlob,
          audioUrl
        }));
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        setAudioStream(null);
      };
      
      recorder.start(1000); // Collect data every second
      setMediaRecorder(recorder);
      
      setRecordingState(prev => ({
        ...prev,
        status: 'recording',
        duration: 0
      }));
      
      // Start duration timer
      intervalRef.current = setInterval(() => {
        setRecordingState(prev => {
          const newDuration = prev.duration + 1;
          
          // Auto-stop at max duration
          if (newDuration >= maxDuration) {
            stopRecording();
            return prev;
          }
          
          return { ...prev, duration: newDuration };
        });
      }, 1000);
      
      toast({
        title: 'Recording started',
        description: 'Speak clearly into your microphone'
      });
      
    } catch (error) {
      console.error('Error starting recording:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        component: 'VoiceRecorder',
        operation: 'startRecording',
        error: error
      });
      toast({
        title: 'Recording failed',
        description: 'Could not access microphone. Please check permissions.',
        variant: 'destructive'
      });
    }
  };

  const pauseRecording = () => {
    if (mediaRecorder && recordingState.status === 'recording') {
      mediaRecorder.pause();
      setRecordingState(prev => ({ ...prev, status: 'paused' }));
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorder && recordingState.status === 'paused') {
      mediaRecorder.resume();
      setRecordingState(prev => ({ ...prev, status: 'recording' }));
      
      // Resume timer
      intervalRef.current = setInterval(() => {
        setRecordingState(prev => {
          const newDuration = prev.duration + 1;
          if (newDuration >= maxDuration) {
            stopRecording();
            return prev;
          }
          return { ...prev, duration: newDuration };
        });
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && recordingState.status !== 'idle') {
      mediaRecorder.stop();
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  };

  const playRecording = () => {
    if (audioRef.current && recordingState.audioUrl) {
      audioRef.current.src = recordingState.audioUrl;
      audioRef.current.play();
      setIsPlaying(true);
      
      // Update playback time
      playbackIntervalRef.current = setInterval(() => {
        if (audioRef.current) {
          setPlaybackTime(audioRef.current.currentTime);
        }
      }, 100);
    }
  };

  const pausePlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
    }
  };

  const handleAudioEnd = () => {
    setIsPlaying(false);
    setPlaybackTime(0);
    if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
  };

  const discardRecording = () => {
    if (recordingState.audioUrl) {
      URL.revokeObjectURL(recordingState.audioUrl);
    }
    
    setRecordingState({ status: 'idle', duration: 0 });
    setPlaybackTime(0);
    setIsPlaying(false);
    
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
    
    onRecordingDiscard?.();
  };

  const saveRecording = () => {
    if (recordingState.audioBlob) {
      onRecordingComplete?.(recordingState.audioBlob, recordingState.duration);
      
      toast({
        title: 'Recording saved',
        description: `Voice memo (${formatDuration(recordingState.duration)}) added to ticket`
      });
    }
  };

  const downloadRecording = () => {
    if (recordingState.audioBlob) {
      const url = URL.createObjectURL(recordingState.audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voice-memo-${new Date().toISOString().slice(0, 19)}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    switch (recordingState.status) {
      case 'recording': return 'text-red-600';
      case 'paused': return 'text-yellow-600';
      case 'completed': return 'text-green-600';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusText = () => {
    switch (recordingState.status) {
      case 'recording': return 'Recording...';
      case 'paused': return 'Paused';
      case 'completed': return 'Recording Complete';
      default: return 'Ready to Record';
    }
  };

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Voice Recording</h3>
            <Badge variant="outline" className={getStatusColor()}>
              {getStatusText()}
            </Badge>
          </div>

          {/* Recording Visualization */}
          <div className="text-center space-y-4">
            {/* Duration Display */}
            <div className="text-2xl font-mono font-bold">
              {formatDuration(recordingState.duration)}
            </div>
            
            {/* Progress Bar */}
            <Progress 
              value={(recordingState.duration / maxDuration) * 100} 
              className="h-2"
            />
            
            <div className="text-xs text-muted-foreground">
              Max duration: {formatDuration(maxDuration)}
            </div>
          </div>

          {/* Recording Controls */}
          {recordingState.status === 'idle' && (
            <div className="flex justify-center">
              <Button 
                onClick={startRecording}
                size="lg"
                className="gap-2 bg-red-600 hover:bg-red-700"
              >
                <Mic className="w-5 h-5" />
                Start Recording
              </Button>
            </div>
          )}

          {(recordingState.status === 'recording' || recordingState.status === 'paused') && (
            <div className="flex justify-center gap-2">
              {recordingState.status === 'recording' ? (
                <Button onClick={pauseRecording} variant="outline" size="lg">
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
              ) : (
                <Button onClick={resumeRecording} size="lg">
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </Button>
              )}
              
              <Button onClick={stopRecording} variant="destructive" size="lg">
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>
            </div>
          )}

          {/* Playback Controls */}
          {recordingState.status === 'completed' && (
            <div className="space-y-4">
              {/* Playback Progress */}
              {recordingState.duration > 0 && (
                <div className="space-y-2">
                  <Progress 
                    value={(playbackTime / recordingState.duration) * 100} 
                    className="h-1"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatDuration(Math.floor(playbackTime))}</span>
                    <span>{formatDuration(recordingState.duration)}</span>
                  </div>
                </div>
              )}
              
              {/* Playback Buttons */}
              <div className="flex justify-center gap-2">
                {!isPlaying ? (
                  <Button onClick={playRecording} variant="outline">
                    <Play className="w-4 h-4 mr-2" />
                    Play
                  </Button>
                ) : (
                  <Button onClick={pausePlayback} variant="outline">
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                )}
                
                <Button onClick={downloadRecording} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={discardRecording} 
                  variant="outline" 
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Discard
                </Button>
                <Button 
                  onClick={saveRecording} 
                  className="flex-1"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Add to Ticket
                </Button>
              </div>
            </div>
          )}

          {/* Hidden Audio Element */}
          <audio 
            ref={audioRef} 
            onEnded={handleAudioEnd}
            className="hidden"
          />
        </div>
      </CardContent>
    </Card>
  );
}
