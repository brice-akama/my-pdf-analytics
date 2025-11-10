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