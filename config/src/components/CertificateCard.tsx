import React, { useState, useEffect, useRef } from 'react';
import academyHeroImg from '../assets/images/proskill_academy_hero_1785485015179.jpg';
import { getUserAvatar } from '../utils/imageUtils';
import {
  CertificateData,
  generateQRCodeDataUrl,
  downloadCertificatePDF,
  downloadCertificatePNG,
} from '../utils/pdfGenerator';
import { Download, Printer, Loader2, Award, QrCode, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';

interface CertificateCardProps {
  certificate: CertificateData;
  userAvatar?: string;
  showDownloadButton?: boolean;
}

export const CertificateCard: React.FC<CertificateCardProps> = ({
  certificate,
  userAvatar,
  showDownloadButton = true,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const [isGeneratingPNG, setIsGeneratingPNG] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const certRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const verificationUrl = `https://verification.proskill.uz/verify/${certificate.id}`;
    generateQRCodeDataUrl(verificationUrl).then((dataUrl) => {
      setQrCodeUrl(dataUrl);
    });
  }, [certificate.id]);

  const handleDownloadPDF = async () => {
    if (!certRef.current || isGeneratingPDF || isGeneratingPNG) return;
    setNotification(null);
    setIsGeneratingPDF(true);

    try {
      const result = await downloadCertificatePDF(certRef.current, certificate.id, certificate.user_name);
      if (result.success) {
        setNotification({
          type: 'success',
          message: 'Sertifikat PDF formatida muvaffaqiyatli yuklab olindi!',
        });
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'PDF faylini yaratishda xatolik yuz berdi.',
        });
      }
    } catch (err: any) {
      console.error('PDF download error:', err);
      setNotification({
        type: 'error',
        message: err?.message || 'PDF faylini yaratishda kutilmagan xatolik yuz berdi.',
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadPNG = async () => {
    if (!certRef.current || isGeneratingPDF || isGeneratingPNG) return;
    setNotification(null);
    setIsGeneratingPNG(true);

    try {
      const result = await downloadCertificatePNG(certRef.current, certificate.id, certificate.user_name);
      if (result.success) {
        setNotification({
          type: 'success',
          message: 'Sertifikat PNG rasm formatida muvaffaqiyatli yuklab olindi!',
        });
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'Rasm faylini yaratishda xatolik yuz berdi.',
        });
      }
    } catch (err: any) {
      console.error('PNG download error:', err);
      setNotification({
        type: 'error',
        message: err?.message || 'Rasm faylini yaratishda kutilmagan xatolik yuz berdi.',
      });
    } finally {
      setIsGeneratingPNG(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const avatarSrc = getUserAvatar(certificate.user_avatar || userAvatar, certificate.login);

  const calculatedErrors =
    certificate.errors !== undefined
      ? certificate.errors
      : Math.max(0, Math.round((certificate.wpm * (100 - certificate.accuracy)) / 100));

  return (
    <div className="space-y-4">
      {/* Dynamic Certificate Canvas */}
      <div
        ref={certRef}
        data-certificate-id={certificate.id}
        className="certificate-printable p-6 sm:p-12 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-8 border-amber-500/60 rounded-3xl relative overflow-hidden shadow-2xl text-slate-100 print:bg-white print:text-black print:border-amber-600 print:shadow-none print:p-8 space-y-8"
      >
        {/* Certificate Decorative Corners */}
        <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-amber-400/80 pointer-events-none" />
        <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-amber-400/80 pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-amber-400/80 pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-amber-400/80 pointer-events-none" />

        {/* Header: ProType Logo & ProSkill IT Academy Branding */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-amber-500/30 pb-6 print:border-amber-600">
          <div className="flex items-center gap-4 text-left">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-400 via-indigo-600 to-amber-400 p-0.5 shadow-xl">
              <div className="w-full h-full bg-slate-950 print:bg-slate-900 rounded-[14px] flex items-center justify-center text-cyan-400 font-black text-2xl font-display">
                PS
              </div>
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white print:text-black font-display tracking-tight flex items-center gap-2">
                <span>PROSKILL</span>
                <span className="text-amber-400">IT ACADEMY</span>
              </h2>
              <p className="text-xs text-slate-400 print:text-slate-600 font-semibold">
                Rasmiy IT Ta'lim va Zertifikatlash Markazi • ProType Platformasi
              </p>
            </div>
          </div>

          <div className="w-28 h-20 rounded-2xl overflow-hidden border border-amber-500/40 shadow-lg hidden sm:block print:block">
            <img
              src={academyHeroImg}
              alt="Proskill Building"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Certificate Main Title & User Info */}
        <div className="text-center space-y-4 py-2">
          <div className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 print:text-amber-800 text-xs font-black uppercase tracking-widest">
            RASMIY MALAKAVIY SERTIFIKAT
          </div>

          <div className="flex justify-center pt-2">
            <img
              src={avatarSrc}
              alt={certificate.user_name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-amber-400/80 shadow-xl print:border-amber-600 bg-slate-900"
              referrerPolicy="no-referrer"
            />
          </div>

          <p className="text-xs sm:text-sm text-slate-400 print:text-slate-600 uppercase tracking-wider font-semibold">
            Ushbu sertifikat rasman tasdiqlaydi-ki,
          </p>

          <h1 className="text-3xl sm:text-5xl font-black text-amber-300 print:text-indigo-950 font-display tracking-tight underline decoration-amber-500/40 py-1">
            {certificate.user_name}
          </h1>

          <p className="text-xs text-slate-400 print:text-slate-500 font-mono">
            Foydalanuvchi logini: <strong className="text-cyan-300 print:text-black font-bold">@{certificate.login}</strong>
          </p>

          <div className="max-w-2xl mx-auto space-y-1">
            <p className="text-sm sm:text-base text-slate-300 print:text-slate-800 leading-relaxed pt-1">
              <strong className="text-amber-400 print:text-indigo-900 font-bold">{certificate.test_type}</strong> yechilishida klaviatura tezligi va kompyuter savodxonligi bo'yicha yuqori malakaviy ko'rsatkichlarni namoyish etdi.
            </p>
            <p className="text-xs text-slate-400 print:text-slate-600">
              Sertifikat berilgan sana: <strong className="text-white print:text-black font-semibold">{certificate.date}</strong>
            </p>
          </div>
        </div>

        {/* Real Stats Grid including Total Errors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto text-center bg-slate-950/80 print:bg-slate-100 p-4 rounded-2xl border border-amber-500/30 print:border-slate-300">
          <div>
            <span className="block text-[10px] sm:text-[11px] text-slate-400 print:text-slate-600 font-bold uppercase">Maksimal WPM</span>
            <strong className="text-xl sm:text-2xl font-black text-cyan-400 print:text-cyan-800 font-mono">{certificate.wpm}</strong>
          </div>
          <div>
            <span className="block text-[10px] sm:text-[11px] text-slate-400 print:text-slate-600 font-bold uppercase">Net WPM</span>
            <strong className="text-xl sm:text-2xl font-black text-amber-400 print:text-amber-800 font-mono">{certificate.net_wpm}</strong>
          </div>
          <div>
            <span className="block text-[10px] sm:text-[11px] text-slate-400 print:text-slate-600 font-bold uppercase">Aniqlik</span>
            <strong className="text-xl sm:text-2xl font-black text-emerald-400 print:text-emerald-800 font-mono">{certificate.accuracy}%</strong>
          </div>
          <div>
            <span className="block text-[10px] sm:text-[11px] text-slate-400 print:text-slate-600 font-bold uppercase">Xatolar</span>
            <strong className="text-xl sm:text-2xl font-black text-rose-400 print:text-rose-800 font-mono">{calculatedErrors}</strong>
          </div>
        </div>

        {/* Footer: Verification QR Code, Official Seal & Director Signature */}
        <div className="pt-6 border-t border-amber-500/30 print:border-amber-600 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs">
          <div className="flex items-center gap-3 text-left">
            <div className="w-16 h-16 bg-white p-1 rounded-xl shadow-md border border-slate-300 flex items-center justify-center">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="QR Code" className="w-14 h-14 object-contain" />
              ) : (
                <QrCode className="w-14 h-14 text-slate-900" />
              )}
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 print:text-slate-600 uppercase font-bold">Haqiqiylikni Tekshirish</span>
              <span className="font-mono text-[10px] text-amber-400 print:text-amber-800 font-bold block">{certificate.id}</span>
              <span className="text-[9px] text-slate-500 block">verification.proskill.uz</span>
            </div>
          </div>

          {/* Official Stamp */}
          <div className="relative w-24 h-24 rounded-full border-4 border-amber-400/80 print:border-blue-700 bg-gradient-to-tr from-amber-500/20 via-blue-900/30 to-amber-400/20 flex items-center justify-center p-1 text-center shadow-2xl transform rotate-12">
            <div className="w-full h-full rounded-full border-2 border-dashed border-amber-300 print:border-blue-600 flex flex-col items-center justify-center text-[8px] font-black text-amber-300 print:text-blue-900 leading-tight uppercase">
              <span>PROSKILL</span>
              <span className="text-[10px] text-amber-400 print:text-blue-800 font-extrabold">MUHR</span>
              <span>TASDIQLANGAN</span>
            </div>
          </div>

          <div className="text-right">
            <div className="italic font-serif text-lg font-bold text-amber-300 print:text-slate-900 border-b border-slate-600 print:border-slate-400 pb-1">
              A. X. Yuldashev
            </div>
            <span className="block text-[10px] text-slate-400 print:text-slate-600 font-semibold uppercase mt-1">
              Proskill IT Academy Direktori
            </span>
          </div>
        </div>
      </div>

      {/* Notification Toast Banner */}
      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 animate-fadeIn print:hidden ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-800'
              : 'bg-rose-950/90 text-rose-300 border border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* ACTION BUTTONS: Saqlash (PDF), Saqlash (Rasm), Chop etish */}
      {/* ACTION BUTTONS: Saqlash (PDF), Saqlash (Rasm), Chop etish */}
      {showDownloadButton && (
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl print:hidden">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Award className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{certificate.test_type}</span>
            </div>
            <span className="text-slate-600">•</span>
            <div>
              <span>Sana: <strong className="text-slate-300 font-mono">{certificate.date}</strong></span>
            </div>
            <span className="text-slate-600">•</span>
            <div>
              <span>ID: <strong className="text-white font-mono">{certificate.id}</strong></span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handlePrint}
              disabled={isGeneratingPDF || isGeneratingPNG}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>Chop etish</span>
            </button>

            {/* Save Image Button */}
            <button
              onClick={handleDownloadPNG}
              disabled={isGeneratingPDF || isGeneratingPNG}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:opacity-95 shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGeneratingPNG ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Rasm Tayyorlanmoqda...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4" />
                  <span>Saqlash (Rasm)</span>
                </>
              )}
            </button>

            {/* Save PDF Button */}
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF || isGeneratingPNG}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:opacity-95 shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>PDF Tayyorlanmoqda...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Saqlash (PDF)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
