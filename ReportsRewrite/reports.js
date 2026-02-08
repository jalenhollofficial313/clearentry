const setText = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
};

const safeNumber = (value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
};

const getTradePL = (trade) => {
    if (!trade) return 0;
    const entryPrice = trade.EntryPrice ?? trade.entryPrice;
    const entryExit = trade.EntryExit ?? trade.entryExit;
    if (entryPrice !== undefined && entryPrice !== "" && entryExit !== undefined && entryExit !== "") {
        const entry = Number(entryPrice);
        const exit = Number(entryExit);
        if (Number.isFinite(entry) && Number.isFinite(exit)) {
            return exit - entry;
        }
    }
    return safeNumber(trade.PL);
};

const formatCurrency = (value) => {
    const formatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
    });
    return formatter.format(value);
};

const formatSignedCurrency = (value) => {
    if (value === 0) {
        return "$0.00";
    }
    return `${value > 0 ? "+" : "-"}${formatCurrency(Math.abs(value))}`;
};

const formatRatio = (value) => {
    if (value === null || Number.isNaN(value)) return "—";
    if (!Number.isFinite(value)) return "∞";
    return value.toFixed(2);
};

const getTradesArray = (trades = {}) =>
    Object.entries(trades).map(([id, trade]) => ({ id, ...trade }));

const calculateSharpe = (values) => {
    if (!values.length) return null;
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance =
        values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev === 0) return null;
    return (mean / stdDev) * Math.sqrt(values.length);
};

const calculateSortino = (values) => {
    if (!values.length) return null;
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const downside = values.filter((v) => v < 0);
    if (!downside.length) return null;
    const downsideVariance =
        downside.reduce((sum, v) => sum + v ** 2, 0) / downside.length;
    const downsideDev = Math.sqrt(downsideVariance);
    if (downsideDev === 0) return null;
    return (mean / downsideDev) * Math.sqrt(values.length);
};

const calculateMaxDrawdown = (trades) => {
    const sorted = [...trades].sort((a, b) => safeNumber(a.date) - safeNumber(b.date));
    let peak = 0;
    let cumulative = 0;
    let maxDrawdown = 0;

    sorted.forEach((trade) => {
        cumulative += getTradePL(trade);
        peak = Math.max(peak, cumulative);
        const drawdown = peak - cumulative;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
    });

    return maxDrawdown;
};

const calculateStreaks = (trades) => {
    const sorted = [...trades].sort((a, b) => safeNumber(a.date) - safeNumber(b.date));
    let winStreak = 0;
    let lossStreak = 0;
    let currentWin = 0;
    let currentLoss = 0;

    sorted.forEach((trade) => {
        const pl = getTradePL(trade);
        if (pl > 0) {
            currentWin += 1;
            currentLoss = 0;
        } else if (pl < 0) {
            currentLoss += 1;
            currentWin = 0;
        }
        winStreak = Math.max(winStreak, currentWin);
        lossStreak = Math.max(lossStreak, currentLoss);
    });

    return { winStreak, lossStreak };
};

const calculateSQN = (values) => {
    if (!values.length) return null;
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance =
        values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev === 0) return null;
    return (mean / stdDev) * Math.sqrt(values.length);
};

const renderInsights = (metrics) => {
    const list = document.getElementById("overview-insights");
    if (!list) return;
    const items = [];

    if (metrics.profitFactor >= 1.5) {
        items.push(
            "Profit factor above 1.5 shows a sustainable edge when you follow your process."
        );
    } else {
        items.push(
            "Profit factor below 1.5 suggests tightening entries and exits for better edge."
        );
    }

    if (metrics.winRate >= 50) {
        items.push("Win rate is holding above 50% across recent trades.");
    } else {
        items.push("Win rate below 50% — focus on higher-quality setups.");
    }

    if (metrics.maxDrawdown > 0) {
        items.push(
            `Max drawdown sits at ${formatCurrency(metrics.maxDrawdown)}.`
        );
    }

    if (metrics.avgWin > metrics.avgLoss) {
        items.push("Average wins exceed average losses — keep sizing consistent.");
    } else if (metrics.avgLoss > 0) {
        items.push("Average losses are larger than wins — review risk control.");
    }

    list.innerHTML = items.map((item) => `<li>${item}</li>`).join("");
};

