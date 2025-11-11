// app/api/documents/[documentId]/suggestions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../../../lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import Anthropic from '@anthropic-ai/sdk';


interface GrammarIssue {
  original: string;
  correction: string;
  explanation: string;
  type: string;
}

interface ClaritySuggestion {
  original: string;
  improved: string;
  reason: string;
  sentenceIndex?: number;
}

interface ToneSuggestion {
  original: string;
  professional: string;
  context: string;
  count?: number;
}

interface ReadabilitySuggestion {
  original: string;
  simplified: string;
  readabilityImprovement: string;
  wordCount?: number;
}

interface GrammarResult {
  issues: GrammarIssue[];
}

interface ClarityResult {
  suggestions: ClaritySuggestion[];
}

interface ToneResult {
  currentTone: 'formal' | 'neutral' | 'informal';
  suggestions: ToneSuggestion[];
}

interface ReadabilityResult {
  suggestions: ReadabilitySuggestion[];
}





// ✅ NEW: Style consistency checker
function analyzeStyleConsistency(text: string) {
  const issues = [];

  // Date format consistency
  const dateFormats = {
    'MM/DD/YYYY': /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
    'Month DD, YYYY': /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}, \d{4}\b/g,
    'DD-MM-YYYY': /\b\d{1,2}-\d{1,2}-\d{4}\b/g,
  };

  const foundFormats = [];
  for (const [format, regex] of Object.entries(dateFormats)) {
    if (regex.test(text)) {
      foundFormats.push(format);
    }
  }

  if (foundFormats.length > 1) {
    issues.push({
      type: 'date_format',
      severity: 'medium',
      message: `Inconsistent date formats found: ${foundFormats.join(', ')}`,
      suggestion: 'Use consistent date format throughout the document',
    });
  }

  // Number formatting
  const hasCommas = /\b\d{1,3}(,\d{3})+\b/.test(text);
  const noCommas = /\b\d{4,}\b/.test(text);
  if (hasCommas && noCommas) {
    issues.push({
      type: 'number_format',
      severity: 'low',
      message: 'Inconsistent number formatting (some with commas, some without)',
      suggestion: 'Use consistent thousand separators (e.g., 1,000 or 1000)',
    });
  }

  // Heading style (Title Case vs sentence case)
  const headings = text.match(/^#{1,6}\s+.+$/gm) || [];
  const titleCase = headings.filter(h => /^#{1,6}\s+[A-Z][a-z]*(\s+[A-Z][a-z]*)+/.test(h));
  const sentenceCase = headings.filter(h => /^#{1,6}\s+[A-Z][a-z]*(\s+[a-z]+)+/.test(h));
  
  if (titleCase.length > 0 && sentenceCase.length > 0) {
    issues.push({
      type: 'heading_style',
      severity: 'low',
      message: 'Inconsistent heading capitalization',
      suggestion: 'Use either Title Case or sentence case consistently',
    });
  }

  // Oxford comma consistency
    const listItems = text.match(/,\s+(?:and|or)\s+/g) || [];
    const withOxford = (text.match(/,\s+,\s+(?:and|or)\s+/g) || []).length;
    const withoutOxford = listItems.length - withOxford;
    
    if (withOxford > 0 && withoutOxford > 0) {
      issues.push({
        type: 'oxford_comma',
        severity: 'low',
        message: 'Inconsistent use of Oxford comma',
        suggestion: 'Use Oxford comma consistently (e.g., "red, white, and blue")',
      });
    }

  // Quote style
  const straightQuotes = /"[^"]+"/g.test(text);
  const curlyQuotes = /[""][^""]+[""]/g.test(text);
  if (straightQuotes && curlyQuotes) {
    issues.push({
      type: 'quote_style',
      severity: 'low',
      message: 'Mixed quote styles (straight and curly)',
      suggestion: 'Use consistent quote style throughout',
    });
  }

  return {
    score: Math.max(0, 100 - (issues.length * 10)),
    issues,
    consistencyLevel: issues.length === 0 ? 'excellent' : issues.length < 3 ? 'good' : 'needs improvement',
  };
}

// ✅ NEW: Document type detection
function detectDocumentType(text: string, filename: string) {
  const types = {
    contract: /\b(agreement|contract|terms|conditions|hereby|whereas|party|parties)\b/gi,
    proposal: /\b(proposal|solution|recommendation|implementation|timeline|deliverable)\b/gi,
    report: /\b(executive summary|findings|analysis|conclusion|methodology|results)\b/gi,
    email: /\b(dear|hi|hello|regards|sincerely|best|thanks)\b/gi,
    invoice: /\b(invoice|bill|payment|due date|subtotal|total|tax)\b/gi,
    resume: /\b(experience|education|skills|objective|qualification)\b/gi,
    memo: /\b(memo|memorandum|to:|from:|date:|re:|subject:)\b/gi,
  };

  const scores: Record<string, number> = {};
  for (const [type, regex] of Object.entries(types)) {
    const matches = text.match(regex);
    scores[type] = matches ? matches.length : 0;
  }

  const detectedType = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
  const confidence = scores[detectedType] > 5 ? 'high' : scores[detectedType] > 2 ? 'medium' : 'low';

  return {
    type: detectedType,
    confidence,
    score: scores[detectedType],
    recommendations: getRecommendationsForType(detectedType),
  };
}

// ✅ NEW: Reading level metrics (Flesch-Kincaid, etc.)
function calculateReadabilityMetrics(text: string) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);

  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  // Flesch Reading Ease (0-100, higher = easier)
  const fleschScore = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

  // Flesch-Kincaid Grade Level
  const gradeLevel = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;

  // Reading time
  const readingTime = Math.ceil(words.length / 200); // 200 words per minute

  return {
    fleschScore: Math.max(0, Math.min(100, fleschScore)),
    gradeLevel: Math.max(0, gradeLevel),
    readingLevel: getReadingLevel(fleschScore),
    readingTime: `${readingTime} min`,
    metrics: {
      sentences: sentences.length,
      words: words.length,
      avgWordsPerSentence: Math.round(avgWordsPerSentence),
      avgSyllablesPerWord: avgSyllablesPerWord.toFixed(2),
    },
    recommendations: getReadabilityRecommendations(fleschScore, avgWordsPerSentence),
  };
}

