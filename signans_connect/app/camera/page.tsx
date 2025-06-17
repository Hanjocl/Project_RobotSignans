import VideoStream from '@/components/VideoStream';
import { HTTP_ENDPOINTS } from "@/context/WebSockets";


export default function OverviewPage() {
  return (
    <div className="p-2" style={{ height: 'calc(100vh - 200px)' }}>
      <div className="p-4">
        This is the CAMERA page.
      </div>

      <div className="p-6 h-full">
        <h1 className="text-2xl font-bold mb-6">Camera Overview</h1>
        <div className="flex gap-6 h-full">
          <VideoStream imageUrl= {HTTP_ENDPOINTS.video} />
          <VideoStream imageUrl= {HTTP_ENDPOINTS.video_transformed} />
        </div>
      </div>
    </div>
  );
}
