import { NextResponse } from 'next/server';

/**
 * Clean & normalize Roman Urdu text before passing to translation engines
 */
function normalizeRomanUrdu(text) {
  if (!text) return '';
  let str = text;

  // Common Roman Urdu chat abbreviations & spellings normalization
  const replacements = [
    [/\bky\b/gi, 'ke'],
    [/\bkiu\b/gi, 'kyun'],
    [/\bkio\b/gi, 'kyun'],
    [/\bchahiye\b/gi, 'chahiye'],
    [/\bchahye\b/gi, 'chahiye'],
    [/\bkr\b/gi, 'kar'],
    [/\bkrna\b/gi, 'karna'],
    [/\bkrta\b/gi, 'karta'],
    [/\bkrty\b/gi, 'karte'],
    [/\bkrte\b/gi, 'karte'],
    [/\bkri\b/gi, 'kari'],
    [/\bkrein\b/gi, 'karein'],
    [/\bkren\b/gi, 'karein'],
    [/\bhu\b/gi, 'hoon'],
    [/\bhun\b/gi, 'hoon'],
    [/\bhn\b/gi, 'hain'],
    [/\bhy\b/gi, 'hai'],
    [/\bhe\b/gi, 'hai'],
    [/\bni\b/gi, 'nahi'],
    [/\bnahi\b/gi, 'nahi'],
    [/\bnh\b/gi, 'nahi'],
    [/\bmgr\b/gi, 'magar'],
    [/\budr\b/gi, 'udhar'],
    [/\bidr\b/gi, 'idhar'],
    [/\bjb\b/gi, 'jab'],
    [/\btb\b/gi, 'tab'],
    [/\bthx\b/gi, 'shukriya'],
    [/\bpls\b/gi, 'please'],
    [/\bplz\b/gi, 'please']
  ];

  for (const [pattern, rep] of replacements) {
    str = str.replace(pattern, rep);
  }
  return str;
}

/**
 * Translates Roman Urdu or Urdu to English using AI if key exists, else Google Translate
 */
