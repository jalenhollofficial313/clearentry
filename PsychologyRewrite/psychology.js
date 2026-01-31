const PRETRADE_ENDPOINT =
    "https://us-central1-clearentry-5353e.cloudfunctions.net/getPreTradeContext";

const DEFAULT_ACTIONS = [
    {
        id: "reset-breath",
        text: "2-minute reset breathing before the next setup",
    },
    {
        id: "journal-feel",
        text: "Log the emotion before placing the trade",
    },
    {
        id: "focus-rule",
        text: "Review psychology rules before entry",
    },
    {
        id: "cool-down",
        text: "10-minute cooldown after a loss",
    },
];

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

const CUSTOM_ACTIONS_KEY = "psychologyCustomActions";
const ACTION_STATE_KEY = "psychologyActionState";

let ratingChart = null;
let mixChart = null;
let cachedStats = null;

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

const getToken = async () =>
    window.getAuthToken ? await window.getAuthToken() : null;

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
    if (valence === "negative") return -1;
    return 0;
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

const getTradesArray = (trades = {}) =>
    Object.entries(trades).map(([id, trade]) => ({ id, ...trade }));

async function fetchStrategyContext(token) {
    try {
        const response = await fetch(PRETRADE_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
        });
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.warn("Unable to fetch strategy context", error);
        return null;
    }
}

const extractStrategies = (context) => {
    if (!context) return {};
    if (context.strategies) return context.strategies;
    return context;
};

const buildPsychologyRules = (strategies) => {
    const rules = [];
    const seen = new Set();
    Object.entries(strategies || {}).forEach(([id, strategy]) => {
        const name = strategy?.name || `Strategy ${id}`;
        const psych = strategy?.psychologicalRules || {};
        const addRule = (text) => {
            const key = text.toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            rules.push({ text, source: name });
        };

        if (psych.avoidEmotions?.length) {
            addRule(`Avoid emotions: ${psych.avoidEmotions.join(", ")}`);
        }
        if (psych.avoidConditions?.length) {
            addRule(`Avoid conditions: ${psych.avoidConditions.join(", ")}`);
        }
        if (psych.customConditions?.length) {
            psych.customConditions.forEach((condition) => {
                if (condition) addRule(`Custom condition: ${condition}`);
            });
        }
        if (psych.notes) {
            addRule(`Notes: ${psych.notes}`);
        }
    });

    return rules;
};

const renderRules = (rules) => {
    const list = document.getElementById("psych-rules-list");
    const empty = document.getElementById("psych-rules-empty");
    list.innerHTML = "";
    if (!rules.length) {
        empty.style.display = "block";
        return;
    }
    empty.style.display = "none";
    rules.forEach((rule) => {
        const item = document.createElement("li");
        item.className = "rule-item";
        item.innerHTML = `
            <span class="rule-title">${rule.text}</span>
            <span class="rule-meta">From ${rule.source}</span>
        `;
        list.appendChild(item);
    });
};

const loadCustomActions = () => {
    try {
        return JSON.parse(localStorage.getItem(CUSTOM_ACTIONS_KEY) || "[]");
    } catch (error) {
        return [];
    }
};

const saveCustomActions = (actions) => {
    localStorage.setItem(CUSTOM_ACTIONS_KEY, JSON.stringify(actions));
};

const loadActionState = () => {
    try {
        return JSON.parse(localStorage.getItem(ACTION_STATE_KEY) || "{}");
    } catch (error) {
        return {};
    }
};

const saveActionState = (state) => {
    localStorage.setItem(ACTION_STATE_KEY, JSON.stringify(state));
};

