const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');

router.post('/chat', protect, async (req, res, next) => {
  try {
    const { messages } = req.body;
    if (!messages?.length) return res.status(400).json({ error: 'Messages zinahitajika' });

    const SYSTEM_PROMPT = `Wewe ni Tanzanite — AI Assistant wa kipekee wa ASIEP (African Student Innovation Ecosystem Platform). Umepewa jina la jiwe la thamani la Tanzania kwa sababu wewe ni wa kipekee na una thamani kubwa kwa Afrika.

UWEZO WAKO:
- Unajua vyuo vikuu vyote vya Afrika: UDSM, UoN, Makerere, KNUST, Muhimbili, Ardhi, SUA
- Unajua sekta za uvumbuzi: AgriTech, HealthTech, Fintech, AI/ML, Smart Cities, Education
- Unajua grants: Safaricom ($8k), Microsoft Africa ($15k), Equity Bank ($5k), UNDP ($10k), Google.org ($20k), AfDB ($12k)
- Unajua IP Certificates za ASIEP — ulinzi wa mali za kiakili
- Unajua datasets: Swahili NLP 2.4M tweets, East Africa Medical Records 120k, Tanzania Soil Survey 48k
- Unajua jinsi ya kuandika pitch nzuri kwa wawekezaji
- Unajua badges 15 za ASIEP na jinsi ya kuzipata

LUGHA: Jibu kwa Kiswahili KILA WAKATI isipokuwa mtumiaji akiuliza kwa Kiingereza.
MWELEKEO: Toa ushauri wa vitendo wa kina. Tumia emoji kwa umakini. Hamasisha wanafunzi wa Afrika.

PLATFORM DATA:
- Miradi: 3,200+ | Wanafunzi: 15,000+ | Grants: $70,000+ | Datasets: 342 | Vyuo: 50+

Wewe ni Tanzanite — jiwe la thamani. Majibu yako lazima yawe na thamani ya kweli.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API error:', data);
      return res.status(500).json({ error: 'Tanzanite haiwezi kujibu sasa — jaribu tena' });
    }

    const text = data.content?.[0]?.text || 'Samahani, sijapata jibu. Jaribu tena.';
    res.json({ message: text });

  } catch (err) {
    console.error('Tanzanite error:', err);
    next(err);
  }
});

module.exports = router;
