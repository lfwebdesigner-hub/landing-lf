// Função serverless (Vercel). Roda no servidor: o token nunca vai para o navegador.
// Variáveis de ambiente necessárias: IG_USER_ID e IG_ACCESS_TOKEN
const GRAPH = 'https://graph.facebook.com/v25.0'; // confira a versão atual na documentação da Meta

module.exports = async (req, res) => {
  const { IG_USER_ID, IG_ACCESS_TOKEN } = process.env;
  if (!IG_USER_ID || !IG_ACCESS_TOKEN) {
    return res.status(500).json({ error: 'Variáveis de ambiente não configuradas' });
  }

  const get = async (path, params) => {
    const qs = new URLSearchParams({ ...params, access_token: IG_ACCESS_TOKEN });
    const r = await fetch(`${GRAPH}/${IG_USER_ID}${path}?${qs}`);
    if (!r.ok) throw new Error(`Graph API ${r.status}`);
    return r.json();
  };

  const until = Math.floor(Date.now() / 1000);
  const since = until - 30 * 24 * 60 * 60;

  try {
    const [profile, insights] = await Promise.all([
      get('', { fields: 'followers_count,media_count' }),
      get('/insights', {
        metric: 'reach,total_interactions',
        metric_type: 'total_value',
        period: 'day',
        since,
        until,
      }).catch(() => ({ data: [] })), // se os insights falharem, o resto continua funcionando
    ]);

    const val = (name) => insights.data.find((m) => m.name === name)?.total_value?.value ?? null;
    const reach = val('reach');
    const interactions = val('total_interactions');

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(200).json({
      followers: profile.followers_count,
      posts: profile.media_count,
      reach,
      // engajamento = interações dos últimos 30 dias / alcance (mude a fórmula se preferir)
      engagement: reach && interactions != null ? interactions / reach : null,
    });
  } catch (err) {
    res.status(502).json({ error: 'Falha ao consultar o Instagram' });
  }
};
