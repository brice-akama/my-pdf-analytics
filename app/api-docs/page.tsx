"use client"
import React, { JSX, useState } from "react";
import { Code, Book, Zap, Shield, Key, Terminal, Globe, CheckCircle2, Copy, ChevronRight, Server, Database, Webhook, Play, FileText, Link2, BarChart3, Bell, Eye, Download, Share2, Users, Clock, Settings, Lock, AlertCircle, Sparkles, ExternalLink } from "lucide-react";

export default function APIDocumentationPage(): JSX.Element {
  const [activeTab, setActiveTab] = useState<"overview" | "auth" | "endpoints" | "webhooks">("overview");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<"curl" | "javascript" | "python" | "php">("curl");

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const codeExamples = {
    authentication: {
      curl: `curl -X GET "https://api.docmetri.com/v1/documents" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
      javascript: `const response = await fetch('https://api.docmetri.com/v1/documents', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});
const data = await response.json();`,
      python: `import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}
response = requests.get('https://api.docmetri.com/v1/documents', headers=headers)
data = response.json()`,
      php: `$ch = curl_init('https://api.docmetri.com/v1/documents');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer YOUR_API_KEY',
    'Content-Type: application/json'
]);
$response = curl_exec($ch);`
    },
    createDocument: {
      curl: `curl -X POST "https://api.docmetri.com/v1/documents" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Q4 Sales Proposal",
    "file_url": "https://example.com/document.pdf",
    "tracking_enabled": true,
    "notify_on_view": true
  }'`,
      javascript: `const response = await fetch('https://api.docmetri.com/v1/documents', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Q4 Sales Proposal',
    file_url: 'https://example.com/document.pdf',
    tracking_enabled: true,
    notify_on_view: true
  })
});`,
      python: `import requests

data = {
    'title': 'Q4 Sales Proposal',
    'file_url': 'https://example.com/document.pdf',
    'tracking_enabled': True,
    'notify_on_view': True
}
response = requests.post(
    'https://api.docmetri.com/v1/documents',
    headers={'Authorization': 'Bearer YOUR_API_KEY'},
    json=data
)`,
      php: `$data = [
    'title' => 'Q4 Sales Proposal',
    'file_url' => 'https://example.com/document.pdf',
    'tracking_enabled' => true,
    'notify_on_view' => true
];
$ch = curl_init('https://api.docmetri.com/v1/documents');
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));`
    }
  };

  const endpoints = [
    {
      category: "Documents",
      icon: FileText,
      color: "blue",
      apis: [
        { method: "GET", path: "/v1/documents", description: "List all documents" },
        { method: "POST", path: "/v1/documents", description: "Create a new document" },
        { method: "GET", path: "/v1/documents/:id", description: "Get document details" },
        { method: "PUT", path: "/v1/documents/:id", description: "Update a document" },
        { method: "DELETE", path: "/v1/documents/:id", description: "Delete a document" }
      ]
    },
    {
      category: "Analytics",
      icon: BarChart3,
      color: "green",
      apis: [
        { method: "GET", path: "/v1/analytics/:document_id", description: "Get document analytics" },
        { method: "GET", path: "/v1/analytics/:document_id/views", description: "Get view history" },
        { method: "GET", path: "/v1/analytics/:document_id/engagement", description: "Get engagement metrics" },
        { method: "GET", path: "/v1/analytics/:document_id/visitors", description: "Get visitor data" }
      ]
    },
    {
      category: "Tracking",
      icon: Eye,
      color: "purple",
      apis: [
        { method: "GET", path: "/v1/tracking/events", description: "Get tracking events" },
        { method: "POST", path: "/v1/tracking/links", description: "Create tracking link" },
        { method: "GET", path: "/v1/tracking/links/:id", description: "Get link analytics" }
      ]
    },
    {
      category: "Notifications",
      icon: Bell,
      color: "orange",
      apis: [
        { method: "GET", path: "/v1/notifications", description: "List notification rules" },
        { method: "POST", path: "/v1/notifications", description: "Create notification rule" },
        { method: "PUT", path: "/v1/notifications/:id", description: "Update notification rule" },
        { method: "DELETE", path: "/v1/notifications/:id", description: "Delete notification rule" }
      ]
    }
  ];

  const webhookEvents = [
    { event: "document.viewed", description: "Triggered when a document is opened" },
    { event: "document.downloaded", description: "Triggered when a document is downloaded" },
    { event: "document.shared", description: "Triggered when a document is shared" },
    { event: "engagement.high", description: "Triggered when engagement score exceeds threshold" },
    { event: "page.viewed", description: "Triggered when a specific page is viewed" },
    { event: "link.clicked", description: "Triggered when a link is clicked" }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <Code className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900">API Documentation</h1>
              <p className="text-slate-600">Build powerful integrations with DocMetri</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 mt-6">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-slate-700">API Status: Operational</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200">
              <Globe className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">Base URL: api.docmetri.com</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200">
              <Server className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-slate-700">Version: v1</span>
            </div>
          </div>
        </div>

        {/* Quick Start Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200">
            <Zap className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="font-bold text-slate-900 mb-2">Quick Start</h3>
            <p className="text-sm text-slate-700 mb-4">
              Get your API key and make your first request in under 5 minutes.
            </p>
            <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Get Started <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
            <Book className="h-8 w-8 text-purple-600 mb-3" />
            <h3 className="font-bold text-slate-900 mb-2">API Reference</h3>
            <p className="text-sm text-slate-700 mb-4">
              Complete documentation of all endpoints, parameters, and responses.
            </p>
            <button className="text-sm font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1">
              View Reference <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 border-2 border-green-200">
            <Terminal className="h-8 w-8 text-green-600 mb-3" />
            <h3 className="font-bold text-slate-900 mb-2">Code Examples</h3>
            <p className="text-sm text-slate-700 mb-4">
              Copy-paste examples in cURL, JavaScript, Python, and PHP.
            </p>
            <button className="text-sm font-semibold text-green-600 hover:text-green-700 flex items-center gap-1">
              Browse Examples <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Main Content Tabs */}
        <div className="bg-white rounded-xl border-2 border-slate-200 mb-12">
          <div className="border-b border-slate-200 p-2">
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeTab === "overview"
                    ? "bg-blue-600 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("auth")}
                className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeTab === "auth"
                    ? "bg-blue-600 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                Authentication
              </button>
              <button
                onClick={() => setActiveTab("endpoints")}
                className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeTab === "endpoints"
                    ? "bg-blue-600 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                Endpoints
              </button>
              <button
                onClick={() => setActiveTab("webhooks")}
                className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeTab === "webhooks"
                    ? "bg-blue-600 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                Webhooks
              </button>
            </div>
          </div>

          <div className="p-8">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">Getting Started with DocMetri API</h2>
                  <p className="text-slate-700 mb-6 leading-relaxed">
                    The DocMetri API allows you to programmatically manage documents, track analytics, 
                    and receive real-time notifications. Our RESTful API uses standard HTTP methods 
                    and returns JSON responses.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                    <Shield className="h-6 w-6 text-green-600 mb-3" />
                    <h3 className="font-bold text-slate-900 mb-2">Secure & Reliable</h3>
                    <p className="text-sm text-slate-600">
                      All API requests are made over HTTPS with OAuth 2.0 authentication. 
                      Rate limiting: 1000 requests/hour.
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                    <Zap className="h-6 w-6 text-orange-600 mb-3" />
                    <h3 className="font-bold text-slate-900 mb-2">Real-Time Updates</h3>
                    <p className="text-sm text-slate-600">
                      Subscribe to webhooks for instant notifications when events occur. 
                      No polling required.
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                    <Database className="h-6 w-6 text-blue-600 mb-3" />
                    <h3 className="font-bold text-slate-900 mb-2">Complete Access</h3>
                    <p className="text-sm text-slate-600">
                      Full CRUD operations on documents, analytics, tracking links, and 
                      notification settings.
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                    <Code className="h-6 w-6 text-purple-600 mb-3" />
                    <h3 className="font-bold text-slate-900 mb-2">Developer Friendly</h3>
                    <p className="text-sm text-slate-600">
                      Well-documented with code examples in multiple languages. SDKs 
                      available for popular frameworks.
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-6">
                  <h3 className="font-bold text-slate-900 mb-4">What You Can Build</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">CRM Integrations</div>
                        <div className="text-xs text-slate-600">Sync document analytics with your sales pipeline</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">Custom Dashboards</div>
                        <div className="text-xs text-slate-600">Build internal analytics dashboards with your data</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">Automated Workflows</div>
                        <div className="text-xs text-slate-600">Trigger actions based on document engagement</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">Bulk Operations</div>
                        <div className="text-xs text-slate-600">Upload and manage hundreds of documents at once</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Authentication Tab */}
            {activeTab === "auth" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">Authentication</h2>
                  <p className="text-slate-700 mb-6 leading-relaxed">
                    The DocMetri API uses API keys for authentication. Include your API key in the 
                    Authorization header of every request as a Bearer token.
                  </p>
                </div>

                <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
                  <div className="flex items-start gap-3 mb-4">
                    <Key className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-slate-900 mb-2">Getting Your API Key</h3>
                      <p className="text-sm text-slate-700 mb-3">
                        Generate your API key from your account dashboard. Each key can have different 
                        permission levels (read-only, read-write, admin).
                      </p>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                        Generate API Key
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-900">Authentication Example</h3>
                    <div className="flex gap-2">
                      {(["curl", "javascript", "python", "php"] as const).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => setSelectedLanguage(lang)}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            selectedLanguage === lang
                              ? "bg-slate-900 text-white"
                              : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                          }`}
                        >
                          {lang.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-slate-900 rounded-lg p-6 relative">
                    <button
                      onClick={() => copyToClipboard(codeExamples.authentication[selectedLanguage], "auth")}
                      className="absolute top-4 right-4 p-2 bg-slate-700 hover:bg-slate-600 rounded text-white transition-colors"
                      title="Copy code"
                    >
                      {copiedCode === "auth" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    <pre className="text-sm text-green-400 overflow-x-auto">
                      <code>{codeExamples.authentication[selectedLanguage]}</code>
                    </pre>
                  </div>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-slate-900 mb-2">Security Best Practices</h4>
                      <ul className="space-y-2 text-sm text-slate-700">
                        <li className="flex items-start gap-2">
                          <span className="text-yellow-600">•</span>
                          <span>Never expose API keys in client-side code or public repositories</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-yellow-600">•</span>
                          <span>Rotate API keys regularly and revoke unused keys</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-yellow-600">•</span>
                          <span>Use environment variables to store sensitive credentials</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-yellow-600">•</span>
                          <span>Monitor API usage and set up alerts for unusual activity</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Endpoints Tab */}
            {activeTab === "endpoints" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">API Endpoints</h2>
                  <p className="text-slate-700 mb-6 leading-relaxed">
                    All endpoints are accessed via https://api.docmetri.com and return JSON responses. 
                    Standard HTTP status codes indicate success or failure.
                  </p>
                </div>

                {endpoints.map((category, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className={`bg-${category.color}-50 border-b border-slate-200 p-4`}>
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg bg-${category.color}-100 flex items-center justify-center`}>
                          <category.icon className={`h-5 w-5 text-${category.color}-600`} />
                        </div>
                        <h3 className="font-bold text-slate-900 text-lg">{category.category}</h3>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-200">
                      {category.apis.map((api, apiIdx) => (
                        <div key={apiIdx} className="p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1">
                              <span className={`px-3 py-1 rounded font-mono text-xs font-bold ${
                                api.method === "GET" ? "bg-blue-100 text-blue-700" :
                                api.method === "POST" ? "bg-green-100 text-green-700" :
                                api.method === "PUT" ? "bg-yellow-100 text-yellow-700" :
                                "bg-red-100 text-red-700"
                              }`}>
                                {api.method}
                              </span>
                              <code className="font-mono text-sm text-slate-900">{api.path}</code>
                            </div>
                            <span className="text-sm text-slate-600">{api.description}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border-2 border-purple-200">
                  <h3 className="font-bold text-slate-900 mb-4">Example: Create Document</h3>
                  <div className="space-y-4">
                    <div className="flex gap-2 mb-4">
                      {(["curl", "javascript", "python", "php"] as const).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => setSelectedLanguage(lang)}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            selectedLanguage === lang
                              ? "bg-purple-600 text-white"
                              : "bg-white text-slate-700 hover:bg-purple-100"
                          }`}
                        >
                          {lang.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <div className="bg-slate-900 rounded-lg p-6 relative">
                      <button
                        onClick={() => copyToClipboard(codeExamples.createDocument[selectedLanguage], "create")}
                        className="absolute top-4 right-4 p-2 bg-slate-700 hover:bg-slate-600 rounded text-white transition-colors"
                      >
                        {copiedCode === "create" ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      <pre className="text-sm text-green-400 overflow-x-auto pr-12">
                        <code>{codeExamples.createDocument[selectedLanguage]}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Webhooks Tab */}
            {activeTab === "webhooks" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">Webhooks</h2>
                  <p className="text-slate-700 mb-6 leading-relaxed">
                    Webhooks allow you to receive real-time HTTP notifications when events occur in your 
                    DocMetri account. Configure webhook endpoints to receive POST requests with event data.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
                    <Webhook className="h-6 w-6 text-blue-600 mb-3" />
                    <h3 className="font-bold text-slate-900 mb-2">Setup Webhooks</h3>
                    <p className="text-sm text-slate-700 mb-4">
                      Add your endpoint URL and select which events to subscribe to. We'll send a POST 
                      request with event data whenever it occurs.
                    </p>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                      Configure Webhooks
                    </button>
                  </div>

                  <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200">
                    <Shield className="h-6 w-6 text-green-600 mb-3" />
                    <h3 className="font-bold text-slate-900 mb-2">Webhook Security</h3>
                    <p className="text-sm text-slate-700 mb-4">
                      All webhook requests include an HMAC signature header for verification. Validate 
                      the signature to ensure requests are from DocMetri.
                    </p>
                    <a href="#" className="text-sm font-medium text-green-600 hover:text-green-700 flex items-center gap-1">
                      Learn More <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 mb-4">Available Events</h3>
                  <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
                    {webhookEvents.map((webhook, idx) => (
                      <div key={idx} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <code className="font-mono text-sm font-semibold text-purple-600">{webhook.event}</code>
                            <p className="text-sm text-slate-600 mt-1">{webhook.description}</p>
                          </div>
                          <Play className="h-4 w-4 text-slate-400 flex-shrink-0 mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 mb-4">Example Webhook Payload</h3>
                  <div className="bg-slate-900 rounded-lg p-6 relative">
                    <button
                      onClick={() => copyToClipboard(`{
  "event": "document.viewed",
  "timestamp": "2025-10-29T14:32:00Z",
  "data": {
    "document_id": "doc_12345",
    "document_title": "Q4 Sales Proposal",
    "visitor": {
      "id": "vis_67890",
      "email": "prospect@company.com",
      "location": "San Francisco, CA",
      "device": "Desktop"
    },
    "engagement_score": 85,
    "time_spent": 342,
    "pages_viewed": [1, 2, 3, 5, 8]
  }
}`, "webhook")}
                      className="absolute top-4 right-4 p-2 bg-slate-700 hover:bg-slate-600 rounded text-white transition-colors"
                    >
                      {copiedCode === "webhook" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    <pre className="text-sm text-green-400 overflow-x-auto pr-12">
                      <code>{`{
  "event": "document.viewed",
  "timestamp": "2025-10-29T14:32:00Z",
  "data": {
    "document_id": "doc_12345",
    "document_title": "Q4 Sales Proposal",
    "visitor": {
      "id": "vis_67890",
      "email": "prospect@company.com",
      "location": "San Francisco, CA",
      "device": "Desktop"
    },
    "engagement_score": 85,
    "time_spent": 342,
    "pages_viewed": [1, 2, 3, 5, 8]
  }
}`}</code>
                    </pre>
                  </div>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-slate-900 mb-2">Webhook Best Practices</h4>
                      <ul className="space-y-2 text-sm text-slate-700">
                        <li className="flex items-start gap-2">
                          <span className="text-yellow-600">•</span>
                          <span>Respond with a 200 status code within 5 seconds to acknowledge receipt</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-yellow-600">•</span>
                          <span>Process webhook data asynchronously to avoid timeouts</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-yellow-600">•</span>
                          <span>Implement retry logic for failed webhook processing</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-yellow-600">•</span>
                          <span>Use HTTPS endpoints with valid SSL certificates</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SDKs & Libraries */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">
            Official SDKs & Libraries
          </h2>
          <p className="text-slate-600 text-center mb-8 max-w-2xl mx-auto">
            Use our official libraries to integrate DocMetri into your application faster.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "JavaScript/Node.js", icon: "📦", npm: "npm install docmetri", color: "yellow" },
              { name: "Python", icon: "🐍", npm: "pip install docmetri", color: "blue" },
              { name: "PHP", icon: "🐘", npm: "composer require docmetri/sdk", color: "purple" },
              { name: "Ruby", icon: "💎", npm: "gem install docmetri", color: "red" }
            ].map((sdk, idx) => (
              <div key={idx} className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-purple-300 hover:shadow-lg transition-all">
                <div className="text-4xl mb-3">{sdk.icon}</div>
                <h3 className="font-bold text-slate-900 mb-2">{sdk.name}</h3>
                <div className="bg-slate-900 rounded p-2 mb-3">
                  <code className="text-xs text-green-400">{sdk.npm}</code>
                </div>
                <a href="#" className="text-sm font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1">
                  View Docs <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Rate Limits */}
        <div className="mb-12">
          <div className="bg-white rounded-xl border-2 border-slate-200 p-8">
            <div className="flex items-start gap-4 mb-6">
              <Clock className="h-8 w-8 text-orange-600 flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Rate Limits</h2>
                <p className="text-slate-700">
                  To ensure fair usage and system stability, API requests are rate-limited based on your plan.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                <div className="text-2xl font-bold text-slate-900 mb-1">1,000/hour</div>
                <div className="text-sm text-slate-600 mb-3">Free Plan</div>
                <div className="text-xs text-slate-500">~17 requests per minute</div>
              </div>

              <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
                <div className="text-2xl font-bold text-blue-600 mb-1">10,000/hour</div>
                <div className="text-sm text-slate-900 font-semibold mb-3">Pro Plan</div>
                <div className="text-xs text-slate-600">~167 requests per minute</div>
              </div>

              <div className="bg-purple-50 rounded-lg p-6 border-2 border-purple-200">
                <div className="text-2xl font-bold text-purple-600 mb-1">Custom</div>
                <div className="text-sm text-slate-900 font-semibold mb-3">Enterprise</div>
                <div className="text-xs text-slate-600">Contact us for higher limits</div>
              </div>
            </div>

            <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-slate-700">
                <strong>Rate limit headers:</strong> Every API response includes <code className="bg-white px-2 py-0.5 rounded text-xs">X-RateLimit-Limit</code>, 
                <code className="bg-white px-2 py-0.5 rounded text-xs mx-1">X-RateLimit-Remaining</code>, and 
                <code className="bg-white px-2 py-0.5 rounded text-xs ml-1">X-RateLimit-Reset</code> headers to help you manage your usage.
              </p>
            </div>
          </div>
        </div>

        {/* Response Codes */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-8">
            HTTP Response Codes
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden">
              <div className="bg-green-50 border-b border-slate-200 p-4">
                <h3 className="font-bold text-slate-900">Success Codes</h3>
              </div>
              <div className="divide-y divide-slate-200">
                <div className="p-4 flex items-center gap-3">
                  <span className="font-mono font-bold text-green-600 text-sm w-12">200</span>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">OK</div>
                    <div className="text-xs text-slate-600">Request succeeded</div>
                  </div>
                </div>
                <div className="p-4 flex items-center gap-3">
                  <span className="font-mono font-bold text-green-600 text-sm w-12">201</span>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">Created</div>
                    <div className="text-xs text-slate-600">Resource created successfully</div>
                  </div>
                </div>
                <div className="p-4 flex items-center gap-3">
                  <span className="font-mono font-bold text-green-600 text-sm w-12">204</span>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">No Content</div>
                    <div className="text-xs text-slate-600">Request succeeded, no content returned</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden">
              <div className="bg-red-50 border-b border-slate-200 p-4">
                <h3 className="font-bold text-slate-900">Error Codes</h3>
              </div>
              <div className="divide-y divide-slate-200">
                <div className="p-4 flex items-center gap-3">
                  <span className="font-mono font-bold text-red-600 text-sm w-12">400</span>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">Bad Request</div>
                    <div className="text-xs text-slate-600">Invalid request parameters</div>
                  </div>
                </div>
                <div className="p-4 flex items-center gap-3">
                  <span className="font-mono font-bold text-red-600 text-sm w-12">401</span>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">Unauthorized</div>
                    <div className="text-xs text-slate-600">Invalid or missing API key</div>
                  </div>
                </div>
                <div className="p-4 flex items-center gap-3">
                  <span className="font-mono font-bold text-red-600 text-sm w-12">404</span>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">Not Found</div>
                    <div className="text-xs text-slate-600">Resource does not exist</div>
                  </div>
                </div>
                <div className="p-4 flex items-center gap-3">
                  <span className="font-mono font-bold text-red-600 text-sm w-12">429</span>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">Too Many Requests</div>
                    <div className="text-xs text-slate-600">Rate limit exceeded</div>
                  </div>
                </div>
                <div className="p-4 flex items-center gap-3">
                  <span className="font-mono font-bold text-red-600 text-sm w-12">500</span>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">Server Error</div>
                    <div className="text-xs text-slate-600">Internal server error</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Support & Resources */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-8">
            Developer Resources
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-purple-300 hover:shadow-lg transition-all">
              <Book className="h-8 w-8 text-blue-600 mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">API Reference</h3>
              <p className="text-sm text-slate-600 mb-4">
                Complete reference documentation for all endpoints, parameters, and response formats.
              </p>
              <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View Reference <ChevronRight className="h-4 w-4" />
              </a>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-purple-300 hover:shadow-lg transition-all">
              <Terminal className="h-8 w-8 text-green-600 mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Code Examples</h3>
              <p className="text-sm text-slate-600 mb-4">
                Browse ready-to-use code samples and integration guides for common use cases.
              </p>
              <a href="#" className="text-sm font-semibold text-green-600 hover:text-green-700 flex items-center gap-1">
                Browse Examples <ChevronRight className="h-4 w-4" />
              </a>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-purple-300 hover:shadow-lg transition-all">
              <Users className="h-8 w-8 text-purple-600 mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Developer Community</h3>
              <p className="text-sm text-slate-600 mb-4">
                Join our Discord community to get help, share feedback, and connect with other developers.
              </p>
              <a href="#" className="text-sm font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1">
                Join Community <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Changelog */}
        <div className="mb-12">
          <div className="bg-white rounded-xl border-2 border-slate-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="h-6 w-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-slate-900">API Changelog</h2>
            </div>

            <div className="space-y-6">
              <div className="border-l-4 border-green-500 pl-6 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">NEW</span>
                  <span className="text-sm text-slate-500">October 15, 2025</span>
                </div>
                <h4 className="font-bold text-slate-900 mb-1">Webhook Retry Logic</h4>
                <p className="text-sm text-slate-600">
                  Added automatic retry with exponential backoff for failed webhook deliveries. 
                  View retry history in your dashboard.
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-6 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">IMPROVED</span>
                  <span className="text-sm text-slate-500">September 28, 2025</span>
                </div>
                <h4 className="font-bold text-slate-900 mb-1">Analytics API Performance</h4>
                <p className="text-sm text-slate-600">
                  Reduced response times by 60% for analytics endpoints with pagination support 
                  for large datasets.
                </p>
              </div>

              <div className="border-l-4 border-purple-500 pl-6 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">FEATURE</span>
                  <span className="text-sm text-slate-500">August 12, 2025</span>
                </div>
                <h4 className="font-bold text-slate-900 mb-1">Batch Operations</h4>
                <p className="text-sm text-slate-600">
                  New batch endpoints allow you to create, update, or delete up to 100 documents 
                  in a single API call.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200">
              <a href="#" className="text-sm font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1">
                View Full Changelog <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
            <Code className="h-16 w-16 mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Start Building with DocMetri API
            </h2>
            <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
              Get your API key and start integrating document analytics into your application. 
              Free tier includes 1,000 requests per hour—no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition-colors shadow-lg"
                aria-label="Get your API key"
              >
                Get API Key
              </button>
              <button 
                className="bg-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-800 transition-colors border-2 border-white"
                aria-label="View API playground"
              >
                Try API Playground
              </button>
            </div>
            <p className="text-sm text-blue-200 mt-6">
              Free forever for development • Upgrade anytime • 24/7 developer support
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-12 border-t text-center text-sm text-slate-600">
          <p>© 2025 DocMetri. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4">
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-blue-600 transition-colors">API Status</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Contact</a>
          </div>
        </footer>
      </div>
    </div>
  );
}