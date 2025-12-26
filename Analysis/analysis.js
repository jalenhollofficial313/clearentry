// Analysis State
let currentAnalysis = null;
let generating = false;

// Helper function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Get time range boundaries (default to all time)
function getTimeRangeBoundaries() {
    // Use all trades (no time filtering)
    return {
        start: null,
        end: null,
        startUnix: 0,
        endUnix: Math.floor(Date.now() / 1000)
    };
}

// Filter and prepare data for backend
function prepareAnalysisData() {
    if (!clientData || !clientData.result) {
        return null;
    }

    const { startUnix, endUnix, start, end } = getTimeRangeBoundaries();
    
    // Get all trades (no time filtering, use all available trades)
    const allTrades = clientData.result.trades || {};
    const tradesArray = Object.entries(allTrades).map(([id, trade]) => ({
        id,
        ...trade
    })).filter(trade => {
        const tradeDate = trade.date || trade.t_Log || 0;
        return tradeDate >= startUnix && tradeDate <= endUnix;
    });

    if (tradesArray.length === 0) {
        return null;
    }

    // Get preTradeSessions and link to trades
    const allPreTradeSessions = clientData.result.preTradeSessions || {};
    const preTradeSessionsArray = [];
    const preTradeSessionsMap = {};

    Object.entries(allPreTradeSessions).forEach(([id, session]) => {
        const sessionData = { id, ...session };
        preTradeSessionsMap[id] = sessionData;
        const sessionTime = session.enteredAt || session.date || 0;
        if (sessionTime >= startUnix && sessionTime <= endUnix) {
            preTradeSessionsArray.push(sessionData);
        }
    });

    // Enrich trades with strategy names and preTradeSession data
    const enrichedTrades = tradesArray.map(trade => {
        const enriched = { ...trade };
        
        // Add strategy name
        if (trade.preTradeSessionId && preTradeSessionsMap[trade.preTradeSessionId]) {
            const session = preTradeSessionsMap[trade.preTradeSessionId];
            const strategyId = session.strategyId;
            if (strategyId && clientData.result.strategies) {
                const strategy = clientData.result.strategies[strategyId];
                if (strategy) {
                    enriched.strategyName = strategy.name || 'Unknown';
                    enriched.strategyId = strategyId;
                }
            }
        } else if (trade.strategy && Array.isArray(trade.strategy) && trade.strategy.length > 0) {
            enriched.strategyName = trade.strategy[0];
        }

        return enriched;
    });

    // Get strategies
    const strategies = clientData.result.strategies || {};

    return {
        trades: enrichedTrades,
        preTradeSessions: preTradeSessionsArray,
        strategies: strategies,
        timeRange: {
            preset: 'all',
            from: start || 'all',
            to: end || 'all'
        }
    };
}

// Call backend AI analysis
async function fetchAnalysis() {
    const analysisData = prepareAnalysisData();
    
    if (!analysisData) {
        showEmptyState();
        return;
    }

    showLoading();
    
    try {
        const response = await fetch("https://ai-reflection-request-b52ovbio5q-uc.a.run.app", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                token: localStorage.getItem("token"),
                ...analysisData
            })
        });

        const responseText = await response.json();
        console.log(responseText);

        const analysis = responseText;
        currentAnalysis = analysis;
        renderAnalysis(analysis);
        hideLoading();
        showContent();
        
        // Hide empty state after successful analysis
        document.getElementById('analysis-empty').style.display = 'none';
    } catch (error) {
        console.error("Error fetching analysis:", error);
        showError("Failed to generate analysis. Please try again.");
        hideLoading();
    }
}

// Show loading state
function showLoading() {
    document.getElementById('analysis-loading-overlay').style.display = 'flex';
    document.getElementById('analysis-content').style.display = 'none';
    document.getElementById('analysis-empty').style.display = 'none';
    setTimeout(() => {
        document.getElementById('analysis-loading-overlay').classList.add('show');
    }, 10);
    lucide.createIcons();
}

// Hide loading state
function hideLoading() {
    const overlay = document.getElementById('analysis-loading-overlay');
    overlay.classList.remove('show');
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 300);
}

