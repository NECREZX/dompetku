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

                <div class="card balance-card" style="background: linear-gradient(135deg, var(--primary), var(--accent)); color: white; border: none; margin-bottom: 24px;">
                    <div class="card-title" style="color: rgba(255,255,255,0.7)">Total Saldo Tersedia</div>
                    <div class="card-value" style="color: white; font-size: 32px;">${Format.rupiah(data.saldo)}</div>
                </div>

                <div class="flex gap-4 mb-6">
                    <div class="card" style="flex:1; margin-bottom:0; padding: 20px;">
                        <div class="card-title">Pemasukan</div>
                        <div class="card-value text-success" style="font-size:18px">${Format.rupiah(data.income)}</div>
                    </div>
                    <div class="card" style="flex:1; margin-bottom:0; padding: 20px;">
                        <div class="card-title">Pengeluaran</div>
                        <div class="card-value text-danger" style="font-size:18px">${Format.rupiah(data.expense)}</div>
                    </div>
                </div>

                <br>

                <div class="flex gap-4 mb-8" style="overflow-x: auto; padding-bottom: 10px; scrollbar-width: none;">
                    ${data.walletBalances.map(w => `
                        <div class="card" style="min-width: 160px; margin-bottom: 0; padding: 16px; border: 1px solid var(--border);">
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
        const walletBalances = wallets.map(w => ({ ...w, balance: 0 }));

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
            saldo: income - expense,
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
                            backgroundColor: '#3b82f6',
                            borderRadius: 5
                        },
                        {
                            label: 'Pengeluaran',
                            data: data.bar.expense,
                            backgroundColor: '#f43f5e',
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

    render(container) {
        container.innerHTML = `
            <div class="container slide-in">
                <div class="flex justify-between items-center mb-6">
                    <h2>Daftar Transaksi</h2>
                    <button class="btn btn-primary" style="width: auto; padding: 10px 20px" onclick="Transaksi.showAddModal()">
                        <i class="fas fa-plus"></i> Tambah
                    </button>
                </div>

                <br>

                <div id="transaksi-list"></div>
            </div>
        `;
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
        const trx = Storage.get(Storage.KEYS.TRANSAKSI).sort((a,b) => new Date(b.date) - new Date(a.date));
        const wallets = Storage.get(Storage.KEYS.DOMPET);
        
        if (trx.length === 0) {
            container.innerHTML = `<div class="text-center py-12"><i class="fas fa-receipt mb-4" style="font-size:48px; color:var(--border)"></i><p>Belum ada transaksi.</p></div>`;
            return;
        }

        container.innerHTML = `
            <div class="card" style="padding: 0; overflow: hidden;">
                <div class="table-responsive">
                    <table style="border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 2px solid var(--border)">
                                <th>Keterangan</th>
                                <th style="text-align:right">Jumlah</th>
                                <th style="width:100px">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${trx.map(t => {
                                const isIncome = t.type === 'pemasukan';
                                const wallet = wallets.find(w => w.id === t.walletId);
                                return `
                                    <tr style="border-bottom: 1px solid var(--border)">
                                        <td>
                                            <div style="font-weight:700">${t.title}</div>
                                            <div style="font-size:11px; color:var(--text-muted)">
                                                <i class="fas ${wallet ? wallet.icon : 'fa-wallet'}"></i> ${wallet ? wallet.name : 'Unknown'} • ${Format.date(t.date)}
                                            </div>
                                        </td>
                                        <td style="text-align:right">
                                            <span class="${isIncome ? 'text-success' : 'text-danger'}" style="font-weight:800">
                                                ${isIncome ? '+' : '-'}${Format.rupiah(t.amount)}
                                            </span>
                                        </td>
                                        <td style="text-align:right">
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
                </div>
            </div>
        `;
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