const renderActions = () => {
    const list = document.getElementById("action-list");
    const customActions = loadCustomActions();
    const state = loadActionState();
    const actions = [...DEFAULT_ACTIONS, ...customActions];

    list.innerHTML = "";
    actions.forEach((action) => {
        const wrapper = document.createElement("div");
        wrapper.className = "action-item";
        const checked = Boolean(state[action.id]);
        wrapper.innerHTML = `
            <label class="action-label">
                <input type="checkbox" ${checked ? "checked" : ""} />
                <span>${action.text}</span>
            </label>
            ${
                action.id.startsWith("custom-")
                    ? `<button class="action-remove" data-action="${action.id}">Remove</button>`
                    : ""
            }
        `;
        const checkbox = wrapper.querySelector("input");
        checkbox.addEventListener("change", () => {
            state[action.id] = checkbox.checked;
            saveActionState(state);
        });
        const remove = wrapper.querySelector(".action-remove");
        if (remove) {
            remove.addEventListener("click", () => {
                const updated = customActions.filter(
                    (item) => item.id !== action.id
                );
                saveCustomActions(updated);
                delete state[action.id];
                saveActionState(state);
                renderActions();
            });
        }
        list.appendChild(wrapper);
    });
};

const handleAddAction = () => {
    const input = document.getElementById("action-input");
    const text = input.value.trim();
    if (!text) return;
    const customActions = loadCustomActions();
    customActions.push({ id: `custom-${Date.now()}`, text });
    saveCustomActions(customActions);
    input.value = "";
    renderActions();
};

const computeEmotionStats = (trades) => {
    const entries = trades
        .map((trade) => ({
            emotion: getTradeEmotion(trade),
            date: getTradeDate(trade),
        }))
        .filter((entry) => entry.emotion);

    entries.sort((a, b) => {
        const aTime = a.date ? a.date.getTime() : 0;
        const bTime = b.date ? b.date.getTime() : 0;
        return aTime - bTime;
    });

    const valenceCounts = { positive: 0, neutral: 0, negative: 0 };
    const emotionCounts = new Map();
    const dailyMap = new Map();

    entries.forEach((entry) => {
        const emotion = entry.emotion.toString().trim();
        const valence = inferValence(emotion);
        valenceCounts[valence] += 1;
        emotionCounts.set(emotion, (emotionCounts.get(emotion) || 0) + 1);

        if (entry.date) {
            const key = entry.date.toISOString().slice(0, 10);
            const current = dailyMap.get(key) || { score: 0, count: 0 };
            current.score += valenceScore(valence);
            current.count += 1;
            dailyMap.set(key, current);
        }
    });

    const totalEmotions =
        valenceCounts.positive + valenceCounts.neutral + valenceCounts.negative;
    const averageScore = totalEmotions
        ? (valenceCounts.positive - valenceCounts.negative) / totalEmotions
        : 0;
    const rating = totalEmotions
        ? Math.round(((averageScore + 1) / 2) * 100)
        : null;

    const dailySeries = Array.from(dailyMap.entries())
        .sort((a, b) => (a[0] > b[0] ? 1 : -1))
        .map(([key, value]) => ({
            label: key,
            rating: Math.round(((value.score / value.count + 1) / 2) * 100),
        }));

    const recent = entries.slice(-10);
    const recentNegatives = recent.filter(
        (entry) => inferValence(entry.emotion) === "negative"
    ).length;
    const tiltRisk = recent.length ? (recentNegatives / recent.length) * 100 : null;

    let recoveryTotal = 0;
    let recoveryCount = 0;
    entries.forEach((entry, index) => {
        if (inferValence(entry.emotion) !== "negative") return;
        recoveryTotal += 1;
        const next = entries.slice(index + 1, index + 4);
        if (
            next.some((item) => inferValence(item.emotion) === "positive")
        ) {
            recoveryCount += 1;
        }
    });
    const recoveryRate = recoveryTotal
        ? (recoveryCount / recoveryTotal) * 100
        : null;

    const negativeEmotions = Array.from(emotionCounts.entries())
        .filter(([emotion]) => inferValence(emotion) === "negative")
        .sort((a, b) => b[1] - a[1]);
    const topTrigger = negativeEmotions.length ? negativeEmotions[0][0] : null;

    return {
        entries,
        valenceCounts,
        emotionCounts,
        rating,
        dailySeries,
        tiltRisk,
        recoveryRate,
        topTrigger,
        totalEmotions,
        averageScore,
    };
};