async function translateToEnglish(text) {
  const cleanInput = text.trim();

  // Try Gemini AI if API Key is configured in environment
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const prompt = `You are a professional customer support translator for a gaming platform. Translate the following user message (written in Roman Urdu or Urdu) into clear, polite, and professional English. Preserve all emojis, usernames, cashtags, numbers, and currency symbols (e.g. $50). Output ONLY the translated English text with no extra commentary or quotes.\n\nInput message:\n${cleanInput}`;
      const aiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 250 }
          })
        }
      );
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const aiText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (aiText) return aiText.replace(/^["']|["']$/g, '');
      }
    } catch (e) {
      console.warn('Gemini translate fallback to Google Translate:', e.message);
    }
  }

  const normalized = normalizeRomanUrdu(cleanInput);

  // Strategy 1: Google Translate with sl=hi (Handles Romanized Hindi/Urdu very well)
  try {
    const urlHi = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=hi&tl=en&dt=t&q=${encodeURIComponent(normalized)}`;
    const resHi = await fetch(urlHi, { cache: 'no-store' });
    if (resHi.ok) {
      const dataHi = await resHi.json();
      const translated = dataHi[0]?.map((x) => x[0]).filter(Boolean).join('').trim();
      if (translated && translated.toLowerCase() !== cleanInput.toLowerCase()) {
        return translated;
      }
    }
  } catch (e) {
    console.error('Translation sl=hi error:', e);
  }

  // Strategy 2: Google Translate with sl=auto
  try {
    const urlAuto = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(normalized)}`;
    const resAuto = await fetch(urlAuto, { cache: 'no-store' });
    if (resAuto.ok) {
      const dataAuto = await resAuto.json();
      const translated = dataAuto[0]?.map((x) => x[0]).filter(Boolean).join('').trim();
      if (translated) {
        return translated;
      }
    }
  } catch (e) {
    console.error('Translation sl=auto error:', e);
  }

  // Strategy 3: Google Translate with sl=ur
  try {
    const urlUr = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ur&tl=en&dt=t&q=${encodeURIComponent(cleanInput)}`;
    const resUr = await fetch(urlUr, { cache: 'no-store' });
    if (resUr.ok) {
      const dataUr = await resUr.json();
      const translated = dataUr[0]?.map((x) => x[0]).filter(Boolean).join('').trim();
      if (translated) {
        return translated;
      }
    }
  } catch (e) {
    console.error('Translation sl=ur error:', e);
  }

  return cleanInput;
}

/**
 * Translates English to Urdu Script and extracts Roman Urdu transliteration
 */
async function translateToRomanUrdu(text) {
  const cleanInput = text.trim();

  // Try Gemini AI if API Key is configured in environment
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const prompt = `Translate the following English customer message into natural, easy-to-understand Roman Urdu (Pakistani conversational style) so the support agent can easily understand what the customer wrote. Also provide the Urdu script.\nFormat response in JSON with keys "romanUrdu" and "urdu".\n\nInput message:\n${cleanInput}`;
      const aiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
          })
        }
      );
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const jsonStr = aiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (jsonStr) {
          const parsed = JSON.parse(jsonStr);
          if (parsed.romanUrdu || parsed.urdu) {
            return {
              romanUrdu: parsed.romanUrdu || parsed.urdu,
              urdu: parsed.urdu || parsed.romanUrdu
            };
          }
        }
      }
    } catch (e) {
      console.warn('Gemini translate to roman urdu fallback:', e.message);
    }
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ur&dt=t&dt=rm&q=${encodeURIComponent(cleanInput)}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      let urduScript = '';
      let romanUrdu = '';

      if (Array.isArray(data[0])) {
        urduScript = data[0].map((x) => x[0]).filter(Boolean).join('').trim();

        // Extract transliteration from sub-arrays of data[0]
        for (const block of data[0]) {
          if (Array.isArray(block)) {
            for (const item of block) {
              if (typeof item === 'string' && item.length > 0 && !/[؀-ۿ]/.test(item) && item !== cleanInput) {
                if (!romanUrdu || item.length > romanUrdu.length) {
                  romanUrdu = item.trim();
                }
              }
            }
          }
        }
      }

      // If roman transliteration wasn't found in dt=rm, try sl=en&tl=hi transliteration
      if (!romanUrdu) {
        try {
          const hiUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=hi&dt=t&dt=rm&q=${encodeURIComponent(cleanInput)}`;
          const hiRes = await fetch(hiUrl, { cache: 'no-store' });
          if (hiRes.ok) {
            const hiData = await hiRes.json();
            if (Array.isArray(hiData[0])) {
              for (const block of hiData[0]) {
                if (Array.isArray(block)) {
                  for (const item of block) {
                    if (typeof item === 'string' && item.length > 0 && !/[\u0900-\u097F]/.test(item) && item !== cleanInput) {
                      romanUrdu = item.trim();
                      break;
                    }
                  }
                }
              }
            }
          }
        } catch (_) {}
      }

      return {
        urdu: urduScript || cleanInput,
        romanUrdu: romanUrdu || urduScript || cleanInput
      };
    }
  } catch (e) {
    console.error('Translation to Urdu/Roman error:', e);
  }

  return { urdu: cleanInput, romanUrdu: cleanInput };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { text, direction = 'to_english' } = body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ success: false, message: 'Text is required for translation.' }, { status: 400 });
    }

    if (direction === 'to_english') {
      const english = await translateToEnglish(text);
      return NextResponse.json({
        success: true,
        direction,
        original: text,
        translation: english
      });
    } else if (direction === 'to_roman_urdu' || direction === 'to_urdu') {
      const result = await translateToRomanUrdu(text);
      return NextResponse.json({
        success: true,
        direction,
        original: text,
        romanUrdu: result.romanUrdu,
        urdu: result.urdu,
        translation: result.romanUrdu || result.urdu
      });
    } else {
      // Auto-detect direction
      if (/[؀-ۿ]/.test(text)) {
        const english = await translateToEnglish(text);
        return NextResponse.json({ success: true, direction: 'to_english', original: text, translation: english });
      } else {
        const english = await translateToEnglish(text);
        const urduResult = await translateToRomanUrdu(text);
        return NextResponse.json({
          success: true,
          direction: 'both',
          original: text,
          english,
          romanUrdu: urduResult.romanUrdu,
          urdu: urduResult.urdu
        });
      }
    }
  } catch (error) {
    console.error('Translate API Route Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Translation service failed.' },
      { status: 500 }
    );
  }
}
