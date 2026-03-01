const DELETE_ENDPOINT = "https://delete-trade-b52ovbio5q-uc.a.run.app";
const CLOSE_ENDPOINT = "https://close-trade-b52ovbio5q-uc.a.run.app";

const entriesGrid = document.getElementById("entries-grid");
const entryTemplate = document.getElementById("entry-template");
const emptyState = document.getElementById("entries-empty");

const filterType = document.getElementById("filter-type");
const filterResult = document.getElementById("filter-result");
const filterStatus = document.getElementById("filter-status");
const filterStrategy = document.getElementById("filter-strategy");
const filterEmotion = document.getElementById("filter-emotion");
const clearFiltersButton = document.getElementById("clear-filters");

let allTrades = [];
let strategyLookup = {};

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

const convertUnixToMonthDayYear = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

const getTradesArray = (trades = {}) =>
    Object.entries(trades).map(([id, trade]) => ({ id, ...trade }));

const resolveTradeStrategies = (strategyField) => {
    if (!strategyField || strategyField === "") {
        return [];
    }

    const values = Array.isArray(strategyField) ? strategyField : [strategyField];
    return values
        .map((value) => {
            const strategy = strategyLookup[value];
            return strategy && strategy.name ? strategy.name : value;
        })
        .filter((value) => value);
};

const sortTradesByDate = (trades) =>
    [...trades].sort((a, b) => safeNumber(b.date) - safeNumber(a.date));

const populateFilterOptions = (trades) => {
    const strategies = new Set();
    const emotions = new Set();

    trades.forEach((trade) => {
        if (trade.strategy && trade.strategy !== "") {
            resolveTradeStrategies(trade.strategy).forEach((s) => strategies.add(s));
        }
        if (trade.emotion && trade.emotion !== "") {
            emotions.add(trade.emotion);
        }
    });

    filterStrategy.innerHTML = '<option value="all">All</option>';
    Array.from(strategies)
        .sort()
        .forEach((strategy) => {
            const option = document.createElement("option");
            option.value = strategy;
            option.textContent = strategy;
            filterStrategy.appendChild(option);
        });

    filterEmotion.innerHTML = '<option value="all">All</option>';
    Array.from(emotions)
        .sort()
        .forEach((emotion) => {
            const option = document.createElement("option");
            option.value = emotion;
            option.textContent = emotion;
            filterEmotion.appendChild(option);
        });
};

const filterTrades = (trades) =>
    trades.filter((trade) => {
        if (filterType.value !== "all" && trade.type !== filterType.value) {
            return false;
        }

        if (filterResult.value !== "all") {
            const pl = getTradePL(trade);
            if (filterResult.value === "win" && pl <= 0) return false;
            if (filterResult.value === "loss" && pl >= 0) return false;
        }

        if (filterStatus.value !== "all") {
            const isOpen = trade.open === true || trade.open === "true";
            if (filterStatus.value === "open" && !isOpen) return false;
            if (filterStatus.value === "closed" && isOpen) return false;
        }

        if (filterStrategy.value !== "all") {
            const resolved = resolveTradeStrategies(trade.strategy);
            if (!resolved.includes(filterStrategy.value)) return false;
        }

        if (filterEmotion.value !== "all" && trade.emotion !== filterEmotion.value) {
            return false;
        }

        return true;
    });

const renderEmptyState = (isVisible) => {
    if (!emptyState) return;
    emptyState.hidden = !isVisible;
};

