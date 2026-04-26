const SumberKategori = {
    activeTab: 'dompet',

    render(container) {
        container.innerHTML = `
            <div class="container slide-in">
                <div class="flex justify-between items-center mb-6">
                    <h2>Kategori Dompet</h2>
                    <button class="btn btn-primary" style="width: auto; padding: 10px 20px" onclick="SumberKategori.showAddModal()">
                        <i class="fas fa-plus"></i> Tambah
                    </button>
                </div>
                <br>
                <div class="sub-nav">
                    <button class="tab-btn ${this.activeTab === 'dompet' ? 'active' : ''}" onclick="SumberKategori.switchTab('dompet')">Dompet</button>
                    <button class="tab-btn ${this.activeTab === 'kategori' ? 'active' : ''}" onclick="SumberKategori.switchTab('kategori')">Kategori</button>
                    <button class="tab-btn ${this.activeTab === 'sumber' ? 'active' : ''}" onclick="SumberKategori.switchTab('sumber')">Sumber</button>
                </div>

                <div id="sk-list"></div>
            </div>
        `;
        this.renderList();
    },

    switchTab(tab) {
        this.activeTab = tab;
        this.render(document.getElementById('appContent'));
    },

    renderList() {
        const list = document.getElementById('sk-list');
        let key = Storage.KEYS.DOMPET;
        if (this.activeTab === 'sumber') key = Storage.KEYS.SUMBER;
        if (this.activeTab === 'kategori') key = Storage.KEYS.KATEGORI;
        
        const data = Storage.get(key);
        
        if (data.length === 0) {
            list.innerHTML = `<div class="text-center py-8"><p>Belum ada data.</p></div>`;
            return;
        }

        list.innerHTML = `
            <div class="card" style="padding: 0; overflow: hidden;">
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Nama</th>
                                <th style="width:100px; text-align:right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.map(item => `
                                <tr>
                                    <td style="font-weight:700">
                                        ${this.activeTab === 'dompet' ? `<i class="fas ${item.icon || 'fa-wallet'} mr-2" style="color:var(--accent)"></i>` : ''}
                                        ${item.name}
                                    </td>
                                    <td style="text-align:right">
                                        <div class="flex gap-2 justify-end">
                                            <button class="nav-btn" style="width:32px; height:32px; background:var(--background)" onclick="SumberKategori.showAddModal('${item.id}')">
                                                <i class="fas fa-edit" style="color:var(--accent)"></i>
                                            </button>
                                            <button class="nav-btn" style="width:32px; height:32px; background:var(--background)" onclick="SumberKategori.deleteItem('${item.id}')">
                                                <i class="fas fa-trash" style="color:var(--danger)"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    showAddModal(id = null) {
        let key = Storage.KEYS.DOMPET;
        if (this.activeTab === 'sumber') key = Storage.KEYS.SUMBER;
        if (this.activeTab === 'kategori') key = Storage.KEYS.KATEGORI;

        const items = Storage.get(key);
        const item = id ? items.find(i => i.id === id) : null;

        let title = id ? 'Ubah' : 'Tambah';
        if (this.activeTab === 'dompet') title += ' Dompet';
        else if (this.activeTab === 'sumber') title += ' Sumber';
        else title += ' Kategori';

        UI.showModal(title, `
            <form onsubmit="SumberKategori.saveItem(event, ${id ? `'${id}'` : 'null'})">
                <div class="form-group">
                    <label>Nama</label>
                    <input type="text" id="sk-name" value="${item ? item.name : ''}" required placeholder="Masukkan nama...">
                </div>
                ${this.activeTab === 'dompet' ? `
                <div class="form-group">
                    <label>Ikon FontAwesome (fa-...)</label>
                    <input type="text" id="sk-icon" value="${item && item.icon ? item.icon : 'fa-wallet'}" placeholder="fa-wallet">
                </div>
                ` : ''}
                <button type="submit" class="btn btn-primary" style="width:100%">${id ? 'Update' : 'Simpan'}</button>
            </form>
        `);
    },

    saveItem(e, id = null) {
        e.preventDefault();
        const name = document.getElementById('sk-name').value;
        const iconInput = document.getElementById('sk-icon');
        const icon = iconInput ? (iconInput.value || 'fa-wallet') : null;
        
        let key = Storage.KEYS.DOMPET;
        if (this.activeTab === 'sumber') key = Storage.KEYS.SUMBER;
        if (this.activeTab === 'kategori') key = Storage.KEYS.KATEGORI;

        let items = Storage.get(key);
        
        if (id) {
            items = items.map(i => {
                if (i.id === id) {
                    const updated = { ...i, name };
                    if (icon) updated.icon = icon;
                    return updated;
                }
                return i;
            });
        } else {
            const newItem = { id: Date.now().toString(), name };
            if (icon) newItem.icon = icon;
            items.push(newItem);
            Storage.addNotif('Data Diperbarui', `Berhasil menambahkan ${name} ke daftar ${this.activeTab}`);
        }

        Storage.set(key, items);
        UI.hideModal();
        
        Swal.fire({
            title: 'Berhasil',
            text: `${name} telah ${id ? 'diperbarui' : 'ditambahkan'}.`,
            icon: 'success',
            confirmButtonColor: 'var(--primary)',
        });
        
        this.renderList();
    },

    deleteItem(id) {
        Swal.fire({
            title: 'Hapus Data?',
            text: `Hapus ${this.activeTab} ini secara permanen?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: 'var(--primary)',
            cancelButtonColor: 'var(--danger)',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                let key = Storage.KEYS.DOMPET;
                if (this.activeTab === 'sumber') key = Storage.KEYS.SUMBER;
                if (this.activeTab === 'kategori') key = Storage.KEYS.KATEGORI;

                let items = Storage.get(key);
                items = items.filter(i => i.id !== id);
                Storage.set(key, items);
                UI.showToast('Data berhasil dihapus');
                this.renderList();
            }
        });
    }
};
