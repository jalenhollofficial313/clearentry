// Analytics State
let currentRange = 'month';
let customStartDate = null;
let customEndDate = null;
let allTrades = [];
let allPreTradeSessions = {};
let allStrategies = {};

// Helper function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Get trades ordered by date
function getTradesOrder(table) {
    let tableArray = Object.entries(table).map(([key, value]) => {
        return { ...value, id: key };
    });
    tableArray.sort((a, b) => b['date'] - a['date']);
    return tableArray;
}

// Get time range boundaries
function getTimeRangeBoundaries(range) {
    const now = new Date();
    let startDate, endDate;
    
    if (range === 'week') {
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
    } else if (range === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (range === 'custom') {
        if (customStartDate && customEndDate) {
            startDate = new Date(customStartDate);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(customEndDate);
            endDate.setHours(23, 59, 59, 999);
        } else {
            // Default to month if custom dates not set
            startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        }
    } else {
        startDate = new Date(0);
        endDate = new Date();
    }
    
    return {
        startUnix: Math.floor(startDate.getTime() / 1000),
        endUnix: Math.floor(endDate.getTime() / 1000)
    };
}

// Filter trades by time range
function filterTradesByRange(trades, range) {
    const { startUnix, endUnix } = getTimeRangeBoundaries(range);
    return trades.filter(trade => {
        const tradeDate = trade.date;
        return tradeDate >= startUnix && tradeDate <= endUnix;
    });
}

// Classify trade compliance
function classifyTradeCompliance(trade) {
    // Check if trade has AI compliance status (preferred)
    if (trade.ruleComplianceStatus) {
        if (trade.ruleComplianceStatus === 'rule-following') return 'rule-following';
        if (trade.ruleComplianceStatus === 'rule-breaking') return 'rule-breaking';
    }
    
    // Otherwise, check preTradeSessionId
    if (!trade.preTradeSessionId || !trade.preTradeSessionId.trim()) {
        return 'unknown';
    }
    
    const preTradeSession = allPreTradeSessions[trade.preTradeSessionId];
    if (!preTradeSession) {
        return 'unknown';
    }
    
    // Check if session had violations
    if (preTradeSession.proceededWithViolations || 
        (preTradeSession.violations && preTradeSession.violations.length > 0)) {
        return 'rule-breaking';
    }
    
    return 'rule-following';
}

// Calculate Rule-Following Rate
function calculateRuleFollowingRate(trades) {
    const classified = trades.map(t => classifyTradeCompliance(t));
    const following = classified.filter(c => c === 'rule-following').length;
    const breaking = classified.filter(c => c === 'rule-breaking').length;
    const total = following + breaking;
    
    if (total === 0) return { rate: 0, following, breaking, total };
    
    return {
        rate: Math.round((following / total) * 100),
        following,
        breaking,
        total
    };
}

// Calculate Top Broken Rule
function calculateTopBrokenRule(trades) {
    const violationCounts = {};
    
    trades.forEach(trade => {
        if (classifyTradeCompliance(trade) !== 'rule-breaking') return;
        
        const preTradeSession = trade.preTradeSessionId ? allPreTradeSessions[trade.preTradeSessionId] : null;
        if (!preTradeSession || !preTradeSession.violations) return;
        
        preTradeSession.violations.forEach(violation => {
            const key = violation.key || violation.message || 'Unknown';
            violationCounts[key] = (violationCounts[key] || 0) + 1;
        });
    });
    
    if (Object.keys(violationCounts).length === 0) {
        return { rule: 'N/A', count: 0 };
    }
    
    const sorted = Object.entries(violationCounts).sort((a, b) => b[1] - a[1]);
    return {
        rule: sorted[0][0],
        count: sorted[0][1]
    };
}

// Calculate Discipline Streak
function calculateDisciplineStreak(trades) {
    // Sort trades by date (oldest first for streak calculation)
    const sortedTrades = [...trades].sort((a, b) => a.date - b.date);
    let streak = 0;
    
    for (let i = sortedTrades.length - 1; i >= 0; i--) {
        const compliance = classifyTradeCompliance(sortedTrades[i]);
        if (compliance === 'rule-following') {
            streak++;
        } else {
            break; // Streak ends on first rule-breaking or unknown
        }
    }
    
    return streak;
}

// Calculate Proof Metrics for a set of trades
function calculateProofMetrics(trades) {
    const plValues = trades.map(t => {
        const pl = t.PL;
        const plValue = (pl !== undefined && pl !== null && pl !== '') ? Number(pl) : 0;
        return isNaN(plValue) ? 0 : plValue;
    });
    
    const totalPL = plValues.reduce((sum, pl) => sum + pl, 0);
    const avgPL = plValues.length > 0 ? totalPL / plValues.length : 0;
    
    const wins = plValues.filter(pl => pl > 0);
    const losses = plValues.filter(pl => pl < 0);
    const winRate = plValues.length > 0 ? Math.round((wins.length / plValues.length) * 100) : 0;
    
    const totalWins = wins.reduce((sum, pl) => sum + pl, 0);
    const totalLosses = Math.abs(losses.reduce((sum, pl) => sum + pl, 0));
    
    let profitFactor = 'N/A';
    if (totalLosses > 0) {
        profitFactor = (totalWins / totalLosses).toFixed(2);
    } else if (totalWins > 0) {
        profitFactor = '∞';
    }
    
    const expectancy = avgPL;
    
    return {
        trades: plValues.length,
        avgPL,
        winRate,
        profitFactor,
        expectancy,
        totalPL
    };
}

// Get time bucket from timestamp
function getTimeBucket(timestamp) {
    const date = new Date(timestamp * 1000);
    const hour = date.getHours();
    const minute = date.getMinutes();
    const timeMinutes = hour * 60 + minute;
    
    if (timeMinutes < 570) return 'Pre-market'; // Before 9:30
    if (timeMinutes < 660) return 'Open'; // 9:30-11:00
    if (timeMinutes < 840) return 'Midday'; // 11:00-14:00
    if (timeMinutes < 960) return 'Power Hour'; // 14:00-16:00
    return 'After Hours'; // After 16:00
}

// Calculate Emotion Triggers
function calculateEmotionTriggers(trades) {
    const emotionStats = {};
    
    trades.forEach(trade => {
        const compliance = classifyTradeCompliance(trade);
        if (compliance === 'unknown') return;
        
        const preTradeSession = trade.preTradeSessionId ? allPreTradeSessions[trade.preTradeSessionId] : null;
        const emotion = preTradeSession?.emotionalState || trade.emotion || 'Unknown';
        
        if (!emotionStats[emotion]) {
            emotionStats[emotion] = { total: 0, breaking: 0 };
        }
        
        emotionStats[emotion].total++;
        if (compliance === 'rule-breaking') {
            emotionStats[emotion].breaking++;
        }
    });
    
    return Object.entries(emotionStats).map(([emotion, stats]) => ({
        emotion,
        breakingRate: stats.total > 0 ? Math.round((stats.breaking / stats.total) * 100) : 0,
        breaking: stats.breaking,
        total: stats.total
    })).sort((a, b) => b.breakingRate - a.breakingRate);
}

// Calculate Time Triggers
function calculateTimeTriggers(trades) {
    const timeStats = {};
    
    trades.forEach(trade => {
        const compliance = classifyTradeCompliance(trade);
        if (compliance === 'unknown') return;
        
        const preTradeSession = trade.preTradeSessionId ? allPreTradeSessions[trade.preTradeSessionId] : null;
        const timestamp = preTradeSession?.createdAt || preTradeSession?.enteredAt || trade.date;
        const timeBucket = getTimeBucket(timestamp);
        
        if (!timeStats[timeBucket]) {
            timeStats[timeBucket] = { total: 0, breaking: 0 };
        }
        
        timeStats[timeBucket].total++;
        if (compliance === 'rule-breaking') {
            timeStats[timeBucket].breaking++;
        }
    });
    
    return Object.entries(timeStats).map(([time, stats]) => ({
        time,
        breakingRate: stats.total > 0 ? Math.round((stats.breaking / stats.total) * 100) : 0,
        breaking: stats.breaking,
        total: stats.total
    })).sort((a, b) => b.breakingRate - a.breakingRate);
}

// Calculate Top Rules (from violations)
function calculateTopRules(trades) {
    const ruleCounts = {};
    
    trades.forEach(trade => {
        if (classifyTradeCompliance(trade) !== 'rule-breaking') return;
        
        const preTradeSession = trade.preTradeSessionId ? allPreTradeSessions[trade.preTradeSessionId] : null;
        if (!preTradeSession || !preTradeSession.violations) return;
        
        preTradeSession.violations.forEach(violation => {
            const key = violation.key || violation.message || 'Unknown';
            ruleCounts[key] = (ruleCounts[key] || 0) + 1;
        });
    });
    
    return Object.entries(ruleCounts)
        .map(([rule, count]) => ({ rule, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
}

// Calculate Strategy Compliance
function calculateStrategyCompliance(trades) {
    const strategyStats = {};
    
    trades.forEach(trade => {
        const compliance = classifyTradeCompliance(trade);
        if (compliance === 'unknown') return;
        
        // Get strategy name from trade
        let strategyName = 'Unknown';
        if (trade.strategy) {
            if (Array.isArray(trade.strategy)) {
                strategyName = trade.strategy[0] || 'Unknown';
            } else {
                strategyName = trade.strategy;
            }
        } else if (trade.preTradeSessionId) {
            const preTradeSession = allPreTradeSessions[trade.preTradeSessionId];
            if (preTradeSession && preTradeSession.strategyId) {
                const strategy = allStrategies[preTradeSession.strategyId];
                if (strategy) {
                    strategyName = strategy.name || 'Unknown';
                }
            }
        }
        
        if (!strategyStats[strategyName]) {
            strategyStats[strategyName] = {
                total: 0,
                following: 0,
                breaking: 0,
                plValues: []
            };
        }
        
        strategyStats[strategyName].total++;
        if (compliance === 'rule-following') {
            strategyStats[strategyName].following++;
        } else {
            strategyStats[strategyName].breaking++;
        }
        
        const pl = trade.PL;
        const plValue = (pl !== undefined && pl !== null && pl !== '') ? Number(pl) : 0;
        if (!isNaN(plValue)) {
            strategyStats[strategyName].plValues.push(plValue);
        }
    });
    
    return Object.entries(strategyStats).map(([strategy, stats]) => {
        const followingRate = stats.total > 0 ? Math.round((stats.following / stats.total) * 100) : 0;
        const totalPL = stats.plValues.reduce((sum, pl) => sum + pl, 0);
        const expectancy = stats.plValues.length > 0 ? totalPL / stats.plValues.length : 0;
        
        return {
            strategy,
            trades: stats.total,
            followingRate,
            totalPL,
            expectancy
        };
    }).sort((a, b) => b.followingRate - a.followingRate);
}

// Format currency
function formatCurrency(value) {
    if (value >= 0) {
        return `+$${value.toFixed(2)}`;
    }
    return `-$${Math.abs(value).toFixed(2)}`;
}

// Render Section A: Execution Quality
function renderExecutionQuality(metrics) {
    document.getElementById('rule-following-rate').textContent = `${metrics.ruleFollowingRate.rate}%`;
    document.getElementById('rule-breaking-count').textContent = metrics.ruleFollowingRate.breaking.toString();
    
    const topRule = metrics.topBrokenRule;
    if (topRule.rule === 'N/A') {
        document.getElementById('top-broken-rule').textContent = 'N/A';
    } else {
        document.getElementById('top-broken-rule').textContent = `${topRule.rule} (${topRule.count}x)`;
    }
    
    document.getElementById('discipline-streak').textContent = metrics.disciplineStreak.toString();
}

// Render Section B: Proof
function renderProof(followingMetrics, breakingMetrics) {
    document.getElementById('following-trades').textContent = followingMetrics.trades.toString();
    document.getElementById('following-avg-pl').textContent = formatCurrency(followingMetrics.avgPL);
    document.getElementById('following-win-rate').textContent = `${followingMetrics.winRate}%`;
    document.getElementById('following-profit-factor').textContent = followingMetrics.profitFactor.toString();
    document.getElementById('following-expectancy').textContent = formatCurrency(followingMetrics.expectancy);
    
    document.getElementById('breaking-trades').textContent = breakingMetrics.trades.toString();
    document.getElementById('breaking-avg-pl').textContent = formatCurrency(breakingMetrics.avgPL);
    document.getElementById('breaking-win-rate').textContent = `${breakingMetrics.winRate}%`;
    document.getElementById('breaking-profit-factor').textContent = breakingMetrics.profitFactor.toString();
    document.getElementById('breaking-expectancy').textContent = formatCurrency(breakingMetrics.expectancy);
}

// Render Section C: Patterns - Triggers
function renderTriggers(emotionTriggers, timeTriggers, topRules) {
    // Emotion triggers
    const emotionList = document.getElementById('emotion-triggers-list');
    emotionList.innerHTML = '';
    
    if (emotionTriggers.length === 0) {
        emotionList.innerHTML = '<p class="inter-text" style="color: #86909a; padding: 20px; text-align: center;">No data available</p>';
    } else {
        emotionTriggers.forEach(trigger => {
            const item = document.createElement('div');
            item.className = 'trigger-item';
            item.innerHTML = `
                <div class="trigger-item-header">
                    <span class="inter-text">${trigger.emotion}</span>
                    <span class="inter-text">${trigger.breakingRate}% breaking rate</span>
                </div>
                <div class="trigger-item-detail inter-text">${trigger.breaking} of ${trigger.total} trades</div>
            `;
            emotionList.appendChild(item);
        });
    }
    
    // Time triggers
    const timeList = document.getElementById('time-triggers-list');
    timeList.innerHTML = '';
    
    if (timeTriggers.length === 0) {
        timeList.innerHTML = '<p class="inter-text" style="color: #86909a; padding: 20px; text-align: center;">No data available</p>';
    } else {
        timeTriggers.forEach(trigger => {
            const item = document.createElement('div');
            item.className = 'trigger-item';
            item.innerHTML = `
                <div class="trigger-item-header">
                    <span class="inter-text">${trigger.time}</span>
                    <span class="inter-text">${trigger.breakingRate}% breaking rate</span>
                </div>
                <div class="trigger-item-detail inter-text">${trigger.breaking} of ${trigger.total} trades</div>
            `;
            timeList.appendChild(item);
        });
    }
    
    // Rules triggers
    const rulesList = document.getElementById('rules-triggers-list');
    rulesList.innerHTML = '';
    
    if (topRules.length === 0) {
        rulesList.innerHTML = '<p class="inter-text" style="color: #86909a; padding: 20px; text-align: center;">No violations found</p>';
    } else {
        topRules.forEach((rule, index) => {
            const item = document.createElement('div');
            item.className = 'trigger-item';
            item.innerHTML = `
                <div class="trigger-item-header">
                    <span class="inter-text">${index + 1}. ${rule.rule}</span>
                </div>
                <div class="trigger-item-detail inter-text">Broken ${rule.count} time${rule.count !== 1 ? 's' : ''}</div>
            `;
            rulesList.appendChild(item);
        });
    }
}

// Render Section C: Strategy Compliance
function renderStrategyCompliance(strategyCompliance) {
    const tbody = document.getElementById('strategy-compliance-body');
    tbody.innerHTML = '';
    
    if (strategyCompliance.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="inter-text" style="text-align: center; padding: 20px; color: #86909a;">No strategy data available</td></tr>';
        return;
    }
    
    // Find highest and lowest compliance (min 5 trades)
    const qualified = strategyCompliance.filter(s => s.trades >= 5);
    const mostConsistent = qualified.length > 0 ? qualified.reduce((max, s) => s.followingRate > max.followingRate ? s : max, qualified[0]) : null;
    const mostBroken = qualified.length > 0 ? qualified.reduce((min, s) => s.followingRate < min.followingRate ? s : min, qualified[0]) : null;
    
    strategyCompliance.forEach(strategy => {
        const row = document.createElement('tr');
        
        let badge = '';
        if (strategy.strategy === mostConsistent?.strategy) {
            badge = '<span class="compliance-badge badge-consistent inter-text">Most Consistent</span>';
        } else if (strategy.strategy === mostBroken?.strategy && strategy.followingRate < 50) {
            badge = '<span class="compliance-badge badge-broken inter-text">Most Broken</span>';
        }
        
        row.innerHTML = `
            <td class="inter-text">${strategy.strategy} ${badge}</td>
            <td class="inter-text">${strategy.trades}</td>
            <td class="inter-text">${strategy.followingRate}%</td>
            <td class="inter-text">${formatCurrency(strategy.totalPL)}</td>
            <td class="inter-text">${formatCurrency(strategy.expectancy)}</td>
        `;
        tbody.appendChild(row);
    });
}

// Main function to compute and render all analytics
function computeAndRenderAnalytics() {
    const filteredTrades = filterTradesByRange(allTrades, currentRange);
    
    if (filteredTrades.length === 0) {
        document.getElementById('analytics-content').style.display = 'none';
        document.getElementById('analytics-empty').style.display = 'block';
        document.getElementById('analytics-loading').style.display = 'none';
        return;
    }
    
    document.getElementById('analytics-content').style.display = 'block';
    document.getElementById('analytics-empty').style.display = 'none';
    document.getElementById('analytics-loading').style.display = 'none';
    
    // Classify all trades
    const ruleFollowingTrades = filteredTrades.filter(t => classifyTradeCompliance(t) === 'rule-following');
    const ruleBreakingTrades = filteredTrades.filter(t => classifyTradeCompliance(t) === 'rule-breaking');
    
    // Section A: Execution Quality
    const ruleFollowingRate = calculateRuleFollowingRate(filteredTrades);
    const topBrokenRule = calculateTopBrokenRule(filteredTrades);
    const disciplineStreak = calculateDisciplineStreak(filteredTrades);
    
    renderExecutionQuality({
        ruleFollowingRate,
        topBrokenRule,
        disciplineStreak
    });
    
    // Section B: Proof
    const followingMetrics = calculateProofMetrics(ruleFollowingTrades);
    const breakingMetrics = calculateProofMetrics(ruleBreakingTrades);
    renderProof(followingMetrics, breakingMetrics);
    
    // Section C: Patterns
    const emotionTriggers = calculateEmotionTriggers(filteredTrades);
    const timeTriggers = calculateTimeTriggers(filteredTrades);
    const topRules = calculateTopRules(filteredTrades);
    renderTriggers(emotionTriggers, timeTriggers, topRules);
    
    const strategyCompliance = calculateStrategyCompliance(filteredTrades);
    renderStrategyCompliance(strategyCompliance);
}

// Setup range selector
function setupRangeSelector() {
    const weekBtn = document.getElementById('range-week');
    const monthBtn = document.getElementById('range-month');
    const customBtn = document.getElementById('range-custom');
    const customPicker = document.getElementById('custom-range-picker');
    const customApply = document.getElementById('custom-range-apply');
    
    [weekBtn, monthBtn, customBtn].forEach(btn => {
        btn.addEventListener('click', () => {
            [weekBtn, monthBtn, customBtn].forEach(b => b.classList.remove('range-button-active'));
            btn.classList.add('range-button-active');
            
            if (btn === customBtn) {
                customPicker.style.display = 'flex';
                currentRange = 'custom';
            } else {
                customPicker.style.display = 'none';
                currentRange = btn.id.replace('range-', '');
                computeAndRenderAnalytics();
            }
        });
    });
    
    customApply.addEventListener('click', () => {
        const start = document.getElementById('custom-start-date').value;
        const end = document.getElementById('custom-end-date').value;
        
        if (start && end) {
            customStartDate = start;
            customEndDate = end;
            computeAndRenderAnalytics();
        }
    });
}

// Setup trigger tabs
function setupTriggerTabs() {
    const tabs = document.querySelectorAll('.trigger-tab');
    const panels = document.querySelectorAll('.trigger-panel');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            tabs.forEach(t => t.classList.remove('trigger-tab-active'));
            panels.forEach(p => p.classList.remove('trigger-panel-active'));
            
            tab.classList.add('trigger-tab-active');
            document.getElementById(`trigger-${targetTab}`).classList.add('trigger-panel-active');
        });
    });
}

