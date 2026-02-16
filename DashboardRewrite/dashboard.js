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

let accountData = null;

const notify = (message, type = "error") => {
    if (window.showNotification) {
        window.showNotification(message, type);
    } else {
        console.warn(message);
    }
};

const getAuthTokenSafe = async () =>
    window.getAuthToken ? await window.getAuthToken() : null;

const refreshAccountData = async () => {
    const account = window.getAccountData
        ? await window.getAccountData()
        : null;
    accountData = account;
    return account;
};

const setMainVisibility = (isVisible) => {
    const main = document.querySelector(".main");
    if (main) {
        main.style.display = isVisible ? "flex" : "none";
    }
};

const setLoaderVisible = (isVisible, text = "Loading your workspace...") => {
    const loader = document.getElementById("dashboard-full-loader");
    if (!loader) return;
    const loaderText = loader.querySelector(".loader-text");
    if (loaderText) {
        loaderText.textContent = text;
    }
    loader.style.display = isVisible ? "flex" : "none";
};

const getTradesArray = (trades = {}) =>
    Object.entries(trades).map(([id, trade]) => ({
        id,
        ...trade,
    }));

const isDemoMode = () => window.CE_DEMO_MODE === true;

const getTrialDaysLeftLocal = () => {
    const trialStartedAt = accountData?.trialStartedAt;
    if (!trialStartedAt) {
        return null;
    }
    const elapsedSeconds = Math.max(0, Date.now() / 1000 - trialStartedAt);
    const daysElapsed = Math.floor(elapsedSeconds / 86400);
    return Math.max(0, 10 - daysElapsed);
};

const isTrialActiveLocal = () => {
    if (accountData?.trialActive !== undefined) {
        return accountData.trialActive;
    }
    const daysLeft = getTrialDaysLeftLocal();
    const tradeCount = Number(accountData?.trialTradeCount || 0);
    return Boolean(daysLeft && daysLeft > 0 && tradeCount < 10);
};

const setText = (id, value) => {
    const node = document.getElementById(id);
    if (node) {
        node.textContent = value;
    }
};

const renderHeader = (account) => {
    setText("user-name", account?.name || "Trader");
    const date = new Date();
    setText(
        "current-date",
        date.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        })
    );
};

const renderStats = (trades) => {
    let totalPL = 0;
    let totalProfit = 0;
    let totalLoss = 0;
    let wins = 0;
    let losses = 0;

    trades.forEach((trade) => {
        const plValue = getTradePL(trade);
        totalPL += plValue;
        if (plValue > 0) {
            wins += 1;
            totalProfit += plValue;
        } else if (plValue < 0) {
            losses += 1;
            totalLoss += Math.abs(plValue);
        }
    });

    const totalTrades = wins + losses;
    const winrate = totalTrades ? Math.round((wins / totalTrades) * 100) : 0;
    const avgWin = wins ? totalProfit / wins : 0;
    const avgLoss = losses ? totalLoss / losses : 0;
    const profitFactor = totalLoss ? totalProfit / totalLoss : null;

    setText("net-return", formatSignedCurrency(totalPL));
    setText("winrate", `${winrate}%`);
    setText(
        "winrate-subtitle",
        totalTrades ? `${wins}/${totalTrades} trades` : "—"
    );
    setText(
        "avg-win-loss",
        wins || losses
            ? `${formatCurrency(avgWin)} / ${formatCurrency(avgLoss)}`
            : "—"
    );
    setText(
        "profit-factor",
        profitFactor ? profitFactor.toFixed(2) : "—"
    );

    const donut = document.getElementById("winrate-donut");
    if (donut) {
        donut.style.setProperty("--pct", winrate);
    }

    const gauge = document.getElementById("profit-gauge");
    if (gauge && profitFactor) {
        const pfPercent = Math.min(profitFactor / 4, 1) * 100;
        gauge.style.setProperty("--pct", pfPercent.toFixed(0));
    }

    return { wins, totalTrades };
};

