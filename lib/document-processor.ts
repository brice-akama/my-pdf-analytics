// lib/document-processor.ts

import { PDFDocument } from 'pdf-lib';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import sharp from 'sharp';
import nlp from 'compromise';
import * as natural from 'natural';
import extraction from 'pdf-extraction';
import Anthropic from '@anthropic-ai/sdk';
// ✅ Make AI optional - only initialize if API key exists
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
  
  // Split text into lines that fit the page
  const fontSize = 12;
  const maxWidth = width - 100;
  const lines = wrapText(text, maxWidth, fontSize);
  
  let yPosition = height - 50;
  
  for (const line of lines) {
    if (yPosition < 50) {
      const newPage = pdfDoc.addPage();
      yPosition = newPage.getSize().height - 50;
    }
    
    page.drawText(line, {
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
  // Resize image if too large
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
// 📝 Extract text from PDF using pdf-extraction
export async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
  try {
    const data = await extraction(pdfBuffer);
    return data?.text || '';
  } catch (error) {
    console.error('PDF text extraction error:', error);
    return '';
  }
}


// 📊 Analyze document content (Grammarly-style)
export async function analyzeDocument(text: string, plan: string) {
  const tokenizer = new natural.WordTokenizer();
  const words = tokenizer.tokenize(text.toLowerCase());
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Basic NLP analysis
  const doc = nlp(text);
  const entities = doc.topics().out('array');
  const keywords = extractKeywords(text, 10);
  
  // Readability (Flesch Reading Ease)
  const readability = calculateReadability(text, words.length, sentences.length);
  
  // Sentiment analysis
  const analyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
  const sentiment = analyzer.getSentiment(words);
  
  // Basic grammar/spelling checks
  const grammarIssues = detectGrammarIssues(text);
  const spellingErrors = await detectSpellingErrors(text, words);
  
  // ✅ Rule-based clarity analysis (always works)
  const clarityIssues = analyzeClarity(text, sentences);
  const formalityLevel = analyzeFormalityLevel(text);
  
  // ✅ Try AI-powered deep analysis only if available AND premium
  let aiAnalysis = null;
  if (anthropic && plan === 'premium' && text.length > 0) {
    try {
      aiAnalysis = await analyzeWithAI(text.substring(0, 5000));
      console.log('✅ AI analysis successful');
    } catch (error) {
      console.warn('⚠️ AI analysis failed, using rule-based only:', error);
      // Continue with rule-based analysis
    }
  } else if (!anthropic) {
    console.log('ℹ️ AI not configured, using rule-based analysis');
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
    // ✅ Use AI clarity if available, otherwise use rule-based
    clarity: aiAnalysis?.clarity || clarityIssues,
    formality: aiAnalysis?.formality || formalityLevel,
    keywords,
    entities,
    language: 'en',
    healthScore,
    analysisSource: aiAnalysis ? 'ai-enhanced' : 'rule-based',
  };
}
// 📄 Extract metadata
// 📄 Extract metadata
// 📄 Extract metadata
export async function extractMetadata(pdfBuffer: Buffer, format: string) {
  try {
    const data = await extraction(pdfBuffer);
    const text = data?.text || '';
    const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).filter(Boolean).length;

    return {
      pageCount: data?.numrender || 1,
      wordCount,
      charCount: text.length,
      format,
    };
  } catch (error) {
    console.error('Metadata extraction error:', error);
    return {
      pageCount: 1,
      wordCount: 0,
      charCount: 0,
      format,
    };
  }
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
// Calculate readability (Flesch Reading Ease)
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
// Detect basic grammar issues
function detectGrammarIssues(text: string): Array<{ type: string; message: string; position: number }> {
  const issues: Array<{ type: string; message: string; position: number }> = [];
  
  // Common patterns
  const patterns = [
    { regex: /\b(their|there|they're)\s+(is|are)\b/gi, message: 'Check their/there/they\'re usage' },
    { regex: /\b(your|you're)\s+(going|be)\b/gi, message: 'Check your/you\'re usage' },
    { regex: /\b(its|it's)\s+(a|the)\b/gi, message: 'Check its/it\'s usage' },
    { regex: /\s{2,}/g, message: 'Multiple spaces detected' },
    { regex: /\b(could of|should of|would of)\b/gi, message: 'Should be "could have", "should have", or "would have"' },
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
  
  return issues.slice(0, 50); // Limit to 50 issues
}
// Detect spelling errors (basic)
async function detectSpellingErrors(text: string, words: string[]): Promise<Array<{ word: string; position: number }>> {
  const errors: Array<{ word: string; position: number }> = [];
  
  // Common misspellings
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
      errors.push({ 
        word: cleanWord, 
        position: index,
      });
    }
  });
  
  return errors.slice(0, 30);
}
// ✅ Rule-based clarity analysis (works without AI)
function analyzeClarity(
  text: string,
  sentences: string[]
): Array<{ issue: string; suggestion: string }> {
  const issues: Array<{ issue: string; suggestion: string }> = [];
  sentences.forEach((sentence, index) => {
    const words = sentence.trim().split(/\s+/);
    
    // Long sentences
    if (words.length > 30) {
      issues.push({
        issue: `Sentence ${index + 1} is too long (${words.length} words)`,
        suggestion: 'Break into shorter sentences for better clarity'
      });
    }
    // Passive voice
    const passiveIndicators = /\b(is|are|was|were|been|being)\s+\w+ed\b/gi;
    if (passiveIndicators.test(sentence)) {
      issues.push({
        issue: `Sentence ${index + 1} uses passive voice`,
        suggestion: 'Consider using active voice for clarity'
      });
    }
    // Complex words
    const complexWords = ['utilize', 'facilitate', 'implement', 'leverage'];
    complexWords.forEach(word => {
      if (new RegExp(`\\b${word}\\b`, 'gi').test(sentence)) {
        const simpler = {
          'utilize': 'use',
          'facilitate': 'help',
          'implement': 'do',
          'leverage': 'use'
        }[word.toLowerCase()];
        
        issues.push({
          issue: `"${word}" could be simplified`,
          suggestion: `Use "${simpler}" instead`
        });
      }
    });
  });
  return issues.slice(0, 15);
}
// ✅ Rule-based formality analysis (works without AI)
function analyzeFormalityLevel(text: string): string {
  const informalWords = ['gonna', 'wanna', 'kinda', 'sorta', 'yeah', 'nope'];
  const casualCount = informalWords.filter(word => 
    new RegExp(`\\b${word}\\b`, 'gi').test(text)
  ).length;
  const hasExclamations = (text.match(/!!+/g) || []).length > 0;
  const hasContractions = (text.match(/\b\w+'\w+\b/g) || []).length;
  if (casualCount > 3 || hasExclamations) return 'informal';
  if (casualCount > 0 || hasContractions > 5) return 'neutral';
  return 'formal';
}
// ✅ AI-powered deep analysis (optional enhancement)
async function analyzeWithAI(text: string) {
  if (!anthropic) {
    throw new Error('AI not configured');
  }
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `Analyze this text for clarity and formality. Return JSON with:
{
  "clarity": [{"issue": "description", "suggestion": "fix"}],
  "formality": "formal|neutral|informal"
}
Text: ${text.substring(0, 3000)}`
      }]
    });
    
    const content = message.content[0];
    if (content.type === 'text') {
      const cleaned = content.text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleaned);
    }
    
    return null;
  } catch (error) {
    console.error('AI analysis error:', error);
    return null;
  }
}
// Calculate overall health score
interface DocumentHealthMetrics {
  readability: number;
  grammarCount: number;
  spellingCount: number;
  sentiment: number;
}
function calculateHealthScore(metrics: DocumentHealthMetrics): number {
  let score = 100;
  
  // Deduct for readability (want 60-80 range)
  if (metrics.readability < 60) score -= (60 - metrics.readability) * 0.5;
  if (metrics.readability > 80) score -= (metrics.readability - 80) * 0.3;
  
  // Deduct for errors
  score -= Math.min(30, metrics.grammarCount * 2);
  score -= Math.min(20, metrics.spellingCount * 3);
  
  // Sentiment bonus (positive content)
  if (metrics.sentiment > 0.5) score += 5;
  if (metrics.sentiment < -0.5) score -= 5;
  
  return Math.max(0, Math.min(100, Math.round(score)));
} 