// Calendar state
let currentCalendarDate = new Date();

// Format month name
function getMonthName(monthIndex) {
    const months = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    return months[monthIndex];
}

// Convert unix timestamp to month/day
function convertUnixToMonthDay(unixTimestamp) {
    const date = new Date(unixTimestamp * 1000);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
}

// Utility: convert day → start/end timestamps
function getDayRange(year, month, day) {
    const start = new Date(year, month, day, 0, 0, 0);
    const end = new Date(year, month, day, 23, 59, 59);
    return {
        startUnix: Math.floor(start.getTime() / 1000),
        endUnix: Math.floor(end.getTime() / 1000),
    };
}

// Analyze trades by day for calendar
async function analyzeTradesByDay(trades, year = null, month = null) {
    if (year === null || month === null) {
        const now = new Date();
        year = now.getFullYear();
        month = now.getMonth();
    }
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const dayElements = document.querySelectorAll(
        ".MainFrame_Frame_Frame_MainStats_Calender_div"
    );
    const dayTrades = document.querySelectorAll(".trade-amount");
    const dayPL = document.querySelectorAll(".trade-pl");
    const dayEmotion = document.querySelectorAll(".trade-emotion");

    for (let day = 1; day <= daysInMonth; day++) {
        const { startUnix, endUnix } = getDayRange(year, month, day);

        const tradesForDay = trades.filter(
            (t) => t.date >= startUnix && t.date <= endUnix
        );

        const emotionCounts = {};
        for (const trade of tradesForDay) {
            if (!trade.emotion) continue;
            const e = trade.emotion.trim();
            emotionCounts[e] = (emotionCounts[e] || 0) + 1;
        }

        let mostFrequent = null;
        let maxCount = 0;
        for (const [emotion, count] of Object.entries(emotionCounts)) {
            if (count > maxCount) {
                mostFrequent = emotion;
                maxCount = count;
            }
        }

        const dailyPL = tradesForDay.reduce((sum, t) => sum + Number(t.PL || 0), 0);

        const dayEl = dayElements[day - 1];
        if (!dayEl) continue;

        const tradesAmount = dayTrades[day - 1];
        if (!tradesAmount) continue;

        const tradesPL = dayPL[day - 1];
        if (!tradesPL) continue;

        const tradesEmotion = dayEmotion[day - 1];
        if (!tradesEmotion) continue;

        if (tradesForDay.length > 0) {
            if (dailyPL > 0) {
                tradesPL.innerHTML = "+$" + dailyPL;
                tradesPL.classList.add("green-text");
                tradesPL.classList.remove("red-text");
            } else if (dailyPL < 0) {
                tradesPL.innerHTML = "-$" + Math.abs(dailyPL);
                tradesPL.classList.add("red-text");
                tradesPL.classList.remove("green-text");
            } else {
                tradesPL.innerHTML = "$" + dailyPL;
                tradesPL.classList.remove("green-text", "red-text");
            }

            tradesAmount.innerHTML = tradesForDay.length + " trade" + (tradesForDay.length !== 1 ? "s" : "");
            tradesEmotion.innerHTML = mostFrequent || "N/A";
        }
    }
}

