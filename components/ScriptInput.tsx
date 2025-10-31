import React, { useRef } from 'react';
import { GenerateIcon, UploadIcon, TrashIcon } from './icons';

interface ScriptInputProps {
  script: string;
  setScript: (script: string) => void;
  ideaImage: string | null;
  setIdeaImage: (image: string | null) => void;
  style: string;
  setStyle: (style: string) => void;
  framing: string;
  setFraming: (framing: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

const styleOptions = [
    { value: 'Cinematic (Default)', label: 'Điện ảnh (Mặc định)' },
    { value: 'Anime (Ghibli Inspired)', label: 'Anime (Phong cách Ghibli)' },
    { value: 'Anime (Shonen Action)', label: 'Anime (Hành động Shonen)' },
    { value: 'Pixar 3D Animation', label: 'Hoạt hình 3D (Phong cách Pixar)' },
    { value: 'Claymation', label: 'Hoạt hình đất sét' },
    { value: 'Film Noir (Black & White)', label: 'Phim đen trắng (Film Noir)' },
    { value: 'Cyberpunk (Neon & Dystopian)', label: 'Cyberpunk (Neon & Phản địa đàng)' },
    { value: 'Wes Anderson Style (Symmetrical & Quirky)', label: 'Phong cách Wes Anderson (Đối xứng & Độc đáo)' },
    { value: 'Vintage 80s Film', label: 'Phim Cổ điển thập niên 80' },
    { value: 'Documentary (Handheld)', label: 'Phim tài liệu (Máy quay cầm tay)' },
];

const framingOptions = [
    { value: 'Default', label: 'Mặc định' },
    { value: 'A bit wider', label: 'Rộng hơn một chút' },
    { value: 'Wide', label: 'Rộng' },
    { value: 'Extra wide', label: 'Cực rộng' },
];

const ScriptInput: React.FC<ScriptInputProps> = ({ script, setScript, ideaImage, setIdeaImage, style, setStyle, framing, setFraming, onGenerate, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdeaImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-brand-surface rounded-lg shadow-2xl p-6 sticky top-24">
      <h2 className="text-lg font-semibold text-white mb-4">Kịch bản của bạn</h2>
      <textarea
        className="w-full h-60 bg-gray-900 border border-gray-700 rounded-md p-3 text-brand-text-muted focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition duration-200 resize-none"
        placeholder="Dán kịch bản của bạn vào đây..."
        value={script}
        onChange={(e) => setScript(e.target.value)}
        disabled={isLoading}
      />

      <div className="mt-4">
        <h2 className="text-lg font-semibold text-white mb-2">Ý tưởng hình ảnh (Tùy chọn)</h2>
        {ideaImage ? (
          <div className="relative group">
            <img src={ideaImage} alt="Idea preview" className="rounded-md w-full object-cover max-h-48" />
            <button
              onClick={() => setIdeaImage(null)}
              className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove image"
              disabled={isLoading}
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button
            onClick={triggerFileInput}
            disabled={isLoading}
            className="w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-md p-6 text-brand-text-muted hover:border-brand-primary hover:text-brand-primary transition duration-200"
          >
            <UploadIcon className="w-8 h-8 mb-2" />
            <span>Tải ảnh lên để lấy cảm hứng</span>
          </button>
        )}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleImageUpload}
        />
      </div>

       <div className="mt-4">
        <label htmlFor="style-select" className="block text-lg font-semibold text-white mb-2">
          Chọn phong cách
        </label>
        <select
          id="style-select"
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          disabled={isLoading}
          className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-brand-text-muted focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition duration-200"
        >
          {styleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      <div className="mt-4">
        <label htmlFor="framing-select" className="block text-lg font-semibold text-white mb-2">
          Khung hình
        </label>
        <select
          id="framing-select"
          value={framing}
          onChange={(e) => setFraming(e.target.value)}
          disabled={isLoading}
          className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-brand-text-muted focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition duration-200"
        >
          {framingOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={onGenerate}
        disabled={isLoading || !script.trim()}
        className="mt-6 w-full flex items-center justify-center bg-brand-primary hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-bg focus:ring-brand-primary"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Đang tạo...
          </>
        ) : (
          <>
            <GenerateIcon className="w-5 h-5 mr-2" />
            Tạo Shot List
          </>
        )}
      </button>
    </div>
  );
};

export default ScriptInput;