import { useEffect, useRef } from 'react';

interface AlexAvatarProps {
  isListening: boolean;
  isSpeaking: boolean;
}

export const AlexAvatar = ({ isListening, isSpeaking }: AlexAvatarProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const animate = () => {
      time += 0.05;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Head
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(150, 120, 80, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#000';
      const leftEyeY = 105 + (isSpeaking ? Math.sin(time * 10) * 2 : 0);
      const rightEyeY = 105 + (isSpeaking ? Math.sin(time * 10) * 2 : 0);
      
      ctx.beginPath();
      ctx.arc(125, leftEyeY, 8, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(175, rightEyeY, 8, 0, Math.PI * 2);
      ctx.fill();

      // Mouth
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      
      if (isSpeaking) {
        const mouthHeight = 15 + Math.abs(Math.sin(time * 15)) * 10;
        ctx.ellipse(150, 145, 20, mouthHeight, 0, 0, Math.PI);
      } else if (isListening) {
        ctx.arc(150, 140, 15, 0, Math.PI);
      } else {
        ctx.arc(150, 135, 20, 0, Math.PI);
      }
      
      ctx.stroke();

      // Listening indicator
      if (isListening && !isSpeaking) {
        ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
        const pulseRadius = 90 + Math.sin(time * 3) * 10;
        ctx.beginPath();
        ctx.arc(150, 120, pulseRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isListening, isSpeaking]);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        width={300}
        height={240}
        className="rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10"
      />
      <div className="text-center">
        <h3 className="text-xl font-semibold">Alex the Tutor</h3>
        <p className="text-sm text-muted-foreground">
          {isSpeaking ? 'Speaking...' : isListening ? 'Listening...' : 'Ready to chat!'}
        </p>
      </div>
    </div>
  );
};
