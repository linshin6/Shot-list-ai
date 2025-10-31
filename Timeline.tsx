
import React from 'react';
import { GeneratedShot } from '../types';
import ShotCard from './ShotCard';

interface TimelineProps {
  shots: GeneratedShot[];
}

const Timeline: React.FC<TimelineProps> = ({ shots }) => {
  return (
    <div className="space-y-12 relative">
       <div className="absolute left-4 sm:left-6 top-6 bottom-6 w-0.5 bg-gray-700" aria-hidden="true"></div>
      {shots.map((shot, index) => (
        <ShotCard key={shot.shot_number} shot={shot} isLast={index === shots.length - 1} />
      ))}
    </div>
  );
};

export default Timeline;
