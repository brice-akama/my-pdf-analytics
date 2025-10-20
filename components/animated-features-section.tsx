"use client";

import Image from "next/image";

const features = [
  {
    title: "Board Meetings",
    description: "Organize board materials with a single click",
    image: "/assets/team.png",
  },
  {
    title: "Investor Relations",
    description: "Securely & intuitively share investor updates",
    image: "/assets/your-team-photo.jpg",
  },
  {
    title: "Client Portals",
    description: "Securely share documents through a custom-branded client portal",
    image: "/assets/client-portals.jpg",
  },
  {
    title: "Mergers & Acquisitions",
    description: "Stay in control of deal documents",
    image: "/assets/mergers-acquisitions.jpg",
  },
];

export function AnimatedFeaturesSection() {
  const duplicatedFeatures = [...features, ...features];

  return (
    <section className="relative overflow-hidden py-20 sm:py-32">
      <div className="container px-4">
        {/* Header — NO border, NO line */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            The all in one platform for deal management
          </h2>
          <p className="text-lg text-gray-600 sm:text-xl">
            DocMetrics is built to allow companies, founders and financial teams to swiftly 
            navigate the dealmaking process.
          </p>
        </div>

        {/* Sliding Container — NO gradient overlays */}
        <div className="relative">
          {/* ✅ REMOVED: Left & right white gradient overlays */}

          {/* Scrolling Wrapper */}
          <div className="overflow-hidden">
            <div className="flex gap-8 animate-scroll">
              {duplicatedFeatures.map((feature, index) => (
                <div
                  key={`${feature.title}-${index}`}
                  className="flex-shrink-0 w-[300px] group"
                >
                  <div className="h-full overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 flex flex-col">
                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                      {/* Placeholder */}
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
                        <div className="text-center p-6">
                          <svg className="mx-auto h-16 w-16 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="mt-2 text-xs text-gray-500">Add image</p>
                        </div>
                      </div>

                      <Image
                        src={feature.image}
                        alt={feature.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-purple-900/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="mb-2 text-xl font-semibold text-gray-900 line-clamp-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Keep animation styles */}
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
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