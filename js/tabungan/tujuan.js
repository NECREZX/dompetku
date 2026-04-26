const DashboardTabungan = {
    render(container) {
        const data = this.calculateData();
        container.innerHTML = `
            <div class="container slide-in">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h2 style="font-size:24px">Dashboard Tabungan</h2>
                        
                    </div>
                </div>
                
                <div class="card balance-card" style="background: linear-gradient(135deg, var(--primary), var(--accent)); color: white; border: none; margin-bottom: 24px;">
                    <div class="card-title" style="color: rgba(255,255,255,0.7)">Total Dana Terkumpul</div>
                    <div class="card-value" style="color: white; font-size: 32px;">${Format.rupiah(data.totalCollected)}</div>
                </div>

                <div class="flex gap-4 mb-8">
                    <div class="card" style="flex:1; margin-bottom:0; padding: 20px; border: 1px solid var(--border);">
                        <div class="card-title">Target Total</div>
                        <div class="card-value" style="font-size:18px">${Format.rupiah(data.totalTarget)}</div>
                    </div>

                    <div class="card" style="flex:1; margin-bottom:0; padding: 20px;">
                        <div class="card-title">Progress</div>
                        <div class="card-value" style="font-size:18px; color: var(--accent)">${data.overallProgress}%</div>
                    </div>
                </div>

                <br>

                <div id="goal-progress-list"></div>
            </div>
        `;
        this.renderGoalList(data.goals);
    },

    calculateData() {
        const goals = Storage.get(Storage.KEYS.TABUNGAN);
        let totalCollected = 0;
        let totalTarget = 0;
        
        goals.forEach(g => {
            totalCollected += Number(g.collected);
            totalTarget += Number(g.target);
        });

        const overallProgress = totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 0;

        return {
            totalCollected,
            totalTarget,
            overallProgress,
            goals
        };
    },

    renderGoalList(goals) {
        const list = document.getElementById('goal-progress-list');
        if (goals.length === 0) {
            list.innerHTML = `<p class="text-center py-8">Belum ada tujuan tabungan.</p>`;
            return;
        }

        list.innerHTML = goals.map(g => {
            const progress = Math.min(Math.round((g.collected / g.target) * 100), 100);
            return `
                <div class="card" style="padding: 20px; border: 1px solid var(--border);">
                    <div class="flex justify-between items-center mb-4">
                        <div>
                            <div style="font-weight:800; font-size:16px; color: var(--primary)">${g.name}</div>
                            <div style="font-size:12px; color:var(--text-muted); font-weight: 600;">${Format.rupiah(g.collected)} / ${Format.rupiah(g.target)}</div>
                        </div>
                        <div style="font-weight:800; color:var(--accent); font-size: 18px;">${progress}%</div>
                    </div>
                    <div class="progress-container" style="height: 8px; border-radius: 4px;">
                        <div class="progress-bar" style="width: ${progress}%; background: var(--accent); border-radius: 4px;"></div>
                    </div>
                </div>
            `;
        }).join('');
    }
};

