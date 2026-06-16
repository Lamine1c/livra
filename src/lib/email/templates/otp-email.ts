const WORDMARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0.76 -92 374.32 100" fill="none" role="img" aria-label="LIVRA" width="120" style="display:block;">
  <title>LIVRA</title>
  <path fill="#0E0E10" d="M62.16 0L8.76 0L8.76-84L21.72-84L21.72-11.76L62.16-11.76L62.16 0Z"></path>
  <path fill="#0E0E10" d="M99 0L86.04 0L86.04-84L99-84L99 0Z"></path>
  <path fill="#0E0E10" d="M168.12 0L145.68 0L122.40-84L135.72-84L156.12-8.16L157.68-8.16L177.96-84L191.40-84L168.12 0Z"></path>
  <path fill="#0E0E10" d="M227.76 0L214.80 0L214.80-84L250.08-84Q257.88-84 263.76-81.24Q269.64-78.48 273-73.50Q276.36-68.52 276.36-61.56L276.36-61.56L276.36-60.24Q276.36-52.32 272.58-47.58Q268.80-42.84 263.40-40.92L263.40-40.92L263.40-39Q267.96-38.76 270.72-35.88Q273.48-33 273.48-27.84L273.48-27.84L273.48 0L260.52 0L260.52-26.04Q260.52-29.28 258.78-31.20Q257.04-33.12 253.32-33.12L253.32-33.12L227.76-33.12L227.76 0ZM227.76-72.24L227.76-44.88L248.64-44.88Q255.60-44.88 259.44-48.36Q263.28-51.84 263.28-58.08L263.28-58.08L263.28-59.04Q263.28-65.16 259.50-68.70Q255.72-72.24 248.64-72.24L248.64-72.24L227.76-72.24Z"></path>
  <path fill="#0E0E10" d="M309.84 0L296.52 0L320.40-84L343.20-84L367.08 0L353.76 0L348.24-19.80L315.36-19.80L309.84 0ZM330.84-75.96L318.60-31.80L345-31.80L332.76-75.96L330.84-75.96Z"></path>
</svg>`;

export function renderOtpEmail(code: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ton code de confirmation LIVRA</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F0E8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#FFFFFF;border-radius:16px;padding:32px;margin-bottom:40px;">
    <div>
      ${WORDMARK_SVG}
    </div>
    <h1 style="font-size:20px;color:#0E0E10;margin-top:24px;margin-bottom:0;font-weight:600;">
      Ton code de confirmation
    </h1>
    <span style="display:block;background:#0E0E10;color:#F5F0E8;font-size:32px;font-family:monospace;letter-spacing:8px;padding:24px;border-radius:12px;text-align:center;margin:24px 0;">
      ${code}
    </span>
    <p style="font-size:14px;color:#8A8A8E;margin:0;">
      Ce code expire dans 10 minutes.
    </p>
    <div style="border-top:1px solid #E5E5E5;margin-top:32px;padding-top:24px;">
      <p style="font-size:12px;color:#8A8A8E;margin:0;">
        Tu reçois cet email parce que tu t'es inscrit·e sur golivra.app. Si ce n'était pas toi, ignore ce message.
      </p>
    </div>
  </div>
</body>
</html>`;
}
