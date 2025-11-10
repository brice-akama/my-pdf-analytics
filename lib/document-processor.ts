// lib/document-processor.ts
import { PDFDocument } from 'pdf-lib';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import sharp from 'sharp';
import nlp from 'compromise';
import * as natural from 'natural';
import Anthropic from '@anthropic-ai/sdk';

// ✅ Import PDF.js dynamically (works in Node.js!)
let pdfjsLib: any = null;

// Lazy load PDF.js
async function getPdfJs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  }
  return pdfjsLib;
}

// ✅ Make AI optional
const anthropic = process.env.ANTHROPIC_API_KEY 
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// 🔄 Convert various formats to PDF
export async function convertToPdf(
  buffer: Buffer, 
  format: string, 
  filename: string
): Promise<Buffer> {
  try {
    switch (format) {
      case 'docx':
        return await convertDocxToPdf(buffer);
      
      case 'txt':
      case 'md':
      case 'html':
        return await convertTextToPdf(buffer, format);
      
      case 'xlsx':
      case 'xls':
        return await convertExcelToPdf(buffer);
      
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return await convertImageToPdf(buffer);
      
      default:
        throw new Error(`Conversion not supported for ${format}`);
    }
  } catch (error) {
    console.error('Conversion error:', error);
    throw new Error(`Failed to convert ${format} to PDF`);
  }
}

// DOCX → PDF
async function convertDocxToPdf(buffer: Buffer): Promise<Buffer> {
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value;
  
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  
  const fontSize = 12;
  const maxWidth = width - 100;
  const lines = wrapText(text, maxWidth, fontSize);
  
  let yPosition = height - 50;
  let currentPage = page;
  
  for (const line of lines) {
    if (yPosition < 50) {
      currentPage = pdfDoc.addPage();
      yPosition = currentPage.getSize().height - 50;
    }
    
    currentPage.drawText(line, {
      x: 50,
      y: yPosition,
      size: fontSize,
    });
    
    yPosition -= fontSize + 4;
  }
  
  return Buffer.from(await pdfDoc.save());
}

// Text/Markdown/HTML → PDF
async function convertTextToPdf(buffer: Buffer, format: string): Promise<Buffer> {
  const text = buffer.toString('utf-8');
  
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  
  const fontSize = 12;
  const maxWidth = width - 100;
  const lines = wrapText(text, maxWidth, fontSize);
  
  let yPosition = height - 50;
  let currentPage = page;
  
  for (const line of lines) {
    if (yPosition < 50) {
      currentPage = pdfDoc.addPage();
      yPosition = currentPage.getSize().height - 50;
    }
    
    currentPage.drawText(line, {
      x: 50,
      y: yPosition,
      size: fontSize,
    });
    
    yPosition -= fontSize + 4;
  }
  
  return Buffer.from(await pdfDoc.save());
}

// Excel → PDF
async function convertExcelToPdf(buffer: Buffer): Promise<Buffer> {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const csv = XLSX.utils.sheet_to_csv(sheet);
  
  return await convertTextToPdf(Buffer.from(csv), 'csv');
}

// Image → PDF
async function convertImageToPdf(buffer: Buffer): Promise<Buffer> {
  const processedImage = await sharp(buffer)
    .resize(1200, 1600, { fit: 'inside' })
    .jpeg({ quality: 90 })
    .toBuffer();
  
  const pdfDoc = await PDFDocument.create();
  const image = await pdfDoc.embedJpg(processedImage);
  
  const page = pdfDoc.addPage([image.width, image.height]);
  page.drawImage(image, {
    x: 0,
    y: 0,
    width: image.width,
    height: image.height,
  });
  
  return Buffer.from(await pdfDoc.save());
}

// ✅ NEW: Extract text from PDF using PDF.js (NO Canvas dependencies!)
export async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
  try {
    const pdfjsLib = await getPdfJs();
    
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
      standardFontDataUrl: undefined, // Disable font loading
    });
    
    const pdf = await loadingTask.promise;
    const textParts: string[] = [];
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      textParts.push(pageText);
    }
    
    return textParts.join('\n\n');
    
  } catch (error) {
    console.error('PDF text extraction error:', error);
    
    // ✅ FALLBACK: Try using pdf-lib to at least get metadata
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pageCount = pdfDoc.getPageCount();
      return `[PDF with ${pageCount} pages - text extraction unavailable]`;
    } catch {
      return '[Unable to extract text from PDF]';
    }
  }
}

