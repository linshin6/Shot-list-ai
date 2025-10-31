import React, { useState } from 'react';
import { GeneratedShot } from '../types';
import { DownloadIcon } from './icons';

interface ShotCardProps {
  shot: GeneratedShot;
  isLast: boolean;
}

const DetailChip: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="bg-gray-800 rounded-full px-3 py-1 text-xs font-medium text-brand-text-muted">
        <span className="font-bold text-gray-400">{label}:</span> {value}
    </div>
);


const ShotCard: React.FC<ShotCardProps> = ({ shot }) => {
  const [isImageLoading, setIsImageLoading] = useState(true);

  return (
    <div className="relative pl-12 sm:pl-16">
        <div className="absolute left-0 top-3 flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 bg-brand-primary rounded-full ring-4 ring-brand-surface text-white font-bold text-sm sm:text-lg">
            {shot.shot_number}
        </div>

        <div className="bg-gray-900/50 rounded-lg overflow-hidden border border-gray-800 shadow-lg">
            <div className="relative w-full aspect-[9/16] bg-gray-800 group">
                {isImageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="animate-spin h-8 w-8 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                )}
                <img
                    src={shot.imageUrl}
                    alt={`Shot ${shot.shot_number}: ${shot.shot_type}`}
                    className={`w-full h-full object-cover transition-opacity duration-500 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
                    onLoad={() => setIsImageLoading(false)}
                />
                 <a
                    href={shot.imageUrl}
                    download={`shot_${shot.shot_number}.png`}
                    className="absolute top-2 right-2 bg-black/50 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                    aria-label="Download image"
                    >
                    <DownloadIcon className="w-5 h-5" />
                </a>
            </div>
            <div className="p-4 md:p-6">
                <h3 className="text-lg font-bold text-brand-primary">{shot.shot_type}</h3>
                <p className="mt-2 text-brand-text-muted text-sm">{shot.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                    <DetailChip label="Angle" value={shot.camera_angle} />
                    <DetailChip label="Lens" value={shot.lens} />
                    <DetailChip label="Movement" value={shot.movement} />
                </div>
            </div>
        </div>
    </div>
  );
};

export default ShotCard;