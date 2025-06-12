import VideoStream from '@/components/VideoStream';

export default function OverviewPage() {
  return (
    <div className="p-2" style={{ height: 'calc(100vh - 200px)' }}>
      <div className="p-4">
        This is the CAMERA page.
      </div>

      <div className="p-6 h-full">
        <h1 className="text-2xl font-bold mb-6">Camera Overview</h1>
        <div className="flex gap-6 h-full">
          <VideoStream imageUrl="http://robosignans2:8000/video" />
          <VideoStream imageUrl="http://robosignans2:8000/video_transformed" />
        </div>
      </div>
    </div>
  );
}
