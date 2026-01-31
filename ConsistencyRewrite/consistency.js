const EMOTION_VALENCE_MAP = {
    confident: "positive",
    focused: "positive",
    disciplined: "positive",
    calm: "positive",
    patient: "positive",
    motivated: "positive",
    clear: "positive",
    grateful: "positive",
    anxious: "negative",
    fearful: "negative",
    fearfulness: "negative",
    frustrated: "negative",
    tilted: "negative",
    tilt: "negative",
    angry: "negative",
    impulsive: "negative",
    revenge: "negative",
    stressed: "negative",
    overwhelmed: "negative",
    tired: "negative",
    distracted: "negative",
    bored: "neutral",
    neutral: "neutral",
    uncertain: "neutral",
    curious: "neutral",
    cautious: "neutral",
};

const POSITIVE_KEYWORDS = ["confident", "focus", "disciplined", "calm", "patient"];
const NEGATIVE_KEYWORDS = [
    "fear",
    "anx",
    "tilt",
    "angry",
    "impuls",
    "revenge",
    "stress",
    "overwhelm",
    "tired",
    "distract",
    "frustr",
];

const setText = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
};

const safeNumber = (value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
};

const formatPercent = (value) => {
    if (!Number.isFinite(value)) return "—";
    return `${Math.round(value)}%`;
};

const getTradesArray = (trades = {}) =>
    Object.entries(trades).map(([id, trade]) => ({ id, ...trade }));

const normalizeEmotion = (emotion) =>
    emotion ? emotion.toString().trim().toLowerCase() : "";

const inferValence = (emotion) => {
    const normalized = normalizeEmotion(emotion);
    if (!normalized) return "neutral";
    if (EMOTION_VALENCE_MAP[normalized]) return EMOTION_VALENCE_MAP[normalized];
    if (POSITIVE_KEYWORDS.some((keyword) => normalized.includes(keyword)))
        return "positive";
    if (NEGATIVE_KEYWORDS.some((keyword) => normalized.includes(keyword)))
        return "negative";
    return "neutral";
};

const valenceScore = (valence) => {
    if (valence === "positive") return 1;
    if (valence === "negative") return 0;
    return 0.5;
};

const getTradeEmotion = (trade) =>
    trade?.emotion ||
    trade?.emotionalState ||
    trade?.mentalState ||
    trade?.emotional_state ||
    trade?.mental_state ||
    trade?.psychology ||
    "";

const getTradeDate = (trade) => {
    const raw =
        trade?.date ||
        trade?.entryDate ||
        trade?.openDate ||
        trade?.closeDate ||
        trade?.time ||
        null;
    if (!raw) return null;
    const timestamp = safeNumber(raw);
    if (!timestamp) return null;
    const ms = timestamp < 1e12 ? timestamp * 1000 : timestamp;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? null : date;
};

const getRuleComplianceStatus = (trade) =>
    trade?.ruleComplianceStatus ||
    trade?.rule_compliance_status ||
    trade?.ruleCompliance?.status ||
    trade?.rule_compliance?.status ||
    null;

const isCompliancePass = (status) => {
    if (!status) return null;
    const normalized = status.toString().trim().toLowerCase();
    if (["pass", "passed", "compliant", "yes", "true"].includes(normalized))
        return true;
    if (
        [
            "fail",
            "failed",
            "noncompliant",
            "non-compliant",
            "no",
            "false",
        ].includes(normalized)
    ) {
        return false;
    }
    return null;
};

const getPreTradeId = (trade) =>
    trade?.preTradeSessionId ||
    trade?.pre_trade_session_id ||
    trade?.preTradeId ||
    "";

const average = (values) => {
    if (!values.length) return null;
    const sum = values.reduce((total, value) => total + value, 0);
    return sum / values.length;
};

