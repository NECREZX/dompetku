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
        
        if (theme === 'dark') {
            body.classList.add('dark-mode');
            icon.className = 'fas fa-sun';
        } else {
            body.classList.remove('dark-mode');
            icon.className = 'fas fa-moon';
        }
    }
};
