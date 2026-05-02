import { useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { useThemeTokens } from '../context/useThemeTokens';

// Max dimensions before auto-crop: 1200×800px, quality 0.82
const MAX_W = 1200;
const MAX_H = 800;
const QUALITY = 0.82;
const MAX_PHOTOS = 3;

async function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_W || height > MAX_H) {
        const ratio = Math.min(MAX_W / width, MAX_H / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', QUALITY));
    };
    img.onerror = reject;
    img.src = url;
  });
}

interface PhotoPickerProps {
  photos: string[];
  onChange: (photos: string[]) => void;
}

export function PhotoPicker({ photos, onChange }: PhotoPickerProps) {
  const T = useThemeTokens();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const remaining = MAX_PHOTOS - photos.length;
    const toProcess = Array.from(files).slice(0, remaining);
    const results = await Promise.all(toProcess.map(resizeImage));
    onChange([...photos, ...results]);
  };

  const removePhoto = (index: number) => {
    onChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block mb-1.5" style={{ color: T.text, fontSize: '12px', fontWeight: 500 }}>
        Fotos ({photos.length}/{MAX_PHOTOS})
      </label>

      {photos.length > 0 && (
        <div className="mb-2 rounded-xl overflow-hidden" style={{ border: `1px solid ${T.cardBorder}` }}>
          <PhotoMosaic photos={photos} onRemove={removePhoto} />
        </div>
      )}

      {photos.length < MAX_PHOTOS && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
            onClick={e => { (e.target as HTMLInputElement).value = ''; }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl w-full justify-center"
            style={{
              background: T.btnGhostBg,
              border: `1px dashed ${T.inputBorder}`,
              color: T.textMuted,
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            <ImagePlus size={14} />
            Agregar foto{photos.length < MAX_PHOTOS - 1 ? 's' : ''} (máx. {MAX_PHOTOS - photos.length} más)
          </button>
        </>
      )}
      <p style={{ color: T.textSubtle, fontSize: '11px', marginTop: '4px' }}>
        Las imágenes se recortan automáticamente a {MAX_W}×{MAX_H}px si las superan.
      </p>
    </div>
  );
}

function PhotoMosaic({ photos, onRemove }: { photos: string[]; onRemove: (i: number) => void }) {
  if (photos.length === 1) {
    return (
      <div className="relative" style={{ aspectRatio: '16/7' }}>
        <img src={photos[0]} alt="" className="w-full h-full object-cover" />
        <RemoveBtn onClick={() => onRemove(0)} />
      </div>
    );
  }

  if (photos.length === 2) {
    return (
      <div className="flex" style={{ aspectRatio: '16/7' }}>
        {photos.map((src, i) => (
          <div key={i} className="relative flex-1" style={{ borderRight: i === 0 ? '2px solid white' : undefined }}>
            <img src={src} alt="" className="w-full h-full object-cover" />
            <RemoveBtn onClick={() => onRemove(i)} />
          </div>
        ))}
      </div>
    );
  }

  // 3 photos: 1 large left, 2 stacked right
  return (
    <div className="flex" style={{ aspectRatio: '16/7' }}>
      <div className="relative" style={{ flex: '0 0 60%', borderRight: '2px solid white' }}>
        <img src={photos[0]} alt="" className="w-full h-full object-cover" />
        <RemoveBtn onClick={() => onRemove(0)} />
      </div>
      <div className="flex flex-col flex-1">
        {[1, 2].map((i) => (
          <div key={i} className="relative flex-1" style={{ borderTop: i === 2 ? '2px solid white' : undefined }}>
            <img src={photos[i]} alt="" className="w-full h-full object-cover" />
            <RemoveBtn onClick={() => onRemove(i)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.55)', color: 'white', border: 'none', cursor: 'pointer' }}
    >
      <X size={12} />
    </button>
  );
}
