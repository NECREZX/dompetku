const DashboardAktivitas = {
    render(container) {
        const data = this.calculateData();
        container.innerHTML = `
            <div class="container slide-in">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h2 style="font-size:24px">Dashboard Aktivitas</h2>
                    </div>
                </div>

                <div class="card balance-card" style="background: #b07840; color: white; border: none; margin-bottom: 24px; padding: 28px; box-shadow: 0 10px 30px rgba(176, 120, 64, 0.3);">
                    <div class="card-title" style="color: rgba(255, 255, 255, 0.7); font-size: 11px;">Total Aktivitas Terdaftar</div>
                    <div class="card-value" style="color: white; font-size: 34px;">${data.totalNotes + data.totalReminders + data.totalWishlist}</div>
                </div>




                <div class="flex gap-2 mb-6">
                    <div class="card" style="flex:1; margin-bottom:0; padding: 12px; border: 1px solid var(--border); background: var(--surface); text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                        <div class="card-title" style="font-size: 10px; margin-bottom: 6px; width: 100%; color: var(--text);">Catatan</div>
                        <div style="font-weight: 800; font-size: 22px; line-height: 1; color: var(--text);">${data.totalNotes}</div>

                    </div>
                    <div class="card" style="flex:1; margin-bottom:0; padding: 12px; border: 1px solid var(--border); background: var(--surface); text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                        <div class="card-title" style="font-size: 10px; margin-bottom: 6px; width: 100%; color: var(--text);">Pengingat</div>
                        <div style="font-weight: 800; font-size: 22px; line-height: 1; color: var(--text);">${data.activeReminders}</div>

                    </div>
                    <div class="card" style="flex:1; margin-bottom:0; padding: 12px; border: 1px solid var(--border); background: var(--surface); text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                        <div class="card-title" style="font-size: 10px; margin-bottom: 6px; width: 100%; color: var(--text);">Wishlist</div>
                        <div style="font-weight: 800; font-size: 22px; line-height: 1; color: var(--text);">${data.activeWishlist}</div>

                    </div>
                </div>

                <br>
                <br>

                <h2 class="mb-4">Wishlist Bulan Ini</h2>
                <div id="wishlist-summary" class="mb-8">
                    ${this.renderWishlistSummary(data.monthlyWishlist)}
                </div>

                <br> 
                <h2 class="mb-4">Pengingat Mendatang</h2>
                <div id="upcoming-reminders" style="width: 100%;">
                    ${this.renderUpcomingReminders(data.upcoming)}
                </div>
                
                <br>
                <h2 class="mb-4">Komposisi Aktivitas</h2>
                <div class="card mb-6">
                    <div class="chart-container" style="height: 250px">
                        <canvas id="aktivitasChart"></canvas>
                    </div>
                </div>
            </div>
        `;
        
        this.renderCharts(data);
    },

    calculateData() {
        const activities = Storage.get(Storage.KEYS.AKTIVITAS);
        const wishlist = Storage.get(Storage.KEYS.WISHLIST);
        
        const notes = activities.filter(a => a.category === 'notes');
        const reminders = activities.filter(a => a.category === 'reminders');
        
        const now = new Date();
        const currentMonth = now.toISOString().substring(0, 7);
        
        const upcoming = reminders
            .filter(r => new Date(r.datetime) > now)
            .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
            .slice(0, 3);

        const monthlyWishlist = wishlist
            .filter(w => w.month === currentMonth && !w.achieved)
            .slice(0, 3);

        return {
            totalNotes: notes.length,
            totalReminders: reminders.length,
            totalWishlist: wishlist.length,
            activeReminders: reminders.filter(r => new Date(r.datetime) > now).length,
            activeWishlist: wishlist.filter(w => !w.achieved).length,
            upcoming,
            monthlyWishlist,
            stats: {
                notes: notes.length,
                reminders: reminders.length,
                wishlist: wishlist.length
            }
        };
    },

    renderWishlistSummary(items) {
        if (items.length === 0) {
            return `
                <div class="card p-8 text-center" style="border: 1px dashed var(--border); background: none;">
                    <p class="text-muted" style="font-size: 13px;">Belum ada target impian bulan ini.</p>

                </div>
            `;
        }

        return `
            <div class="card" style="padding: 0; overflow: hidden; border: 1px solid var(--border); background: var(--surface);">
                <div style="padding: 16px 20px; background: rgba(0, 0, 0, 0.03); border-bottom: 1px solid var(--border);">
                    <div style="font-size: 12px; font-weight: 800; color: var(--text); text-transform: uppercase; letter-spacing: 0.5px;">Daftar Impian Aktif</div>
                </div>

                <div>
                    ${items.map((item, index) => `
                        <div style="padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; ${index !== items.length - 1 ? 'border-bottom: 1px solid var(--border)' : ''}">
                            <div class="flex items-center gap-4">
                                <div>

                                    <div style="font-weight: 700; font-size: 14px; color: var(--text);">${item.title}</div>
                                </div>

                            </div>
                            <button onclick="RiwayatAktivitas.toggleWishlist('${item.id}')" style="background: var(--primary); color: white; border: none; padding: 6px 12px; border-radius: 8px; font-size: 10px; font-weight: 800; cursor: pointer;">
                                <i class="fas fa-check mr-1"></i> CAPAI
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    renderUpcomingReminders(reminders) {
        if (reminders.length === 0) {
            return `
                <div class="card p-8 text-center" style="border: 1px dashed var(--border); background: none;">
                    <p class="text-muted" style="font-size: 13px;">Semua tugas telah selesai!</p>

                </div>
            `;
        }

        return `
            <div class="card" style="padding: 0; overflow: hidden; border: 1px solid var(--border); background: var(--surface);">
                <div style="padding: 16px 20px; background: rgba(0, 0, 0, 0.03); border-bottom: 1px solid var(--border);">
                    <div style="font-size: 12px; font-weight: 800; color: var(--text); text-transform: uppercase; letter-spacing: 0.5px;">Garis Waktu Pengingat</div>
                </div>

                <div>
                    ${reminders.map((r, index) => {
                        const hasDate = r.datetime && r.datetime.includes('T');
                        return `
                        <div style="padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; ${index !== reminders.length - 1 ? 'border-bottom: 1px solid var(--border)' : ''}">
                            <div class="flex items-center gap-4">
                                <div>

                                <div style="font-weight: 700; font-size: 14px; color: var(--text);">${r.title}</div>

                                    <div style="font-size: 11px; color: var(--text-muted);">${hasDate ? Format.date(r.datetime.split('T')[0]) : ''}</div>
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 14px; font-weight: 800; color: var(--warning);">${hasDate ? r.datetime.split('T')[1] : ''}</div>
                                <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Waktu</div>
                            </div>
                        </div>
                    `;
                    }).join('')}
                </div>
            </div>
        `;
    },

    renderCharts(data) {
        const ctx = document.getElementById('aktivitasChart');
        if (!ctx) return;

        const isDark = document.body.classList.contains('dark-mode');
        const textColor = isDark ? '#f5f0e8' : '#000000';


        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Catatan', 'Pengingat', 'Wishlist'],
                datasets: [{
                    data: [data.stats.notes, data.stats.reminders, data.stats.wishlist],
                    backgroundColor: [
                        '#ff6363ff',
                        '#f59e0b',
                        '#ad44efff'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: textColor, usePointStyle: true, padding: 20, font: { family: 'Space Grotesk', weight: '700' } }
                    }
                },
                cutout: '70%'
            }
        });
    }
};