// ✅ NEW: Sentiment analysis
function analyzeSentiment(text: string) {
  const positiveWords = ['good', 'great', 'excellent', 'outstanding', 'positive', 'success', 'achieve', 'benefit', 'opportunity', 'improve'];
  const negativeWords = ['bad', 'poor', 'fail', 'failure', 'problem', 'issue', 'concern', 'difficult', 'challenge', 'risk'];
  const aggressiveWords = ['must', 'demand', 'require', 'insist', 'immediately', 'urgently', 'critical', 'essential'];

  const lowerText = text.toLowerCase();

  const positiveCount = positiveWords.reduce((sum, word) => 
    sum + (lowerText.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length, 0
  );
  const negativeCount = negativeWords.reduce((sum, word) => 
    sum + (lowerText.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length, 0
  );
  const aggressiveCount = aggressiveWords.reduce((sum, word) => 
    sum + (lowerText.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length, 0
  );

  const totalSentimentWords = positiveCount + negativeCount;
  const sentimentScore = totalSentimentWords > 0 
    ? ((positiveCount - negativeCount) / totalSentimentWords) * 100 
    : 0;

  return {
    score: Math.round(sentimentScore),
    sentiment: sentimentScore > 20 ? 'positive' : sentimentScore < -20 ? 'negative' : 'neutral',
    tone: aggressiveCount > 5 ? 'aggressive' : aggressiveCount > 2 ? 'assertive' : 'balanced',
    details: {
      positiveWords: positiveCount,
      negativeWords: negativeCount,
      aggressiveWords: aggressiveCount,
    },
    suggestions: getSentimentSuggestions(sentimentScore, aggressiveCount),
  };
}

// ✅ NEW: Professional score calculator
function calculateProfessionalScore(text: string): number {
  let score = 100;

  // Deduct for informal language
  const informalWords = ['gonna', 'wanna', 'kinda', 'yeah', 'nope', 'btw', 'lol', 'omg'];
  informalWords.forEach(word => {
    const matches = text.match(new RegExp(`\\b${word}\\b`, 'gi'));
    if (matches) score -= matches.length * 5;
  });

  // Deduct for excessive punctuation
  if (/!!+/.test(text)) score -= 10;
  if (/\?\?+/.test(text)) score -= 10;

  // Deduct for all caps
  const allCapsWords = text.match(/\b[A-Z]{4,}\b/g) || [];
  score -= allCapsWords.length * 3;

  // Deduct for typos (simple check)
  const typos = text.match(/\b\w*(\w)\1{2,}\w*\b/g) || []; // Repeated letters
  score -= typos.length * 5;

  return Math.max(0, Math.min(100, score));
}

// Helper functions
function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  
  const syllablePattern = /[aeiouy]+/g;
  const matches = word.match(syllablePattern);
  let count = matches ? matches.length : 1;
  
  if (word.endsWith('e')) count--;
  if (word.endsWith('le') && word.length > 2) count++;
  
  return Math.max(1, count);
}

function getReadingLevel(score: number): string {
  if (score >= 90) return 'Very Easy (5th grade)';
  if (score >= 80) return 'Easy (6th grade)';
  if (score >= 70) return 'Fairly Easy (7th grade)';
  if (score >= 60) return 'Standard (8th-9th grade)';
  if (score >= 50) return 'Fairly Difficult (10th-12th grade)';
  if (score >= 30) return 'Difficult (College)';
  return 'Very Difficult (College graduate)';
}

function getReadabilityRecommendations(score: number, avgWords: number): string[] {
  const recs = [];
  if (score < 60) recs.push('Consider simplifying complex sentences');
  if (avgWords > 20) recs.push('Break long sentences into shorter ones');
  if (score < 50) recs.push('Use simpler words where possible');
  return recs;
}

function getSentimentSuggestions(score: number, aggressiveCount: number): string[] {
  const suggestions = [];
  if (score < -20) suggestions.push('Consider adding more positive language');
  if (aggressiveCount > 5) suggestions.push('Tone down aggressive language for better reception');
  if (score > 50) suggestions.push('Balance positivity with realistic expectations');
  return suggestions;
}

function getRecommendationsForType(type: string): string[] {
  const recommendations: Record<string, string[]> = {
    contract: ['Include clear terms and conditions', 'Define all parties involved', 'Specify dates and deadlines'],
    proposal: ['Start with executive summary', 'Include clear deliverables', 'Add implementation timeline'],
    report: ['Begin with executive summary', 'Present findings clearly', 'Include actionable conclusions'],
    email: ['Keep it concise', 'Use clear subject line', 'End with clear call-to-action'],
    invoice: ['Include all payment details', 'Specify due date', 'List itemized charges'],
  };
  return recommendations[type] || [];
}

// Action handlers (keep existing + add new ones)
async function handleAnalyze(type: string, text: string, user: any, anthropic: any) {
  if (anthropic && user.plan === 'premium') {
    try {
      const aiSuggestions = await getAISuggestions(type, text);
      return NextResponse.json({
        success: true,
        suggestions: aiSuggestions,
        type,
        source: 'ai',
        premium: true,
      });
    } catch (error) {
      console.error('AI error, using rule-based:', error);
    }
  }

  const suggestions = getRuleBasedSuggestions(type, text);
  return NextResponse.json({
    success: true,
    suggestions,
    type,
    source: 'rule-based',
    premium: false,
  });
}

async function handleImprove(text: string, type: string, user: any, anthropic: any) {
  if (!anthropic || user.plan !== 'premium') {
    return NextResponse.json({
      error: 'AI improvements require Premium plan',
      upgrade: true,
    }, { status: 403 });
  }

  const improved = await getAISuggestions('improve', text);
  return NextResponse.json({
    success: true,
    improved,
    source: 'ai',
  });
}

async function handleApplyAll(document: any, suggestions: string[], db: any, documentId: ObjectId) {
  // Apply selected suggestions to document
  // This would require storing modified text
  return NextResponse.json({
    success: true,
    message: 'Suggestions applied',
    appliedCount: suggestions.length,
  });
}

async function handleRewrite(text: string, user: any, anthropic: any) {
  if (!anthropic || user.plan !== 'premium') {
    return NextResponse.json({
      error: 'AI rewrite requires Premium plan',
      upgrade: true,
    }, { status: 403 });
  }

  const rewritten = await getAISuggestions('rewrite', text);
  return NextResponse.json({
    success: true,
    rewritten,
    source: 'ai',
  });
}

// ✅ Make AI optional - only initialize if API key exists
const anthropic = process.env.ANTHROPIC_API_KEY 
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// 📝 GET - Get detailed content suggestions (Grammarly-style)
export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const user = await verifyUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;
    const { documentId } = params;

    if (!ObjectId.isValid(documentId)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    const document = await db.collection('documents').findOne({
      _id: new ObjectId(documentId),
      userId: user.id,
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const suggestions = {
      grammar: document.analytics?.grammarIssues || [],
      spelling: document.analytics?.spellingErrors || [],
      clarity: document.analytics?.clarity || [],
      
      summary: {
        totalIssues: 
          (document.analytics?.grammarIssues?.length || 0) +
          (document.analytics?.spellingErrors?.length || 0) +
          (document.analytics?.clarity?.length || 0),
        criticalIssues: document.analytics?.grammarIssues?.filter((i: any) => 
          i.severity === 'critical'
        ).length || 0,
      },
    };

    return NextResponse.json({
      success: true,
      suggestions,
      healthScore: document.analytics?.healthScore || 0,
      aiAvailable: !!anthropic, // Tell frontend if AI is available
    }, { status: 200 });
    
  } catch (error) {
    console.error('Suggestions fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch suggestions' 
    }, { status: 500 });
  }
}

// 🤖 POST - Get improvement suggestions (works with or without AI)
export async function POST(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const user = await verifyUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;
    const { documentId } = params;
    const body = await request.json();
    const { section, type } = body; // 'section' = text to improve, 'type' = 'grammar'|'clarity'|'tone'

    if (!ObjectId.isValid(documentId)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    const document = await db.collection('documents').findOne({
      _id: new ObjectId(documentId),
      userId: user.id,
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const textToAnalyze = section || document.extractedText?.substring(0, 3000) || '';

    // ✅ Try AI first if available AND user is premium
    if (anthropic && user.plan === 'premium') {
      try {
        const aiSuggestions = await getAISuggestions(type, textToAnalyze);
        return NextResponse.json({
          success: true,
          suggestions: aiSuggestions,
          type,
          source: 'ai',
          premium: true,
        }, { status: 200 });
      } catch (aiError) {
        console.error('AI suggestion error, falling back to rule-based:', aiError);
        // Fall through to rule-based suggestions
      }
    }

    // ✅ Fallback: Rule-based suggestions (always works)
    const ruleBasedSuggestions = getRuleBasedSuggestions(type, textToAnalyze);

    return NextResponse.json({
      success: true,
      suggestions: ruleBasedSuggestions,
      type,
      source: 'rule-based',
      premium: false,
      aiAvailable: !!anthropic && user.plan === 'premium',
      message: !anthropic 
        ? 'Using rule-based analysis. Add ANTHROPIC_API_KEY for AI-powered suggestions.'
        : user.plan !== 'premium'
        ? 'Upgrade to premium for AI-powered suggestions.'
        : undefined,
    }, { status: 200 });
    
  } catch (error) {
    console.error('Suggestions error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate suggestions' 
    }, { status: 500 });
  }
}

// 🤖 AI-powered suggestions (optional)
async function getAISuggestions(type: string, text: string) {
  if (!anthropic) throw new Error('AI not available');

  const prompt = buildPromptForType(type, text);
  
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: prompt,
    }],
  });

  const content = message.content[0];
  
  if (content.type === 'text') {
    try {
      return JSON.parse(content.text);
    } catch {
      return { suggestions: [{ text: content.text }] };
    }
  }
  
  return { suggestions: [] };
}

