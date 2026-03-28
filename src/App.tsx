/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  MapPin, 
  Send, 
  User, 
  IdCard, 
  Map, 
  History, 
  CheckCircle2, 
  Clock,
  Calendar as CalendarIcon,
  ChevronRight,
  RefreshCw,
  X
} from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
import { id } from 'date-fns/locale';
import { subHours } from 'date-fns';
import { cn } from './lib/utils';
import { AttendanceRecord, SUB_DISTRICTS } from './types';

const TIME_ZONE = 'Asia/Makassar';

export default function App() {
  const [activeTab, setActiveTab] = useState<'absen' | 'rekapan'>('absen');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Form State
  const [type, setType] = useState<'DATANG' | 'PULANG'>('DATANG');
  const [fullName, setFullName] = useState('');
  const [nip, setNip] = useState('');
  const [subDistrict, setSubDistrict] = useState(SUB_DISTRICTS[0]);
  const [photo, setPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Load records from local storage for persistence in this demo
    const saved = localStorage.getItem('attendance_records');
    if (saved) {
      setRecords(JSON.parse(saved));
    }
  }, []);

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Gagal mengakses kamera. Pastikan izin kamera diberikan.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setPhoto(dataUrl);
        stopCamera();
      }
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Gagal mendapatkan lokasi. Pastikan GPS aktif.");
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photo || !location) {
      alert("Harap ambil foto dan pastikan lokasi terdeteksi.");
      return;
    }

    setIsSubmitting(true);
    
    // Display time is adjusted (1 hour back)
    const displayTime = subHours(new Date(), 1);
    
    const newRecord: AttendanceRecord = {
      id: Date.now().toString(),
      timestamp: formatInTimeZone(displayTime, TIME_ZONE, 'yyyy-MM-dd HH:mm:ss'),
      type,
      fullName,
      nip,
      subDistrict,
      photo,
      location: `${location.lat}, ${location.lng}`,
      locationUrl: `https://www.google.com/maps?q=${location.lat},${location.lng}`
    };

    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord)
      });

      if (!response.ok) throw new Error('Gagal mengirim data');

      const updatedRecords = [newRecord, ...records];
      setRecords(updatedRecords);
      localStorage.setItem('attendance_records', JSON.stringify(updatedRecords));
      
      setShowSuccess(true);
      
      // Reset form
      setFullName('');
      setNip('');
      setPhoto(null);
      setLocation(null);
      
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Submission error:", error);
      alert("Terjadi kesalahan saat mengirim absensi. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayTime = subHours(currentTime, 1);
  const formattedDate = formatInTimeZone(displayTime, TIME_ZONE, 'EEEE, dd MMMM yyyy', { locale: id });
  const formattedTime = formatInTimeZone(displayTime, TIME_ZONE, 'HH:mm:ss');

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-600 via-red-600 to-purple-700 text-white p-6 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <motion.h1 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl font-black tracking-tighter mb-1"
          >
            SIAGA ABSEN TAMALATE
          </motion.h1>
          <motion.p 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-sm font-bold uppercase tracking-widest opacity-90"
          >
            PEMERINTAH KOTA MAKASSAR KECAMATAN TAMALATE
          </motion.p>
          <motion.p 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xs opacity-75 mt-1"
          >
            Jl. Danau Tanjung Bunga Utara No.181 Makassar
          </motion.p>
        </div>
      </header>

      {/* Dashboard Info */}
      <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-40 shadow-sm">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-xl">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Waktu WITA</p>
              <p className="text-lg font-black text-slate-800 tabular-nums">{formattedTime}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hari & Tanggal</p>
            <p className="text-sm font-bold text-slate-700">{formattedDate}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 pb-24">
        {/* Tabs */}
        <div className="flex bg-slate-200 p-1 rounded-2xl mb-6">
          <button 
            onClick={() => setActiveTab('absen')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
              activeTab === 'absen' ? "bg-white text-orange-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Camera className="w-4 h-4" />
            Absensi
          </button>
          <button 
            onClick={() => setActiveTab('rekapan')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
              activeTab === 'rekapan' ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <History className="w-4 h-4" />
            Rekapan
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'absen' ? (
            <motion.div
              key="absen-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Jenis Absensi */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setType('DATANG')}
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                      type === 'DATANG' 
                        ? "border-green-500 bg-green-50 text-green-700" 
                        : "border-slate-200 bg-white text-slate-400 grayscale opacity-60"
                    )}
                  >
                    <div className={cn("p-2 rounded-full", type === 'DATANG' ? "bg-green-500 text-white" : "bg-slate-200")}>
                      <ChevronRight className="w-6 h-6 rotate-[-90deg]" />
                    </div>
                    <span className="font-black text-sm">ABSEN DATANG</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('PULANG')}
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                      type === 'PULANG' 
                        ? "border-red-500 bg-red-50 text-red-700" 
                        : "border-slate-200 bg-white text-slate-400 grayscale opacity-60"
                    )}
                  >
                    <div className={cn("p-2 rounded-full", type === 'PULANG' ? "bg-red-500 text-white" : "bg-slate-200")}>
                      <ChevronRight className="w-6 h-6 rotate-[90deg]" />
                    </div>
                    <span className="font-black text-sm">ABSEN PULANG</span>
                  </button>
                </div>

                {/* Input Fields */}
                <div className="space-y-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <User className="w-3 h-3" /> Nama Lengkap
                    </label>
                    <input
                      required
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Masukkan Nama Lengkap"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <IdCard className="w-3 h-3" /> NIP
                    </label>
                    <input
                      required
                      type="text"
                      value={nip}
                      onChange={(e) => setNip(e.target.value)}
                      placeholder="Masukkan NIP"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Map className="w-3 h-3" /> Kecamatan / Kelurahan
                    </label>
                    <select
                      value={subDistrict}
                      onChange={(e) => setSubDistrict(e.target.value)}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all font-bold appearance-none cursor-pointer"
                    >
                      {SUB_DISTRICTS.map(sd => (
                        <option key={sd} value={sd}>{sd}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Media Capture */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Photo Section */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Foto Diri</label>
                    <div 
                      onClick={() => !photo && startCamera()}
                      className={cn(
                        "aspect-square rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all overflow-hidden relative",
                        photo ? "border-green-500 bg-green-50" : "border-slate-300 bg-white hover:border-orange-500 hover:bg-orange-50"
                      )}
                    >
                      {photo ? (
                        <>
                          <img src={photo} alt="Absen" className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setPhoto(null); }}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full shadow-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <Camera className="w-8 h-8 text-slate-400" />
                          <span className="text-[10px] font-black text-slate-500">AMBIL FOTO</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Location Section */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lokasi GPS</label>
                    <div 
                      onClick={getLocation}
                      className={cn(
                        "aspect-square rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all relative",
                        location ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-white hover:border-orange-500 hover:bg-orange-50"
                      )}
                    >
                      {location ? (
                        <div className="text-center p-4">
                          <MapPin className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                          <p className="text-[8px] font-bold text-blue-700 break-all">
                            {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                          </p>
                          <span className="text-[10px] font-black text-blue-500 mt-2 block">LOKASI TERKUNCI</span>
                        </div>
                      ) : (
                        <>
                          <MapPin className="w-8 h-8 text-slate-400" />
                          <span className="text-[10px] font-black text-slate-500">AMBIL LOKASI</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !photo || !location}
                  className={cn(
                    "w-full py-5 rounded-2xl font-black text-lg shadow-xl transition-all flex items-center justify-center gap-3",
                    isSubmitting || !photo || !location
                      ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-orange-600 to-red-600 text-white hover:scale-[1.02] active:scale-[0.98]"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-6 h-6 animate-spin" />
                      MENGIRIM...
                    </>
                  ) : (
                    <>
                      <Send className="w-6 h-6" />
                      KIRIM ABSENSI
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="rekapan-list"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-black text-slate-800 flex items-center gap-2">
                  <History className="w-5 h-5 text-purple-600" />
                  RIWAYAT ABSENSI
                </h3>
                <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                  {records.length} DATA
                </span>
              </div>

              {records.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center">
                  <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <History className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-400 font-bold">Belum ada data absensi hari ini.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {records.map((record) => (
                    <motion.div 
                      layout
                      key={record.id}
                      onClick={() => setSelectedRecord(record)}
                      className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex gap-4 items-center cursor-pointer hover:border-orange-200 transition-colors"
                    >
                      <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-100">
                        <img src={record.photo} alt="User" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className="font-black text-slate-800 truncate">{record.fullName}</h4>
                          <span className={cn(
                            "text-[8px] font-black px-2 py-0.5 rounded-full",
                            record.type === 'DATANG' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          )}>
                            {record.type}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400">{record.nip}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                            <Clock className="w-3 h-3" />
                            {record.timestamp.split(' ')[1]}
                          </div>
                          <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600">
                            <MapPin className="w-3 h-3" />
                            Detail Lokasi
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setSelectedRecord(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[40px] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative h-64">
                <img src={selectedRecord.photo} alt="Detail" className="w-full h-full object-cover" />
                <button 
                  onClick={() => setSelectedRecord(null)}
                  className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full backdrop-blur-md"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
                  <h3 className="text-xl font-black">{selectedRecord.fullName}</h3>
                  <p className="text-sm opacity-80">{selectedRecord.nip}</p>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Status</p>
                    <span className={cn(
                      "text-xs font-black px-3 py-1 rounded-full",
                      selectedRecord.type === 'DATANG' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                      ABSEN {selectedRecord.type}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Waktu</p>
                    <p className="text-sm font-bold text-slate-700">{selectedRecord.timestamp}</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Wilayah</p>
                  <p className="text-sm font-bold text-slate-700">{selectedRecord.subDistrict}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Koordinat Lokasi</p>
                  <p className="text-sm font-bold text-slate-700 mb-3">{selectedRecord.location}</p>
                  <a 
                    href={selectedRecord.locationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-blue-700 transition-colors"
                  >
                    <Map className="w-4 h-4" />
                    BUKA DI GOOGLE MAPS
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera Modal */}
      <AnimatePresence>
        {isCameraOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col"
          >
            <div className="p-4 flex justify-between items-center text-white">
              <h3 className="font-black">AMBIL FOTO ABSEN</h3>
              <button onClick={stopCamera} className="p-2 bg-white/10 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              {/* Overlay guides */}
              <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
                <div className="w-full h-full border-2 border-white/50 rounded-3xl"></div>
              </div>
            </div>

            <div className="p-12 flex justify-center bg-black/80 backdrop-blur-md">
              <button 
                onClick={takePhoto}
                className="w-20 h-20 bg-white rounded-full border-8 border-white/30 flex items-center justify-center active:scale-90 transition-transform"
              >
                <div className="w-12 h-12 bg-orange-600 rounded-full"></div>
              </button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-white/80 backdrop-blur-sm"
          >
            <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-slate-100 text-center max-w-xs w-full">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">BERHASIL!</h2>
              <p className="text-slate-500 font-bold">Data absensi Anda telah berhasil terkirim ke sistem.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-500 p-6 text-center mt-auto">
        <p className="text-[10px] font-bold tracking-widest uppercase mb-1">SIAGA ABSEN TAMALATE v1.0</p>
        <p className="text-[10px] opacity-60">
          Hak Cipta Latsar CPNS 2026 Nurmalita Tentisari
        </p>
      </footer>
    </div>
  );
}