const renderConnotations = (emotionCounts, strategyRules) => {
    const positive = document.getElementById("connotation-positive");
    const neutral = document.getElementById("connotation-neutral");
    const negative = document.getElementById("connotation-negative");
    positive.innerHTML = "";
    neutral.innerHTML = "";
    negative.innerHTML = "";

    const emotionSet = new Set(Object.keys(EMOTION_VALENCE_MAP));
    emotionCounts.forEach((_, emotion) => emotionSet.add(emotion));
    strategyRules.forEach((rule) => {
        const matches = rule.text.match(/: (.+)$/);
        if (matches && matches[1]) {
            matches[1]
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
                .forEach((item) => emotionSet.add(item));
        }
    });

    Array.from(emotionSet)
        .filter(Boolean)
        .sort()
        .forEach((emotion) => {
            const valence = inferValence(emotion);
            const chip = document.createElement("span");
            chip.className = `chip chip-${valence}`;
            chip.textContent = emotion;
            if (valence === "positive") positive.appendChild(chip);
            if (valence === "neutral") neutral.appendChild(chip);
            if (valence === "negative") negative.appendChild(chip);
        });
};

const renderInsights = (stats) => {
    const list = document.getElementById("psych-insights");
    const empty = document.getElementById("insights-empty");
    list.innerHTML = "";

    if (!stats || !stats.totalEmotions) {
        empty.style.display = "block";
        return;
    }
    empty.style.display = "none";

    const insights = [];
    const positiveShare =
        (stats.valenceCounts.positive / stats.totalEmotions) * 100;
    const negativeShare =
        (stats.valenceCounts.negative / stats.totalEmotions) * 100;

    if (negativeShare >= 45) {
        insights.push(
            "Negative emotions are elevated recently. Consider a shorter trading window or stricter pre-trade checklist."
        );
    }
    if (positiveShare >= 55) {
        insights.push(
            "Positive emotional balance is trending up. Maintain the same preparation routine."
        );
    }
    if (stats.tiltRisk && stats.tiltRisk >= 40) {
        insights.push(
            "Tilt risk is high in the last 10 trades. Add a cooldown after losses."
        );
    }
    if (stats.recoveryRate && stats.recoveryRate < 40) {
        insights.push(
            "Recovery rate is low. Consider stopping for the day after a negative trade."
        );
    }
    if (!insights.length) {
        insights.push(
            "Psychology looks stable. Keep logging emotions to sharpen insights."
        );
    }

    insights.forEach((insight) => {
        const item = document.createElement("li");
        item.className = "insight-item-row";
        item.textContent = insight;
        list.appendChild(item);
    });
};

const renderCharts = (stats) => {
    const ratingEmpty = document.getElementById("rating-empty");
    const mixEmpty = document.getElementById("mix-empty");
    const isDark = document.body.classList.contains("dark");
    const gridColor = isDark ? "#1f2937" : "#e2e8f0";
    const textColor = isDark ? "#cbd5f5" : "#475569";

    if (ratingChart) ratingChart.destroy();
    if (mixChart) mixChart.destroy();

    if (stats?.dailySeries?.length && window.Chart) {
        ratingEmpty.style.display = "none";
        const ctx = document.getElementById("rating-chart");
        ratingChart = new Chart(ctx, {
            type: "line",
            data: {
                labels: stats.dailySeries.map((item) =>
                    new Date(item.label).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                    })
                ),
                datasets: [
                    {
                        label: "Rating",
                        data: stats.dailySeries.map((item) => item.rating),
                        borderColor: "#0f172a",
                        backgroundColor: "rgba(15, 23, 42, 0.15)",
                        fill: true,
                        tension: 0.35,
                        pointRadius: 2,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        min: 0,
                        max: 100,
                        grid: { color: gridColor },
                        ticks: { color: textColor },
                    },
                    x: { grid: { display: false }, ticks: { color: textColor } },
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true },
                },
            },
        });
    } else {
        ratingEmpty.style.display = "grid";
    }

    const totalEmotions =
        stats?.valenceCounts?.positive +
        stats?.valenceCounts?.neutral +
        stats?.valenceCounts?.negative;

    if (totalEmotions && window.Chart) {
        mixEmpty.style.display = "none";
        const ctx = document.getElementById("emotion-mix-chart");
        mixChart = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["Positive", "Neutral", "Negative"],
                datasets: [
                    {
                        data: [
                            stats.valenceCounts.positive,
                            stats.valenceCounts.neutral,
                            stats.valenceCounts.negative,
                        ],
                        backgroundColor: [
                            "#22c55e",
                            "#94a3b8",
                            "#ef4444",
                        ],
                        borderWidth: 0,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: { color: textColor },
                    },
                },
            },
        });
    } else {
        mixEmpty.style.display = "grid";
    }
};

