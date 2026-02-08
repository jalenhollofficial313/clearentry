const setText = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
};

const setSignedValue = (id, value) => {
    const node = document.getElementById(id);
    if (!node) return;
    node.textContent = value;
    node.classList.remove("positive", "negative");
    if (value.startsWith("+")) node.classList.add("positive");
    if (value.startsWith("-")) node.classList.add("negative");
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

let equityChart = null;
let distributionChart = null;
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();

const buildChartColors = () => {
    const isDark = document.body.classList.contains("dark");
    return {
        text: isDark ? "#e2e8f0" : "#0f172a",
        grid: isDark ? "rgba(148, 163, 184, 0.12)" : "rgba(148, 163, 184, 0.35)",
        line: "#00ff99",
        gain: "#22c55e",
        loss: "#ef4444",
    };
};

const renderEquityCurve = (trades) => {
    const canvas = document.getElementById("equity-chart");
    if (!canvas || !window.Chart) return;

    const sorted = [...trades].sort((a, b) => safeNumber(a.date) - safeNumber(b.date));
    const points = [];
    let cumulative = 0;
    sorted.forEach((trade) => {
        cumulative += getTradePL(trade);
        points.push(cumulative);
    });

    const labels = points.map((_, index) => index + 1);
    if (equityChart) {
        equityChart.destroy();
    }

    const colors = buildChartColors();
    equityChart = new Chart(canvas, {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    data: points,
                    borderColor: colors.line,
                    backgroundColor: "transparent",
                    borderWidth: 2,
                    tension: 0.3,
                    pointRadius: 0,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: true },
            },
            scales: {
                x: {
                    display: false,
                    grid: { display: false },
                },
                y: {
                    ticks: { color: colors.text, font: { size: 10 } },
                    grid: { color: colors.grid },
                },
            },
        },
    });
};

const renderPLDistribution = (values) => {
    const canvas = document.getElementById("pl-chart");
    if (!canvas || !window.Chart) return;

    if (distributionChart) {
        distributionChart.destroy();
    }

    if (!values.length) return;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const bucketCount = 10;
    const bucketSize = (max - min) / bucketCount || 1;
    const buckets = Array.from({ length: bucketCount }, () => 0);
    const bucketLabels = [];

    values.forEach((value) => {
        const index = Math.min(
            bucketCount - 1,
            Math.floor((value - min) / bucketSize)
        );
        buckets[index] += 1;
    });

    for (let i = 0; i < bucketCount; i += 1) {
        const bucketStart = min + bucketSize * i;
        const bucketEnd = bucketStart + bucketSize;
        bucketLabels.push(`${bucketStart.toFixed(0)}-${bucketEnd.toFixed(0)}`);
    }

    const colors = buildChartColors();
    const barColors = bucketLabels.map((_, index) => {
        const mid = min + bucketSize * (index + 0.5);
        return mid >= 0 ? colors.gain : colors.loss;
    });

    distributionChart = new Chart(canvas, {
        type: "bar",
        data: {
            labels: bucketLabels,
            datasets: [
                {
                    data: buckets,
                    backgroundColor: barColors,
                    borderRadius: 6,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: true },
            },
            scales: {
                x: {
                    ticks: { color: colors.text, font: { size: 9 } },
                    grid: { display: false },
                },
                y: {
                    ticks: { color: colors.text, font: { size: 10 } },
                    grid: { color: colors.grid },
                },
            },
        },
    });
};

