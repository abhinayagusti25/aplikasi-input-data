import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  RotateCcw,
  FlipHorizontal,
  Check,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Video,
} from 'lucide-react';

interface CameraCaptureProps {
  capturedPhoto: string | null;
  onPhotoCaptured: (base64: string | null) => void;
  isSubmitting?: boolean;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  capturedPhoto,
  onPhotoCaptured,
  isSubmitting = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [permissionState, setPermissionState] = useState<'idle' | 'granted' | 'denied' | 'requesting'>('requesting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [flashEffect, setFlashEffect] = useState(false);
  const [autoCaptureEnabled, setAutoCaptureEnabled] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Check available video devices
  useEffect(() => {
    async function checkDevices() {
      try {
        if (!navigator.mediaDevices?.enumerateDevices) return;
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      } catch (err) {
        console.warn('Cannot enumerate camera devices', err);
      }
    }
    checkDevices();
  }, []);

  // Initialize camera
  const startCamera = useCallback(async () => {
    setPermissionState('requesting');
    setErrorMessage(null);

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Akses kamera tidak didukung pada browser atau perangkat ini.');
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });

      setStream(newStream);
      setPermissionState('granted');

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play().catch((e) => console.warn('Video play prevented', e));
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setPermissionState('denied');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Izin kamera ditolak. Harap izinkan akses kamera di pengaturan browser.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('Kamera tidak terdeteksi pada perangkat ini.');
      } else {
        setErrorMessage(err.message || 'Gagal memulai kamera.');
      }
    }
  }, [facingMode]);

  // Request camera on mount or when photo is cleared
  useEffect(() => {
    if (!capturedPhoto) {
      startCamera();
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [startCamera, capturedPhoto]);

  // Toggle camera (Front / Back)
  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Take snapshot
  const takeSnapshot = useCallback(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, width, height);

    // Subtle flash animation
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 150);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onPhotoCaptured(dataUrl);

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [facingMode, onPhotoCaptured, stream]);

  // Auto-capture countdown
  useEffect(() => {
    if (!autoCaptureEnabled || capturedPhoto || permissionState !== 'granted') {
      setCountdown(null);
      return;
    }

    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          takeSnapshot();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoCaptureEnabled, capturedPhoto, permissionState, takeSnapshot]);

  const handleRetake = () => {
    onPhotoCaptured(null);
    startCamera();
  };

  return (
    <div
      id="camera-capture-container"
      className="glass-panel rounded-3xl overflow-hidden flex flex-col transition-all"
    >
      {/* Ethereal Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-purple-100/70 dark:border-white/5 bg-white/40 dark:bg-white/2">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-purple-100/80 dark:bg-purple-900/30 flex items-center justify-center text-[#583e84] dark:text-purple-300">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display text-xs sm:text-sm font-bold tracking-tight text-neutral-900 dark:text-white">
              Kamera Responden
            </h2>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              {capturedPhoto ? 'Foto tersimpan' : 'Arahkan kamera ke wajah responden'}
            </p>
          </div>
        </div>

        {capturedPhoto ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-purple-100/80 dark:bg-purple-950/60 text-[#583e84] dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/50">
            <Check className="w-3 h-3 mr-1 stroke-[2.5]" />
            Siap
          </span>
        ) : permissionState === 'granted' ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold text-[#583e84] dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            Live
          </span>
        ) : null}
      </div>

      {/* Viewfinder Display Area */}
      <div className="relative bg-neutral-950 aspect-[4/3] flex items-center justify-center overflow-hidden">
        {flashEffect && (
          <div className="absolute inset-0 bg-white z-30 pointer-events-none transition-opacity duration-150 opacity-90" />
        )}

        {/* 1. Captured Photo View */}
        {capturedPhoto ? (
          <div className="relative w-full h-full flex items-center justify-center p-3">
            <img
              src={capturedPhoto}
              alt="Foto Responden"
              className="w-full h-full object-cover rounded-2xl border border-purple-900/40"
            />
            <div className="absolute bottom-4 inset-x-0 flex justify-center z-20">
              <button
                id="btn-retake-photo"
                type="button"
                onClick={handleRetake}
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#0d121f]/95 hover:bg-[#192237] active:scale-95 text-white text-xs font-semibold rounded-full shadow-lg backdrop-blur-md border border-white/20 flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-purple-200" />
                <span>Ambil Ulang</span>
              </button>
            </div>
          </div>
        ) : permissionState === 'granted' ? (
          /* 2. Live Camera View */
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${
                facingMode === 'user' ? 'scale-x-[-1]' : ''
              }`}
            />

            {/* Minimalist framing brackets */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-44 h-56 relative">
                <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-white/80 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-white/80 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-white/80 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-white/80 rounded-br-lg" />
                <div className="absolute inset-x-0 bottom-2 text-center">
                  <span className="text-[10px] text-white/90 font-semibold px-2.5 py-0.5 rounded-full bg-neutral-900/70 backdrop-blur-xs border border-white/15">
                    Wajah Responden
                  </span>
                </div>
              </div>
            </div>

            {/* Countdown Overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-xs">
                <span className="font-display text-6xl font-bold text-white tracking-widest animate-pulse">
                  {countdown}
                </span>
              </div>
            )}

            {/* Quick Camera Action Tools Overlay */}
            <div className="absolute top-3 right-3 flex items-center space-x-1.5 z-10">
              {hasMultipleCameras && (
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  title="Ganti Kamera"
                  className="w-8 h-8 rounded-full bg-neutral-900/70 hover:bg-neutral-900 text-white backdrop-blur-md flex items-center justify-center border border-white/20 active:scale-95 transition-all cursor-pointer"
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setAutoCaptureEnabled((prev) => !prev)}
                title={autoCaptureEnabled ? 'Matikan Timer' : 'Timer 3 Detik'}
                className={`h-8 px-2.5 rounded-full text-[11px] font-semibold backdrop-blur-md border flex items-center space-x-1 active:scale-95 transition-all cursor-pointer ${
                  autoCaptureEnabled
                    ? 'bg-[#583e84] text-white border-[#583e84]'
                    : 'bg-neutral-900/70 hover:bg-neutral-900 text-neutral-200 border-white/20'
                }`}
              >
                <Sparkles className="w-3 h-3 text-purple-300" />
                <span>{autoCaptureEnabled ? '3d Aktif' : 'Timer'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* 3. Permission Prompt / Denied View */
          <div className="p-6 text-center text-white max-w-xs flex flex-col items-center">
            {permissionState === 'requesting' ? (
              <>
                <RefreshCw className="w-6 h-6 text-purple-300 animate-spin mb-3" />
                <p className="text-xs font-semibold text-neutral-200">Menghubungkan Kamera...</p>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Harap izinkan akses kamera pada peramban Anda.
                </p>
              </>
            ) : (
              <>
                <AlertCircle className="w-6 h-6 text-amber-400 mb-2" />
                <p className="text-xs font-bold text-neutral-200">Kamera Belum Aktif</p>
                <p className="text-[11px] text-neutral-400 mt-1 mb-3 leading-relaxed">
                  {errorMessage || 'Izin kamera diperlukan untuk mengambil foto responden.'}
                </p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 bg-[#583e84] hover:bg-[#4a3470] active:scale-95 text-white rounded-full text-xs font-semibold shadow-md shadow-purple-950/20 transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Coba Lagi</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Modern Ethereal Bottom Bar with Shutter */}
      <div className="p-4 flex items-center justify-center bg-white/40 dark:bg-white/2 border-t border-purple-100/70 dark:border-white/5">
        {!capturedPhoto && permissionState === 'granted' ? (
          <div className="flex items-center space-x-4">
            {/* Shutter Button styled with deep violet accent */}
            <button
              id="btn-take-photo"
              type="button"
              onClick={takeSnapshot}
              disabled={isSubmitting}
              title="Ambil Foto Responden"
              className="group relative w-14 h-14 rounded-full border-2 border-[#583e84]/30 dark:border-purple-400/40 flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
            >
              <div className="w-11 h-11 rounded-full bg-[#583e84] group-hover:bg-[#4a3470] transition-colors shadow-md shadow-purple-950/25 flex items-center justify-center text-white" />
            </button>
          </div>
        ) : capturedPhoto ? (
          <p className="text-xs font-semibold text-[#583e84] dark:text-purple-300">
            Foto siap dilampirkan ke dokumen survei
          </p>
        ) : (
          <div className="flex items-center text-[11px] text-neutral-500 dark:text-neutral-400 space-x-1.5">
            <Video className="w-3.5 h-3.5 text-[#583e84] dark:text-purple-400" />
            <span>Aktifkan kamera untuk membidik foto</span>
          </div>
        )}
      </div>
    </div>
  );
};
