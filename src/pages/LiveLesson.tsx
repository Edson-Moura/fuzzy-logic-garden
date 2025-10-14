import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlexAvatar } from '@/components/AlexAvatar';
import { Mic, MicOff, ArrowLeft } from 'lucide-react';

export default function LiveLesson() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: string, content: string}>>([]);
  const [transcript, setTranscript] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Start with greeting
    handleGreeting();
  }, []);

  const handleGreeting = async () => {
    try {
      const greeting = "Hello! I'm Alex, your English tutor. What would you like to talk about today?";
      setConversationHistory([{ role: 'assistant', content: greeting }]);
      await speakText(greeting);
    } catch (error) {
      console.error('Error with greeting:', error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording",
        description: "Speak now...",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      // Speech to Text
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const { data: sttData, error: sttError } = await supabase.functions.invoke('deepgram-stt', {
        body: formData,
      });

      if (sttError) throw sttError;

      const userText = sttData.transcript;
      if (!userText) {
        throw new Error('No transcript received');
      }

      setTranscript(userText);
      const newHistory = [...conversationHistory, { role: 'user', content: userText }];
      setConversationHistory(newHistory);

      // Get AI response
      const { data: chatData, error: chatError } = await supabase.functions.invoke('openai-chat', {
        body: {
          message: userText,
          conversationHistory: newHistory
        },
      });

      if (chatError) throw chatError;

      const aiReply = chatData.reply;
      setConversationHistory([...newHistory, { role: 'assistant', content: aiReply }]);

      // Speak the response
      await speakText(aiReply);

    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process audio",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const speakText = async (text: string) => {
    setIsSpeaking(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
        body: {
          text,
          voice: 'Sarah',
          model: 'eleven_turbo_v2_5'
        },
      });

      if (error) throw error;

      if (data.audioContent) {
        const audioBlob = base64ToBlob(data.audioContent, 'audio/mpeg');
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        await audio.play();
      }
    } catch (error) {
      console.error('Error speaking text:', error);
      setIsSpeaking(false);
    }
  };

  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="container max-w-4xl mx-auto py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card className="p-8">
          <div className="flex flex-col items-center gap-8">
            <AlexAvatar 
              isListening={isRecording} 
              isSpeaking={isSpeaking}
            />

            <div className="w-full space-y-4">
              {transcript && (
                <div className="bg-primary/10 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-1">You said:</p>
                  <p className="text-foreground">{transcript}</p>
                </div>
              )}

              {conversationHistory.length > 0 && (
                <div className="bg-secondary/10 p-4 rounded-lg max-h-48 overflow-y-auto">
                  <p className="text-sm font-medium mb-2">Conversation:</p>
                  {conversationHistory.slice(-4).map((msg, idx) => (
                    <p key={idx} className="text-sm mb-2">
                      <span className="font-semibold">
                        {msg.role === 'user' ? 'You: ' : 'Alex: '}
                      </span>
                      {msg.content}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <Button
              size="lg"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing || isSpeaking}
              className="w-full max-w-xs"
            >
              {isRecording ? (
                <>
                  <MicOff className="mr-2 h-5 w-5" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-5 w-5" />
                  {isProcessing ? 'Processing...' : isSpeaking ? 'Alex is speaking...' : 'Start Recording'}
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