const buildDailyMetrics = (trades) => {
    const dayMap = new Map();

    trades.forEach((trade) => {
        const date = getTradeDate(trade);
        if (!date) return;
        const key = date.toISOString().slice(0, 10);
        if (!dayMap.has(key)) {
            dayMap.set(key, {
                trades: [],
                emotionScores: [],
                compliance: [],
                preExecCount: 0,
            });
        }
        const bucket = dayMap.get(key);
        bucket.trades.push(trade);

        const emotion = getTradeEmotion(trade);
        if (emotion) {
            bucket.emotionScores.push(
                valenceScore(inferValence(emotion))
            );
        }

        const compliance = isCompliancePass(getRuleComplianceStatus(trade));
        if (compliance !== null) {
            bucket.compliance.push(compliance ? 1 : 0);
        }

        if (getPreTradeId(trade)) {
            bucket.preExecCount += 1;
        }
    });

    const metricsMap = new Map();
    dayMap.forEach((bucket, key) => {
        const tradeCount = bucket.trades.length;
        const emotionScore = average(bucket.emotionScores);
        const executionScore = average(bucket.compliance);
        const preExecScore = tradeCount ? bucket.preExecCount / tradeCount : null;

        const weights = [];
        const values = [];
        if (emotionScore !== null) {
            weights.push(0.4);
            values.push(emotionScore);
        }
        if (executionScore !== null) {
            weights.push(0.35);
            values.push(executionScore);
        }
        if (preExecScore !== null) {
            weights.push(0.25);
            values.push(preExecScore);
        }

        let score = null;
        if (values.length) {
            const weightSum = weights.reduce((sum, val) => sum + val, 0);
            score =
                values.reduce((sum, value, index) => {
                    return sum + value * weights[index];
                }, 0) / weightSum;
        }

        metricsMap.set(key, {
            score: score === null ? null : Math.round(score * 100),
            emotionScore: emotionScore === null ? null : Math.round(emotionScore * 100),
            executionScore:
                executionScore === null ? null : Math.round(executionScore * 100),
            preExecScore:
                preExecScore === null ? null : Math.round(preExecScore * 100),
            trades: tradeCount,
        });
    });

    return metricsMap;
};

const getLevel = (score) => {
    if (score === null) return 0;
    if (score >= 85) return 4;
    if (score >= 70) return 3;
    if (score >= 55) return 2;
    if (score >= 40) return 1;
    return 1;
};

const renderHeatmap = (year, metricsMap) => {
    const grid = document.getElementById("consistency-heatmap");
    grid.innerHTML = "";
    const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ];

    months.forEach((label, monthIndex) => {
        const labelCell = document.createElement("div");
        labelCell.className = "heatmap-label";
        labelCell.textContent = label;
        grid.appendChild(labelCell);

        for (let day = 1; day <= 31; day += 1) {
            const cell = document.createElement("div");
            cell.className = "heatmap-cell is-empty";

            const date = new Date(year, monthIndex, day);
            if (date.getMonth() === monthIndex) {
                const key = date.toISOString().slice(0, 10);
                const metrics = metricsMap.get(key);
                if (metrics) {
                    const score = metrics.score ?? null;
                    const level = score === null ? 1 : getLevel(score);
                    cell.className = `heatmap-cell level-${level}`;
                    cell.dataset.hasData = "true";
                    cell.dataset.date = key;
                    cell.dataset.score = score ?? "";
                    cell.dataset.trades = metrics?.trades ?? 0;
                    cell.dataset.emotion = metrics?.emotionScore ?? "";
                    cell.dataset.execution = metrics?.executionScore ?? "";
                    cell.dataset.preexec = metrics?.preExecScore ?? "";
                } else {
                    cell.className = "heatmap-cell is-empty";
                    cell.dataset.hasData = "false";
                }
            }

            grid.appendChild(cell);
        }
    });
};

const computeStreaks = (metricsMap, year, target = 70) => {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    let currentStreak = 0;
    let bestStreak = 0;
    let rolling = 0;
    let hasData = false;

    for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
        const key = date.toISOString().slice(0, 10);
        const metrics = metricsMap.get(key);
        if (metrics && metrics.score !== null) {
            hasData = true;
            if (metrics.score >= target) {
                rolling += 1;
            } else {
                rolling = 0;
            }
            bestStreak = Math.max(bestStreak, rolling);
        } else {
            rolling = 0;
        }
    }

    if (hasData) {
        const today = new Date();
        for (
            let date = new Date(today);
            date.getFullYear() === year;
            date.setDate(date.getDate() - 1)
        ) {
            const key = date.toISOString().slice(0, 10);
            const metrics = metricsMap.get(key);
            if (metrics && metrics.score !== null && metrics.score >= target) {
                currentStreak += 1;
            } else {
                break;
            }
        }
    }

    return { currentStreak, bestStreak };
};

