"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Video, Trash2, Play, StopCircle, RotateCcw, Loader2, CheckCircle } from "lucide-react"
import { toast } from "sonner"

type DocumentVideo = {
  _id: string
  pageNumber: number
  cloudinaryUrl: string
  thumbnail: string
  duration: number
  title: string
  createdAt: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  doc: any
  docId: string
  videos: DocumentVideo[]
  onVideosChange: (videos: DocumentVideo[]) => void
}

export default function VideoWalkthroughDrawer({
  open, onOpenChange, doc, docId, videos, onVideosChange
}: Props) {

  const [selectedPage, setSelectedPage] = useState<number>(0) // 0 = intro
  const [isRecording, setIsRecording] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [loadingVideos, setLoadingVideos] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [stream, setStream] = useState<MediaStream | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const previewRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const MAX_SECONDS = 60

  // Fetch existing videos when drawer opens
  useEffect(() => {
    if (open) fetchVideos()
    return () => {
      stopStreamTracks()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [open])

  // Timer countdown
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => {
          if (prev >= MAX_SECONDS) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isRecording])

  const stopStreamTracks = () => {
    if (stream) stream.getTracks().forEach(t => t.stop())
  }

  const fetchVideos = async () => {
    setLoadingVideos(true)
    try {
      const res = await fetch(`/api/documents/${docId}/videos`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        if (data.success) onVideosChange(data.videos)
      }
    } catch (e) { console.error(e) }
    finally { setLoadingVideos(false) }
  }

  const startRecording = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: true
      })

      setStream(mediaStream)
      chunksRef.current = []
      setRecordingSeconds(0)
      setRecordedBlob(null)
      setRecordedUrl(null)

      // Show live preview
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.muted = true
        videoRef.current.play()
      }

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm'

      const recorder = new MediaRecorder(mediaStream, { mimeType })

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        setRecordedBlob(blob)
        setRecordedUrl(url)
        setIsPreviewing(true)
        mediaStream.getTracks().forEach(t => t.stop())
      }

      mediaRecorderRef.current = recorder
      recorder.start(1000)
      setIsRecording(true)

    } catch (err) {
      toast.error('Could not access camera. Please allow camera permissions.')
      console.error(err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const resetRecording = () => {
    setRecordedBlob(null)
    if (recordedUrl) URL.revokeObjectURL(recordedUrl)
    setRecordedUrl(null)
    setIsPreviewing(false)
    setRecordingSeconds(0)
    stopStreamTracks()
  }

  const handleSaveVideo = async () => {
    if (!recordedBlob) return
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('video', recordedBlob, `page-${selectedPage}-walkthrough.webm`)
      formData.append('pageNumber', String(selectedPage))
      formData.append('duration', String(recordingSeconds))
      formData.append('title', selectedPage === 0
        ? 'Document Introduction'
        : `Page ${selectedPage} Walkthrough`
      )

      const res = await fetch(`/api/documents/${docId}/videos`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        toast.success('Video saved successfully')
        resetRecording()
        fetchVideos()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to save video')
      }
    } catch (e) {
      toast.error('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteVideo = async (videoId: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}/videos/${videoId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (res.ok) {
        toast.success('Video deleted')
        fetchVideos()
      } else {
        toast.error('Failed to delete video')
      }
    } catch {
      toast.error('Network error')
    }
  }

  const getVideoForPage = (page: number) =>
    videos.find(v => v.pageNumber === page)

  const formatSeconds = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const pages = [0, ...Array.from({ length: doc.numPages || 1 }, (_, i) => i + 1)]

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => { if (!isRecording) onOpenChange(false) }}
      />

      {/* Drawer — wide, slides from right */}
      <div className="relative ml-auto w-full max-w-3xl h-full bg-white shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-indigo-600">
          <div>
            <h2 className="text-lg font-bold text-white">Video Walkthroughs</h2>
            <p className="text-xs text-indigo-200 mt-0.5">
              Record short explanations per page — max 60 seconds each
            </p>
          </div>
          <button
            onClick={() => { if (!isRecording) { resetRecording(); onOpenChange(false) } }}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-indigo-200 hover:text-white hover:bg-indigo-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* Left — page selector */}
          <div className="w-48 border-r bg-slate-50 overflow-y-auto flex-shrink-0">
            <div className="p-3">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Select Page
              </p>
              <div className="space-y-1">
                {pages.map(page => {
                  const hasVideo = !!getVideoForPage(page)
                  const isSelected = selectedPage === page
                  return (
                    <button
                      key={page}
                      onClick={() => {
                        if (!isRecording) {
                          resetRecording()
                          setSelectedPage(page)
                        }
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{page === 0 ? 'Intro' : `Page ${page}`}</span>
                      {hasVideo && (
                        <div className={`h-2 w-2 rounded-full flex-shrink-0 ${
                          isSelected ? 'bg-indigo-200' : 'bg-green-500'
                        }`} />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right — recorder */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-5">

              {/* Current page label */}
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {selectedPage === 0 ? 'Document Introduction' : `Page ${selectedPage} Walkthrough`}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedPage === 0
                    ? 'This video plays when the prospect first opens the document'
                    : `This video plays when the prospect reaches page ${selectedPage}`}
                </p>
              </div>

              {/* Existing video for this page */}
              {getVideoForPage(selectedPage) && !isPreviewing && !isRecording && (
                <div className="border rounded-xl overflow-hidden bg-slate-50">
                  <div className="px-4 py-3 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-slate-900">
                        Video recorded
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatSeconds(getVideoForPage(selectedPage)!.duration)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteVideo(getVideoForPage(selectedPage)!._id)}
                      className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                  <video
                    src={getVideoForPage(selectedPage)!.cloudinaryUrl}
                    controls
                    className="w-full max-h-48 bg-black"
                  />
                  <div className="px-4 py-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPage(selectedPage)}
                      className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Re-record
                    </Button>
                  </div>
                </div>
              )}

              {/* Recording area */}
              {!isPreviewing && (
                <div className="space-y-4">

                  {/* Camera preview */}
                  <div className="relative bg-slate-900 rounded-xl overflow-hidden aspect-video">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className={`w-full h-full object-cover ${!isRecording ? 'hidden' : ''}`}
                    />
                    {!isRecording && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <Video className="h-12 w-12 text-slate-600 mx-auto mb-2" />
                          <p className="text-slate-400 text-sm">Camera preview will appear here</p>
                        </div>
                      </div>
                    )}

                    {/* Recording indicator */}
                    {isRecording && (
                      <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full">
                        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-white text-xs font-mono font-bold">
                          {formatSeconds(recordingSeconds)} / {formatSeconds(MAX_SECONDS)}
                        </span>
                      </div>
                    )}

                    {/* Progress bar */}
                    {isRecording && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-700">
                        <div
                          className="h-full bg-red-500 transition-all duration-1000"
                          style={{ width: `${(recordingSeconds / MAX_SECONDS) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-3">
                    {!isRecording ? (
                      <Button
                        onClick={startRecording}
                        className="gap-2 bg-red-600 hover:bg-red-700 text-white"
                      >
                        <div className="h-3 w-3 rounded-full bg-white" />
                        Start Recording
                      </Button>
                    ) : (
                      <Button
                        onClick={stopRecording}
                        variant="outline"
                        className="gap-2 border-red-200 text-red-700 hover:bg-red-50"
                      >
                        <StopCircle className="h-4 w-4" />
                        Stop Recording
                      </Button>
                    )}

                    <p className="text-xs text-slate-400">
                      Maximum 60 seconds per page
                    </p>
                  </div>
                </div>
              )}

              {/* Preview recorded video */}
              {isPreviewing && recordedUrl && (
                <div className="space-y-4">
                  <div className="border rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-900">
                        Preview your recording — {formatSeconds(recordingSeconds)}
                      </span>
                    </div>
                    <video
                      ref={previewRef}
                      src={recordedUrl}
                      controls
                      autoPlay
                      className="w-full bg-black"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      onClick={handleSaveVideo}
                      disabled={isUploading}
                      className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      {isUploading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" />Saving...</>
                      ) : (
                        <><CheckCircle className="h-4 w-4" />Save Video</>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={resetRecording}
                      disabled={isUploading}
                      className="gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Re-record
                    </Button>
                  </div>
                </div>
              )}

              {/* All videos summary */}
              {videos.length > 0 && (
                <div className="border-t pt-4 mt-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Recorded Videos ({videos.length})
                  </p>
                  <div className="space-y-2">
                    {videos.map(v => (
                      <div key={v._id} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Play className="h-3.5 w-3.5 text-indigo-600" />
                          <span className="text-sm text-slate-700">
                            {v.pageNumber === 0 ? 'Introduction' : `Page ${v.pageNumber}`}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatSeconds(v.duration)}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteVideo(v._id)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}