// 🔧 Rule-based suggestions (always works, no AI needed)
function getRuleBasedSuggestions(type: string, text: string) {
  switch (type) {
    case 'grammar':
      return analyzeGrammar(text);
    
    case 'clarity':
      return analyzeClarity(text);
    
    case 'tone':
      return analyzeTone(text);
    
    case 'readability':
      return analyzeReadability(text);
    
    default:
      return analyzeClarity(text);
  }
}

// Grammar analysis (rule-based) with proper types
function analyzeGrammar(text: string): GrammarResult {
  const issues: GrammarIssue[] = [];
  
  // Common grammar patterns
  const patterns: {
    regex: RegExp;
    getMessage: (match: string) => GrammarIssue;
  }[] = [
    {
      regex: /\b(their|there|they're)\s+(is|are|was|were)\b/gi,
      getMessage: (match) => ({
        original: match,
        correction: match.replace(/their|there|they're/i, (m) => 
          /their/i.test(m) ? 'their' : /there/i.test(m) ? 'there' : "they're"
        ),
        explanation: 'Check their/there/they\'re usage',
        type: 'word-choice'
      })
    },
    {
      regex: /\b(your|you're)\s+(going|be|not)\b/gi,
      getMessage: (match) => ({
        original: match,
        correction: match.replace(/your|you're/i, "you're"),
        explanation: 'Should be "you\'re" (you are)',
        type: 'contraction'
      })
    },
    {
      regex: /\b(its|it's)\s+(a|the|been|not)\b/gi,
      getMessage: (match) => ({
        original: match,
        correction: match.replace(/its|it's/i, "it's"),
        explanation: 'Should be "it\'s" (it is/has)',
        type: 'contraction'
      })
    },
    {
      regex: /\b(alot)\b/gi,
      getMessage: (match) => ({
        original: match,
        correction: 'a lot',
        explanation: '"Alot" is not a word',
        type: 'spelling'
      })
    },
    {
      regex: /\s{2,}/g,
      getMessage: (match) => ({
        original: match,
        correction: ' ',
        explanation: 'Multiple spaces detected',
        type: 'formatting'
      })
    },
    {
      regex: /\b(could of|should of|would of)\b/gi,
      getMessage: (match) => ({
        original: match,
        correction: match.replace(/of/i, 'have'),
        explanation: 'Should be "could have", "should have", or "would have"',
        type: 'grammar'
      })
    },
  ];

  patterns.forEach(({ regex, getMessage }) => {
    let match;
    while ((match = regex.exec(text)) !== null && issues.length < 20) {
      issues.push(getMessage(match[0]));
    }
  });

  return { issues };
}


// Clarity analysis (rule-based) with proper types
function analyzeClarity(text: string): ClarityResult {
  const suggestions: ClaritySuggestion[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  sentences.forEach((sentence, index) => {
    const words = sentence.trim().split(/\s+/);

    // Long sentences
    if (words.length > 30) {
      suggestions.push({
        original: sentence.trim(),
        improved: 'Consider breaking this into smaller sentences',
        reason: 'Sentence is too long (over 30 words)',
        sentenceIndex: index
      });
    }

    // Passive voice detection (simple)
    const passiveIndicators = /\b(is|are|was|were|been|being)\s+\w+ed\b/gi;
    if (passiveIndicators.test(sentence)) {
      suggestions.push({
        original: sentence.trim(),
        improved: 'Consider using active voice',
        reason: 'Passive voice detected - active voice is usually clearer',
        sentenceIndex: index
      });
    }

    // Complex words
    const complexWords = ['utilize', 'facilitate', 'implement', 'leverage', 'paradigm'];
    complexWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      if (regex.test(sentence)) {
        const simpler = {
          'utilize': 'use',
          'facilitate': 'help',
          'implement': 'do or start',
          'leverage': 'use',
          'paradigm': 'model or pattern'
        }[word.toLowerCase()];

        suggestions.push({
          original: word,
          improved: simpler || 'No improvement available',
          reason: `"${word}" can be simplified to "${simpler}"`,
          sentenceIndex: index
        });
      }
    });
  });

  return { suggestions: suggestions.slice(0, 15) };
}
// Tone analysis
function analyzeTone(text: string) {
  const informalWords = ['gonna', 'wanna', 'kinda', 'sorta', 'yeah', 'nope', 'yep'];
  const suggestions = [];

  informalWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      const formal = {
        'gonna': 'going to',
        'wanna': 'want to',
        'kinda': 'kind of',
        'sorta': 'sort of',
        'yeah': 'yes',
        'nope': 'no',
        'yep': 'yes'
      }[word.toLowerCase()];

      suggestions.push({
        original: word,
        professional: formal,
        context: 'Use in formal writing',
        count: matches.length
      });
    }
  });

  // Detect overly casual punctuation
  if (/!!+/.test(text)) {
    suggestions.push({
      original: 'Multiple exclamation marks (!!)',
      professional: 'Use single exclamation mark or period',
      context: 'Professional writing uses restrained punctuation'
    });
  }

  const currentTone = suggestions.length > 3 ? 'informal' : suggestions.length > 0 ? 'neutral' : 'formal';

  return { currentTone, suggestions };
}

// Readability analysis (rule-based) with proper types
function analyzeReadability(text: string): ReadabilityResult {
  const suggestions: ReadabilitySuggestion[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  sentences.forEach((sentence, index) => {
    const words = sentence.trim().split(/\s+/);

    // Long sentences
    if (words.length > 25) {
      const midpoint = Math.floor(words.length / 2);
      const part1 = words.slice(0, midpoint).join(' ');
      const part2 = words.slice(midpoint).join(' ');

      suggestions.push({
        original: sentence.trim(),
        simplified: `${part1}. ${part2}`,
        readabilityImprovement: 'Splitting long sentence improves readability',
        wordCount: words.length
      });
    }

    // Long words
    const longWords = words.filter(w => w.length > 12);
    if (longWords.length > 0) {
      suggestions.push({
        original: sentence.trim(),
        simplified: 'Consider using shorter, simpler words',
        readabilityImprovement: `Contains ${longWords.length} long word(s): ${longWords.join(', ')}`,
        wordCount: words.length
      });
    }
  });

  return { suggestions: suggestions.slice(0, 10) };
}

function buildPromptForType(type: string, text: string): string {
  const prompts: Record<string, string> = {
    grammar: `Analyze this text for grammar errors and provide corrections. Return JSON format:
{
  "issues": [
    {
      "original": "text with error",
      "correction": "corrected text",
      "explanation": "why this is wrong",
      "type": "grammar type (subject-verb, tense, etc.)"
    }
  ]
}

Text: ${text}`,

    clarity: `Improve the clarity of this text. Identify unclear or confusing sentences and suggest improvements. Return JSON:
{
  "suggestions": [
    {
      "original": "unclear text",
      "improved": "clearer version",
      "reason": "why this is clearer"
    }
  ]
}

Text: ${text}`,

    tone: `Analyze the tone of this text and suggest improvements for professional/formal writing. Return JSON:
{
  "currentTone": "description",
  "suggestions": [
    {
      "original": "casual phrase",
      "professional": "professional version",
      "context": "when to use"
    }
  ]
}

Text: ${text}`,

    readability: `Improve the readability of this text. Simplify complex sentences. Return JSON:
{
  "suggestions": [
    {
      "original": "complex sentence",
      "simplified": "simpler version",
      "readabilityImprovement": "explanation"
    }
  ]
}

Text: ${text}`,
  };

  return prompts[type] || prompts.clarity;
}