/**
 * Chart.js Utility Functions for My Agent Analytics
 * 
 * Provides easy-to-use functions for creating charts and data visualizations
 * Uses Chart.js v4.x loaded from CDN
 */

/**
 * Create a price trend line chart
 * @param {string} canvasId - Canvas element ID
 * @param {Array<{date: string, price: number}>} data - Price data with dates
 * @param {string} title - Chart title
 */
function createPriceTrendChart(canvasId, data, title = '価格推移') {
  const ctx = document.getElementById(canvasId);
  if (!ctx) {
    console.error(`Canvas element ${canvasId} not found`);
    return null;
  }

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.date),
      datasets: [{
        label: '価格 (万円)',
        data: data.map(d => d.price / 10000),
        borderColor: 'rgb(37, 99, 235)',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.4,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: title,
          font: { size: 16, weight: 'bold' }
        },
        legend: {
          display: true,
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `価格: ${context.parsed.y.toLocaleString('ja-JP')}万円`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            callback: function(value) {
              return value.toLocaleString('ja-JP') + '万円';
            }
          }
        }
      }
    }
  });
}

/**
 * Create a yield comparison bar chart
 * @param {string} canvasId - Canvas element ID
 * @param {Array<{name: string, grossYield: number, netYield: number}>} data - Yield data
 * @param {string} title - Chart title
 */
