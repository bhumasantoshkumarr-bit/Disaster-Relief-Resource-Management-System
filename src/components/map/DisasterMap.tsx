"use client";

import dynamic from "next/dynamic";

const DisasterMapInner = dynamic(() => import("./DisasterMapInner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[450px] bg-slate-800/80 rounded-xl flex items-center justify-center border border-slate-700">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-slate-400">Loading Geospatial Disaster Map...</p>
      </div>
    </div>
  ),
});

export default DisasterMapInner;
