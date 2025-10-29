"use client";

"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft,
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Coffee,
  Heart,
  TrendingUp,
  Globe,
  Zap,
  Shield,
  ChevronRight,
  Search
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function CareersPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [department, setDepartment] = useState("all")
  const [location, setLocation] = useState("all")

  const benefits = [
    {
      icon: Heart,
      title: "Health & Wellness",
      description: "Comprehensive health, dental, and vision insurance for you and your family",
      color: "from-red-500 to-red-600"
    },
    {
      icon: DollarSign,
      title: "Competitive Salary",
      description: "Market-leading compensation with equity options and performance bonuses",
      color: "from-green-500 to-green-600"
    },
    {
      icon: Coffee,
      title: "Flexible Work",
      description: "Remote-first culture with flexible hours and unlimited PTO",
      color: "from-orange-500 to-orange-600"
    },
    {
      icon: TrendingUp,
      title: "Career Growth",
      description: "Professional development budget and clear career progression paths",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: Users,
      title: "Team Culture",
      description: "Inclusive, diverse team with regular offsites and team building",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Zap,
      title: "Latest Tech",
      description: "Work with cutting-edge technologies and tools of your choice",
      color: "from-yellow-500 to-yellow-600"
    }
  ]

  const openings = [
    {
      id: 1,
      title: "Senior Full Stack Engineer",
      department: "Engineering",
      location: "San Francisco, CA / Remote",
      type: "Full-time",
      salary: "$150k - $200k",
      description: "Build and scale our core platform using Next.js, TypeScript, and Node.js"
    },
    {
      id: 2,
      title: "Product Designer",
      department: "Design",
      location: "Remote",
      type: "Full-time",
      salary: "$130k - $170k",
      description: "Create beautiful, intuitive experiences for our document analytics platform"
    },
    {
      id: 3,
      title: "Customer Success Manager",
      department: "Customer Success",
      location: "New York, NY / Remote",
      type: "Full-time",
      salary: "$90k - $120k",
      description: "Help our enterprise customers succeed and grow their usage of DocMetrics"
    },
    {
      id: 4,
      title: "DevOps Engineer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
      salary: "$140k - $180k",
      description: "Build and maintain our cloud infrastructure on AWS and ensure 99.9% uptime"
    },
    {
      id: 5,
      title: "Sales Development Representative",
      department: "Sales",
      location: "San Francisco, CA",
      type: "Full-time",
      salary: "$70k - $90k + Commission",
      description: "Generate qualified leads and help expand our customer base"
    },
    {
      id: 6,
      title: "Marketing Manager",
      department: "Marketing",
      location: "Remote",
      type: "Full-time",
      salary: "$110k - $140k",
      description: "Drive growth through content marketing, SEO, and digital campaigns"
    }
  ]

  const filteredOpenings = openings.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDepartment = department === "all" || job.department === department
    const matchesLocation = location === "all" || job.location.toLowerCase().includes(location.toLowerCase())
    
    return matchesSearch && matchesDepartment && matchesLocation
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              
              <Link href="/" className="hidden md:flex items-center gap-2">
                <div className="h-8 w-8">
                  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
                    <defs>
                      <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor:"#8B5CF6", stopOpacity:1}} />
                        <stop offset="100%" style={{stopColor:"#3B82F6", stopOpacity:1}} />
                      </linearGradient>
                    </defs>
                    <path d="M 60 50 L 60 150 L 140 150 L 140 70 L 120 50 Z" fill="url(#logoGrad)"/>
                    <rect x="75" y="100" width="12" height="30" fill="white" opacity="0.9" rx="2"/>
                    <rect x="94" y="85" width="12" height="45" fill="white" opacity="0.9" rx="2"/>
                    <rect x="113" y="70" width="12" height="60" fill="white" opacity="0.9" rx="2"/>
                  </svg>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  DocMetrics
                </span>
              </Link>
            </div>

            <Link href="/about">
              <Button variant="outline" size="sm">
                About Us
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Briefcase className="h-4 w-4" />
            Join Our Team
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Build the future of{" "}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              document analytics
            </span>
          </h1>
          
          <p className="text-xl text-slate-600 mb-8 leading-relaxed">
            We're a fast-growing startup looking for talented, passionate people to help us 
            transform how businesses share and track documents.
          </p>

          <div className="flex items-center justify-center gap-8 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <span>50+ Team Members</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              <span>Remote-First</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span>Fast Growing</span>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Why Work at DocMetrics?
            </h2>
            <p className="text-xl text-slate-600">
              We invest in our team's success and well-being
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border shadow-sm p-6 hover:shadow-lg transition-all group"
              >
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${benefit.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <benefit.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{benefit.title}</h3>
                <p className="text-slate-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Open Positions
            </h2>
            <p className="text-xl text-slate-600">
              Find your next role at DocMetrics
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border shadow-sm p-6 mb-8">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search positions..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Customer Success">Customer Success</SelectItem>
                </SelectContent>
              </Select>

              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="san francisco">San Francisco</SelectItem>
                  <SelectItem value="new york">New York</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Job Listings */}
          <div className="space-y-4">
            {filteredOpenings.length > 0 ? (
              filteredOpenings.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-xl border shadow-sm p-6 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                          <Briefcase className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-purple-600 transition-colors">
                            {job.title}
                          </h3>
                          <p className="text-slate-600 mb-3">{job.description}</p>
                          <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {job.department}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {job.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {job.type}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {job.salary}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 group-hover:scale-105 transition-transform">
                      Apply Now
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No positions found</h3>
                <p className="text-slate-600 mb-6">
                  Try adjusting your filters or check back later for new opportunities.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("")
                    setDepartment("all")
                    setLocation("all")
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Don't see the right role?
            </h2>
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              We're always looking for talented people. Send us your resume and tell us 
              why you'd be a great fit for DocMetrics.
            </p>
            <Button size="lg" className="bg-white text-purple-600 hover:bg-purple-50">
              Submit General Application
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}