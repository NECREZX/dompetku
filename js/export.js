const Export = {
    finance() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const trx = Storage.get(Storage.KEYS.TRANSAKSI);
        
        doc.setFontSize(18);
        doc.text('Laporan Riwayat Keuangan — DompetKu', 14, 22);
        
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 30);

        const tableData = trx.map(t => [
            Format.date(t.date),
            t.title,
            t.type.toUpperCase(),
            Format.rupiah(t.amount),
            t.note || '-'
        ]);

        doc.autoTable({
            startY: 38,
            head: [['Tanggal', 'Judul', 'Tipe', 'Jumlah', 'Catatan']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [30, 41, 59] }
        });

        doc.save(`DompetKu_Keuangan_${Date.now()}.pdf`);
    },

    savings() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const logs = Storage.get(Storage.KEYS.TABUNGAN_LOG);
        const goals = Storage.get(Storage.KEYS.TABUNGAN);
        
        doc.setFontSize(18);
        doc.text('Laporan Riwayat Tabungan — DompetKu', 14, 22);
        
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 30);

        const tableData = logs.map(l => {
            const goal = goals.find(g => g.id === l.goalId);
            return [
                Format.date(l.date),
                goal ? goal.name : 'Unknown',
                l.type.toUpperCase(),
                Format.rupiah(l.amount),
                l.note || '-'
            ];
        });

        doc.autoTable({
            startY: 38,
            head: [['Tanggal', 'Tujuan', 'Tipe', 'Jumlah', 'Catatan']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [30, 41, 59] }
        });

        doc.save(`DompetKu_Tabungan_${Date.now()}.pdf`);
    }
};
