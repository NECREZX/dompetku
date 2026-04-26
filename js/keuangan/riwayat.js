const RiwayatKeuangan = {
    filters: {
        type: 'semua',
        search: ''
    },

    render(container) {
        container.innerHTML = `
            <div class="container slide-in">
                <div class="flex justify-between items-center mb-6">
                    <h2>Riwayat Transaksi</h2>
                    <button class="btn btn-outline" style="width:auto" onclick="Export.finance()">
                        <i class="fas fa-file-pdf"></i> Export
                    </button>
                </div>
                <br>

                <div class="card">
                    <div class="form-group" style="margin-bottom:10px">
                        <input type="text" id="filter-search" placeholder="Cari judul atau catatan..." oninput="RiwayatKeuangan.updateFilters()">
                    </div>
                    <div class="flex gap-2">
                        <select id="filter-type" style="flex:1" onchange="RiwayatKeuangan.updateFilters()">
                            <option value="semua">Semua Tipe</option>
                            <option value="pemasukan">Pemasukan</option>
                            <option value="pengeluaran">Pengeluaran</option>
                        </select>
                        <button class="btn btn-outline" style="width:auto" onclick="RiwayatKeuangan.resetFilters()">
                            <i class="fas fa-undo"></i>
                        </button>
                    </div>
                </div>

                <div id="riwayat-list"></div>
            </div>
        `;
        this.renderList();
    },

    updateFilters() {
        this.filters.search = document.getElementById('filter-search').value.toLowerCase();
        this.filters.type = document.getElementById('filter-type').value;
        this.renderList();
    },

    resetFilters() {
        this.filters = { type: 'semua', search: '' };
        document.getElementById('filter-search').value = '';
        document.getElementById('filter-type').value = 'semua';
        this.renderList();
    },

    renderList() {
        const list = document.getElementById('riwayat-list');
        let trx = Storage.get(Storage.KEYS.TRANSAKSI);
        
        // Apply Filters
        if (this.filters.type !== 'semua') {
            trx = trx.filter(t => t.type === this.filters.type);
        }
        if (this.filters.search) {
            trx = trx.filter(t => 
                t.title.toLowerCase().includes(this.filters.search) || 
                (t.note && t.note.toLowerCase().includes(this.filters.search))
            );
        }

        trx = trx.sort((a,b) => new Date(b.date) - new Date(a.date));

        if (trx.length === 0) {
            list.innerHTML = `<p class="text-center py-8">Tidak ada transaksi yang cocok.</p>`;
            return;
        }

        list.innerHTML = `
            <div class="card" style="padding: 0; overflow: hidden;">
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Tanggal & Keterangan</th>
                                <th style="text-align:right">Jumlah</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${trx.map(t => {
                                const isIncome = t.type === 'pemasukan';
                                return `
                                    <tr>
                                        <td>
                                            <div style="font-size:11px; color:var(--text-muted)">${Format.date(t.date)}</div>
                                            <div style="font-weight:700">${t.title}</div>
                                            <div style="font-size:11px; color:var(--text-muted)">${t.note || '-'}</div>
                                        </td>
                                        <td style="text-align:right">
                                            <span class="${isIncome ? 'text-success' : 'text-danger'}" style="font-weight:800">
                                                ${isIncome ? '+' : '-'}${Format.rupiah(t.amount)}
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

