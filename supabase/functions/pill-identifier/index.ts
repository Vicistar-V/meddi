import { corsHeaders } from "../_shared/cors.ts";

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();

    if (!image) {
      throw new Error('No image provided');
    }

    console.log('Analyzing pill image with Lovable AI...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a medical pill identification AI assistant. Analyze images of pills and provide identification information. 
            
Your response MUST be in this exact JSON format:
{
  "identified": true/false,
  "name": "pill name or 'Unknown'",
  "confidence": 0.0-1.0,
  "description": "brief description",
  "warning": "safety warning if applicable"
}

Rules:
- Only identify if you're confident (>70%)
- If uncertain, set identified=false and name="Unknown"
- Include generic descriptions for common pills
- Always include safety warnings about confirming with pharmacist
- Be concise and clear`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Identify this pill. Provide the medication name if recognizable, otherwise indicate it cannot be identified.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error('Failed to analyze image');
    }

    const result = await response.json();
    const aiResponse = result.choices?.[0]?.message?.content;

    console.log('AI Response:', aiResponse);

    // Parse the JSON response from the AI
    let parsedResult;
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback response
      parsedResult = {
        identified: false,
        name: 'Unknown',
        confidence: 0,
        description: 'Unable to identify the pill from the image.',
        warning: 'Please consult a pharmacist or use the prescription label for identification.'
      };
    }

    return new Response(
      JSON.stringify(parsedResult),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in pill-identifier:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        identified: false,
        name: 'Unknown',
        confidence: 0
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