const loadOverview = async () => {
    const account = window.getAccountData
        ? await window.getAccountData()
        : null;
    if (!account) {
        console.error("No account data available for reports.");
        return;
    }
    const trades = getTradesArray(account?.trades || {});
    const plValues = trades.map((trade) => getTradePL(trade));

    const totalPL = plValues.reduce((sum, value) => sum + value, 0);
    const wins = plValues.filter((value) => value > 0);
    const losses = plValues.filter((value) => value < 0);
    const grossProfit = wins.reduce((sum, value) => sum + value, 0);
    const grossLoss = Math.abs(losses.reduce((sum, value) => sum + value, 0));
    const totalTrades = wins.length + losses.length;
    const winRate = totalTrades ? Math.round((wins.length / totalTrades) * 100) : 0;
    const avgWin = wins.length ? grossProfit / wins.length : 0;
    const avgLoss = losses.length ? grossLoss / losses.length : 0;
    const avgPL = totalTrades ? totalPL / totalTrades : 0;
    const profitFactor =
        grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
    const expectancy = totalTrades ? totalPL / totalTrades : 0;
    const maxDrawdown = calculateMaxDrawdown(trades);
    const sharpe = calculateSharpe(plValues);
    const sortino = calculateSortino(plValues);
    const rrRatio = avgLoss ? avgWin / avgLoss : null;

    const dayMap = new Map();
    trades.forEach((trade) => {
        if (!trade.date) return;
        const date = new Date(trade.date * 1000);
        const key = date.toISOString().slice(0, 10);
        dayMap.set(key, (dayMap.get(key) || 0) + getTradePL(trade));
    });
    const tradingDays = dayMap.size;
    const tradesPerDay = tradingDays ? totalTrades / tradingDays : 0;
    const { winStreak, lossStreak } = calculateStreaks(trades);

    const processScore =
        account?.analysis?.processScore ??
        account?.analysis?.process_score ??
        account?.analysis?.process ??
        null;
    const emotionalBalance =
        account?.analysis?.emotionalBalance ??
        account?.analysis?.emotional_balance ??
        null;
    const sqn = calculateSQN(plValues);

    setText("overview-process", processScore ? processScore.toString() : "—");
    setText("overview-emotion", emotionalBalance ? emotionalBalance.toString() : "—");
    setText("overview-sqn", sqn ? sqn.toFixed(2) : "—");
    setText("overview-total-pl", formatSignedCurrency(totalPL));

    setText("metric-net-pl", formatSignedCurrency(totalPL));
    setText("metric-gross-profit", formatCurrency(grossProfit));
    setText("metric-gross-loss", formatCurrency(grossLoss));
    setText("metric-win-rate", `${winRate}%`);
    setText("metric-profit-factor", formatRatio(profitFactor));
    setText("metric-expectancy", formatSignedCurrency(expectancy));
    setText("metric-avg-pl", formatSignedCurrency(avgPL));
    setText("metric-best-trade", formatSignedCurrency(Math.max(...plValues, 0)));
    setText("metric-worst-trade", formatSignedCurrency(Math.min(...plValues, 0)));
    setText("metric-avg-win", formatCurrency(avgWin));
    setText("metric-avg-loss", formatCurrency(avgLoss));

    setText("metric-drawdown", formatSignedCurrency(-maxDrawdown));
    setText("metric-sharpe", formatRatio(sharpe));
    setText("metric-sortino", formatRatio(sortino));
    setText("metric-rr", formatRatio(rrRatio));

    setText("metric-trades", totalTrades.toString());
    setText("metric-wl", `${wins.length} / ${losses.length}`);
    setText("metric-days", tradingDays.toString());
    setText("metric-trades-day", tradesPerDay ? tradesPerDay.toFixed(2) : "—");
    setText("metric-win-streak", winStreak.toString());
    setText("metric-loss-streak", lossStreak.toString());

    renderInsights({
        profitFactor,
        winRate,
        maxDrawdown,
        avgWin,
        avgLoss,
    });
};

const setView = (view) => {
    const overview = document.getElementById("reports-overview");
    const smart = document.getElementById("reports-smart");
    if (overview && smart) {
        overview.hidden = view !== "overview";
        smart.hidden = view !== "smart";
    }

    const crumb = document.getElementById("reports-crumb");
    if (crumb) {
        crumb.textContent =
            view === "smart" ? "Smart Analysis" : "Analysis Overview";
    }

    document.querySelectorAll("[data-report-view]").forEach((btn) => {
        btn.classList.toggle(
            "is-active",
            btn.getAttribute("data-report-view") === view
        );
    });
};

document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("reports-toggle");
    const subnav = document.getElementById("reports-subnav");

    if (toggle && subnav) {
        toggle.addEventListener("click", () => {
            subnav.classList.toggle("is-hidden");
        });
    }

    const urlParams = new URLSearchParams(window.location.search);
    const hashView = window.location.hash.replace("#", "");
    const requestedView = urlParams.get("view") || hashView;
    setView(requestedView === "smart" ? "smart" : "overview");
    loadOverview();
});

