const RiwayatKeuangan = {
    filters: {
        type: 'semua',
        search: '',
        month: ''
    },
    expandedDates: new Set(), // Menyimpan tanggal mana saja yang sedang dibuka penuh

    render(container) {
        container.innerHTML = `
            <div class="container slide-in">
                <div class="flex justify-between items-center mb-6">
                    <h2>Riwayat Transaksi</h2>
                    <button class="btn btn-outline" style="width:auto" onclick="RiwayatKeuangan.handleExport()">
                        <i class="fas fa-file-pdf"></i> Export
                    </button>
                </div>

                <br>

                <div class="card mb-6">
                    <div class="form-group" style="margin-bottom:12px">
                        <label style="font-size:12px; margin-bottom:4px; display:block">Cari Transaksi</label>
                        <input type="text" id="filter-search" value="${this.filters.search}" placeholder="Cari judul atau catatan..." oninput="RiwayatKeuangan.updateFilters()">
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div class="form-group">
                            <label style="font-size:12px; margin-bottom:4px; display:block">Tipe</label>
                            <select id="filter-type" onchange="RiwayatKeuangan.updateFilters()">
                                <option value="semua" ${this.filters.type === 'semua' ? 'selected' : ''}>Semua Tipe</option>
                                <option value="pemasukan" ${this.filters.type === 'pemasukan' ? 'selected' : ''}>Pemasukan</option>
                                <option value="pengeluaran" ${this.filters.type === 'pengeluaran' ? 'selected' : ''}>Pengeluaran</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label style="font-size:12px; margin-bottom:4px; display:block">Bulan</label>
                            <input type="month" id="filter-month" value="${this.filters.month}" onchange="RiwayatKeuangan.updateFilters()">
                        </div>
                    </div>
                    <button class="btn btn-outline" style="width:100%; margin-top:12px" onclick="RiwayatKeuangan.resetFilters()">
                        <i class="fas fa-undo"></i> Reset Filter
                    </button>
                </div>

                <div id="riwayat-list"></div>
            </div>
        `;
        this.renderList();
    },

    updateFilters() {
        this.filters.search = document.getElementById('filter-search').value.toLowerCase();
        this.filters.type = document.getElementById('filter-type').value;
        this.filters.month = document.getElementById('filter-month').value;
        this.expandedDates.clear(); // Reset expansion state saat filter berubah
        this.renderList();
    },

    resetFilters() {
        this.filters = { type: 'semua', search: '', month: '' };
        this.expandedDates.clear();
        this.render(document.getElementById('appContent'));
    },

    getFilteredData() {
        let trx = Storage.get(Storage.KEYS.TRANSAKSI);
        if (this.filters.type !== 'semua') trx = trx.filter(t => t.type === this.filters.type);
        if (this.filters.search) trx = trx.filter(t => t.title.toLowerCase().includes(this.filters.search));
        if (this.filters.month) trx = trx.filter(t => t.date.startsWith(this.filters.month));
        return trx.sort((a,b) => new Date(b.date) - new Date(a.date));
    },

    toggleExpand(date) {
        if (this.expandedDates.has(date)) {
            this.expandedDates.delete(date);
        } else {
            this.expandedDates.add(date);
        }
        this.renderList();
    },

    handleExport() {
        const filteredTrx = this.getFilteredData();
        const filterInfo = {
            type: this.filters.type,
            month: this.filters.month ? Format.dateMonth(this.filters.month) : 'Semua Waktu'
        };
        Export.finance(filteredTrx, filterInfo);
    },

    renderList() {
        const list = document.getElementById('riwayat-list');
        const trx = this.getFilteredData();
        const categories = Storage.get(Storage.KEYS.KATEGORI);
        const sources = Storage.get(Storage.KEYS.SUMBER);

        if (trx.length === 0) {
            list.innerHTML = `<div class="card text-center py-12"><p>Tidak ada transaksi yang cocok.</p></div>`;
            return;
        }

        const grouped = {};
        trx.forEach(t => {
            if (!grouped[t.date]) grouped[t.date] = [];
            grouped[t.date].push(t);
        });

        const sortedDates = Object.keys(grouped).sort((a,b) => new Date(b) - new Date(a));

        list.innerHTML = sortedDates.map(date => {
            const dateTrx = grouped[date];
            const isExpanded = this.expandedDates.has(date);
            const displayedTrx = isExpanded ? dateTrx : dateTrx.slice(0, 3);
            const hasMore = dateTrx.length > 3;

            return `
                <div class="mb-6">
                    <div style="font-size:12px; font-weight:700; color:var(--text-muted); margin-bottom:8px; padding-left:4px">
                        ${Format.date(date)}
                    </div>
                    <div class="card" style="padding: 0; overflow: hidden;">
                        <div class="table-responsive">
                            <table style="margin-bottom:0">
                                <tbody>
                                    ${displayedTrx.map(t => {
                                        const isIncome = t.type === 'pemasukan';
                                        let subLabel = '';
                                        if (isIncome) {
                                            const source = sources.find(s => s.id === t.sourceId);
                                            subLabel = source ? source.name : 'Tanpa Sumber';
                                        } else {
                                            const category = categories.find(c => c.id === t.categoryId);
                                            subLabel = category ? category.name : 'Tanpa Kategori';
                                        }

                                        return `
                                            <tr>
                                                <td>
                                                    <div style="font-weight:700">${t.title}</div>
                                                    <div style="font-size:11px; color:var(--text-muted)">${subLabel}</div>
                                                </td>
                                                <td style="text-align:right">
                                                    <div class="${isIncome ? 'text-success' : 'text-danger'}" style="font-weight:800">
                                                        ${isIncome ? '+' : '-'}${Format.rupiah(t.amount)}
                                                    </div>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                            ${hasMore ? `
                                <div style="padding: 12px; text-align: center; border-top: 1px solid var(--border); background: var(--background)">
                                    <button onclick="RiwayatKeuangan.toggleExpand('${date}')" style="background: none; border: none; color: var(--accent); font-weight: 700; font-size: 13px; cursor: pointer;">
                                        ${isExpanded ? 'Sembunyikan' : `Lihat Semua (${dateTrx.length} Transaksi)`}
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
};
