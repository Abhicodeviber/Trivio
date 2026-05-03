'use client';
import { useRef, useState, DragEvent } from 'react';

type FileType = 'image' | 'video' | 'both';

interface UploadResult {
  url: string;
  type: 'image' | 'video';
  filename: string;
}

interface Props {
  value?:    string;
  fileType?: FileType;
  onUpload:  (result: UploadResult) => void;
  onRemove?: () => void;
  label?:    string;
  hint?:     string;
}

const ACCEPTS: Record<FileType, string> = {
  image: 'image/jpeg,image/jpg,image/png,image/webp,image/gif',
  video: 'video/mp4,video/webm,video/ogg,video/quicktime',
  both:  'image/jpeg,image/jpg,image/png,image/webp,image/gif,video/mp4,video/webm,video/ogg',
};

export default function FileUpload({ value, fileType = 'both', onUpload, onRemove, label, hint }: Props) {
  const inputRef  = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading,setUploading]= useState(false);
  const [error,    setError]    = useState('');

  const isVideo = value && (value.match(/\.(mp4|webm|ogg|mov|avi)$/i) || value.includes('video'));

  async function uploadFile(file: File) {
    setError(''); setUploading(true); setProgress(0);

    const fd = new FormData();
    fd.append('file', file);

    // Use XHR for real progress tracking
    return new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload');
      xhr.upload.onprogress = e => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        setUploading(false);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText) as UploadResult;
            onUpload(data);
            setProgress(0);
          } catch {
            setError('Upload response error');
          }
        } else {
          try {
            const data = JSON.parse(xhr.responseText);
            setError(data.error ?? 'Upload failed');
          } catch { setError('Upload failed'); }
        }
        resolve();
      };
      xhr.onerror = () => { setUploading(false); setError('Network error'); resolve(); };
      xhr.send(fd);
    });
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    await uploadFile(files[0]);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault(); setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</label>}

      {/* Drop zone */}
      <div
        className={`file-upload-zone${dragging ? ' file-upload-drag' : ''}${value ? ' file-upload-has-file' : ''}`}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {uploading ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div className="file-upload-progress-ring">
              <svg viewBox="0 0 44 44" style={{ width: 44, height: 44 }}>
                <circle cx="22" cy="22" r="18" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                <circle cx="22" cy="22" r="18" fill="none" stroke="var(--primary)" strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 18}`}
                  strokeDashoffset={`${2 * Math.PI * 18 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.1s', transform: 'rotate(-90deg)', transformOrigin: 'center' }} />
              </svg>
              <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 11, fontWeight: 700 }}>{progress}%</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 8 }}>Uploading…</p>
          </div>
        ) : value ? (
          <div className="file-upload-preview">
            {isVideo ? (
              <video src={value} className="file-upload-preview-media" controls />
            ) : (
              <img src={value} alt="Preview" className="file-upload-preview-media"
                onError={e => { (e.target as HTMLImageElement).src = ''; }} />
            )}
            <div className="file-upload-preview-overlay">
              <button
                className="file-upload-change-btn"
                onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
              >🔄 Change</button>
              {onRemove && (
                <button
                  className="file-upload-remove-btn"
                  onClick={e => { e.stopPropagation(); onRemove(); }}
                >🗑️ Remove</button>
              )}
            </div>
          </div>
        ) : (
          <div className="file-upload-empty">
            <div className="file-upload-icon">{dragging ? '📂' : fileType === 'video' ? '🎥' : fileType === 'image' ? '🖼️' : '📁'}</div>
            <p className="file-upload-text">
              {dragging ? 'Drop file here' : 'Drag & drop or click to upload'}
            </p>
            <p className="file-upload-hint">
              {hint ?? (
                fileType === 'image' ? 'JPG, PNG, WebP, GIF — max 10 MB'
                : fileType === 'video' ? 'MP4, WebM — max 100 MB'
                : 'Images (JPG, PNG, WebP) or Videos (MP4, WebM)'
              )}
            </p>
          </div>
        )}
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '8px 12px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          ⚠️ {error}
          <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', fontSize: 16 }}>×</button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTS[fileType]}
        style={{ display: 'none' }}
        onChange={e => handleFiles(e.target.files)}
      />
    </div>
  );
}
