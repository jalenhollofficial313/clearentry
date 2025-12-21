// Replay Engine for Backtesting
// Type definitions (conceptual - JavaScript doesn't have types but following the spec)

/**
 * @typedef {Object} Candle
 * @property {number} t - unix timestamp in milliseconds
 * @property {number} o - open price
 * @property {number} h - high price
 * @property {number} l - low price
 * @property {number} c - close price
 * @property {number} v - volume
 */

/**
 * @typedef {Object} ReplayState
 * @property {Candle[]} baseCandles1m - raw 1-minute candles
 * @property {string} timeframe - '1m'|'5m'|'15m'|'1h'|'1D'
 * @property {number} currentIndex - current position in baseCandles1m
 * @property {boolean} isPlaying - playback state
 * @property {number} speed - steps per second
 * @property {Candle[]} derivedCandles - aggregated candles for current timeframe
 * @property {Candle|null} currentAggCandle - current aggregating candle
 */

// Global replay state
let replayState = {
    baseCandles1m: [],
    timeframe: '1m',
    currentIndex: 0,
    isPlaying: false,
    speed: 1,
    derivedCandles: [],
    currentAggCandle: null
};

let playbackTimer = null;
let chart = null;
let candlestickSeries = null;
let volumeSeries = null;

let client_server_debounce = false;

// Timeframe multipliers (in milliseconds)
const TIMEFRAME_MS = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '1D': 24 * 60 * 60 * 1000
};

/**
 * Get the bucket start timestamp for a given timestamp and timeframe
 * @param {number} timestamp - unix timestamp in milliseconds
 * @param {string} timeframe - timeframe string
 * @returns {number} bucket start timestamp
 */
function getBucketStart(timestamp, timeframe) {
    const ms = TIMEFRAME_MS[timeframe];
    
    if (timeframe === '1D') {
        // For daily, use UTC day boundary
        const date = new Date(timestamp);
        date.setUTCHours(0, 0, 0, 0);
        return date.getTime();
    }
    
    // For intraday timeframes, floor to the nearest bucket
    return Math.floor(timestamp / ms) * ms;
}

/**
 * Update aggregate candle with next 1-minute candle
 * @param {Candle|null} currentAgg - current aggregating candle or null
 * @param {Candle} next1m - next 1-minute candle to aggregate
 * @param {string} timeframe - target timeframe
 * @returns {{currentAgg: Candle, didClosePrev: boolean, closedCandle?: Candle}}
 */
function updateAggregate(currentAgg, next1m, timeframe) {
    const bucketStart = getBucketStart(next1m.t, timeframe);
    
    if (!currentAgg) {
        // Start new aggregate candle
        return {
            currentAgg: {
                t: bucketStart,
                o: next1m.o,
                h: next1m.h,
                l: next1m.l,
                c: next1m.c,
                v: next1m.v
            },
            didClosePrev: false
        };
    }
    
    const currentBucketStart = getBucketStart(currentAgg.t, timeframe);
    
    if (bucketStart === currentBucketStart) {
        // Same bucket - update current aggregate
        return {
            currentAgg: {
                t: currentAgg.t,
                o: currentAgg.o, // open stays the same (first candle's open)
                h: Math.max(currentAgg.h, next1m.h),
                l: Math.min(currentAgg.l, next1m.l),
                c: next1m.c, // close is last candle's close
                v: currentAgg.v + next1m.v
            },
            didClosePrev: false
        };
    } else {
        // New bucket - close previous and start new
        const closedCandle = { ...currentAgg };
        return {
            currentAgg: {
                t: bucketStart,
                o: next1m.o,
                h: next1m.h,
                l: next1m.l,
                c: next1m.c,
                v: next1m.v
            },
            didClosePrev: true,
            closedCandle: closedCandle
        };
    }
}

/**
 * Reset replay state
 */
function resetReplay() {
    replayState.currentIndex = 0;
    replayState.derivedCandles = [];
    replayState.currentAggCandle = null;
    replayState.isPlaying = false;
    
    if (playbackTimer) {
        clearInterval(playbackTimer);
        playbackTimer = null;
    }
    
    updateChart();
    updateUI();
}

