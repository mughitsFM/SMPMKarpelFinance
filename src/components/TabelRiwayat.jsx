import './TabelRiwayat.css';

function TabelRiwayat({ data, onEdit, onHapus }) {
  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka);
  };

  const formatTanggal = (tanggal) => {
    return new Date(tanggal).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatWaktu = (tanggal) => {
    return new Date(tanggal).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="tabel-container">
      <table className="tabel-riwayat">
        <thead>
          <tr>
            <th>No</th>
            <th>Kategori</th>
            <th>Jenis</th>
            <th>Deskripsi</th>
            <th className="text-right">Jumlah</th>
            <th>Tanggal</th>
            <th className="text-center">Aktivitas</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={item.idTransaksi}>
              <td>{index + 1}</td>
              <td className="kategori-cell">
                <span className="kategori-nama">{item.kategori}</span>
              </td>
              <td>
                <span className={`badge ${item.jenis === 'pemasukan' ? 'badge-pemasukan' : 'badge-pengeluaran'}`}>
                  {item.jenis === 'pemasukan' ? '📈 Pemasukan' : '📉 Pengeluaran'}
                </span>
              </td>
              <td className="deskripsi-cell">
                <span className="deskripsi-text" title={item.uraian}>
                  {item.uraian}
                </span>
              </td>
              <td className={`text-right amount-cell ${item.jenis === 'pemasukan' ? 'pemasukan-amount' : 'pengeluaran-amount'}`}>
                {formatRupiah(item.jumlah)}
              </td>
              <td className="tanggal-cell">
                {formatTanggal(item.tanggal)}
              </td>
              <td className="text-center">
                <div className="action-buttons">
                  <button
                    onClick={() => onEdit(item)}
                    className="btn-action btn-edit"
                    title="Edit transaksi"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => onHapus(item)}
                    className="btn-action btn-delete"
                    title="Hapus transaksi"
                  >
                    🗑️ Hapus
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TabelRiwayat;
