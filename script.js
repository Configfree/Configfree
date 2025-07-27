document.addEventListener('DOMContentLoaded', () => {
    // نمایش تاریخ شمسی
    const jalaliDateElement = document.getElementById('jalali-date');
    if (jalaliDateElement) {
        const today = moment().locale('fa').format('D MMMM YYYY');
        jalaliDateElement.textContent = today;
    }

    // Dark Mode
    const toggleTheme = () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    };

    window.toggleTheme = toggleTheme;
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }

    // اسلایدر
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
    const totalSlides = slides.length;

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

    // لود کانفیگ‌ها
    const loading = document.getElementById('loading');
    const configList = document.getElementById('config-list');

    if (loading && configList) {
        loading.style.display = 'block';
        configList.style.display = 'none';

        fetch('configs.txt')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(data => {
                loading.style.display = 'none';
                configList.style.display = 'block';

                if (!data.trim()) {
                    console.error('فایل configs.txt خالی است');
                    configList.innerHTML = '<p class="error">فایل کانفیگ خالی است.</p>';
                    return;
                }

                const configs = data.trim().split('\n');
                window.allConfigs = configs;
                displayConfigs(configs);
            })
            .catch(error => {
                loading.style.display = 'none';
                configList.style.display = 'block';
                console.error('خطا در لود configs.txt:', error);
                configList.innerHTML = '<p class="error">خطا در بارگذاری کانفیگ‌ها. لطفاً بعداً امتحان کنید.</p>';
            });
    }

    // فیلتر کانفیگ‌ها
    window.filterConfigs = () => {
        const filter = document.getElementById('config-filter').value;
        const filteredConfigs = window.allConfigs.filter(config => {
            if (filter === 'all') return true;
            return config.toLowerCase().includes(filter.toLowerCase());
        });
        displayConfigs(filteredConfigs);
    };

    function displayConfigs(configs) {
        configList.innerHTML = '';
        configs.forEach(config => {
            const copyCount = localStorage.getItem(`copy-count-${config}`) || 0;
            const div = document.createElement('div');
            div.className = 'config-item';
            div.innerHTML = `
                <img src="https://raw.githubusercontent.com/v2ray/v2ray-core/master/doc/logo.png" alt="v2rayNG Icon" class="config-icon">
                <span class="config-text">${config}</span>
                <div class="config-actions">
                    <button class="copy-btn" onclick="copyConfig('${config}')">کپی (<span class="copy-count">${copyCount}</span>)</button>
                    <button class="share-btn" onclick="shareConfig('${config}')">اشتراک</button>
                </div>
            `;
            configList.appendChild(div);
        });
    }

    window.copyConfig = (config) => {
        navigator.clipboard.writeText(config).then(() => {
            alert('کانفیگ کپی شد!');
            const count = parseInt(localStorage.getItem(`copy-count-${config}`) || 0) + 1;
            localStorage.setItem(`copy-count-${config}`, count);
            displayConfigs(window.allConfigs);
        }).catch(err => {
            console.error('خطا در کپی:', err);
        });
    };

    window.shareConfig = (config) => {
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(config)}&text=کانفیگ جدید از Configfree!`;
        window.open(shareUrl, '_blank');
    };

    // نظرات
    const commentForm = document.getElementById('comment-form');
    const commentList = document.getElementById('comment-list');

    if (commentForm && commentList) {
        fetch('comments.json')
            .then(response => response.ok ? response.json() : [])
            .then(comments => {
                displayComments(comments);
            })
            .catch(error => {
                console.error('خطا در لود نظرات:', error);
                commentList.innerHTML = '<p class="error">خطا در بارگذاری نظرات.</p>';
            });

        commentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('comment-name').value;
            const text = document.getElementById('comment-text').value;
            const date = moment().locale('fa').format('D MMMM YYYY');

            const newComment = { name, text, date, pending: true };

            // ارسال نظر به سرور (Workflow)
            fetch('https://api.github.com/repos/Lightningteam2007/Configfree.github.io/contents/comments.json', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${YOUR_GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            })
                .then(response => response.json())
                .then(data => {
                    const comments = JSON.parse(atob(data.content));
                    comments.push(newComment);
                    return fetch('https://api.github.com/repos/Lightningteam2007/Configfree.github.io/contents/comments.json', {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${YOUR_GITHUB_TOKEN}`,
                            'Accept': 'application/vnd.github.v3+json'
                        },
                        body: JSON.stringify({
                            message: `Add new comment from ${name}`,
                            content: btoa(JSON.stringify(comments, null, 2)),
                            sha: data.sha
                        })
                    });
                })
                .then(() => {
                    alert('نظر شما ثبت شد! بعد از تأیید نمایش داده می‌شه.');
                    commentForm.reset();
                })
                .catch(error => {
                    console.error('خطا در ثبت نظر:', error);
                    alert('خطا در ثبت نظر. لطفاً بعداً امتحان کنید.');
                });
        });
    }

    function displayComments(comments) {
        commentList.innerHTML = '';
        comments
            .filter(comment => !comment.pending)
            .forEach(comment => {
                const div = document.createElement('div');
                div.className = 'comment-item';
                div.innerHTML = `
                    <p><strong>${comment.name}</strong>: ${comment.text}</p>
                    <small>${comment.date}</small>
                `;
                commentList.appendChild(div);
            });
    }

    // پنهان کردن هدر با اسکرول به سمت پایین
    let lastScroll = 0;
    const header = document.querySelector('.sticky-header');

    window.addEventListener('scroll', () => {
        let currentScroll = window.pageYOffset;

        if (currentScroll > lastScroll && currentScroll > 100) {
            // وقتی اسکرول به سمت پایین می‌ره و بیشتر از 100px باشه، هدر محو می‌شه
            header.classList.add('hide');
        } else {
            // وقتی اسکرول به سمت بالا می‌ره، هدر برمی‌گرده
            header.classList.remove('hide');
        }

        lastScroll = currentScroll;
    });
});
