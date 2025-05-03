// 图像优化脚本
// 提供延迟加载、渐进式加载和尺寸优化功能

// 检查是否支持 Intersection Observer API
const hasIntersectionObserver = 'IntersectionObserver' in window;

// 检查是否支持 loading="lazy" 属性
const hasNativeLoading = 'loading' in HTMLImageElement.prototype;

/**
 * 图像延迟加载处理函数
 * @param {string} selector - 要延迟加载的图像的CSS选择器
 */
function setupLazyLoading(selector = 'img[loading="lazy"]') {
  // 如果浏览器支持原生延迟加载，则直接返回
  if (hasNativeLoading) {
    console.log('[Images] Native lazy loading supported');
    return;
  }

  // 如果不支持 Intersection Observer，则立即加载所有图像
  if (!hasIntersectionObserver) {
    console.log('[Images] IntersectionObserver not supported, loading all images');
    document.querySelectorAll(selector).forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
      }
      if (img.dataset.srcset) {
        img.srcset = img.dataset.srcset;
      }
    });
    return;
  }

  // 创建 Intersection Observer 实例
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // 当图像进入视口时加载图像
      if (entry.isIntersecting) {
        const img = entry.target;
        
        // 加载图像
        if (img.dataset.src) {
          img.src = img.dataset.src;
        }
        if (img.dataset.srcset) {
          img.srcset = img.dataset.srcset;
        }
        
        // 停止观察此图像
        observer.unobserve(img);
      }
    });
  }, {
    // 图像在距离视口 200px 时开始加载
    rootMargin: '200px 0px',
    threshold: 0.01
  });

  // 观察所有延迟加载的图像
  document.querySelectorAll(selector).forEach(img => {
    observer.observe(img);
  });
}

/**
 * 优化文档中的所有图像
 */
function optimizeAllImages() {
  document.querySelectorAll('img').forEach(img => {
    // 确保所有图像都有明确的宽高比
    if (img.width && img.height && !img.style.aspectRatio) {
      img.style.aspectRatio = `${img.width} / ${img.height}`;
    }
    
    // 对于没有width属性的图像，设置为auto以防止溢出
    if (!img.hasAttribute('width') && !img.style.width) {
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
    }
    
    // 添加 loading="lazy" 属性 (如果浏览器支持)
    if (hasNativeLoading && !img.hasAttribute('loading') && !img.closest('picture') && !img.dataset.src) {
      img.loading = 'lazy';
    }
    
    // 添加 decoding="async" 属性以加快渲染速度
    if (!img.hasAttribute('decoding')) {
      img.decoding = 'async';
    }
  });
}

/**
 * 为图像添加淡入效果
 */
function setupImageFadeIn() {
  // 添加CSS过渡效果
  const style = document.createElement('style');
  style.textContent = `
    img.lazy-image {
      opacity: 0;
      transition: opacity 0.3s ease-in-out;
    }
    img.lazy-image.loaded {
      opacity: 1;
    }
  `;
  document.head.appendChild(style);
  
  // 为需要淡入效果的图像添加加载监听器
  document.querySelectorAll('img.lazy-image').forEach(img => {
    img.addEventListener('load', () => {
      img.classList.add('loaded');
    });
  });
}

/**
 * 初始化图像优化
 */
export function initImageOptimizations() {
  // 设置延迟加载
  setupLazyLoading();
  
  // 优化所有图像
  optimizeAllImages();
  
  // 设置图像淡入效果
  setupImageFadeIn();
  
  // 监听DOM变化，处理动态添加的图像
  if ('MutationObserver' in window) {
    const observer = new MutationObserver((mutations) => {
      let hasNewImages = false;
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeName === 'IMG') {
              hasNewImages = true;
            } else if (node.querySelectorAll) {
              const images = node.querySelectorAll('img');
              if (images.length > 0) {
                hasNewImages = true;
              }
            }
          });
        }
      });
      
      if (hasNewImages) {
        optimizeAllImages();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

// 页面加载后初始化
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    initImageOptimizations();
  } else {
    window.addEventListener('load', initImageOptimizations);
  }
} 