const renderCalendar = (trades) => {
    const calendarGrid = document.getElementById("calendar-grid");
    if (!calendarGrid) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const calendarTitle = document.getElementById("calendar-title");
    if (calendarTitle) {
        calendarTitle.firstChild.textContent = `${now.toLocaleDateString(
            "en-US",
            { month: "long" }
        )} ${year} `;
    }

    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const tradeMap = {};
    trades.forEach((trade) => {
        if (!trade.date) return;
        const tradeDate = new Date(trade.date * 1000);
        if (tradeDate.getFullYear() !== year || tradeDate.getMonth() !== month) {
            return;
        }
        const day = tradeDate.getDate();
        if (!tradeMap[day]) {
            tradeMap[day] = { count: 0, totalPL: 0 };
        }
        tradeMap[day].count += 1;
        tradeMap[day].totalPL += getTradePL(trade);
    });

    const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const headerRow = document.createElement("div");
    headerRow.className = "calendar-row calendar-head";
    weekdayLabels.forEach((label) => {
        const span = document.createElement("span");
        span.textContent = label;
        headerRow.appendChild(span);
    });

    calendarGrid.innerHTML = "";
    calendarGrid.appendChild(headerRow);

    let dayCounter = 1;
    let nextMonthDay = 1;
    const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;

    for (let cell = 0; cell < totalCells; cell += 7) {
        const row = document.createElement("div");
        row.className = "calendar-row";

        for (let i = 0; i < 7; i += 1) {
            const cellIndex = cell + i;
            const cellDiv = document.createElement("div");
            cellDiv.className = "calendar-cell";

            if (cellIndex < startDay) {
                cellDiv.classList.add("muted");
                cellDiv.textContent =
                    daysInPrevMonth - (startDay - cellIndex) + 1;
            } else if (dayCounter > daysInMonth) {
                cellDiv.classList.add("muted");
                cellDiv.textContent = nextMonthDay;
                nextMonthDay += 1;
            } else {
                cellDiv.textContent = dayCounter;
                const tradeInfo = tradeMap[dayCounter];
                if (tradeInfo) {
                    const pl = document.createElement("span");
                    pl.className = `trade ${
                        tradeInfo.totalPL >= 0 ? "positive" : "negative"
                    }`;
                    pl.textContent = formatSignedCurrency(tradeInfo.totalPL);

                    const count = document.createElement("span");
                    count.className = "trade muted";
                    count.textContent = `${tradeInfo.count} ${
                        tradeInfo.count === 1 ? "trade" : "trades"
                    }`;
                    cellDiv.appendChild(pl);
                    cellDiv.appendChild(count);
                }
                dayCounter += 1;
            }
            row.appendChild(cellDiv);
        }
        calendarGrid.appendChild(row);
    }
};

const renderRecentTrades = (trades) => {
    const container = document.getElementById("recent-trades");
    if (!container) return;

    const sorted = [...trades]
        .filter((trade) => trade.date)
        .sort((a, b) => b.date - a.date)
        .slice(0, 4);

    container.innerHTML = "";
    sorted.forEach((trade) => {
        const row = document.createElement("div");
        row.className = "trade-row";

        const symbol = document.createElement("span");
        symbol.textContent = trade.symbol || "—";

        const type = document.createElement("span");
        type.className = "trade-type";
        type.textContent = trade.direction || trade.type || "—";

        const pnl = document.createElement("span");
        const plValue = getTradePL(trade);
        pnl.className = `trade-pnl ${plValue >= 0 ? "positive" : "negative"}`;
        pnl.textContent = formatSignedCurrency(plValue);

        row.appendChild(symbol);
        row.appendChild(type);
        row.appendChild(pnl);
        container.appendChild(row);
    });
};


const renderDashboard = (account) => {
    const trades = getTradesArray(account?.trades || {});

    renderHeader(account);
    const { wins, totalTrades } = renderStats(trades);
    setText(
        "recent-trades-subtitle",
        totalTrades ? `${wins}/${totalTrades} wins` : "—"
    );
    renderCalendar(trades);
    renderRecentTrades(trades);
};

const maybeShowTrialReminder = () => {
    if (!isTrialActiveLocal()) {
        return;
    }

    const daysLeft = getTrialDaysLeftLocal();
    if (daysLeft === null || daysLeft > 3 || daysLeft <= 0) {
        return;
    }

    const notification = document.getElementById("trial-notification");
    const closeButton = document.getElementById("trial-notification-close");
    const ctaButton = document.getElementById("trial-notification-cta");
    if (!notification) {
        return;
    }

    notification.style.display = "block";
    if (ctaButton) {
        ctaButton.onclick = () => startCheckout(ctaButton);
    }
    if (closeButton) {
        closeButton.onclick = () => {
            notification.classList.add("hide");
            setTimeout(() => {
                notification.style.display = "none";
                notification.classList.remove("hide");
            }, 300);
        };
    }
};

