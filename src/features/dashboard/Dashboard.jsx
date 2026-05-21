import React from 'react';
import { useSheetData } from '../../hooks/useSheetData';
import { Loader2, AlertCircle, Database, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  // Memanggil API getDashboard yang terhubung ke Google Sheet Anda di Vercel
  const { data, isLoading, error } = useSheetData('getDashboard');

  // 1. STATE LOADING
  if (isLoading) {
    return (
      <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="animate-spin text-slate-900" size={32} />
        <p className="text-sm font-medium tracking-wide animate-pulse">Menghubungkan ke Google Sheet Anda via Vercel...</p>
      </div>
    );
  }

  // 2. STATE ERROR (Jika Kunci Google Cloud / Sheet ID salah)
  if (error) {
    return (
      <div className="m-6 p-5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 max-w-2xl mx-auto">
        <AlertCircle size={24} className="shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-base">Gagal Membaca Google Sheet</h4>
          <p className="text-sm text-red-600 mt-1">{error}</p>
          <div className="mt-4 p-3 bg-white border border-red-100 rounded-lg text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-700">Langkah Pengecekan:</p>
            <p>1. Pastikan email Service Account Anda sudah di-invite ke dalam Google Sheet tersebut sebagai <b>Viewer</b>.</p>
            <p>2. Pastikan tab di Google Sheet Anda bernama <b>"Dashboard"</b> (sesuai range API kita).</p>
            <p>3. Pastikan data di sheet dimulai dari Baris ke-2.</p>
          </div>
        </div>
      </div>
    );
  }

  // 3. STATE JIKA DATA KOSONG
  if (!data || data.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto space-y-3">
        <Database className="mx-auto text-slate-300" size={48} />
        <h3 className="text-lg font-bold text-slate-800">Koneksi Sukses, Tapi Data Kosong</h3>
        <p className="text-slate-500 text-sm">API berhasil membaca Google Sheet Anda, namun tidak menemukan baris data pada range 'Dashboard!A2:E'.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Top Bar Status */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 tracking-tight">Koneksi Data Live</h1>
          <p className="text-slate-500 text-sm mt-0.5">Menampilkan data mentah asli yang dibaca langsung dari Google Sheet Anda.</p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-full text-xs font-semibold self-start sm:self-center">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
          Connected to Google Sheets API
        </div>
      </div>

      {/* 📄 PREVIEW DATA ASLI */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tabel Data Sheet (Maksimal 20 Baris Pertama)</span>
          <span className="text-xs text-slate-400 font-medium">Total Terbaca: {data.length} Baris</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200">
                <th className="p-3 text-xs font-bold text-slate-600 uppercase w-16 text-center">No</th>
                <th className="p-3 text-xs font-bold text-slate-600 uppercase">Kolom A</th>
                <th className="p-3 text-xs font-bold text-slate-600 uppercase">Kolom B</th>
                <th className="p-3 text-xs font-bold text-slate-600 uppercase">Kolom C</th>
                <th className="p-3 text-xs font-bold text-slate-600 uppercase">Kolom D</th>
                <th className="p-3 text-xs font-bold text-slate-600 uppercase">Kolom E</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
              {data.slice(0, 20).map((row, index) => (
                <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 text-center text-xs font-semibold text-slate-400 bg-slate-50/50">{index + 1}</td>
                  <td className="p-3 font-medium text-slate-900">{row[0] || <span className="text-slate-300 italic">kosong</span>}</td>
                  <td className="p-3">{row[1] || <span className="text-slate-300 italic">kosong</span>}</td>
                  <td className="p-3">{row[2] || <span className="text-slate-300 italic">kosong</span>}</td>
                  <td className="p-3">{row[3] || <span className="text-slate-300 italic">kosong</span>}</td>
                  <td className="p-3">{row[4] || <span className="text-slate-300 italic">kosong</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-slate-400 text-center">
        * Catatan: Tampilan ini menggunakan deteksi otomatis. Jika Anda membukanya melalui tautan URL <b>.vercel.app</b>, Anda akan melihat data asli Anda. Jika di StackBlitz, ia akan menampilkan data simulasi aman.
      </div>
    </div>
  );
}