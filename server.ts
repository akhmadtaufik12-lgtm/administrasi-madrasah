import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { PDFParse } from 'pdf-parse';
import { OFFICIAL_ASC_SCHEDULES } from './src/data/officialSchedules';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'Administrasi Madrasah' });
  });

  // AI Assistant endpoint for Teachers (RPP, Exam Questions, Reflections)
  app.post('/api/ai-assistant', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY tidak dikonfigurasi' });
      }

      const { prompt, type, subject, className, topic, schoolName } = req.body;

      const ai = new GoogleGenAI({ apiKey });

      const targetSchool = schoolName || 'Madrasah Tsanawiyah';
      let systemInstruction = `Anda adalah Asisten Pakar Administrasi Pembelajaran Guru Madrasah Tsanawiyah (${targetSchool}).
Anda membantu guru membuat Modul Ajar / RPP Kurikulum Merdeka / K13, membuat Soal Ujian/AKM, Menyusun Rubrik Penilaian, atau Refleksi Pembelajaran.
Gunakan Bahasa Indonesia yang santun, profesional, dan sesuai standar Kementerian Agama (Kemenag) dan Kemendikbudristek.`;

      if (type === 'rpp') {
        systemInstruction += ` Buatkan Modul Ajar ringkas dan tepat sasaran untuk Mata Pelajaran: ${subject}, Kelas: ${className}, Topik: ${topic}. Sertakan Capaian Pembelajaran, Tujuan Pembelajaran, Langkah Kegiatan (Pendahuluan, Inti, Penutup), dan Asesmen.`;
      } else if (type === 'quiz') {
        systemInstruction += ` Buatkan 5 Soal Pilihan Ganda dan 2 Soal Uraian beserta Kunci Jawaban untuk Mata Pelajaran: ${subject}, Kelas: ${className}, Topik: ${topic}.`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt || `Buatkan perencanaan pembelajaran untuk ${subject} kelas ${className} topik ${topic}`,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      res.json({ result: response.text });
    } catch (err: any) {
      console.error('Error in /api/ai-assistant:', err);
      res.status(500).json({ error: err?.message || 'Gagal memproses permintaan AI' });
    }
  });

  // Helper function: Heuristic text parser for timetable tables
  function parseTimetableFromRawText(rawText: string) {
    const slots: any[] = [];
    const validDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    let currentDay = 'Senin';

    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      const lineUp = line.toUpperCase();
      for (const d of validDays) {
        if (lineUp === d.toUpperCase() || lineUp.startsWith(`HARI ${d.toUpperCase()}`) || lineUp.includes(`JADWAL ${d.toUpperCase()}`)) {
          currentDay = d;
          break;
        }
      }

      // Check for tabular schedule pattern: e.g. "Senin, VII A, Jam 1-2, Matematika, Budi"
      const parts = line.split(/[;,\t|]/).map(p => p.trim()).filter(Boolean);
      if (parts.length >= 4) {
        const potentialClass = parts.find(p => /^(VII|VIII|IX|[789])\s*[- ]?[A-Z]/i.test(p));
        const potentialMapel = parts.find(p => p.length > 2 && !/^(VII|VIII|IX|[789]|Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Jam)/i.test(p));
        if (potentialClass && potentialMapel) {
          slots.push({
            day: currentDay,
            className: potentialClass.toUpperCase(),
            periodNumber: 'Jam 1 - 2 (07.15 - 08.25 WIB)',
            periodKey: '1-2',
            periodStartHour: 1,
            periodEndHour: 2,
            subjectName: potentialMapel,
            teacherName: parts[parts.length - 1] !== potentialMapel ? parts[parts.length - 1] : ''
          });
        }
      }
    }
    return slots;
  }

  // aSc Timetables & custom PDF schedule parsing endpoint
  app.post('/api/parse-schedule-pdf', async (req, res) => {
    try {
      const { pdfBase64, fileName, isPreset } = req.body;

      // Only load official preset if user explicitly requested preset
      if (isPreset === true) {
        return res.json({
          success: true,
          count: OFFICIAL_ASC_SCHEDULES.length,
          method: 'official-asc-preset',
          schedules: OFFICIAL_ASC_SCHEDULES
        });
      }

      if (!pdfBase64) {
        return res.status(400).json({ success: false, error: 'Data file PDF tidak ditemukan' });
      }

      const cleanBase64 = String(pdfBase64).replace(/^data:application\/pdf;base64,/, '').trim();
      const pdfBuffer = Buffer.from(cleanBase64, 'base64');

      // 1. Extract text using pdf-parse
      let pdfText = '';
      let numPages = 1;
      try {
        const parser = new PDFParse({ data: pdfBuffer });
        const textResult = await parser.getText();
        pdfText = textResult?.text || '';
        numPages = textResult?.pages?.length || 1;
        await parser.destroy();
      } catch (e: any) {
        console.warn('pdf-parse text extraction warning:', e?.message || e);
      }

      let parsedSlots: any[] = [];
      const apiKey = process.env.GEMINI_API_KEY;

      const systemPrompt = `You are an expert school schedule parser.
Analyze this PDF document which contains a school timetable / schedule (Jadwal Pelajaran).
Extract EVERY class session and timetable entry into a clean structured JSON array.
Document format might be:
- aSc Timetables matrix (often 1 page per day: SENIN, SELASA, RABU, KAMIS, JUMAT/JUM'AT, SABTU, with classes as rows and lesson periods 1 to 8 as columns).
- Or standard table format with columns: Hari, Jam Ke / Waktu, Kelas, Mata Pelajaran, Guru Pengajar.
- Or grid format with lesson slots containing subject name and teacher name.

Rules:
1. Extract the actual days (Senin, Selasa, Rabu, Kamis, Jumat, or Sabtu).
2. Extract the class names (e.g., VII A, VII B, VIII A, VIII B, IX A, etc. Normalize to standard Roman numeral format like "VII A", "VIII B", "IX C").
3. For lesson periods:
   - If double periods have the same subject and teacher, group them (e.g. periodKey "1-2", "3-4", "5-6", "7-8") with periodNumber e.g. "Jam 1 - 2 (07.15 - 08.25 WIB)".
   - For single periods, use periodKey "1", "2", etc., and periodNumber e.g. "Jam 1".
   - Include periodStartHour and periodEndHour (numbers 1-8).
4. Extract the exact subject name (e.g. "Bahasa Indonesia", "Matematika", "IPA", "IPS", "Al-Qur'an Hadits", "Fikih", etc.).
5. Extract the teacher name (Guru Pengajar) if present in the slot.
6. OMIT empty slots, break times (Istirahat), and flag ceremonies (Upacara Bendera).

Return JSON array only:
[
  {
    "day": "Senin",
    "className": "VII A",
    "periodNumber": "Jam 1 - 2 (07.15 - 08.25 WIB)",
    "periodKey": "1-2",
    "periodStartHour": 1,
    "periodEndHour": 2,
    "subjectName": "Ilmu Pengetahuan Sosial",
    "teacherName": "Maulida, S.Pd"
  }
]`;

      // 2. Try Gemini 3.8 Flash for AI schedule extraction
      if (apiKey) {
        const ai = new GoogleGenAI({ apiKey });

        // Helper to extract JSON array safely from model text
        const safeExtractJsonArray = (text?: string): any[] => {
          if (!text) return [];
          const cleaned = text.trim();
          try {
            const parsed = JSON.parse(cleaned);
            if (Array.isArray(parsed)) return parsed;
            if (parsed && Array.isArray(parsed.schedules)) return parsed.schedules;
          } catch (_) {
            // Find [ ... ] substring if markdown wrappers exist
            const startIdx = cleaned.indexOf('[');
            const endIdx = cleaned.lastIndexOf(']');
            if (startIdx !== -1 && endIdx > startIdx) {
              try {
                const sub = cleaned.substring(startIdx, endIdx + 1);
                const parsed = JSON.parse(sub);
                if (Array.isArray(parsed)) return parsed;
              } catch (e2) {
                console.warn('Fallback JSON slice parse failed:', e2);
              }
            }
          }
          return [];
        };

        // Attempt 2A: Direct PDF inline data
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      mimeType: 'application/pdf',
                      data: cleanBase64
                    }
                  },
                  { text: systemPrompt }
                ]
              }
            ],
            config: {
              responseMimeType: 'application/json',
              temperature: 0.1
            }
          });

          const candidate = safeExtractJsonArray(response.text);
          if (candidate.length > 0) {
            parsedSlots = candidate;
          }
        } catch (geminiPdfErr: any) {
          console.warn('Gemini direct PDF inlineData parse failed:', geminiPdfErr?.message);
        }

        // Attempt 2B: If direct PDF failed, feed extracted text to Gemini
        if (parsedSlots.length === 0 && pdfText.trim().length > 20) {
          try {
            const response = await ai.models.generateContent({
              model: 'gemini-3.8-flash',
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      text: `${systemPrompt}\n\nBerikut teks yang diekstrak dari dokumen PDF Jadwal Pelajaran:\n${pdfText.slice(0, 40000)}`
                    }
                  ]
                }
              ],
              config: {
                responseMimeType: 'application/json',
                temperature: 0.1
              }
            });

            const candidate = safeExtractJsonArray(response.text);
            if (candidate.length > 0) {
              parsedSlots = candidate;
            }
          } catch (textAiErr: any) {
            console.warn('Gemini text-based parse failed:', textAiErr?.message);
          }
        }
      }

      // 3. Fallback: Heuristic text parser
      if (parsedSlots.length === 0 && pdfText.trim().length > 20) {
        parsedSlots = parseTimetableFromRawText(pdfText);
      }

      // 4. Return results if schedules were extracted from the uploaded PDF
      if (parsedSlots.length > 0) {
        return res.json({
          success: true,
          count: parsedSlots.length,
          numPages,
          method: 'ai-pdf-parser',
          schedules: parsedSlots
        });
      }

      // If nothing could be extracted from PDF (e.g. scanned image with no OCR/text or unreadable layout)
      return res.status(422).json({
        success: false,
        error: 'Dokumen PDF tidak memuat teks jadwal yang dapat diekstrak (kemungkinan berupa hasil foto/scan gambar atau format tidak dikenali). Silakan upload file XML / Excel aSc Timetables (.xml / .xlsx / .csv), atau gunakan fitur "Salin & Tempel" untuk memasukkan jadwal Anda.'
      });
    } catch (err: any) {
      console.error('Error in /api/parse-schedule-pdf:', err);
      res.status(500).json({ success: false, error: err?.message || 'Gagal memproses file PDF' });
    }
  });

  // XML Schedule Parser endpoint (aSc Timetables XML export / FET / XML Spreadsheet)
  app.post('/api/parse-schedule-xml', async (req, res) => {
    try {
      const { xmlContent, fileName } = req.body;
      if (!xmlContent || typeof xmlContent !== 'string') {
        return res.status(400).json({ success: false, error: 'Data file XML tidak ditemukan' });
      }

      let parsedSlots: any[] = [];
      const apiKey = process.env.GEMINI_API_KEY;

      if (apiKey) {
        try {
          const ai = new GoogleGenAI({});
          const prompt = `You are an expert school schedule parser for Indonesian schools (MTs / SMP / SMA / Madrasah).
Analyze this XML timetable file (${fileName || 'jadwal.xml'}). It is an XML export from timetable software like aSc Timetables XML, FET Timetable XML, or Microsoft Excel XML.
Extract ALL teaching class periods and timetable schedule items into a JSON array of objects.

Each entry in the array must be an object with the following fields:
- "day": string, one of "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"
- "className": string, e.g. "VII A", "VII B", "VIII A", "VIII B", "IX A", "IX B", etc. (normalize Roman numerals VII, VIII, IX)
- "subjectName": string, e.g. "Matematika", "Bahasa Indonesia", "IPA", "IPS", "Al-Qur'an Hadits", "Fiqih", "Bahasa Inggris", "Pendidikan Agama Islam", etc.
- "teacherName": string, the teacher name (e.g. "Drs. Ahmad Fauzi", "Siti Aminah, S.Pd", or "Guru Pengajar" if unassigned)
- "periodNumber": string, e.g. "Jam 1 - 2 (07.15 - 08.25 WIB)", "Jam 3 - 4", or "Jam 1"
- "periodKey": string, "1-2", "3-4", "5-6", "7-8", "1", "2", "3", etc.
- "periodStartHour": number, start period (1 to 8)
- "periodEndHour": number, end period (1 to 8)

Extract as many valid lesson slots as exist in the file.
Return ONLY valid JSON array with no conversational response or markdown text.

XML Content:
${xmlContent.slice(0, 100000)}
`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json'
            }
          });

          const respText = response.text?.trim() || '';
          if (respText) {
            try {
              const cleaned = respText.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
              const parsed = JSON.parse(cleaned);
              if (Array.isArray(parsed) && parsed.length > 0) {
                parsedSlots = parsed;
              }
            } catch (jsonErr) {
              console.warn('JSON parse error from Gemini XML result:', jsonErr);
            }
          }
        } catch (geminiErr: any) {
          console.warn('Gemini XML parsing warning:', geminiErr?.message || geminiErr);
        }
      }

      if (parsedSlots.length > 0) {
        return res.json({
          success: true,
          count: parsedSlots.length,
          method: 'gemini-xml-parser',
          schedules: parsedSlots
        });
      }

      return res.status(422).json({
        success: false,
        error: 'Tidak ditemukan data jadwal pelajaran yang valid di dalam file XML ini. Pastikan file merupakan ekspor aSc Timetables (.xml) atau tabel jadwal sekolah.'
      });
    } catch (err: any) {
      console.error('Error in /api/parse-schedule-xml:', err);
      res.status(500).json({ success: false, error: err?.message || 'Gagal memproses file XML' });
    }
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
