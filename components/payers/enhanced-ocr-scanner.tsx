"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createWorker, PSM } from "tesseract.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Scan,
  Camera,
  CameraOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
  History,
  Search,
  X,
  RotateCw,
} from "./scanner-icons";
import { fetchJson } from "@/lib/api/fetch-json";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils/date-format";
import { animations } from "@/lib/utils/animations";

type DrawingData = {
  id: string;
  dwgNo: string;
  status: "APP" | "REV" | "REJ" | "PND" | "FFU";
  description: string;
  totalWeightTons: number;
  latestSubmittedDate: string;
  weeksSinceSent: number;
  releaseStatus?: string;
  projectId?: string;
  projectName?: string;
  pdfPath?: string;
};

type ScanHistoryItem = {
  id: string;
  extracted_text: string;
  detected_drawing_number: string | null;
  ocr_confidence: number | null;
  processing_time_ms: number | null;
  language_detected: string | null;
  device_type: string | null;
  created_at: string;
  drawing_data: DrawingData | null;
};

type DetectedText = {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
};

/**
 * Enhanced OCR Scanner Component
 * Real-time text extraction from camera feed using Tesseract.js
 */
export function EnhancedOCRScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraAvailable, setCameraAvailable] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("eng");
  const [drawingData, setDrawingData] = useState<DrawingData | null>(null);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment"); // Default to back camera
  
  const isMobile = useIsMobile();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<any>(null);
  const processingRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastProcessedTimeRef = useRef<number>(0);
  const lastSavedTimeRef = useRef<number>(0);
  const autoScanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const queryClient = useQueryClient();

  // Fetch scan history
  const { data: scanHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["scan-history"],
    queryFn: () => fetchJson<ScanHistoryItem[]>("/api/scans/history?limit=20"),
    staleTime: 30_000,
  });

  // Save scan mutation
  const saveScanMutation = useMutation({
    mutationFn: async (scanData: {
      extracted_text: string;
      detected_drawing_number?: string;
      ocr_confidence?: number;
      processing_time_ms?: number;
      language_detected?: string;
      device_type?: string;
      camera_facing?: string;
      image_width?: number;
      image_height?: number;
      drawing_data?: DrawingData;
    }) => {
      return fetchJson("/api/scans/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scanData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scan-history"] });
    },
  });

  // Search drawing mutation
  const searchDrawingMutation = useMutation({
    mutationFn: async (dwgNo: string) => {
      return fetchJson<DrawingData>(`/api/drawings/search?dwgNo=${encodeURIComponent(dwgNo)}`);
    },
    onSuccess: (data) => {
      setDrawingData(data);
    },
    onError: (error: any) => {
      // Silent error handling - no toast notifications
    },
  });

  // Initialize OCR worker
  const initializeWorker = useCallback(async () => {
    if (workerRef.current) return workerRef.current;

    try {
      const worker = await createWorker(selectedLanguage, 1, {
        logger: (m) => {
          // Silent logging for performance
        },
      });
      
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.AUTO,
        // Remove character whitelist to support all fonts and characters
        // tessedit_char_whitelist removed for better font support
        tessedit_ocr_engine_mode: "1", // Use LSTM OCR engine for better accuracy
      });

      workerRef.current = worker;
      return worker;
    } catch (error) {
      // Silent error handling - rethrow for caller to handle
      throw error;
    }
  }, [selectedLanguage]);

  // Capture photo and process with OCR
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || processingRef.current) {
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);
    setDrawingData(null);

    try {
      // Set canvas size to video size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0);
      
      // Convert canvas to image data URL for display
      const imageDataUrl = canvas.toDataURL("image/png");
      setCapturedImage(imageDataUrl);
      
      // Save to local storage
      saveToLocalStorage(imageDataUrl);
      
      // Get image data for processing
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Apply low-light enhancement
      enhanceImage(imageData);
      ctx.putImageData(imageData, 0, 0);

      // Perform OCR
      const worker = await initializeWorker();
      const startTime = Date.now();
      
      const { data } = await worker.recognize(canvas, {
        rectangle: undefined, // Process full image
      });

      const processingTime = Date.now() - startTime;

      if (data.text.trim()) {
        // Extract drawing number and search (don't store text or stats)
        const drawingNumber = extractDrawingNumber(data.text);
        if (drawingNumber) {
          // Search for drawing and update state when found
          searchDrawingMutation.mutate(drawingNumber, {
            onSuccess: (foundDrawing) => {
              // Update drawing data in scan history after search completes
              if (foundDrawing) {
                setDrawingData(foundDrawing);
              }
            },
          });
        }

        // Save to history (drawing data will be null initially, can be updated later)
        saveScanMutation.mutate({
          extracted_text: data.text,
          detected_drawing_number: drawingNumber || undefined,
          ocr_confidence: data.confidence,
          processing_time_ms: processingTime,
          language_detected: selectedLanguage,
          device_type: isMobile ? "mobile" : "desktop",
          camera_facing: cameraFacing === "environment" ? "back" : "front",
          image_width: canvas.width,
          image_height: canvas.height,
          // drawing_data will be null initially, can be updated after search completes
        });
      }
    } catch (error) {
      // Silent error handling
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [initializeWorker, selectedLanguage, isMobile, cameraFacing, searchDrawingMutation, saveScanMutation]);

  // Image enhancement for low-light conditions
  const enhanceImage = (imageData: ImageData) => {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      // Increase brightness
      data[i] = Math.min(255, data[i] * 1.2);     // R
      data[i + 1] = Math.min(255, data[i + 1] * 1.2); // G
      data[i + 2] = Math.min(255, data[i + 2] * 1.2); // B
      
      // Increase contrast
      const factor = 1.1;
      data[i] = Math.min(255, Math.max(0, (data[i] - 128) * factor + 128));
      data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * factor + 128));
      data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * factor + 128));
    }
  };

  // Extract drawing number from text
  const extractDrawingNumber = (text: string): string | null => {
    const patterns = [
      /Drawing\s+No[.:]?\s*([A-Z0-9\-]+)/i,
      /Drawing\s+Number[.:]?\s*([A-Z0-9\-]+)/i,
      /DWG[.:]?\s*([A-Z0-9\-]+)/i,
      /([A-Z]\s*-\s*[A-Z0-9]+)/, // Matches "R-1", "A-2", etc.
      /([A-Z]{1,3}\s*-\s*[0-9]+)/, // Matches "R-1", "ABC-123", etc.
      /([A-Z]{1,3}\s*[0-9]{1,4})/, // Matches "R1", "ABC123", etc.
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim().toUpperCase().replace(/\s+/g, "");
      }
    }
    return null;
  };

  // Start camera for photo capture
  const startScanning = async () => {
    try {
      // SSR safety check
      if (typeof window === "undefined" || typeof navigator === "undefined") {
        setCameraAvailable(false);
        return;
      }
      
      setCameraError(null);
      setCapturedImage(null);
      setDrawingData(null);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraAvailable(false);
        return;
      }

      // Request camera with optimal settings
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: cameraFacing, // Use selected camera (back or front)
          width: { ideal: 1280 },
          height: { ideal: 720 },
          // Advanced features (may not be supported on all devices)
          advanced: [
            { focusMode: "continuous" },
            { exposureMode: "continuous" },
          ] as any,
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
          
          // Auto-scan when video is ready
          const handleVideoReady = () => {
            // Clear any existing timeout
            if (autoScanTimeoutRef.current) {
              clearTimeout(autoScanTimeoutRef.current);
            }
            
            // Wait a bit for camera to stabilize, then auto-capture
            autoScanTimeoutRef.current = setTimeout(() => {
              if (videoRef.current && videoRef.current.readyState >= videoRef.current.HAVE_ENOUGH_DATA && !processingRef.current) {
                capturePhoto().catch(() => {
                  // Silent error handling
                });
              }
              autoScanTimeoutRef.current = null;
            }, 1500); // Wait 1.5 seconds for camera to stabilize
          };
          
          // Set up auto-scan
          videoRef.current.addEventListener('loadedmetadata', handleVideoReady, { once: true });
          
          // Also try if already loaded
          if (videoRef.current.readyState >= videoRef.current.HAVE_ENOUGH_DATA) {
            handleVideoReady();
          }
        } catch (playError) {
          // Silent error handling - video might still work
        }
      }

      setHasCameraPermission(true);
      setCameraAvailable(true);
      setIsScanning(true);
    } catch (error: any) {
      setIsScanning(false);
      
      if (error.name === "NotAllowedError") {
        setHasCameraPermission(false);
        setCameraAvailable(true);
      } else if (error.name === "NotFoundError") {
        setCameraAvailable(false);
      }
    }
  };

  // Save captured image to local storage (SSR-safe)
  const saveToLocalStorage = (imageDataUrl: string) => {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return; // Skip on server-side
      }
      
      const timestamp = new Date().toISOString();
      const storageKey = `captured_image_${timestamp}`;
      
      // Get existing images from local storage
      const existingImages = JSON.parse(
        localStorage.getItem("captured_images") || "[]"
      );
      
      // Add new image
      const newImage = {
        id: storageKey,
        dataUrl: imageDataUrl,
        timestamp: timestamp,
      };
      
      existingImages.push(newImage);
      
      // Keep only last 50 images to avoid storage issues
      const imagesToKeep = existingImages.slice(-50);
      
      // Save to local storage
      localStorage.setItem("captured_images", JSON.stringify(imagesToKeep));
      localStorage.setItem(storageKey, imageDataUrl);
    } catch (error) {
      // Silent error handling
    }
  };

  // Switch camera (front/back)
  const switchCamera = async () => {
    if (!isScanning || !streamRef.current) return;

    try {
      // Stop current stream
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Toggle camera facing mode
      const newFacingMode = cameraFacing === "environment" ? "user" : "environment";
      setCameraFacing(newFacingMode);

      // Request new camera
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: newFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          advanced: [
            { focusMode: "continuous" },
            { exposureMode: "continuous" },
          ] as any,
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playError) {
          // Silent error handling - video might still work
        }
      }
    } catch (error: any) {
      // Silent error handling
    }
  };

  // Stop scanning and cleanup
  const stopScanning = () => {
    // Clear auto-scan timeout
    if (autoScanTimeoutRef.current) {
      clearTimeout(autoScanTimeoutRef.current);
      autoScanTimeoutRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      // Remove event listeners
      videoRef.current.onloadedmetadata = null;
      videoRef.current.onerror = null;
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
    setCapturedImage(null);
    setDrawingData(null);
  };


  // Cleanup
  useEffect(() => {
    return () => {
      stopScanning();
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // Check camera availability (SSR-safe)
  useEffect(() => {
    if (typeof window === "undefined") {
      setCameraAvailable(false);
      return;
    }
    
    if (typeof navigator !== "undefined" && 
        navigator.mediaDevices && 
        typeof navigator.mediaDevices.getUserMedia === "function") {
      setCameraAvailable(null);
    } else {
      setCameraAvailable(false);
    }
  }, []);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="scanner" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scanner">Scanner</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="space-y-4">
          <Card>
            <CardHeader className="border-b shrink-0 bg-emerald-50/70 p-6">
              <CardTitle className="text-lg font-semibold text-emerald-900 flex items-center gap-2">
                <Scan className="h-5 w-5" />
                Real-Time OCR Scanner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Camera Controls */}
              {!isScanning && (
                <div className={`flex flex-wrap gap-2 ${animations.fadeIn}`}>
                  {cameraAvailable !== false && (
                    <Button
                      onClick={startScanning}
                      className={`gap-2 ${animations.buttonHover}`}
                      size="lg"
                    >
                      <Camera className="h-5 w-5" />
                      Open Camera
                    </Button>
                  )}
                </div>
              )}

              {isScanning && (
                <div className={`flex flex-wrap gap-2 items-center ${animations.slideDown}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={switchCamera}
                    className={`gap-2 ${animations.buttonHover}`}
                    title={`Switch to ${cameraFacing === "environment" ? "front" : "back"} camera`}
                  >
                    <RotateCw className="h-4 w-4" />
                    {cameraFacing === "environment" ? "Front" : "Back"}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={stopScanning}
                    className="gap-2 ml-auto"
                  >
                    <CameraOff className="h-4 w-4" />
                    Close
                  </Button>
                </div>
              )}

              {/* Camera View */}
              {isScanning && (
                <div className={`space-y-4 ${animations.scaleIn}`}>
                  <div className={`relative w-full rounded-lg overflow-hidden border-2 border-primary bg-black ${animations.smooth}`}>
                    {capturedImage ? (
                      <img
                        src={capturedImage}
                        alt="Captured"
                        className="w-full h-auto max-h-[60vh] object-contain"
                        style={{ transform: cameraFacing === "user" ? "scaleX(-1)" : "none" }}
                      />
                    ) : (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-auto max-h-[60vh] object-contain"
                        style={{ transform: cameraFacing === "user" ? "scaleX(-1)" : "none" }}
                        onError={(e) => {
                          setCameraError("Video playback error. Please try again.");
                          setIsScanning(false);
                        }}
                        onLoadedMetadata={() => {
                          // Video is ready
                          setCameraError(null);
                        }}
                      />
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                    
                    {isProcessing && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <div className="bg-black/90 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Processing image...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Manual Capture Button (optional) */}
                  {!capturedImage && !isProcessing && (
                    <div className={`flex justify-center ${animations.fadeIn}`}>
                      <Button
                        onClick={capturePhoto}
                        size="lg"
                        className={`gap-2 ${animations.buttonHover}`}
                        disabled={isProcessing}
                        variant="outline"
                      >
                        <Camera className="h-5 w-5" />
                        Scan Again
                      </Button>
                    </div>
                  )}

                  {/* Retake Button */}
                  {capturedImage && !isProcessing && (
                    <div className="flex justify-center gap-2">
                      <Button
                        onClick={() => {
                          setCapturedImage(null);
                          setDrawingData(null);
                          // Auto-scan again after retake
                          setTimeout(() => {
                            if (videoRef.current && videoRef.current.readyState >= videoRef.current.HAVE_ENOUGH_DATA && !processingRef.current) {
                              capturePhoto().catch(() => {
                                // Silent error handling
                              });
                            }
                          }, 500);
                        }}
                        variant="outline"
                        size="lg"
                        className="gap-2"
                      >
                        <X className="h-5 w-5" />
                        Retake
                      </Button>
                      <Button
                        onClick={capturePhoto}
                        size="lg"
                        className="gap-2"
                        disabled={isProcessing}
                      >
                        <Camera className="h-5 w-5" />
                        Scan Again
                      </Button>
                    </div>
                  )}
                </div>
              )}


              {/* Drawing Data Display */}
              {drawingData && (
                <Card className={`bg-emerald-50 dark:bg-emerald-950 ${animations.cardEnter}`}>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <span className="font-semibold">Drawing Found: {drawingData.dwgNo}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Status:</span>{" "}
                          <Badge>{drawingData.status}</Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Weight:</span>{" "}
                          {drawingData.totalWeightTons.toFixed(2)} Tons
                        </div>
                        {drawingData.projectName && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Project:</span>{" "}
                            {drawingData.projectName}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Error Messages */}
              {cameraError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Camera Error</AlertTitle>
                  <AlertDescription>{cameraError}</AlertDescription>
                </Alert>
              )}

              {cameraAvailable === false && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Camera Not Available</AlertTitle>
                  <AlertDescription>
                    Camera access is not available in this browser or device.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader className="border-b shrink-0 bg-emerald-50/70 p-6">
              <CardTitle className="text-lg font-semibold text-emerald-900 flex items-center gap-2">
                <History className="h-5 w-5" />
                Scan History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : !scanHistory || scanHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No scan history yet</p>
                  <p className="text-sm mt-2">Start scanning to see your history here</p>
                </div>
              ) : (
                <ScrollArea className="h-[60vh]">
                  <div className="space-y-3">
                    {scanHistory.map((scan) => (
                      <Card key={scan.id} className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {scan.detected_drawing_number && (
                                  <Badge variant="default">
                                    {scan.detected_drawing_number}
                                  </Badge>
                                )}
                                {scan.ocr_confidence && (
                                  <Badge variant="outline">
                                    {scan.ocr_confidence.toFixed(0)}% confidence
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {scan.extracted_text}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span>{formatDate(scan.created_at)}</span>
                                {scan.processing_time_ms && (
                                  <span>{scan.processing_time_ms}ms</span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              {scan.detected_drawing_number && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => searchDrawingMutation.mutate(scan.detected_drawing_number!)}
                                >
                                  <Search className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  await fetchJson(`/api/scans/history?id=${scan.id}`, {
                                    method: "DELETE",
                                  });
                                  queryClient.invalidateQueries({ queryKey: ["scan-history"] });
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