const TujuanTabungan = {
    render(container) {
        container.innerHTML = `
            <div class="container slide-in">
                <div class="flex justify-between items-center mb-6">
                    <h2>Daftar Target</h2>
                    <button class="btn btn-primary" style="width:auto; padding: 10px 20px" onclick="TujuanTabungan.showAddModal()">
                        <i class="fas fa-plus"></i> Tambah
                    </button>
                </div>

                <br>
                <div id="tujuan-list"></div>
            </div>
        `;
        this.renderList();
    },

    showAddModal(id = null) {
        const goal = id ? Storage.get(Storage.KEYS.TABUNGAN).find(g => g.id === id) : null;

        UI.showModal(id ? 'Ubah Tujuan' : 'Buat Tujuan Baru', `
            <form onsubmit="TujuanTabungan.save(event, ${id ? `'${id}'` : 'null'})">
                <div class="form-group">
                    <label>Nama Tujuan</label>
                    <input type="text" id="goal-name" value="${goal ? goal.name : ''}" required placeholder="Contoh: Beli Laptop">
                </div>
                <div class="flex gap-2">
                    <div class="form-group" style="flex:1">
                        <label>Target (Rp)</label>
                        <input type="number" id="goal-target" value="${goal ? goal.target : ''}" required placeholder="0">
                    </div>
                    ${!id ? `
                    <div class="form-group" style="flex:1">
                        <label>Saldo Awal (Rp)</label>
                        <input type="number" id="goal-initial" value="0">
                    </div>
                    ` : ''}
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%">${id ? 'Update' : 'Simpan'}</button>
            </form>
        `);
    },

    save(e, id = null) {
        e.preventDefault();
        let goals = Storage.get(Storage.KEYS.TABUNGAN);
        const name = document.getElementById('goal-name').value;
        const target = Number(document.getElementById('goal-target').value);
        
        if (id) {
            goals = goals.map(g => g.id === id ? { ...g, name, target } : g);
        } else {
            const initial = Number(document.getElementById('goal-initial').value);
            const newGoal = {
                id: Date.now().toString(),
                name,
                target,
                collected: initial,
                status: 'aktif'
            };
            goals.push(newGoal);

            if (initial > 0) {
                const logs = Storage.get(Storage.KEYS.TABUNGAN_LOG);
                logs.push({
                    id: Date.now().toString() + '_init',
                    goalId: newGoal.id,
                    amount: initial,
                    date: new Date().toISOString().split('T')[0],
                    type: 'setor',
                    note: 'Saldo awal'
                });
                Storage.set(Storage.KEYS.TABUNGAN_LOG, logs);
            }
            Storage.addNotif('Tujuan Dibuat', `Target baru: ${name} senilai ${Format.rupiah(target)}`);
        }

        Storage.set(Storage.KEYS.TABUNGAN, goals);
        UI.hideModal();
        
        Swal.fire({
            title: 'Tujuan Disimpan',
            text: `Target ${name} berhasil ${id ? 'diperbarui' : 'dibuat'}.`,
            icon: 'success',
            confirmButtonColor: 'var(--primary)',
        });

        this.render(document.getElementById('appContent'));
    },

    renderList() {
        const list = document.getElementById('tujuan-list');
        const goals = Storage.get(Storage.KEYS.TABUNGAN);
        
        if (goals.length === 0) {
            list.innerHTML = `<div class="text-center py-12"><i class="fas fa-piggy-bank mb-4" style="font-size:48px; color:var(--border)"></i><p>Belum ada tujuan.</p></div>`;
            return;
        }

        list.innerHTML = goals.map(g => {
            const progress = Math.min(Math.round((g.collected / g.target) * 100), 100);
            return `
                <div class="card" style="margin-bottom: 20px; padding: 24px; border: 1px solid var(--border);">
                    <div class="flex justify-between items-start mb-6">
                        <div>
                            <div style="font-weight:800; font-size:18px; color: var(--primary)">${g.name}</div>
                            <div style="font-size:13px; font-weight:700; color: var(--text-muted)">${Format.rupiah(g.collected)} / ${Format.rupiah(g.target)}</div>
                        </div>
                        <div class="flex gap-2">
                             <button class="nav-btn" style="width:36px; height:36px; background:var(--background)" onclick="TujuanTabungan.showAddModal('${g.id}')">
                                <i class="fas fa-edit" style="color:var(--accent)"></i>
                            </button>
                            <button class="nav-btn" style="width:36px; height:36px; background:var(--background)" onclick="TujuanTabungan.delete('${g.id}')">
                                <i class="fas fa-trash" style="color:var(--danger)"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="flex justify-between mb-3">
                        <span style="font-size:14px; font-weight:800; color:var(--accent)">${progress}%</span>
                    </div>
                    <div class="progress-container" style="height: 10px; border-radius: 5px;">
                        <div class="progress-bar" style="width: ${progress}%; background: var(--accent); border-radius: 5px;"></div>
                    </div>

                    <div class="flex gap-3 mt-6">
                        <button class="btn btn-primary" style="flex:1" onclick="KelolaTabungan.showActionModal('${g.id}', 'setor')">Setor</button>
                        <button class="btn btn-danger" style="flex:1"  onclick="KelolaTabungan.showActionModal('${g.id}', 'tarik')">Tarik</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    delete(id) {
        Swal.fire({
            title: 'Hapus Tujuan?',
            text: "Seluruh data progres dan riwayat tabungan untuk tujuan ini akan dihapus.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: 'var(--primary)',
            cancelButtonColor: 'var(--danger)',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                let goals = Storage.get(Storage.KEYS.TABUNGAN);
                goals = goals.filter(g => g.id !== id);
                Storage.set(Storage.KEYS.TABUNGAN, goals);

                let logs = Storage.get(Storage.KEYS.TABUNGAN_LOG);
                logs = logs.filter(l => l.goalId !== id);
                Storage.set(Storage.KEYS.TABUNGAN_LOG, logs);

                UI.showToast('Tujuan dihapus');
                this.render(document.getElementById('appContent'));
            }
        });
    }
};

