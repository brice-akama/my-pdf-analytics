'use client';

import React from 'react';
import { TrendingUp, Users, Clock, AlertCircle } from 'lucide-react';

type Priority = {
  documentId: string;
  documentName: string;
  priorityScore: number;
  priorityReason: string;
  priorityAction: string;
  committeeSize: number;
  committeeGrowing: boolean;
  daysSinceLast: number;
  totalSessions: number;
  lastActivity: string;
};

type Props = {
  priorities: Priority[];
  onDocumentClick: (documentId: string) => void;
};

function getPriorityColor(score: number): string {
  if (score >= 85) return 'border-l-red-500 bg-red-50';
  if (score >= 65) return 'border-l-amber-500 bg-amber-50';
  if (score >= 45) return 'border-l-blue-500 bg-blue-50';
  return 'border-l-slate-300 bg-slate-50';
}

function getPriorityLabel(score: number): string {
  if (score >= 85) return 'Act today';
  if (score >= 65) return 'Follow up soon';
  if (score >= 45) return 'Monitor';
  return 'Low priority';
}

function getPriorityLabelColor(score: number): string {
  if (score >= 85) return 'text-red-700 bg-red-100';
  if (score >= 65) return 'text-amber-700 bg-amber-100';
  if (score >= 45) return 'text-blue-700 bg-blue-100';
  return 'text-slate-500 bg-slate-100';
}

export function DailyPriorityList({ priorities, onDocumentClick }: Props) {
  if (!priorities || priorities.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          
          <p className="text-xs text-slate-400 mt-0.5">
            Ranked by deal momentum and urgency
          </p>
        </div>
        <span className="text-[11px] text-slate-400">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </span>
      </div>

      <div className="space-y-2">
        {priorities.map((item, index) => (
          <button
            key={item.documentId}
            onClick={() => onDocumentClick(item.documentId)}
            className={`w-full text-left p-4 rounded-xl border-l-4 border border-slate-100 transition-all hover:shadow-md ${getPriorityColor(item.priorityScore)}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <span className="text-[11px] font-black text-slate-400 mt-0.5 w-4 flex-shrink-0">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {item.documentName}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {item.priorityReason}
                  </p>
                  <p className="text-xs font-medium text-slate-700 mt-1.5 flex items-start gap-1">
                    <span className="text-slate-400 flex-shrink-0">→</span>
                    {item.priorityAction}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getPriorityLabelColor(item.priorityScore)}`}>
                  {getPriorityLabel(item.priorityScore)}
                </span>
                <div className="flex items-center gap-2">
                  {item.committeeGrowing && (
                    <span className="flex items-center gap-1 text-[10px] text-blue-600">
                      <Users className="h-2.5 w-2.5" />
                      {item.committeeSize}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Clock className="h-2.5 w-2.5" />
                    {item.daysSinceLast === 0 ? 'today' : item.daysSinceLast > 0 ? `${item.daysSinceLast}d ago` : 'recently'}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <p className="text-[11px] text-slate-400 text-center pt-1">
        Based on document engagement signals only. Your relationship context should inform final decisions.
      </p>
    </div>
  );
}