"use client";
import { handleSpotifyLogin } from "@/lib/utils";
import { Music2, History, BarChart3, Music } from "lucide-react";

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white relative overflow-hidden">
      {/* animated bg */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-emerald-500/10 animate-gradient" />
      <div className="absolute inset-0 backdrop-blur-[100px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* hero section */}
        <div className="text-center mb-32 space-y-8">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-8">
            <Music className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-sm font-mono bg-gradient-to-r from-gray-400 to-gray-200 bg-clip-text text-transparent">
              GRAYKNIGHT
            </span>
          </div>

          <div className="relative">
            <div className="absolute -inset-x-20 -top-16 h-44 bg-gradient-to-r from-gray-500/20 to-gray-300/20 blur-3xl opacity-50" />
            <h2 className="text-2xl text-gray-400 font-medium mb-2">
              Welcome to
            </h2>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight">
              <span className="inline-block animate-text-shimmer bg-[linear-gradient(45deg,theme(colors.gray.400),theme(colors.white),theme(colors.gray.400))] bg-[200%_auto] bg-clip-text text-transparent">
                Gray
              </span>
              <span className="bg-gradient-to-r from-gray-200 via-gray-400 to-gray-600 bg-clip-text text-transparent">
                Knight
              </span>
            </h1>
          </div>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Your noble companion in the realm of music analytics. Track,
            analyze, and visualize your listening habits in detail.
          </p>

          <button
            onClick={handleSpotifyLogin}
            className="group relative px-8 py-4 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 text-black font-medium text-lg hover:scale-105 transition-all duration-200 shadow-xl shadow-emerald-500/20"
          >
            <div className="absolute inset-0 rounded-full bg-white/20 blur-xl group-hover:blur-2xl transition-all duration-200" />
            <span className="relative flex items-center justify-center gap-2">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
              Connect with Spotify
            </span>
          </button>
        </div>

        {/* features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {[
            {
              icon: <History className="w-8 h-8" />,
              title: "Track History",
              description:
                "Dive deep into your listening history with beautiful visualizations and insights.",
              gradient: "from-blue-500/20 to-purple-500/20",
              iconBg: "bg-blue-500/10",
              iconColor: "text-blue-400",
              delay: "delay-0",
            },
            {
              icon: <BarChart3 className="w-8 h-8" />,
              title: "Rich Analytics",
              description:
                "Understand your music taste with detailed stats and personalized recommendations.",
              gradient: "from-emerald-500/20 to-teal-500/20",
              iconBg: "bg-emerald-500/10",
              iconColor: "text-emerald-400",
              delay: "delay-75",
            },
            {
              icon: <Music2 className="w-8 h-8" />,
              title: "Real-Time Control",
              description:
                "Control playback seamlessly with our integrated Spotify player.",
              gradient: "from-orange-500/20 to-red-500/20",
              iconBg: "bg-orange-500/10",
              iconColor: "text-orange-400",
              delay: "delay-150",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className={`group relative ${feature.delay} animate-fade-in`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500`}
              />
              <div className="relative h-full p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-sm hover:scale-[1.02] transition-all duration-300 hover:border-white/20">
                <div
                  className={`inline-flex p-4 rounded-2xl ${feature.iconBg} mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <div
                    className={`${feature.iconColor} group-hover:animate-bounce-subtle`}
                  >
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-white/90">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
                <div className="mt-6 flex items-center text-sm text-white/60 group-hover:text-white/90 transition-colors duration-300">
                  <span>Learn more</span>
                  <svg
                    className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 8H15M15 8L8 1M15 8L8 15"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* footer */}
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-400">
            Your data is securely encrypted and never shared
          </p>
          <div className="inline-flex gap-1 text-xs text-gray-500">
            Made By{" "}
            <a href="https://github.com/qeqqe" target="_blank">
              qeqqe
            </a>
            <span className="text-emerald-400">♥</span> for music lovers
          </div>
        </div>
      </div>
    </div>
  );
}
