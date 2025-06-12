'use client';

import React from 'react';

type VideoStreamProps = {
  imageUrl: string;
};

const VideoStream: React.FC<VideoStreamProps> = ({ imageUrl }) => {
  return (
    <img
      src={imageUrl}
      alt="Video stream"
      className="w-full h-full object-contain"
    />
  );
};

export default VideoStream;
