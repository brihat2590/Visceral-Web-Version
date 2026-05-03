import React from "react";
import VisceralLoader from "@/components/Loader";

export default function DashboardLoading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] w-full h-full bg-black">
      <VisceralLoader size="lg" />
    </div>
  );
}
