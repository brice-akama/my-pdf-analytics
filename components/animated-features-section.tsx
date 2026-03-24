"use client";

import Image from "next/image";

const features = [
  {
  title: "Board Meetings",
  description: "Share board materials securely. Know who read the agenda before the meeting starts.",
  image: "/assets/board-meetings.jpg",
},
  {
    title: "Investor Relations",
    description: "Send your pitch deck and know exactly which slides investors spent time on.",
    image: "/assets/team-photo.jpg",
  },
  {
    title: "Client Portals",
    description: "Branded document rooms for every client. Collect files, signatures, and feedback in one place.",
    image: "/assets/client-portals.jpg",
  },
  {
    title: "Mergers & Acquisitions",
    description: "Secure data rooms with NDA gating, role-based access, and full audit trails for every document.",
    image: "/assets/mergers-acquisitions.jpg",
  },
];

export function AnimatedFeaturesSection() {
  const duplicatedFeatures = [...features, ...features];

  return (
    // CHANGE: py-20 sm:py-32 → py-12 sm:py-16 (reduces top/bottom gap significantly)
    <section className="relative overflow-hidden py-12 sm:py-16 bg-white">
      <div className="container px-4">

        {/* CHANGE: mb-16 → mb-10 (tightens space between header and cards) */}
        <div className="mx-auto max-w-3xl text-center mb-10">
          <h2 className="mb-4 text-2xl font-normal tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            The all‑in‑one platform for deal management
          </h2>
         <p className="text-base text-slate-600 sm:text-lg">
  From the first pitch deck to the final signature — DocMetrics gives you 
  full visibility into every document, every reader, and every next step.
</p>
        </div>

        {/* Sliding Container */}
        <div className="relative overflow-hidden">
          <div className="flex gap-8 animate-scroll">
            {duplicatedFeatures.map((feature, index) => (
              <div
                key={`${feature.title}-${index}`}
                className="flex-shrink-0 w-[300px] group"
              >
                <div className="h-full overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 flex flex-col">
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                    {/* Placeholder */}
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#f0f9ff] to-[#e0f2fe]">
                      <div className="text-center p-6">
                        <svg className="mx-auto h-16 w-16 text-[#0ea5e9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="mt-2 text-xs text-slate-400">Add image</p>
                      </div>
                    </div>

                    <Image
                      src={feature.image}
                      alt={feature.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-[#0369a1]/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="mb-2 text-lg font-semibold text-slate-900 line-clamp-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}