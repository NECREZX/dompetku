const Theme = {
    init() {
        const savedTheme = Storage.getTheme();
        this.apply(savedTheme);
        
        document.getElementById('themeToggle').addEventListener('click', () => {
            const current = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
            this.apply(current);
            Storage.saveTheme(current);
        });
    },

    apply(theme) {
        const body = document.body;
        const icon = document.querySelector('#themeToggle i');
        
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        
        if (theme === 'dark') {
            body.classList.add('dark-mode');
            body.classList.remove('light-mode');
            if (icon) icon.className = 'fas fa-sun';
            if (metaTheme) metaTheme.setAttribute('content', '#0f172a');
        } else {
            body.classList.add('light-mode');
            body.classList.remove('dark-mode');
            if (icon) icon.className = 'fas fa-moon';
            if (metaTheme) metaTheme.setAttribute('content', '#f5f0e8');
        }

        // Trigger re-render instan jika aplikasi sudah inisialisasi (preserve scroll)
        if (typeof App !== 'undefined' && App.loadContent) {
            App.loadContent(true);
        }
    }
};
