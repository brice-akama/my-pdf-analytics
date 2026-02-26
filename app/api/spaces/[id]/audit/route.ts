// app/api/spaces/[id]/audit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const params = context.params instanceof Promise
      ? await context.params
      : context.params;

    const spaceId = params.id;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'all'; // all | documents | members | links | settings
    const limit = parseInt(searchParams.get('limit') || '100');

    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;

    const space = await db.collection('spaces').findOne({
      _id: new ObjectId(spaceId)
    });

    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    const isOwner = space.userId === user.id;
    const isMember = space.members?.some(
      (m: any) => m.email === user.email || m.userId === user.id
    );

    if (!isOwner && !isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // ── 1. Fetch raw activity logs ─────────────────────────────────────────
    const rawLogs = await db.collection('activityLogs')
      .find({ spaceId: new ObjectId(spaceId) })
      .sort({ timestamp: -1 })
      .limit(500)
      .toArray();

    // ── 2. Fetch audit-specific logs (owner actions) ───────────────────────
    const auditLogs = await db.collection('auditLogs')
      .find({ spaceId: new ObjectId(spaceId) })
      .sort({ timestamp: -1 })
      .limit(500)
      .toArray();

    // ── 3. Synthesize member history from space.members ───────────────────
    const memberEvents = (space.members || []).map((m: any) => ({
      id: `member-${m.email}-${m.addedAt}`,
      category: 'members',
      event: 'member_added',
      actor: m.addedBy || space.userId,
      actorType: 'owner',
      target: m.email,
      detail: `${m.email} added as ${m.role}`,
      role: m.role,
      timestamp: m.addedAt || space.createdAt,
      ipAddress: null,
      shareLink: null,
      documentName: null,
      meta: { role: m.role, email: m.email }
    }));

    // ── 4. Normalize raw activity logs ────────────────────────────────────
    const normalizedLogs = rawLogs.map((log: any) => {
      let category = 'visitors';
      let detail = '';
      let icon = '👁️';

      switch (log.event) {
        case 'document_view':
        case 'document_viewed':
        case 'view':
          category = 'documents';
          detail = `${log.visitorEmail || 'Anonymous'} viewed "${log.documentName || 'a document'}"`;
          icon = '👁️';
          break;
        case 'download':
        case 'file_download':
        case 'document_download':
          category = 'documents';
          detail = `${log.visitorEmail || 'Anonymous'} downloaded "${log.documentName || 'a document'}"`;
          icon = '⬇️';
          break;
        case 'portal_enter':
        case 'portal_opened':
        case 'space_open':
          category = 'visitors';
          detail = `${log.visitorEmail || 'Anonymous'} opened the portal`;
          icon = '🚪';
          break;
        case 'question_asked':
          category = 'visitors';
          detail = `${log.visitorEmail || 'Anonymous'} asked a question`;
          icon = '💬';
          break;
        case 'nda_signed':
          category = 'settings';
          detail = `${log.visitorEmail || 'Anonymous'} signed the NDA`;
          icon = '✍️';
          break;
        case 'document_uploaded':
          category = 'documents';
          detail = `${log.performedBy || 'Owner'} uploaded "${log.documentName}"`;
          icon = '📤';
          break;
        case 'document_deleted':
          category = 'documents';
          detail = `${log.performedBy || 'Owner'} deleted "${log.documentName}"`;
          icon = '🗑️';
          break;
        case 'document_restored':
          category = 'documents';
          detail = `${log.performedBy || 'Owner'} restored "${log.documentName}"`;
          icon = '♻️';
          break;
        case 'document_renamed':
          category = 'documents';
          detail = `${log.performedBy || 'Owner'} renamed a document`;
          icon = '✏️';
          break;
        case 'document_moved':
          category = 'documents';
          detail = `${log.performedBy || 'Owner'} moved "${log.documentName}"`;
          icon = '📁';
          break;
        case 'share_link_created':
          category = 'links';
          detail = `Share link created: "${log.meta?.label || log.shareLink?.slice(0, 12) + '…'}" (${log.meta?.securityLevel || 'open'})`;
          icon = '🔗';
          break;
        case 'share_link_disabled':
          category = 'links';
          detail = `Share link disabled: "${log.meta?.label || log.shareLink?.slice(0, 12) + '…'}"`;
          icon = '🚫';
          break;
        case 'member_removed':
          category = 'members';
          detail = `${log.meta?.email} was removed from the space`;
          icon = '👋';
          break;
        case 'member_role_changed':
          category = 'members';
          detail = `${log.meta?.email} role changed to ${log.meta?.newRole}`;
          icon = '🔄';
          break;
        case 'space_created':
          category = 'settings';
          detail = `Space "${space.name}" was created`;
          icon = '✨';
          break;
        case 'settings_updated':
          category = 'settings';
          detail = `Space settings were updated`;
          icon = '⚙️';
          break;
        case 'nda_enabled':
          category = 'settings';
          detail = `NDA requirement was enabled`;
          icon = '📋';
          break;
        case 'folder_created':
          category = 'documents';
          detail = `${log.performedBy || 'Owner'} created folder "${log.meta?.folderName}"`;
          icon = '📂';
          break;
        default:
          category = 'visitors';
          detail = `${log.visitorEmail || log.performedBy || 'Unknown'} — ${log.event}`;
          icon = '📌';
      }

      return {
        id: log._id.toString(),
        category,
        event: log.event,
        actor: log.visitorEmail || log.performedBy || null,
        actorType: log.visitorEmail ? 'visitor' : 'owner',
        target: log.documentName || null,
        detail,
        icon,
        timestamp: log.timestamp,
        ipAddress: log.ipAddress || null,
        shareLink: log.shareLink || null,
        documentName: log.documentName || null,
        documentId: log.documentId?.toString() || null,
        meta: log.meta || {}
      };
    });

    // ── 5. Normalize audit logs (owner actions) ───────────────────────────
    const normalizedAuditLogs = auditLogs.map((log: any) => ({
      id: log._id.toString(),
      category: log.category || 'settings',
      event: log.event,
      actor: log.performedBy || null,
      actorType: 'owner',
      target: log.target || null,
      detail: log.detail || log.event,
      icon: log.icon || '⚙️',
      timestamp: log.timestamp,
      ipAddress: log.ipAddress || null,
      shareLink: log.shareLink || null,
      documentName: log.documentName || null,
      documentId: log.documentId?.toString() || null,
      meta: log.meta || {}
    }));

    // ── 6. Merge all events and sort by time ──────────────────────────────
    const allEvents = [
      ...normalizedLogs,
      ...normalizedAuditLogs,
      ...memberEvents,
    ].sort((a: any, b: any) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // ── 7. Filter by category ─────────────────────────────────────────────
    const filtered = category === 'all'
      ? allEvents
      : allEvents.filter((e: any) => e.category === category);

    const paginated = filtered.slice(0, limit);

    // ── 8. Summary counts per category ───────────────────────────────────
    const summary = {
      total: allEvents.length,
      documents: allEvents.filter(e => e.category === 'documents').length,
      members: allEvents.filter(e => e.category === 'members').length,
      links: allEvents.filter(e => e.category === 'links').length,
      visitors: allEvents.filter(e => e.category === 'visitors').length,
      settings: allEvents.filter(e => e.category === 'settings').length,
    };

    return NextResponse.json({
      success: true,
      events: paginated,
      summary,
      total: filtered.length
    });

  } catch (error) {
    console.error('❌ Audit log error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}