/**
 * Step forward one 1-minute candle
 */
function stepForward() {
    if (replayState.currentIndex >= replayState.baseCandles1m.length) {
        pauseReplay();
        return;
    }
    
    const next1m = replayState.baseCandles1m[replayState.currentIndex];
    
    // Update aggregation
    const result = updateAggregate(replayState.currentAggCandle, next1m, replayState.timeframe);
    
    if (result.didClosePrev && result.closedCandle) {
        // Add completed candle to derived series
        replayState.derivedCandles.push(result.closedCandle);
    }
    
    replayState.currentAggCandle = result.currentAgg;
    replayState.currentIndex++;
    
    // Always include current aggregate in chart (even if incomplete)
    updateChart();
    updateUI();
}

/**
 * Step backward one 1-minute candle
 */
function stepBackward() {
    if (replayState.currentIndex <= 0) {
        return;
    }
    
    // Reset and rebuild up to previous position
    replayState.currentIndex--;
    rebuildDerivedCandles();
    updateChart();
    updateUI();
}

/**
 * Rebuild derived candles from base candles up to current index
 */
function rebuildDerivedCandles() {
    replayState.derivedCandles = [];
    replayState.currentAggCandle = null;
    
    for (let i = 0; i < replayState.currentIndex; i++) {
        const next1m = replayState.baseCandles1m[i];
        const result = updateAggregate(replayState.currentAggCandle, next1m, replayState.timeframe);
        
        if (result.didClosePrev && result.closedCandle) {
            replayState.derivedCandles.push(result.closedCandle);
        }
        
        replayState.currentAggCandle = result.currentAgg;
    }
}

/**
 * Start replay playback
 */
function startReplay() {
    if (replayState.isPlaying) {
        return;
    }
    
    replayState.isPlaying = true;
    
    // Calculate interval based on speed (1 candle per interval)
    const intervalMs = 1000 / replayState.speed;
    
    playbackTimer = setInterval(() => {
        stepForward();
        
        // Check if we've reached the end
        if (replayState.currentIndex >= replayState.baseCandles1m.length) {
            pauseReplay();
        }
    }, intervalMs);
    
    updateUI();
}

/**
 * Pause replay playback
 */
function pauseReplay() {
    replayState.isPlaying = false;
    
    if (playbackTimer) {
        clearInterval(playbackTimer);
        playbackTimer = null;
    }
    
    updateUI();
}

/**
 * Resume replay playback
 */
function resumeReplay() {
    if (!replayState.isPlaying && replayState.currentIndex < replayState.baseCandles1m.length) {
        startReplay();
    }
}

/**
 * Process all candles for a given timeframe
 */
function processCandlesForTimeframe(candles1m, timeframe) {
    if (timeframe === '1m') {
        // No aggregation needed
        return candles1m;
    }
    
    const aggregated = [];
    let currentAgg = null;
    
    for (const candle of candles1m) {
        const result = updateAggregate(currentAgg, candle, timeframe);
        
        if (result.didClosePrev && result.closedCandle) {
            aggregated.push(result.closedCandle);
        }
        
        currentAgg = result.currentAgg;
    }
    
    // Add the last incomplete candle if it exists
    if (currentAgg) {
        aggregated.push(currentAgg);
    }
    
    return aggregated;
}

/**
 * Update chart with processed candle data
 */