const renderSummary = (year, metricsMap, trades) => {
    const scores = [];
    const emotionScores = [];
    const executionScores = [];
    const preExecScores = [];
    let daysWithData = 0;

    metricsMap.forEach((metrics) => {
        if (metrics.score !== null) {
            scores.push(metrics.score);
            daysWithData += 1;
        }
        if (metrics.emotionScore !== null) emotionScores.push(metrics.emotionScore);
        if (metrics.executionScore !== null)
            executionScores.push(metrics.executionScore);
        if (metrics.preExecScore !== null) preExecScores.push(metrics.preExecScore);
    });

    const overall = average(scores);
    const emotionAvg = average(emotionScores);
    const executionAvg = average(executionScores);
    const preExecAvg = average(preExecScores);
    const { currentStreak, bestStreak } = computeStreaks(metricsMap, year);

    setText(
        "overall-score",
        overall !== null ? `${Math.round(overall)}%` : "—"
    );
    setText("current-streak", currentStreak ? `${currentStreak} days` : "—");
    setText("best-streak", bestStreak ? `${bestStreak} days` : "—");
    setText("sessions-logged", trades.length.toString());

    setText("emotional-consistency", formatPercent(emotionAvg));
    setText("execution-consistency", formatPercent(executionAvg));
    setText("preexec-consistency", formatPercent(preExecAvg));

    const totalYearDays =
        Math.round(
            (new Date(year, 11, 31) - new Date(year, 0, 1)) /
                (1000 * 60 * 60 * 24)
        ) + 1;
    const yearDays =
        year === new Date().getFullYear()
            ? Math.floor(
                  (new Date() - new Date(year, 0, 1)) / (1000 * 60 * 60 * 24)
              ) + 1
            : totalYearDays;
    const completionRate = yearDays ? (daysWithData / yearDays) * 100 : null;
    setText("completion-rate", formatPercent(completionRate));

    setText(
        "emotion-detail",
        emotionScores.length
            ? `${emotionScores.length} days logged`
            : "No emotion data yet"
    );
    setText(
        "execution-detail",
        executionScores.length
            ? `${executionScores.length} days logged`
            : "No rule compliance data"
    );
    setText(
        "preexec-detail",
        preExecScores.length
            ? `${preExecScores.length} days logged`
            : "No pre-execution links"
    );
    setText(
        "completion-detail",
        daysWithData ? `${daysWithData} days tracked` : "No days tracked"
    );

    const subtitle = document.getElementById("consistency-subtitle");
    if (subtitle) {
        subtitle.textContent = trades.length
            ? `${trades.length} trades logged in ${year}`
            : `No trades logged in ${year}`;
    }
};

const setupTooltip = () => {
    const grid = document.getElementById("consistency-heatmap");
    const tooltip = document.getElementById("heatmap-tooltip");

    grid.addEventListener("mousemove", (event) => {
        const cell = event.target.closest(".heatmap-cell");
        if (!cell || cell.dataset.hasData !== "true") {
            tooltip.hidden = true;
            return;
        }
        const date = cell.dataset.date;
        const score = cell.dataset.score || "—";
        const trades = cell.dataset.trades || "0";
        const emotion = cell.dataset.emotion || "—";
        const execution = cell.dataset.execution || "—";
        const preexec = cell.dataset.preexec || "—";
        tooltip.innerHTML = `
            <p><strong>${date}</strong></p>
            <p>Score: ${score}</p>
            <p>Emotional: ${emotion}%</p>
            <p>Execution: ${execution}%</p>
            <p>Pre-Exec: ${preexec}%</p>
            <p>Trades: ${trades}</p>
        `;
        tooltip.style.left = `${event.clientX + 14}px`;
        tooltip.style.top = `${event.clientY + 14}px`;
        tooltip.hidden = false;
    });

    grid.addEventListener("mouseleave", () => {
        tooltip.hidden = true;
    });
};

const filterTradesByYear = (trades, year) =>
    trades.filter((trade) => {
        const date = getTradeDate(trade);
        return date && date.getFullYear() === year;
    });

const loadConsistency = async () => {
    const account = window.getAccountData
        ? await window.getAccountData()
        : null;
    if (!account) return;
    const trades = getTradesArray(account?.trades || {});

    const yearDisplay = document.getElementById("heatmap-year");
    let currentYear = new Date().getFullYear();

    const renderYear = (year) => {
        const yearTrades = filterTradesByYear(trades, year);
        const metricsMap = buildDailyMetrics(yearTrades);
        renderHeatmap(year, metricsMap);
        renderSummary(year, metricsMap, yearTrades);
        yearDisplay.textContent = year.toString();
    };

    document.getElementById("year-prev").addEventListener("click", () => {
        currentYear -= 1;
        renderYear(currentYear);
    });
    document.getElementById("year-next").addEventListener("click", () => {
        currentYear += 1;
        renderYear(currentYear);
    });

    renderYear(currentYear);
    setupTooltip();
};

loadConsistency();

