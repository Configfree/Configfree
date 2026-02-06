/**
 * Configfree - Main Script
 * Optimized for https://configfree.github.io/Configfree/
 * Version: 2.1
 */
document.addEventListener('DOMContentLoaded', () => {
  // ==================== تنظیمات اولیه ====================
  const CONFIG = {
    repoUrl: 'https://configfree.github.io/Configfree/',
    configsFile: 'configs.txt',
    commentsFile: 'comments.json',
    telegramChannel: 'https://t.me/ConfigV2Ray_Free',
    updateInterval: 2 * 60 * 60 * 1000, // هر 2 ساعت
    maxConfigs: 100,
    notificationTimeout: 3000 // مدت زمان اعلان (میلی‌ثانیه)
  };

  // ==================== مدیریت تم ====================
  const initTheme = () => {
    const toggleTheme = () => {
      document.body.classList.toggle('dark-mode');
      localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
      updateThemeIcon();
    };

    const updateThemeIcon = () => {
      const icon = document.querySelector('.theme-toggle .theme-icon');
      if (icon) {
        icon.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
      }
    };

    // اتصال رویداد به دکمه تغییر تم
    document.querySelectorAll('.theme-toggle').forEach(button => {
      button.addEventListener('click', toggleTheme);
    });

    // تنظیم تم اولیه
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.body.classList.add('dark-mode');
    }
    updateThemeIcon();
  };

  // ==================== تاریخ شمسی ====================
  const initJalaliDate = () => {
    const jalaliDateElement = document.getElementById('jalali-date');
    if (jalaliDateElement && typeof moment !== 'undefined') {
      moment.locale('fa');
      jalaliDateElement.textContent = moment().format('jD jMMMM jYYYY');
    }
  };

  // ==================== اسلایدر ====================
  const initSlider = () => {
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
    const totalSlides = slides.length;
    if (totalSlides === 0) return;

    const showSlide = (index) => {
      slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
      });
    };

    const changeSlide = (direction) => {
      currentSlide = (currentSlide + direction + totalSlides) % totalSlides;
      showSlide(currentSlide);
    };

    // اتصال رویداد به دکمه‌های اسلایدر
    document.querySelector('.slider-btn.prev')?.addEventListener('click', () => changeSlide(-1));
    document.querySelector('.slider-btn.next')?.addEventListener('click', () => changeSlide(1));

    showSlide(currentSlide);
    setInterval(() => changeSlide(1), 5000);
  };

  // ==================== منوی آبشاری در موبایل ====================
  const initDropdownMenu = () => {
    document.querySelectorAll('.dropdown').forEach(dropdown => {
      dropdown.addEventListener('click', (e) => {
        e.preventDefault();
        const menu = dropdown.querySelector('.dropdown-menu');
        if (menu) {
          menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
        }
      });
    });
  };

  // ==================== مدیریت کانفیگ‌ها ====================
  const initConfigs = async () => {
    const loading = document.getElementById('loading');
    const configList = document.getElementById('config-list');
    if (!loading || !configList) return;

    loading.style.display = 'flex';
    configList.innerHTML = '';

    try {
      const response = await fetch(`${CONFIG.repoUrl}${CONFIG.configsFile}?t=${Date.now()}`, {
        cache: 'no-cache'
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.text();
      if (!data.trim()) throw new Error('فایل کانفیگ خالی است');

      const configs = data.trim().split('\n').slice(0, CONFIG.maxConfigs);
      window.allConfigs = configs;
      displayConfigs(configs);
      localStorage.setItem('lastConfigUpdate', Date.now());
    } catch (error) {
      console.error('خطا در دریافت کانفیگ‌ها:', error);
      configList.innerHTML = `
        <div class="error-message">
          <p>خطا در بارگذاری کانفیگ‌ها. لطفاً بعداً امتحان کنید.</p>
          <button onclick="location.reload()">تلاش مجدد</button>
        </div>
      `;
    } finally {
      loading.style.display = 'none';
    }
  };

  const displayConfigs = (configs) => {
    const configList = document.getElementById('config-list');
    if (!configList) return;

    configList.innerHTML = '';
    if (configs.length === 0) {
      configList.innerHTML = '<p class="empty-message">کانفیگی یافت نشد</p>';
      return;
    }

    configs.forEach(config => {
      const copyCount = localStorage.getItem(`copy-count-${config}`) || 0;
      const configType = getConfigType(config);
      const item = document.createElement('div');
      item.className = 'config-item';
      item.innerHTML = `
        <div class="config-icon-container">
          <img src="${getConfigIcon(configType)}" alt="${configType} Icon" class="config-icon" loading="lazy">
          <span class="config-type-badge">${configType}</span>
        </div>
        <div class="config-content">
          <span class="config-text">${config}</span>
          <div class="config-actions">
            <button class="copy-btn" data-config="${encodeConfig(config)}">
              کپی <span class="copy-count">${copyCount}</span>
            </button>
            <button class="share-btn" data-config="${encodeConfig(config)}">
              اشتراک
            </button>
          </div>
        </div>
      `;
      configList.appendChild(item);
    });

    // اتصال رویدادهای کپی و اشتراک
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', () => copyConfig(btn.dataset.config));
    });
    document.querySelectorAll('.share-btn').forEach(btn => {
      btn.addEventListener('click', () => shareConfig(btn.dataset.config));
    });
  };

  const getConfigType = (config) => {
    if (config.startsWith('vmess://')) return 'VMess';
    if (config.startsWith('vless://')) return 'VLESS';
    if (config.startsWith('trojan://')) return 'Trojan';
    if (config.startsWith('ss://')) return 'Shadowsocks';
    return 'Unknown';
  };

  const getConfigIcon = (type) => {
    const icons = {
      'VMess': 'https://raw.githubusercontent.com/v2ray/v2ray-core/master/doc/logo.png',
      'VLESS': 'https://raw.githubusercontent.com/XTLS/Xray-core/main/doc/logo.png',
      'Trojan': 'https://raw.githubusercontent.com/trojan-gfw/trojan/master/doc/logo.png',
      'Shadowsocks': 'https://raw.githubusercontent.com/shadowsocks/shadowsocks-org/master/public/images/logo.png'
    };
    return icons[type] || icons['VMess'];
  };

  const encodeConfig = (config) => encodeURIComponent(config);

  // ==================== فیلتر کانفیگ‌ها ====================
  const filterConfigs = () => {
    const filter = document.getElementById('config-filter')?.value || 'all';
    const filteredConfigs = window.allConfigs?.filter(config => 
      filter === 'all' || config.toLowerCase().includes(filter.toLowerCase())
    ) || [];
    displayConfigs(filteredConfigs);
  };

  // اتصال رویداد فیلتر
  document.getElementById('config-filter')?.addEventListener('change', filterConfigs);

  // ==================== کپی و اشتراک ====================
  const copyConfig = async (encodedConfig) => {
    const config = decodeURIComponent(encodedConfig);
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(config);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = config;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      showNotification('کانفیگ با موفقیت کپی شد!');
      const count = parseInt(localStorage.getItem(`copy-count-${config}`) || 0) + 1;
      localStorage.setItem(`copy-count-${config}`, count);
      if (window.allConfigs) displayConfigs(window.allConfigs);
    } catch (err) {
      console.error('خطا در کپی:', err);
      showNotification('خطا در کپی کردن کانفیگ', 'error');
    }
  };

  const shareConfig = (encodedConfig) => {
    const config = decodeURIComponent(encodedConfig);
    const shareData = {
      title: 'کانفیگ جدید از Configfree',
      text: `کانفیگ جدید از Configfree:\n${config}`,
      url: CONFIG.telegramChannel
    };
    if (navigator.share) {
      navigator.share(shareData).catch(err => console.error('خطا در اشتراک:', err));
    } else {
      const shareUrl = `${CONFIG.telegramChannel}?text=${encodeURIComponent(shareData.text)}`;
      window.open(shareUrl, '_blank');
    }
  };

  const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
    }, CONFIG.notificationTimeout);
  };

  // ==================== نظرات ====================
  const initComments = () => {
    const commentForm = document.getElementById('comment-form');
    const commentList = document.getElementById('comment-list');
    if (!commentForm || !commentList) return;

    loadComments(commentList);

    commentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('comment-name');
      const textInput = document.getElementById('comment-text');
      const name = nameInput.value.trim();
      const text = textInput.value.trim();

      if (!name || !text) {
        showNotification('لطفاً نام و نظر خود را وارد کنید', 'error');
        return;
      }

      try {
        const newComment = {
          name,
          text,
          date: moment().locale('fa').format('jD jMMMM jYYYY'),
          pending: true
        };
        displayComment(newComment, commentList);
        commentForm.reset();
        showNotification('نظر شما با موفقیت ثبت شد و پس از تأیید نمایش داده می‌شود');
      } catch (error) {
        console.error('خطا در ثبت نظر:', error);
        showNotification('خطا در ثبت نظر', 'error');
      }
    });
  };

  const loadComments = async (commentList) => {
    try {
      const response = await fetch(`${CONFIG.repoUrl}${CONFIG.commentsFile}?t=${Date.now()}`, {
        cache: 'no-cache'
      });
      if (!response.ok) return;
      const comments = await response.json();
      comments.forEach(comment => {
        if (!comment.pending) displayComment(comment, commentList);
      });
    } catch (error) {
      console.error('خطا در دریافت نظرات:', error);
    }
  };

  const displayComment = (comment, container) => {
    const commentEl = document.createElement('div');
    commentEl.className = `comment-item ${comment.pending ? 'pending' : ''}`;
    commentEl.innerHTML = `
      <p><strong>${comment.name}</strong>: ${comment.text}</p>
      <small>${comment.date} ${comment.pending ? '(در انتظار تأیید)' : ''}</small>
    `;
    container.appendChild(commentEl);
  };

  // ==================== مدیریت هدر ====================
  const initHeader = () => {
    let lastScroll = 0;
    const header = document.querySelector('.sticky-header');
    if (!header) return;

    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;
      header.classList.toggle('hide', currentScroll > lastScroll && currentScroll > 100);
      lastScroll = currentScroll;
    });
  };

  // ==================== بررسی آپدیت‌ها ====================
  const checkForUpdates = () => {
    const lastUpdate = localStorage.getItem('lastConfigUpdate');
    if (!lastUpdate || (Date.now() - parseInt(lastUpdate)) > CONFIG.updateInterval) {
      initConfigs();
    }
  };

  // ==================== اعتبارسنجی کانفیگ‌ها ====================
  const validateConfig = (config) => {
    const validPrefixes = ['vmess://', 'vless://', 'trojan://', 'ss://'];
    return validPrefixes.some(prefix => config.startsWith(prefix));
  };

  // ==================== راه‌اندازی اولیه ====================
  const initialize = () => {
    initTheme();
    initJalaliDate();
    initSlider();
    initDropdownMenu();
    initConfigs();
    initComments();
    initHeader();
    setInterval(checkForUpdates, 5 * 60 * 1000);
  };

  // اجرا فقط اگر در index.html هستیم
  if (document.getElementById('config-list')) {
    initConfigs();
    document.getElementById('config-filter')?.addEventListener('change', filterConfigs);
  }

  initialize();
});
