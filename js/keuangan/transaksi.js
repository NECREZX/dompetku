const DashboardKeuangan = {
    render(container) {
        const data = this.calculateData();
        container.innerHTML = `
            <div class="container slide-in">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h2 style="font-size:24px">Dashboard Pencatatan</h2>
                    </div>
                </div>

                <div class="card balance-card" style="background: linear-gradient(135deg, var(--primary), var(--accent)); color: white; border: none; margin-bottom: 24px; box-shadow: 0 10px 20px rgba(232, 105, 106, 0.3);">
                    <div class="card-title" style="color: rgba(255,255,255,0.8);">Total Saldo Tersedia</div>
                    <div class="card-value" style="color: white; font-size: 34px;">${Format.rupiah(data.saldo || 0)}</div>
                </div>

                <div class="flex gap-4 mb-6">
                    <div class="card" style="flex:1; margin-bottom:0; padding: 20px; border: 1px solid var(--border);">
                        <div class="card-title" style="color: var(--accent)">Pemasukan</div>
                        <div class="card-value text-success" style="font-size:18px;">${Format.rupiah(data.income || 0)}</div>
                    </div>
                    <div class="card" style="flex:1; margin-bottom:0; padding: 20px; border: 1px solid var(--border);">
                        <div class="card-title" style="color: var(--accent)">Pengeluaran</div>
                        <div class="card-value text-danger" style="font-size:18px;">${Format.rupiah(data.expense || 0)}</div>
                    </div>
                </div>

                <br>

                <div class="flex gap-4 mb-8 wallet-container" style="overflow-x: auto; padding-bottom: 10px; scrollbar-width: none; -ms-overflow-style: none;">
                    ${data.walletBalances.map(w => `
                        <div class="card wallet-card" style="min-width: calc((100% - 16px) / 2); flex-shrink: 0; margin-bottom: 0; padding: 16px; border: 1px solid var(--border);">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas ${w.icon}" style="color: var(--accent)"></i>
                                <span style="font-size: 12px; font-weight: 700; color: var(--text-muted)">${w.name}</span>
                            </div>
                            <div style="font-weight: 800; font-size: 15px;">${Format.rupiah(w.balance)}</div>
                        </div>
                    `).join('')}
                </div>

                <br>

                <h2 class="mb-4">Statistik Pengeluaran</h2>
                <div class="card mb-6">
                    <div class="chart-container" style="height: 250px">
                        <canvas id="barChart"></canvas>
                    </div>
                </div>

                <br>

                <h2 class="mb-4">Komposisi Pengeluaran</h2>
                <div class="card mb-6">
                    <div class="chart-container" style="height: 250px">
                        <canvas id="pieChart"></canvas>
                    </div>
                </div>

               
            </div>
        `;
        
        this.renderCharts(data);
    },

    calculateData() {
        const trx = Storage.get(Storage.KEYS.TRANSAKSI);
        const wallets = Storage.get(Storage.KEYS.DOMPET);
        const cats = Storage.get(Storage.KEYS.KATEGORI);
        
        let income = 0, expense = 0;
        // Initialize balances with Saldo Awal from each wallet
        const walletBalances = wallets.map(w => ({ 
            ...w, 
            balance: Number(w.balance || 0) 
        }));

        let totalInitialBalance = walletBalances.reduce((sum, w) => sum + w.balance, 0);

        // Charts preparation
        const catStats = {};
        const dailyIncome = {};
        const dailyExpense = {};

        trx.forEach(t => {
            const amount = Number(t.amount);
            const wIdx = walletBalances.findIndex(w => w.id === t.walletId);
            const dateKey = t.date;

            if (t.type === 'pemasukan') {
                income += amount;
                dailyIncome[dateKey] = (dailyIncome[dateKey] || 0) + amount;
                if (wIdx !== -1) walletBalances[wIdx].balance += amount;
            } else {
                expense += amount;
                dailyExpense[dateKey] = (dailyExpense[dateKey] || 0) + amount;
                if (wIdx !== -1) walletBalances[wIdx].balance -= amount;
                // Pie stats
                catStats[t.categoryId] = (catStats[t.categoryId] || 0) + amount;
            }
        });

        // Pie data
        const pieLabels = [], pieValues = [];
        Object.keys(catStats).forEach(id => {
            const cat = cats.find(c => c.id === id);
            pieLabels.push(cat ? cat.name : 'Lainnya');
            pieValues.push(catStats[id]);
        });

        // Bar data (last 7 days/entries)
        const allDates = [...new Set([...Object.keys(dailyIncome), ...Object.keys(dailyExpense)])].sort().slice(-7);
        const barIncome = allDates.map(d => dailyIncome[d] || 0);
        const barExpense = allDates.map(d => dailyExpense[d] || 0);

        return {
            saldo: totalInitialBalance + income - expense,
            income,
            expense,
            walletBalances,
            bar: { labels: allDates, income: barIncome, expense: barExpense },
            pie: { labels: pieLabels, values: pieValues }
        };
    },

    renderCharts(data) {
        const barCtx = document.getElementById('barChart');
        const pieCtx = document.getElementById('pieChart');
        const isDark = document.body.classList.contains('dark-mode');
        const textColor = isDark ? '#94a3b8' : '#64748b';
        const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

        if (barCtx) {
            new Chart(barCtx, {
                type: 'bar',
                data: {
                    labels: data.bar.labels,
                    datasets: [
                        {
                            label: 'Pemasukan',
                            data: data.bar.income,
                            backgroundColor: '#10b981',
                            borderRadius: 5
                        },
                        {
                            label: 'Pengeluaran',
                            data: data.bar.expense,
                            backgroundColor: '#e8696a',
                            borderRadius: 5
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { 
                            position: 'bottom',
                            labels: { color: textColor, usePointStyle: true }
                        } 
                    },
                    scales: { 
                        y: { 
                            beginAtZero: true, 
                            grid: { color: gridColor },
                            ticks: { 
                                color: textColor,
                                callback: value => 'Rp ' + (value/1000) + 'k' 
                            }
                        }, 
                        x: { 
                            grid: { display: false },
                            ticks: { color: textColor }
                        } 
                    }
                }
            });
        }


        if (pieCtx) {
            new Chart(pieCtx, {
                type: 'doughnut',
                data: {
                    labels: data.pie.labels,
                    datasets: [{
                        data: data.pie.values,
                        backgroundColor: ['#ff80ecff', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#d7072aff'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { 
                            position: 'bottom', 
                            labels: { color: textColor, usePointStyle: true, padding: 20 } 
                        } 
                    },
                    cutout: '70%'
                }
            });
        }
    }
};


const Transaksi = {
    currentType: 'pengeluaran',
    filters: {
        type: 'semua',
        search: '',
        month: '',
        wallet: 'semua'
    },
    expandedDates: new Set(),

    render(container) {
        const wallets = Storage.get(Storage.KEYS.DOMPET) || [];
        container.innerHTML = `
            <div class="container slide-in">
                <div class="flex justify-between items-center mb-6">
                    <h2>Daftar Transaksi</h2>
                    <button class="btn btn-primary" style="width: auto; padding: 10px 20px" onclick="Transaksi.showAddModal()">
                        <i class="fas fa-plus"></i> Tambah
                    </button>
                </div>

                <br>

                <div class="form-group mb-4">
                    <input type="text" id="trx-filter-search" value="${this.filters.search}" placeholder="Cari judul atau catatan transaksi..." oninput="Transaksi.updateFilters()" style="padding: 14px 16px; border-radius: 16px; width: 100%; border: 1px solid var(--border); background: var(--background); color: var(--text);">
                </div>

                <div class="filter-grid-desktop">
                    <div class="flex gap-3 mb-3" style="flex: 1">
                        <div class="card" style="flex: 1; margin-bottom: 0; padding: 12px 16px; border: 1px solid var(--border); min-width: 0;">
                            <label style="font-size:11px; font-weight:700; 
 margin-bottom:8px; display:block">Dompet</label>
                            <select id="trx-filter-wallet" onchange="Transaksi.updateFilters()" style="width: 100%; border: none; background: transparent; padding: 0; outline: none; font-weight: 600; font-size: 14px; color: var(--accent);">
                                <option value="semua" ${this.filters.wallet === 'semua' ? 'selected' : ''}>Semua Dompet</option>
                                ${wallets.map(w => `<option value="${w.id}" ${this.filters.wallet === w.id ? 'selected' : ''}>${w.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="card" style="flex: 1; margin-bottom: 0; padding: 12px 16px; border: 1px solid var(--border); min-width: 0;">
                            <label style="font-size:11px; font-weight:700; 
 margin-bottom:8px; display:block">Tipe</label>
                            <select id="trx-filter-type" onchange="Transaksi.updateFilters()" style="width: 100%; border: none; background: transparent; padding: 0; outline: none; font-weight: 600; font-size: 14px; color: var(--accent);">
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
                                <input type="month" id="trx-filter-month" value="${this.filters.month}" onchange="Transaksi.updateFilters()" style="width: 100%; height: 100%; opacity: 0; border: none; padding: 0; margin: 0; cursor: pointer; position: relative; z-index: 2;">
                            </div>
                        </div>
                        <div class="card" style="width: 60px; flex-shrink: 0; margin-bottom: 0; padding: 12px; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; cursor: pointer;" onclick="Transaksi.resetFilters()">
                            <i class="fas fa-undo" style="color: var(--danger); font-size: 16px;"></i>
                        </div>
                    </div>
                </div>

                <br>
                <br>

                <div id="transaksi-list"></div>
            </div>
        `;
        this.renderList();
    },

    updateFilters() {
        this.filters.search = document.getElementById('trx-filter-search').value.toLowerCase();
        this.filters.type = document.getElementById('trx-filter-type').value;
        this.filters.month = document.getElementById('trx-filter-month').value;
        this.filters.wallet = document.getElementById('trx-filter-wallet').value;
        this.expandedDates.clear();
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

    showAddModal(id = null) {
        const categories = Storage.get(Storage.KEYS.KATEGORI);
        const sources = Storage.get(Storage.KEYS.SUMBER);
        const wallets = Storage.get(Storage.KEYS.DOMPET);
        const trx = id ? Storage.get(Storage.KEYS.TRANSAKSI).find(t => t.id === id) : null;
        
        this.currentType = trx ? trx.type : 'pengeluaran';

        UI.showModal(id ? 'Ubah Transaksi' : 'Catat Transaksi Baru', `
            <form onsubmit="Transaksi.save(event, ${id ? `'${id}'` : 'null'})">
                <div class="tab-group">
                    <button type="button" class="tab-btn ${this.currentType === 'pengeluaran' ? 'active' : ''}" id="btn-tab-expense" onclick="Transaksi.setType('pengeluaran')">Pengeluaran</button>
                    <button type="button" class="tab-btn ${this.currentType === 'pemasukan' ? 'active' : ''}" id="btn-tab-income" onclick="Transaksi.setType('pemasukan')">Pemasukan</button>
                </div>
                <div class="form-group">
                    <label>Judul Transaksi</label>
                    <input type="text" id="trx-title" value="${trx ? trx.title : ''}" required placeholder="Contoh: Belanja Bulanan">
                </div>
                <div class="form-group">
                    <label>Jumlah (Rp)</label>
                    <input type="number" id="trx-amount" value="${trx ? trx.amount : ''}" required placeholder="0">
                </div>
                <div class="form-group">
                    <label>Pilih Dompet</label>
                    <select id="trx-wallet" required>
                        ${wallets.map(w => `<option value="${w.id}" ${trx && trx.walletId === w.id ? 'selected' : ''}>${w.name}</option>`).join('')}
                    </select>
                </div>
                <div class="flex gap-2">
                    <div class="form-group ${this.currentType === 'pemasukan' ? 'hidden' : ''}" style="flex:1" id="group-category">
                        <label>Kategori</label>
                        <select id="trx-category">
                            ${categories.map(c => `<option value="${c.id}" ${trx && trx.categoryId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group ${this.currentType === 'pengeluaran' ? 'hidden' : ''}" style="flex:1" id="group-source">
                        <label>Sumber</label>
                        <select id="trx-source">
                            ${sources.map(s => `<option value="${s.id}" ${trx && trx.sourceId === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group" style="flex:1">
                        <label>Tanggal</label>
                        <input type="date" id="trx-date" value="${trx ? trx.date : Format.toHTMLDate(new Date())}" required>
                    </div>
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%">${id ? 'Update Data' : 'Simpan Data'}</button>
            </form>
        `);
    },

    setType(type) {
        this.currentType = type;
        document.getElementById('btn-tab-expense').classList.toggle('active', type === 'pengeluaran');
        document.getElementById('btn-tab-income').classList.toggle('active', type === 'pemasukan');
        document.getElementById('group-category').classList.toggle('hidden', type === 'pemasukan');
        document.getElementById('group-source').classList.toggle('hidden', type === 'pengeluaran');
    },

    save(e, id = null) {
        e.preventDefault();
        let trx = Storage.get(Storage.KEYS.TRANSAKSI);
        
        const newTrx = {
            id: id || Date.now().toString(),
            type: this.currentType,
            title: document.getElementById('trx-title').value,
            amount: document.getElementById('trx-amount').value,
            date: document.getElementById('trx-date').value,
            categoryId: document.getElementById('trx-category') ? document.getElementById('trx-category').value : null,
            sourceId: document.getElementById('trx-source') ? document.getElementById('trx-source').value : null,
            walletId: document.getElementById('trx-wallet').value,
            note: ''
        };

        if (id) {
            trx = trx.map(t => t.id === id ? newTrx : t);
        } else {
            trx.push(newTrx);
            // Add Notification only for new
            const walletName = Storage.get(Storage.KEYS.DOMPET).find(w => w.id === newTrx.walletId).name;
            Storage.addNotif(
                this.currentType === 'pemasukan' ? 'Pemasukan Dicatat' : 'Pengeluaran Dicatat',
                `${newTrx.title} sebesar ${Format.rupiah(newTrx.amount)} di dompet ${walletName}`
            );
        }

        Storage.set(Storage.KEYS.TRANSAKSI, trx);
        UI.hideModal();
        
        Swal.fire({
            title: id ? 'Berhasil Diperbarui' : 'Berhasil Disimpan',
            text: `Data transaksi ${newTrx.title} telah dicatat.`,
            icon: 'success',
            confirmButtonColor: 'var(--primary)',
        });

        this.render(document.getElementById('appContent'));
    },

    renderList() {
        const container = document.getElementById('transaksi-list');
        const trx = this.getFilteredData();
        const wallets = Storage.get(Storage.KEYS.DOMPET);
        
        if (trx.length === 0) {
            container.innerHTML = `<div class="text-center py-12"><i class="fas fa-receipt mb-4" style="font-size:48px; color:var(--border)"></i><p>Belum ada transaksi.</p></div>`;
            return;
        }

        const grouped = {};
        trx.forEach(t => {
            if (!grouped[t.date]) grouped[t.date] = [];
            grouped[t.date].push(t);
        });

        const sortedDates = Object.keys(grouped).sort((a,b) => new Date(b) - new Date(a));

        container.innerHTML = sortedDates.map(date => {
            const dateTrx = grouped[date];
            const isExpanded = this.expandedDates.has(date);
            const displayedTrx = isExpanded ? dateTrx : dateTrx.slice(0, 3);
            const hasMore = dateTrx.length > 3;

            return `
                <div class="mb-6">
                    <div style="font-size:12px; font-weight:700; 
 margin-bottom:8px; padding-left:4px">
                        ${Format.date(date)}
                    </div>
                    <div class="card" style="padding: 0; overflow: hidden;">
                        <div class="table-responsive">
                            <table style="border-collapse: collapse; margin-bottom: 0;">
                                <tbody>
                                    ${displayedTrx.map(t => {
                                        const isIncome = t.type === 'pemasukan';
                                        const wallet = wallets.find(w => w.id === t.walletId);
                                        return `
                                            <tr style="border-bottom: 1px solid var(--border)">
                                                <td>
                                                    <div style="font-weight:700">${t.title}</div>
                                                    <div style="font-size:11px; color:var(--accent)">
                                                        <i class="fas ${wallet ? wallet.icon : 'fa-wallet'}"></i> ${wallet ? wallet.name : 'Unknown'}
                                                    </div>
                                                </td>
                                                <td style="text-align:right">
                                                    <span class="${isIncome ? 'text-success' : 'text-danger'}" style="font-weight:800">
                                                        ${isIncome ? '+' : '-'}${Format.rupiah(t.amount)}
                                                    </span>
                                                </td>
                                                <td style="text-align:right; width: 90px;">
                                                    <div class="flex gap-2 justify-end">
                                                        <button class="nav-btn" style="width:32px; height:32px; background:var(--background)" onclick="Transaksi.showAddModal('${t.id}')">
                                                            <i class="fas fa-edit" style="color:var(--accent)"></i>
                                                        </button>
                                                        <button class="nav-btn" style="width:32px; height:32px; background:var(--background)" onclick="Transaksi.delete('${t.id}')">
                                                            <i class="fas fa-trash" style="color:var(--danger)"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                            ${hasMore ? `
                                <div style="padding: 12px; text-align: center; border-top: 1px solid var(--border); background: var(--background)">
                                    <button onclick="Transaksi.toggleExpand('${date}')" style="background: none; border: none; color: var(--accent); font-weight: 700; font-size: 13px; cursor: pointer;">
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
    },

    delete(id) {
        Swal.fire({
            title: 'Hapus Transaksi?',
            text: "Data transaksi yang dihapus tidak bisa dikembalikan.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: 'var(--primary)',
            cancelButtonColor: 'var(--danger)',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                let trx = Storage.get(Storage.KEYS.TRANSAKSI);
                trx = trx.filter(t => t.id !== id);
                Storage.set(Storage.KEYS.TRANSAKSI, trx);
                UI.showToast('Transaksi dihapus');
                this.render(document.getElementById('appContent'));
            }
        });
    }
};