// ✅ NEW: Extract metadata using PDF.js
export async function extractMetadata(pdfBuffer: Buffer, format: string) {
  try {
    const pdfjsLib = await getPdfJs();
    
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
    });
    
    const pdf = await loadingTask.promise;
    const text = await extractTextFromPdf(pdfBuffer);
    
    const tokenizer = new natural.WordTokenizer();
    const words = tokenizer.tokenize(text);

    return {
      pageCount: pdf.numPages,
      wordCount: words.length,
      charCount: text.length,
      format,
    };
  } catch (error) {
    console.error('Metadata extraction error:', error);
    
    // ✅ FALLBACK: Use pdf-lib
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      return {
        pageCount: pdfDoc.getPageCount(),
        wordCount: 0,
        charCount: 0,
        format,
      };
    } catch {
      return {
        pageCount: 1,
        wordCount: 0,
        charCount: 0,
        format,
      };
    }
  }
}

// 📊 Analyze document content
export async function analyzeDocument(text: string, plan: string) {
  const tokenizer = new natural.WordTokenizer();
  const words = tokenizer.tokenize(text.toLowerCase());
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Basic NLP analysis
  const doc = nlp(text);
  const entities = doc.topics().out('array');
  const keywords = extractKeywords(text, 10);
  
  // Readability
  const readability = calculateReadability(text, words.length, sentences.length);
  
  // Sentiment analysis
  const analyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
  const sentiment = analyzer.getSentiment(words);
  
  // Grammar/spelling checks
  const grammarIssues = detectGrammarIssues(text);
  const spellingErrors = await detectSpellingErrors(text, words);
  
  // Clarity analysis
  const clarityIssues = analyzeClarity(text, sentences);
  const formalityLevel = analyzeFormalityLevel(text);
  
  // ✅ AI-powered analysis (optional)
  let aiAnalysis = null;
  if (anthropic && plan === 'premium' && text.length > 0) {
    try {
      aiAnalysis = await analyzeWithAI(text.substring(0, 5000));
      console.log('✅ AI analysis successful');
    } catch (error) {
      console.warn('⚠️ AI analysis failed, using rule-based only');
    }
  }
  
  // Calculate health score
  const healthScore = calculateHealthScore({
    readability,
    grammarCount: grammarIssues.length,
    spellingCount: spellingErrors.length,
    sentiment,
  });
  
  return {
    readability: Math.round(readability),
    sentiment: Math.round(sentiment * 100) / 100,
    grammar: grammarIssues,
    spelling: spellingErrors,
    clarity: aiAnalysis?.clarity || clarityIssues,
    formality: aiAnalysis?.formality || formalityLevel,
    keywords,
    entities,
    language: 'en',
    healthScore,
    analysisSource: aiAnalysis ? 'ai-enhanced' : 'rule-based',
  };
}

// Helper: Wrap text to fit width
function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const estimatedWidth = testLine.length * (fontSize * 0.6);
    
    if (estimatedWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) lines.push(currentLine);
  return lines;
}

// Extract keywords using TF-IDF
function extractKeywords(text: string, count: number): string[] {
  const TfIdf = natural.TfIdf;
  const tfidf = new TfIdf();
  
  tfidf.addDocument(text);
  
  const keywords: Array<{ term: string; score: number }> = [];
  tfidf.listTerms(0).forEach((item) => {
    if (item.term.length > 3) {
      keywords.push({ term: item.term, score: item.tfidf });
    }
  });
  
  return keywords
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(k => k.term);
}

// Calculate readability
function calculateReadability(text: string, wordCount: number, sentenceCount: number): number {
  const syllables = countSyllables(text);
  
  if (wordCount === 0 || sentenceCount === 0) return 0;
  
  const score = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllables / wordCount);
  return Math.max(0, Math.min(100, score));
}

// Count syllables
function countSyllables(text: string): number {
  const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
  let count = 0;
  
  words.forEach(word => {
    const syllables = word.match(/[aeiouy]+/g);
    count += syllables ? syllables.length : 1;
  });
  
  return count;
}

