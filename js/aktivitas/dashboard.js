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

                <div class="card balance-card" style="background: linear-gradient(135deg, var(--primary), var(--accent)); color: white; border: none; margin-bottom: 24px; padding: 28px;">
                    <div class="card-title" style="color: rgba(255,255,255,0.7); font-size: 11px;">Total Aktivitas Terdaftar</div>
                    <div class="card-value" style="color: white; font-size: 34px;">${data.totalNotes + data.stats.reminders}</div>
                </div>

                <div class="flex gap-4 mb-6">
                    <div class="card" style="flex:1; margin-bottom:0; padding: 18px; border: 1px solid var(--border); background: var(--surface);">
                        <div class="card-title" style="font-size: 10px; margin-bottom: 8px;">Total Catatan</div>
                        <div class="flex items-center gap-2">
                             <div style="width: 28px; height: 28px; border-radius: 6px; background: rgba(59, 130, 246, 0.1); display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-file-pen text-accent" style="font-size: 12px;"></i>
                             </div>
                             <span class="text-primary" style="font-weight: 800; font-size: 18px;">${data.totalNotes}</span>
                        </div>
                    </div>
                    <div class="card" style="flex:1; margin-bottom:0; padding: 18px; border: 1px solid var(--border); background: var(--surface);">
                        <div class="card-title" style="font-size: 10px; margin-bottom: 8px;">Pengingat Aktif</div>
                        <div class="flex items-center gap-2">
                             <div style="width: 28px; height: 28px; border-radius: 6px; background: rgba(245, 158, 11, 0.1); display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-bell text-warning" style="font-size: 12px;"></i>
                             </div>
                             <span class="text-primary" style="font-weight: 800; font-size: 18px;">${data.activeReminders}</span>
                        </div>
                    </div>
                </div>

                <br>
                <br>

                <h2 class="mb-4">Ringkasan Aktivitas</h2>
                <div class="card mb-6">
                    <div class="chart-container" style="height: 250px">
                        <canvas id="aktivitasChart"></canvas>
                    </div>
                </div>

                <br>

                <h2 class="mb-4">Pengingat Mendatang</h2>
                <div id="upcoming-reminders" style="width: 100%;">
                    ${this.renderUpcomingReminders(data.upcoming)}
                </div>
            </div>
        `;
        
        this.renderCharts(data);
    },

    calculateData() {
        const activities = Storage.get(Storage.KEYS.AKTIVITAS);
        const notes = activities.filter(a => a.category === 'notes');
        const reminders = activities.filter(a => a.category === 'reminders');
        
        const now = new Date();
        const upcoming = reminders
            .filter(r => new Date(r.datetime) > now)
            .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
            .slice(0, 3);

        return {
            totalNotes: notes.length,
            activeReminders: reminders.filter(r => new Date(r.datetime) > now).length,
            upcoming,
            stats: {
                notes: notes.length,
                reminders: reminders.length
            }
        };
    },

    renderUpcomingReminders(reminders) {
        if (reminders.length === 0) {
            return `
                <div class="card p-8 text-center" style="border: 1px dashed var(--border); background: none;">
                    <i class="fas fa-calendar-check mb-2 text-muted" style="font-size: 24px; opacity: 0.5;"></i>
                    <p class="text-muted" style="font-size: 13px;">Semua tugas telah selesai!</p>
                </div>
            `;
        }

        return `
            <div class="card" style="padding: 0; overflow: hidden; border: 1px solid var(--border);">
                <div style="padding: 16px 20px; background: #fcfdfe; border-bottom: 1px solid var(--border);">
                    <div style="font-size: 12px; font-weight: 800; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px;">Garis Waktu Pengingat</div>
                </div>
                <div>
                    ${reminders.map((r, index) => {
                        const hasDate = r.datetime && r.datetime.includes('T');
                        return `
                        <div style="padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; ${index !== reminders.length - 1 ? 'border-bottom: 1px solid var(--border)' : ''}">
                            <div class="flex items-center gap-4">
                                <div style="width: 40px; height: 40px; border-radius: 12px; background: rgba(245, 158, 11, 0.1); display: flex; align-items: center; justify-content: center;">
                                    <i class="fas fa-clock text-warning" style="font-size: 16px;"></i>
                                </div>
                                <div>
                                    <div style="font-weight: 700; font-size: 14px; color: var(--primary);">${r.title}</div>
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
        const textColor = isDark ? '#94a3b8' : '#64748b';

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Catatan (Notes)', 'Pengingat (Reminders)'],
                datasets: [{
                    data: [data.stats.notes, data.stats.reminders],
                    backgroundColor: [
                        getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#3b82f6',
                        getComputedStyle(document.documentElement).getPropertyValue('--warning').trim() || '#f59e0b'
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
                        labels: { color: textColor, usePointStyle: true, padding: 20 }
                    }
                },
                cutout: '70%'
            }
        });
    }
};