const showTrialStartedNotification = () => {
    const notification = document.getElementById("trial-started-notification");
    const closeButton = document.getElementById("trial-started-close");
    if (!notification) {
        return;
    }

    notification.style.display = "block";
    lucide.createIcons();
    if (closeButton) {
        closeButton.onclick = () => {
            notification.classList.add("hide");
            setTimeout(() => {
                notification.style.display = "none";
                notification.classList.remove("hide");
            }, 300);
        };
    }
};

const startCheckout = async (button) => {
    const token = await getAuthTokenSafe();
    if (!token) {
        window.location.href = "../HomeRewrite/login.html";
        return;
    }

    const originalText = button ? button.textContent : "";
    try {
        if (button) {
            button.disabled = true;
            button.textContent = "Processing...";
        }
        const plan = button?.dataset?.plan || "monthly";

        const response = await fetch(
            "https://create-checkout-session-b52ovbio5q-uc.a.run.app",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token, plan }),
            }
        );

        const checkoutUrl = await response.text();
        const isValidUrl =
            typeof checkoutUrl === "string" &&
            checkoutUrl.startsWith("https://");
            console.log("hello")
        if (response.ok && isValidUrl) {
            localStorage.setItem("pendingProCheckout", "true");
            window.location.href = checkoutUrl;
            return;
        }

        console.error("Failed to create checkout session:", checkoutUrl);
        notify("Failed to start checkout. Please try again.", "error");
    } catch (error) {
        console.error("Error creating checkout session:", error);
        notify("An error occurred. Please try again.", "error");
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = originalText;
        }
    }
};

const checkAndShowSubscriptionGate = () => {
    const gate = document.getElementById("subscription-gate");
    const main = document.querySelector(".main");
    const membership = accountData?.membership;
    const demoMode = isDemoMode();
    if (demoMode) {
        if (gate) {
            gate.style.display = "none";
        }
        if (main) {
            main.style.display = "flex";
        }
        return true;
    }
    if (!membership) {
        if (gate) {
            gate.style.display = "none";
        }
        if (main) {
            main.style.display = "flex";
        }
        return true;
    }

    const normalized = membership.toLowerCase();
    const isStandard = normalized === "standard";
    const isPro = normalized === "pro";
    const hasActiveTrial = isTrialActiveLocal();

    if (isStandard && !hasActiveTrial) {
        if (gate) {
            gate.style.display = "flex";
        }
        if (main) {
            main.style.display = "none";
        }
        lucide.createIcons();
        const ctaButton = document.getElementById("subscription-gate-cta");
        if (ctaButton) {
            ctaButton.onclick = () => startCheckout(ctaButton);
        }
        return false;
    }

    if (gate) {
        gate.style.display = "none";
    }
    if (main) {
        main.style.display = "flex";
    }
    return true;
};

const waitForProMembershipSync = async () => {
    const maxAttempts = 45;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const membership = accountData?.membership?.toLowerCase();
        if (membership === "pro") {
            localStorage.removeItem("pendingProCheckout");
            return true;
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await refreshAccountData();
    }
    return false;
};

const markPostSignupWalkthroughComplete = async () => {
    try {
        const token = await getAuthTokenSafe();
        if (!token) {
            return;
        }
        await fetch(
            "https://complete-post-signup-walkthrough-b52ovbio5q-uc.a.run.app",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token }),
            }
        );
    } catch (error) {
        console.warn("Failed to mark walkthrough complete:", error);
    }
};

const maybeShowPostSignupWalkthrough = () => {
    const walkthroughModal = document.getElementById("post-signup-walkthrough");
    if (!walkthroughModal || !accountData) {
        return false;
    }

    const completedServer =
        accountData.postSignupWalkthroughCompleted === true;

    if (!completedServer) {
        showPostSignupWalkthrough();
        return true;
    }

    return false;
};

