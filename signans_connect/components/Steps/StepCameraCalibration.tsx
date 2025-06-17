import React, { useState, useEffect, useRef, useCallback } from "react";
import VideoStream from '@/components/VideoStream';

type StepCameraCalibrationProps = {
  handleStepComplete: (step: string) => void;
  status: string;
};

type Coordinates = { X: number; Y: number; Z: number } | null;

const StepCameraCalibration: React.FC<StepCameraCalibrationProps> = ({
  handleStepComplete,
}) => {
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [cameraCoords, setCameraCoords] = useState<Coordinates>(null);

  const [draggedPoints, setDraggedPoints] = useState([
    { id: 1, x: 0, y: 0 },
    { id: 2, x: 0, y: 0 },
    { id: 3, x: 0, y: 0 },
    { id: 4, x: 0, y: 0 },
  ]);

  const socketRef_Camera = useRef<WebSocket | null>(null);
  const socketRefPoints = useRef<WebSocket | null>(null);

  const canvasRefOriginal = useRef<HTMLCanvasElement | null>(null);
  const canvasRefTransformed = useRef<HTMLCanvasElement | null>(null);

  const isDraggingRef = useRef(false);
  const currentDragPointRef = useRef<number | null>(null);

  const drawPoints = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const scaleX = ctx.canvas.width / 1080;
    const scaleY = ctx.canvas.height / 1920;

    if (draggedPoints.length >= 2) {
      ctx.beginPath();
      const first = draggedPoints[0];
      ctx.moveTo(first.x * scaleX, first.y * scaleY);
      draggedPoints.slice(1).forEach((point) => {
        ctx.lineTo(point.x * scaleX, point.y * scaleY);
      });
      ctx.lineTo(first.x * scaleX, first.y * scaleY);
      ctx.strokeStyle = "lime";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.font = "14px Arial";
    ctx.fillStyle = "red";

    draggedPoints.forEach((point) => {
      const cx = point.x * scaleX;
      const cy = point.y * scaleY;

      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillText(`(${Math.round(point.x)}, ${Math.round(point.y)})`, cx + 10, cy - 10);
    });
  }, [draggedPoints]);

  useEffect(() => {
    socketRef_Camera.current = new WebSocket("ws://robosignans1:8000/ws/captureCameraPosition/");

    socketRef_Camera.current.onopen = () => {
      console.log("Camera position socket connected");
    };

    socketRef_Camera.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.status === "captured" && data.positionName === "cameraPosition" && data.position) {
        setCameraCoords({
          X: data.position[0],
          Y: data.position[1],
          Z: data.position[2],
        });
        setIsCalibrated(true);
      }

      if (data.status === "error" && data.message) {
        setIsCalibrated(false);
        console.error("Camera capture error:", data.message);
      }
    };

    return () => {
      socketRef_Camera.current?.close();
    };
  }, []);

  const handleCapture = () => {
    if (socketRef_Camera.current?.readyState === WebSocket.OPEN) {
      handleStepComplete("Camera Calibration");
    } else {
      console.error("WebSocket not open.");
    }
  };

  useEffect(() => {
    const canvas = canvasRefOriginal.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext("2d");
    if (ctx) drawPoints(ctx);
  }, [drawPoints]);

  useEffect(() => {
    const canvas = canvasRefOriginal.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (ctx) drawPoints(ctx);
  }, [draggedPoints, drawPoints]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRefOriginal.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      const ctx = canvas.getContext("2d");
      if (ctx) drawPoints(ctx);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawPoints]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRefOriginal.current;
    if (!canvas) return;

    const { offsetX, offsetY } = e.nativeEvent;
    const scaleX = canvas.width / 1080;
    const scaleY = canvas.height / 1920;

    draggedPoints.forEach((point, index) => {
      const pointX = point.x * scaleX;
      const pointY = point.y * scaleY;
      const distance = Math.sqrt((offsetX - pointX) ** 2 + (offsetY - pointY) ** 2);

      if (distance < 10) {
        isDraggingRef.current = true;
        currentDragPointRef.current = index;
      }
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || currentDragPointRef.current === null) return;
    const canvas = canvasRefOriginal.current;
    if (!canvas) return;

    const { offsetX, offsetY } = e.nativeEvent;
    const scaleX = 1080 / canvas.width;
    const scaleY = 1920 / canvas.height;

    const newPoints = [...draggedPoints];
    newPoints[currentDragPointRef.current] = {
      ...newPoints[currentDragPointRef.current],
      x: offsetX * scaleX,
      y: offsetY * scaleY,
    };

    setDraggedPoints(newPoints);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    currentDragPointRef.current = null;

    if (socketRefPoints.current?.readyState === WebSocket.OPEN) {
      socketRefPoints.current.send(JSON.stringify(draggedPoints));
    }
  };

  useEffect(() => {
    socketRefPoints.current = new WebSocket("ws://robosignans1:8000/ws/camera_perspective_transform/");

    socketRefPoints.current.onopen = () => {
      console.log("Connected to points WebSocket");
    };

    socketRefPoints.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (Array.isArray(data)) {
        setDraggedPoints(data);
      }
    };

    socketRefPoints.current.onclose = () => {
      console.log("WebSocket closed");
    };

    return () => {
      socketRefPoints.current?.close();
    };
  }, []);

  return (
    <div className="max-h-[80vh] p-4">
      <div className="grid grid-cols-2 gap-4 w-full h-[70vh]">
        <div className="relative w-full h-full">
          <VideoStream imageUrl="http://robosignans1:8000/video" />
          <canvas
            ref={canvasRefOriginal}
            className="absolute top-0 left-0 w-full h-full"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseOut={handleMouseUp}
          />
        </div>

        <div className="relative w-full h-full">
          <VideoStream imageUrl="http://robosignans1:8000/video_transformed" />
          <canvas
            ref={canvasRefTransformed}
            className="absolute top-0 left-0 w-full h-full"
          />
        </div>
      </div>

      <div className="text-center mt-6">
        <button className="btn btn-outline" onClick={handleCapture}>
          Capture Position
        </button>
        <p className="mt-2">
          Status: {isCalibrated ? (
            <span className="text-success font-semibold">Complete</span>
          ) : (
            <span className="text-warning">In Progress</span>
          )}
        </p>
        {cameraCoords ? (
          <div className="text-sm mt-2 text-gray-500">
            X: {cameraCoords.X?.toFixed(1)} | Y: {cameraCoords.Y?.toFixed(1)} | Z: {cameraCoords.Z?.toFixed(1)}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Camera position not captured yet.</p>
        )}
      </div>
    </div>
  );
};

export default StepCameraCalibration;
