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
    const params = context.params instanceof Promise ? await context.params : context.params;
    const spaceId = params.id;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'all';
    const limit = parseInt(searchParams.get('limit') || '200');

    const user = await verifyUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await dbPromise;

    const space = await db.collection('spaces').findOne({ _id: new ObjectId(spaceId) });
    if (!space) return NextResponse.json({ error: 'Space not found' }, { status: 404 });

    const isOwner = space.userId === user.id;
    const isMember = space.members?.some(
      (m: any) => m.email === user.email || m.userId === user.id
    );
    if (!isOwner && !isMember) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    // ── 1. Raw activity logs ───────────────────────────────────────────────
    const rawLogs = await db.collection('activityLogs')
      .find({ spaceId: new ObjectId(spaceId) })
      .sort({ timestamp: -1 })
      .limit(1000)
      .toArray();

    // ── 2. Normalize activity logs ─────────────────────────────────────────
    const EVENT_MAP: Record<string, { category: string; icon: string; label: (log: any) => string }> = {
      // Documents
      document_view:      { category: 'documents', icon: '👁️', label: l => `${l.visitorEmail || 'Anonymous'} viewed "${l.documentName || 'a document'}"` },
      document_viewed:    { category: 'documents', icon: '👁️', label: l => `${l.visitorEmail || 'Anonymous'} viewed "${l.documentName || 'a document'}"` },
      view:               { category: 'documents', icon: '👁️', label: l => `${l.visitorEmail || 'Anonymous'} viewed "${l.documentName || 'a document'}"` },
      download:           { category: 'documents', icon: '⬇️', label: l => `${l.visitorEmail || 'Anonymous'} downloaded "${l.documentName || 'a document'}"` },
      file_download:      { category: 'documents', icon: '⬇️', label: l => `${l.visitorEmail || 'Anonymous'} downloaded "${l.documentName || 'a document'}"` },
      document_download:  { category: 'documents', icon: '⬇️', label: l => `${l.visitorEmail || 'Anonymous'} downloaded "${l.documentName || 'a document'}"` },
      document_uploaded:  { category: 'documents', icon: '📤', label: l => `${l.performedBy || 'Owner'} uploaded "${l.documentName || 'a file'}"` },
      document_deleted:   { category: 'documents', icon: '🗑️', label: l => `${l.performedBy || 'Owner'} deleted "${l.documentName || 'a document'}"` },
      document_restored:  { category: 'documents', icon: '♻️', label: l => `${l.performedBy || 'Owner'} restored "${l.documentName || 'a document'}"` },
      document_renamed:   { category: 'documents', icon: '✏️', label: l => `${l.performedBy || 'Owner'} renamed a document` },
      document_moved:     { category: 'documents', icon: '📁', label: l => `${l.performedBy || 'Owner'} moved "${l.documentName || 'a document'}"` },
      folder_created:     { category: 'documents', icon: '📂', label: l => `${l.performedBy || 'Owner'} created folder "${l.meta?.folderName || ''}"` },
      // Members
      member_added:       { category: 'members',   icon: '👤', label: l => `${l.meta?.email || 'Someone'} added as ${l.meta?.role || 'viewer'}` },
      member_removed:     { category: 'members',   icon: '👋', label: l => `${l.meta?.email || 'Someone'} was removed from the space` },
      member_role_changed:{ category: 'members',   icon: '🔄', label: l => `${l.meta?.email || 'Someone'} role changed to ${l.meta?.newRole || ''}` },
      // Share Links
      share_link_created: { category: 'links',     icon: '🔗', label: l => `Share link created${l.meta?.label ? ` — "${l.meta.label}"` : ''} (${l.meta?.securityLevel || 'open'})` },
      share_link_disabled:{ category: 'links',     icon: '🚫', label: l => `Share link disabled${l.meta?.scope === 'all_links' ? ' — all links' : ''}` },
      share_link_enabled: { category: 'links',     icon: '✅', label: l => `Share link re-enabled` },
      share_link_updated: { category: 'links',     icon: '✏️', label: l => `Share link settings updated` },
      // Visitors
      portal_enter:       { category: 'visitors',  icon: '🚪', label: l => `${l.visitorEmail || 'Anonymous'} opened the portal` },
      portal_opened:      { category: 'visitors',  icon: '🚪', label: l => `${l.visitorEmail || 'Anonymous'} opened the portal` },
      space_open:         { category: 'visitors',  icon: '🚪', label: l => `${l.visitorEmail || 'Anonymous'} opened the portal` },
      question_asked:     { category: 'visitors',  icon: '💬', label: l => `${l.visitorEmail || 'Anonymous'} asked a question` },
      nda_signed:         { category: 'visitors',  icon: '✍️', label: l => `${l.visitorEmail || 'Anonymous'} signed the NDA` },
      // Settings
      space_created:      { category: 'settings',  icon: '✨', label: l => `Space "${space.name}" was created` },
      settings_updated:   { category: 'settings',  icon: '⚙️', label: l => `Space settings were updated by ${l.performedBy || 'owner'}` },
      nda_enabled:        { category: 'settings',  icon: '📋', label: l => `NDA requirement was enabled` },
      nda_disabled:       { category: 'settings',  icon: '📋', label: l => `NDA requirement was disabled` },
      branding_updated:   { category: 'settings',  icon: '🎨', label: l => `Space branding updated by ${l.performedBy || 'owner'}` },
      downloads_toggled:  { category: 'settings',  icon: '🔒', label: l => `Downloads ${l.meta?.allowed ? 'enabled' : 'disabled'} by ${l.performedBy || 'owner'}` },
    };

    const normalizedLogs = rawLogs.map((log: any) => {
      const mapping = EVENT_MAP[log.event];
      const cat = mapping?.category || 'visitors';
      const icon = mapping?.icon || '📌';
      const detail = mapping ? mapping.label(log) : `${log.visitorEmail || log.performedBy || 'Unknown'} — ${log.event}`;

      return {
        id:           log._id.toString(),
        category:     cat,
        event:        log.event,
        actor:        log.visitorEmail || log.performedBy || null,
        actorType:    log.visitorEmail ? 'visitor' : 'owner',
        target:       log.documentName || null,
        detail,
        icon,
        timestamp:    log.timestamp,
        ipAddress:    log.ipAddress || null,
        shareLink:    log.shareLink || null,
        documentName: log.documentName || null,
        documentId:   log.documentId?.toString() || null,
        meta:         log.meta || {}
      };
    });

    // ── 3. Backfill: share links that existed BEFORE audit logging ─────────
    // Any publicAccess entry that has no corresponding activityLog gets
    // a synthetic "created" event using its createdAt timestamp
    const publicAccessList: any[] = Array.isArray(space.publicAccess)
      ? space.publicAccess
      : space.publicAccess ? [space.publicAccess] : [];

    const loggedShareLinks = new Set(
      rawLogs
        .filter((l: any) => l.event === 'share_link_created')
        .map((l: any) => l.shareLink)
    );

    const backfilledLinkEvents = publicAccessList
      .filter((pa: any) => pa.shareLink && !loggedShareLinks.has(pa.shareLink))
      .map((pa: any) => ({
        id:           `backfill-link-${pa.shareLink}`,
        category:     'links',
        event:        'share_link_created',
        actor:        null,
        actorType:    'owner',
        target:       null,
        detail:       `Share link created${pa.label ? ` — "${pa.label}"` : ''} (${pa.securityLevel || 'open'})`,
        icon:         '🔗',
        timestamp:    pa.createdAt || space.createdAt,
        ipAddress:    null,
        shareLink:    pa.shareLink,
        documentName: null,
        documentId:   null,
        meta: {
          label:         pa.label || null,
          securityLevel: pa.securityLevel || 'open',
          publicUrl:     pa.publicUrl || null,
          backfilled:    true,
        }
      }));

    // ── 4. Backfill: members added BEFORE audit logging ────────────────────
    const loggedMemberEmails = new Set(
      rawLogs
        .filter((l: any) => l.event === 'member_added')
        .map((l: any) => l.meta?.email)
    );

    const backfilledMemberEvents = (space.members || [])
      .filter((m: any) => m.email && !loggedMemberEmails.has(m.email))
      .map((m: any) => ({
        id:           `backfill-member-${m.email}`,
        category:     'members',
        event:        'member_added',
        actor:        m.addedBy || space.userId,
        actorType:    'owner',
        target:       m.email,
        detail:       `${m.email} added as ${m.role || 'viewer'}`,
        icon:         '👤',
        timestamp:    m.addedAt || space.createdAt,
        ipAddress:    null,
        shareLink:    null,
        documentName: null,
        documentId:   null,
        meta: {
          email:      m.email,
          role:       m.role || 'viewer',
          backfilled: true,
        }
      }));

    // ── 5. Backfill: space_created event ──────────────────────────────────
    const hasSpaceCreatedLog = rawLogs.some((l: any) => l.event === 'space_created');
    const backfilledSpaceCreated = !hasSpaceCreatedLog ? [{
      id:           `backfill-space-created-${spaceId}`,
      category:     'settings',
      event:        'space_created',
      actor:        null,
      actorType:    'owner',
      target:       null,
      detail:       `Space "${space.name}" was created`,
      icon:         '✨',
      timestamp:    space.createdAt,
      ipAddress:    null,
      shareLink:    null,
      documentName: null,
      documentId:   null,
      meta:         { backfilled: true }
    }] : [];

    // ── 6. Merge + sort all events ─────────────────────────────────────────
    const allEvents = [
      ...normalizedLogs,
      ...backfilledLinkEvents,
      ...backfilledMemberEvents,
      ...backfilledSpaceCreated,
    ].sort((a: any, b: any) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // ── 7. Filter by category ──────────────────────────────────────────────
    const filtered = category === 'all'
      ? allEvents
      : allEvents.filter((e: any) => e.category === category);

    const paginated = filtered.slice(0, limit);

    // ── 8. Summary counts ──────────────────────────────────────────────────
    const summary = {
      total:     allEvents.length,
      documents: allEvents.filter(e => e.category === 'documents').length,
      members:   allEvents.filter(e => e.category === 'members').length,
      links:     allEvents.filter(e => e.category === 'links').length,
      visitors:  allEvents.filter(e => e.category === 'visitors').length,
      settings:  allEvents.filter(e => e.category === 'settings').length,
    };

    return NextResponse.json({
      success: true,
      events:  paginated,
      summary,
      total:   filtered.length
    });

  } catch (error) {
    console.error('❌ Audit log error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}