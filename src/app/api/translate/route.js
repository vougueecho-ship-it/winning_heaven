import { NextResponse } from 'next/server';

/**
 * Clean & normalize Roman Urdu text before passing to translation engines
 */
function normalizeRomanUrdu(text) {
  if (!text) return '';
  let str = text;

  // Common Roman Urdu chat abbreviations & spellings normalization
  const replacements = [
    [/\byr\b/gi, 'yaar'],
    [/\bky\b/gi, 'ke'],
    [/\bkiu\b/gi, 'kyun'],
    [/\bkio\b/gi, 'kyun'],
    [/\bchahiye\b/gi, 'chahiye'],
    [/\bchahye\b/gi, 'chahiye'],
    [/\bkr\b/gi, 'kar'],
    [/\bkro\b/gi, 'karo'],
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
    [/\bnh\b/gi, 'nahi'],
    [/\bnahe\b/gi, 'nahi'],
    [/\bmgr\b/gi, 'magar'],
    [/\budr\b/gi, 'udhar'],
    [/\bidr\b/gi, 'idhar'],
    [/\bjb\b/gi, 'jab'],
    [/\btb\b/gi, 'tab'],
    [/\bthx\b/gi, 'shukriya'],
    [/\bpls\b/gi, 'please'],
    [/\bplz\b/gi, 'please'],
    [/\bacc\b/gi, 'account'],
    [/\bmsg\b/gi, 'message'],
    [/\bdia\b/gi, 'diya'],
    [/\bdya\b/gi, 'diya'],
    [/\bgya\b/gi, 'gaya'],
    [/\bgia\b/gi, 'gaya']
  ];

  for (const [pattern, rep] of replacements) {
    str = str.replace(pattern, rep);
  }
  return str;
}

/**
 * Naturalize Roman Hindi transliteration into standard Pakistani Roman Urdu
 */
function naturalizeRomanUrdu(text) {
  if (!text) return '';
  return text
    .replace(/\bkripya\b/gi, 'please')
    .replace(/\bkrpya\b/gi, 'please')
    .replace(/\bmadhyam se\b/gi, 'ke zariye')
    .replace(/\bmadhyam\b/gi, 'zariye')
    .replace(/\bkhate\b/gi, 'account')
    .replace(/\bkhaata\b/gi, 'account')
    .replace(/\bkhaate\b/gi, 'account')
    .replace(/\bjoden\b/gi, 'add karein')
    .replace(/\bjodein\b/gi, 'add karein')
    .replace(/\bjod\b/gi, 'add')
    .replace(/\bjanch\b/gi, 'check')
    .replace(/\bjanchen\b/gi, 'check karein')
    .replace(/\bjaanch\b/gi, 'check')
    .replace(/\bnamskar\b/gi, 'salam')
    .replace(/\bnamaste\b/gi, 'salam')
    .replace(/\bdhanayavad\b/gi, 'shukriya')
    .replace(/\bdhanyavad\b/gi, 'shukriya')
    .replace(/\bsikke\b/gi, 'coins')
    .replace(/\bsikkon\b/gi, 'coins')
    .replace(/\bvapas\b/gi, 'wapas')
    .replace(/\bvapsi\b/gi, 'wapsi')
    .replace(/\bshulk\b/gi, 'fee')
    .replace(/\bkare\b/gi, 'karein')
    .replace(/\bhain\b/gi, 'hain')
    .replace(/\bhan\b/gi, 'hain')
    .replace(/\bmain\b/gi, 'main')
    .trim();
}

/**
 * Translates Roman Urdu or Urdu to English using high-accuracy multi-tier engines
 */
