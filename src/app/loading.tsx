import React from "react";
import VisceralLoader from "@/components/Loader";

export default function RootLoading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] w-full bg-black">
      <VisceralLoader size="lg" />
    </div>
  );
}