function updateChartWithData(candles) {
    if (!chart || !candlestickSeries) {
        return;
    }
    
    // Convert to TradingView format (time in seconds, not milliseconds)
    const chartData = candles
        .filter(candle => {
            // Validate candle data
            return candle && 
                   typeof candle.t === 'number' && 
                   typeof candle.o === 'number' && 
                   typeof candle.h === 'number' && 
                   typeof candle.l === 'number' && 
                   typeof candle.c === 'number' &&
                   !isNaN(candle.t) && 
                   !isNaN(candle.o) && 
                   !isNaN(candle.h) && 
                   !isNaN(candle.l) && 
                   !isNaN(candle.c) &&
                   candle.h >= candle.l &&
                   candle.h >= candle.o &&
                   candle.h >= candle.c &&
                   candle.l <= candle.o &&
                   candle.l <= candle.c;
        })
        .map(candle => {
            const time = Math.floor(candle.t / 1000); // Convert ms to seconds
            return {
                time: time,
                open: Number(candle.o),
                high: Number(candle.h),
                low: Number(candle.l),
                close: Number(candle.c)
            };
        })
        .sort((a, b) => a.time - b.time);
    
    // Update chart with all data
    if (chartData.length > 0) {
        try {
            candlestickSeries.setData(chartData);
            // Fit content to show all data
            chart.timeScale().fitContent();
        } catch (error) {
            console.error('Error setting candlestick data:', error);
        }
    }
}

/**
 * Update chart with current derived candles - rebuilds entire dataset each time
 */
function updateChart() {
    if (!chart || !candlestickSeries) {
        return;
    }
    
    // Don't return early if no base candles - we might have derived candles to show
    if (!replayState.baseCandles1m.length && !replayState.derivedCandles.length) {
        return;
    }
    
    // Rebuild derived candles up to current index (in case we're stepping)
    rebuildDerivedCandles();
    
    // Prepare data for TradingView - include all derived candles plus current aggregate
    const series = replayState.derivedCandles.slice(); // Copy array
    
    // Include current aggregate if it exists (incomplete candle)
    if (replayState.currentAggCandle) {
        series.push(replayState.currentAggCandle);
    }
    
    // Get current candle for indicators (most recent complete candle, or current aggregate)
    const currentCandle = replayState.currentAggCandle || 
                          (replayState.derivedCandles.length > 0 ? 
                           replayState.derivedCandles[replayState.derivedCandles.length - 1] : null);
    
    // Update price indicators
    updatePriceIndicators(currentCandle);
    
    // Convert to TradingView format (time in seconds, not milliseconds)
    // Validate and filter out invalid candles
    const chartData = series
        .filter(candle => {
            // Validate candle data
            return candle && 
                   typeof candle.t === 'number' && 
                   typeof candle.o === 'number' && 
                   typeof candle.h === 'number' && 
                   typeof candle.l === 'number' && 
                   typeof candle.c === 'number' &&
                   !isNaN(candle.t) && 
                   !isNaN(candle.o) && 
                   !isNaN(candle.h) && 
                   !isNaN(candle.l) && 
                   !isNaN(candle.c) &&
                   candle.h >= candle.l && // High must be >= Low
                   candle.h >= candle.o && // High must be >= Open
                   candle.h >= candle.c && // High must be >= Close
                   candle.l <= candle.o && // Low must be <= Open
                   candle.l <= candle.c;  // Low must be <= Close
        })
        .map(candle => {
            const time = Math.floor(candle.t / 1000); // Convert ms to seconds
            return {
                time: time,
                open: Number(candle.o),
                high: Number(candle.h),
                low: Number(candle.l),
                close: Number(candle.c)
            };
        })
        .sort((a, b) => a.time - b.time); // Ensure data is sorted by time
    
    // Update entire chart with new dataset (replace all data, don't append)
    if (chartData.length > 0) {
        try {
            candlestickSeries.setData(chartData);
            // Fit content to show all data
            chart.timeScale().fitContent();
        } catch (error) {
            console.error('Error setting candlestick data:', error);
            console.log('Sample data:', chartData.slice(0, 3));
        }
    } else {
        // If no data, set empty array
        try {
            candlestickSeries.setData([]);
        } catch (error) {
            console.error('Error clearing chart data:', error);
        }
    }
    
    // Update volume series if we have volume data
    if (volumeSeries && series.length > 0 && series[0].v !== undefined) {
        const volumeData = series
            .filter(candle => candle && typeof candle.v === 'number' && !isNaN(candle.v))
            .map(candle => ({
                time: Math.floor(candle.t / 1000),
                value: Number(candle.v) || 0,
                color: candle.c >= candle.o ? 'rgba(0, 255, 153, 0.3)' : 'rgba(255, 71, 71, 0.3)'
            }))
            .sort((a, b) => a.time - b.time);
        
        if (volumeData.length > 0) {
            try {
                volumeSeries.setData(volumeData);
            } catch (error) {
                console.error('Error setting volume data:', error);
            }
        }
    }
}

