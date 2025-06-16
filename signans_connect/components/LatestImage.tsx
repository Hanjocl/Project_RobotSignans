'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';

interface LatestImageProps {
  metaUrl: string;
  imageUrl: string;
  title: string;
  pollInterval?: number; // in milliseconds, optional, default 5000
}

export default function LatestImage({
  metaUrl,
  imageUrl,
  title,
  pollInterval = 5000,
}: LatestImageProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [lastModified, setLastModified] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imgDimensions, setImgDimensions] = useState<{ width: number; height: number } | null>(null);

  const progressRef = useRef<NodeJS.Timeout | null>(null);

  const startProgress = useCallback(() => {
    setProgress(0);
    if (progressRef.current) clearInterval(progressRef.current);

    const startTime = Date.now();

    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const percentage = Math.min((elapsed / pollInterval) * 100, 100);
      setProgress(percentage);

      if (percentage >= 100 && progressRef.current) {
        clearInterval(progressRef.current);
      }
    }, 50);
  }, [pollInterval]);

  const fetchImageMeta = useCallback(async () => {
    setLoading(true);
    setProgress(0);

    try {
      const res = await fetch(metaUrl);
      const data = await res.json();

      if (data.last_modified && data.last_modified !== lastModified) {
        const newImgSrc = `${imageUrl}?cacheBust=${Date.now()}`;
        const img = new window.Image();
        img.src = newImgSrc;

        img.onload = () => {
          setImgDimensions({ width: img.naturalWidth, height: img.naturalHeight });
          setImgSrc(newImgSrc);
          setLastModified(data.last_modified);
        };
      }
    } catch (err) {
      console.error(`Error fetching ${title.toLowerCase()} metadata:`, err);
    } finally {
      setLoading(false);
      startProgress();
    }
  }, [metaUrl, imageUrl, title, lastModified, startProgress]);

  useEffect(() => {
    fetchImageMeta();
    const interval = setInterval(fetchImageMeta, pollInterval);

    return () => {
      clearInterval(interval);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [pollInterval, fetchImageMeta]);

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        {loading && (
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      <div className="max-w-lg w-full">
        {imgSrc && imgDimensions ? (
          <Image
            src={imgSrc}
            alt={title}
            width={imgDimensions.width}
            height={imgDimensions.height}
            className="w-full border border-gray-300 shadow-md rounded"
          />
        ) : (
          <p>Loading {title.toLowerCase()}...</p>
        )}

        <div className="w-full bg-gray-300 rounded h-1 mb-4 overflow-hidden">
          <div
            className="bg-gray-500 h-1 transition-all duration-50"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
