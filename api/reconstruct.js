import formidable from 'formidable';
import fs from 'fs';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: err.message });

    const imageFile = fs.readFileSync(files.image.filepath);

    const GEMINI_URL = 'https://api.gemini.ai/reconstruct';

    try {
      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`,
          'Content-Type': 'application/octet-stream'
        },
        body: imageFile
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ error: errorText });
      }

      const result = await response.json();

      if (!result.modelUrl) {
        return res.status(500).json({ error: "Gemini did not return model URL" });
      }

      res.status(200).json({ modelUrl: result.modelUrl });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });
}
