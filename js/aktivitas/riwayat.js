const RiwayatAktivitas = {
    showAllNotes: false,
    showAllReminders: false,
    filters: {
        search: '',
        date: '',
        month: ''
    },

    render(container) {
        container.innerHTML = `
            <div class="container slide-in">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h2>Riwayat Aktivitas</h2>
                    </div>
                </div>

                <br>

                <div class="card mb-6">
                    <div class="form-group" style="margin-bottom:12px">
                        <label style="font-size:11px; margin-bottom:4px; display:block">Cari Aktivitas</label>
                        <input type="text" id="act-filter-search" value="${this.filters.search}" placeholder="Cari judul atau isi..." oninput="RiwayatAktivitas.updateFilters()" style="padding: 10px 14px; font-size: 14px;">
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div class="form-group">
                            <label style="font-size:11px; margin-bottom:4px; display:block">Sesuai Tanggal</label>
                            <input type="date" id="act-filter-date" value="${this.filters.date}" onchange="RiwayatAktivitas.updateFilters()" style="padding: 10px 14px; font-size: 14px;">
                        </div>
                        <div class="form-group">
                            <label style="font-size:11px; margin-bottom:4px; display:block">Sesuai Bulan</label>
                            <input type="month" id="act-filter-month" value="${this.filters.month}" onchange="RiwayatAktivitas.updateFilters()" style="padding: 10px 14px; font-size: 14px;">
                        </div>
                    </div>
                    <button class="btn btn-outline" style="width:100%; margin-top:8px; padding: 10px;" onclick="RiwayatAktivitas.resetFilters()">
                        <i class="fas fa-undo mr-1"></i> Reset Filter
                    </button>
                </div>

                <div id="riwayat-content"></div>
            </div>
        `;
        this.renderTables();
    },

    updateFilters() {
        this.filters.search = document.getElementById('act-filter-search').value.toLowerCase();
        this.filters.date = document.getElementById('act-filter-date').value;
        this.filters.month = document.getElementById('act-filter-month').value;
        this.renderTables();
    },

    resetFilters() {
        this.filters = { search: '', date: '', month: '' };
        this.render(document.getElementById('appContent'));
    },

    getFilteredData() {
        let activities = Storage.get(Storage.KEYS.AKTIVITAS);
        
        if (this.filters.search) {
            activities = activities.filter(a => 
                a.title.toLowerCase().includes(this.filters.search) || 
                (a.content && a.content.toLowerCase().includes(this.filters.search))
            );
        }

        if (this.filters.date) {
            activities = activities.filter(a => a.createdAt.startsWith(this.filters.date));
        }

        if (this.filters.month) {
            activities = activities.filter(a => a.createdAt.startsWith(this.filters.month));
        }

        return activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    renderTables() {
        const container = document.getElementById('riwayat-content');
        if (!container) return;

        const activities = this.getFilteredData();
        
        const notes = activities.filter(a => a.category === 'notes');
        const reminders = activities.filter(a => a.category === 'reminders');

        if (activities.length === 0) {
            container.innerHTML = `<div class="card text-center py-12" style="background: none; border: 1px dashed var(--border);"><p class="text-muted">Tidak ada aktivitas yang sesuai filter.</p></div>`;
            return;
        }

        container.innerHTML = `
            <div class="card mb-6" style="padding: 20px;">
                <div class="flex justify-between items-center mb-4">
                    <h3 style="font-size: 16px; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-file-pen text-accent"></i> Tabel Catatan
                    </h3>
                    ${notes.length > 3 ? `<button class="btn-text" onclick="RiwayatAktivitas.toggleNotes()" style="font-size: 12px; color: var(--accent); background: none; border: none; cursor: pointer; font-weight: 700;">${this.showAllNotes ? 'Sembunyikan' : 'Lihat Semua'}</button>` : ''}
                </div>
                <div class="table-responsive">
                    ${this.renderNotesTable(notes)}
                </div>
            </div>

            <div class="card mb-6" style="padding: 20px;">
                <div class="flex justify-between items-center mb-4">
                    <h3 style="font-size: 16px; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-bell text-warning"></i> Tabel Pengingat
                    </h3>
                    ${reminders.length > 3 ? `<button class="btn-text" onclick="RiwayatAktivitas.toggleReminders()" style="font-size: 12px; color: var(--accent); background: none; border: none; cursor: pointer; font-weight: 700;">${this.showAllReminders ? 'Sembunyikan' : 'Lihat Semua'}</button>` : ''}
                </div>
                <div class="table-responsive">
                    ${this.renderRemindersTable(reminders)}
                </div>
            </div>
        `;
    },

    toggleNotes() {
        this.showAllNotes = !this.showAllNotes;
        this.renderTables();
    },

    toggleReminders() {
        this.showAllReminders = !this.showAllReminders;
        this.renderTables();
    },

    renderNotesTable(data) {
        if (data.length === 0) return '<p class="text-center py-4 text-muted" style="font-size: 13px;">Belum ada catatan.</p>';
        
        const displayData = this.showAllNotes ? data : data.slice(0, 3);
        
        return `
            <table>
                <thead>
                    <tr>
                        <th style="width: 50%">Judul & Konten</th>
                        <th style="width: 30%">Tanggal</th>
                        <th style="width: 20%; text-align: right;">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    ${displayData.map(a => `
                        <tr onclick="RiwayatAktivitas.viewDetail('${a.id}')" style="cursor: pointer;">
                            <td>
                                <div style="font-weight: 700; color: var(--primary); font-size: 13px;">${a.title}</div>
                                <div style="font-size: 11px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;">${a.content || '-'}</div>
                            </td>
                            <td style="font-size: 11px; color: var(--text-muted);">${Format.date(a.createdAt.split('T')[0])}</td>
                            <td style="text-align: right;" onclick="event.stopPropagation()">
                                <div class="flex justify-end gap-3">
                                    <button onclick="TambahAktivitas.edit('${a.id}')" style="background:none; border:none; color:var(--accent); cursor:pointer;"><i class="fas fa-edit"></i></button>
                                    <button onclick="RiwayatAktivitas.delete('${a.id}')" style="background:none; border:none; color:var(--danger); cursor:pointer;"><i class="fas fa-trash-alt"></i></button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    viewDetail(id) {
        const activities = Storage.get(Storage.KEYS.AKTIVITAS);
        const act = activities.find(a => a.id === id);
        if (!act) return;

        Swal.fire({
            title: act.title,
            html: `
                <div style="text-align: left; padding: 10px;">
                    <div style="margin-bottom: 20px; font-size: 14px; line-height: 1.6; color: var(--text); border-left: 4px solid var(--accent); padding-left: 15px; background: #f8fafc; padding: 15px; border-radius: 8px;">
                        ${act.content || '<em>Tidak ada deskripsi.</em>'}
                    </div>
                    <div style="font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-clock"></i> 
                        Dibuat pada: ${Format.date(act.createdAt.split('T')[0])} ${act.createdAt.split('T')[1].substring(0, 5)}
                    </div>
                </div>
            `,
            showCloseButton: true,
            confirmButtonText: 'Tutup',
            confirmButtonColor: 'var(--primary)',
            customClass: {
                container: 'detail-modal'
            }
        });
    },

    renderRemindersTable(data) {
        if (data.length === 0) return '<p class="text-center py-4 text-muted" style="font-size: 13px;">Belum ada pengingat.</p>';
        
        const displayData = this.showAllReminders ? data : data.slice(0, 3);
        
        return `
            <table>
                <thead>
                    <tr>
                        <th style="width: 40%">Aktivitas</th>
                        <th style="width: 40%">Waktu Pengingat</th>
                        <th style="width: 20%; text-align: right;">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    ${displayData.map(a => {
                        const hasDate = a.datetime && a.datetime.includes('T');
                        return `
                            <tr>
                                <td><div style="font-weight: 700; color: var(--primary); font-size: 13px;">${a.title}</div></td>
                                <td style="font-size: 11px; color: var(--warning); font-weight: 600;">
                                    ${hasDate ? Format.date(a.datetime.split('T')[0]) + ' ' + a.datetime.split('T')[1] : '-'}
                                </td>
                                <td style="text-align: right;">
                                    <div class="flex justify-end gap-3">
                                        <button onclick="TambahAktivitas.edit('${a.id}')" style="background:none; border:none; color:var(--accent); cursor:pointer;"><i class="fas fa-edit"></i></button>
                                        <button onclick="RiwayatAktivitas.delete('${a.id}')" style="background:none; border:none; color:var(--danger); cursor:pointer;"><i class="fas fa-trash-alt"></i></button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    },

    delete(id) {
        Swal.fire({
            title: 'Hapus Data?',
            text: "Data akan dihapus secara permanen.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: 'var(--primary)',
            cancelButtonColor: 'var(--danger)',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                let activities = Storage.get(Storage.KEYS.AKTIVITAS);
                const act = activities.find(a => a.id === id);
                activities = activities.filter(a => a.id !== id);
                Storage.set(Storage.KEYS.AKTIVITAS, activities);
                
                Storage.addNotif('Data Dihapus', `"${act ? act.title : ''}" telah dihapus.`);
                UI.showToast('Data berhasil dihapus');
                this.renderTables();
            }
        });
    }
};
