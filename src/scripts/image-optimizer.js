/**
 * 图像优化脚本
 * 实现懒加载、自动图像尺寸和渐进式加载
 */

// 检查是否支持原生懒加载
const hasNativeLazyLoading = 'loading' in HTMLImageElement.prototype;

// 检查是否支持IntersectionObserver
const hasIntersectionObserver = 'IntersectionObserver' in window;

/**
 * 设置图像懒加载
 */
function setupLazyLoading(selector = 'img[loading="lazy"]') {
  // 如果浏览器支持原生懒加载，无需额外处理
  if (hasNativeLazyLoading) {
    console.log('Native lazy loading supported');
    return;
  }

  // 如果浏览器不支持IntersectionObserver，无法实现懒加载
  if (!hasIntersectionObserver) {
    console.log('IntersectionObserver not supported, cannot lazy load images');
    return;
  }

  // 获取所有需要懒加载的图像
  const lazyImages = document.querySelectorAll(selector);
  
  if (lazyImages.length === 0) {
    console.log('No lazy images found');
    return;
  }

  // 创建观察者实例
  const lazyImageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const lazyImage = entry.target;
        
        // 替换src属性
        if (lazyImage.dataset.src) {
          lazyImage.src = lazyImage.dataset.src;
        }
        
        // 替换srcset属性
        if (lazyImage.dataset.srcset) {
          lazyImage.srcset = lazyImage.dataset.srcset;
        }
        
        // 移除data-*属性
        lazyImage.removeAttribute('data-src');
        lazyImage.removeAttribute('data-srcset');
        
        // 停止观察该元素
        lazyImageObserver.unobserve(lazyImage);
      }
    });
  }, {
    rootMargin: '200px 0px', // 提前200px开始加载
  });

  // 观察所有懒加载图像
  lazyImages.forEach((lazyImage) => {
    lazyImageObserver.observe(lazyImage);
  });
}

/**
 * 优化所有图像
 */
function optimizeAllImages() {
  // 获取所有图像
  const images = document.querySelectorAll('img:not([data-no-optimize])');
  
  images.forEach((img) => {
    // 确保图像有width和height属性，防止布局偏移
    if (!img.hasAttribute('width') && !img.hasAttribute('height') && img.naturalWidth && img.naturalHeight) {
      img.setAttribute('width', img.naturalWidth);
      img.setAttribute('height', img.naturalHeight);
    }
    
    // 添加loading="lazy"属性
    if (!img.hasAttribute('loading') && !img.classList.contains('hero-image')) {
      img.setAttribute('loading', 'lazy');
    }
    
    // 添加decoding="async"属性
    if (!img.hasAttribute('decoding')) {
      img.setAttribute('decoding', 'async');
    }
    
    // 设置图像尺寸限制，防止过大图像
    if (!img.style.maxWidth) {
      img.style.maxWidth = '100%';
    }
  });
}

/**
 * 设置图像淡入效果
 */
function setupImageFadeIn() {
  // 应用样式
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
  
  // 获取所有图像
  const images = document.querySelectorAll('img:not([data-no-fade])');
  
  images.forEach((img) => {
    // 添加lazy-image类
    img.classList.add('lazy-image');
    
    // 监听load事件
    img.addEventListener('load', () => {
      img.classList.add('loaded');
    });
    
    // 如果图像已经加载完成，立即添加loaded类
    if (img.complete) {
      img.classList.add('loaded');
    }
  });
}

/**
 * 初始化图像优化
 */
export function initImageOptimizations() {
  // 执行优化
  setupLazyLoading();
  optimizeAllImages();
  setupImageFadeIn();
  
  // 监听DOM变化，处理动态添加的图像
  const observer = new MutationObserver((mutations) => {
    let hasNewImages = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeName === 'IMG') {
            hasNewImages = true;
          } else if (node.nodeType === 1) {
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
      setupImageFadeIn();
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// 页面加载后初始化
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    initImageOptimizations();
  } else {
    window.addEventListener('load', initImageOptimizations);
  }
} 
