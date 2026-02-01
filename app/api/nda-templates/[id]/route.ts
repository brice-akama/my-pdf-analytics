// app/api/nda-templates/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// ✅ PATCH - Update NDA template
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { name, template, setAsDefault } = body;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid template ID' }, { status: 400 });
    }

    const db = await dbPromise;

    // Verify ownership
    const existing = await db.collection('nda_templates').findOne({
      _id: new ObjectId(id),
      userId: user.id,
    });

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Extract variables
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables = template ? [...new Set(
      Array.from(template.matchAll(variableRegex), (m: RegExpExecArray) => m[1].trim())
    )] : existing.variables;

    const updateFields: any = {
      updatedAt: new Date(),
    };

    if (name) updateFields.name = name;
    if (template) {
      updateFields.template = template;
      updateFields.variables = variables;
      updateFields.version = incrementVersion(existing.version);
    }
    if (setAsDefault !== undefined) {
      updateFields.isDefault = setAsDefault;
      
      if (setAsDefault) {
        await db.collection('nda_templates').updateMany(
          { userId: user.id, _id: { $ne: new ObjectId(id) } },
          { $set: { isDefault: false } }
        );
      }
    }

    await db.collection('nda_templates').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    return NextResponse.json({
      success: true,
      message: 'Template updated successfully',
    });

  } catch (error) {
    console.error('❌ Update NDA template error:', error);
    return NextResponse.json({
      error: 'Failed to update template',
    }, { status: 500 });
  }
}

// ✅ DELETE - Delete NDA template
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid template ID' }, { status: 400 });
    }

    const db = await dbPromise;

    const result = await db.collection('nda_templates').deleteOne({
      _id: new ObjectId(id),
      userId: user.id,
      isSystemDefault: { $ne: true }, // Can't delete system default
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({
        error: 'Template not found or cannot be deleted',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    });

  } catch (error) {
    console.error('❌ Delete NDA template error:', error);
    return NextResponse.json({
      error: 'Failed to delete template',
    }, { status: 500 });
  }
}

function incrementVersion(version: string): string {
  const parts = version.split('.');
  const minor = parseInt(parts[1] || '0') + 1;
  return `${parts[0]}.${minor}`;
}