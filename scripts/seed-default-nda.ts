// scripts/seed-default-nda.ts

// 1️⃣ Load env vars FIRST
import path from 'path';
import dotenv from 'dotenv';

const envPath = path.resolve(process.cwd(), '.env.local');
console.log('📁 Loading env from:', envPath);

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ Failed to load .env.local', result.error);
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI missing');
  process.exit(1);
}

console.log('✅ MONGODB_URI loaded\n');

// 2️⃣ Seed function
async function seedDefaultNDA() {
  try {
    // ✅ CRITICAL: dynamic import AFTER dotenv
    const { dbPromise } = await import('../app/api/lib/mongodb');

    const db = await dbPromise;

    const defaultNDA = {
      userId: 'system',
      name: 'Standard NDA Template',
      isSystemDefault: true,
      isDefault: false,
      template: `NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into as of {{view_date}} between:

DISCLOSING PARTY: {{owner_company}} ("Owner")
RECEIVING PARTY: {{viewer_name}} ({{viewer_email}}) ("Recipient")

SUBJECT MATTER: "{{document_title}}"

1. CONFIDENTIAL INFORMATION
The Recipient acknowledges the document contains confidential information.

2. OBLIGATIONS
The Recipient agrees not to disclose or misuse the information.

3. TERM
This Agreement lasts two (2) years from {{view_date}}.

4. ACCEPTANCE
By clicking "I Accept", the Recipient agrees to these terms.

Recipient: {{viewer_name}}
Date: {{view_date}}
`,
      variables: [
        'viewer_name',
        'viewer_email',
        'viewer_company',
        'document_title',
        'owner_name',
        'owner_company',
        'view_date',
      ],
      version: '1.0',
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('nda_templates').updateOne(
      { userId: 'system', isSystemDefault: true },
      { $set: defaultNDA },
      { upsert: true }
    );

    console.log('✅ Default NDA template seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

// 3️⃣ Run
seedDefaultNDA();