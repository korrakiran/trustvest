import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitKYC } from '../services/mockBackend';
import { getUser } from '../services/mockBackend';
import { Shield, Lock, FileCheck, Camera, Upload, X } from 'lucide-react';

const KYC: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    pan: '',
    consent: false
  });
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      setCameraError('Camera access denied or not available. You can upload a photo instead.');
      setCameraActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `kyc-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(blob));
        stopCamera();
      },
      'image/jpeg',
      0.9
    );
  }, [stopCamera]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setCameraError('Please choose a JPEG, PNG, or WebP image.');
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setCameraError(null);
  };

  const clearPhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitKYC({ ...formData, photoFile });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    return () => {
      stopCamera();
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview, stopCamera]);

  const user = getUser();
  const canSubmitKYC = user?.id;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Shield className="text-emerald-400" /> 
              Identity Verification
            </h2>
            <p className="text-slate-400 text-sm mt-1">Bank-grade security • Photo saved to S3</p>
          </div>
          <FileCheck size={32} className="text-slate-700" />
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* KYC selfie / photo */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Your photo (KYC selfie)</label>
            {!photoPreview ? (
              <div className="space-y-3">
                <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center relative">
                  {cameraActive ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                      >
                        <Camera size={18} /> Take photo
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <Camera className="mx-auto text-slate-400 mb-2" size={40} />
                      <p className="text-slate-500 text-sm">Use camera or upload a photo</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700"
                  >
                    <Camera size={18} /> Open camera
                  </button>
                  <label className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 cursor-pointer">
                    <Upload size={18} /> Upload photo
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </label>
                </div>
                {cameraError && (
                  <p className="text-amber-600 text-sm">{cameraError}</p>
                )}
              </div>
            ) : (
                <div className="relative inline-block">
                  <img
                    src={photoPreview}
                    alt="KYC selfie"
                    className="rounded-xl border border-slate-200 max-h-48 object-cover"
                  />
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="absolute top-2 right-2 bg-slate-800/80 text-white p-1.5 rounded-full hover:bg-slate-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name (as per ID)</label>
              <input 
                required
                type="text" 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                <input 
                  required
                  type="date" 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.dob}
                  onChange={e => setFormData({...formData, dob: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">PAN / Aadhaar (Mock)</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none uppercase"
                  placeholder="ABCD1234F"
                  value={formData.pan}
                  onChange={e => setFormData({...formData, pan: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
            <Lock className="text-blue-600 mt-1 flex-shrink-0" size={16} />
            <div className="text-xs text-blue-800">
              <p className="font-semibold mb-1">Your Data is Encrypted</p>
              <p>Your photo is uploaded to Amazon S3. Personal details are encrypted and never shared without consent.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
             <input 
                required
                type="checkbox" 
                id="consent"
                className="mt-1 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                checked={formData.consent}
                onChange={e => setFormData({...formData, consent: e.target.checked})}
             />
             <label htmlFor="consent" className="text-sm text-slate-600">
               I hereby declare that the details furnished above are true and correct. I authorize TrustVest to verify my details and store my photo securely.
             </label>
          </div>

          <button 
            type="submit" 
            disabled={loading || !canSubmitKYC}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg shadow-md transition-colors disabled:opacity-50"
          >
            {loading ? 'Uploading photo & Verifying...' : 'Submit & Verify'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default KYC;
