const TambahAktivitas = {
    currentCategory: 'notes',
    editingId: null,

    render(container) {
        this.currentCategory = 'notes';
        this.editingId = null;
        
        container.innerHTML = `
            <div class="container slide-in">
                <div class="flex justify-between items-center mb-6">
                    <h2>Tambah Aktivitas</h2>
                </div>
                <br>
                <div class="card">
                    <form onsubmit="TambahAktivitas.save(event)">
                        <div class="tab-group mb-4" style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 5px;">
                            <button type="button" class="tab-btn active" id="btn-tab-notes" onclick="TambahAktivitas.setCategory('notes')" style="flex: 1; white-space: nowrap;">
                                <i class="fas fa-sticky-note mr-2"></i> Catatan
                            </button>
                            <button type="button" class="tab-btn" id="btn-tab-reminders" onclick="TambahAktivitas.setCategory('reminders')" style="flex: 1; white-space: nowrap;">
                                <i class="fas fa-bell mr-2"></i> Pengingat
                            </button>
                            <button type="button" class="tab-btn" id="btn-tab-wishlist" onclick="TambahAktivitas.setCategory('wishlist')" style="flex: 1; white-space: nowrap;">
                                <i class="fas fa-heart mr-2"></i> Wishlist
                            </button>
                        </div>

                        <div class="form-group">
                            <label id="label-title">Judul Catatan</label>
                            <input type="text" id="act-title" required placeholder="Contoh: Beli susu atau Laptop Baru">
                        </div>

                        <div id="group-notes" class="form-group">
                            <label>Isi Catatan</label>
                            <textarea id="act-content" rows="5" placeholder="Tulis detailnya di sini..."></textarea>
                        </div>

                        <div id="group-reminders" class="hidden">
                            <div class="form-group">
                                <label>Waktu Pengingat</label>
                                <input type="datetime-local" id="act-datetime">
                            </div>
                        </div>

                        <div id="group-wishlist" class="hidden">
                            <div class="form-group">
                                <label>Bulan Target</label>
                                <input type="month" id="wish-month">
                            </div>
                        </div>

                        <button type="submit" class="btn btn-primary" style="width:100%; margin-top: 10px;">
                            <i class="fas fa-save mr-2"></i> Simpan Data
                        </button>
                    </form>
                </div>
            </div>
        `;

        // Set default month for wishlist
        document.getElementById('wish-month').value = new Date().toISOString().substring(0, 7);
    },

    setCategory(cat) {
        this.currentCategory = cat;
        document.getElementById('btn-tab-notes').classList.toggle('active', cat === 'notes');
        document.getElementById('btn-tab-reminders').classList.toggle('active', cat === 'reminders');
        document.getElementById('btn-tab-wishlist').classList.toggle('active', cat === 'wishlist');
        
        document.getElementById('group-notes').classList.toggle('hidden', cat !== 'notes');
        document.getElementById('group-reminders').classList.toggle('hidden', cat !== 'reminders');
        document.getElementById('group-wishlist').classList.toggle('hidden', cat !== 'wishlist');
        
        const labels = {
            notes: 'Judul Catatan',
            reminders: 'Judul Pengingat',
            wishlist: 'Keterangan Impian'
        };
        document.getElementById('label-title').innerText = labels[cat];
        
        // Validation logic
        document.getElementById('act-datetime').required = (cat === 'reminders');
        document.getElementById('act-content').required = (cat === 'notes');
        document.getElementById('wish-month').required = (cat === 'wishlist');
    },

    save(e) {
        e.preventDefault();
        
        const title = document.getElementById('act-title').value;
        
        if (this.currentCategory === 'wishlist') {
            this.saveWishlist(title);
            return;
        }

        const content = document.getElementById('act-content').value;
        const datetime = document.getElementById('act-datetime').value;
        const activities = Storage.get(Storage.KEYS.AKTIVITAS);
        
        const actData = {
            id: this.editingId || Date.now().toString(),
            category: this.currentCategory,
            title,
            content: this.currentCategory === 'notes' ? content : '',
            datetime: this.currentCategory === 'reminders' ? datetime : null,
            createdAt: new Date().toISOString(),
            status: 'active'
        };

        if (this.editingId) {
            const index = activities.findIndex(a => a.id === this.editingId);
            if (index !== -1) activities[index] = actData;
            Storage.addNotif('Aktivitas Diperbarui', `"${title}" telah diubah.`);
        } else {
            activities.push(actData);
            Storage.addNotif('Aktivitas Baru', `"${title}" berhasil ditambahkan.`);
        }
        
        Storage.set(Storage.KEYS.AKTIVITAS, activities);
        if (this.currentCategory === 'reminders') this.requestNotificationPermission();

        this.showSuccess();
    },

    saveWishlist(title) {
        const month = document.getElementById('wish-month').value;
        const wishlist = Storage.get(Storage.KEYS.WISHLIST);

        const wishData = {
            id: this.editingId || Date.now().toString(),
            title,
            price: 0, // Harga dikosongkan sesuai permintaan
            month,
            achieved: false,
            createdAt: new Date().toISOString()
        };

        if (this.editingId) {
            const index = wishlist.findIndex(w => w.id === this.editingId);
            if (index !== -1) wishlist[index] = wishData;
            Storage.addNotif('Wishlist Diperbarui', `"${title}" telah diubah.`);
        } else {
            wishlist.push(wishData);
            Storage.addNotif('Wishlist Baru', `"${title}" masuk daftar impian.`);
        }

        Storage.set(Storage.KEYS.WISHLIST, wishlist);
        this.showSuccess();
    },

    showSuccess() {
        Swal.fire({
            title: 'Berhasil!',
            text: 'Data telah disimpan.',
            icon: 'success',
            confirmButtonColor: 'var(--primary)',
        });
        App.switchTab('riwayat');
    },

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
    },

    edit(id, type = 'activity') {
        if (type === 'wishlist') {
            const wishlist = Storage.get(Storage.KEYS.WISHLIST);
            const item = wishlist.find(w => w.id === id);
            if (!item) return;

            App.switchTab('tambah');
            this.editingId = item.id;
            this.setCategory('wishlist');
            document.getElementById('act-title').value = item.title;
            document.getElementById('wish-month').value = item.month;
        } else {
            const activities = Storage.get(Storage.KEYS.AKTIVITAS);
            const act = activities.find(a => a.id === id);
            if (!act) return;

            App.switchTab('tambah');
            this.editingId = act.id;
            this.setCategory(act.category);
            document.getElementById('act-title').value = act.title;
            if (act.category === 'notes') document.getElementById('act-content').value = act.content;
            else document.getElementById('act-datetime').value = act.datetime;
        }

        document.querySelector('h2').innerText = 'Edit Data';
        document.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-save mr-2"></i> Perbarui Data';
    }
};