const showPostSignupWalkthrough = () => {
    const walkthroughModal = document.getElementById("post-signup-walkthrough");
    if (!walkthroughModal) {
        return;
    }
    const closeButton = document.getElementById("post-signup-close");
    const prevButton = document.getElementById("post-signup-prev");
    const nextButton = document.getElementById("post-signup-next");
    const ctaButton = document.getElementById("post-signup-cta");
    const progressDots = walkthroughModal.querySelectorAll(
        ".quick-tour-progress-dot"
    );
    const slides = walkthroughModal.querySelectorAll(".quick-tour-slide");

    let currentSlide = 1;
    const totalSlides = slides.length;

    const updateSlide = () => {
        slides.forEach((slide, index) => {
            if (index + 1 === currentSlide) {
                slide.classList.add("active");
            } else {
                slide.classList.remove("active");
            }
        });

        progressDots.forEach((dot, index) => {
            if (index + 1 === currentSlide) {
                dot.classList.add("active");
            } else {
                dot.classList.remove("active");
            }
        });

        if (prevButton) {
            prevButton.disabled = currentSlide === 1;
        }
        if (nextButton) {
            nextButton.style.display =
                currentSlide === totalSlides ? "none" : "inline-flex";
        }

        slides.forEach((slide, index) => {
            const video = slide.querySelector(".walkthrough-video");
            if (!video) {
                return;
            }

            if (index + 1 === currentSlide) {
                if (!video.getAttribute("src") && video.dataset.src) {
                    video.setAttribute("src", video.dataset.src);
                    video.load();
                }
                video.currentTime = 0;
                const playPromise = video.play();
                if (playPromise && typeof playPromise.catch === "function") {
                    playPromise.catch(() => {});
                }
            } else {
                video.pause();
                video.currentTime = 0;
            }
        });

        lucide.createIcons();
    };

    const nextSlide = () => {
        if (currentSlide < totalSlides) {
            currentSlide += 1;
            updateSlide();
        }
    };

    const prevSlide = () => {
        if (currentSlide > 1) {
            currentSlide -= 1;
            updateSlide();
        }
    };

    const closeWalkthrough = () => {
        walkthroughModal.classList.remove("show");
    };

    const finishWalkthrough = async () => {
        await markPostSignupWalkthroughComplete();
        closeWalkthrough();
        checkAndShowSubscriptionGate();
    };

    walkthroughModal.classList.add("show");
    setMainVisibility(false);
    const gate = document.getElementById("subscription-gate");
    if (gate) {
        gate.style.display = "none";
    }

    updateSlide();

    if (nextButton) {
        nextButton.addEventListener("click", nextSlide);
    }
    if (prevButton) {
        prevButton.addEventListener("click", prevSlide);
    }
    progressDots.forEach((dot, index) => {
        dot.addEventListener("click", () => {
            currentSlide = index + 1;
            updateSlide();
        });
    });
    if (ctaButton) {
        ctaButton.addEventListener("click", () => finishWalkthrough());
    }
    if (closeButton) {
        closeButton.addEventListener("click", () => {
            markPostSignupWalkthroughComplete();
            closeWalkthrough();
            checkAndShowSubscriptionGate();
        });
    }
};

const initDashboard = async () => {
    setMainVisibility(false);
    const account = await refreshAccountData();
    if (!account) {
        console.error("No account data available for dashboard.");
        return;
    }

    if (localStorage.getItem("pendingProCheckout") === "true") {
        setLoaderVisible(true, "Finalizing your subscription...");
        const synced = await waitForProMembershipSync();
        setLoaderVisible(false);
        if (!synced) {
            return;
        }
    }

    renderDashboard(account);
    const demoPill = document.getElementById("demo-pill");
    const demoCard = document.getElementById("demo-insights-card");
    const demoButton = document.getElementById("demo-start-trial");
    if (isDemoMode()) {
        if (demoPill) demoPill.style.display = "inline-flex";
        if (demoCard) demoCard.style.display = "block";
        if (demoButton) {
            demoButton.addEventListener("click", () => {
                if (window.startTrialCheckout) {
                    window.startTrialCheckout(demoButton);
                } else {
                    startCheckout(demoButton);
                }
            });
        }
    } else {
        if (demoPill) demoPill.style.display = "none";
        if (demoCard) demoCard.style.display = "none";
    }
    maybeShowTrialReminder();
    const walkthroughShown = maybeShowPostSignupWalkthrough();
    if (walkthroughShown) {
        return;
    }

    if (checkAndShowSubscriptionGate()) {
        setMainVisibility(true);
    }
};

initDashboard();

