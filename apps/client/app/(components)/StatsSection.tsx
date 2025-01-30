import { Card, CardContent } from "@/components/ui/card";
import React from "react";

const StatsSection = () => {
  return (
    <>
      <Card className="bg-white/[0.03] border-white/10">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-zinc-300">Stats</h2>
          <p className="text-lg text-zinc-400">Coming soon! 🚀</p>
        </CardContent>
      </Card>
    </>
  );
};

export default StatsSection;
