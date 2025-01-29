"use client";
import React from "react";
import UserCurrentPlaylist from "./UserCurrentPlaylist";

const LibraryContent = () => {
  return (
    <div className="flex flex-col gap-4">
      <UserCurrentPlaylist />
    </div>
  );
};

export default LibraryContent;