/**
 * Initialize chart using TradingView lightweight-charts
 */
async function initChart() {
    const chartContainer = document.querySelector("#replay-chart");
    if (!chartContainer) {
        console.error("Chart container not found");
        return;
    }
    
    // Get the library reference (standalone build uses lowercase)
    const lwc = window.lightweightCharts || window.LightweightCharts;
    
    if (!lwc) {
        console.error('TradingView LightweightCharts library not loaded');
        return;
    }
    
    // Get the CandlestickSeries constant from the library
    const CandlestickSeries = lwc.CandlestickSeries;
    
    // Create TradingView chart with simplified options to avoid assertion errors
    const chartOptions = {
        layout: {
            background: { color: 'transparent' },
            textColor: '#86909a',
            fontFamily: 'Inter, sans-serif'
        },
        grid: {
            vertLines: { color: 'rgba(128, 128, 128, 0.1)' },
            horzLines: { color: 'rgba(128, 128, 128, 0.1)' }
        },
        width: (() => {
            // Get actual available width (accounting for padding)
            const computedStyle = window.getComputedStyle(chartContainer);
            const paddingLeft = parseInt(computedStyle.paddingLeft) || 0;
            const paddingRight = parseInt(computedStyle.paddingRight) || 0;
            return chartContainer.clientWidth - paddingLeft - paddingRight;
        })(),
        height: 730 // Fixed height across all platforms
    };
    
    // Add optional options only if they exist in the library
    if (lwc.CrosshairMode) {
        chartOptions.crosshair = {
            mode: lwc.CrosshairMode.Normal
        };
    }
    
    if (lwc.LineStyle) {
        if (!chartOptions.crosshair) chartOptions.crosshair = {};
        chartOptions.crosshair.vertLine = {
            color: '#86909a',
            width: 1,
            style: lwc.LineStyle.Dashed
        };
        chartOptions.crosshair.horzLine = {
            color: '#86909a',
            width: 1,
            style: lwc.LineStyle.Dashed
        };
    }
    
    chartOptions.rightPriceScale = {
        borderColor: 'rgba(128, 128, 128, 0.2)'
    };
    
    chartOptions.timeScale = {
        borderColor: 'rgba(128, 128, 128, 0.2)',
        timeVisible: true
    };
    
    try {
        chart = lwc.createChart(chartContainer, chartOptions);
    } catch (error) {
        console.error('Error creating chart:', error);
        // Try with minimal options
        chart = lwc.createChart(chartContainer, {
            width: chartContainer.clientWidth || 1200,
            height: 600
        });
    }
    
    // Check if CandlestickSeries is available (already declared above)
    if (!CandlestickSeries) {
        console.error('CandlestickSeries not found in library');
        throw new Error('CandlestickSeries not available');
    }
    
    // Create candlestick series using the correct API: chart.addSeries(CandlestickSeries, options)
    candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#00ff99',
        downColor: '#ff4747',
        borderVisible: false,
        wickUpColor: '#00ff99',
        wickDownColor: '#ff4747'
    });
    
    // Create volume series (optional, can be added later) - skip for now to avoid errors
    // We can add this later once candlestick is working
    /*
    try {
        if (typeof chart.addHistogramSeries === 'function') {
            volumeSeries = chart.addHistogramSeries({
                color: '#26a69a',
                priceScaleId: '',
                scaleMargins: {
                    top: 0.8,
                    bottom: 0,
                },
            });
        } else if (typeof chart.addSeries === 'function') {
            volumeSeries = chart.addSeries('Histogram', {
                color: '#26a69a',
                priceScaleId: '',
                scaleMargins: {
                    top: 0.8,
                    bottom: 0,
                },
            });
        }
    } catch (error) {
        console.warn('Could not create volume series:', error);
        // Volume series is optional, so we continue
    }
    */
    
    // Custom tooltip
    chart.subscribeCrosshairMove(param => {
        if (param.point === undefined || !param.time || param.point.x < 0 || param.point.x > chartContainer.clientWidth || param.point.y < 0 || param.point.y > 600) {
            // Hide tooltip if outside chart area
            const tooltip = document.getElementById('chart-tooltip');
            if (tooltip) {
                tooltip.style.display = 'none';
            }
            return;
        }
        
        const data = param.seriesData.get(candlestickSeries);
        if (!data) {
            return;
        }
        
        const candle = data;
        const date = new Date(param.time * 1000); // Convert seconds to milliseconds
        const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        
        // Create or update tooltip
        let tooltip = document.getElementById('chart-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'chart-tooltip';
            tooltip.style.cssText = 'position: absolute; background-color: #191d23e7; backdrop-filter: blur(10px); border: 1px solid rgba(128, 128, 128, 0.123); box-shadow: 0px 3px 15px 1px rgba(0, 0, 0, 0.432); border-radius: 12px; padding: 15px; font-family: Inter, sans-serif; pointer-events: none; z-index: 1000;';
            document.body.appendChild(tooltip);
        }
        
        tooltip.innerHTML = 
            '<div style="font-size: 13px; font-weight: 600; color: white; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid rgba(128, 128, 128, 0.123);">' + dateStr + '</div>' +
            '<div style="font-size: 12px; color: #86909a; margin-top: 6px; display: flex; justify-content: space-between; align-items: center;"><span>Open:</span> <span style="color: white; font-weight: 600;">$' + candle.open.toFixed(2) + '</span></div>' +
            '<div style="font-size: 12px; color: #86909a; margin-top: 6px; display: flex; justify-content: space-between; align-items: center;"><span>High:</span> <span style="color: #00ff99; font-weight: 600;">$' + candle.high.toFixed(2) + '</span></div>' +
            '<div style="font-size: 12px; color: #86909a; margin-top: 6px; display: flex; justify-content: space-between; align-items: center;"><span>Low:</span> <span style="color: #ff4747; font-weight: 600;">$' + candle.low.toFixed(2) + '</span></div>' +
            '<div style="font-size: 12px; color: #86909a; margin-top: 6px; display: flex; justify-content: space-between; align-items: center;"><span>Close:</span> <span style="color: white; font-weight: 600;">$' + candle.close.toFixed(2) + '</span></div>';
        
        tooltip.style.display = 'block';
        tooltip.style.left = (param.point.x + 20) + 'px';
        tooltip.style.top = (param.point.y + 20) + 'px';
    });
    
    // Handle window resize and orientation changes
    const updateChartSize = () => {
        const newWidth = chartContainer.clientWidth;
        const newHeight = 730; // Fixed height across all platforms
        chart.applyOptions({ 
            width: newWidth,
            height: newHeight
        });
    };
    
    const resizeObserver = new ResizeObserver(entries => {
        updateChartSize();
    });
    resizeObserver.observe(chartContainer);
    
    // Also handle window resize for orientation changes
    window.addEventListener('resize', () => {
        updateChartSize();
    });
}

