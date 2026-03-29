const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const BACKEND_URL = "https://generate-pattern-analysis-b52ovbio5q-uc.a.run.app";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const getTradePL = (trade) => {
    const entry = parseFloat(trade.EntryPrice ?? trade.entryPrice);
    const exit  = parseFloat(trade.EntryExit  ?? trade.entryExit);
    if (isFinite(entry) && isFinite(exit)) return exit - entry;
    const pl = parseFloat(trade.PL);
    return isFinite(pl) ? pl : 0;
};

const pct = (v) => `${Math.round(v)}%`;
const signed = (v) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}`;

function set(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function groupBy(trades, keyFn) {
    const map = {};
    for (const t of trades) {
        const k = keyFn(t);
        if (k === null || k === undefined || k === "") continue;
        (map[k] = map[k] || []).push(t);
    }
    return map;
}

function groupStats(groups) {
    return Object.entries(groups).map(([key, trades]) => {
        const pls = trades.map(getTradePL);
        const wins = pls.filter(p => p > 0).length;
        const avgPL = pls.reduce((s, v) => s + v, 0) / pls.length;
        return { key, count: trades.length, winRate: wins / pls.length, avgPL };
    }).filter(g => g.count >= 2);
}

function populateMetricCards(trades) {
    const pls = trades.map(getTradePL);
    const wins = pls.filter(p => p > 0);
    const losses = pls.filter(p => p < 0);
    const totalPL = pls.reduce((s, v) => s + v, 0);
    const winRate = wins.length / pls.length;

    set("pa-subtitle", `Based on ${trades.length} trades`);

    // ── Timing ────────────────────────────────────────────────────────────────
    const byDay = groupBy(trades, t => {
        const d = t.Date || t.date || t.timestamp;
        if (!d) return null;
        const dt = new Date(isNaN(Number(d)) ? d : Number(d) * 1000);
        return isNaN(dt) ? null : dt.getDay();
    });
    const dayStats = groupStats(byDay).sort((a, b) => b.avgPL - a.avgPL);

    if (dayStats.length >= 2) {
        const best  = dayStats[0];
        const worst = dayStats[dayStats.length - 1];

        set("pa-best-day-val",  DAY_NAMES[best.key]);
        set("pa-best-day-sub",  `${pct(best.winRate * 100)} win rate · avg ${signed(best.avgPL)} · ${best.count} trades`);

        set("pa-worst-day-val", DAY_NAMES[worst.key]);
        set("pa-worst-day-sub", `${pct(worst.winRate * 100)} win rate · avg ${signed(worst.avgPL)} · ${worst.count} trades`);

        const highVolDays = dayStats.filter(d => d.count >= 3).sort((a, b) => b.winRate - a.winRate);
        if (highVolDays.length >= 1) {
            const top = highVolDays[0];
            set("pa-winrate-day-val", DAY_NAMES[top.key]);
            set("pa-winrate-day-sub", `${pct(top.winRate * 100)} win rate · ${top.count} trades`);
        }
    }

    // ── Setup ─────────────────────────────────────────────────────────────────
    const byType = groupBy(trades, t => t.TradeType || t.tradeType || t.type || null);
    const typeStats = groupStats(byType).sort((a, b) => b.avgPL - a.avgPL);
    if (typeStats.length >= 1) {
        const best = typeStats[0];
        set("pa-best-type-val", best.key);
        set("pa-best-type-sub", `${pct(best.winRate * 100)} win rate · avg ${signed(best.avgPL)} · ${best.count} trades`);
    }

    const byDir = groupBy(trades, t => t.Direction || t.direction || null);
    const dirStats = groupStats(byDir).sort((a, b) => b.avgPL - a.avgPL);
    if (dirStats.length >= 1) {
        const top = dirStats[0];
        set("pa-best-dir-val", top.key);
        set("pa-best-dir-sub", `${pct(top.winRate * 100)} win rate · avg ${signed(top.avgPL)} · ${top.count} trades`);
    }

    const byStrat = groupBy(trades, t => {
        const s = t.Strategy || t.strategy;
        return Array.isArray(s) ? s[0] : (s || null);
    });
    const stratStats = groupStats(byStrat).sort((a, b) => b.avgPL - a.avgPL);
    if (stratStats.length >= 1) {
        const best = stratStats[0];
        set("pa-best-strategy-val", best.key);
        set("pa-best-strategy-sub", `${pct(best.winRate * 100)} win rate · avg ${signed(best.avgPL)} · ${best.count} trades`);
    }

    // ── Mental ────────────────────────────────────────────────────────────────
    const byEmo = groupBy(trades, t => t.postTradeReflection?.emotionAfterTrade || t.Emotion || t.emotion || t.mentalState || null);
    const emoStats = groupStats(byEmo).sort((a, b) => b.avgPL - a.avgPL);
    if (emoStats.length >= 1) {
        const best = emoStats[0];
        set("pa-best-state-val", best.key);
        set("pa-best-state-sub", `${pct(best.winRate * 100)} win rate · avg ${signed(best.avgPL)} · ${best.count} trades`);
        if (emoStats.length >= 2) {
            const worst = emoStats[emoStats.length - 1];
            set("pa-worst-state-val", worst.key);
            set("pa-worst-state-sub", `${pct(worst.winRate * 100)} win rate · avg ${signed(worst.avgPL)} · ${worst.count} trades`);
        }
    }

    // ── R:R ───────────────────────────────────────────────────────────────────
    if (wins.length && losses.length) {
        const avgWin  = wins.reduce((s, v) => s + v, 0) / wins.length;
        const avgLoss = Math.abs(losses.reduce((s, v) => s + v, 0) / losses.length);
        const rr = avgWin / avgLoss;
        set("pa-rr-val", `${rr.toFixed(2)}x`);
        set("pa-rr-sub", `Avg win ${signed(avgWin)} · Avg loss -${avgLoss.toFixed(2)}`);
        const rrEl = document.getElementById("pa-rr-val");
        if (rrEl) {
            rrEl.classList.remove("positive", "negative");
            rrEl.classList.add(rr >= 1 ? "positive" : "negative");
        }
    }
}

function applyAIInsights(insights) {
    if (!insights || typeof insights !== "object") return;
    const map = {
        "pa-best-day-insight":      insights.bestDayInsight,
        "pa-worst-day-insight":     insights.worstDayInsight,
        "pa-winrate-day-insight":   insights.winRateDayInsight,
        "pa-best-type-insight":     insights.bestTypeInsight,
        "pa-best-dir-insight":      insights.bestDirInsight,
        "pa-best-strategy-insight": insights.bestStrategyInsight,
        "pa-best-state-insight":    insights.bestStateInsight,
        "pa-worst-state-insight":   insights.worstStateInsight,
        "pa-rr-insight":            insights.rrInsight,
    };
    for (const [id, text] of Object.entries(map)) {
        if (text) set(id, text);
    }
}

const DEMO_INSIGHTS = {
    summary: "This is a preview of your Pattern Analysis. Based on the sample data, your strongest days are Tuesday and Thursday, with momentum setups performing best. Your disciplined and focused mental states produce the highest average returns — while impatient or frustrated sessions show clear underperformance. Upgrade to see your own personalised breakdown.",
    bestDayInsight: "Sample data shows Tuesday produces the highest average P&L. Your own best day will appear here once you start logging trades.",
    worstDayInsight: "In the sample, Monday sessions show the most variance. Tracking your own trades will reveal if there's a day to approach with more caution.",
    winRateDayInsight: "Thursday has the highest win rate in the sample data. Consistency across sessions is a strong edge — your data will tell the real story.",
    bestTypeInsight: "Futures trades show the strongest sample performance. Your own asset-class breakdown will appear here after a few weeks of logging.",
    bestDirInsight: "Long setups edge out Short in the sample. Whether that holds for you depends on your market and strategy — log to find out.",
    bestStrategyInsight: "Break & Retest leads in the sample. Your top strategy will surface once you have enough logged repetitions to form a pattern.",
    bestStateInsight: "Disciplined and focused mental states correlate with the best outcomes in the sample. Your own emotional edge will be tracked here.",
    worstStateInsight: "Impatient and tilted states show the worst sample performance. Post-trade reflections will track how your mindset affects your results.",
    rrInsight: "The sample shows a reward-to-risk above 1.5x — a healthy edge. Your personal R:R ratio will calculate automatically as you log trades.",
};

async function loadPatternAnalysis() {
    const account = window.getAccountData ? await window.getAccountData() : null;
    if (!account) return;

    const tradesObj = account.trades || {};
    const trades = Object.values(tradesObj);

    if (trades.length < 5) {
        document.getElementById("pa-no-data").style.display = "";
        document.getElementById("pa-content").style.display = "none";
        return;
    }

    // Populate metric cards immediately from local data
    populateMetricCards(trades);

    // Demo mode: use static insights, no backend call
    if (account.demoData) {
        set("pa-overall", DEMO_INSIGHTS.summary);
        applyAIInsights(DEMO_INSIGHTS);
        return;
    }

    // Check if we have a fresh cached AI analysis in the account
    const cached = account.patternAnalysis;
    const cacheAge = cached?.generatedAt ? (Date.now() - cached.generatedAt * 1000) : Infinity;

    if (cached?.summary && cacheAge < SEVEN_DAYS_MS) {
        set("pa-overall", cached.summary);
        applyAIInsights(cached.insights);
        return;
    }

    // Fetch fresh AI analysis from backend
    set("pa-overall", "Analysing your trading patterns…");
    try {
        const token = await window.getAuthToken();
        if (!token) return;

        const res = await fetch(BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
        });
        const json = await res.json();

        if (json.ok && json.analysis) {
            set("pa-overall", json.analysis.summary || "—");
            applyAIInsights(json.analysis.insights);
        } else {
            set("pa-overall", "Could not generate analysis. Check back soon.");
        }
    } catch (err) {
        set("pa-overall", "Could not load analysis right now.");
        console.error("Pattern analysis fetch error:", err);
    }
}

document.addEventListener("DOMContentLoaded", loadPatternAnalysis);
