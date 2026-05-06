const Export = {
    finance(customData = null, filterInfo = null) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const trx = customData || Storage.get(Storage.KEYS.TRANSAKSI);
        const categories = Storage.get(Storage.KEYS.KATEGORI);
        const sources = Storage.get(Storage.KEYS.SUMBER);
        
        // Header Colors & Styling
        const navyColor = [30, 58, 95]; // Soft Navy Blue (Synced)
        const primaryColor = [232, 105, 106]; // Coral for accents
        
        // Logo / App Name
        doc.setFontSize(28);
        doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('DompetKu', 14, 22);
        
        // Decorative line
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(1.5);
        doc.line(14, 25, 60, 25); 

        // Report Info
        doc.setFontSize(14);
        doc.setTextColor(60, 60, 60);
        doc.setFont('helvetica', 'normal');
        doc.text('Laporan Keuangan Personal', 14, 38);
        
        doc.setFontSize(9);
        doc.setTextColor(100);
        const filterText = filterInfo ? `Filter: ${filterInfo.type.toUpperCase()} | Dompet: ${filterInfo.wallet || 'Semua'} | Periode: ${filterInfo.month}` : 'Semua Transaksi';
        doc.text(filterText, 14, 45);
        doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 50);

        // Summary Calculation
        let totalIncome = 0;
        let totalExpense = 0;

        const tableData = trx.map(t => {
            const amount = Number(t.amount);
            if (t.type === 'pemasukan') totalIncome += amount;
            else totalExpense += amount;

            let subLabel = '-';
            if (t.type === 'pemasukan') {
                const source = sources.find(s => s.id === t.sourceId);
                subLabel = source ? source.name : 'Tanpa Sumber';
            } else {
                const category = categories.find(c => c.id === t.categoryId);
                subLabel = category ? category.name : 'Tanpa Kategori';
            }

            return [
                Format.date(t.date),
                t.title,
                subLabel,
                t.type.toUpperCase(),
                Format.rupiah(amount)
            ];
        });

        // Main Table
        doc.autoTable({
            startY: 58,
            head: [['Tanggal', 'Judul', 'Keterangan', 'Tipe', 'Jumlah']],
            body: tableData,
            theme: 'grid',
            headStyles: { 
                fillColor: navyColor, 
                textColor: [255, 255, 255], 
                fontStyle: 'bold',
                halign: 'center'
            },
            styles: { fontSize: 8.5, cellPadding: 3, lineColor: [230, 230, 230] },
            columnStyles: {
                0: { halign: 'center' },
                3: { halign: 'center' },
                4: { fontStyle: 'bold', halign: 'right' }
            },
            didParseCell: function(data) {
                if (data.section === 'body') {
                    const type = data.row.raw[3]; // Index 3 is 'TIPE'
                    if (type === 'PEMASUKAN') {
                        data.cell.styles.fillColor = [240, 253, 244]; // Soft Green BG
                        data.cell.styles.textColor = [16, 60, 40]; // Dark Green Text
                    } else if (type === 'PENGELUARAN') {
                        data.cell.styles.fillColor = [254, 242, 242]; // Soft Red BG
                        data.cell.styles.textColor = [120, 20, 20]; // Dark Red Text
                    }
                }
            }
        });

        // Summary Section - Enhanced Layout
        let finalY = doc.lastAutoTable.finalY + 15;
        const pageWidth = doc.internal.pageSize.width;
        
        // Prevent overlap if summary goes to next page
        if (finalY > 240) {
            doc.addPage();
            finalY = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('RINGKASAN LAPORAN', 14, finalY);

        const netBalance = totalIncome - totalExpense;
        const cardWidth = (pageWidth - 28 - 10) / 3; // 3 cards with 5mm gap
        
        // Income Card
        doc.setDrawColor(200);
        doc.setFillColor(255);
        doc.roundedRect(14, finalY + 5, cardWidth, 25, 2, 2, 'FD');
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text('TOTAL PEMASUKAN', 14 + 5, finalY + 12);
        doc.setFontSize(11);
        doc.setTextColor(16, 185, 129);
        doc.text(Format.rupiah(totalIncome), 14 + 5, finalY + 22);

        // Expense Card
        doc.setFillColor(255);
        doc.roundedRect(14 + cardWidth + 5, finalY + 5, cardWidth, 25, 2, 2, 'FD');
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text('TOTAL PENGELUARAN', 14 + cardWidth + 5 + 5, finalY + 12);
        doc.setFontSize(11);
        doc.setTextColor(239, 68, 68);
        doc.text(Format.rupiah(totalExpense), 14 + cardWidth + 5 + 5, finalY + 22);

        // Net Balance Card
        const balanceColor = netBalance >= 0 ? navyColor : [232, 105, 106];
        doc.setFillColor(balanceColor[0], balanceColor[1], balanceColor[2]);
        doc.roundedRect(14 + (cardWidth + 5) * 2, finalY + 5, cardWidth, 25, 2, 2, 'F');
        doc.setFontSize(8);
        doc.setTextColor(255);
        doc.text('SALDO AKHIR (NET)', 14 + (cardWidth + 5) * 2 + 5, finalY + 12);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(Format.rupiah(netBalance), 14 + (cardWidth + 5) * 2 + 5, finalY + 22);

        // Add Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.setDrawColor(230);
            doc.line(14, doc.internal.pageSize.height - 15, pageWidth - 14, doc.internal.pageSize.height - 15);
            doc.text('Laporan ini dibuat otomatis oleh sistem DompetKu', 14, doc.internal.pageSize.height - 10);
            doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth - 35, doc.internal.pageSize.height - 10);
        }

        doc.save(`DompetKu_Laporan_${Date.now()}.pdf`);
    },

    savings() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const logs = Storage.get(Storage.KEYS.TABUNGAN_LOG);
        const goals = Storage.get(Storage.KEYS.TABUNGAN);
        
        const navyColor = [30, 58, 95]; // Soft Navy Blue (Synced)
        const primaryColor = [232, 105, 106]; // Coral
        
        doc.setFontSize(26);
        doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('DompetKu', 14, 22);
        
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(1.2);
        doc.line(14, 25, 50, 25);

        doc.setFontSize(14);
        doc.setTextColor(60, 60, 60);
        doc.setFont('helvetica', 'normal');
        doc.text('Laporan Riwayat Tabungan', 14, 38);
        
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 45);

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
            startY: 55,
            head: [['Tanggal', 'Tujuan', 'Tipe', 'Jumlah', 'Catatan']],
            body: tableData,
            theme: 'grid',
            headStyles: { 
                fillColor: navyColor, 
                textColor: [255, 255, 255],
                halign: 'center'
            },
            styles: { fontSize: 8.5, cellPadding: 3, lineColor: [230, 230, 230] },
            columnStyles: {
                0: { halign: 'center' },
                2: { halign: 'center' },
                3: { fontStyle: 'bold', halign: 'right' }
            },
            didParseCell: function(data) {
                if (data.section === 'body') {
                    const type = data.row.raw[2];
                    if (type === 'MASUK') {
                        data.cell.styles.fillColor = [240, 253, 244]; // Soft Green BG
                        data.cell.styles.textColor = [16, 60, 40]; // Dark Green Text
                    } else {
                        data.cell.styles.fillColor = [254, 242, 242]; // Soft Red BG
                        data.cell.styles.textColor = [120, 20, 20]; // Dark Red Text
                    }
                }
            }
        });

        // Footer
        const pageWidth = doc.internal.pageSize.width;
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.setDrawColor(230);
            doc.line(14, doc.internal.pageSize.height - 15, pageWidth - 14, doc.internal.pageSize.height - 15);
            doc.text('Laporan ini dibuat otomatis oleh sistem DompetKu', 14, doc.internal.pageSize.height - 10);
            doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth - 35, doc.internal.pageSize.height - 10);
        }

        doc.save(`DompetKu_Tabungan_${Date.now()}.pdf`);
    }
};