// Load calendar for specific month/year
async function loadDate(year = null, month = null) {
    const cal = document.querySelector(".MainFrame_Frame_Frame_MainStats_Calender");
    const titleEl = document.querySelector(".MainFrame_Frame_Frame_MainStats_CalenderFrame_Title");

    // Use provided date or current calendar date
    if (year === null || month === null) {
        year = currentCalendarDate.getFullYear();
        month = currentCalendarDate.getMonth();
    } else {
        currentCalendarDate = new Date(year, month, 1);
    }

    // Update title
    if (titleEl) {
        titleEl.textContent = `${getMonthName(month)} ${year}`;
    }

    // Get the total number of days in this month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Clear existing HTML
    cal.innerHTML = "";

    // Loop through and create a div for each day of the month
    for (let d = 1; d <= daysInMonth; d++) {
        const num = String(d).padStart(2, "0");

        cal.insertAdjacentHTML(
            "beforeend",
            `
            <div class="MainFrame_Frame_Frame_MainStats_Calender_div">
            <p class="MainFrame_Frame_Frame_MainStats_Calender_div_Date inter-text">${num}</p>
            <p class="MainFrame_Frame_Frame_MainStats_Calender_div_Date_Text trade-amount inter-text"></p>
            <p class="MainFrame_Frame_Frame_MainStats_Calender_div_Date_Text trade-pl inter-text green-text"></p>
            <p class="MainFrame_Frame_Frame_MainStats_Calender_div_Date_Text trade-emotion inter-text"></p>
            </div>
            `
        );
    }

    // Re-analyze trades for the new month
    if (allTrades) {
        analyzeTradesByDay(allTrades, year, month);
    }
}

