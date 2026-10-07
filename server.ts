import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
        model: 'gemini-2.5-flash',
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
