import React, { useEffect, useRef } from "react";

const AudioVisualizer = ({ media, lineColor = "#00ff00", frequLnum = 60 }) => {
  const canvasSpeakerRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  useEffect(() => {
    let isActive = true;

    const setupVisualization = async () => {
      if (!media || !isActive) return;

      try {
        // Cleanup previous context if it exists
        if (audioContextRef.current) {
          await audioContextRef.current.close();
        }

        // Initialize new audio context and analyzer
        audioContextRef.current = new (window.AudioContext ||
          window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 128;
        analyserRef.current.smoothingTimeConstant = 0.8;

        const source = audioContextRef.current.createMediaStreamSource(media);
        source.connect(analyserRef.current);

        // Start visualization
        if (isActive) {
          drawVisualization();
        }
      } catch (error) {
        // console.error("Error setting up audio visualization:", error);
      }
    };

    const drawVisualization = () => {
      if (!canvasSpeakerRef.current || !analyserRef.current || !isActive) return;

      const canvas = canvasSpeakerRef.current;
      const ctx = canvas.getContext("2d");
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        if (!isActive) return;

        const width = canvas.width;
        const height = canvas.height;

        analyserRef.current.getByteFrequencyData(dataArray);

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);

        const barWidth = (width / frequLnum) * 0.8;
        const barSpacing = (width / frequLnum) * 0.2;

        for (let i = 0; i < frequLnum; i++) {
          const dataIndex = Math.floor((i * bufferLength) / frequLnum);
          const value = dataArray[dataIndex];

          const minHeight = 2;
          const barHeight = Math.max((value / 255) * height, minHeight);

          const x = i * (barWidth + barSpacing);
          const y = height - barHeight;

          const gradient = ctx.createLinearGradient(x, y, x, height);
          gradient.addColorStop(0, lineColor);
          gradient.addColorStop(1, `${lineColor}80`);

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [2]);
          ctx.fill();
        }

        animationRef.current = requestAnimationFrame(draw);
      };

      draw();
    };

    setupVisualization();

    return () => {
      isActive = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [media, lineColor, frequLnum]);

  return (
    <div
      className="audio-visualizer-container"
      style={{ position: "relative" }}
    >
      <canvas
        ref={canvasSpeakerRef}
        width="600"
        height="100"
        style={{
          width: "100%",
          height: "100px",
          background: "#ffffff",
          borderRadius: "8px",
          border: "1px solid rgba(0,0,0,0.1)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        }}
      />
      {!media && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "#666",
            fontSize: "14px",
          }}
        >
          Speak to test microphone
        </div>
      )}
    </div>
  );
};

export default AudioVisualizer;
