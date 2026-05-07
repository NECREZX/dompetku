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
        Widgets.init();

        // Auto open sidebar on Web Desktop (>= 1024px)
        if (window.innerWidth >= 1024) {
            document.getElementById('sidebar').classList.add('open');
            document.body.classList.add('sidebar-open');
        }

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
            const isOpen = sidebar.classList.toggle('open');
            if (isOpen) {
                document.body.classList.add('sidebar-open');
                overlay.classList.add('visible');
            } else {
                document.body.classList.remove('sidebar-open');
                overlay.classList.remove('visible');
            }
        });



        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            document.body.classList.remove('sidebar-open');
            overlay.classList.remove('visible');
        });

        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', () => {
                const module = item.dataset.module;
                this.switchModule(module);
                
                // Only close on mobile/tablet (less than 1024px)
                if (window.innerWidth < 1024) {
                    sidebar.classList.remove('open');
                    document.body.classList.remove('sidebar-open');
                    overlay.classList.remove('visible');
                }
            });
        });

        document.querySelector('.user-profile').addEventListener('click', () => {
            UI.showProfileEdit();
            if (window.innerWidth < 1024) {
                sidebar.classList.remove('open');
                document.body.classList.remove('sidebar-open');
                overlay.classList.remove('visible');
            }
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
                <button class="b-nav-item ${this.currentTab === 'dashboard' ? 'active' : ''}" onclick="App.switchTab('dashboard')">
                    <i class="fas fa-chart-pie"></i><span>Dashboard</span>
                </button>
                <button class="b-nav-item ${this.currentTab === 'transaksi' ? 'active' : ''}" onclick="App.switchTab('transaksi')">
                    <i class="fas fa-plus-circle"></i><span>Transaksi</span>
                </button>
                <button class="b-nav-item ${this.currentTab === 'riwayat' ? 'active' : ''}" onclick="App.switchTab('riwayat')">
                    <i class="fas fa-history"></i><span>Riwayat</span>
                </button>
                <button class="b-nav-item ${this.currentTab === 'sumber' ? 'active' : ''}" onclick="App.switchTab('sumber')">
                    <i class="fas fa-tags"></i><span>Kategori</span>
                </button>
            `;
        } else if (this.currentModule === 'tabungan') {
            html = `
                <button class="b-nav-item ${this.currentTab === 'dashboard' ? 'active' : ''}" onclick="App.switchTab('dashboard')">
                    <i class="fas fa-chart-pie"></i><span>Dashboard</span>
                </button>
                <button class="b-nav-item ${this.currentTab === 'tujuan' ? 'active' : ''}" onclick="App.switchTab('tujuan')">
                    <i class="fas fa-bullseye"></i><span>Target</span>
                </button>
                <button class="b-nav-item ${this.currentTab === 'riwayat' ? 'active' : ''}" onclick="App.switchTab('riwayat')">
                    <i class="fas fa-clock-rotate-left"></i><span>Riwayat</span>
                </button>
                <button class="b-nav-item ${this.currentTab === 'kelola' ? 'active' : ''}" onclick="App.switchTab('kelola')">
                    <i class="fas fa-wallet"></i><span>Kelola</span>
                </button>
            `;
        } else if (this.currentModule === 'aktivitas') {
            html = `
                <button class="b-nav-item ${this.currentTab === 'dashboard' ? 'active' : ''}" onclick="App.switchTab('dashboard')">
                    <i class="fas fa-chart-pie"></i><span>Dashboard</span>
                </button>
                <button class="b-nav-item ${this.currentTab === 'tambah' ? 'active' : ''}" onclick="App.switchTab('tambah')">
                    <i class="fas fa-plus-circle"></i><span>Aktivitas</span>
                </button>
                <button class="b-nav-item ${this.currentTab === 'riwayat' ? 'active' : ''}" onclick="App.switchTab('riwayat')">
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

    loadContent(preserveScroll = false) {
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

        if (!preserveScroll) {
            window.scrollTo(0,0);
        }
    },

    checkNotifications() {
        const notifs = Storage.get(Storage.KEYS.NOTIF);
        const unreadCount = notifs.filter(n => n.unread).length;
        UI.updateNotifBadge(unreadCount);
    }
};

const Widgets = {
    init() {
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);
        this.fetchLocationAndWeather();
    },

    updateTime() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const el = document.getElementById('sb-time');
        if (el) el.innerText = timeStr;
    },

    async fetchLocationAndWeather() {
        if (!navigator.geolocation) {
            this.updateStatus('sb-location', 'Geo tidak didukung');
            return;
        }

        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            
            // 1. Get City Name (Nominatim)
            try {
                const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
                // Coba akses langsung dulu, Nominatim kadang mengizinkan jika dari browser
                const res = await fetch(url);
                if (!res.ok) throw new Error('Direct fetch failed');
                const data = await res.json();
                
                if (data && data.address) {
                    const city = data.address.city || data.address.town || data.address.suburb || data.address.village || 'Lokasi Terdeteksi';
                    const locEl = document.getElementById('sb-location');
                    if (locEl) locEl.innerText = city;
                }
            } catch (e) {
                console.warn('Location direct fetch failed, trying proxy...', e);
                try {
                    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
                    const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
                    const json = await res.json();
                    const data = JSON.parse(json.contents);
                    
                    if (data && data.address) {
                        const city = data.address.city || data.address.town || data.address.suburb || 'Lokasi Terdeteksi';
                        const locEl = document.getElementById('sb-location');
                        if (locEl) locEl.innerText = city;
                    }
                } catch (proxyError) {
                    console.error('All location attempts failed:', proxyError);
                    const locEl = document.getElementById('sb-location');
                    if (locEl) locEl.innerText = 'Lokasi Terdeteksi';
                }
            }

            // 2. Get Weather (Open-Meteo - No Proxy Needed)
            try {
                const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
                const res = await fetch(url);
                if (!res.ok) throw new Error('Weather fetch failed');
                const data = await res.json();
                
                if (data && data.current_weather) {
                    const temp = Math.round(data.current_weather.temperature);
                    const code = data.current_weather.weathercode;
                    
                    let desc = 'Cerah';
                    if (code > 0 && code <= 3) desc = 'Berawan';
                    else if (code >= 45 && code <= 48) desc = 'Berkabut';
                    else if (code >= 51 && code <= 67) desc = 'Gerimis';
                    else if (code >= 71 && code <= 82) desc = 'Hujan';
                    else if (code >= 95) desc = 'Badai';

                    const weatherEl = document.getElementById('sb-weather');
                    if (weatherEl) weatherEl.innerText = `${temp}°C, ${desc}`;
                }
            } catch (e) {
                console.error('Weather error:', e);
                const weatherEl = document.getElementById('sb-weather');
                if (weatherEl) weatherEl.innerText = 'Gagal memuat cuaca';
            }
        }, (err) => {
            console.warn('Geolocation error:', err);
            this.updateStatus('sb-location', 'Akses lokasi ditolak');
            this.updateStatus('sb-weather', 'Izin lokasi diperlukan');
        });
    },

    updateStatus(id, text) {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    }
};

window.addEventListener('DOMContentLoaded', () => App.init());
