import LatestImage from '@/components/LatestImage';
import { HTTP_ENDPOINTS } from "@/context/WebSockets";


export default function OverviewPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Robot Signals Overview</h1>
      <div className="flex gap-6">
        <LatestImage
          metaUrl= {HTTP_ENDPOINTS.latestPlotMeta}
          imageUrl= {HTTP_ENDPOINTS.latestPlot}
          title="Latest Plot"
          pollInterval={5000} // poll every 7 seconds
        />
        <LatestImage
          metaUrl= {HTTP_ENDPOINTS.latestFrameMeta}
          imageUrl= {HTTP_ENDPOINTS.latestFrame}
          title="Latest Frame"
          pollInterval={5000} // poll every 3 seconds
        />
      </div>
    </div>
  );
}
