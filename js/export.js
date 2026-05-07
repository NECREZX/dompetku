const Export = {
    finance(customData = null, filterInfo = null) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const trx = customData || Storage.get(Storage.KEYS.TRANSAKSI);
        const categories = Storage.get(Storage.KEYS.KATEGORI);
        const sources = Storage.get(Storage.KEYS.SUMBER);
        
        // Header Colors & Styling
        const darkColor = [176, 120, 64]; // Wood Brown instead of Dark Brown
        const woodColor = [176, 120, 64]; 
        
        // Logo / App Name
        doc.setFontSize(28);
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('DompetKu', 14, 22);

        
        // Decorative line
        doc.setDrawColor(woodColor[0], woodColor[1], woodColor[2]);
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
                fillColor: [245, 240, 232], 
                textColor: [60, 60, 60], 
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

        // Summary Title
        doc.setFontSize(11);
        doc.setTextColor(60, 60, 60);
        doc.setFont('helvetica', 'bold');
        doc.text('RINGKASAN LAPORAN', 14, finalY);

        const cardHeight = 22;
        const netBalance = totalIncome - totalExpense;
        const cardWidth = (pageWidth - 28 - 10) / 3;
        const bgCream = [250, 248, 245]; // Even softer cream

        // Function to draw a clean summary card (SOFT STYLE ONLY)
        const drawCard = (x, y, label, value, valueColor) => {
            doc.setFillColor(bgCream[0], bgCream[1], bgCream[2]);
            doc.setDrawColor(220, 220, 220);
            doc.roundedRect(x, y + 4, cardWidth, cardHeight, 1.5, 1.5, 'FD');
            
            // Side indicator line for premium feel
            doc.setDrawColor(valueColor[0], valueColor[1], valueColor[2]);
            doc.setLineWidth(1);
            doc.line(x + 1, y + 6, x + 1, y + 4 + cardHeight - 2);

            doc.setTextColor(120, 120, 120);
            doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.text(label, x + 5, y + 10);
            doc.setTextColor(valueColor[0], valueColor[1], valueColor[2]);
            doc.setFontSize(11); doc.text(Format.rupiah(value), x + 5, y + 18);
        };

        drawCard(14, finalY, 'TOTAL PEMASUKAN', totalIncome, [16, 150, 100]); // Darker green
        drawCard(14 + cardWidth + 5, finalY, 'TOTAL PENGELUARAN', totalExpense, [200, 50, 50]); // Darker red
        
        const netColor = netBalance >= 0 ? [140, 100, 60] : [200, 50, 50]; // Muted brown for net
        drawCard(14 + (cardWidth + 5) * 2, finalY, 'SISA SALDO (NET)', netBalance, netColor);


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
        
        const darkColor = [176, 120, 64];
        const woodColor = [176, 120, 64];
        
        doc.setFontSize(26);
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('DompetKu', 14, 22);
        
        doc.setDrawColor(woodColor[0], woodColor[1], woodColor[2]);
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

        // Main Table
        doc.autoTable({
            startY: 55,
            head: [['Tanggal', 'Tujuan', 'Tipe', 'Jumlah', 'Catatan']],
            body: tableData,
            theme: 'grid',
            headStyles: { 
                fillColor: [245, 240, 232], 
                textColor: [60, 60, 60],
                fontStyle: 'bold',
                halign: 'center'
            },

            styles: { fontSize: 8.5, cellPadding: 3, lineColor: [235, 235, 235] },
            columnStyles: {
                0: { halign: 'center', cellWidth: 25 },
                2: { halign: 'center', cellWidth: 20 },
                3: { fontStyle: 'bold', halign: 'right', cellWidth: 35 }
            },
            didParseCell: function(data) {
                if (data.section === 'body') {
                    const type = data.row.raw[2];
                    if (type === 'MASUK') {
                        data.cell.styles.fillColor = [240, 253, 244]; 
                        data.cell.styles.textColor = [16, 60, 40]; 
                    } else {
                        data.cell.styles.fillColor = [254, 242, 242]; 
                        data.cell.styles.textColor = [120, 20, 20]; 
                    }
                }
            }
        });

        // Summary for Savings
        let finalY = doc.lastAutoTable.finalY + 15;
        const pageWidth = doc.internal.pageSize.width;
        let totalIn = logs.filter(l => l.type === 'masuk').reduce((a, b) => a + Number(b.amount), 0);
        let totalOut = logs.filter(l => l.type === 'keluar').reduce((a, b) => a + Number(b.amount), 0);
        
        doc.setFontSize(11);
        doc.setTextColor(60, 60, 60);
        doc.setFont('helvetica', 'bold');
        doc.text('RINGKASAN TABUNGAN', 14, finalY);

        const cardWidth = (pageWidth - 28 - 10) / 3;
        const cardHeight = 22;
        const bgCream = [250, 248, 245];

        const drawCard = (x, y, label, value, valueColor) => {
            doc.setFillColor(bgCream[0], bgCream[1], bgCream[2]);
            doc.setDrawColor(220, 220, 220);
            doc.roundedRect(x, y + 4, cardWidth, cardHeight, 1.5, 1.5, 'FD');
            
            doc.setDrawColor(valueColor[0], valueColor[1], valueColor[2]);
            doc.setLineWidth(1);
            doc.line(x + 1, y + 6, x + 1, y + 4 + cardHeight - 2);

            doc.setTextColor(120, 120, 120);
            doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.text(label, x + 5, y + 10);
            doc.setTextColor(valueColor[0], valueColor[1], valueColor[2]);
            doc.setFontSize(11); doc.text(Format.rupiah(value), x + 5, y + 18);
        };

        drawCard(14, finalY, 'TOTAL MASUK', totalIn, [16, 150, 100]);
        drawCard(14 + cardWidth + 5, finalY, 'TOTAL KELUAR', totalOut, [200, 50, 50]);
        drawCard(14 + (cardWidth + 5) * 2, finalY, 'SALDO TABUNGAN', totalIn - totalOut, [140, 100, 60]);

        // Footer
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
