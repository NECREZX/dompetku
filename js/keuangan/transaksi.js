const DashboardKeuangan = {
    filters: {
        month: new Date().toISOString().substring(0, 7)
    },

    render(container) {
        const data = this.calculateData();
        container.innerHTML = `
            <div class="container slide-in">
                <div class="flex justify-between items-center mb-6">
                <div>
                    <h2 style="font-size:24px">Dashboard Keuangan</h2>
                </div>
                </div>

                <!-- 1. Global Balance Card -->
                <div class="card balance-card" style="background: #b07840; color: white; border: none; margin-bottom: 24px; padding: 28px; box-shadow: 0 10px 30px rgba(176, 120, 64, 0.3);">
                    <div class="card-title" style="color: rgba(255, 255, 255, 0.7); font-size: 11px;">Total Dana Terkumpul</div>


                    <div class="card-value" style="color: white; font-size: 34px;">${Format.rupiah(data.totalSaldo || 0)}</div>
                </div>


                <!-- 2. Quick Summary Cards -->
                <div class="flex gap-4 mb-6">
                    <div class="card" style="flex:1; margin-bottom:0; padding: 20px; border: 1px solid var(--border);">
                        <div class="card-title" style="color: var(--text)">Pemasukan</div>

                        <div class="card-value text-success" style="font-size:18px;">${Format.rupiah(data.totalIncomeAllTime)}</div>
                    </div>
                    <div class="card" style="flex:1; margin-bottom:0; padding: 20px; border: 1px solid var(--border);">
                        <div class="card-title" style="color: var(--text)">Pengeluaran</div>

                        <div class="card-value text-danger" style="font-size:18px;">${Format.rupiah(data.totalExpenseAllTime)}</div>
                    </div>
                </div>

                <br>

                <!-- 3. Wallet List -->
                <div class="flex gap-4 mb-8 wallet-container" style="overflow-x: auto; padding-bottom: 10px; scrollbar-width: none; -ms-overflow-style: none;">
                    ${data.walletBalances.map(w => `
                        <div class="card wallet-card" style="min-width: calc((100% - 16px) / 2); flex-shrink: 0; margin-bottom: 0; padding: 16px; border: 1px solid var(--border);">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas ${w.icon}" style="color: var(--accent)"></i>
                                <span style="font-size: 12px; font-weight: 800; color: var(--text-muted)">${w.name}</span>
                            </div>
                            <div class="card-value" style="font-size: 16px; color: #000000;">${Format.rupiah(w.balance)}</div>

                        </div>
                    `).join('')}
                </div>

                <br>

                <!-- BAWAH: KUMPULAN GRAFIK -->
                
                <!-- 1. Tren 7 Hari -->
                <h2 class="mb-4">Transaksi Terbaru</h2>
                <div class="card mb-8" style="padding: 20px; border: 1px solid var(--border);">
                    <div style="height: 250px">
                        <canvas id="barChart"></canvas>
                    </div>
                </div>

                <br>

                <!-- 2. Analisis Bulanan -->
                <div class="mb-6">
                    <h2 class="mb-4">Analisis Bulanan</h2>
                    <div class="flex gap-3 items-center">
                        <!-- Card Filter Gaya Mockup (PUTIH) -->
                        <div class="card" style="flex: 1; margin-bottom:0; padding: 12px 20px; border: 1px solid var(--border); border-radius: 24px; position: relative; background: var(--surface); display: flex; flex-direction: column; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                            <div style="font-size: 10px; font-weight: 800; color: var(--text-muted); margin-bottom: 4px; letter-spacing: 0.5px;">WAKTU</div>
                            <div class="flex justify-between items-center">
                                <span style="font-size: 16px; font-weight: 800; color: var(--primary);">${Format.dateMonth(this.filters.month)}</span>
                                <i class="fas fa-calendar-alt" style="color: #000000; font-size: 18px;"></i>

                            </div>
                            <input type="month" id="db-filter-month" value="${this.filters.month}" onchange="DashboardKeuangan.updateFilters()" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;">
                        </div>

                        <!-- Tombol Reset Gaya Mockup (PUTIH) -->
                        <div onclick="DashboardKeuangan.resetFilters()" class="card" style="width: 58px; height: 58px; border-radius: 20px; border: 1px solid var(--border); background: var(--surface); display: flex; align-items: center; justify-content: center; cursor: pointer; margin-bottom: 0; flex-shrink: 0; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                            <i class="fas fa-undo" style="color: var(--primary); font-size: 18px;"></i>
                        </div>
                    </div>
                </div>

                <br>

                <div style="display: flex; flex-direction: column; gap: 20px; margin-bottom: 40px;">
                    <div class="card" style="padding: 20px; border: 1px solid var(--border);">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <div class="card-title" style="color: var(--success); margin-bottom: 4px;">Pemasukan Bulanan</div>
                                <div class="card-value text-success" style="font-size: 22px;">${Format.rupiah(data.incomeMonthly)}</div>
                            </div>
                            <div style="text-align: right">
                                <div style="font-size: 10px; font-weight: 800; color: var(--text-muted)">DOMINAN</div>
                                <div style="font-size: 12px; font-weight: 800; color: var(--primary)">${data.topIncomeSource.name} (${data.topIncomeSource.percent}%)</div>
                            </div>
                        </div>
                        <div style="height: 160px;">
                            <canvas id="incomeCompositionChart"></canvas>
                        </div>
                    </div>

                    <div class="card" style="padding: 20px; border: 1px solid var(--border);">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <div class="card-title" style="color: var(--danger); margin-bottom: 4px;">Pengeluaran Bulanan</div>
                                <div class="card-value text-danger" style="font-size: 22px;">${Format.rupiah(data.expenseMonthly)}</div>
                            </div>
                            <div style="text-align: right">
                                <div style="font-size: 10px; font-weight: 800; color: var(--text-muted)">DOMINAN</div>
                                <div style="font-size: 12px; font-weight: 800; color: var(--primary)">${data.topExpenseCat.name} (${data.topExpenseCat.percent}%)</div>
                            </div>
                        </div>
                        <div style="height: 160px;">
                            <canvas id="expenseCompositionChart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- 3. Komposisi Pengeluaran (Semua) -->
                <h2 class="mb-4">Pengeluaran Keseluruhan</h2>
                <div class="card mb-8" style="padding: 20px; border: 1px solid var(--border);">
                    <div style="height: 250px">
                        <canvas id="pieChartExpense"></canvas>
                    </div>
                </div>

                <br>

                <!-- 4. Komposisi Pemasukan (Semua) -->
                <h2 class="mb-4">Pemasukan Keseluruhan</h2>
                <div class="card mb-8" style="padding: 20px; border: 1px solid var(--border);">
                    <div style="height: 250px">
                        <canvas id="pieChartIncome"></canvas>
                    </div>
                </div>
            </div>
        `;
        
        this.renderCharts(data);
    },

    updateFilters() {
        this.filters.month = document.getElementById('db-filter-month').value;
        this.render(document.getElementById('appContent'));
    },

    resetFilters() {
        this.filters.month = new Date().toISOString().substring(0, 7);
        this.render(document.getElementById('appContent'));
    },

    calculateData() {
        const trx = Storage.get(Storage.KEYS.TRANSAKSI);
        const wallets = Storage.get(Storage.KEYS.DOMPET);
        const cats = Storage.get(Storage.KEYS.KATEGORI);
        const sources = Storage.get(Storage.KEYS.SUMBER);
        
        let totalIncomeAllTime = 0, totalExpenseAllTime = 0;
        const dailyIncome = {}, dailyExpense = {}, allTimeCatStats = {}, allTimeSourceStats = {};
        
        trx.forEach(t => {
            const amount = Number(t.amount);
            if (t.type === 'pemasukan') {
                totalIncomeAllTime += amount;
                dailyIncome[t.date] = (dailyIncome[t.date] || 0) + amount;
                allTimeSourceStats[t.sourceId] = (allTimeSourceStats[t.sourceId] || 0) + amount;
            } else {
                totalExpenseAllTime += amount;
                dailyExpense[t.date] = (dailyExpense[t.date] || 0) + amount;
                allTimeCatStats[t.categoryId] = (allTimeCatStats[t.categoryId] || 0) + amount;
            }
        });

        const monthlyTrx = trx.filter(t => t.date.startsWith(this.filters.month));
        let incomeMonthly = 0, expenseMonthly = 0;
        const incomeMonthlyStats = {}, expenseMonthlyStats = {};

        monthlyTrx.forEach(t => {
            const amount = Number(t.amount);
            if (t.type === 'pemasukan') {
                incomeMonthly += amount;
                incomeMonthlyStats[t.sourceId] = (incomeMonthlyStats[t.sourceId] || 0) + amount;
            } else {
                expenseMonthly += amount;
                expenseMonthlyStats[t.categoryId] = (expenseMonthlyStats[t.categoryId] || 0) + amount;
            }
        });

        const walletBalances = wallets.map(w => {
            let balance = Number(w.balance || 0);
            trx.forEach(t => {
                if (t.walletId === w.id) {
                    if (t.type === 'pemasukan') balance += Number(t.amount);
                    else balance -= Number(t.amount);
                }
            });
            return { ...w, balance };
        });

        const totalSaldo = walletBalances.reduce((sum, w) => sum + w.balance, 0);

        const prepStats = (statsObj, referenceList) => {
            const total = Object.values(statsObj).reduce((a, b) => a + b, 0);
            const list = Object.keys(statsObj).map(id => {
                const ref = referenceList.find(r => r.id === id);
                const val = statsObj[id];
                const percent = total > 0 ? Math.round((val / total) * 100) : 0;
                return { name: ref ? ref.name : 'Lainnya', value: val, percent };
            }).sort((a,b) => b.value - a.value);

            return {
                labels: list.map(l => l.name),
                values: list.map(l => l.percent),
                top: list.length > 0 ? list[0] : { name: '-', percent: 0 },
                rawValues: list.map(l => l.value)
            };
        };

        const incomeMonthlyComp = prepStats(incomeMonthlyStats, sources);
        const expenseMonthlyComp = prepStats(expenseMonthlyStats, cats);
        const incomeAllTimeComp = prepStats(allTimeSourceStats, sources);
        const expenseAllTimeComp = prepStats(allTimeCatStats, cats);

        const allDates = [...new Set([...Object.keys(dailyIncome), ...Object.keys(dailyExpense)])].sort().slice(-7);

        return {
            totalSaldo, totalIncomeAllTime, totalExpenseAllTime,
            incomeMonthly, expenseMonthly,
            walletBalances,
            incomeMonthlyComp, expenseMonthlyComp,
            incomeAllTimeComp, expenseAllTimeComp,
            topIncomeSource: incomeMonthlyComp.top,
            topExpenseCat: expenseMonthlyComp.top,
            bar: { labels: allDates, income: allDates.map(d => dailyIncome[d] || 0), expense: allDates.map(d => dailyExpense[d] || 0) }
        };
    },

    charts: {},

    renderCharts(data) {
        // Hancurkan semua chart yang ada jika masih tersimpan referensinya
        Object.keys(this.charts).forEach(key => {
            if (this.charts[key]) {
                this.charts[key].destroy();
                delete this.charts[key];
            }
        });

        // Gambar ulang secara instan
        const isDark = document.body.classList.contains('dark-mode');
        const textColor = isDark ? '#ffffff' : '#000000'; // Putih bersih vs Hitam pekat

        const gridColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)';

        // 1. Bar Chart (Last 7 Days)
        const ctxBar = document.getElementById('barChart');
        if (ctxBar) {
            this.charts['barChart'] = new Chart(ctxBar, {
                type: 'bar',
                data: {
                    labels: data.bar.labels,
                    datasets: [
                        { label: 'Pemasukan', data: data.bar.income, backgroundColor: '#10b981', borderRadius: 5 },
                        { label: 'Pengeluaran', data: data.bar.expense, backgroundColor: '#ef4444', borderRadius: 5 }

                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { color: textColor, font: { family: 'Space Grotesk', weight: '700' } } } },
                    scales: {
                        y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor, font: { family: 'Space Grotesk', weight: '500' }, callback: v => 'Rp ' + (v/1000) + 'k' } },
                        x: { grid: { display: false }, ticks: { color: textColor, font: { family: 'Space Grotesk', weight: '500' } } }
                    }
                }
            });
        }

            // 2. All Time Doughnut Charts
            const buildDoughnut = (id, labels, values) => {
                const ctx = document.getElementById(id);
                if (!ctx) return;
                this.charts[id] = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: labels,
                        datasets: [{ data: values, backgroundColor: ['#ff80ecff', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#d7072aff'], borderWidth: 0 }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: { 
                            legend: { position: 'bottom', labels: { color: textColor, padding: 20, font: { family: 'Space Grotesk', weight: '600' } } },
                            tooltip: { callbacks: { label: (context) => ` ${Format.rupiah(context.raw)}` } }
                        },
                        cutout: '70%'
                    }
                });
            };

            buildDoughnut('pieChartExpense', data.expenseAllTimeComp.labels, data.expenseAllTimeComp.rawValues);
            buildDoughnut('pieChartIncome', data.incomeAllTimeComp.labels, data.incomeAllTimeComp.rawValues);

            // 3. Monthly Analysis Horizontal Bar Charts
            const buildCompChart = (id, labels, rawValues, color) => {
                const ctx = document.getElementById(id);
                if (!ctx) return;
                this.charts[id] = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{ data: rawValues, backgroundColor: color, borderRadius: 8, barThickness: 12 }]
                    },
                    options: {
                        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                        plugins: { 
                            legend: { display: false },
                            tooltip: { callbacks: { label: (context) => ` ${Format.rupiah(context.raw)}` } }
                        },
                        scales: {
                            x: { 
                                beginAtZero: true, 
                                grid: { color: gridColor }, 
                                ticks: { 
                                    color: textColor, 
                                    font: { family: 'Space Grotesk', weight: '500' },
                                    callback: v => {
                                        if (v >= 1000000) return (v/1000000).toFixed(1) + 'jt';
                                        if (v >= 1000) return (v/1000) + 'k';
                                        return v;
                                    }
                                } 
                            },
                            y: { grid: { display: false }, ticks: { color: textColor, font: { weight: '800', size: 11, family: 'Space Grotesk' } } }
                        }
                    }
                });
            };

            buildCompChart('incomeCompositionChart', data.incomeMonthlyComp.labels, data.incomeMonthlyComp.rawValues, '#10b981');
            buildCompChart('expenseCompositionChart', data.expenseMonthlyComp.labels, data.expenseMonthlyComp.rawValues, '#ef4444');

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
                Swal.fire({
                    title: 'Dihapus',
                    text: 'Transaksi telah berhasil dihapus.',
                    icon: 'success',
                    confirmButtonColor: 'var(--primary)',
                });
                this.render(document.getElementById('appContent'));
            }
        });
    }
};