const renderTrades = (trades) => {
    if (!entriesGrid || !entryTemplate) return;
    entriesGrid.innerHTML = "";

    if (!trades.length) {
        renderEmptyState(true);
        return;
    }

    renderEmptyState(false);
    const fragment = document.createDocumentFragment();

    trades.forEach((trade) => {
        const card = entryTemplate.content.firstElementChild.cloneNode(true);
        const symbol = card.querySelector(".entry-symbol");
        const meta = card.querySelector(".entry-meta");
        const status = card.querySelector(".entry-status");
        const strategy = card.querySelector(".entry-strategy");
        const emotion = card.querySelector(".entry-emotion");
        const date = card.querySelector(".entry-date");
        const pl = card.querySelector(".entry-pl");
        const media = card.querySelector(".entry-media");
        const img = card.querySelector(".entry-img");
        const viewButton = card.querySelector(".entry-view");
        const closeButton = card.querySelector(".entry-close");
        const deleteButton = card.querySelector(".entry-delete");

        symbol.textContent = trade.symbol || "â€”";
        meta.textContent = trade.direction || trade.type || "â€”";

        const isOpen = trade.open === true || trade.open === "true";
        const rank = trade.Rank && !isOpen ? trade.Rank : null;
        status.classList.remove(
            "status-open",
            "status-closed",
            "entry-rank",
            "entry-rank-Terrible",
            "entry-rank-Bad",
            "entry-rank-Mediocre",
            "entry-rank-Good",
            "entry-rank-Great",
            "entry-rank-Excellent"
        );
        if (rank) {
            status.textContent = rank;
            status.classList.add("entry-rank", `entry-rank-${rank}`);
        } else {
            status.textContent = isOpen ? "Open" : "Closed";
            status.classList.add(isOpen ? "status-open" : "status-closed");
        }

        const strategyText = resolveTradeStrategies(trade.strategy).join(", ");
        strategy.textContent = strategyText || "â€”";
        emotion.textContent = trade.emotion || "â€”";
        if (trade.date) {
            date.textContent = convertUnixToMonthDayYear(
                Math.floor(safeNumber(trade.date))
            );
        } else {
            date.textContent = "â€”";
        }

        const plValue = getTradePL(trade);
        pl.textContent = formatSignedCurrency(plValue);
        pl.classList.toggle("positive", plValue >= 0);
        pl.classList.toggle("negative", plValue < 0);

        if (trade.img) {
            media.hidden = false;
            img.src = trade.img;
        } else {
            media.hidden = true;
        }

        if (!isOpen) {
            closeButton.style.display = "none";
        }

        viewButton.addEventListener("click", () => {
            localStorage.setItem("tradeView", trade.id);
            window.location.href = "/TradeLoggingRewrite/tradelogging.html";
        });

        closeButton.addEventListener("click", async () => {
            await closeTrade(trade.id);
            await loadEntries();
        });

        deleteButton.addEventListener("click", async () => {
            await deleteTrade(trade.id);
            await loadEntries();
        });

        fragment.appendChild(card);
    });

    entriesGrid.appendChild(fragment);
};

const deleteTrade = async (tradeId) => {
    const token = window.getAuthToken ? await window.getAuthToken() : null;
    if (!token) return;
    await fetch(DELETE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, trade_id: tradeId }),
    });
};

const closeTrade = async (tradeId) => {
    const token = window.getAuthToken ? await window.getAuthToken() : null;
    if (!token) return;
    await fetch(CLOSE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, trade_id: tradeId }),
    });
};

const loadEntries = async () => {
    const account = window.getAccountData
        ? await window.getAccountData()
        : null;
    if (!account) {
        renderEmptyState(true);
        return;
    }
    strategyLookup = account?.strategies || {};
    const trades = getTradesArray(account?.trades || {});
    allTrades = sortTradesByDate(trades);

    populateFilterOptions(allTrades);
    const filtered = filterTrades(allTrades);
    renderTrades(filtered);
    setText("entries-subtitle", `${allTrades.length} trades`);
};

const handleFilterChange = () => {
    const filtered = filterTrades(allTrades);
    renderTrades(filtered);
};

filterType?.addEventListener("change", handleFilterChange);
filterResult?.addEventListener("change", handleFilterChange);
filterStatus?.addEventListener("change", handleFilterChange);
filterStrategy?.addEventListener("change", handleFilterChange);
filterEmotion?.addEventListener("change", handleFilterChange);

clearFiltersButton?.addEventListener("click", () => {
    filterType.value = "all";
    filterResult.value = "all";
    filterStatus.value = "all";
    filterStrategy.value = "all";
    filterEmotion.value = "all";
    renderTrades(allTrades);
});

loadEntries();
