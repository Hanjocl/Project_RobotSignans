import LatestImage from '@/components/LatestImage';

export default function OverviewPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Robot Signals Overview</h1>
      <div className="flex gap-6">
        <LatestImage
          metaUrl="http://robosignans2:8000/latest-plot-meta"
          imageUrl="http://robosignans2:8000/latest-plot"
          title="Latest Plot"
          pollInterval={5000} // poll every 7 seconds
        />
        <LatestImage
          metaUrl="http://robosignans2:8000/latest-frame-meta"
          imageUrl="http://robosignans2:8000/latest-frame"
          title="Latest Frame"
          pollInterval={5000} // poll every 3 seconds
        />
      </div>
    </div>
  );
}
