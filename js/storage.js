const Storage = {
    KEYS: {
        TRANSAKSI: 'dk_transaksi',
        SUMBER: 'dk_sumber',
        KATEGORI: 'dk_kategori',
        DOMPET: 'dk_dompet',
        TABUNGAN: 'dk_tabungan',
        TABUNGAN_LOG: 'dk_tabungan_log',
        NOTIF: 'dk_notif',
        THEME: 'dk_theme',
        USER: 'dk_user'
    },

    get(key) {
        const data = localStorage.getItem(key);
        if (key === this.KEYS.USER) {
            return data ? JSON.parse(data) : { name: 'Pengguna Setia', role: 'Pro Member' };
        }
        return data ? JSON.parse(data) : [];
    },

    set(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },

    saveTheme(theme) {
        localStorage.setItem(this.KEYS.THEME, theme);
    },

    getTheme() {
        return localStorage.getItem(this.KEYS.THEME) || 'light';
    },

    addNotif(title, desc) {
        const notifs = this.get(this.KEYS.NOTIF);
        notifs.unshift({
            id: Date.now(),
            title,
            desc,
            date: new Date().toISOString(),
            unread: true
        });
        this.set(this.KEYS.NOTIF, notifs.slice(0, 20)); // Keep last 20
        if (typeof App !== 'undefined') App.checkNotifications();
    }
};

// Initial Data if empty
if (Storage.get(Storage.KEYS.SUMBER).length === 0) {
    Storage.set(Storage.KEYS.SUMBER, [
        { id: 'S1', name: 'Gaji' },
        { id: 'S2', name: 'Freelance' }
    ]);
}

if (Storage.get(Storage.KEYS.DOMPET).length === 0) {
    Storage.set(Storage.KEYS.DOMPET, [
        { id: 'W1', name: 'Tunai / Cash', icon: 'fa-money-bill-wave' },
        { id: 'W2', name: 'Dana', icon: 'fa-wallet' },
        { id: 'W3', name: 'Gopay', icon: 'fa-mobile-screen' }
    ]);
}