// Setup calendar navigation
function setupCalendarNavigation() {
    const prevButton = document.getElementById('calendar-prev');
    const nextButton = document.getElementById('calendar-next');
    
    if (prevButton) {
        prevButton.addEventListener('click', () => {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
            loadDate(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth());
        });
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
            loadDate(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth());
        });
    }
}


// Initialize analytics
async function initAnalytics() {
    document.getElementById('analytics-loading').style.display = 'flex';
    
    await getClientData();
    await sleep(100);
    
    // Load all data
    const trades = clientData.result?.trades || {};
    const preTradeSessions = clientData.result?.preTradeSessions || {};
    const strategies = clientData.result?.strategies || {};
    
    allTrades = getTradesOrder(trades);
    allPreTradeSessions = preTradeSessions;
    allStrategies = strategies;
    
    // Setup UI
    setupRangeSelector();
    setupTriggerTabs();
    setupCalendarNavigation();
    
    // Initialize calendar with current month
    const now = new Date();
    currentCalendarDate = new Date(now.getFullYear(), now.getMonth(), 1);
    await loadDate(now.getFullYear(), now.getMonth());
    
    // Compute and render
    computeAndRenderAnalytics();
    
    lucide.createIcons();
}

// Sidebar toggle
document.addEventListener("DOMContentLoaded", () => {
    const barIcon = document.querySelector("#bar-icon");
    const headFrame = document.querySelector(".MainFrame_HeadFrame");
    const sidebar = document.querySelector("#sidebar");
    
    if (headFrame) {
        headFrame.addEventListener("click", (e) => {
            const clickedBarIcon = e.target.closest("#bar-icon");
            if (clickedBarIcon) {
                sidebar.style.display = sidebar.style.display === "block" ? "none" : "block";
            }
        });
    }
    
    initAnalytics();
});
