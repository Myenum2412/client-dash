"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Html5Qrcode } from "html5-qrcode";
import { createWorker } from "tesseract.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Scan, Search, X, FileText, Calendar, Weight, Package, Building2, Camera, CameraOff, AlertCircle, Image as ImageIcon, Download, Loader2, Eye, EyeOff } from "lucide-react";
import { fetchJson } from "@/lib/api/fetch-json";
import { formatDate } from "@/lib/utils/date-format";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

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

function getStatusBadge(status: DrawingData["status"]) {
  const variants: Record<DrawingData["status"], "default" | "secondary" | "destructive" | "outline"> = {
    APP: "default",
    REV: "secondary",
    REJ: "destructive",
    PND: "outline",
    FFU: "secondary",
  };

  const colors: Record<DrawingData["status"], string> = {
    APP: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    REV: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    REJ: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    PND: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    FFU: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  };

  return (
    <Badge className={colors[status]} variant={variants[status]}>
      {status}
    </Badge>
  );
}

export function DrawingScanner() {
  const [scanValue, setScanValue] = useState("");
  const [searchDwgNo, setSearchDwgNo] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraAvailable, setCameraAvailable] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [showExtractedText, setShowExtractedText] = useState(false);
  const isMobile = useIsMobile();
  const inputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastScannedRef = useRef<string>("");

  const { data: drawing, isLoading, error } = useQuery({
    queryKey: ["drawing-search", searchDwgNo],
    queryFn: () => fetchJson<DrawingData>(`/api/drawings/search?dwgNo=${encodeURIComponent(searchDwgNo!)}`),
    enabled: !!searchDwgNo && searchDwgNo.trim().length > 0,
    retry: false,
  });

  // Check if MediaDevices API is available (don't check actual camera until user requests it)
  useEffect(() => {
    if (typeof navigator !== "undefined" && 
        navigator.mediaDevices && 
        typeof navigator.mediaDevices.getUserMedia === "function") {
      // API is available, but we don't know about camera yet
      // Don't set cameraAvailable to false - let user try first
      setCameraAvailable(null); // null = unknown, will check on first use
    } else {
      setCameraAvailable(false); // API not available at all
    }
  }, []);

  const handleScan = () => {
    const trimmed = scanValue.trim();
    if (!trimmed) {
      toast.error("Please enter a drawing number");
      return;
    }
    setSearchDwgNo(trimmed);
  };

  const handleClear = () => {
    setScanValue("");
    setSearchDwgNo(null);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleScan();
    }
  };

  const startCameraScan = async () => {
    setCameraError(null);
    
    // First, request camera permission explicitly
    try {
      // Check if API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraAvailable(false);
        setCameraError("Camera API is not supported in this browser.");
        toast.error("Camera not supported in this browser");
        return;
      }

      // Request permission first (this will show browser permission dialog)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: isMobile 
          ? { facingMode: "environment" } // Mobile: prefer back camera
          : true // Desktop: any camera
      });
      
      // Permission granted - stop the test stream
      stream.getTracks().forEach(track => track.stop());
      
      // Set states
      setHasCameraPermission(true);
      setCameraAvailable(true);
      setIsScanning(true);
      
      toast.success("Camera access granted");
    } catch (permError: any) {
      // Permission denied or other error
      setIsScanning(false);
      
      if (permError.name === "NotAllowedError" || permError.name === "PermissionDeniedError") {
        setHasCameraPermission(false);
        setCameraAvailable(true); // Camera exists but permission denied
        setCameraError("Camera permission denied. Please allow camera access in your browser settings.");
        toast.error("Camera permission denied. Please allow camera access.");
      } else if (permError.name === "NotFoundError" || permError.name === "DevicesNotFoundError") {
        setCameraAvailable(false);
        setCameraError("No camera found. Please connect a camera device.");
        toast.error("No camera found");
      } else if (permError.name === "NotReadableError" || permError.name === "TrackStartError") {
        setCameraAvailable(true);
        setCameraError("Camera is already in use by another application.");
        toast.error("Camera is busy");
      } else {
        setCameraAvailable(true);
        setCameraError(`Camera error: ${permError.message || "Unknown error"}`);
        toast.error("Failed to access camera");
      }
    }
  };

  // Start camera scan once container is rendered and permission is granted
  useEffect(() => {
    if (!isScanning || !scanContainerRef.current || !hasCameraPermission) {
      return;
    }

    const initializeScanner = async () => {
      try {
        // Check if MediaDevices API is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setCameraError("Camera API is not supported in this browser.");
          toast.error("Camera not supported");
          setIsScanning(false);
          setCameraAvailable(false);
          return;
        }

        const scanner = new Html5Qrcode(scanContainerRef.current!.id);
        scannerRef.current = scanner;

        // Build camera configurations to try
        // On mobile: ALWAYS use back camera (environment)
        // On desktop: use any available camera
        const cameraConfigs: (string | { facingMode: string } | { deviceId: { exact: string } })[] = [];
        
        if (isMobile) {
          // Mobile: ALWAYS prioritize back camera (environment)
          cameraConfigs.push(
            { facingMode: "environment" }, // Back camera - primary for mobile
            "environment",                  // String format for back camera
            // Only add front camera as last resort if back camera fails
            { facingMode: "user" },
            "user"
          );
        } else {
          // Desktop: Try to enumerate devices first, then use facingMode
          let availableDevices: MediaDeviceInfo[] = [];
          try {
            // Request permission to get device labels
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop()); // Stop the stream
            const devices = await navigator.mediaDevices.enumerateDevices();
            availableDevices = devices.filter(device => device.kind === "videoinput");
            
            // Add device IDs if available
            for (const device of availableDevices) {
              cameraConfigs.push({ deviceId: { exact: device.deviceId } });
            }
          } catch {
            // If enumeration fails, use facingMode configs
          }
          
          // Add facingMode configs as fallback for desktop
          cameraConfigs.push(
            { facingMode: "user" },        // Front camera (preferred for desktop)
            "user",                        // String format fallback
            { facingMode: "environment" }, // Back camera (fallback)
            "environment"                 // String format fallback
          );
        }

        let scannerStarted = false;
        let lastError: unknown = null;
        let lastErrorMessage = "";

        // Try each camera configuration until one works
        for (const config of cameraConfigs) {
          try {
            // Optimize scanner config for mobile vs desktop
            const scannerConfig = isMobile
              ? {
                  fps: 15, // Higher FPS for better detection on mobile
                  qrbox: function(viewfinderWidth: number, viewfinderHeight: number) {
                    // Use 80% of the smaller dimension for mobile (larger scanning area)
                    const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                    const qrboxSize = Math.floor(minEdge * 0.8);
                    return {
                      width: qrboxSize,
                      height: qrboxSize
                    };
                  },
                  aspectRatio: 1.0,
                  disableFlip: false, // Allow flipping for better detection
                  videoConstraints: {
                    facingMode: "environment",
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                  }
                }
              : {
                  fps: 10,
                  qrbox: { width: 300, height: 300 }, // Larger box for desktop
                  aspectRatio: 1.0,
                };

            await scanner.start(
              config,
              scannerConfig,
              (decodedText) => {
                // Successfully scanned a code
                const trimmed = decodedText.trim().toUpperCase();
                
                // Prevent duplicate scans of the same code
                if (trimmed && trimmed !== lastScannedRef.current) {
                  lastScannedRef.current = trimmed;
                  setScanValue(trimmed);
                  setSearchDwgNo(trimmed);
                  stopCameraScan();
                  toast.success("Drawing number scanned successfully!");
                }
              },
              (errorMessage) => {
                // Ignore NotFoundException errors - they're normal while scanning
                // Only show errors for permission issues
                if (errorMessage.includes("NotAllowedError") || errorMessage.includes("PermissionDeniedError")) {
                  setCameraError(errorMessage);
                }
                // Don't show NotFoundException - it's expected while looking for codes
              }
            );
            
            // If we get here, scanner started successfully
            scannerStarted = true;
            setHasCameraPermission(true);
            setCameraAvailable(true);
            break;
          } catch (configError: unknown) {
            lastError = configError;
            lastErrorMessage = configError instanceof Error 
              ? configError.message 
              : typeof configError === 'string' 
              ? configError 
              : String(configError);
            
            // If it's a NotFoundError, continue to next config
            // Don't break the loop for NotFoundError
            const configErrorName = configError instanceof Error ? configError.name : undefined;
            if (lastErrorMessage.includes("NotFoundError") || 
                lastErrorMessage.includes("Requested device not found") ||
                configErrorName === "NotFoundError") {
              continue; // Try next configuration
            }
            
            // For other errors, we might want to continue or break
            // Continue for now to try all configs
            continue;
          }
        }

        // If all configurations failed, throw the last error
        if (!scannerStarted) {
          // If all configs failed with NotFoundError, it means no camera is available
          if (lastErrorMessage.includes("NotFoundError") || 
              lastErrorMessage.includes("Requested device not found")) {
            throw new Error("No camera device found. Please connect a camera and try again.");
          }
          const finalError = lastError instanceof Error 
            ? lastError 
            : new Error(lastErrorMessage || "Failed to start camera with any available configuration");
          throw finalError;
        }
      } catch (error: unknown) {
        setIsScanning(false);
        
        const errorMessage = error instanceof Error 
          ? error.message 
          : typeof error === 'string' 
          ? error 
          : "Failed to access camera";
        setCameraError(errorMessage);
        
        // Handle different error types
        const errorName = error instanceof Error ? error.name : undefined;
        if (errorMessage.includes("Permission denied") || 
            errorMessage.includes("NotAllowedError") || 
            errorMessage.includes("PermissionDeniedError") ||
            errorName === "NotAllowedError") {
          setHasCameraPermission(false);
          setCameraAvailable(true); // Camera exists but permission denied
          toast.error("Camera permission denied. Please allow camera access in your browser settings.");
        } else if (errorMessage.includes("NotFoundError") || 
                   errorMessage.includes("No camera found") ||
                   errorMessage.includes("DevicesNotFoundError") ||
                   errorName === "NotFoundError") {
          setCameraAvailable(false);
          toast.error("No camera found. Please connect a camera device.");
        } else if (errorMessage.includes("NotReadableError") || 
                   errorMessage.includes("TrackStartError") ||
                   errorName === "NotReadableError") {
          setCameraAvailable(true);
          toast.error("Camera is already in use by another application.");
        } else {
          // Unknown error - assume camera might be available but something else went wrong
          setCameraAvailable(true);
          toast.error("Failed to start camera scan. Please try again.");
        }
      }
    };

    initializeScanner();

    // Cleanup function - only cleanup if isScanning becomes false or component unmounts
    return () => {
      // This cleanup will run if isScanning changes to false or component unmounts
      // The actual cleanup is handled by stopCameraScan, but this is a safety net
    };
  }, [isScanning, isMobile, hasCameraPermission]);

  const stopCameraScan = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
      }
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        setVideoStream(null);
      }
      setIsScanning(false);
      setCameraError(null);
      setCapturedImage(null);
      lastScannedRef.current = "";
    } catch {
      setIsScanning(false);
    }
  };

  const captureSnapshot = async () => {
    try {
      // Get the video element from the scanner container
      const container = scanContainerRef.current;
      if (!container) {
        toast.error("Camera not ready");
        return;
      }

      // Find the video element inside the scanner container
      const videoElement = container.querySelector("video") as HTMLVideoElement;
      if (!videoElement || videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
        toast.error("Camera not ready. Please wait a moment.");
        return;
      }

      // Create canvas to capture the frame
      const canvas = document.createElement("canvas");
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        toast.error("Failed to capture image");
        return;
      }

      // Draw the video frame to canvas
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      // Convert to image data URL
      const imageDataUrl = canvas.toDataURL("image/png");
      setCapturedImage(imageDataUrl);
      setExtractedText("");
      setShowExtractedText(false);
      
      // Start OCR processing
      setIsProcessingOCR(true);
      toast.info("Processing image to extract text...");
      
      try {
        // Initialize Tesseract worker
        const worker = await createWorker("eng");
        
        // Perform OCR on the captured image
        const { data: { text } } = await worker.recognize(imageDataUrl);
        
        // Clean up worker
        await worker.terminate();
        
        setExtractedText(text);
        setIsProcessingOCR(false);
        
        // Try to extract drawing number from the text
        const drawingNumber = extractDrawingNumber(text);
        if (drawingNumber) {
          setScanValue(drawingNumber);
          toast.success(`Drawing number detected: ${drawingNumber}`);
        } else {
          toast.success("Text extracted. Please verify the drawing number.");
        }
      } catch {
        setIsProcessingOCR(false);
        toast.warning("Could not extract text automatically. Please enter the drawing number manually.");
      }
    } catch {
      toast.error("Failed to capture snapshot");
      setIsProcessingOCR(false);
    }
  };

  // Extract drawing number from OCR text
  const extractDrawingNumber = (text: string): string | null => {
    if (!text) return null;
    
    // Common patterns for drawing numbers
    const patterns = [
      /Drawing\s+No[.:]?\s*([A-Z0-9\-]+)/i,
      /Drawing\s+Number[.:]?\s*([A-Z0-9\-]+)/i,
      /DWG[.:]?\s*([A-Z0-9\-]+)/i,
      /Drawing[.:]?\s*([A-Z0-9\-]+)/i,
      /([A-Z]\s*-\s*[A-Z0-9]+)/, // Pattern like "R-I", "A-1", etc.
      /([A-Z]{1,3}\s*[0-9]{1,4})/, // Pattern like "R1", "A12", etc.
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        // Clean up the extracted number
        let drawingNo = match[1].trim().toUpperCase();
        // Remove common prefixes/suffixes
        drawingNo = drawingNo.replace(/^(DWG|DRAWING|NO|NUMBER)[:\s]*/i, "");
        return drawingNo;
      }
    }
    
    // If no pattern matches, look for lines that might contain drawing numbers
    const lines = text.split("\n").map(line => line.trim()).filter(line => line.length > 0);
    for (const line of lines) {
      // Look for lines with drawing-related keywords
      if (line.match(/drawing|dwg|contract/i)) {
        // Try to extract alphanumeric codes
        const codeMatch = line.match(/([A-Z0-9\-]{3,})/);
        if (codeMatch) {
          return codeMatch[1].toUpperCase();
        }
      }
    }
    
    return null;
  };

  const clearSnapshot = () => {
    setCapturedImage(null);
    setExtractedText("");
    setShowExtractedText(false);
  };

  const searchFromSnapshot = () => {
    if (!scanValue.trim()) {
      toast.error("Please enter the drawing number from the captured image");
      return;
    }
    setSearchDwgNo(scanValue.trim());
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {
          // Silently handle cleanup errors
        });
        scannerRef.current.clear();
      }
    };
  }, []);

  // Auto-focus input when not scanning
  useEffect(() => {
    if (!isScanning) {
      inputRef.current?.focus();
    }
  }, [isScanning]);

  return (
    <div className="space-y-6">
      {/* Scanner Input Card */}
      <Card>
        <CardHeader className="border-b shrink-0 bg-emerald-50/70 p-6">
          <CardTitle className="text-lg font-semibold text-emerald-900 flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Scan Drawing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Manual Input Section */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Enter or scan drawing number (e.g., DWG-001)"
                value={scanValue}
                onChange={(e) => setScanValue(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                className="pr-10"
                disabled={isScanning}
                autoFocus={!isScanning}
              />
              {scanValue && !isScanning && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={handleClear}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleScan} 
                disabled={!scanValue.trim() || isLoading || isScanning}
                className="flex-1 sm:flex-initial"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              {/* Show camera button if API is available (null or true) */}
              {cameraAvailable !== false && (
                <Button
                  variant={isScanning ? "destructive" : "outline"}
                  onClick={isScanning ? stopCameraScan : startCameraScan}
                  disabled={isLoading}
                  className="flex-1 sm:flex-initial"
                >
                  {isScanning ? (
                    <>
                      <CameraOff className="h-4 w-4 mr-2" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4 mr-2" />
                      {isMobile ? "Scan" : "Camera"}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Camera Scanner Section */}
          {isScanning && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground text-center space-y-1">
                <p>Point your camera at the drawing or scan a barcode/QR code</p>
                {isMobile && (
                  <p className="text-xs text-muted-foreground/80">
                    Hold steady and ensure good lighting for better detection
                  </p>
                )}
              </div>
              <div className="w-full flex justify-center">
                <div
                  id="qr-reader"
                  ref={scanContainerRef}
                  className="w-full max-w-md rounded-lg overflow-hidden border-2 border-primary bg-black"
                  style={{ 
                    minHeight: "300px",
                    maxHeight: "70vh",
                    aspectRatio: "1 / 1"
                  }}
                />
              </div>
              
              {/* Snap Button */}
              <div className="flex justify-center">
                <Button
                  onClick={captureSnapshot}
                  variant="default"
                  size="lg"
                  className="gap-2"
                >
                  <ImageIcon className="h-5 w-5" />
                  Take Snapshot
                </Button>
              </div>

              {cameraError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Camera Error</AlertTitle>
                  <AlertDescription>{cameraError}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Captured Image Display */}
          {capturedImage && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Captured Image
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearSnapshot}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {/* Processing Indicator */}
              {isProcessingOCR && (
                <div className="flex items-center justify-center gap-2 p-4 bg-primary/10 rounded-lg">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Extracting text from image...</span>
                </div>
              )}
              
              <div className="flex flex-col items-center gap-4">
                <img
                  src={capturedImage}
                  alt="Captured drawing"
                  className="max-w-full max-h-96 rounded-lg border-2 border-primary shadow-lg"
                />
                
                {/* Extracted Text Section */}
                {extractedText && (
                  <div className="w-full space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">
                        Extracted Text:
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowExtractedText(!showExtractedText)}
                        className="gap-2"
                      >
                        {showExtractedText ? (
                          <>
                            <EyeOff className="h-4 w-4" />
                            Hide
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4" />
                            Show
                          </>
                        )}
                      </Button>
                    </div>
                    {showExtractedText && (
                      <div className="p-3 bg-background border rounded-lg max-h-48 overflow-y-auto text-sm text-muted-foreground whitespace-pre-wrap">
                        {extractedText || "No text extracted"}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="w-full space-y-2">
                  <div className="text-sm font-medium text-center">
                    {extractedText && scanValue 
                      ? `Drawing number detected: ${scanValue}. Verify and search:`
                      : "Enter or verify the drawing number from the image above:"
                    }
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Enter drawing number (e.g., R-I, DWG-001)"
                      value={scanValue}
                      onChange={(e) => setScanValue(e.target.value.toUpperCase())}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          searchFromSnapshot();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      onClick={searchFromSnapshot}
                      disabled={!scanValue.trim() || isLoading}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Camera Not Available - Only show when we know for sure it's not available */}
          {cameraAvailable === false && !isScanning && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Camera Not Available</AlertTitle>
              <AlertDescription>
                Camera access is not available in this browser or device. You can still manually enter drawing numbers.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Camera Permission Denied Info */}
          {hasCameraPermission === false && !isScanning && cameraAvailable === true && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Camera Permission Denied</AlertTitle>
              <AlertDescription>
                Please allow camera access in your browser settings to use the camera scanner. You can still manually enter drawing numbers.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Permission Request Info - Show when user hasn't tried yet */}
          {cameraAvailable === null && !isScanning && hasCameraPermission === null && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Camera Ready</AlertTitle>
              <AlertDescription>
                Click the camera button to request camera access and start scanning drawings.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Drawing Data Display */}
      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {error && searchDwgNo && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Drawing not found</p>
              <p className="text-sm mt-2">
                No drawing found with number: <strong>{searchDwgNo}</strong>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {drawing && (
        <Card>
          <CardHeader className="border-b shrink-0 bg-emerald-50/70 p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-emerald-900 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Drawing Details
              </CardTitle>
              {getStatusBadge(drawing.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                    <FileText className="h-4 w-4" />
                    Drawing Number
                  </div>
                  <p className="text-lg font-semibold">{drawing.dwgNo}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                    <Package className="h-4 w-4" />
                    Description
                  </div>
                  <p className="text-sm">{drawing.description || "No description"}</p>
                </div>

                {drawing.projectName && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                      <Building2 className="h-4 w-4" />
                      Project
                    </div>
                    <p className="text-sm font-medium">{drawing.projectName}</p>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                    <Weight className="h-4 w-4" />
                    Total Weight
                  </div>
                  <p className="text-lg font-semibold">
                    {drawing.totalWeightTons.toFixed(2)} Tons
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    Latest Submitted Date
                  </div>
                  <p className="text-sm">
                    {drawing.latestSubmittedDate ? formatDate(drawing.latestSubmittedDate) : "N/A"}
                  </p>
                </div>

                {drawing.releaseStatus && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                      Release Status
                    </div>
                    <Badge variant="outline">{drawing.releaseStatus}</Badge>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                    Weeks Since Sent
                  </div>
                  <p className="text-sm">{drawing.weeksSinceSent} weeks</p>
                </div>
              </div>
            </div>

            {drawing.pdfPath && (
              <div className="mt-6 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => window.open(drawing.pdfPath, "_blank")}
                  className="w-full"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Drawing PDF
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

