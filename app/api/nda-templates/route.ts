// app/api/nda-templates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// ✅ GET - List user's NDA templates
export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;
    
    // Get user's templates + system default
    const templates = await db.collection('nda_templates')
      .find({
        $or: [
          { userId: user.id },
          { isSystemDefault: true }
        ]
      })
      .sort({ isDefault: -1, createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      templates: templates.map(t => ({
        id: t._id.toString(),
        name: t.name,
        isDefault: t.isDefault,
        isSystemDefault: t.isSystemDefault,
        template: t.template,
        variables: t.variables,
        version: t.version,
        usageCount: t.usageCount || 0,
        createdAt: t.createdAt,
      })),
    });

  } catch (error) {
    console.error('❌ Fetch NDA templates error:', error);
    return NextResponse.json({
      error: 'Failed to fetch templates',
    }, { status: 500 });
  }
}

// ✅ POST - Create new NDA template
export async function POST(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, template, setAsDefault } = body;

    if (!name || !template) {
      return NextResponse.json({
        error: 'Name and template are required',
      }, { status: 400 });
    }

    // Extract variables from template
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables = [...new Set(
      Array.from(template.matchAll(variableRegex), (m: RegExpExecArray) => m[1].trim())
    )];

    const db = await dbPromise;

    // If setting as default, unset other defaults
    if (setAsDefault) {
      await db.collection('nda_templates').updateMany(
        { userId: user.id, isDefault: true },
        { $set: { isDefault: false } }
      );
    }

    // Create template
    const result = await db.collection('nda_templates').insertOne({
      userId: user.id,
      name,
      template,
      variables,
      isDefault: setAsDefault || false,
      isSystemDefault: false,
      version: '1.0',
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      template: {
        id: result.insertedId.toString(),
        name,
        isDefault: setAsDefault || false,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Create NDA template error:', error);
    return NextResponse.json({
      error: 'Failed to create template',
    }, { status: 500 });
  }
}