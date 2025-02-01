"use client";
import { useEffect, useState } from "react";
import { SpotifyDevice } from "@/lib/types";
import { Laptop, Smartphone, Speaker, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function AvailableDevices() {
  const [devices, setDevices] = useState<SpotifyDevice[]>([]);
  const [transferring, setTransferring] = useState<string | null>(null);
  const [volumeInput, setVolumeInput] = useState<string>("");
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  const getDeviceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "computer":
        return <Laptop className="w-4 h-4" />;
      case "smartphone":
        return <Smartphone className="w-4 h-4" />;
      case "speaker":
        return <Speaker className="w-4 h-4" />;
      case "tv":
        return <Tv className="w-4 h-4" />;
      default:
        return <Speaker className="w-4 h-4" />;
    }
  };

  const fetchDevices = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/spotify/available-devices`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch devices");
      const data = await response.json();

      // Ensure devices is always an array
      const deviceList = data.devices || [];

      // Get current track to double-check active device
      const currentTrack = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/spotify/current-playing`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      ).then((res) => res.json());

      // Update active status based on current playback
      const updatedDevices = deviceList.map(
        (device: { is_active: boolean; id: string }) => ({
          ...device,
          is_active: currentTrack?.device?.id === device.id || device.is_active,
        })
      );

      setDevices(updatedDevices);

      // Store active device in local storage
      const activeDevice = updatedDevices.find(
        (device: SpotifyDevice) => device.is_active
      );
      if (activeDevice) {
        localStorage.setItem("active_device_id", activeDevice.id);
      }
    } catch (error) {
      console.error("Failed to fetch devices:", error);
    }
  };

  const transferPlayback = async (deviceId: string) => {
    if (transferring) return;

    setTransferring(deviceId);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/spotify/transfer-playback`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ deviceId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to transfer playback");
      }

      // Update immediately to show the transfer
      setDevices((prev) =>
        prev.map((device) => ({
          ...device,
          is_active: device.id === deviceId,
        }))
      );

      // Refresh devices after a short delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await fetchDevices();

      // One final refresh to ensure state is accurate
      setTimeout(() => {
        fetchDevices();
        setTransferring(null);
      }, 5000);
    } catch (error) {
      console.error("Failed to transfer playback:", error);
      setTransferring(null);
      // Refresh devices to show current state
      fetchDevices();
    }
  };

  const adjustVolume = async (deviceId: string, volume: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/spotify/adjust-volume`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ deviceId, volume }),
        }
      );

      if (!response.ok) throw new Error("Failed to adjust volume");
      await fetchDevices();
    } catch (error) {
      console.error("Failed to adjust volume:", error);
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!devices.length) {
    return (
      <div className="text-center text-zinc-500 dark:text-zinc-400 py-8">
        <Speaker className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg">No devices found</p>
        <p className="text-sm">Open Spotify on any device to see it here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 ">
      <div className="space-y-2">
        {devices.map((device) => (
          <div
            key={device.id}
            className="flex items-center gap-3 p-3 bg-white/[0.03] hover:bg-white/[0.05] rounded-md border border-white/10 transition-colors"
          >
            <div className="flex-1 flex items-center gap-3">
              <div className="text-green-600 dark:text-green-400">
                {getDeviceIcon(device.type)}
              </div>
              <div className="flex-1">
                <p className="font-medium text-zinc-300">
                  {device.name}
                  {device.is_active && (
                    <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                      • Active
                    </span>
                  )}
                  {transferring === device.id && (
                    <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400">
                      • Transferring...
                    </span>
                  )}
                </p>
                <p className="text-xs text-zinc-500">
                  {device.type.charAt(0).toUpperCase() + device.type.slice(1)}
                  {device.volume_percent !== null && (
                    <>
                      {device.is_active ? (
                        <Popover
                          open={openPopover === device.id}
                          onOpenChange={(open) => {
                            if (open) {
                              setVolumeInput(
                                device.volume_percent?.toString() || ""
                              );
                              setOpenPopover(device.id);
                            } else {
                              setOpenPopover(null);
                            }
                          }}
                        >
                          <PopoverTrigger asChild>
                            <span className="ml-2 cursor-pointer text-zinc-500 hover:text-zinc-300 transition-colors">
                              • Volume: {device.volume_percent}%
                            </span>
                          </PopoverTrigger>
                          <PopoverContent className="w-40 bg-zinc-900 border-zinc-700 p-2">
                            <form
                              onSubmit={async (e) => {
                                e.preventDefault();
                                const volume = parseInt(volumeInput);
                                if (volume >= 0 && volume <= 100) {
                                  await adjustVolume(device.id, volume);
                                  setOpenPopover(null);
                                }
                              }}
                              className="flex gap-2"
                            >
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="0-100"
                                value={volumeInput}
                                onChange={(e) => setVolumeInput(e.target.value)}
                                className="bg-zinc-800 border-zinc-700 text-white h-8"
                              />
                              <Button
                                type="submit"
                                size="sm"
                                className="bg-green-500 hover:bg-green-600 text-white h-8"
                              >
                                Set
                              </Button>
                            </form>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <span className="ml-2 text-zinc-600">
                          • Volume: {device.volume_percent}%
                        </span>
                      )}
                    </>
                  )}
                </p>
              </div>
            </div>
            {!device.is_active && (
              <Button
                variant="ghost"
                size="sm"
                className="text-green-500 hover:text-green-400 hover:bg-white/5"
                onClick={() => transferPlayback(device.id)}
                disabled={transferring !== null}
              >
                Transfer
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
