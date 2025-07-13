import fetch from 'node-fetch'; // You might need to install node-fetch later if it's not default on Vercel functions, but it usually is.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { prompt, text } = req.body; // Expecting either 'prompt' for GPT or 'text' for ElevenLabs

  if (prompt) {
    // Handle OpenAI (GPT) call
    const openaiApiKey = process.env.OPENAI_API_KEY; // This is where we use the secret!
    if (!openaiApiKey) {
      return res.status(500).json({ message: 'OpenAI API key not configured.' });
    }

    try {
      const openaiResp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'You generate event announcements and songs.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7
        })
      });
      const data = await openaiResp.json();
      return res.status(openaiResp.status).json(data);
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      return res.status(500).json({ message: 'Error calling OpenAI API.' });
    }
  } else if (text) {
    // Handle ElevenLabs call
    const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY; // This is where we use the secret!
    if (!elevenlabsApiKey) {
      return res.status(500).json({ message: 'ElevenLabs API key not configured.' });
    }

    try {
      const elevenlabsResp = await fetch('https://api.elevenlabs.io/v1/text-to-speech/Will', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': elevenlabsApiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8
          }
        })
      });

      if (!elevenlabsResp.ok) {
        const errorText = await elevenlabsResp.text();
        throw new Error(`ElevenLabs API error: ${elevenlabsResp.status} - ${errorText}`);
      }

      const audioBlob = await elevenlabsResp.blob();
      res.setHeader('Content-Type', 'audio/mpeg'); // Or 'audio/wav', depending on ElevenLabs output
      res.setHeader('Content-Disposition', 'attachment; filename="announcement.mp3"');
      audioBlob.arrayBuffer().then(buffer => res.send(Buffer.from(buffer)));

    } catch (error) {
      console.error('ElevenLabs API call failed:', error);
      return res.status(500).json({ message: 'Error calling ElevenLabs API.' });
    }
  } else {
    return res.status(400).json({ message: 'Missing prompt or text in request body.' });
  }
}