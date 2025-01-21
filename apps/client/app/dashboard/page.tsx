"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Music2,
  BarChart3,
  Clock,
  Layout,
  Library,
  History,
  Search,
} from "lucide-react";
import Image from "next/image";

interface SpotifyUser {
  id: string;
  spotifyId: string;
  email: string;
  displayName: string;
  profileUrl: string;
}

interface Track {
  name: string;
  artist: string;
  timestamp: string;
}

// Add dummy data
const dummyRecentTracks: Track[] = [
  { name: "Starlight", artist: "Muse", timestamp: "2 minutes ago" },
  { name: "Black Dog", artist: "Led Zeppelin", timestamp: "15 minutes ago" },
  {
    name: "Supermassive Black Hole",
    artist: "Muse",
    timestamp: "25 minutes ago",
  },
];

const Page = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [user, setUser] = useState<SpotifyUser>({
    id: "",
    spotifyId: "",
    email: "",
    displayName: "",
    profileUrl: "",
  });

  useEffect(() => {
    const fetchUserDetail = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/");
        throw new Error("Token not found");
      }
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      setUser(data);
    };

    fetchUserDetail();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white relative overflow-hidden">
      {/* Background effects matching welcome page */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-emerald-500/10 animate-gradient" />
      <div className="absolute inset-0 backdrop-blur-[100px]" />

      <div className="flex flex-col md:flex-row relative">
        {/* Sidebar - collapsible on mobile */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/10 bg-black/20 backdrop-blur-xl">
          <div className="p-4 md:p-6 space-y-6">
            {/* Profile Card */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 p-[2px] flex-shrink-0">
                  <Image
                    src={user.profileUrl}
                    alt={user.displayName}
                    width={48}
                    height={48}
                    className="rounded-full"
                    onError={(e) => {
                      e.currentTarget.src = "/default-avatar.png";
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base md:text-lg font-semibold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent truncate">
                    {user.displayName}
                  </h2>
                  <p className="text-xs md:text-sm text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex md:block overflow-x-auto md:overflow-visible md:space-y-1 pb-2 md:pb-0">
              {[
                {
                  icon: <Layout className="w-4 h-4" />,
                  label: "Overview",
                  id: "overview",
                },
                {
                  icon: <Library className="w-4 h-4" />,
                  label: "Library",
                  id: "library",
                },
                {
                  icon: <History className="w-4 h-4" />,
                  label: "History",
                  id: "history",
                },
                {
                  icon: <Search className="w-4 h-4" />,
                  label: "Search",
                  id: "search",
                },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 md:px-4 md:py-3 rounded-xl text-sm whitespace-nowrap transition-all duration-200 flex-shrink-0 md:w-full ${
                    activeTab === item.id
                      ? "bg-white/10 text-white"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 md:p-8 overflow-auto">
          <div className="max-w-5xl mx-auto space-y-4 md:space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                {
                  label: "Monthly Tracks",
                  value: "847",
                  icon: <Music2 className="w-5 h-5" />,
                },
                {
                  label: "Listening Time",
                  value: "156h",
                  icon: <Clock className="w-5 h-5" />,
                },
                {
                  label: "Top Genre",
                  value: "Rock",
                  icon: <BarChart3 className="w-5 h-5" />,
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="group relative p-4 md:p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
                  <div className="relative flex items-center gap-3 md:gap-4">
                    <div className="p-2 md:p-3 rounded-xl bg-white/5">
                      {stat.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent truncate">
                        {stat.value}
                      </p>
                      <p className="text-xs md:text-sm text-gray-400 truncate">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Now Playing Card */}
            <div className="group relative p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
              <div className="relative">
                <h3 className="text-lg font-semibold mb-4">Now Playing</h3>
                {/* Now playing content */}
              </div>
            </div>

            {/* Recent Tracks */}
            <div className="group relative p-4 md:p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
              <div className="relative">
                <h3 className="text-base md:text-lg font-semibold mb-4">
                  Recent Tracks
                </h3>
                <div className="space-y-2 md:space-y-3">
                  {dummyRecentTracks.map((track, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 md:p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-200"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Music2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm text-white truncate">
                            {track.name}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {track.artist}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {track.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
