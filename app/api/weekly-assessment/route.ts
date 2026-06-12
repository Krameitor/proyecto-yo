import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/weekly-assessment?week=24&year=2026
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const week = parseInt(searchParams.get('week') || '0');
    const year = parseInt(searchParams.get('year') || '0');

    if (!week || !year) {
      return NextResponse.json(
        { error: 'week and year are required' },
        { status: 400 }
      );
    }

    const assessment = await prisma.weeklyAssessment.findFirst({
      where: {
        weekNumber: week,
        year,
        deletedAt: null,
      },
    });

    if (!assessment) {
      return NextResponse.json(null);
    }

    return NextResponse.json(assessment);
  } catch (error) {
    console.error('GET /api/weekly-assessment error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessment' },
      { status: 500 }
    );
  }
}

// POST /api/weekly-assessment
// Accepts FormData (to support audio upload)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const weekNumber = parseInt(formData.get('weekNumber') as string);
    const year = parseInt(formData.get('year') as string);
    const phq4Q1 = parseInt(formData.get('phq4Q1') as string);
    const phq4Q2 = parseInt(formData.get('phq4Q2') as string);
    const phq4Q3 = parseInt(formData.get('phq4Q3') as string);
    const phq4Q4 = parseInt(formData.get('phq4Q4') as string);
    const journalText = (formData.get('journalText') as string) || '';
    const journalPrompt = (formData.get('journalPrompt') as string) || '';
    const audioFile = formData.get('audio') as File | null;

    if (!weekNumber || !year) {
      return NextResponse.json(
        { error: 'weekNumber and year are required' },
        { status: 400 }
      );
    }

    const phq4Total = phq4Q1 + phq4Q2 + phq4Q3 + phq4Q4;

    // Transcribe audio if present
    let audioTranscription = '';
    if (audioFile && audioFile.size > 0) {
      // For now, store a note that audio was provided
      // Full transcription would use Gemini audio API
      audioTranscription = '[Audio journal recorded]';
    }

    const fullJournalText = journalText + (audioTranscription ? '\n\n' + audioTranscription : '');

    // Analyze with AI if there's journal content
    let sentimentScore: number | null = null;
    let keywords: string | null = null;
    let aiSummary: string | null = null;

    if (fullJournalText.trim().length > 10) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        try {
          const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: `Eres un psicólogo empático. Analiza esta entrada de journaling semanal de un joven emprendedor con TDAH.

Pregunta guía de la semana: "${journalPrompt}"

Respuesta del usuario: "${fullJournalText}"

Datos PHQ-4 esta semana:
- Ansiedad (GAD-2): ${phq4Q1 + phq4Q2}/6
- Depresión (PHQ-2): ${phq4Q3 + phq4Q4}/6
- Total: ${phq4Total}/12

Analiza y responde SOLO con JSON válido (sin markdown):
{
  "sentimentScore": <number entre -1 (muy negativo) y 1 (muy positivo)>,
  "keywords": ["<palabra clave 1>", "<palabra clave 2>", "<max 5>"],
  "summary": "<resumen de 2-3 frases con conclusiones empáticas y constructivas, en español, mencionando patrones observados y una sugerencia práctica>"
}`,
                      },
                    ],
                  },
                ],
                generationConfig: {
                  temperature: 0.3,
                  maxOutputTokens: 500,
                },
              }),
            }
          );

          if (geminiResponse.ok) {
            const geminiData = await geminiResponse.json();
            const responseText =
              geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              sentimentScore = Number(parsed.sentimentScore) || 0;
              keywords = JSON.stringify(parsed.keywords || []);
              aiSummary = String(parsed.summary || '');
            }
          }
        } catch (err) {
          console.error('AI analysis failed:', err);
        }
      }
    }

    // Upsert (create or update for this week)
    const assessment = await prisma.weeklyAssessment.upsert({
      where: {
        weekNumber_year: {
          weekNumber,
          year,
        },
      },
      create: {
        weekNumber,
        year,
        phq4Q1,
        phq4Q2,
        phq4Q3,
        phq4Q4,
        phq4Total,
        journalText: fullJournalText || null,
        journalPrompt: journalPrompt || null,
        sentimentScore,
        keywords,
        aiSummary,
      },
      update: {
        phq4Q1,
        phq4Q2,
        phq4Q3,
        phq4Q4,
        phq4Total,
        journalText: fullJournalText || null,
        journalPrompt: journalPrompt || null,
        sentimentScore,
        keywords,
        aiSummary,
      },
    });

    return NextResponse.json(assessment, { status: 201 });
  } catch (error) {
    console.error('POST /api/weekly-assessment error:', error);
    return NextResponse.json(
      { error: 'Failed to save assessment' },
      { status: 500 }
    );
  }
}
