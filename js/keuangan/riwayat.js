const RiwayatKeuangan = {
    filters: {
        type: 'semua',
        search: '',
        month: '',
        wallet: 'semua'
    },
    expandedDates: new Set(), // Menyimpan tanggal mana saja yang sedang dibuka penuh

    render(container) {
        const wallets = Storage.get(Storage.KEYS.DOMPET) || [];
        container.innerHTML = `
            <div class="container slide-in">
                <div class="flex justify-between items-center mb-6">
                    <h2>Riwayat Transaksi</h2>
                    <button class="btn btn-primary" style="width:auto" onclick="RiwayatKeuangan.handleExport()">
                        <i class="fas fa-file-pdf"></i> Export
                    </button>
                </div>

                <br>

                <div class="form-group mb-4">
                    <input type="text" id="filter-search" value="${this.filters.search}" placeholder="Cari judul atau catatan transaksi..." oninput="RiwayatKeuangan.updateFilters()" style="padding: 14px 16px; border-radius: 16px; width: 100%; border: 1px solid var(--border); background: var(--background); color: var(--text);">
                </div>

                <div class="filter-grid-desktop">
                    <div class="flex gap-3 mb-3" style="flex: 1">
                        <div class="card" style="flex: 1; margin-bottom: 0; padding: 12px 16px; border: 1px solid var(--border); min-width: 0;">
                            <label style="font-size:11px; font-weight:700; 
 margin-bottom:8px; display:block">Dompet</label>
                            <select id="filter-wallet" onchange="RiwayatKeuangan.updateFilters()" style="width: 100%; border: none; background: transparent; padding: 0; outline: none; font-weight: 600; font-size: 14px; color: var(--accent);">
                                <option value="semua" ${this.filters.wallet === 'semua' ? 'selected' : ''}>Semua Dompet</option>
                                ${wallets.map(w => `<option value="${w.id}" ${this.filters.wallet === w.id ? 'selected' : ''}>${w.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="card" style="flex: 1; margin-bottom: 0; padding: 12px 16px; border: 1px solid var(--border); min-width: 0;">
                            <label style="font-size:11px; font-weight:700; 
 margin-bottom:8px; display:block">Tipe</label>
                            <select id="filter-type" onchange="RiwayatKeuangan.updateFilters()" style="width: 100%; border: none; background: transparent; padding: 0; outline: none; font-weight: 600; font-size: 14px; color: var(--accent);">
                                <option value="semua" ${this.filters.type === 'semua' ? 'selected' : ''}>Semua Tipe</option>
                                <option value="pemasukan" ${this.filters.type === 'pemasukan' ? 'selected' : ''}>Pemasukan</option>
                                <option value="pengeluaran" ${this.filters.type === 'pengeluaran' ? 'selected' : ''}>Pengeluaran</option>
                            </select>
                        </div>
                    </div>
                    <br>
                    <div class="flex gap-3 mb-6" style="flex: 1">
                        <div class="card" style="flex: 1; margin-bottom: 0; padding: 12px 16px; border: 1px solid var(--border); min-width: 0;">
                            <label style="font-size:11px; font-weight:700; 
 margin-bottom:8px; display:block">Waktu</label>
                            <div style="position: relative; width: 100%; display: flex; align-items: center; height: 20px;">
                                <div style="position: absolute; left: 0; width: 100%; display: flex; justify-content: space-between; align-items: center; pointer-events: none; z-index: 1;">
                                    <span style="color: ${this.filters.month ? 'var(--text)' : 'var(--accent)'}; font-weight: 600; font-size: 14px;">
                                        ${this.filters.month || 'Semua Waktu'}
                                    </span>
                                    <i class="fas fa-calendar" style="
"></i>
                                </div>
                                <input type="month" id="filter-month" value="${this.filters.month}" onchange="RiwayatKeuangan.updateFilters()" style="width: 100%; height: 100%; opacity: 0; border: none; padding: 0; margin: 0; cursor: pointer; position: relative; z-index: 2;">
                            </div>
                        </div>
                        <div class="card" style="width: 60px; flex-shrink: 0; margin-bottom: 0; padding: 12px; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; cursor: pointer;" onclick="RiwayatKeuangan.resetFilters()">
                            <i class="fas fa-undo" style="color: var(--danger); font-size: 16px;"></i>
                        </div>
                    </div>
                </div>

                <br>
                <br>

                <div id="riwayat-list"></div>
            </div>
        `;
        this.renderList();
    },

    updateFilters() {
        this.filters.search = document.getElementById('filter-search').value.toLowerCase();
        this.filters.type = document.getElementById('filter-type').value;
        this.filters.month = document.getElementById('filter-month').value;
        this.filters.wallet = document.getElementById('filter-wallet').value;
        this.expandedDates.clear(); // Reset expansion state saat filter berubah
        this.renderList();
    },

    resetFilters() {
        this.filters = { type: 'semua', search: '', month: '', wallet: 'semua' };
        this.expandedDates.clear();
        this.render(document.getElementById('appContent'));
    },

    getFilteredData() {
        let trx = Storage.get(Storage.KEYS.TRANSAKSI);
        if (this.filters.type !== 'semua') trx = trx.filter(t => t.type === this.filters.type);
        if (this.filters.wallet !== 'semua') trx = trx.filter(t => t.walletId === this.filters.wallet);
        if (this.filters.search) trx = trx.filter(t => t.title.toLowerCase().includes(this.filters.search));
        if (this.filters.month) trx = trx.filter(t => t.date.startsWith(this.filters.month));
        return trx.sort((a,b) => {
            const dateDiff = new Date(b.date) - new Date(a.date);
            if (dateDiff !== 0) return dateDiff;
            return b.id - a.id;
        });
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
        const wallets = Storage.get(Storage.KEYS.DOMPET) || [];
        const wallet = wallets.find(w => w.id === this.filters.wallet);
        const filterInfo = {
            type: this.filters.type,
            month: this.filters.month ? Format.dateMonth(this.filters.month) : 'Semua Waktu',
            wallet: wallet ? wallet.name : 'Semua Dompet'
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
            
            let dailyTotal = 0;
            dateTrx.forEach(t => {
                if (t.type === 'pemasukan') dailyTotal += Number(t.amount);
                else if (t.type === 'pengeluaran') dailyTotal -= Number(t.amount);
            });

            return `
                <div class="mb-6">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; padding-left:4px; padding-right:4px;">
                        <div style="font-size:12px; font-weight:700; 
">
                            ${Format.date(date)}
                        </div>
                        <div class="card-value ${dailyTotal >= 0 ? 'text-success' : 'text-danger'}" style="font-size:12px;">
                            ${dailyTotal >= 0 ? '+' : '-'}${Format.rupiah(Math.abs(dailyTotal))}
                        </div>
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
                                                    <div style="font-size:11px; color:var(--accent)">${subLabel}</div>
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
                <br>
            `;
        }).join('');
    }
};