const renderCalendar = (trades) => {
    const grid = document.getElementById("analytics-calendar-grid");
    const title = document.getElementById("analytics-calendar-title");
    if (!grid || !title) return;

    const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1);
    const startDay = firstDay.getDay();
    const daysInMonth = new Date(
        currentCalendarYear,
        currentCalendarMonth + 1,
        0
    ).getDate();
    const daysInPrevMonth = new Date(
        currentCalendarYear,
        currentCalendarMonth,
        0
    ).getDate();

    title.textContent = `${firstDay.toLocaleDateString("en-US", {
        month: "long",
    })} ${currentCalendarYear}`;

    const tradeMap = {};
    trades.forEach((trade) => {
        if (!trade.date) return;
        const tradeDate = new Date(trade.date * 1000);
        if (
            tradeDate.getFullYear() !== currentCalendarYear ||
            tradeDate.getMonth() !== currentCalendarMonth
        ) {
            return;
        }
        const day = tradeDate.getDate();
        if (!tradeMap[day]) {
            tradeMap[day] = 0;
        }
        tradeMap[day] += getTradePL(trade);
    });

    grid.innerHTML = "";

    let dayCounter = 1;
    let nextMonthDay = 1;
    const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;

    for (let cell = 0; cell < totalCells; cell += 1) {
        const cellDiv = document.createElement("div");
        cellDiv.className = "calendar-cell";

        if (cell < startDay) {
            cellDiv.classList.add("muted");
        } else if (dayCounter > daysInMonth) {
            cellDiv.classList.add("muted");
            nextMonthDay += 1;
        } else {
            const totalPL = tradeMap[dayCounter];
            if (totalPL === undefined) {
                cellDiv.classList.add("neutral");
                cellDiv.textContent = "—";
            } else {
                cellDiv.classList.add(totalPL >= 0 ? "positive" : "negative");
                cellDiv.textContent = formatSignedCurrency(totalPL);
            }
            cellDiv.title = `${firstDay.toLocaleDateString("en-US", {
                month: "short",
            })} ${dayCounter}: ${
                totalPL === undefined ? "No trades" : formatSignedCurrency(totalPL)
            }`;
            dayCounter += 1;
        }

        grid.appendChild(cellDiv);
    }
};

const loadAnalytics = async () => {
    const account = window.getAccountData
        ? await window.getAccountData()
        : null;
    if (!account) {
        return;
    }
    const trades = getTradesArray(account?.trades || {});
    setText("analytics-subtitle", `${trades.length} trades`);

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
    const profitFactor =
        grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
    const rrRatio = avgLoss ? avgWin / avgLoss : null;
    const expectancy = totalTrades ? totalPL / totalTrades : 0;
    const expectedValue = expectancy;
    const expectation100 = expectancy * 100;
    const avgPL = totalTrades ? totalPL / totalTrades : 0;
    const bestTrade = plValues.length ? Math.max(...plValues) : 0;
    const worstTrade = plValues.length ? Math.min(...plValues) : 0;

    setSignedValue("net-profit", formatSignedCurrency(totalPL));
    setText("gross-profit", formatCurrency(grossProfit));
    setText("win-rate", `${winRate}%`);
    setText("avg-win", formatCurrency(avgWin));
    setText("avg-loss", formatCurrency(avgLoss));
    setText("profit-factor", formatRatio(profitFactor));

    setText("rr-ratio", formatRatio(rrRatio));
    setText("sharpe-ratio", formatRatio(calculateSharpe(plValues)));
    setText("sortino-ratio", formatRatio(calculateSortino(plValues)));
    setSignedValue("max-drawdown", formatSignedCurrency(-calculateMaxDrawdown(trades)));
    setSignedValue("expected-value", formatSignedCurrency(expectedValue));
    setSignedValue("expectation-100", formatSignedCurrency(expectation100));

    setText("total-trades", totalTrades.toString());
    setText("wins", wins.length.toString());
    setText("losses", losses.length.toString());
    setSignedValue("avg-pl", formatSignedCurrency(avgPL));
    setSignedValue("best-trade", formatSignedCurrency(bestTrade));
    setSignedValue("worst-trade", formatSignedCurrency(worstTrade));

    renderEquityCurve(trades);
    renderPLDistribution(plValues);
    renderCalendar(trades);
};

loadAnalytics();

document.getElementById("calendar-prev")?.addEventListener("click", () => {
    currentCalendarMonth -= 1;
    if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear -= 1;
    }
    loadAnalytics();
});

document.getElementById("calendar-next")?.addEventListener("click", () => {
    currentCalendarMonth += 1;
    if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear += 1;
    }
    loadAnalytics();
});

