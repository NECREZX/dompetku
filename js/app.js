const App = {
    currentModule: 'keuangan',
    currentTab: 'dashboard',

    init() {
        Theme.init();
        this.bindEvents();
        UI.updateProfileUI();
        this.renderBottomBar();
        this.loadContent();
        this.checkNotifications();

        // Hide Splash Screen
        setTimeout(() => {
            const splash = document.getElementById('splashScreen');
            if (splash) {
                splash.classList.add('fade-out');
                // Remove from DOM after transition
                setTimeout(() => splash.remove(), 800);
            }
        }, 2000);
    },

    bindEvents() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            sidebar.classList.add('open');
            overlay.classList.add('visible');
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('visible');
        });

        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', () => {
                const module = item.dataset.module;
                this.switchModule(module);
                sidebar.classList.remove('open');
                overlay.classList.remove('visible');
            });
        });

        document.querySelector('.user-profile').addEventListener('click', () => {
            UI.showProfileEdit();
            sidebar.classList.remove('open');
            overlay.classList.remove('visible');
        });
    },

    switchModule(module) {
        this.currentModule = module;
        this.currentTab = 'dashboard';
        
        document.querySelectorAll('.sidebar-item').forEach(i => {
            i.classList.toggle('active', i.dataset.module === module);
        });

        this.renderBottomBar();
        this.loadContent();
    },

    renderBottomBar() {
        const nav = document.getElementById('bottomNav');
        let html = '';
        
        if (this.currentModule === 'keuangan') {
            html = `
                <button class="nav-item ${this.currentTab === 'dashboard' ? 'active' : ''}" onclick="App.switchTab('dashboard')">
                    <i class="fas fa-chart-pie"></i><span>Dashboard</span>
                </button>
                <button class="nav-item ${this.currentTab === 'transaksi' ? 'active' : ''}" onclick="App.switchTab('transaksi')">
                    <i class="fas fa-plus-circle"></i><span>Transaksi</span>
                </button>
                <button class="nav-item ${this.currentTab === 'riwayat' ? 'active' : ''}" onclick="App.switchTab('riwayat')">
                    <i class="fas fa-history"></i><span>Riwayat</span>
                </button>
                <button class="nav-item ${this.currentTab === 'sumber' ? 'active' : ''}" onclick="App.switchTab('sumber')">
                    <i class="fas fa-tags"></i><span>Kategori</span>
                </button>
            `;
        } else {
            html = `
                <button class="nav-item ${this.currentTab === 'dashboard' ? 'active' : ''}" onclick="App.switchTab('dashboard')">
                    <i class="fas fa-chart-pie"></i><span>Dashboard</span>
                </button>
                <button class="nav-item ${this.currentTab === 'tujuan' ? 'active' : ''}" onclick="App.switchTab('tujuan')">
                    <i class="fas fa-bullseye"></i><span>Target</span>
                </button>
                <button class="nav-item ${this.currentTab === 'riwayat' ? 'active' : ''}" onclick="App.switchTab('riwayat')">
                    <i class="fas fa-clock-rotate-left"></i><span>Riwayat</span>
                </button>
                <button class="nav-item ${this.currentTab === 'kelola' ? 'active' : ''}" onclick="App.switchTab('kelola')">
                    <i class="fas fa-wallet"></i><span>Kelola</span>
                </button>
            `;
        }
        nav.innerHTML = html;
    },

    switchTab(tab) {
        this.currentTab = tab;
        this.renderBottomBar();
        this.loadContent();
    },

    loadContent() {
        const container = document.getElementById('appContent');
        
        if (this.currentModule === 'keuangan') {
            switch(this.currentTab) {
                case 'dashboard': DashboardKeuangan.render(container); break;
                case 'transaksi': Transaksi.render(container); break;
                case 'riwayat': RiwayatKeuangan.render(container); break;
                case 'sumber': SumberKategori.render(container); break;
            }
        } else {
            switch(this.currentTab) {
                case 'dashboard': DashboardTabungan.render(container); break;
                case 'tujuan': TujuanTabungan.render(container); break;
                case 'riwayat': RiwayatTabungan.render(container); break;
                case 'kelola': KelolaTabungan.render(container); break;
            }
        }
        window.scrollTo(0,0);
    },

    checkNotifications() {
        const notifs = Storage.get(Storage.KEYS.NOTIF);
        const unreadCount = notifs.filter(n => n.unread).length;
        UI.updateNotifBadge(unreadCount);
    }
};

window.addEventListener('DOMContentLoaded', () => App.init());