const renderStats = (account, stats) => {
    const emotionalBalance =
        account?.analysis?.emotionalBalance ??
        account?.analysis?.emotional_balance ??
        null;
    const processScore =
        account?.analysis?.processScore ??
        account?.analysis?.process_score ??
        null;

    if (stats?.rating !== null) {
        setText("psych-rating", `${stats.rating}/100`);
        const trendText = stats.averageScore >= 0 ? "Positive trend" : "Needs focus";
        const trendChip = document.getElementById("rating-trend");
        trendChip.textContent = trendText;
        trendChip.className = `chip ${
            stats.averageScore >= 0 ? "chip-positive" : "chip-negative"
        }`;
    }

    if (emotionalBalance !== null) {
        setText("emotion-balance", emotionalBalance.toString());
    } else if (stats) {
        const balance = stats.valenceCounts.positive - stats.valenceCounts.negative;
        setText("emotion-balance", balance >= 0 ? `+${balance}` : balance);
    }

    setText("tilt-risk", formatPercent(stats?.tiltRisk));

    if (processScore !== null) {
        setText("discipline-score", processScore.toString());
    } else if (stats?.rating !== null) {
        setText("discipline-score", `${stats.rating}/100`);
    }

    setText("top-trigger", stats?.topTrigger || "—");
    setText("recovery-rate", formatPercent(stats?.recoveryRate));
    const consistency = stats?.totalEmotions
        ? (stats.valenceCounts.positive / stats.totalEmotions) * 100
        : null;
    setText("emotion-consistency", formatPercent(consistency));
};

const loadPsychology = async () => {
    const token = await getToken();
    const [account, strategyContext] = await Promise.all([
        window.getAccountData ? window.getAccountData() : null,
        token ? fetchStrategyContext(token) : null,
    ]);
    if (!account) {
        return;
    }
    const trades = getTradesArray(account?.trades || {});
    const strategies = extractStrategies(strategyContext);
    const rules = buildPsychologyRules(strategies);

    renderRules(rules);
    renderActions();

    const stats = computeEmotionStats(trades);
    cachedStats = stats;

    renderStats(account, stats);
    renderCharts(stats);
    renderInsights(stats);
    renderConnotations(stats.emotionCounts, rules);

    const analyticsNote = document.getElementById("analytics-note");
    if (analyticsNote) {
        analyticsNote.textContent = `Last ${Math.min(trades.length, 30)} trades`;
    }
};

document.getElementById("action-add").addEventListener("click", handleAddAction);
document.getElementById("action-input").addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        handleAddAction();
    }
});
document
    .getElementById("action-add-cta")
    .addEventListener("click", () =>
        document.getElementById("action-input").focus()
    );

document
    .getElementById("psychology-refresh")
    .addEventListener("click", loadPsychology);

document.getElementById("insight-refresh").addEventListener("click", () => {
    if (cachedStats) renderInsights(cachedStats);
});

document.getElementById("theme-toggle").addEventListener("click", () => {
    if (cachedStats) {
        setTimeout(() => renderCharts(cachedStats), 0);
    }
});

loadPsychology();

