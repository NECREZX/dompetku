const RiwayatTabungan = {
    filters: {
        goalId: 'all',
        type: 'all'
    },

    render(container) {
        const goals = Storage.get(Storage.KEYS.TABUNGAN);
        
        container.innerHTML = `
            <div class="container slide-in">
                <div class="flex justify-between items-center mb-6">
                    <h2>Riwayat Tabungan</h2>
                    <button class="btn btn-outline" style="width:auto" onclick="Export.savings()">
                        <i class="fas fa-file-pdf"></i> Export
                    </button>
                </div>

                <br>

                <div class="card mb-6" style="padding: 16px;">
                    <div class="flex gap-3 flex-wrap">
                        <div style="flex:1; min-width: 140px;">
                            <label style="font-size: 10px; margin-bottom: 5px;">Filter Target</label>
                            <select id="filter-goal" onchange="RiwayatTabungan.applyFilter()" style="padding: 10px; font-size: 13px;">
                                <option value="all">Semua Target</option>
                                ${goals.map(g => `<option value="${g.id}" ${this.filters.goalId === g.id ? 'selected' : ''}>${g.name}</option>`).join('')}
                            </select>
                        </div>
                        <div style="flex:1; min-width: 140px;">
                            <label style="font-size: 10px; margin-bottom: 5px;">Filter Jenis</label>
                            <select id="filter-type" onchange="RiwayatTabungan.applyFilter()" style="padding: 10px; font-size: 13px;">
                                <option value="all" ${this.filters.type === 'all' ? 'selected' : ''}>Semua Jenis</option>
                                <option value="setor" ${this.filters.type === 'setor' ? 'selected' : ''}>Hanya Setoran</option>
                                <option value="tarik" ${this.filters.type === 'tarik' ? 'selected' : ''}>Hanya Penarikan</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div id="savings-history-list"></div>
            </div>
        `;
        this.renderList();
    },

    applyFilter() {
        this.filters.goalId = document.getElementById('filter-goal').value;
        this.filters.type = document.getElementById('filter-type').value;
        this.renderList();
    },

    renderList() {
        const list = document.getElementById('savings-history-list');
        let logs = Storage.get(Storage.KEYS.TABUNGAN_LOG).sort((a,b) => new Date(b.date) - new Date(a.date));
        const goals = Storage.get(Storage.KEYS.TABUNGAN);

        // Apply Logic Filters
        if (this.filters.goalId !== 'all') {
            logs = logs.filter(l => l.goalId === this.filters.goalId);
        }
        if (this.filters.type !== 'all') {
            logs = logs.filter(l => l.type === this.filters.type);
        }
        
        if (logs.length === 0) {
            list.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-search mb-3" style="font-size:32px; color:var(--border)"></i>
                    <p style="color:var(--text-muted)">Tidak ada data yang cocok dengan filter.</p>
                </div>
            `;
            return;
        }

        list.innerHTML = `
            <div class="card" style="padding: 0; overflow: hidden;">
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Tanggal & Tujuan</th>
                                <th style="text-align:right">Jumlah</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${logs.map(l => {
                                const goal = goals.find(g => g.id === l.goalId);
                                const isSetor = l.type === 'setor';
                                return `
                                    <tr>
                                        <td>
                                            <div style="font-size:11px; color:var(--text-muted)">${Format.date(l.date)}</div>
                                            <div style="font-weight:700">${goal ? goal.name : 'Tujuan Dihapus'}</div>
                                            <div style="font-size:11px; color:var(--text-muted)">${l.note || (isSetor ? 'Setoran' : 'Penarikan')}</div>
                                        </td>
                                        <td style="text-align:right">
                                            <span class="${isSetor ? 'text-success' : 'text-danger'}" style="font-weight:800">
                                                ${isSetor ? '+' : '-'}${Format.rupiah(l.amount)}
                                            </span>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
};
