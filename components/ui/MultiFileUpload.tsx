'use client';
import { useRef, useState, DragEvent } from 'react';

interface Props {
  values:   string[];
  onChange: (urls: string[]) => void;
  max?:     number;
  label?:   string;
}

export default function MultiFileUpload({ values, onChange, max = 6, label }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [error,     setError]     = useState('');
  const [dragging,  setDragging]  = useState(false);

  async function uploadFile(file: File): Promise<string | null> {
    return new Promise(resolve => {
      const fd  = new FormData();
      fd.append('file', file);
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload');
      xhr.upload.onprogress = e => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { resolve(JSON.parse(xhr.responseText).url); } catch { resolve(null); }
        } else {
          try { setError(JSON.parse(xhr.responseText).error ?? 'Upload failed'); } catch { setError('Upload failed'); }
          resolve(null);
        }
      };
      xhr.onerror = () => { setError('Network error'); resolve(null); };
      xhr.send(fd);
    });
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = max - values.length;
    if (remaining <= 0) { setError(`Maximum ${max} images allowed.`); return; }
    setUploading(true); setError('');
    const toUpload = Array.from(files).slice(0, remaining);
    const newUrls: string[] = [];
    for (const file of toUpload) {
      const url = await uploadFile(file);
      if (url) newUrls.push(url);
    }
    onChange([...values, ...newUrls]);
    setUploading(false); setProgress(0);
  }

  function remove(idx: number) {
    onChange(values.filter((_, i) => i !== idx));
  }

  function onDrop(e: DragEvent) {
    e.preventDefault(); setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</label>}

      <div
        className="file-upload-grid"
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {/* Existing images */}
        {values.map((url, i) => (
          <div key={url + i} className="file-upload-thumb">
            <img src={url} alt={`Image ${i + 1}`} onError={e => { (e.target as HTMLImageElement).style.opacity = '0.3'; }} />
            <button className="file-upload-thumb-remove" onClick={() => remove(i)} title="Remove">×</button>
          </div>
        ))}

        {/* Add tile */}
        {values.length < max && (
          <div
            className={`file-upload-add-tile${dragging ? ' file-upload-drag' : ''}`}
            onClick={() => !uploading && inputRef.current?.click()}
          >
            {uploading ? (
              <>
                <div style={{ fontSize: 18 }}>⏳</div>
                <span>{progress}%</span>
              </>
            ) : (
              <>
                <div style={{ fontSize: 22 }}>+</div>
                <span>Add image</span>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '6px 12px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          ⚠️ {error}
          <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', fontSize: 16 }}>×</button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        multiple
        style={{ display: 'none' }}
        onChange={e => handleFiles(e.target.files)}
      />

      <p style={{ fontSize: 12, color: 'var(--text-light)', margin: 0 }}>
        {values.length}/{max} images · JPG, PNG, WebP, GIF · max 10 MB each
      </p>
    </div>
  );
}
