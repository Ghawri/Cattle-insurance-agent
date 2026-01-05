import React, { useState, useRef } from "react";
import { Camera, Video, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface CameraCaptureProps {
  label: string;
  onCapture: (file: File) => void;
  type: "photo" | "video";
  capturedFile?: File | null;
}

export function CameraCapture({
  label,
  onCapture,
  type,
  capturedFile,
}: CameraCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
             facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: type === "video",
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        // Ensure video plays
        try {
          videoRef.current.onloadedmetadata = () => {

              console.log(
      'Camera ready:',
      videoRef.current?.videoWidth,
      videoRef.current?.videoHeight
    );
    
            videoRef.current?.play();
          };
        } catch (playError) {
          console.error("Video play error:", playError);
        }
      }
      setIsCapturing(true);
    } catch (error: any) {
      console.error("Camera access error:", error);

      // Provide user-friendly error messages
      if (error.name === "NotAllowedError") {
        setError(
          "Camera permission denied. Please allow camera access in your browser settings and try again."
        );
      } else if (error.name === "NotFoundError") {
        setError("No camera found on this device.");
      } else if (error.name === "NotReadableError") {
        setError("Camera is already in use by another application.");
      } else {
        setError("Unable to access camera. Please check your device settings.");
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) {
      console.error("Video ref is null");
      setError("Camera not ready. Please try again.");
      return;
    }

    console.log("Capturing photo...", {
      videoWidth: videoRef.current.videoWidth,
      videoHeight: videoRef.current.videoHeight,
      readyState: videoRef.current.readyState,
    });

    if (
      videoRef.current.videoWidth === 0 ||
      videoRef.current.videoHeight === 0
    ) {
      console.error("Video dimensions are zero");
      setError("Camera not ready. Please wait a moment and try again.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], `photo_${Date.now()}.jpg`, {
              type: "image/jpeg",
            });
            console.log("Photo captured successfully:", file.size, "bytes");
            onCapture(file);
            setPreviewUrl(URL.createObjectURL(blob));
            stopCamera();
          } else {
            console.error("Failed to create blob");
            setError("Failed to capture photo. Please try again.");
          }
        },
        "image/jpeg",
        0.9
      );
    }
  };

  const startVideoRecording = () => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: "video/webm",
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const file = new File([blob], `video_${Date.now()}.webm`, {
        type: "video/webm",
      });
      onCapture(file);
      setPreviewUrl(URL.createObjectURL(blob));
      stopCamera();
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;

    // Auto-stop after 30 seconds
    setTimeout(() => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    }, 30000);
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const retake = () => {
    setPreviewUrl(null);
    if (capturedFile) {
      URL.revokeObjectURL(URL.createObjectURL(capturedFile));
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm">{label}</p>
          {capturedFile && (
            <span className="text-xs text-green-600">✓ Captured</span>
          )}
        </div>

        {!isCapturing && !previewUrl && (
          <Button
            onClick={startCamera}
            variant="outline"
            className="w-full h-40 border-2 border-dashed"
          >
            {type === "photo" ? (
              <div className="flex flex-col items-center gap-2">
                <Camera className="w-8 h-8" />
                <span>Tap to Capture</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Video className="w-8 h-8" />
                <span>Tap to Record</span>
              </div>
            )}
          </Button>
        )}

        {isCapturing && (
          <div className="space-y-2">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={type === "photo"}
              className="w-full h-[300px] rounded-lg bg-black"
              style={{ objectFit: "cover" }}
            />

            <div className="flex gap-2">
              {type === "photo" ? (
                <>
                  <Button onClick={capturePhoto} className="flex-1">
                    <Camera className="w-4 h-4 mr-2" />
                    Take Photo
                  </Button>
                  <Button onClick={stopCamera} variant="outline">
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  {!mediaRecorderRef.current ||
                  mediaRecorderRef.current.state !== "recording" ? (
                    <Button onClick={startVideoRecording} className="flex-1">
                      <Video className="w-4 h-4 mr-2" />
                      Start Recording
                    </Button>
                  ) : (
                    <Button
                      onClick={stopVideoRecording}
                      className="flex-1"
                      variant="destructive"
                    >
                      Stop Recording
                    </Button>
                  )}
                  <Button onClick={stopCamera} variant="outline">
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {previewUrl && (
          <div className="space-y-2">
            {type === "photo" ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full rounded-lg"
              />
            ) : (
              <video src={previewUrl} controls className="w-full rounded-lg" />
            )}
            <Button onClick={retake} variant="outline" className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" />
              Retake
            </Button>
          </div>
        )}

        {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
      </div>
    </Card>
  );
}
