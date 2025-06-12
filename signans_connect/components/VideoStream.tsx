'use client';

import React from 'react';
import Image from 'next/image';

type VideoStreamProps = {
  imageUrl: string;
};

const VideoStream: React.FC<VideoStreamProps> = ({ imageUrl }) => {
  return (
    // The parent div must have position relative and fixed size or flexible size
    <div className="relative w-full h-full"> {/* example fixed height, adjust as needed */}
      <Image
        src={imageUrl}
        alt="Video stream"
        fill
        style={{ objectFit: 'contain' }} // maintain aspect ratio inside container
        unoptimized // optional, disables next/image optimization for external streams
      />
    </div>
  );
};

export default VideoStream;