/**
 * Update price indicators display
 */
function updatePriceIndicators(candle) {
    if (!candle) {
        document.getElementById('current-price').textContent = '--';
        document.getElementById('current-open').textContent = '--';
        document.getElementById('current-high').textContent = '--';
        document.getElementById('current-low').textContent = '--';
        document.getElementById('current-volume').textContent = '--';
        return;
    }
    
    // Format price values
    const formatPrice = (price) => {
        if (price === null || price === undefined) return '--';
        return '$' + price.toFixed(2);
    };
    
    const formatVolume = (volume) => {
        if (volume === null || volume === undefined) return '--';
        if (volume >= 1000000) {
            return (volume / 1000000).toFixed(2) + 'M';
        } else if (volume >= 1000) {
            return (volume / 1000).toFixed(2) + 'K';
        }
        return volume.toLocaleString();
    };
    
    document.getElementById('current-price').textContent = formatPrice(candle.c);
    document.getElementById('current-open').textContent = formatPrice(candle.o);
    document.getElementById('current-high').textContent = formatPrice(candle.h);
    document.getElementById('current-low').textContent = formatPrice(candle.l);
    document.getElementById('current-volume').textContent = formatVolume(candle.v);
}

/**
 * Update UI elements
 */
function updateUI() {
    // Update play/pause button
    const playPauseBtn = document.getElementById('play-pause-button');
    const playPauseIcon = playPauseBtn.querySelector('i');
    
    if (replayState.isPlaying) {
        playPauseBtn.innerHTML = '<i data-lucide="pause"></i> Pause';
        lucide.createIcons();
    } else {
        playPauseBtn.innerHTML = '<i data-lucide="play"></i> Play';
        lucide.createIcons();
    }
    
    // Update button states
    const hasData = replayState.baseCandles1m.length > 0;
    const canStepBack = replayState.currentIndex > 0;
    const canStepForward = replayState.currentIndex < replayState.baseCandles1m.length;
    const isAtEnd = replayState.currentIndex >= replayState.baseCandles1m.length;
    
    document.getElementById('reset-button').disabled = !hasData || replayState.currentIndex === 0;
    document.getElementById('step-back-button').disabled = !canStepBack || replayState.isPlaying;
    document.getElementById('step-forward-button').disabled = !canStepForward || replayState.isPlaying;
    document.getElementById('play-pause-button').disabled = !hasData || isAtEnd;
    document.getElementById('speed-slider').disabled = !hasData;
    
    // Update displays
    const currentCandle = replayState.currentIndex > 0 ? replayState.baseCandles1m[replayState.currentIndex - 1] : null;
    const firstCandle = replayState.baseCandles1m[0];
    const lastCandle = replayState.baseCandles1m[replayState.baseCandles1m.length - 1];
    
    if (currentCandle && firstCandle && lastCandle) {
        const currentTime = new Date(currentCandle.t).toLocaleString();
        const totalTime = new Date(lastCandle.t).toLocaleString();
        document.getElementById('current-time-display').textContent = currentTime;
        document.getElementById('total-time-display').textContent = totalTime;
    } else {
        document.getElementById('current-time-display').textContent = '--';
        document.getElementById('total-time-display').textContent = '--';
    }
    
    document.getElementById('current-index-display').textContent = replayState.currentIndex;
    document.getElementById('total-index-display').textContent = replayState.baseCandles1m.length;
}