async function translateToEnglish(text) {
  const cleanInput = text.trim();
  const normalized = normalizeRomanUrdu(cleanInput);

  // Strategy 1: If Gemini API Key exists
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const prompt = `You are a support translator. Translate this customer or agent message (written in Roman Urdu or Urdu) into clear, polite, natural English. Keep all numbers, names, cashtags, currencies (e.g. $20) intact. Output ONLY the English translation without quotes or extra text.\n\nMessage: ${cleanInput}`;
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
        if (aiText && aiText.toLowerCase() !== cleanInput.toLowerCase()) {
          return aiText.replace(/^["']|["']$/g, '');
        }
      }
    } catch (e) {
      console.warn('Gemini translate error:', e.message);
    }
  }

  // Strategy 2: Dual Transliteration Pipeline (Google InputTools Roman Urdu -> Urdu Script -> English)
  try {
    const itUrl = `https://inputtools.google.com/request?text=${encodeURIComponent(normalized)}&itc=ur-t-i0-und&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`;
    const itRes = await fetch(itUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      cache: 'no-store'
    });
    if (itRes.ok) {
      const itData = await itRes.json();
      const urduScript = itData[1]?.[0]?.[1]?.[0];
      if (urduScript && urduScript !== normalized) {
        const tUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ur&tl=en&dt=t&q=${encodeURIComponent(urduScript)}`;
        const tRes = await fetch(tUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
          cache: 'no-store'
        });
        if (tRes.ok) {
          const tData = await tRes.json();
          const translated = tData[0]?.map((x) => x[0]).filter(Boolean).join('').trim();
          if (translated && translated.toLowerCase() !== cleanInput.toLowerCase()) {
            return translated;
          }
        }
      }
    }
  } catch (e) {
    console.warn('InputTools Urdu transliteration error:', e.message);
  }

  // Strategy 3: Google InputTools with Hindi Transliteration -> English
  try {
    const itHiUrl = `https://inputtools.google.com/request?text=${encodeURIComponent(normalized)}&itc=hi-t-i0-und&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`;
    const itHiRes = await fetch(itHiUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      cache: 'no-store'
    });
    if (itHiRes.ok) {
      const itHiData = await itHiRes.json();
      const hiScript = itHiData[1]?.[0]?.[1]?.[0];
      if (hiScript && hiScript !== normalized) {
        const tUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=hi&tl=en&dt=t&q=${encodeURIComponent(hiScript)}`;
        const tRes = await fetch(tUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
          cache: 'no-store'
        });
        if (tRes.ok) {
          const tData = await tRes.json();
          const translated = tData[0]?.map((x) => x[0]).filter(Boolean).join('').trim();
          if (translated && translated.toLowerCase() !== cleanInput.toLowerCase()) {
            return translated;
          }
        }
      }
    }
  } catch (e) {
    console.warn('InputTools Hindi transliteration error:', e.message);
  }

  // Strategy 4: Google Translate Direct with sl=hi / sl=auto
  try {
    const urlHi = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=hi&tl=en&dt=t&q=${encodeURIComponent(normalized)}`;
    const resHi = await fetch(urlHi, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      cache: 'no-store'
    });
    if (resHi.ok) {
      const dataHi = await resHi.json();
      const translated = dataHi[0]?.map((x) => x[0]).filter(Boolean).join('').trim();
      if (translated && translated.toLowerCase() !== cleanInput.toLowerCase()) {
        return translated;
      }
    }
  } catch (e) {
    console.warn('GTX sl=hi error:', e.message);
  }

  // Strategy 5: MyMemory API Fallback
  try {
    const memUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(normalized)}&langpair=ur|en`;
    const memRes = await fetch(memUrl, { cache: 'no-store' });
    if (memRes.ok) {
      const memData = await memRes.json();
      const memTrans = memData?.responseData?.translatedText?.trim();
      if (memTrans && memTrans.toLowerCase() !== cleanInput.toLowerCase() && !memTrans.includes('MYMEMORY WARNING')) {
        return memTrans;
      }
    }
  } catch (e) {
    console.warn('MyMemory fallback error:', e.message);
  }

  return cleanInput;
}

/**
 * Translates English to Roman Urdu (and Urdu script)
 */
async function translateToRomanUrdu(text) {
  const cleanInput = text.trim();

  // Strategy 1: Gemini AI
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const prompt = `Translate this English customer message into natural conversational Pakistani Roman Urdu (easy to read) and Urdu script. Output JSON with format: {"romanUrdu": "...", "urdu": "..."}\n\nMessage: ${cleanInput}`;
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
      console.warn('Gemini translate to roman urdu error:', e.message);
    }
  }

  // Strategy 2: Google Translate with transliteration (sl=en&tl=hi&dt=rm)
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&dt=rm&q=${encodeURIComponent(cleanInput)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      let urduScript = '';
      let rawRoman = '';

      if (Array.isArray(data[0])) {
        urduScript = data[0][0]?.[0] || '';
        rawRoman = data[0][1]?.[2] || data[0][1]?.[3] || data[0][0]?.[1] || '';
      }

      // Also try fetching Urdu script for accurate Urdu script
      try {
        const urUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ur&dt=t&q=${encodeURIComponent(cleanInput)}`;
        const urRes = await fetch(urUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
          cache: 'no-store'
        });
        if (urRes.ok) {
          const urData = await urRes.json();
          const actualUrdu = urData[0]?.map((x) => x[0]).join('').trim();
          if (actualUrdu) urduScript = actualUrdu;
        }
      } catch (_) {}

      const cleanRoman = naturalizeRomanUrdu(rawRoman) || urduScript || cleanInput;

      return {
        urdu: urduScript || cleanInput,
        romanUrdu: cleanRoman
      };
    }
  } catch (e) {
    console.error('Translation to Roman Urdu error:', e);
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
        translation: result.romanUrdu
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid translation direction.' }, { status: 400 });
  } catch (err) {
    console.error('POST /api/translate error:', err);
    return NextResponse.json({ success: false, message: 'Internal translation error.' }, { status: 500 });
  }
}
