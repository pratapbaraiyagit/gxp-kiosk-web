import React, { useEffect, useRef } from "react";

const SpeakerVisualizer = ({
  media,
  lineColor = "#0d6efd",
  frequLnum = 60,
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    let isActive = true;

    const draw = () => {
      if (!canvasRef.current || !media?.analyser || !isActive) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const analyser = media.analyser;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const width = canvas.width;
      const height = canvas.height;

      const renderFrame = () => {
        if (!isActive) return;

        analyser.getByteFrequencyData(dataArray);

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

        animationRef.current = requestAnimationFrame(renderFrame);
      };

      renderFrame();
    };

    draw();

    return () => {
      isActive = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [media, lineColor, frequLnum]);

  return (
    <div style={{ position: "relative" }}>
      <canvas
        ref={canvasRef}
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
          Click "TEST SPEAKER" to start
        </div>
      )}
    </div>
  );
};

export default SpeakerVisualizer;