function createYieldComparisonChart(canvasId, data, title = '利回り比較') {
  const ctx = document.getElementById(canvasId);
  if (!ctx) {
    console.error(`Canvas element ${canvasId} not found`);
    return null;
  }

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.name),
      datasets: [
        {
          label: '表面利回り',
          data: data.map(d => d.grossYield),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(37, 99, 235)',
          borderWidth: 1,
        },
        {
          label: '実質利回り',
          data: data.map(d => d.netYield),
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgb(5, 150, 105)',
          borderWidth: 1,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: title,
          font: { size: 16, weight: 'bold' }
        },
        legend: {
          display: true,
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}%`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return value + '%';
            }
          }
        }
      }
    }
  });
}

/**
 * Create a price distribution pie chart
 * @param {string} canvasId - Canvas element ID
 * @param {Array<{category: string, amount: number}>} data - Distribution data
 * @param {string} title - Chart title
 */
function createPriceDistributionChart(canvasId, data, title = '価格分布') {
  const ctx = document.getElementById(canvasId);
  if (!ctx) {
    console.error(`Canvas element ${canvasId} not found`);
    return null;
  }

  const colors = [
    'rgba(239, 68, 68, 0.8)',
    'rgba(249, 115, 22, 0.8)',
    'rgba(251, 191, 36, 0.8)',
    'rgba(34, 197, 94, 0.8)',
    'rgba(59, 130, 246, 0.8)',
    'rgba(168, 85, 247, 0.8)',
  ];

  return new Chart(ctx, {
    type: 'pie',
    data: {
      labels: data.map(d => d.category),
      datasets: [{
        data: data.map(d => d.amount),
        backgroundColor: colors.slice(0, data.length),
        borderColor: '#ffffff',
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: title,
          font: { size: 16, weight: 'bold' }
        },
        legend: {
          display: true,
          position: 'right',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value.toLocaleString('ja-JP')}万円 (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

/**
 * Create a market analysis radar chart
 * @param {string} canvasId - Canvas element ID
 * @param {Object} data - Radar data with scores for different criteria
 * @param {string} title - Chart title
 */
function createMarketRadarChart(canvasId, data, title = '市場分析') {
  const ctx = document.getElementById(canvasId);
  if (!ctx) {
    console.error(`Canvas element ${canvasId} not found`);
    return null;
  }

  return new Chart(ctx, {
    type: 'radar',
    data: {
      labels: data.labels,
      datasets: [{
        label: '評価スコア',
        data: data.scores,
        borderColor: 'rgb(37, 99, 235)',
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        pointBackgroundColor: 'rgb(37, 99, 235)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(37, 99, 235)',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: title,
          font: { size: 16, weight: 'bold' }
        },
        legend: {
          display: true,
          position: 'top',
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: {
            stepSize: 20
          }
        }
      }
    }
  });
}

/**
 * Create a cash flow waterfall chart
 * @param {string} canvasId - Canvas element ID
 * @param {Array<{label: string, value: number}>} data - Cash flow data
 * @param {string} title - Chart title
 */
function createCashFlowWaterfallChart(canvasId, data, title = 'キャッシュフロー') {
  const ctx = document.getElementById(canvasId);
  if (!ctx) {
    console.error(`Canvas element ${canvasId} not found`);
    return null;
  }

  // Calculate cumulative values for waterfall effect
  let cumulative = 0;
  const waterfallData = data.map((item, index) => {
    const start = cumulative;
    cumulative += item.value;
    return {
      label: item.label,
      value: item.value,
      start: start,
      end: cumulative,
      isPositive: item.value >= 0
    };
  });

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: waterfallData.map(d => d.label),
      datasets: [{
        label: '金額 (万円)',
        data: waterfallData.map(d => d.value),
        backgroundColor: waterfallData.map(d => 
          d.isPositive ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)'
        ),
        borderColor: waterfallData.map(d => 
          d.isPositive ? 'rgb(5, 150, 105)' : 'rgb(220, 38, 38)'
        ),
        borderWidth: 1,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: title,
          font: { size: 16, weight: 'bold' }
        },
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.parsed.y;
              return `${value >= 0 ? '+' : ''}${value.toLocaleString('ja-JP')}万円`;
            }
          }
        }
      },
      scales: {
        y: {
          ticks: {
            callback: function(value) {
              return value.toLocaleString('ja-JP') + '万円';
            }
          }
        }
      }
    }
  });
}

/**
 * Create a property type distribution doughnut chart
 * @param {string} canvasId - Canvas element ID
 * @param {Array<{type: string, count: number}>} data - Property type data
 * @param {string} title - Chart title
 */
function createPropertyTypeChart(canvasId, data, title = '物件種別分布') {
  const ctx = document.getElementById(canvasId);
  if (!ctx) {
    console.error(`Canvas element ${canvasId} not found`);
    return null;
  }

  const colors = [
    'rgba(59, 130, 246, 0.8)',
    'rgba(16, 185, 129, 0.8)',
    'rgba(251, 191, 36, 0.8)',
    'rgba(249, 115, 22, 0.8)',
  ];

  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.map(d => d.type),
      datasets: [{
        data: data.map(d => d.count),
        backgroundColor: colors.slice(0, data.length),
        borderColor: '#ffffff',
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: title,
          font: { size: 16, weight: 'bold' }
        },
        legend: {
          display: true,
          position: 'bottom',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value}件 (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

/**
 * Create a scatter plot for price vs area analysis
 * @param {string} canvasId - Canvas element ID
 * @param {Array<{area: number, price: number, label: string}>} data - Scatter data
 * @param {string} title - Chart title
 */
function createPriceAreaScatterChart(canvasId, data, title = '価格・面積分析') {
  const ctx = document.getElementById(canvasId);
  if (!ctx) {
    console.error(`Canvas element ${canvasId} not found`);
    return null;
  }

  return new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [{
        label: '物件',
        data: data.map(d => ({ x: d.area, y: d.price / 10000 })),
        backgroundColor: 'rgba(37, 99, 235, 0.6)',
        borderColor: 'rgb(37, 99, 235)',
        pointRadius: 6,
        pointHoverRadius: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: title,
          font: { size: 16, weight: 'bold' }
        },
        legend: {
          display: true,
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const index = context.dataIndex;
              const item = data[index];
              return [
                item.label || `物件 ${index + 1}`,
                `面積: ${context.parsed.x}m²`,
                `価格: ${context.parsed.y.toLocaleString('ja-JP')}万円`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: '面積 (m²)'
          },
          ticks: {
            callback: function(value) {
              return value + 'm²';
            }
          }
        },
        y: {
          title: {
            display: true,
            text: '価格 (万円)'
          },
          ticks: {
            callback: function(value) {
              return value.toLocaleString('ja-JP') + '万円';
            }
          }
        }
      }
    }
  });
}

// Export functions for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createPriceTrendChart,
    createYieldComparisonChart,
    createPriceDistributionChart,
    createMarketRadarChart,
    createCashFlowWaterfallChart,
    createPropertyTypeChart,
    createPriceAreaScatterChart,
  };
}
