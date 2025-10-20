import Image from "next/image"

export function SocialProofSection() {
  return (
    <section className=" bg-gradient-to-b from-white to-purple-50/30 py-16 sm:py-24">
      <div className="container px-4">
        <div className="mx-auto max-w-6xl">
          
          {/* Main Grid - 2 columns on desktop */}
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            
            {/* Left Column - Text Content */}
            <div className="flex flex-col justify-center">
              <h2 className="mb-10 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
                Track Every Document View
              </h2>
              
              <p className="mb-8 text-lg text-gray-600 leading-relaxed">
                Most people only post PDFs on social media, but tracking quality 
                engagement is a challenge. The unique side is that it reveals all 
                marketing insights. Perfect for your company or startup.
              </p>

              <p className="mb-8 text-base text-gray-600 leading-relaxed">
                Automatically, when there is lots of document sent, the quality of the 
                insights makes it easier to cut through noise. This leads us to believe that:
              </p>

              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <svg className="mt-1 h-5 w-5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>If you're not seeing engagement, strategy can be refined</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-1 h-5 w-5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Data likely due to poor content failing to resonate with users and not engaging with your audience</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-1 h-5 w-5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Half thought is LOST (even!)</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-1 h-5 w-5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Up-to-date (fit)</span>
                </li>
              </ul>
            </div>

            {/* Right Column - Visual Card */}
            <div className="relative flex items-center justify-center">
              <div className="relative w-full max-w-md">
                
                {/* Main Card */}
                <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
                  
                  {/* Top Section with Circle Design */}
                  <div className="relative bg-gradient-to-br from-purple-100 to-blue-100 p-8">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-white/80" />
                        <div className="h-10 w-10 rounded-full bg-white/60" />
                      </div>
                      <div className="h-10 w-10 rounded-full bg-purple-500" />
                    </div>
                    
                    <h3 className="text-3xl font-bold text-gray-900">
                        Track.
                      <br />
                        Engage.
                      <br />
                        Close.
                    </h3>
                    
                    {/* Decorative circles */}
                    <svg className="absolute right-8 top-8 h-32 w-32 text-purple-200" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.3" />
                      <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.5" />
                      <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.7" />
                    </svg>

                    {/* Color palette */}
                    <div className="mt-6 flex gap-2">
                      <div className="h-3 w-3 rounded-full bg-purple-500" />
                      <div className="h-3 w-3 rounded-full bg-blue-500" />
                      <div className="h-3 w-3 rounded-full bg-indigo-500" />
                      <div className="h-3 w-3 rounded-full bg-cyan-500" />
                    </div>
                  </div>

                  {/* Image Section */}
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200">
                    {/* Placeholder for your image */}
                    <div className="flex h-full items-center justify-center">
                      <div className="text-center">
                        <svg className="mx-auto h-20 w-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-500">Your team photo here</p>
                      </div>
                    </div>
                   
                    
                    <Image 
                      src="/assets/your-team-photo.jpg"
                      alt="Team collaboration"
                      fill
                      className="object-cover"
                    />
                   
                  </div>

                  {/* Bottom Text Section */}
                  <div className="bg-white p-6">
                    <h4 className="mb-2 text-xl font-semibold text-gray-900">
                      Doing Things Differently
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      It's not about just sending documents. It comes to YOUR BUSINESS 
                      knowing what happens next, which gives a 100% different view of what 
                      approach that is quite different to what prospects want.
                    </p>
                  </div>
                </div>

                {/* Floating badge (optional) */}
                <div className="absolute -right-4 -top-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg">
                  New Way
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}