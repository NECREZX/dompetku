const Export = {
    finance(customData = null, filterInfo = null) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const trx = customData || Storage.get(Storage.KEYS.TRANSAKSI);
        
        // Header Colors & Styling
        const primaryColor = [30, 41, 59]; // Deep Navy
        
        // Logo / App Name
        doc.setFontSize(22);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('DompetKu', 14, 20);
        
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(0.5);
        doc.line(14, 23, 60, 23);

        // Report Info
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('Laporan Riwayat Keuangan', 14, 35);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        const filterText = filterInfo ? `Filter: ${filterInfo.type.toUpperCase()} | Periode: ${filterInfo.month}` : 'Semua Transaksi';
        doc.text(filterText, 14, 42);
        doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 47);

        // Summary Calculation
        let totalIncome = 0;
        let totalExpense = 0;

        const tableData = trx.map(t => {
            const amount = Number(t.amount);
            if (t.type === 'pemasukan') totalIncome += amount;
            else totalExpense += amount;

            return [
                Format.date(t.date),
                t.title,
                t.type.toUpperCase(),
                Format.rupiah(amount)
            ];
        });

        // Main Table
        doc.autoTable({
            startY: 55,
            head: [['Tanggal', 'Judul', 'Tipe', 'Jumlah']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 10 },
            columnStyles: {
                3: { fontStyle: 'bold', halign: 'right' }
            },
            didParseCell: function(data) {
                if (data.section === 'body') {
                    const type = data.row.raw[2]; // Index 2 is 'TIPE'
                    if (type === 'PEMASUKAN') {
                        data.cell.styles.fillColor = [240, 253, 244]; // Soft Green
                    } else if (type === 'PENGELUARAN') {
                        data.cell.styles.fillColor = [254, 242, 242]; // Soft Red
                    }
                }
            }
        });

        // Summary Section at the end
        const finalY = doc.lastAutoTable.finalY + 10;
        
        doc.setFontSize(11);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('Ringkasan Laporan:', 14, finalY);

        doc.autoTable({
            startY: finalY + 5,
            body: [
                ['Total Pemasukan', Format.rupiah(totalIncome)],
                ['Total Pengeluaran', Format.rupiah(totalExpense)],
                ['Selisih (Net)', Format.rupiah(totalIncome - totalExpense)]
            ],
            theme: 'plain',
            styles: { fontSize: 10, cellPadding: 2 },
            columnStyles: {
                0: { fontStyle: 'normal', width: 40 },
                1: { fontStyle: 'bold', halign: 'right' }
            },
            didParseCell: function(data) {
                if (data.row.index === 2) {
                    const diff = totalIncome - totalExpense;
                    data.cell.styles.fillColor = diff >= 0 ? [220, 252, 231] : [254, 226, 226];
                }
            }
        });

        doc.save(`DompetKu_Laporan_${Date.now()}.pdf`);
    },

    savings() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const logs = Storage.get(Storage.KEYS.TABUNGAN_LOG);
        const goals = Storage.get(Storage.KEYS.TABUNGAN);
        
        doc.setFontSize(18);
        doc.setTextColor(30, 41, 59);
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
