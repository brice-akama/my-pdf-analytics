import { NextRequest, NextResponse } from "next/server"
import { verifyUserFromRequest } from '@/lib/auth'
import Handlebars from "handlebars"
import { ObjectId } from 'mongodb'
import { dbPromise } from "../../lib/mongodb"
import cloudinary from "../../lib/cloudinary"

export async function POST(request: NextRequest) {
  try {
    // ✅ Extract token but don't require it initially
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.split(" ")[1]
    const user = await verifyUserFromRequest(token ?? null).catch(() => null)

    const body = await request.json()
    const { templateId, data } = body

    const db = await dbPromise
    const templatesCollection = db.collection('templates')
    const generatedDocsCollection = db.collection('generated_documents')

    // ✅ Get template
    const template = await templatesCollection.findOne({ _id: new ObjectId(templateId) })
    if (!template) {
      return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 })
    }

    // ✅ Check access permissions
    const isPublic = template.isPublic === true
    const isOwner = user && template.createdBy === user.id

    if (!isPublic && !isOwner) {
      return NextResponse.json(
        { success: false, error: "Access denied. This template is private." }, 
        { status: 403 }
      )
    }

    // ✅ Calculate totals for invoice templates
    let processedData = { ...data }
    if (data.items && Array.isArray(data.items)) {
      let subtotal = 0
      data.items.forEach((item: any) => {
        subtotal += parseFloat(item.amount || 0)
      })
      
      const taxRate = parseFloat(data.taxRate || 0)
      const discount = parseFloat(data.discount || 0)
      const tax = (subtotal * taxRate) / 100
      const discountAmount = (subtotal * discount) / 100
      const total = subtotal + tax - discountAmount

      processedData = {
        ...data,
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        discountAmount: discountAmount.toFixed(2),
        total: total.toFixed(2)
      }
    }

    // ✅ Register Handlebars helpers
    registerHandlebarsHelpers()

    // ✅ Compile HTML template with Handlebars
    const compiledTemplate = Handlebars.compile(template.htmlTemplate)
    const html = compiledTemplate(processedData)

    // ✅ Generate PDF using Puppeteer
    const pdfBuffer = await generatePDFFromHTML(html, template.cssTemplate)

    // ✅ If user is authenticated, upload to Cloudinary and save record
    if (user) {
      const fileName = `${Date.now()}-${template.name.replace(/\s+/g, '-')}.pdf`
      
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `docmetrics/generated-docs/${user.id}`,
            resource_type: 'raw',
            public_id: fileName,
            format: 'pdf'
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        )
        uploadStream.end(pdfBuffer)
      })

      const pdfUrl = uploadResult.secure_url

      // ✅ Save generated document record
      const generatedDoc = await generatedDocsCollection.insertOne({
        userId: user.id,
        templateId: template._id.toString(),
        templateName: template.name,
        data: processedData,
        pdfUrl,
        cloudinaryPublicId: uploadResult.public_id,
        createdAt: new Date()
      })

      // ✅ Increment template download count
      await templatesCollection.updateOne(
        { _id: new ObjectId(templateId) },
        { $inc: { downloads: 1 } }
      )

      return NextResponse.json({
        success: true,
        document: {
          _id: generatedDoc.insertedId.toString(),
          templateName: template.name,
          pdfUrl,
          createdAt: new Date()
        },
        pdfUrl
      })
    } else {
      // ✅ For unauthenticated users, return PDF as base64 for download
      // (No cloud storage or history tracking)
      const pdfBase64 = pdfBuffer.toString('base64')

      // ✅ Still increment download count for public templates
      await templatesCollection.updateOne(
        { _id: new ObjectId(templateId) },
        { $inc: { downloads: 1 } }
      )

      return NextResponse.json({
        success: true,
        document: {
          templateName: template.name,
          pdfBase64,
          createdAt: new Date()
        },
        message: "PDF generated successfully. Sign in to save documents to your account.",
        requiresAuth: false
      })
    }
  } catch (error) {
    console.error("Generate document error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to generate document" },
      { status: 500 }
    )
  }
}

// ✅ Register Handlebars helpers for template logic
function registerHandlebarsHelpers() {
  // Helper for incrementing index (for table row numbers)
  Handlebars.registerHelper('increment', function(value) {
    return parseInt(value) + 1
  })

  // Helper for conditional rendering
  Handlebars.registerHelper('eq', function(a, b) {
    return a === b
  })

  // Helper for checking if value exists
  Handlebars.registerHelper('exists', function(value) {
    return value !== null && value !== undefined && value !== ''
  })
}

// ✅ Helper function to generate PDF from HTML
async function generatePDFFromHTML(html: string, css?: string): Promise<Buffer> {
  const puppeteer = require('puppeteer')
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  const page = await browser.newPage()
  
  const styledHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @page { margin: 0; size: A4; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
            padding: 40px 50px;
            color: #1e293b;
            line-height: 1.6;
            font-size: 14px;
          }
          h1 { color: #1e40af; margin-bottom: 10px; font-size: 32px; font-weight: 700; }
          h2 { color: #3730a3; margin-top: 30px; margin-bottom: 15px; font-size: 20px; font-weight: 600; }
          h3 { color: #475569; font-size: 16px; font-weight: 600; margin-bottom: 10px; }
          p { margin: 8px 0; color: #475569; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #e2e8f0; padding: 12px 16px; text-align: left; }
          th { background-color: #3730a3; color: white; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .info-box {
            background-color: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .total-section {
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            border: 2px solid #3b82f6;
            border-radius: 8px;
            padding: 25px;
            text-align: center;
            margin: 30px 0;
          }
          .footer {
            margin-top: 60px;
            padding-top: 25px;
            border-top: 2px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 11px;
          }
          ${css || ''}
        </style>
      </head>
      <body>
        ${html}
        <div class="footer">
          <p><strong>Generated by DocMetrics</strong> - Professional Document Management System</p>
          <p>Created on: ${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', month: 'long', day: 'numeric' 
          })}</p>
        </div>
      </body>
    </html>
  `
  
  await page.setContent(styledHTML, { waitUntil: 'networkidle0' })
  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true })
  await browser.close()
  
  return Buffer.from(pdfBuffer)
}