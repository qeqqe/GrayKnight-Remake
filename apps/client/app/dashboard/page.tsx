"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  Layout,
  Library,
  History,
  Search,
  Smartphone,
  Menu,
} from "lucide-react";
import Image from "next/image";
import { spotifyTrack } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Overview } from "@/components/dashboard/Overview";
import AvailableDevices from "../(components)/AvailableDevices";
import SearchSection from "../(components)/SearchSection";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg";

interface SpotifyUser {
  id: string;
  spotifyId: string;
  email: string;
  displayName: string;
  profileUrl: string;
}

const Page = () => {
  const router = useRouter();
  const [currentTrack, setCurrentTrack] = useState<spotifyTrack | null>(null);
  const [user, setUser] = useState<SpotifyUser>({
    id: "",
    spotifyId: "",
    email: "",
    displayName: "",
    profileUrl: "",
  });
  const [activeTab, setActiveTab] = useState("overview");

  const currentPlaying = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/spotify/current-playing`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.error("Current playing error:", response.status);
        if (response.status === 401) {
          localStorage.removeItem("token");
          router.push("/");
        }
        return;
      }

      const data = await response.json();
      if (data.item) {
        const trackData: spotifyTrack = {
          id: data.item.id,
          name: data.item.name,
          duration_ms: data.item.duration_ms,
          explicit: data.item.explicit,
          artists: data.item.artists,
          album: data.item.album,
          preview_url: data.item.preview_url,
          popularity: data.item.popularity || 0,
          progress_ms: data.progress_ms || 0,
          is_playing: data.is_playing,
          uri: data.item.uri,
          external_urls: data.item.external_urls,
        };
        setCurrentTrack(trackData);
      }
    } catch (error) {
      console.error("Error fetching current track:", error);
    }
  }, [router]);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      const tokenExpiry = localStorage.getItem("tokenExpiry");

      if (!token || (tokenExpiry && Date.now() > parseInt(tokenExpiry))) {
        console.log("Token missing or expired, redirecting to login");
        localStorage.removeItem("token");
        localStorage.removeItem("tokenExpiry");
        router.push("/");
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/spotify/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          console.log("User data fetch failed:", response.status);
          if (response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("tokenExpiry");
            router.push("/");
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const userData = await response.json();
        console.log("User data fetched successfully:", userData);
        setUser(userData);

        const pollCurrentTrack = async () => {
          try {
            await currentPlaying();
          } catch (error) {
            console.error("Polling error:", error);
            if (
              error &&
              typeof error === "object" &&
              "status" in error &&
              error.status === 401
            ) {
              localStorage.removeItem("token");
              localStorage.removeItem("tokenExpiry");
              router.push("/");
            }
          }
        };

        await pollCurrentTrack();

        const interval = setInterval(pollCurrentTrack, 30000);
        return () => clearInterval(interval);
      } catch (error) {
        console.error("Error in fetchUserData:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("tokenExpiry");
        router.push("/");
      }
    };

    fetchUserData();
  }, [router, currentPlaying]);

  const NavContent = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4 px-2">
        <div className="relative h-12 w-12">
          {user.profileUrl ? (
            <Image
              src={user.profileUrl}
              alt={user.displayName || "User avatar"}
              width={48}
              height={48}
              className="rounded-full ring-2 ring-white/10 hover:ring-white/20 transition-all"
              onError={(e) => {
                e.currentTarget.src = DEFAULT_AVATAR;
              }}
            />
          ) : (
            <Image
              src={DEFAULT_AVATAR}
              alt="Default avatar"
              width={48}
              height={48}
              className="rounded-full ring-2 ring-white/10"
            />
          )}
          <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-green-500 ring-2 ring-zinc-900" />
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold text-white truncate">
            {user.displayName || "Loading..."}
          </h2>
          <p className="text-sm text-zinc-400 truncate">
            {user.email || "Please sign in"}
          </p>
        </div>
      </div>

      <Separator className="bg-white/5" />

      {/* Rest of the navigation */}
      <ScrollArea className="h-[calc(100vh-200px)]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-col w-full space-y-1 bg-transparent">
            {[
              {
                value: "overview",
                icon: <Layout className="w-4 h-4" />,
                label: "Overview",
              },
              {
                value: "search",
                icon: <Search className="w-4 h-4" />,
                label: "Search",
              },
              {
                value: "library",
                icon: <Library className="w-4 h-4" />,
                label: "Library",
              },
              {
                value: "devices",
                icon: <Smartphone className="w-4 h-4" />,
                label: "Devices",
              },
              {
                value: "history",
                icon: <History className="w-4 h-4" />,
                label: "History",
              },
            ].map((item) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                className="w-full justify-start gap-2 px-3 py-2 data-[state=active]:bg-white/10"
              >
                {item.icon}
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <ScrollBar />
      </ScrollArea>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-emerald-500/10 animate-gradient" />
      <div className="absolute inset-0 backdrop-blur-[100px]" />

      <div className="flex flex-col min-h-screen relative">
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-lg border-b border-white/10 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold">GrayKnight</h1>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[300px] bg-zinc-900 border-white/10 p-0"
              >
                <div className="p-6">
                  <NavContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex h-full">
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-64 shrink-0 fixed h-full">
            <Card className="h-full border-r border-white/10 bg-black/20 backdrop-blur-xl">
              <CardContent className="p-6">
                <NavContent />
              </CardContent>
            </Card>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 w-full md:pl-64">
            <div className="container max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsContent value="overview" className="mt-0 space-y-4">
                  <Overview currentTrack={currentTrack} />
                </TabsContent>
                <TabsContent value="search" className="mt-0 w-full">
                  <Card className="bg-white/[0.03] border-white/10 w-full">
                    <SearchSection />
                  </Card>
                </TabsContent>
                <TabsContent value="library" className="mt-0">
                  <Card className="bg-white/[0.03] border-white/10">
                    <CardContent className="p-6">
                      <h2 className="text-2xl font-bold mb-4">Library</h2>
                      {/* library content */}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="devices" className="mt-0">
                  <Card className="bg-white/[0.03] border-white/10">
                    <CardContent className="p-6">
                      <h2 className="text-2xl font-bold mb-4 text-zinc-300">
                        Available Devices
                      </h2>
                      <AvailableDevices />
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="history" className="mt-0">
                  <Card className="bg-white/[0.03] border-white/10">
                    <CardContent className="p-6">
                      <h2 className="text-2xl font-bold mb-4">History</h2>
                      {/* History content */}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Page;
