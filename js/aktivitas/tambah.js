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
                        <div class="tab-group mb-4">
                            <button type="button" class="tab-btn active" id="btn-tab-notes" onclick="TambahAktivitas.setCategory('notes')">
                                <i class="fas fa-sticky-note mr-2"></i> Catatan
                            </button>
                            <button type="button" class="tab-btn" id="btn-tab-reminders" onclick="TambahAktivitas.setCategory('reminders')">
                                <i class="fas fa-bell mr-2"></i> Pengingat
                            </button>
                        </div>

                        <div class="form-group">
                            <label id="label-title">Judul Catatan</label>
                            <input type="text" id="act-title" required placeholder="Contoh: Beli susu atau Meeting project">
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

                        <button type="submit" class="btn btn-primary" style="width:100%">
                            <i class="fas fa-save mr-2"></i> Simpan Aktivitas
                        </button>
                    </form>
                </div>
            </div>
        `;
    },

    setCategory(cat) {
        this.currentCategory = cat;
        document.getElementById('btn-tab-notes').classList.toggle('active', cat === 'notes');
        document.getElementById('btn-tab-reminders').classList.toggle('active', cat === 'reminders');
        
        document.getElementById('group-notes').classList.toggle('hidden', cat === 'reminders');
        document.getElementById('group-reminders').classList.toggle('hidden', cat === 'notes');
        
        document.getElementById('label-title').innerText = cat === 'notes' ? 'Judul Catatan' : 'Judul Pengingat';
        
        if (cat === 'reminders') {
            document.getElementById('act-datetime').required = true;
            document.getElementById('act-content').required = false;
        } else {
            document.getElementById('act-datetime').required = false;
            document.getElementById('act-content').required = true;
        }
    },

    save(e) {
        e.preventDefault();
        
        const title = document.getElementById('act-title').value;
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
            Storage.addNotif('Aktivitas Diperbarui', `Aktivitas "${title}" telah diubah.`);
        } else {
            activities.push(actData);
            Storage.addNotif('Aktivitas Baru', `Aktivitas "${title}" berhasil ditambahkan.`);
        }
        
        Storage.set(Storage.KEYS.AKTIVITAS, activities);

        // If it's a reminder, we might want to request notification permission
        if (this.currentCategory === 'reminders') {
            this.requestNotificationPermission();
        }

        Swal.fire({
            title: 'Berhasil!',
            text: 'Aktivitas baru telah ditambahkan.',
            icon: 'success',
            confirmButtonColor: 'var(--primary)',
        });

        App.switchTab('riwayat');
    },

    requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.log('Browser tidak mendukung notifikasi');
            return;
        }

        if (Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
    },

    edit(id) {
        const activities = Storage.get(Storage.KEYS.AKTIVITAS);
        const act = activities.find(a => a.id === id);
        if (!act) return;

        App.switchTab('tambah');
        
        // Fill the form
        this.editingId = act.id;
        document.getElementById('act-title').value = act.title;
        this.setCategory(act.category);
        
        if (act.category === 'notes') {
            document.getElementById('act-content').value = act.content;
        } else {
            document.getElementById('act-datetime').value = act.datetime;
        }

        document.querySelector('h2').innerText = 'Edit Aktivitas';
        document.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-save mr-2"></i> Perbarui Aktivitas';
    }
};
