'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, Camera, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface PhotoUploadProps {
  onUploadComplete: (url: string) => void;
  compact?: boolean;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

export default function PhotoUpload({ onUploadComplete, compact = false }: PhotoUploadProps) {
  const { db, user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_SIZE) return 'File too large — max 5MB allowed.';
    if (!ALLOWED_TYPES.includes(file.type)) return 'Only JPG, PNG, or WebP images are allowed.';
    return null;
  };

  const uploadFile = useCallback(async (file: File) => {
    if (!user) return;
    const validationError = validateFile(file);
    if (validationError) { setError(validationError); return; }

    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    setProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setProgress(p => (p >= 85 ? p : p + Math.random() * 15));
    }, 200);

    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const filename = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await db.storage
        .from('profile-photos')
        .upload(filename, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        console.error('Supabase storage upload error:', {
          message: uploadError.message,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          statusCode: (uploadError as any).statusCode,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          error: (uploadError as any).error,
        });
        throw uploadError;
      }

      setProgress(100);
      const { data: urlData } = db.storage.from('profile-photos').getPublicUrl(filename);
      onUploadComplete(urlData.publicUrl);
      setPreview(null);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    } catch (err: unknown) {
      const e = err as { message?: string };
      const msg = e?.message || 'Unknown error';
      console.error('Photo upload failed:', msg, err);
      setError(`Upload failed: ${msg}`);
      setPreview(null);
      setProgress(0);
    } finally {
      clearInterval(progressInterval);
      setUploading(false);
    }
  }, [db, user, onUploadComplete]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  if (compact) {
    return (
      <label className={`relative flex items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-all group ${dragOver ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-400 hover:bg-orange-50'}`}
        onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
        {uploading ? (
          <div className="flex flex-col items-center gap-1.5 w-full px-4">
            <span className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <Camera className="w-6 h-6 text-gray-300 group-hover:text-orange-400 transition-colors" />
            <span className="text-xs text-gray-400 group-hover:text-orange-500 transition-colors">Add Photo</span>
          </div>
        )}
        <input ref={inputRef} type="file" accept={ALLOWED_TYPES.join(',')} onChange={handleFileSelect} disabled={uploading} className="sr-only" />
      </label>
    );
  }

  return (
    <div className="space-y-2">
      <label
        className={`relative flex flex-col items-center justify-center w-full min-h-[160px] border-2 border-dashed rounded-2xl cursor-pointer transition-all group ${dragOver ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-400 hover:bg-orange-50'}`}
        onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-4 p-8 w-full">
            {preview && <img src={preview} alt="Preview" className="w-24 h-24 object-cover rounded-xl opacity-70" />}
            <div className="w-full max-w-[200px]">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>Uploading...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 p-8">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${dragOver ? 'bg-orange-100' : 'bg-orange-50 group-hover:bg-orange-100'}`}>
              <Upload className="w-7 h-7 text-orange-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                {dragOver ? 'Drop to upload' : 'Click or drag a photo here'}
              </p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, or WebP — max 5MB</p>
            </div>
          </div>
        )}
        <input ref={inputRef} type="file" accept={ALLOWED_TYPES.join(',')} onChange={handleFileSelect} disabled={uploading} className="sr-only" />
      </label>

      {error && (
        <div className="flex items-center justify-between gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          <p className="text-xs text-red-600">{error}</p>
          <button onClick={() => { setError(''); inputRef.current?.click(); }} className="text-xs font-semibold text-red-500 underline whitespace-nowrap">Retry</button>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
    </div>
  );
}
