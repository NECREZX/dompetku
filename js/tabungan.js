const KelolaTabungan = {
    render(container) {
        const goals = Storage.get(Storage.KEYS.TABUNGAN);
        container.innerHTML = `
            <div class="container slide-in">
                <h2>Dana Tabungan</h2>
                
                <br>

                <div class="card">
                    <div class="form-group">
                        <label>Pilih Tujuan</label>
                        <select id="kelola-goal" onchange="KelolaTabungan.renderBalance()">
                            ${goals.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
                        </select>
                    </div>
                    <div id="kelola-balance-info" class="mb-4"></div>
                </div>

                <div class="flex gap-4">
                    <button class="btn btn-primary" onclick="KelolaTabungan.showActionModalFromSelect('setor')">
                        <i class="fas fa-hand-holding-dollar"></i> Setor Dana
                    </button>
                    <button class="btn btn-secondary" onclick="KelolaTabungan.showActionModalFromSelect('tarik')">
                        <i class="fas fa-hand-holding-hand"></i> Tarik Dana
                    </button>
                </div>
            </div>
        `;
        this.renderBalance();
    },

    renderBalance() {
        const goalId = document.getElementById('kelola-goal').value;
        const goal = Storage.get(Storage.KEYS.TABUNGAN).find(g => g.id === goalId);
        const info = document.getElementById('kelola-balance-info');
        if (goal) {
            info.innerHTML = `
                <div class="flex justify-between items-center p-4 bg-background rounded-lg">
                    <span style="font-weight:600">Saldo Saat Ini:</span>
                    <span style="font-weight:800; color:var(--primary); font-size:18px">${Format.rupiah(goal.collected)}</span>
                </div>
            `;
        }
    },

    showActionModalFromSelect(type) {
        const goalId = document.getElementById('kelola-goal').value;
        this.showActionModal(goalId, type);
    },

    showActionModal(goalId, type) {
        const goal = Storage.get(Storage.KEYS.TABUNGAN).find(g => g.id === goalId);
        if (!goal) return;

        UI.showModal(`${type === 'setor' ? 'Setor' : 'Tarik'} Dana: ${goal.name}`, `
            <form onsubmit="KelolaTabungan.processAction(event, '${goalId}', '${type}')">
                <div class="form-group">
                    <label>Jumlah (Rp)</label>
                    <input type="number" id="act-amount" required placeholder="0">
                </div>
                <div class="form-group">
                    <label>Tanggal</label>
                    <input type="date" id="act-date" value="${Format.toHTMLDate(new Date())}" required>
                </div>
                <div class="form-group">
                    <label>Catatan (Opsional)</label>
                    <input type="text" id="act-note" placeholder="Contoh: Sisa uang saku">
                </div>
                <button type="submit" class="btn btn-primary">${type === 'setor' ? 'Konfirmasi Setor' : 'Konfirmasi Tarik'}</button>
            </form>
        `);
    },

    processAction(e, goalId, type) {
        e.preventDefault();
        const amount = Number(document.getElementById('act-amount').value);
        const date = document.getElementById('act-date').value;
        const note = document.getElementById('act-note').value;
        
        let goals = Storage.get(Storage.KEYS.TABUNGAN);
        const goalIndex = goals.findIndex(g => g.id === goalId);
        
        if (type === 'tarik' && goals[goalIndex].collected < amount) {
            Swal.fire({
                title: 'Saldo Tidak Cukup!',
                text: 'Jumlah penarikan melebihi saldo tabungan yang tersedia.',
                icon: 'error',
                confirmButtonColor: 'var(--primary)',
            });
            return;
        }

        // Update Goal Balance
        if (type === 'setor') goals[goalIndex].collected += amount;
        else goals[goalIndex].collected -= amount;

        Storage.set(Storage.KEYS.TABUNGAN, goals);

        // Record Log
        const logs = Storage.get(Storage.KEYS.TABUNGAN_LOG);
        logs.push({
            id: Date.now().toString(),
            goalId,
            amount,
            date,
            type,
            note
        });
        Storage.set(Storage.KEYS.TABUNGAN_LOG, logs);
        
        // Add Notification
        const goalName = goals[goalIndex].name;
        Storage.addNotif(
            type === 'setor' ? 'Tabungan Bertambah' : 'Tabungan Ditarik',
            `Berhasil ${type === 'setor' ? 'menyetor' : 'menarik'} ${Format.rupiah(amount)} untuk target ${goalName}`
        );

        UI.hideModal();
        
        Swal.fire({
            title: type === 'setor' ? 'Setoran Berhasil' : 'Penarikan Berhasil',
            text: `Dana sebesar ${Format.rupiah(amount)} telah diproses.`,
            icon: 'success',
            confirmButtonColor: 'var(--primary)',
        });

        App.loadContent();
    }
};
