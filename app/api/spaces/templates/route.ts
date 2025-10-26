import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const templates = [
    {
      id: 'simple-data-room',
      name: 'Simple data room',
      description: 'Store and share sensitive files, and collaborate on due diligence requests.',
      icon: '📊',
      color: 'from-rose-400 to-rose-600',
      folders: [
        'Documents',
        'Financials',
        'Legal',
        'Presentations'
      ]
    },
    {
      id: 'client-portal',
      name: 'Client portal',
      description: 'Create a professional hub for projects, contracts, and more.',
      icon: '🎯',
      color: 'from-purple-500 to-purple-700',
      folders: [
        'Project Overview',
        'Deliverables',
        'Invoices',
        'Reports',
        'Resources'
      ]
    },
    {
      id: 'onboarding',
      name: 'Onboarding',
      description: 'Onboard clients and employees while keeping their private information secure.',
      icon: '👋',
      color: 'from-slate-400 to-slate-600',
      folders: [
        'Welcome Packet',
        'Forms',
        'Training Materials',
        'Policies'
      ]
    },
    {
      id: 'general-due-diligence',
      name: 'General due diligence',
      description: 'Simplify the diligence process across any sector with secure sharing.',
      icon: '🔍',
      color: 'from-slate-500 to-slate-700',
      folders: [
        'Company Information',
        'Financial Records',
        'Legal Documents',
        'Operations'
      ]
    },
    {
      id: 'ma-deal',
      name: 'M&A Deal Room',
      description: 'Organize due diligence documents for mergers and acquisitions',
      icon: '🤝',
      color: 'from-blue-500 to-blue-700',
      folders: [
        'Financial Statements',
        'Legal Documents',
        'Customer Contracts',
        'Employee Information',
        'Intellectual Property',
        'Tax Records'
      ]
    },
    {
      id: 'fundraising',
      name: 'Fundraising',
      description: 'Share pitch decks and financials with investors securely',
      icon: '💰',
      color: 'from-green-500 to-green-700',
      folders: [
        'Pitch Deck',
        'Financial Projections',
        'Cap Table',
        'Product Demo',
        'Market Research'
      ]
    },
    {
      id: 'real-estate',
      name: 'Real Estate',
      description: 'Property documents and transaction details in one place',
      icon: '🏠',
      color: 'from-orange-500 to-orange-700',
      folders: [
        'Property Photos',
        'Title Documents',
        'Inspection Reports',
        'Appraisals',
        'Zoning Information'
      ]
    },
    {
      id: 'board-meeting',
      name: 'Board Meeting',
      description: 'Board materials and meeting documents organized',
      icon: '📋',
      color: 'from-indigo-500 to-indigo-700',
      folders: [
        'Agenda',
        'Minutes',
        'Financial Reports',
        'Committee Reports',
        'Resolutions'
      ]
    },
    {
      id: 'legal-matter',
      name: 'Legal Matter',
      description: 'Case files and legal documentation management',
      icon: '⚖️',
      color: 'from-purple-600 to-purple-800',
      folders: [
        'Case Documents',
        'Evidence',
        'Correspondence',
        'Court Filings',
        'Contracts'
      ]
    },
    {
      id: 'hr-onboarding',
      name: 'HR Onboarding',
      description: 'New employee documents and resources',
      icon: '👥',
      color: 'from-pink-500 to-pink-700',
      folders: [
        'Welcome Packet',
        'Employee Handbook',
        'Tax Forms',
        'Benefits Information',
        'Training Materials'
      ]
    },
    {
      id: 'audit',
      name: 'Audit',
      description: 'Financial audit and compliance documents',
      icon: '📊',
      color: 'from-red-500 to-red-700',
      folders: [
        'Financial Statements',
        'Bank Statements',
        'Invoices',
        'Tax Returns',
        'Compliance Documents'
      ]
    },
    {
      id: 'blank',
      name: 'Blank Space',
      description: 'Start from scratch with an empty data room',
      icon: '📁',
      color: 'from-slate-600 to-slate-800',
      folders: []
    }
  ];

  return NextResponse.json({
    success: true,
    templates
  });
}