// Show empty state
function showEmptyState() {
    // Only show empty state if there's no analysis yet
    if (!currentAnalysis) {
        document.getElementById('analysis-empty').style.display = 'flex';
        document.getElementById('analysis-content').style.display = 'none';
        document.getElementById('analysis-loading-overlay').style.display = 'none';
        lucide.createIcons();
    }
}

// Show content
function showContent() {
    document.getElementById('analysis-content').style.display = 'block';
    document.getElementById('analysis-empty').style.display = 'none';
    document.getElementById('analysis-loading-overlay').style.display = 'none';
}

// Show error
function showError(message) {
    alert(message);
}

// Render analysis
function renderAnalysis(analysis) {
    if (!analysis) return;

    // Render Hero Card
    renderHeroCard(analysis.summary, analysis.topIssues);

    // Render Top Issues
    renderTopIssues(analysis.topIssues);

    // Render Rule-Breaking Patterns
    renderRuleBreaking(analysis.ruleBreaking);

    // Render Emotions
    renderEmotions(analysis.emotions);

    // Render Setup Execution
    renderSetupExecution(analysis.setupExecution);

    // Render Trends
    renderTrends(analysis.trends);

    // Render Action Plan
    renderActionPlan(analysis.actionPlan);

    // Render Disclaimers
    if (analysis.disclaimers && analysis.disclaimers.length > 0) {
        renderDisclaimers(analysis.disclaimers);
    }

    lucide.createIcons();
}

// Render Hero Card
function renderHeroCard(summary, topIssues) {
    if (!summary) return;

    document.getElementById('hero-headline').textContent = summary.headline || 'Loading...';
    document.getElementById('hero-oneliner').textContent = summary.oneLiner || 'Loading...';

    if (topIssues && topIssues.length > 0) {
        const topIssue = topIssues[0];
        document.getElementById('callout-title').textContent = topIssue.title || 'Loading...';
        
        if (topIssue.cost && topIssue.cost.delta !== null && topIssue.cost.delta !== undefined && typeof topIssue.cost.delta === 'number' && !isNaN(topIssue.cost.delta)) {
            const delta = topIssue.cost.delta;
            const sign = delta >= 0 ? '+' : '';
            document.getElementById('callout-cost').textContent = `Estimated Cost: ${sign}$${Math.abs(delta).toFixed(2)}`;
        } else if (topIssue.cost && topIssue.cost.estimateNote) {
            document.getElementById('callout-cost').textContent = topIssue.cost.estimateNote;
        } else {
            document.getElementById('callout-cost').textContent = '';
        }
    }
}

