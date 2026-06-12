import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/meals/analyze
// Receives a FormData with a food photo, sends to Gemini Vision, returns calorie estimation
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;
    const mealType = (formData.get('mealType') as string) || 'LUNCH';

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
                  text: `Eres un nutricionista experto. Analiza esta foto de comida y estima los valores nutricionales.

Identifica todos los alimentos visibles y estima:
1. Descripción breve de la comida (en español, máximo 50 caracteres)
2. Calorías totales estimadas (kcal)
3. Proteína (gramos)
4. Carbohidratos (gramos)
5. Grasa (gramos)
6. Lista de alimentos identificados

Sé preciso pero si no puedes ver bien algo, da tu mejor estimación basada en porciones típicas españolas.

Responde SOLAMENTE con un JSON válido, sin markdown ni texto extra:
{"description": "<string>", "estimatedCalories": <number>, "protein": <number>, "carbs": <number>, "fat": <number>, "items": ["<item1>", "<item2>"]}`,
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
            temperature: 0.2,
            maxOutputTokens: 500,
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
        { error: 'No se pudo analizar la comida' },
        { status: 422 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Save to database
    const mealLog = await prisma.mealLog.create({
      data: {
        description: String(parsed.description || 'Comida'),
        estimatedCalories: Math.round(Number(parsed.estimatedCalories) || 0),
        protein: Number(parsed.protein) || 0,
        carbs: Number(parsed.carbs) || 0,
        fat: Number(parsed.fat) || 0,
        mealType,
        rawAiResponse: responseText,
      },
    });

    return NextResponse.json({
      id: mealLog.id,
      description: mealLog.description,
      estimatedCalories: mealLog.estimatedCalories,
      protein: mealLog.protein,
      carbs: mealLog.carbs,
      fat: mealLog.fat,
      items: parsed.items || [],
      mealType: mealLog.mealType,
      createdAt: mealLog.createdAt,
    });
  } catch (error) {
    console.error('POST /api/meals/analyze error:', error);
    return NextResponse.json(
      { error: 'Error interno al procesar la imagen' },
      { status: 500 }
    );
  }
}
