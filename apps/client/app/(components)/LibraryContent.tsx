"use client";
import React from "react";
import UserCurrentPlaylist from "./UserCurrentPlaylist";
import UserTopItems from "./UserTopItems";
import { Card } from "@chakra-ui/react";
import { CardContent } from "@/components/ui/card";

const LibraryContent = () => {
  return (
    <div className="flex flex-col gap-4 lg:mt-0 md:mt-16 sm:mt-16">
      <Card className="bg-white/[0.03] border-white/10 rounded-xl ">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-white to-zinc-900 text-transparent bg-clip-text">
            Your Playlists
          </h2>
          <UserCurrentPlaylist />
        </CardContent>
      </Card>

      <Card className="bg-white/[0.03] border-white/10 rounded-xl ">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-white to-zinc-900 text-transparent bg-clip-text">
            Your Top Items
          </h2>
          <UserTopItems />
        </CardContent>
      </Card>
    </div>
  );
};

export default LibraryContent;