// Detect grammar issues
function detectGrammarIssues(text: string): Array<{ type: string; message: string; position: number }> {
  const issues: Array<{ type: string; message: string; position: number }> = [];
  
  const patterns = [
    { regex: /\b(their|there|they're)\s+(is|are)\b/gi, message: 'Check their/there/they\'re usage' },
    { regex: /\b(your|you're)\s+(going|be)\b/gi, message: 'Check your/you\'re usage' },
    { regex: /\b(its|it's)\s+(a|the)\b/gi, message: 'Check its/it\'s usage' },
    { regex: /\s{2,}/g, message: 'Multiple spaces detected' },
    { regex: /\b(could of|should of|would of)\b/gi, message: 'Should be "could have"' },
    { regex: /\b(alot)\b/gi, message: '"A lot" is two words' },
  ];
  
  patterns.forEach(({ regex, message }) => {
    let match;
    while ((match = regex.exec(text)) !== null) {
      issues.push({
        type: 'grammar',
        message,
        position: match.index,
      });
    }
  });
  
  return issues.slice(0, 50);
}

// Detect spelling errors
async function detectSpellingErrors(text: string, words: string[]): Promise<Array<{ word: string; position: number }>> {
  const errors: Array<{ word: string; position: number }> = [];
  
  const commonMisspellings: Record<string, string> = {
    'recieve': 'receive',
    'occured': 'occurred',
    'seperate': 'separate',
    'definately': 'definitely',
    'goverment': 'government',
    'wierd': 'weird',
    'untill': 'until',
    'greatful': 'grateful',
  };
  
  words.forEach((word, index) => {
    const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
    if (commonMisspellings[cleanWord]) {
      errors.push({ word: cleanWord, position: index });
    }
  });
  
  return errors.slice(0, 30);
}

// Clarity analysis
function analyzeClarity(
  text: string,
  sentences: string[]
): Array<{ issue: string; suggestion: string }> {
  const issues: Array<{ issue: string; suggestion: string }> = [];

  sentences.forEach((sentence, index) => {
    const words = sentence.trim().split(/\s+/);
    
    if (words.length > 30) {
      issues.push({
        issue: `Sentence ${index + 1} is too long (${words.length} words)`,
        suggestion: 'Break into shorter sentences'
      });
    }

    const passiveIndicators = /\b(is|are|was|were|been|being)\s+\w+ed\b/gi;
    if (passiveIndicators.test(sentence)) {
      issues.push({
        issue: `Sentence ${index + 1} uses passive voice`,
        suggestion: 'Consider active voice'
      });
    }
  });

  return issues.slice(0, 15);
}

// Formality analysis
function analyzeFormalityLevel(text: string): string {
  const informalWords = ['gonna', 'wanna', 'kinda', 'sorta', 'yeah', 'nope'];
  const casualCount = informalWords.filter(word => 
    new RegExp(`\\b${word}\\b`, 'gi').test(text)
  ).length;

  const hasContractions = (text.match(/\b\w+'\w+\b/g) || []).length;

  if (casualCount > 3) return 'informal';
  if (casualCount > 0 || hasContractions > 5) return 'neutral';
  return 'formal';
}

// AI analysis
async function analyzeWithAI(text: string) {
  if (!anthropic) throw new Error('AI not configured');

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `Analyze for clarity and formality. Return JSON:
{"clarity": [{"issue": "...", "suggestion": "..."}], "formality": "formal|neutral|informal"}

Text: ${text.substring(0, 3000)}`
    }]
  });
  
  const content = message.content[0];
  if (content.type === 'text') {
    const cleaned = content.text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  }
  
  return null;
}

// Health score
interface DocumentHealthMetrics {
  readability: number;
  grammarCount: number;
  spellingCount: number;
  sentiment: number;
}

function calculateHealthScore(metrics: DocumentHealthMetrics): number {
  let score = 100;
  
  if (metrics.readability < 60) score -= (60 - metrics.readability) * 0.5;
  if (metrics.readability > 80) score -= (metrics.readability - 80) * 0.3;
  
  score -= Math.min(30, metrics.grammarCount * 2);
  score -= Math.min(20, metrics.spellingCount * 3);
  
  if (metrics.sentiment > 0.5) score += 5;
  if (metrics.sentiment < -0.5) score -= 5;
  
  return Math.max(0, Math.min(100, Math.round(score)));
}