import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/sleep/analyze
// Receives a FormData with an image, sends to Gemini Vision, returns sleep data
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Convert to base64
    const bytes = await imageFile.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mimeType = imageFile.type || 'image/jpeg';

    // Call Gemini Vision API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured' },
        { status: 500 }
      );
    }

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
                  text: `Analiza esta captura de pantalla de la app Sleep Cycle u otra app de sueño.
Extrae los siguientes datos:
1. Horas totales de sueño (en formato decimal, ej: 7.5)
2. Porcentaje de calidad del sueño (0-100)

Si no puedes identificar algún dato, usa valores razonables basados en lo que veas.

Responde SOLAMENTE con un JSON válido, sin markdown ni texto extra:
{"hours": <number>, "quality": <number>}`,
                },
                {
                  inlineData: {
                    mimeType,
                    data: base64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 200,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error('Gemini API error:', errText);
      return NextResponse.json(
        { error: 'Error al analizar la imagen con AI' },
        { status: 502 }
      );
    }

    const geminiData = await geminiResponse.json();
    const responseText =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse the JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'No se pudo extraer datos de la imagen' },
        { status: 422 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const totalHours = Math.max(0, Math.min(24, Number(parsed.hours) || 0));
    const qualityPercentage = Math.max(
      0,
      Math.min(100, Math.round(Number(parsed.quality) || 0))
    );

    // Save to database
    const sleepLog = await prisma.sleepLog.create({
      data: {
        totalHours,
        qualityPercentage,
        rawAiResponse: responseText,
      },
    });

    return NextResponse.json({
      id: sleepLog.id,
      totalHours: sleepLog.totalHours,
      qualityPercentage: sleepLog.qualityPercentage,
    });
  } catch (error) {
    console.error('POST /api/sleep/analyze error:', error);
    return NextResponse.json(
      { error: 'Error interno al procesar la imagen' },
      { status: 500 }
    );
  }
}