// Render Top Issues
function renderTopIssues(topIssues) {
    const container = document.getElementById('top-issues-container');
    if (!topIssues || topIssues.length === 0) {
        container.innerHTML = '<p class="no-data-text inter-text">No issues identified yet.</p>';
        return;
    }

    container.innerHTML = topIssues.slice(0, 3).map((issue, index) => {
        const costHtml = issue.cost ? `
            <div class="issue-cost">
                <div class="cost-label inter-text">Cost Comparison</div>
                ${(issue.cost.pnlFollowing !== null && issue.cost.pnlFollowing !== undefined && typeof issue.cost.pnlFollowing === 'number' && !isNaN(issue.cost.pnlFollowing)) && 
                  (issue.cost.pnlBreaking !== null && issue.cost.pnlBreaking !== undefined && typeof issue.cost.pnlBreaking === 'number' && !isNaN(issue.cost.pnlBreaking)) ? `
                    <div class="cost-comparison">
                        <span class="cost-following inter-text">Following: $${issue.cost.pnlFollowing.toFixed(2)}</span>
                        <span class="cost-breaking inter-text">Breaking: $${issue.cost.pnlBreaking.toFixed(2)}</span>
                        ${(issue.cost.delta !== null && issue.cost.delta !== undefined && typeof issue.cost.delta === 'number' && !isNaN(issue.cost.delta)) ? `<span class="cost-delta inter-text">Delta: $${issue.cost.delta.toFixed(2)}</span>` : ''}
                    </div>
                ` : ''}
                ${issue.cost.estimateNote ? `<div class="cost-note inter-text">${issue.cost.estimateNote}</div>` : ''}
            </div>
        ` : '';

        const whenHtml = issue.whenItHappens ? `
            <div class="issue-when">
                <div class="when-label inter-text">When it happens:</div>
                ${issue.whenItHappens.timeOfDay && issue.whenItHappens.timeOfDay.length > 0 ? `
                    <div class="when-item inter-text">
                        <strong>Time:</strong> ${issue.whenItHappens.timeOfDay.map(t => `${t.bucket} (${t.count})`).join(', ')}
                    </div>
                ` : ''}
                ${issue.whenItHappens.dayOfWeek && issue.whenItHappens.dayOfWeek.length > 0 ? `
                    <div class="when-item inter-text">
                        <strong>Day:</strong> ${issue.whenItHappens.dayOfWeek.map(d => `${d.day} (${d.count})`).join(', ')}
                    </div>
                ` : ''}
                ${issue.whenItHappens.afterWinLoss ? `
                    <div class="when-item inter-text">
                        <strong>Pattern:</strong> ${issue.whenItHappens.afterWinLoss}
                    </div>
                ` : ''}
            </div>
        ` : '';

        return `
            <div class="issue-card">
                <div class="issue-header">
                    <span class="issue-number inter-text">#${index + 1}</span>
                    <h4 class="issue-title inter-text">${issue.title}</h4>
                </div>
                <div class="issue-evidence">
                    <div class="evidence-label inter-text">Evidence:</div>
                    <ul class="evidence-list">
                        ${issue.evidence.map(e => `<li class="inter-text">${e}</li>`).join('')}
                    </ul>
                </div>
                ${costHtml}
                ${whenHtml}
                <div class="issue-fix">
                    <div class="fix-label inter-text">Fix Next:</div>
                    <div class="fix-instruction inter-text">${issue.fixNext.instruction}</div>
                    ${issue.fixNext.checklistChange ? `<div class="fix-checklist inter-text">Checklist: ${issue.fixNext.checklistChange}</div>` : ''}
                    ${issue.fixNext.ruleToFocus ? `<div class="fix-rule inter-text">Focus Rule: ${issue.fixNext.ruleToFocus}</div>` : ''}
                    <div class="fix-goal inter-text">
                        <strong>7-Day Goal:</strong> ${issue.fixNext.next7DaysGoal}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Render Rule-Breaking Patterns
function renderRuleBreaking(ruleBreaking) {
    const container = document.getElementById('rule-breaking-content');
    if (!ruleBreaking) {
        container.innerHTML = '<p class="no-data-text inter-text">No rule-breaking data available.</p>';
        return;
    }

    const topRulesHtml = ruleBreaking.topBrokenRules && ruleBreaking.topBrokenRules.length > 0 ? `
        <div class="rule-breaking-section">
            <h4 class="subsection-title inter-text">Top Broken Rules</h4>
            <ul class="broken-rules-list">
                ${ruleBreaking.topBrokenRules.slice(0, 5).map(rule => `
                    <li class="broken-rule-item">
                        <span class="rule-label inter-text">${rule.label}</span>
                        <span class="rule-count inter-text">${rule.count} times ${(rule.percentOfBreakingTrades !== null && rule.percentOfBreakingTrades !== undefined && typeof rule.percentOfBreakingTrades === 'number' && !isNaN(rule.percentOfBreakingTrades)) ? `(${rule.percentOfBreakingTrades.toFixed(1)}%)` : ''}</span>
                    </li>
                `).join('')}
            </ul>
        </div>
    ` : '';

    const pnlHtml = ruleBreaking.pnlComparison ? `
        <div class="rule-breaking-section">
            <h4 class="subsection-title inter-text">P/L Comparison</h4>
            <div class="pnl-comparison-grid">
                <div class="pnl-stat">
                    <div class="pnl-label inter-text">Rule-Following Trades</div>
                    <div class="pnl-value inter-text">${ruleBreaking.pnlComparison.followingTrades}</div>
                    ${(ruleBreaking.pnlComparison.avgPnlFollowing !== null && ruleBreaking.pnlComparison.avgPnlFollowing !== undefined && typeof ruleBreaking.pnlComparison.avgPnlFollowing === 'number' && !isNaN(ruleBreaking.pnlComparison.avgPnlFollowing)) ? `
                        <div class="pnl-avg inter-text">Avg: $${ruleBreaking.pnlComparison.avgPnlFollowing.toFixed(2)}</div>
                    ` : ''}
                </div>
                <div class="pnl-stat">
                    <div class="pnl-label inter-text">Rule-Breaking Trades</div>
                    <div class="pnl-value inter-text">${ruleBreaking.pnlComparison.breakingTrades}</div>
                    ${(ruleBreaking.pnlComparison.avgPnlBreaking !== null && ruleBreaking.pnlComparison.avgPnlBreaking !== undefined && typeof ruleBreaking.pnlComparison.avgPnlBreaking === 'number' && !isNaN(ruleBreaking.pnlComparison.avgPnlBreaking)) ? `
                        <div class="pnl-avg inter-text">Avg: $${ruleBreaking.pnlComparison.avgPnlBreaking.toFixed(2)}</div>
                    ` : ''}
                </div>
                ${(ruleBreaking.pnlComparison.delta !== null && ruleBreaking.pnlComparison.delta !== undefined && typeof ruleBreaking.pnlComparison.delta === 'number' && !isNaN(ruleBreaking.pnlComparison.delta)) ? `
                    <div class="pnl-stat">
                        <div class="pnl-label inter-text">Difference</div>
                        <div class="pnl-value inter-text ${ruleBreaking.pnlComparison.delta >= 0 ? 'positive' : 'negative'}">
                            ${ruleBreaking.pnlComparison.delta >= 0 ? '+' : ''}$${ruleBreaking.pnlComparison.delta.toFixed(2)}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    ` : '';

    container.innerHTML = topRulesHtml + pnlHtml;
}

// Render Emotions
function renderEmotions(emotions) {
    const container = document.getElementById('emotions-content');
    if (!emotions) {
        container.innerHTML = '<p class="no-data-text inter-text">No emotion data available.</p>';
        return;
    }

    const breakdownHtml = emotions.breakdown && emotions.breakdown.length > 0 ? `
        <div class="emotions-section">
            <h4 class="subsection-title inter-text">Emotion Breakdown</h4>
            <div class="emotions-table">
                <div class="emotions-header">
                    <div class="inter-text">Emotion</div>
                    <div class="inter-text">Trades</div>
                    <div class="inter-text">Breaking Rate</div>
                    <div class="inter-text">Avg P/L</div>
                </div>
                ${emotions.breakdown.map(em => `
                    <div class="emotions-row">
                        <div class="emotion-name inter-text">${em.emotion}</div>
                        <div class="inter-text">${em.trades}</div>
                        <div class="inter-text">${(em.breakingRate !== null && em.breakingRate !== undefined && typeof em.breakingRate === 'number' && !isNaN(em.breakingRate)) ? (em.breakingRate * 100).toFixed(1) + '%' : 'N/A'}</div>
                        <div class="inter-text ${(em.avgPnl !== null && em.avgPnl !== undefined && typeof em.avgPnl === 'number' && !isNaN(em.avgPnl)) ? (em.avgPnl >= 0 ? 'positive' : 'negative') : ''}">
                            ${(em.avgPnl !== null && em.avgPnl !== undefined && typeof em.avgPnl === 'number' && !isNaN(em.avgPnl)) ? `$${em.avgPnl.toFixed(2)}` : 'N/A'}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : '';

    const worstHtml = emotions.worstEmotion ? `
        <div class="emotion-highlight worst">
            <i data-lucide="alert-circle"></i>
            <div class="inter-text">
                <strong>Worst Emotion:</strong> ${emotions.worstEmotion.emotion}
                <div class="highlight-reason">${emotions.worstEmotion.reason}</div>
            </div>
        </div>
    ` : '';

    const bestHtml = emotions.bestEmotion ? `
        <div class="emotion-highlight best">
            <i data-lucide="check-circle"></i>
            <div class="inter-text">
                <strong>Best Emotion:</strong> ${emotions.bestEmotion.emotion}
                <div class="highlight-reason">${emotions.bestEmotion.reason}</div>
            </div>
        </div>
    ` : '';

    container.innerHTML = breakdownHtml + worstHtml + bestHtml;
}

// Render Setup Execution
function renderSetupExecution(setupExecution) {
    const container = document.getElementById('setup-execution-content');
    if (!setupExecution) {
        container.innerHTML = '<p class="no-data-text inter-text">No setup execution data available.</p>';
        return;
    }

    const linkageHtml = `
        <div class="setup-section">
            <div class="setup-stat">
                <span class="stat-label inter-text">Trades Linked to Strategy:</span>
                <span class="stat-value inter-text">${(setupExecution.percentTradesLinkedToStrategy !== null && setupExecution.percentTradesLinkedToStrategy !== undefined && typeof setupExecution.percentTradesLinkedToStrategy === 'number' && !isNaN(setupExecution.percentTradesLinkedToStrategy)) ? setupExecution.percentTradesLinkedToStrategy.toFixed(1) + '%' : 'N/A'}</span>
            </div>
        </div>
    `;

    const randomSignalsHtml = setupExecution.randomTradeSignals && setupExecution.randomTradeSignals.length > 0 ? `
        <div class="setup-section random-signals-section">
            <h4 class="subsection-title inter-text">Random Trade Signals</h4>
            <ul class="signals-list">
                ${setupExecution.randomTradeSignals.map(signal => `<li class="inter-text">${signal}</li>`).join('')}
            </ul>
        </div>
    ` : '';

    const strategyTableHtml = setupExecution.byStrategy && setupExecution.byStrategy.length > 0 ? `
        <div class="setup-section">
            <h4 class="subsection-title inter-text">Strategy Performance</h4>
            <div class="strategy-table">
                <div class="strategy-header">
                    <div class="inter-text">Strategy</div>
                    <div class="inter-text">Trades</div>
                    <div class="inter-text">Rule-Following Rate</div>
                    <div class="inter-text">Win Rate</div>
                    <div class="inter-text">Expectancy</div>
                </div>
                ${setupExecution.byStrategy.map(strat => `
                    <div class="strategy-row">
                        <div class="strategy-name inter-text">${strat.strategyName}</div>
                        <div class="inter-text">${strat.trades}</div>
                        <div class="inter-text">${(strat.ruleFollowingRate !== null && strat.ruleFollowingRate !== undefined && typeof strat.ruleFollowingRate === 'number' && !isNaN(strat.ruleFollowingRate)) ? (strat.ruleFollowingRate * 100).toFixed(1) + '%' : 'N/A'}</div>
                        <div class="inter-text">${(strat.winRate !== null && strat.winRate !== undefined && typeof strat.winRate === 'number' && !isNaN(strat.winRate)) ? (strat.winRate * 100).toFixed(1) + '%' : 'N/A'}</div>
                        <div class="inter-text ${(strat.expectancy !== null && strat.expectancy !== undefined && typeof strat.expectancy === 'number' && !isNaN(strat.expectancy)) ? (strat.expectancy >= 0 ? 'positive' : 'negative') : ''}">
                            ${(strat.expectancy !== null && strat.expectancy !== undefined && typeof strat.expectancy === 'number' && !isNaN(strat.expectancy)) ? `$${strat.expectancy.toFixed(2)}` : 'N/A'}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : '';

    const bestWorstHtml = `
        ${setupExecution.bestSetup ? `
            <div class="setup-highlight best">
                <i data-lucide="star"></i>
                <div class="inter-text">
                    <strong>Best Setup:</strong> ${setupExecution.bestSetup.strategyName}
                    <div class="highlight-reason">${setupExecution.bestSetup.why}</div>
                </div>
            </div>
        ` : ''}
        ${setupExecution.worstSetup ? `
            <div class="setup-highlight worst">
                <i data-lucide="alert-triangle"></i>
                <div class="inter-text">
                    <strong>Worst Setup:</strong> ${setupExecution.worstSetup.strategyName}
                    <div class="highlight-reason">${setupExecution.worstSetup.why}</div>
                </div>
            </div>
        ` : ''}
    `;

    container.innerHTML = linkageHtml + randomSignalsHtml + strategyTableHtml + bestWorstHtml;
}

// Render Trends
function renderTrends(trends) {
    const container = document.getElementById('trends-content');
    if (!trends) {
        container.innerHTML = '<p class="no-data-text inter-text">No trend data available.</p>';
        return;
    }

    const ruleFollowingHtml = trends.ruleFollowingRateTrend && trends.ruleFollowingRateTrend.length > 0 ? `
        <div class="trends-section rule-following-trend">
            <h4 class="subsection-title inter-text">Rule-Following Rate Trend</h4>
            <div class="trend-list">
                ${trends.ruleFollowingRateTrend.map(t => `
                    <div class="trend-item">
                        <span class="trend-period inter-text">${t.periodLabel}</span>
                        <span class="trend-value inter-text">${(t.rate !== null && t.rate !== undefined && typeof t.rate === 'number' && !isNaN(t.rate)) ? (t.rate * 100).toFixed(1) + '%' : 'N/A'}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : '';

    const overtradingHtml = trends.overtradingTrend && trends.overtradingTrend.length > 0 ? `
        <div class="trends-section overtrading-trend">
            <h4 class="subsection-title inter-text">Overtrading Trend</h4>
            <div class="trend-list">
                ${trends.overtradingTrend.map(t => `
                    <div class="trend-item">
                        <span class="trend-period inter-text">${t.periodLabel}</span>
                        <span class="trend-value inter-text">${t.trades} trades</span>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : '';

    const notesHtml = trends.notes && trends.notes.length > 0 ? `
        <div class="trends-section trend-notes">
            <h4 class="subsection-title inter-text">Trend Notes</h4>
            <ul class="trends-notes-list">
                ${trends.notes.map(note => `<li class="inter-text">${note}</li>`).join('')}
            </ul>
        </div>
    ` : '';

    container.innerHTML = ruleFollowingHtml + overtradingHtml + notesHtml;
}

// Render Action Plan
function renderActionPlan(actionPlan) {
    const container = document.getElementById('action-plan-content');
    if (!actionPlan) {
        container.innerHTML = '<p class="no-data-text inter-text">No action plan available.</p>';
        return;
    }

    const focusOrderHtml = actionPlan.focusOrder && actionPlan.focusOrder.length > 0 ? `
        <div class="action-section focus-order-section">
            <h4 class="subsection-title inter-text">Focus Order</h4>
            <ol class="focus-order-list">
                ${actionPlan.focusOrder.map((item, idx) => `<li class="inter-text">${item}</li>`).join('')}
            </ol>
        </div>
    ` : '';

    const checklistHtml = actionPlan.nextSessionChecklist && actionPlan.nextSessionChecklist.length > 0 ? `
        <div class="action-section checklist-section">
            <h4 class="subsection-title inter-text">Next Session Checklist</h4>
            <ul class="checklist-list">
                ${actionPlan.nextSessionChecklist.map(item => `<li class="inter-text">${item}</li>`).join('')}
            </ul>
        </div>
    ` : '';

    const challengeHtml = actionPlan.weeklyChallenge ? `
        <div class="action-section weekly-challenge-section">
            <h4 class="subsection-title inter-text">Weekly Challenge</h4>
            <div class="weekly-challenge inter-text">
                ${actionPlan.weeklyChallenge}
            </div>
        </div>
    ` : '';

    container.innerHTML = focusOrderHtml + checklistHtml + challengeHtml;
}

// Render Disclaimers
function renderDisclaimers(disclaimers) {
    if (!disclaimers || disclaimers.length === 0) {
        document.getElementById('disclaimers-section').style.display = 'none';
        return;
    }

    const container = document.getElementById('disclaimers-list');
    container.innerHTML = disclaimers.map(d => `<div class="disclaimer-item inter-text">${d}</div>`).join('');
    document.getElementById('disclaimers-section').style.display = 'block';
    lucide.createIcons();
}

// Initialize
async function init() {
    await updateClientData();
    await getClientData();
    await sleep(100);

    // Setup generate button
    document.getElementById('generate-button').addEventListener('click', async () => {
        if (generating) return;
        
        generating = true;
        const generateText = document.getElementById('generate-text');
        const generateButton = document.getElementById('generate-button');
        generateText.textContent = 'Generating...';
        generateButton.disabled = true;
        
        try {
            await fetchAnalysis();
        } finally {
            generating = false;
            generateText.textContent = 'Generate Plan';
            generateButton.disabled = false;
        }
    });

    // Setup sidebar toggle
    document.querySelector("#bar-icon")?.addEventListener("click", () => {
        document.querySelector("#sidebar").style.display = "block";
    });

    // Don't auto-fetch - wait for button click
    showEmptyState();
}

init();
