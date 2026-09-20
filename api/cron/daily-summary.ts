/**
 * Vercel Cron job: daily Alpaca paper-trading summary -> ntfy push notification.
 *
 * Runs once per day after market close (see vercel.json "crons").
 * Reads APCA_API_KEY_ID / APCA_API_SECRET_KEY (Production env vars),
 * fetches the paper account + positions, and POSTs a short summary to ntfy.
 */

const PAPER_API = "https://paper-api.alpaca.markets";

interface VercelRequest {
  headers: Record<string, string | string[] | undefined>;
}

interface VercelResponse {
  status(code: number): VercelResponse;
  json(body: unknown): void;
}

interface AlpacaAccount {
  equity: string;
  last_equity: string;
  cash: string;
}

interface AlpacaPosition {
  symbol: string;
  qty: string;
  side: string;
  avg_entry_price: string;
  current_price: string;
  unrealized_pl: string;
  unrealized_plpc: string;
}

async function alpaca<T>(path: string, keyId: string, secret: string): Promise<T> {
  const res = await fetch(`${PAPER_API}${path}`, {
    headers: {
      "APCA-API-KEY-ID": keyId,
      "APCA-API-SECRET-KEY": secret,
    },
  });
  if (!res.ok) {
    throw new Error(`Alpaca ${path} responded ${res.status}`);
  }
  return (await res.json()) as T;
}

function money(n: number): string {
  return `$${Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function signedMoney(n: number): string {
  return `${n < 0 ? "-" : "+"}${money(n)}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // Vercel Cron sends this header automatically when CRON_SECRET is configured.
  const cronSecret = process.env["CRON_SECRET"];
  if (cronSecret) {
    const auth = req.headers["authorization"];
    const header = Array.isArray(auth) ? auth[0] : auth;
    if (header !== `Bearer ${cronSecret}`) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
  }

  const keyId = process.env["APCA_API_KEY_ID"];
  const secret = process.env["APCA_API_SECRET_KEY"];
  const topic = process.env["NTFY_TOPIC"];
  if (!keyId || !secret || !topic) {
    res.status(500).json({ error: "missing environment variables" });
    return;
  }

  try {
    const [account, positions] = await Promise.all([
      alpaca<AlpacaAccount>("/v2/account", keyId, secret),
      alpaca<AlpacaPosition[]>("/v2/positions", keyId, secret),
    ]);

    const equity = parseFloat(account.equity);
    const dayPnl = equity - parseFloat(account.last_equity);

    const lines: string[] = [
      `Equity ${money(equity)} (${signedMoney(dayPnl)} today)`,
      `Cash ${money(parseFloat(account.cash))}`,
      "",
    ];

    if (positions.length === 0) {
      lines.push("No open positions.");
    } else {
      lines.push(`Positions (${positions.length}):`);
      for (const p of positions) {
        const qty = parseFloat(p.qty);
        const pl = parseFloat(p.unrealized_pl);
        const plpc = parseFloat(p.unrealized_plpc) * 100;
        const side = p.side === "short" ? "short " : "";
        lines.push(
          `${p.symbol} ${side}${qty} sh @ ${money(parseFloat(p.avg_entry_price))} -> ${money(parseFloat(p.current_price))} (${signedMoney(pl)}, ${plpc >= 0 ? "+" : ""}${plpc.toFixed(2)}%)`,
        );
      }
    }

    const ntfyRes = await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
      method: "POST",
      headers: {
        Title: "Paper trading - daily summary",
        Tags: "chart_with_upwards_trend",
      },
      body: lines.join("\n"),
    });
    if (!ntfyRes.ok) {
      throw new Error(`ntfy responded ${ntfyRes.status}`);
    }

    res.status(200).json({ ok: true, positions: positions.length });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "unknown error" });
  }
}