/**
 * Helper sleep function
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Loading frame function (matches pattern from other pages)
 */
async function loadingFrame(ms, text1, text2) {
    const loadingFrame = document.querySelector(".mainframe-loading");
    const loadingDiv = document.querySelector("#load-frame");
    const loadedFrame = document.querySelector("#loaded-frame");

    loadedFrame.style.display = "none";
    loadingDiv.style.display = "flex";
    if (loadingDiv.querySelector("p")) {
        loadingDiv.querySelector("p").innerHTML = text1;
    }
    loadingFrame.style.display = "block";
    await sleep(100);
    loadingFrame.style.transform = "translateY(0px)";
    await sleep(ms);
    loadedFrame.style.display = "flex";
    loadingDiv.style.display = "none";
    if (loadedFrame.querySelector("p")) {
        loadedFrame.querySelector("p").innerHTML = text2;
    }
    await sleep(1000);
    loadingFrame.style.transform = "translateY(200px)";
    await sleep(700);
    loadingFrame.style.display = "block";
}

/**
 * Show error in loading frame
 */
async function showLoadingError(errorText) {
    const loadingFrame = document.querySelector(".mainframe-loading");
    const loadingDiv = document.querySelector("#load-frame");
    const loadedFrame = document.querySelector("#loaded-frame");
    
    if (loadingFrame && loadingDiv && loadedFrame) {
        loadedFrame.style.display = "none";
        loadingDiv.style.display = "flex";
        if (loadingDiv.querySelector("p")) {
            loadingDiv.querySelector("p").innerHTML = errorText || "Error Loading Data";
        }
        const icon = loadingDiv.querySelector("i");
        if (icon) {
            icon.style.color = "#ff4747";
            icon.setAttribute("data-lucide", "alert-circle");
            lucide.createIcons();
        }
        loadingFrame.style.display = "block";
        await sleep(100);
        loadingFrame.style.transform = "translateY(0px)";
        
        // Hide after 3 seconds
        await sleep(3000);
        loadingFrame.style.transform = "translateY(200px)";
        await sleep(700);
        loadingFrame.style.display = "block";
        
        // Reset icon
        if (icon) {
            icon.style.color = "rgb(253, 253, 253)";
            icon.setAttribute("data-lucide", "loader");
            lucide.createIcons();
        }
    }
}

