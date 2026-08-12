document.addEventListener('DOMContentLoaded', () => {
    // 1. تصفية/فلترة المانجا عبر شريط البحث اللحظي
    const searchInput = document.getElementById('searchInput');
    const mangaCards = document.querySelectorAll('.manga-card');

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();

        mangaCards.forEach(card => {
            const title = card.querySelector('.card-info h3').textContent.toLowerCase();
            if (title.includes(query)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });

    // 2. زر إضافة المانجا إلى المفضلة
    const bookmarkBtn = document.querySelector('.bookmark-btn');
    let isBookmarked = false;

    bookmarkBtn.addEventListener('click', () => {
        isBookmarked = !isBookmarked;
        if (isBookmarked) {
            bookmarkBtn.innerHTML = '<i class="fa-solid fa-check"></i> تم الحفظ';
            bookmarkBtn.style.background = 'var(--neon-glow)';
        } else {
            bookmarkBtn.innerHTML = '<i class="fa-solid fa-plus"></i> أضف للمفضلة';
            bookmarkBtn.style.background = 'rgba(255,255,255,0.1)';
        }
    });

    // 3. تغيير حالة الرابط النشط في القائمة العلوية
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navLinks.forEach(item => item.classList.remove('active'));
            this.classList.add('active');
        });
    });
});
