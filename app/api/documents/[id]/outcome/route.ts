// app/api/documents/[id]/outcome/route.ts
// ── Record whether a deal closed or was lost ───────────────────────
// Called from DealLevelSummary.tsx when a rep marks an outcome.
// This is the data-capture layer for eventual back-testing:
// matching DocMetrics signals against real deal outcomes.
// Silent failure — never crashes the app, never blocks the UI.

import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { checkAccess } from '@/lib/checkAccess';
import { ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const access = await checkAccess(request);
    if (!access.ok) return access.response;

    const body = await request.json();
    const { outcome } = body;

    // Only accept valid outcome values — anything else is ignored
    if (outcome !== 'won' && outcome !== 'lost' && outcome !== null) {
      return NextResponse.json(
        { error: 'outcome must be won, lost, or null' },
        { status: 400 }
      );
    }

    const db = await dbPromise;

    // Verify the document belongs to this user before updating
    const document = await db.collection('documents').findOne({
      _id: new ObjectId(id),
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    if (document.userId !== access.userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    await db.collection('documents').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          dealOutcome: outcome,
          dealOutcomeSetAt: outcome !== null ? new Date() : null,
          dealOutcomeSetBy: access.userId,
        },
      }
    );

    // ── Also snapshot the current DocMetrics signals alongside ────
    // the outcome, so back-testing can correlate them later without
    // having to reconstruct what the signals were at outcome time.
    // Stored separately so it never pollutes the live document record.
    if (outcome !== null) {
      await db.collection('deal_outcome_snapshots').insertOne({
        documentId: id,
        userId: access.userId,
        outcome,
        recordedAt: new Date(),
        // These will be populated by the analytics route later —
        // for now just record the outcome and timestamp.
        // The analytics route can join on documentId when running
        // back-testing queries.
        signalSnapshotPending: true,
      }).catch(err =>
        // Never crash if snapshot collection fails
        console.error('[DealOutcome] snapshot insert failed silently:', err)
      );
    }

    return NextResponse.json({ success: true, outcome });

  } catch (error) {
    // Silent failure — log but never crash the UI
    console.error('[DealOutcome] outer error:', error);
    return NextResponse.json(
      { error: 'Failed to record outcome' },
      { status: 500 }
    );
  }
}

// ── GET — read the current outcome for a document ─────────────────
// Used later by DealLevelSummary.tsx to show current state
// and by back-testing queries to filter documents with outcomes.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const access = await checkAccess(request);
    if (!access.ok) return access.response;

    const db = await dbPromise;

    const document = await db.collection('documents').findOne(
      { _id: new ObjectId(id) },
      { projection: { dealOutcome: 1, dealOutcomeSetAt: 1 } }
    );

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      outcome: document.dealOutcome ?? null,
      setAt: document.dealOutcomeSetAt ?? null,
    });

  } catch (error) {
    console.error('[DealOutcome] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch outcome' },
      { status: 500 }
    );
  }
}