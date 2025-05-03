// Web Vitals 性能监控脚本
// 基于 https://github.com/GoogleChrome/web-vitals

const webVitals = {};

// 核心Web Vitals度量
webVitals.getCLS = (onReport) => {
  let metric = {name: 'CLS', value: 0};
  let reportedValue = 0;
  
  // 使用PerformanceObserver对象监听布局偏移
  let observer = new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      // 只处理不涉及用户输入的布局偏移
      if (!entry.hadRecentInput) {
        metric.value += entry.value;
      }
    }
    
    // 当值变化时报告最新值
    if (metric.value > reportedValue) {
      reportedValue = metric.value;
      onReport(metric);
    }
  });
  
  observer.observe({type: 'layout-shift', buffered: true});
};

webVitals.getFID = (onReport) => {
  let metric = {name: 'FID', value: 0};
  
  // 监听首次输入延迟
  new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      // 首次输入延迟
      metric.value = entry.processingStart - entry.startTime;
      onReport(metric);
    }
  }).observe({type: 'first-input', buffered: true});
};

webVitals.getLCP = (onReport) => {
  let metric = {name: 'LCP', value: 0};
  let reportedValue = 0;
  
  // 监听LCP指标
  new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    const lastEntry = entries[entries.length - 1];
    
    metric.value = lastEntry.startTime;
    
    // 始终报告最后观察到的LCP
    if (metric.value > reportedValue) {
      reportedValue = metric.value;
      onReport(metric);
    }
  }).observe({type: 'largest-contentful-paint', buffered: true});
};

// 发送性能数据到分析服务
function sendToAnalytics(metric) {
  // 指标值保留两位小数
  const value = Math.round(metric.value * 100) / 100;
  
  // 使用navigator.sendBeacon发送数据
  if (navigator.sendBeacon) {
    const payload = JSON.stringify({
      name: metric.name,
      value: value,
      path: window.location.pathname,
      userAgent: navigator.userAgent,
      timestamp: new Date().getTime()
    });
    
    // 如果您有分析端点，可以替换为实际的URL
    // navigator.sendBeacon('/analytics/web-vitals', payload);
    
    // 开发环境下记录到控制台
    console.log(`[Web Vitals] ${metric.name}: ${value}`);
  }
}

// 初始化性能监控
export function initWebVitals() {
  // 如果Performance API可用，则监控Web Vitals
  if (typeof PerformanceObserver !== 'undefined') {
    // 设置通用的处理函数
    webVitals.getCLS(sendToAnalytics);
    webVitals.getFID(sendToAnalytics);
    webVitals.getLCP(sendToAnalytics);
  }
}

// 页面加载后自动初始化
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    initWebVitals();
  } else {
    window.addEventListener('load', () => {
      // 延迟执行以避免阻塞页面渲染
      setTimeout(initWebVitals, 100);
    });
  }
} 
