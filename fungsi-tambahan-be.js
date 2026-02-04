// FUNGSI TAMBAHAN BACKEND
// File: fungsi-tambahan-be.js
// Export data ke Excel dengan template profesional

import ExcelJS from 'exceljs';
import { reviewPemasukanPengeluaranBulanan } from './manajemen-keuangan.js';

// ==========================================
// FUNGSI: EXPORT KE EXCEL
// ==========================================

/**
 * Export data review bulanan ke Excel dengan format profesional
 * Template sesuai contoh: Laporan Kas Masuk dan Kas Keluar
 * @param {number} bulan - Bulan (1-12)
 * @param {number} tahun - Tahun
 * @returns {Promise<object>} Hasil export
 */
export const exportKeExcel = async (bulan, tahun) => {
  try {
    // Ambil data dari fungsi reviewPemasukanPengeluaranBulanan
    const data = await reviewPemasukanPengeluaranBulanan(bulan, tahun);

    const pemasukanList = data.pemasukan.kategoriList || [];
    const pengeluaranList = data.pengeluaran.kategoriList || [];
    const totalPemasukan = data.pemasukan.totalKeseluruhan;
    const totalPengeluaran = data.pengeluaran.totalKeseluruhan;
    const saldo = data.saldo;

    const namaBulan = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const namaBln = namaBulan[bulan - 1];

    // ========================================
    // CREATE WORKBOOK & WORKSHEET
    // ========================================
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`${namaBln}_${tahun}`);

    // ========================================
    // SET COLUMN WIDTHS
    // ========================================
    worksheet.columns = [
      { width: 25 },  // A - Kategori Pemasukan
      { width: 18 },  // B - Jumlah Pemasukan
      { width: 25 },  // C - Kategori Pengeluaran
      { width: 18 }   // D - Jumlah Pengeluaran
    ];

    // ========================================
    // DEFINE REUSABLE STYLES
    // ========================================

    // Title Style
    const titleStyle = {
      font: { name: 'Arial', size: 16, bold: true, color: { argb: 'FF1F4E78' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } }
    };

    // Subtitle Style
    const subtitleStyle = {
      font: { name: 'Arial', size: 12, bold: true },
      alignment: { horizontal: 'center', vertical: 'middle' }
    };

    // Periode Style
    const periodeStyle = {
      font: { name: 'Arial', size: 10, bold: true },
      alignment: { horizontal: 'left', vertical: 'middle' }
    };

    // Table Header Style (PEMASUKAN/PENGELUARAN)
    const tableHeaderStyle = {
      font: { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } },
      border: {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'medium', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        right: { style: 'medium', color: { argb: 'FF000000' } }
      }
    };

    // Column Header Style (Kategori/Jumlah)
    const columnHeaderStyle = {
      font: { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF5B9BD5' } },
      border: {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      }
    };

    // Data Cell Style - Kategori
    const dataCellKategoriStyle = {
      font: { name: 'Arial', size: 10 },
      alignment: { horizontal: 'left', vertical: 'middle' },
      border: {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      }
    };

    // Data Cell Style - Jumlah
    const dataCellJumlahStyle = {
      font: { name: 'Arial', size: 10 },
      alignment: { horizontal: 'right', vertical: 'middle' },
      border: {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      },
      numFmt: '#,##0'
    };

    // Total Row Style
    const totalLabelStyle = {
      font: { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } },
      border: {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'medium', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        right: { style: 'medium', color: { argb: 'FF000000' } }
      }
    };

    const totalValueStyle = {
      font: { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } },
      alignment: { horizontal: 'right', vertical: 'middle' },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } },
      border: {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'medium', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        right: { style: 'medium', color: { argb: 'FF000000' } }
      },
      numFmt: '#,##0'
    };

    // Saldo Row Style
    const saldoColor = saldo >= 0 ? 'FF4472C4' : 'FFC00000';
    const saldoLabelStyle = {
      font: { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: saldoColor } },
      border: {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'medium', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        right: { style: 'medium', color: { argb: 'FF000000' } }
      }
    };

    const saldoValueStyle = {
      font: { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } },
      alignment: { horizontal: 'right', vertical: 'middle' },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: saldoColor } },
      border: {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'medium', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        right: { style: 'medium', color: { argb: 'FF000000' } }
      },
      numFmt: '#,##0'
    };

    // Footer Style
    const footerStyle = {
      font: { name: 'Arial', size: 10, bold: true },
      alignment: { horizontal: 'center', vertical: 'top' }
    };

    const footerNameStyle = {
      font: { name: 'Arial', size: 10, bold: true },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: { bottom: { style: 'thin', color: { argb: 'FF000000' } } }
    };

    const footerNBMStyle = {
      font: { name: 'Arial', size: 9 },
      alignment: { horizontal: 'center', vertical: 'middle' }
    };

    // ========================================
    // BUILD CONTENT
    // ========================================
    let currentRow = 1;

    // Row 1: Title
    worksheet.mergeCells('A1:D1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'LAPORAN KAS MASUK DAN KAS KELUAR';
    Object.assign(titleCell, titleStyle);
    worksheet.getRow(1).height = 25;
    currentRow++;

    // Row 2: Subtitle
    worksheet.mergeCells('A2:D2');
    const subtitleCell = worksheet.getCell('A2');
    subtitleCell.value = 'SMP Muhammadiyah Karangampel';
    Object.assign(subtitleCell, subtitleStyle);
    worksheet.getRow(2).height = 18;
    currentRow++;

    // Row 3: Blank
    currentRow++;

    // Row 4: Periode
    worksheet.mergeCells('A4:B4');
    worksheet.mergeCells('C4:D4');
    const bulanCell = worksheet.getCell('A4');
    bulanCell.value = `Bulan : ${namaBln}`;
    Object.assign(bulanCell, periodeStyle);
    const tahunCell = worksheet.getCell('C4');
    tahunCell.value = `Tahun : ${tahun}`;
    Object.assign(tahunCell, periodeStyle);
    currentRow++;

    // Row 5: Blank
    currentRow++;

    // Row 6: Table Headers
    const headerRow = currentRow;
    worksheet.mergeCells(`A${headerRow}:B${headerRow}`);
    worksheet.mergeCells(`C${headerRow}:D${headerRow}`);
    const pemasukanHeader = worksheet.getCell(`A${headerRow}`);
    pemasukanHeader.value = 'PEMASUKAN';
    Object.assign(pemasukanHeader, tableHeaderStyle);
    const pengeluaranHeader = worksheet.getCell(`C${headerRow}`);
    pengeluaranHeader.value = 'PENGELUARAN';
    Object.assign(pengeluaranHeader, tableHeaderStyle);
    worksheet.getRow(headerRow).height = 20;
    currentRow++;

    // Row 7: Column Headers
    const colHeaderRow = currentRow;
    worksheet.getCell(`A${colHeaderRow}`).value = 'Kategori';
    Object.assign(worksheet.getCell(`A${colHeaderRow}`), columnHeaderStyle);
    worksheet.getCell(`B${colHeaderRow}`).value = 'Jumlah (Rp)';
    Object.assign(worksheet.getCell(`B${colHeaderRow}`), columnHeaderStyle);
    worksheet.getCell(`C${colHeaderRow}`).value = 'Kategori';
    Object.assign(worksheet.getCell(`C${colHeaderRow}`), columnHeaderStyle);
    worksheet.getCell(`D${colHeaderRow}`).value = 'Jumlah (Rp)';
    Object.assign(worksheet.getCell(`D${colHeaderRow}`), columnHeaderStyle);
    worksheet.getRow(colHeaderRow).height = 18;
    currentRow++;

    // Data Rows
    const maxRows = Math.max(pemasukanList.length, pengeluaranList.length);
    for (let i = 0; i < maxRows; i++) {
      const pemasukan = pemasukanList[i];
      const pengeluaran = pengeluaranList[i];

      // Pemasukan - Kategori
      const cellA = worksheet.getCell(`A${currentRow}`);
      cellA.value = pemasukan ? pemasukan.namaKategori : '';
      Object.assign(cellA, dataCellKategoriStyle);

      // Pemasukan - Jumlah
      const cellB = worksheet.getCell(`B${currentRow}`);
      cellB.value = pemasukan ? Number(pemasukan.jumlahTotal) : '';
      Object.assign(cellB, dataCellJumlahStyle);

      // Pengeluaran - Kategori
      const cellC = worksheet.getCell(`C${currentRow}`);
      cellC.value = pengeluaran ? pengeluaran.namaKategori : '';
      Object.assign(cellC, dataCellKategoriStyle);

      // Pengeluaran - Jumlah
      const cellD = worksheet.getCell(`D${currentRow}`);
      cellD.value = pengeluaran ? Number(pengeluaran.jumlahTotal) : '';
      Object.assign(cellD, dataCellJumlahStyle);

      currentRow++;
    }

    // Total Row
    const totalRow = currentRow;
    const totalPemasukanCell = worksheet.getCell(`A${totalRow}`);
    totalPemasukanCell.value = 'TOTAL PEMASUKAN';
    Object.assign(totalPemasukanCell, totalLabelStyle);

    const totalPemasukanValue = worksheet.getCell(`B${totalRow}`);
    totalPemasukanValue.value = totalPemasukan;
    Object.assign(totalPemasukanValue, totalValueStyle);

    const totalPengeluaranCell = worksheet.getCell(`C${totalRow}`);
    totalPengeluaranCell.value = 'TOTAL PENGELUARAN';
    Object.assign(totalPengeluaranCell, totalLabelStyle);

    const totalPengeluaranValue = worksheet.getCell(`D${totalRow}`);
    totalPengeluaranValue.value = totalPengeluaran;
    Object.assign(totalPengeluaranValue, totalValueStyle);

    worksheet.getRow(totalRow).height = 20;
    currentRow++;

    // Saldo Row
    const saldoRow = currentRow;
    const saldoText = saldo >= 0 ? 'SALDO (SURPLUS)' : 'SALDO (DEFISIT)';
    
    worksheet.mergeCells(`A${saldoRow}:B${saldoRow}`);
    worksheet.mergeCells(`C${saldoRow}:D${saldoRow}`);
    
    const saldoLabelCell = worksheet.getCell(`A${saldoRow}`);
    saldoLabelCell.value = saldoText;
    Object.assign(saldoLabelCell, saldoLabelStyle);

    const saldoValueCell = worksheet.getCell(`C${saldoRow}`);
    saldoValueCell.value = saldo;
    Object.assign(saldoValueCell, saldoValueStyle);

    worksheet.getRow(saldoRow).height = 20;
    currentRow++;

    // Blank rows
    currentRow++;
    currentRow++;

    // Footer - Tanda Tangan
    const ttRow1 = currentRow;
    const mengetahuiCell = worksheet.getCell(`A${ttRow1}`);
    mengetahuiCell.value = 'Mengetahui,';
    Object.assign(mengetahuiCell, footerStyle);

    worksheet.mergeCells(`C${ttRow1}:D${ttRow1}`);
    const tanggalCell = worksheet.getCell(`C${ttRow1}`);
    tanggalCell.value = `Karangampel, 31 ${namaBln} ${tahun}`;
    Object.assign(tanggalCell, footerStyle);
    currentRow++;

    const kepsekCell = worksheet.getCell(`A${currentRow}`);
    kepsekCell.value = 'Kepala Sekolah';
    Object.assign(kepsekCell, footerStyle);

    worksheet.mergeCells(`C${currentRow}:D${currentRow}`);
    const bendaharaCell = worksheet.getCell(`C${currentRow}`);
    bendaharaCell.value = 'Bendahara';
    Object.assign(bendaharaCell, footerStyle);
    currentRow++;

    // Blank rows for signature space
    currentRow++;
    currentRow++;
    currentRow++;

    // Names with underline
    const namaKepsekCell = worksheet.getCell(`A${currentRow}`);
    namaKepsekCell.value = 'Sutarjo, S.Pd.';
    Object.assign(namaKepsekCell, footerNameStyle);

    worksheet.mergeCells(`C${currentRow}:D${currentRow}`);
    const namaBendaharaCell = worksheet.getCell(`C${currentRow}`);
    namaBendaharaCell.value = 'Ruminih';
    Object.assign(namaBendaharaCell, footerNameStyle);
    currentRow++;

    // NBM
    const nbmKepsekCell = worksheet.getCell(`A${currentRow}`);
    nbmKepsekCell.value = 'NBM. 790 157';
    Object.assign(nbmKepsekCell, footerNBMStyle);

    worksheet.mergeCells(`C${currentRow}:D${currentRow}`);
    const nbmBendaharaCell = worksheet.getCell(`C${currentRow}`);
    nbmBendaharaCell.value = 'NBM. 957 378';
    Object.assign(nbmBendaharaCell, footerNBMStyle);

    // ========================================
    // SAVE FILE
    // ========================================
    const namaFile = `Laporan_Keuangan_${namaBln}_${tahun}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Create blob and download
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = namaFile;
    link.click();
    window.URL.revokeObjectURL(url);

    return { sukses: true, namaFile };
  } catch (error) {
    console.error('Error export excel:', error);
    throw new Error(`Gagal export ke Excel: ${error.message}`);
  }
};
