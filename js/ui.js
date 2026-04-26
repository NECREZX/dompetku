const UI = {
    showModal(title, bodyHTML) {
        document.getElementById('modalTitle').innerText = title;
        document.getElementById('modalBody').innerHTML = bodyHTML;
        document.getElementById('modalContainer').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    },

    hideModal() {
        document.getElementById('modalContainer').classList.add('hidden');
        document.body.style.overflow = 'auto';
    },

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        document.getElementById('toastContainer').appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }, 100);
    },

    showNotifications() {
        const notifs = Storage.get(Storage.KEYS.NOTIF).reverse();
        const html = `
            <div class="flex justify-between items-center mb-4">
                <p style="font-size:12px; color:var(--text-muted)">Riwayat aktivitas sistem.</p>
                <div class="flex gap-2">
                    <button class="btn btn-outline" style="width:auto; padding:4px 12px; font-size:11px" onclick="UI.markAllAsRead()">Tandai Dibaca</button>
                    <button class="btn btn-outline" style="width:auto; padding:4px 12px; font-size:11px" onclick="UI.clearNotifications()">Hapus Semua</button>
                </div>
            </div>
            <br>
            <div style="max-height: 400px; overflow-y: auto; padding-right: 4px;">
                ${notifs.length === 0 
                    ? '<div class="text-center py-12"><i class="fas fa-bell-slash mb-2" style="font-size:32px; color:var(--border)"></i><p>Belum ada notifikasi.</p></div>'
                    : notifs.map(n => {
                        let icon = 'fa-info-circle';
                        let iconColor = 'var(--accent)';
                        if (n.title.includes('Pengeluaran')) { icon = 'fa-arrow-up'; iconColor = 'var(--danger)'; }
                        else if (n.title.includes('Pemasukan')) { icon = 'fa-arrow-down'; iconColor = 'var(--success)'; }
                        else if (n.title.includes('Tabungan')) { icon = 'fa-piggy-bank'; iconColor = 'var(--accent)'; }
                        else if (n.title.includes('Data')) { icon = 'fa-database'; iconColor = 'var(--warning)'; }

                        return `
                        <div class="card" style="margin-bottom: 12px; padding: 12px; border: 1px solid var(--border); background: var(--background);">
                            <div class="flex items-start gap-3">
                                <div style="background: var(--surface); width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: var(--shadow);">
                                    <i class="fas ${icon}" style="font-size: 14px; color: ${iconColor}"></i>
                                </div>
                                <div style="flex:1">
                                    <div style="font-weight:800; font-size:13px; color: var(--primary)">${n.title}</div>
                                    <p style="font-size:12px; color:var(--text-muted); margin: 2px 0;">${n.desc}</p>
                                    <div style="font-size:10px; color:var(--text-muted); font-weight: 700;">${Format.date(n.date)}</div>
                                </div>
                            </div>
                        </div>
                    `}).join('')}
            </div>
        `;
        this.showModal('Notifikasi', html);
    },

    clearNotifications() {
        Swal.fire({
            title: 'Hapus Notifikasi?',
            text: "Semua riwayat aktivitas akan dihapus permanen.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: 'var(--primary)',
            cancelButtonColor: 'var(--danger)',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                Storage.set(Storage.KEYS.NOTIF, []);
                this.hideModal();
                this.updateNotifBadge(0);
                UI.showToast('Notifikasi dihapus');
            }
        });
    },

    markAllAsRead() {
        const notifs = Storage.get(Storage.KEYS.NOTIF).map(n => ({ ...n, unread: false }));
        Storage.set(Storage.KEYS.NOTIF, notifs);
        this.updateNotifBadge(0);
        this.showNotifications(); // Refresh modal
    },

    updateNotifBadge(count) {
        const badge = document.getElementById('notifBadge');
        if (count > 0) {
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    },

    updateProfileUI() {
        const user = Storage.get(Storage.KEYS.USER);
        const nameElements = document.querySelectorAll('.user-name');
        const roleElements = document.querySelectorAll('.user-rank');
        const avatarElements = document.querySelectorAll('.user-profile img');

        nameElements.forEach(el => el.innerText = user.name);
        roleElements.forEach(el => el.innerText = user.role || 'Pro Member');
        avatarElements.forEach(el => {
            el.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=fff`;
        });
    },

    showProfileEdit() {
        const user = Storage.get(Storage.KEYS.USER);
        this.showModal('Edit Profil', `
            <form onsubmit="UI.saveProfile(event)">
                <div class="form-group">
                    <label>Nama Anda</label>
                    <input type="text" id="user-name-input" value="${user.name}" required placeholder="Masukkan nama...">
                </div>
                <div class="form-group">
                    <label>Status/Pekerjaan</label>
                    <input type="text" id="user-role-input" value="${user.role || ''}" placeholder="Contoh: Freelancer">
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%">Simpan Perubahan</button>
            </form>
        `);
    },

    saveProfile(e) {
        e.preventDefault();
        const name = document.getElementById('user-name-input').value;
        const role = document.getElementById('user-role-input').value;

        Storage.set(Storage.KEYS.USER, { name, role });
        this.updateProfileUI();
        this.hideModal();
        
        Swal.fire({
            title: 'Profil Diperbarui',
            text: 'Nama Anda telah berhasil diubah.',
            icon: 'success',
            confirmButtonColor: 'var(--primary)'
        });
    }
};

document.getElementById('notifBtn').addEventListener('click', () => UI.showNotifications());


// Toast CSS
const style = document.createElement('style');
style.textContent = `
.toast-container { position: fixed; top: 100px; left: 50%; transform: translateX(-50%); z-index: 9999; width: 90%; max-width: 400px; pointer-events: none; }
.toast { background: var(--surface); color: var(--text); padding: 16px 20px; border-radius: 16px; margin-bottom: 12px; box-shadow: var(--shadow-lg); border-left: 6px solid var(--accent); transform: translateY(-20px); opacity: 0; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); pointer-events: auto; }
.toast.show { transform: translateY(0); opacity: 1; }
.toast-success { border-left-color: var(--success); }
.toast-error { border-left-color: var(--danger); }
.toast-content { display: flex; align-items: center; gap: 12px; font-weight: 700; font-size: 14px; }
`;
document.head.appendChild(style);

// Global Close Modal Listener
document.addEventListener('click', (e) => {
    if (e.target.closest('.close-modal') || e.target.id === 'modalContainer') {
        UI.hideModal();
    }
});

