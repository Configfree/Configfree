/**
 * Configfree - Main Script
 * Optimized for https://configfree.github.io/Configfree/
 * Version: 2.0
 */

document.addEventListener('DOMContentLoaded', () => {
    // ==================== تنظیمات اولیه ====================
    const CONFIG = {
        repoUrl: 'https://configfree.github.io/Configfree/',
        configsFile: 'configs.txt',
        commentsFile: 'comments.json',
        telegramChannel: 'https://t.me/configs_freeiran',
        updateInterval: 2 * 60 * 60 * 1000, // هر 2 ساعت
        maxConfigs: 100
    };

    // ==================== مدیریت تم ====================
    const initTheme = () => {
        const toggleTheme = () => {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
            updateThemeIcon();
        };

        const updateThemeIcon = () => {
            const icon = document.querySelector('.theme-toggle');
            if (icon) {
                icon.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
            }
        };

        window.toggleTheme = toggleTheme;
        
        // تنظیم تم اولیه
        if (localStorage.getItem('theme') === 'dark' || 
            (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.body.classList.add('dark-mode');
        }
        updateThemeIcon();
    };

    // ==================== تاریخ شمسی ====================
    const initJalaliDate = () => {
        const jalaliDateElement = document.getElementById('jalali-date');
        if (jalaliDateElement) {
            const today = moment().locale('fa').format('jD jMMMM jYYYY');
            jalaliDateElement.textContent = today;
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

        window.changeSlide = (n) => {
            currentSlide = (currentSlide + n + totalSlides) % totalSlides;
            showSlide(currentSlide);
        };

        showSlide(currentSlide);
        setInterval(() => changeSlide(1), 5000);
    };

    // ==================== مدیریت کانفیگ‌ها ====================
    const initConfigs = async () => {
        const loading = document.getElementById('loading');
        const configList = document.getElementById('config-list');

        if (!loading || !configList) return;

        loading.style.display = 'flex';
        configList.innerHTML = '';

        try {
            const response = await fetch(`${CONFIG.repoUrl}${CONFIG.configsFile}?t=${Date.now()}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.text();
            if (!data.trim()) throw new Error('فایل کانفیگ خالی است');

            const configs = data.trim().split('\n').slice(0, CONFIG.maxConfigs);
            window.allConfigs = configs;
            displayConfigs(configs);
            
            // ذخیره زمان آخرین آپدیت
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
                    <img src="${getConfigIcon(configType)}" alt="${configType} Icon" class="config-icon">
                    <span class="config-type-badge">${configType}</span>
                </div>
                <div class="config-content">
                    <span class="config-text">${config}</span>
                    <div class="config-actions">
                        <button class="copy-btn" onclick="copyConfig('${encodeConfig(config)}')">
                            کپی <span class="copy-count">${copyCount}</span>
                        </button>
                        <button class="share-btn" onclick="shareConfig('${encodeConfig(config)}')">
                            اشتراک
                        </button>
                    </div>
                </div>
            `;
            configList.appendChild(item);
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

    const encodeConfig = (config) => {
        return encodeURIComponent(config);
    };

    // ==================== فیلتر کانفیگ‌ها ====================
    window.filterConfigs = () => {
        const filter = document.getElementById('config-filter')?.value || 'all';
        const filteredConfigs = window.allConfigs?.filter(config => {
            if (filter === 'all') return true;
            return config.toLowerCase().includes(filter.toLowerCase());
        }) || [];
        displayConfigs(filteredConfigs);
    };

    // ==================== کپی و اشتراک ====================
    window.copyConfig = async (encodedConfig) => {
        const config = decodeURIComponent(encodedConfig);
        try {
            await navigator.clipboard.writeText(config);
            
            // نمایش نوتیفیکیشن
            showNotification('کانفیگ با موفقیت کپی شد!');
            
            // افزایش شمارنده کپی
            const count = parseInt(localStorage.getItem(`copy-count-${config}`) || 0) + 1;
            localStorage.setItem(`copy-count-${config}`, count);
            
            // آپدیت نمایش
            if (window.allConfigs) {
                displayConfigs(window.allConfigs);
            }
        } catch (err) {
            console.error('خطا در کپی:', err);
            showNotification('خطا در کپی کردن کانفیگ', 'error');
        }
    };

    window.shareConfig = (encodedConfig) => {
        const config = decodeURIComponent(encodedConfig);
        const shareUrl = `${CONFIG.telegramChannel}?text=${encodeURIComponent(`کانفیگ جدید از Configfree:\n${config}`)}`;
        window.open(shareUrl, '_blank');
    };

    const showNotification = (message, type = 'success') => {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    };

    // ==================== نظرات ====================
    const initComments = () => {
        const commentForm = document.getElementById('comment-form');
        const commentList = document.getElementById('comment-list');

        if (!commentForm || !commentList) return;

        // بارگذاری نظرات
        loadComments(commentList);

        // ارسال نظر
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
                // در حالت واقعی اینجا باید به سرور ارسال شود
                const newComment = {
                    name,
                    text,
                    date: moment().locale('fa').format('jD jMMMM jYYYY'),
                    pending: true
                };
                
                // نمایش موقت نظر
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
            const response = await fetch(`${CONFIG.repoUrl}${CONFIG.commentsFile}`);
            if (!response.ok) return;
            
            const comments = await response.json();
            comments.forEach(comment => {
                if (!comment.pending) {
                    displayComment(comment, commentList);
                }
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
            
            if (currentScroll > lastScroll && currentScroll > 100) {
                header.classList.add('hide');
            } else {
                header.classList.remove('hide');
            }

            lastScroll = currentScroll;
        });
    };

    // ==================== بررسی آپدیت‌ها ====================
    const checkForUpdates = () => {
        const lastUpdate = localStorage.getItem('lastConfigUpdate');
        if (!lastUpdate || (Date.now() - lastUpdate) > CONFIG.updateInterval) {
            initConfigs();
        }
    };

    // ==================== راه‌اندازی اولیه ====================
    initTheme();
    initJalaliDate();
    initSlider();
    initConfigs();
    initComments();
    initHeader();
    
    // بررسی آپدیت‌ها هر 5 دقیقه
    setInterval(checkForUpdates, 5 * 60 * 1000);
});

// توابع عمومی
window.copyConfig = (config) => {
    navigator.clipboard.writeText(config).then(() => {
        alert('کانفیگ کپی شد!');
    }).catch(err => {
        console.error('خطا در کپی:', err);
    });
};

window.shareConfig = (config) => {
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(config)}&text=کانفیگ جدید از Configfree!`;
    window.open(shareUrl, '_blank');
};