/**
 * Load historical data from backend
 */
async function loadHistoricalData() {
    const symbol = document.getElementById('symbol-input').value.trim().toUpperCase();
    const startDate = document.getElementById('start-date-input').value;
    const endDate = document.getElementById('end-date-input').value;
    const timeframe = document.getElementById('timeframe-select').value;
    
    if (!symbol || !startDate || !endDate) {
        await showLoadingError('Please fill in all fields: Symbol, Start Date, and End Date');
        return;
    }
    
    // Disable button
    const loadButton = document.getElementById('load-data-button');
    loadButton.disabled = true;
    loadButton.textContent = 'Loading...';
    
    try {
        // Show loading frame
        client_server_debounce = true
        loadingFrame(1000, "Retrieving historical data...", "Data Retrieved.");
        
        // Format dates for API (YYYY-MM-DD)
        const response = await fetch(
            `https://backtest-history-b52ovbio5q-uc.a.run.app?symbol=${encodeURIComponent(symbol)}&start=${startDate}&end=${endDate}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        client_server_debounce = false
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch historical data');
        }
        
        const candles = await response.json();
        
        if (!candles || candles.length === 0) {
            throw new Error('No data returned from API');
        }
        
        // Initialize chart if not already initialized
        if (!chart || !candlestickSeries) {
            await initChart();
        }
        
        // Update replay state with new data
        replayState.baseCandles1m = candles;
        replayState.timeframe = timeframe;
        replayState.currentIndex = 1; // Start with just the first candle
        
        // Rebuild derived candles for initial display (just first candle)
        rebuildDerivedCandles();
        
        // Update chart with current state (just one candle)
        updateChart();
        updateUI();
        
    } catch (error) {
        console.error('Error loading historical data:', error);
        await showLoadingError('Error: ' + error.message);
    } finally {
        loadButton.disabled = false;
        loadButton.textContent = 'Load Historical Data';
    }
}

/**
 * Set default dates (30 days ago to today)
 */
function setDefaultDates() {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    document.getElementById('start-date-input').value = formatDate(thirtyDaysAgo);
    document.getElementById('end-date-input').value = formatDate(today);
}

/**
 * Setup membership gating
 */
async function setupMembershipGating() {
    try {
        const token = localStorage.getItem("token");
        const paywallOverlay = document.getElementById('paywall-overlay');
        const mainFrame = document.querySelector('.MainFrame_Frame');
        
        if (!token) {
            // Not logged in, show paywall immediately
            if (paywallOverlay) paywallOverlay.style.display = 'flex';
            if (mainFrame) mainFrame.style.display = 'none';
            lucide.createIcons();
            return;
        }
        
        const response = await fetch("https://get-accountdata-b52ovbio5q-uc.a.run.app", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                token: token
            })
        });
        
        if (!response.ok) {
            if (paywallOverlay) paywallOverlay.style.display = 'flex';
            if (mainFrame) mainFrame.style.display = 'none';
            lucide.createIcons();
            return;
        }
        
        const clientData = await response.json();
        
        // Check if user has Pro membership
        const membership = clientData.result?.membership || clientData.membership || "";
        const isPro = membership.toLowerCase() === "pro";
        
        if (!isPro) {
            // Not Pro member, show paywall immediately
            if (paywallOverlay) paywallOverlay.style.display = 'flex';
            if (mainFrame) mainFrame.style.display = 'none';
        } else {
            // Pro member, hide paywall and show content
            if (paywallOverlay) paywallOverlay.style.display = 'none';
            if (mainFrame) mainFrame.style.display = 'block';
        }
        
        lucide.createIcons();
    } catch (error) {
        console.error('Error checking membership:', error);
        // On error, show paywall immediately
        const paywallOverlay = document.getElementById('paywall-overlay');
        const mainFrame = document.querySelector('.MainFrame_Frame');
        if (paywallOverlay) paywallOverlay.style.display = 'flex';
        if (mainFrame) mainFrame.style.display = 'none';
        lucide.createIcons();
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async function() {
    await getClientData()
    await sleep(100)
    // Check membership first before allowing access (no delay)
    setupMembershipGating().then(() => {
        // Only initialize if user has Pro access
        const paywall = document.getElementById('paywall-overlay');
        if (paywall && (paywall.style.display === 'none' || !paywall.offsetParent)) {
            // Set default dates
            setDefaultDates();
            
            // Don't initialize chart here - wait until data is loaded
            // Chart will be initialized in loadHistoricalData() after data is fetched
            
            // Initialize UI
            updateUI();
            
            // Initialize Lucide icons
            lucide.createIcons();
        }
    });
    
    // Load data button
    document.getElementById('load-data-button').addEventListener('click', loadHistoricalData);
    
    // Playback controls
    document.getElementById('play-pause-button').addEventListener('click', function() {
        if (replayState.isPlaying) {
            pauseReplay();
        } else {
            resumeReplay();
        }
    });
    
    document.getElementById('reset-button').addEventListener('click', resetReplay);
    
    document.getElementById('step-forward-button').addEventListener('click', function() {
        if (!replayState.isPlaying) {
            stepForward();
        }
    });
    
    document.getElementById('step-back-button').addEventListener('click', function() {
        if (!replayState.isPlaying) {
            stepBackward();
        }
    });
    
    // Speed slider
    document.getElementById('speed-slider').addEventListener('input', function(e) {
        replayState.speed = parseInt(e.target.value);
        document.getElementById('speed-display').textContent = replayState.speed + 'x';
        
        // Restart timer with new speed if playing
        if (replayState.isPlaying) {
            pauseReplay();
            resumeReplay();
        }
    });
    
    // Timeframe change
    document.getElementById('timeframe-select').addEventListener('change', function(e) {
        if (replayState.baseCandles1m.length > 0) {
            replayState.timeframe = e.target.value;
            rebuildDerivedCandles();
            updateChart();
            updateUI();
        }
    });
    
    // Sidebar toggle (mobile)
    const barIcon = document.querySelector("#bar-icon");
    const headFrame = document.querySelector(".MainFrame_HeadFrame");
    
    // Handle clicks on headframe - check if it's specifically the bar-icon
    if (headFrame) {
      headFrame.addEventListener("click", (e) => {
        // Check if the click target is the bar-icon or inside it
        const clickedBarIcon = e.target.closest("#bar-icon");
        
        if (clickedBarIcon) {
          // Click was on the bar-icon, toggle sidebar
          e.stopPropagation();
          console.log("Check")
          const sidebar = document.querySelector("#sidebar");
          if (sidebar) {
            sidebar.style.display = sidebar.style.display === "block" ? "none" : "block";
          }
        }
        // If click is not on bar-icon, do nothing (prevents accidental triggers)
      });
    }
    
    // Also add direct handler to bar-icon as backup
    if (barIcon) {
      barIcon.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent event bubbling
        console.log("Check")
        const sidebar = document.querySelector("#sidebar");
        if (sidebar) {
          sidebar.style.display = sidebar.style.display === "block" ? "none" : "block";
        }
      });
    }
});

