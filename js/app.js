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
        this.startReminderChecker();

        // Hide Splash Screen
        setTimeout(() => {
            const splash = document.getElementById('splashScreen');
            if (splash) {
                splash.classList.add('fade-out');
                // Restore original background color after flash protection
                document.body.style.backgroundColor = ''; 
                // Remove from DOM after transition
                setTimeout(() => splash.remove(), 800);
            }
        }, 2000);
    },

    notifiedReminders: [],

    startReminderChecker() {
        setInterval(() => {
            const activities = Storage.get(Storage.KEYS.AKTIVITAS);
            if (!activities || !Array.isArray(activities)) return;
            
            const reminders = activities.filter(a => a.category === 'reminders' && a.status === 'active');
            const now = new Date();
            const nowStr = now.getFullYear() + '-' + 
                           String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                           String(now.getDate()).padStart(2, '0') + 'T' + 
                           String(now.getHours()).padStart(2, '0') + ':' + 
                           String(now.getMinutes()).padStart(2, '0');

            reminders.forEach(r => {
                if (r.datetime === nowStr && !this.notifiedReminders.includes(r.id)) {
                    this.showRealNotification(r);
                    this.notifiedReminders.push(r.id);
                }
            });
        }, 30000); 
    },

    showRealNotification(reminder) {
        if (!("Notification" in window)) return;

        if (Notification.permission === "granted") {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification("Pengingat DompetKu", {
                    body: reminder.title,
                    icon: 'assets/icons/icon-192.png',
                    vibrate: [200, 100, 200],
                    tag: reminder.id
                });
            });
            
            Swal.fire({
                title: 'Pengingat!',
                text: reminder.title,
                icon: 'info',
                confirmButtonColor: 'var(--primary)',
            });
            
            Storage.addNotif('Pengingat Aktivitas', reminder.title);
        }
    },

    bindEvents() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            sidebar.classList.add('open');
            overlay.classList.add('visible');
        });

        document.getElementById('closeSidebar').addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('visible');
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
        } else if (this.currentModule === 'tabungan') {
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
        } else if (this.currentModule === 'aktivitas') {
            html = `
                <button class="nav-item ${this.currentTab === 'dashboard' ? 'active' : ''}" onclick="App.switchTab('dashboard')">
                    <i class="fas fa-chart-pie"></i><span>Dashboard</span>
                </button>
                <button class="nav-item ${this.currentTab === 'tambah' ? 'active' : ''}" onclick="App.switchTab('tambah')">
                    <i class="fas fa-plus-circle"></i><span>Aktivitas</span>
                </button>
                <button class="nav-item ${this.currentTab === 'riwayat' ? 'active' : ''}" onclick="App.switchTab('riwayat')">
                    <i class="fas fa-clock-rotate-left"></i><span>Riwayat</span>
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
        } else if (this.currentModule === 'tabungan') {
            switch(this.currentTab) {
                case 'dashboard': DashboardTabungan.render(container); break;
                case 'tujuan': TujuanTabungan.render(container); break;
                case 'riwayat': RiwayatTabungan.render(container); break;
                case 'kelola': KelolaTabungan.render(container); break;
            }
        } else if (this.currentModule === 'aktivitas') {
            switch(this.currentTab) {
                case 'dashboard': DashboardAktivitas.render(container); break;
                case 'tambah': TambahAktivitas.render(container); break;
                case 'riwayat': RiwayatAktivitas.render(container); break;
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
