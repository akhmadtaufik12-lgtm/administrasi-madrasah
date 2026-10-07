import React, { useState, useEffect } from 'react';
import {
  SchoolOfficials,
  Teacher,
  SchoolId,
  KopSuratConfig
} from '../types';
import {
  Building2,
  MapPin,
  Users,
  Printer,
  Save,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Globe,
  Award,
  FileText,
  Landmark,
  UserCheck,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  RotateCcw,
  Check,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Briefcase,
  Palette,
  Layout,
  Sliders,
  Type,
  Image as ImageIcon,
  AlignCenter,
  AlignLeft,
  RefreshCw,
  Layers,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import { cleanTreasurerRole } from '../utils/storage';
import { renderKopSuratHtml, DEFAULT_KOP_CONFIG, printHtmlString } from '../utils/export';

interface IdentitasLembagaProps {
  schoolOfficials: SchoolOfficials;
  onSaveOfficials: (officials: SchoolOfficials) => void | Promise<void>;
  teachers?: Teacher[];
  activeSchoolId?: SchoolId;
  schoolName?: string;
  onSwitchSchool?: (id: SchoolId) => void;
}

export const IdentitasLembaga: React.FC<IdentitasLembagaProps> = ({
  schoolOfficials,
  onSaveOfficials,
  teachers = [],
  activeSchoolId = 'mts_manbaul_islam',
  schoolName = "MTs Manba'ul Islam",
  onSwitchSchool
}) => {
  const [activeTab, setActiveTab] = useState<'profil' | 'alamat' | 'pejabat' | 'preview_kop'>('profil');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Profil & Legalitas Lembaga Form State
  const [namaSekolah, setNamaSekolah] = useState(schoolOfficials.namaSekolah || schoolName || '');
  const [namaYayasan, setNamaYayasan] = useState(schoolOfficials.namaYayasan || '');
  const [npsn, setNpsn] = useState(schoolOfficials.npsn || '20108921');
  const [nsm, setNsm] = useState(schoolOfficials.nsm || '121231730005');
  const [akreditasi, setAkreditasi] = useState(schoolOfficials.akreditasi || 'A (Unggul)');
  const [izinOperasional, setIzinOperasional] = useState(schoolOfficials.izinOperasional || 'Kd.09.03/4/PP.00.5/123/2018');
  const [jenjang, setJenjang] = useState(schoolOfficials.jenjang || 'MTs');
  const [statusSekolah, setStatusSekolah] = useState(schoolOfficials.statusSekolah || 'Swasta');
  const [tagline, setTagline] = useState(schoolOfficials.tagline || 'Madrasah Hebat Bermartabat • Berakhlak Mulia & Berprestasi');
  const [logoUrl, setLogoUrl] = useState(schoolOfficials.logoUrl || '');

  // 2. Alamat & Kontak Lembaga Form State
  const [alamatSekolah, setAlamatSekolah] = useState(schoolOfficials.alamatSekolah || 'Jl. Sandang No. 34');
  const [rtRw, setRtRw] = useState(schoolOfficials.rtRw || 'RT 004 / RW 011');
  const [kelurahan, setKelurahan] = useState(schoolOfficials.kelurahan || 'Palmerah');
  const [kecamatan, setKecamatan] = useState(schoolOfficials.kecamatan || 'Palmerah');
  const [kotaSekolah, setKotaSekolah] = useState(schoolOfficials.kotaSekolah || 'Jakarta Barat');
  const [provinsi, setProvinsi] = useState(schoolOfficials.provinsi || 'DKI Jakarta');
  const [kodePos, setKodePos] = useState(schoolOfficials.kodePos || '11480');
  const [teleponSekolah, setTeleponSekolah] = useState(schoolOfficials.teleponSekolah || '(021) 5321855');
  const [whatsappSekolah, setWhatsappSekolah] = useState(schoolOfficials.whatsappSekolah || '0812-3456-7890');
  const [emailSekolah, setEmailSekolah] = useState(schoolOfficials.emailSekolah || 'mtsmanbaulislam@gmail.com');
  const [website, setWebsite] = useState(schoolOfficials.website || 'https://mtsmanbaulislam.sch.id');

  // 3. Struktur Pejabat & Pimpinan Lembaga Form State
  // Kepala Sekolah
  const [kepalaName, setKepalaName] = useState(schoolOfficials.kepalaSekolah?.name || 'Dra. Hj. Nurjanah, M.Pd');
  const [kepalaNip, setKepalaNip] = useState(schoolOfficials.kepalaSekolah?.nip || '197208151998032001');
  const [kepalaPhone, setKepalaPhone] = useState(schoolOfficials.kepalaSekolah?.phone || '081288991122');
  const [kepalaEmail, setKepalaEmail] = useState(schoolOfficials.kepalaSekolah?.email || 'nurjanah@mtsmanbaulislam.sch.id');

  // Kesiswaan
  const [kesiswaanName, setKesiswaanName] = useState(schoolOfficials.kesiswaan?.name || 'M. Sholihin, SE');
  const [kesiswaanNip, setKesiswaanNip] = useState(schoolOfficials.kesiswaan?.nip || '85780');
  const [kesiswaanPhone, setKesiswaanPhone] = useState(schoolOfficials.kesiswaan?.phone || '081234567804');
  const [kesiswaanEmail, setKesiswaanEmail] = useState(schoolOfficials.kesiswaan?.email || 'sholihin@mtsmanbaulislam.sch.id');

  // Kurikulum
  const [kurikulumName, setKurikulumName] = useState(schoolOfficials.kurikulum?.name || 'Agustiani, S.Pd');
  const [kurikulumNip, setKurikulumNip] = useState(schoolOfficials.kurikulum?.nip || '85781');
  const [kurikulumPhone, setKurikulumPhone] = useState(schoolOfficials.kurikulum?.phone || '081234567806');
  const [kurikulumEmail, setKurikulumEmail] = useState(schoolOfficials.kurikulum?.email || 'agustiani@mtsmanbaulislam.sch.id');

  // Sarpras
  const [sarprasName, setSarprasName] = useState(schoolOfficials.sarpras?.name || 'Sugiyono, S.Pd');
  const [sarprasNip, setSarprasNip] = useState(schoolOfficials.sarpras?.nip || '85788');
  const [sarprasPhone, setSarprasPhone] = useState(schoolOfficials.sarpras?.phone || '081234567807');

  // Humas
  const [humasName, setHumasName] = useState(schoolOfficials.humas?.name || 'Erna Ekawati, SH');
  const [humasNip, setHumasNip] = useState(schoolOfficials.humas?.nip || '85798');
  const [humasPhone, setHumasPhone] = useState(schoolOfficials.humas?.phone || '081234567808');

  // Tata Usaha
  const [tuName, setTuName] = useState(schoolOfficials.tataUsaha?.name || 'Akhmad Taufik');
  const [tuNip, setTuNip] = useState(schoolOfficials.tataUsaha?.nip || '85804');
  const [tuPhone, setTuPhone] = useState(schoolOfficials.tataUsaha?.phone || '081234567809');

  // BK / BP
  const [bkName, setBkName] = useState(schoolOfficials.bk?.name || 'Fahmi, S.Pd');
  const [bkNip, setBkNip] = useState(schoolOfficials.bk?.nip || '85821');
  const [bkPhone, setBkPhone] = useState(schoolOfficials.bk?.phone || '081234567810');

  // 4. Custom Kop Surat Form State
  const initialKop = schoolOfficials.kopSuratConfig || DEFAULT_KOP_CONFIG;
  const [kopFontFamily, setKopFontFamily] = useState<KopSuratConfig['fontFamily']>(initialKop.fontFamily || 'Arial');
  const [kopYayasanColor, setKopYayasanColor] = useState(initialKop.namaYayasanColor || '#1e293b');
  const [kopYayasanFontSize, setKopYayasanFontSize] = useState(initialKop.namaYayasanFontSize || 11);
  const [kopSekolahColor, setKopSekolahColor] = useState(initialKop.namaSekolahColor || '#047857');
  const [kopSekolahFontSize, setKopSekolahFontSize] = useState(initialKop.namaSekolahFontSize || 15);
  const [kopStatusColor, setKopStatusColor] = useState(initialKop.statusAkreditasiColor || '#334155');
  const [kopAlamatColor, setKopAlamatColor] = useState(initialKop.alamatColor || '#475569');
  const [kopKontakColor, setKopKontakColor] = useState(initialKop.kontakColor || '#64748b');
  const [kopLayoutAlign, setKopLayoutAlign] = useState<KopSuratConfig['layoutAlign']>(initialKop.layoutAlign || 'center');
  const [kopLogoPosition, setKopLogoPosition] = useState<KopSuratConfig['logoPosition']>(initialKop.logoPosition || 'left');
  const [kopSecondaryLogoUrl, setKopSecondaryLogoUrl] = useState(initialKop.secondaryLogoUrl || '');
  const [kopLogoSize, setKopLogoSize] = useState(initialKop.logoSize || 75);
  const [kopBorderStyle, setKopBorderStyle] = useState<KopSuratConfig['borderStyle']>(initialKop.borderStyle || 'double');
  const [kopBorderColor, setKopBorderColor] = useState(initialKop.borderColor || '#000000');
  const [kopBorderThickness, setKopBorderThickness] = useState(initialKop.borderThickness || 3);

  // Sync state whenever schoolOfficials or activeSchoolId changes
  useEffect(() => {
    if (schoolOfficials) {
      setNamaSekolah(schoolOfficials.namaSekolah || schoolName || '');
      setNamaYayasan(schoolOfficials.namaYayasan || '');
      setNpsn(schoolOfficials.npsn || '20108921');
      setNsm(schoolOfficials.nsm || '121231730005');
      setAkreditasi(schoolOfficials.akreditasi || 'A (Unggul)');
      setIzinOperasional(schoolOfficials.izinOperasional || 'Kd.09.03/4/PP.00.5/123/2018');
      setJenjang(schoolOfficials.jenjang || 'MTs');
      setStatusSekolah(schoolOfficials.statusSekolah || 'Swasta');
      setTagline(schoolOfficials.tagline || 'Madrasah Hebat Bermartabat • Berakhlak Mulia & Berprestasi');
      setLogoUrl(schoolOfficials.logoUrl || '');

      setAlamatSekolah(schoolOfficials.alamatSekolah || 'Jl. Sandang No. 34');
      setRtRw(schoolOfficials.rtRw || 'RT 004 / RW 011');
      setKelurahan(schoolOfficials.kelurahan || 'Palmerah');
      setKecamatan(schoolOfficials.kecamatan || 'Palmerah');
      setKotaSekolah(schoolOfficials.kotaSekolah || 'Jakarta Barat');
      setProvinsi(schoolOfficials.provinsi || 'DKI Jakarta');
      setKodePos(schoolOfficials.kodePos || '11480');
      setTeleponSekolah(schoolOfficials.teleponSekolah || '(021) 5321855');
      setWhatsappSekolah(schoolOfficials.whatsappSekolah || '0812-3456-7890');
      setEmailSekolah(schoolOfficials.emailSekolah || 'mtsmanbaulislam@gmail.com');
      setWebsite(schoolOfficials.website || 'https://mtsmanbaulislam.sch.id');

      // Officials
      setKepalaName(schoolOfficials.kepalaSekolah?.name || 'Dra. Hj. Nurjanah, M.Pd');
      setKepalaNip(schoolOfficials.kepalaSekolah?.nip || '197208151998032001');
      setKepalaPhone(schoolOfficials.kepalaSekolah?.phone || '');
      setKepalaEmail(schoolOfficials.kepalaSekolah?.email || '');

      setKesiswaanName(schoolOfficials.kesiswaan?.name || 'M. Sholihin, SE');
      setKesiswaanNip(schoolOfficials.kesiswaan?.nip || '85780');
      setKesiswaanPhone(schoolOfficials.kesiswaan?.phone || '');
      setKesiswaanEmail(schoolOfficials.kesiswaan?.email || '');

      setKurikulumName(schoolOfficials.kurikulum?.name || 'Agustiani, S.Pd');
      setKurikulumNip(schoolOfficials.kurikulum?.nip || '85781');
      setKurikulumPhone(schoolOfficials.kurikulum?.phone || '');
      setKurikulumEmail(schoolOfficials.kurikulum?.email || '');

      setSarprasName(schoolOfficials.sarpras?.name || 'Sugiyono, S.Pd');
      setSarprasNip(schoolOfficials.sarpras?.nip || '85788');
      setSarprasPhone(schoolOfficials.sarpras?.phone || '');

      setHumasName(schoolOfficials.humas?.name || 'Erna Ekawati, SH');
      setHumasNip(schoolOfficials.humas?.nip || '85798');
      setHumasPhone(schoolOfficials.humas?.phone || '');

      setTuName(schoolOfficials.tataUsaha?.name || 'Akhmad Taufik');
      setTuNip(schoolOfficials.tataUsaha?.nip || '85804');
      setTuPhone(schoolOfficials.tataUsaha?.phone || '');

      setBkName(schoolOfficials.bk?.name || 'Fahmi, S.Pd');
      setBkNip(schoolOfficials.bk?.nip || '85821');
      setBkPhone(schoolOfficials.bk?.phone || '');

      // Kop Surat Config
      const kcfg = schoolOfficials.kopSuratConfig || DEFAULT_KOP_CONFIG;
      setKopFontFamily(kcfg.fontFamily || 'Arial');
      setKopYayasanColor(kcfg.namaYayasanColor || '#1e293b');
      setKopYayasanFontSize(kcfg.namaYayasanFontSize || 11);
      setKopSekolahColor(kcfg.namaSekolahColor || '#047857');
      setKopSekolahFontSize(kcfg.namaSekolahFontSize || 15);
      setKopStatusColor(kcfg.statusAkreditasiColor || '#334155');
      setKopAlamatColor(kcfg.alamatColor || '#475569');
      setKopKontakColor(kcfg.kontakColor || '#64748b');
      setKopLayoutAlign(kcfg.layoutAlign || 'center');
      setKopLogoPosition(kcfg.logoPosition || 'left');
      setKopSecondaryLogoUrl(kcfg.secondaryLogoUrl || '');
      setKopLogoSize(kcfg.logoSize || 75);
      setKopBorderStyle(kcfg.borderStyle || 'double');
      setKopBorderColor(kcfg.borderColor || '#000000');
      setKopBorderThickness(kcfg.borderThickness || 3);
    }
  }, [schoolOfficials, activeSchoolId, schoolName]);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSelectTeacherForRole = (
    teacherId: string,
    setName: (v: string) => void,
    setNip: (v: string) => void,
    setPhone?: (v: string) => void,
    setEmail?: (v: string) => void
  ) => {
    const selected = teachers.find(t => t.id === teacherId);
    if (selected) {
      setName(selected.name);
      setNip(selected.nip);
      if (setPhone && selected.phone) setPhone(selected.phone);
      if (setEmail && selected.email) setEmail(selected.email);
      showNotification('success', `Berhasil memilih ${selected.name}`);
    }
  };

  const handleSaveAll = async () => {
    if (!namaSekolah.trim()) {
      showNotification('error', 'Nama Sekolah / Madrasah tidak boleh kosong!');
      setActiveTab('profil');
      return;
    }
    if (!kepalaName.trim()) {
      showNotification('error', 'Nama Kepala Sekolah tidak boleh kosong!');
      setActiveTab('pejabat');
      return;
    }
    if (!kesiswaanName.trim()) {
      showNotification('error', 'Nama Waka Kesiswaan tidak boleh kosong!');
      setActiveTab('pejabat');
      return;
    }

    setIsSaving(true);
    try {
      const updatedOfficials: SchoolOfficials = {
        ...schoolOfficials,
        // Profil
        namaSekolah: namaSekolah.trim(),
        namaYayasan: namaYayasan.trim(),
        npsn: npsn.trim(),
        nsm: nsm.trim(),
        akreditasi: akreditasi.trim(),
        izinOperasional: izinOperasional.trim(),
        jenjang: jenjang.trim(),
        statusSekolah: statusSekolah.trim(),
        tagline: tagline.trim(),
        logoUrl: logoUrl.trim(),

        // Alamat & Kontak
        alamatSekolah: alamatSekolah.trim(),
        rtRw: rtRw.trim(),
        kelurahan: kelurahan.trim(),
        kecamatan: kecamatan.trim(),
        kotaSekolah: kotaSekolah.trim(),
        provinsi: provinsi.trim(),
        kodePos: kodePos.trim(),
        teleponSekolah: teleponSekolah.trim(),
        whatsappSekolah: whatsappSekolah.trim(),
        emailSekolah: emailSekolah.trim(),
        website: website.trim(),

        // Pejabat & Pimpinan
        kepalaSekolah: {
          name: kepalaName.trim(),
          nip: kepalaNip.trim(),
          phone: kepalaPhone.trim(),
          email: kepalaEmail.trim()
        },
        kesiswaan: {
          name: kesiswaanName.trim(),
          nip: kesiswaanNip.trim(),
          phone: kesiswaanPhone.trim(),
          email: kesiswaanEmail.trim()
        },
        kurikulum: {
          name: kurikulumName.trim(),
          nip: kurikulumNip.trim(),
          phone: kurikulumPhone.trim(),
          email: kurikulumEmail.trim()
        },
        sarpras: {
          name: sarprasName.trim(),
          nip: sarprasNip.trim(),
          phone: sarprasPhone.trim()
        },
        humas: {
          name: humasName.trim(),
          nip: humasNip.trim(),
          phone: humasPhone.trim()
        },
        tataUsaha: {
          name: tuName.trim(),
          nip: tuNip.trim(),
          phone: tuPhone.trim()
        },
        bk: {
          name: bkName.trim(),
          nip: bkNip.trim(),
          phone: bkPhone.trim()
        },

        // Custom Kop Surat Settings
        kopSuratConfig: {
          fontFamily: kopFontFamily,
          namaYayasanColor: kopYayasanColor,
          namaYayasanFontSize: Number(kopYayasanFontSize),
          namaSekolahColor: kopSekolahColor,
          namaSekolahFontSize: Number(kopSekolahFontSize),
          statusAkreditasiColor: kopStatusColor,
          alamatColor: kopAlamatColor,
          kontakColor: kopKontakColor,
          layoutAlign: kopLayoutAlign,
          logoPosition: kopLogoPosition,
          secondaryLogoUrl: kopSecondaryLogoUrl.trim(),
          logoSize: Number(kopLogoSize),
          borderStyle: kopBorderStyle,
          borderColor: kopBorderColor,
          borderThickness: Number(kopBorderThickness)
        }
      };

      await onSaveOfficials(updatedOfficials);
      showNotification('success', 'Identitas Lembaga, Struktur Pejabat & Format Kop Surat berhasil diperbarui!');
    } catch (e) {
      console.error(e);
      showNotification('error', 'Gagal menyimpan identitas lembaga');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintKopSurat = () => {
    const currentOfficials: SchoolOfficials = {
      ...schoolOfficials,
      namaSekolah,
      namaYayasan,
      npsn,
      nsm,
      akreditasi,
      statusSekolah,
      logoUrl,
      alamatSekolah,
      rtRw,
      kelurahan,
      kecamatan,
      kotaSekolah,
      provinsi,
      kodePos,
      teleponSekolah,
      whatsappSekolah,
      emailSekolah,
      website,
      kopSuratConfig: {
        fontFamily: kopFontFamily,
        namaYayasanColor: kopYayasanColor,
        namaYayasanFontSize: Number(kopYayasanFontSize),
        namaSekolahColor: kopSekolahColor,
        namaSekolahFontSize: Number(kopSekolahFontSize),
        statusAkreditasiColor: kopStatusColor,
        alamatColor: kopAlamatColor,
        kontakColor: kopKontakColor,
        layoutAlign: kopLayoutAlign,
        logoPosition: kopLogoPosition,
        secondaryLogoUrl: kopSecondaryLogoUrl.trim(),
        logoSize: Number(kopLogoSize),
        borderStyle: kopBorderStyle,
        borderColor: kopBorderColor,
        borderThickness: Number(kopBorderThickness)
      }
    };

    const kopHtml = renderKopSuratHtml(currentOfficials);
    const fullHtml = `
      <div style="font-family: Arial, sans-serif; font-size: 11pt; color: #000; padding: 20px;">
        ${kopHtml}
        <div style="text-align: center; margin-top: 15px; margin-bottom: 20px;">
          <div style="font-size: 13pt; font-weight: bold; text-decoration: underline; text-transform: uppercase;">SURAT KETERANGAN RESMI LEMBAGA</div>
          <div style="font-size: 10pt; color: #475569; margin-top: 2px;">Nomor: MTs.MI/PP.00.5/085/${new Date().getFullYear()}</div>
        </div>

        <div style="text-align: justify; line-height: 1.6; margin-bottom: 15px;">
          Yang bertanda tangan di bawah ini Kepala <strong>${namaSekolah || "Madrasah Tsanawiyah Manba'ul Islam"}</strong> ${kotaSekolah}, menerangkan dengan sebenarnya bahwa lembar ini merupakan contoh cetak resmi kop surat lembaga yang telah disesuaikan dengan identitas, tata letak, warna fon, dan ukuran logo yang telah dikonfigurasi.
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10.5pt;">
          <tr>
            <td style="width: 200px; padding: 4px 0; font-weight: bold;">Nama Madrasah / Sekolah</td>
            <td style="width: 15px;">:</td>
            <td>${namaSekolah}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-weight: bold;">Yayasan Pengelola</td>
            <td>:</td>
            <td>${namaYayasan}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-weight: bold;">NPSN / NSM</td>
            <td>:</td>
            <td>${npsn} / ${nsm}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-weight: bold;">Status & Akreditasi</td>
            <td>:</td>
            <td>${statusSekolah} (Akreditasi ${akreditasi})</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-weight: bold;">Alamat Lengkap</td>
            <td>:</td>
            <td>${alamatSekolah}, ${kelurahan}, ${kecamatan}, ${kotaSekolah}</td>
          </tr>
        </table>

        <div style="text-align: justify; line-height: 1.6; margin-bottom: 30px;">
          Demikian surat keterangan ini kami sampaikan agar dapat dipergunakan sebagaimana mestinya. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="width: 50%;"></td>
            <td style="width: 50%; text-align: center;">
              <div>${kotaSekolah}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              <div style="font-weight: bold; margin-top: 4px;">Kepala Madrasah / Sekolah,</div>
              <div style="height: 65px;"></div>
              <div style="font-weight: bold; text-decoration: underline;">${kepalaName}</div>
              ${kepalaNip && kepalaNip !== '-' ? `<div>NIP. ${kepalaNip}</div>` : ''}
            </td>
          </tr>
        </table>
      </div>
    `;

    printHtmlString(fullHtml, `Uji_Kop_Surat_${(namaSekolah || 'Madrasah').replace(/\s+/g, '_')}`, {
      paperSize: 'A4',
      layoutMode: 'single-page'
    });
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 text-sm font-bold border animate-in slide-in-from-top-4 duration-300 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/20'
              : 'bg-rose-600 text-white border-rose-500 shadow-rose-900/20'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-200" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-indigo-800/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-amber-300 shadow-inner">
              <Landmark className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                  PENGATURAN MASTER
                </span>
                <span className="text-xs text-indigo-300 font-semibold">
                  NPSN: {npsn || '-'} • NSM: {nsm || '-'}
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white mt-1">
                Identitas Lembaga & Struktur Pejabat
              </h1>
              <p className="text-xs md:text-sm text-indigo-200/90 mt-0.5 max-w-2xl">
                Atur identitas resmi madrasah/sekolah, alamat & kontak, serta susunan pimpinan (Kepala Madrasah, Kesiswaan, Kurikulum, TU, BK) yang tampil di seluruh dokumen resmi & cetakan.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-950/20 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <RotateCcw className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <Save className="w-4 h-4 text-slate-950" />
              )}
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Semua Data'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 mt-6 pt-4 border-t border-indigo-800/80 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('profil')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'profil'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 hover:text-white border border-indigo-700/60'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>1. Profil & Legalitas Lembaga</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('alamat')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'alamat'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 hover:text-white border border-indigo-700/60'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>2. Alamat & Kontak Resmi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pejabat')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'pejabat'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 hover:text-white border border-indigo-700/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>3. Struktur Pimpinan & Pejabat</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview_kop')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'preview_kop'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 hover:text-white border border-indigo-700/60'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>4. Pratinjau Kop Surat Resmi</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PROFIL & LEGALITAS LEMBAGA */}
      {/* ========================================================================= */}
      {activeTab === 'profil' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">
                      Identitas Pokok Lembaga
                    </h2>
                    <p className="text-xs text-slate-500">
                      Nama resmi, naungan yayasan, dan identitas legalitas madrasah
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                  {statusSekolah} • {jenjang}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nama Resmi Sekolah / Madrasah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={namaSekolah}
                    onChange={e => setNamaSekolah(e.target.value)}
                    placeholder="Contoh: MTs Al-Ikhlas / SMP Islam"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Nama ini akan tercetak pada kop surat, rapor, kuitansi kasir, dan sertifikat resmi.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nama Yayasan / Badan Pengelola <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={namaYayasan}
                    onChange={e => setNamaYayasan(e.target.value)}
                    placeholder="Contoh: Yayasan Pendidikan Islam Al-Ikhlas"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    NPSN (Nomor Pokok Sekolah Nasional)
                  </label>
                  <input
                    type="text"
                    value={npsn}
                    onChange={e => setNpsn(e.target.value)}
                    placeholder="Contoh: 20108921"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    NSM / NSS (Nomor Statistik Madrasah)
                  </label>
                  <input
                    type="text"
                    value={nsm}
                    onChange={e => setNsm(e.target.value)}
                    placeholder="Contoh: 121231730005"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Jenjang Pendidikan
                  </label>
                  <select
                    value={jenjang}
                    onChange={e => setJenjang(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition cursor-pointer"
                  >
                    <option value="MTs">MTs (Madrasah Tsanawiyah)</option>
                    <option value="SMK">SMK (Sekolah Menengah Kejuruan)</option>
                    <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                    <option value="SMA">SMA (Sekolah Menengah Atas)</option>
                    <option value="MA">MA (Madrasah Aliyah)</option>
                    <option value="MI">MI (Madrasah Ibtidaiyah)</option>
                    <option value="SD">SD (Sekolah Dasar)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Status Madrasah / Sekolah
                  </label>
                  <select
                    value={statusSekolah}
                    onChange={e => setStatusSekolah(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition cursor-pointer"
                  >
                    <option value="Swasta">Swasta</option>
                    <option value="Negeri">Negeri</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Peringkat Akreditasi BAN-S/M
                  </label>
                  <select
                    value={akreditasi}
                    onChange={e => setAkreditasi(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition cursor-pointer"
                  >
                    <option value="A (Unggul)">A (Unggul / Sangat Baik)</option>
                    <option value="B (Baik)">B (Baik)</option>
                    <option value="C (Cukup)">C (Cukup)</option>
                    <option value="Belum Terakreditasi">Belum Terakreditasi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    SK Izin Operasional / Pendirian
                  </label>
                  <input
                    type="text"
                    value={izinOperasional}
                    onChange={e => setIzinOperasional(e.target.value)}
                    placeholder="Contoh: Kd.09.03/4/PP.00.5/123/2018"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Motto / Slogan / Visi Singkat Madrasah
                  </label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={e => setTagline(e.target.value)}
                    placeholder="Contoh: Madrasah Hebat Bermartabat • Berakhlak Mulia & Berprestasi"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  />
                </div>

                {/* Logo & Lambang Sekolah */}
                <div className="md:col-span-2 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Logo & Lambang Resmi Sekolah / Madrasah</span>
                    <span className="text-[10px] text-slate-400 font-normal">Mendukung Gambar PNG/JPG atau URL Logo</span>
                  </label>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0 shadow-inner relative group">
                      {logoUrl ? (
                        <>
                          <img
                            src={logoUrl}
                            alt="Logo Sekolah"
                            className="w-full h-full object-contain p-1.5"
                            onError={() => setLogoUrl('')}
                          />
                          <button
                            type="button"
                            onClick={() => setLogoUrl('')}
                            className="absolute inset-0 bg-slate-950/70 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
                            title="Hapus Logo"
                          >
                            Hapus
                          </button>
                        </>
                      ) : (
                        <div className="text-center p-2">
                          <Building2 className="w-7 h-7 text-slate-400 mx-auto" />
                          <span className="text-[9px] text-slate-400 font-bold block mt-0.5">Tanpa Logo</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 w-full space-y-2">
                      <div className="flex items-center space-x-2">
                        <label className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs">
                          <FileText className="w-3.5 h-3.5" />
                          <span>Unggah Logo Baru (PNG/JPG)</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                            className="hidden"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 2 * 1024 * 1024) {
                                  showNotification('error', 'Ukuran file logo maksimal 2MB!');
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onload = evt => {
                                  if (evt.target?.result) {
                                    setLogoUrl(evt.target.result as string);
                                    showNotification('success', 'Logo lembaga berhasil dimuat!');
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        {logoUrl && (
                          <button
                            type="button"
                            onClick={() => setLogoUrl('')}
                            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition cursor-pointer border border-rose-200"
                          >
                            Reset Logo
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={logoUrl.startsWith('data:') ? '' : logoUrl}
                        onChange={e => setLogoUrl(e.target.value)}
                        placeholder="Atau tempelkan link URL Logo (https://...)"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:border-indigo-600 outline-none transition"
                      />
                      <p className="text-[10px] text-slate-400">
                        Logo ini otomatis disematkan pada kop surat resmi, kartu siswa, bukti pembayaran kasir, dan laporan akademik.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Ringkasan Profil Card */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-md border border-indigo-800 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-base shadow-sm">
                  {jenjang}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">
                    {namaSekolah || 'Nama Lembaga Belum Diatur'}
                  </h3>
                  <p className="text-xs text-indigo-300">
                    {namaYayasan || 'Yayasan Pengelola'}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-white/10 rounded-2xl border border-white/10 space-y-2.5 text-xs text-indigo-100">
                <div className="flex justify-between">
                  <span className="text-indigo-300">Jenjang & Status:</span>
                  <span className="font-bold text-white">{jenjang} ({statusSekolah})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-indigo-300">NPSN:</span>
                  <span className="font-bold text-white">{npsn || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-indigo-300">NSM:</span>
                  <span className="font-bold text-white">{nsm || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-indigo-300">Akreditasi:</span>
                  <span className="font-extrabold text-amber-300">{akreditasi}</span>
                </div>
              </div>

              <p className="text-[11px] text-indigo-200/80 italic text-center">
                "{tagline}"
              </p>

              <button
                type="button"
                onClick={() => setActiveTab('alamat')}
                className="w-full py-2.5 bg-indigo-700/60 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>Lanjut ke Pengaturan Alamat</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ALAMAT & KONTAK RESMI LEMBAGA */}
      {/* ========================================================================= */}
      {activeTab === 'alamat' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">
                      Alamat Wilayah & Lokasi Lembaga
                    </h2>
                    <p className="text-xs text-slate-500">
                      Lokasi domisili resmi madrasah untuk keperluan persuratan dan administrasi
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Alamat Jalan / Gedung <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={alamatSekolah}
                    onChange={e => setAlamatSekolah(e.target.value)}
                    placeholder="Contoh: Jl. Sandang No. 34"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    RT / RW
                  </label>
                  <input
                    type="text"
                    value={rtRw}
                    onChange={e => setRtRw(e.target.value)}
                    placeholder="Contoh: RT 004 / RW 011"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kelurahan / Desa
                  </label>
                  <input
                    type="text"
                    value={kelurahan}
                    onChange={e => setKelurahan(e.target.value)}
                    placeholder="Contoh: Palmerah"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kecamatan
                  </label>
                  <input
                    type="text"
                    value={kecamatan}
                    onChange={e => setKecamatan(e.target.value)}
                    placeholder="Contoh: Palmerah"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kota / Kabupaten <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={kotaSekolah}
                    onChange={e => setKotaSekolah(e.target.value)}
                    placeholder="Contoh: Jakarta Barat"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Provinsi
                  </label>
                  <input
                    type="text"
                    value={provinsi}
                    onChange={e => setProvinsi(e.target.value)}
                    placeholder="Contoh: DKI Jakarta"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kode Pos
                  </label>
                  <input
                    type="text"
                    value={kodePos}
                    onChange={e => setKodePos(e.target.value)}
                    placeholder="Contoh: 11480"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Kontak & Media Resmi */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100">
                <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Kontak Layanan & Media Resmi
                  </h2>
                  <p className="text-xs text-slate-500">
                    No. telepon, WhatsApp, email, dan portal website sekolah
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    No. Telepon Kantor
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={teleponSekolah}
                      onChange={e => setTeleponSekolah(e.target.value)}
                      placeholder="Contoh: (021) 5321855"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    WhatsApp Layanan / Hotline
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-emerald-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={whatsappSekolah}
                      onChange={e => setWhatsappSekolah(e.target.value)}
                      placeholder="Contoh: 0812-3456-7890"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Resmi Lembaga
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      value={emailSekolah}
                      onChange={e => setEmailSekolah(e.target.value)}
                      placeholder="Contoh: mtsmanbaulislam@gmail.com"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Website / Portal Lembaga
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={website}
                      onChange={e => setWebsite(e.target.value)}
                      placeholder="Contoh: https://mtsmanbaulislam.sch.id"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Alamat Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 pb-3 border-b border-slate-100 flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <span>Format Baris Alamat di Kop Surat</span>
              </h3>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-2 leading-relaxed">
                <p className="font-bold text-slate-900">
                  {alamatSekolah || 'Jl. Pendidikan No. 1'}, {rtRw ? `${rtRw}, ` : ''}{kelurahan ? `Kel. ${kelurahan}, ` : ''}{kecamatan ? `Kec. ${kecamatan}, ` : ''}{kotaSekolah} - {provinsi} {kodePos}
                </p>
                <p className="text-[11px] text-slate-500">
                  Telp: {teleponSekolah || '-'} • WA: {whatsappSekolah || '-'} • Email: {emailSekolah || '-'}
                </p>
                <p className="text-[11px] text-indigo-700 font-semibold">
                  Website: {website || '-'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('pejabat')}
                className="w-full py-2.5 bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-md"
              >
                <span>Lanjut ke Pengaturan Pejabat</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: STRUKTUR PIMPINAN & PEJABAT SEKOLAH */}
      {/* ========================================================================= */}
      {activeTab === 'pejabat' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Petunjuk Pemilihan Pejabat */}
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start space-x-3 text-xs text-amber-900">
            <UserCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-black">Tips Praktis Pengisian Pejabat:</p>
              <p className="mt-0.5 text-amber-800">
                Anda dapat memilih langsung dari daftar guru pengajar yang ada di sistem melalui dropdown <strong>"Pilih dari Daftar Guru"</strong> pada setiap kartu pejabat, atau mengisi nama dan NIP secara manual.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* 1. KEPALA SEKOLAH / MADRASAH */}
            <div className="bg-white rounded-3xl p-6 border-2 border-indigo-200 shadow-sm space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full pointer-events-none" />
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 relative z-10">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2.5 bg-indigo-900 text-amber-400 rounded-2xl shadow-sm">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                      Kepala Madrasah / Sekolah
                    </h3>
                    <p className="text-[11px] text-indigo-700 font-bold">
                      Penanggung Jawab Utama Lembaga
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-800">
                  UTAMA
                </span>
              </div>

              {/* Quick Select */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Pilih dari Daftar Guru:
                </label>
                <select
                  onChange={e => handleSelectTeacherForRole(e.target.value, setKepalaName, setKepalaNip, setKepalaPhone, setKepalaEmail)}
                  defaultValue=""
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="" disabled>-- Pilih Guru untuk Kepala Madrasah --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} (NIP: {t.nip})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Lengkap & Gelar <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={kepalaName}
                    onChange={e => setKepalaName(e.target.value)}
                    placeholder="Contoh: Dra. Hj. Nurjanah, M.Pd"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-600 outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                      NIP / NUPTK / NPK
                    </label>
                    <input
                      type="text"
                      value={kepalaNip}
                      onChange={e => setKepalaNip(e.target.value)}
                      placeholder="197208151998032001"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                      No. WhatsApp / HP
                    </label>
                    <input
                      type="text"
                      value={kepalaPhone}
                      onChange={e => setKepalaPhone(e.target.value)}
                      placeholder="081288991122"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 outline-none transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. WAKA KESISWAAN */}
            <div className="bg-white rounded-3xl p-6 border-2 border-rose-200 shadow-sm space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2.5 bg-rose-600 text-white rounded-2xl shadow-sm">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                      Waka Kesiswaan
                    </h3>
                    <p className="text-[11px] text-rose-700 font-bold">
                      Kedisiplinan, Tata Tertib & Bimbingan BK
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800">
                  KESISWAAN
                </span>
              </div>

              {/* Quick Select */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Pilih dari Daftar Guru:
                </label>
                <select
                  onChange={e => handleSelectTeacherForRole(e.target.value, setKesiswaanName, setKesiswaanNip, setKesiswaanPhone, setKesiswaanEmail)}
                  defaultValue=""
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="" disabled>-- Pilih Guru untuk Waka Kesiswaan --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} (NIP: {t.nip})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Lengkap & Gelar <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={kesiswaanName}
                    onChange={e => setKesiswaanName(e.target.value)}
                    placeholder="Contoh: M. Sholihin, SE"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-rose-600 outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                      NIP / NUPTK
                    </label>
                    <input
                      type="text"
                      value={kesiswaanNip}
                      onChange={e => setKesiswaanNip(e.target.value)}
                      placeholder="85780"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-rose-600 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                      No. WhatsApp / HP
                    </label>
                    <input
                      type="text"
                      value={kesiswaanPhone}
                      onChange={e => setKesiswaanPhone(e.target.value)}
                      placeholder="081234567804"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-rose-600 outline-none transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. WAKA KURIKULUM */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-sm">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                      Waka Kurikulum
                    </h3>
                    <p className="text-[11px] text-emerald-700 font-bold">
                      Jadwal Pembelajaran & Administrasi KBM
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                  KURIKULUM
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Pilih dari Daftar Guru:
                </label>
                <select
                  onChange={e => handleSelectTeacherForRole(e.target.value, setKurikulumName, setKurikulumNip, setKurikulumPhone, setKurikulumEmail)}
                  defaultValue=""
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="" disabled>-- Pilih Guru untuk Waka Kurikulum --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} (NIP: {t.nip})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Lengkap & Gelar <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={kurikulumName}
                    onChange={e => setKurikulumName(e.target.value)}
                    placeholder="Contoh: Agustiani, S.Pd"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                      NIP / NUPTK
                    </label>
                    <input
                      type="text"
                      value={kurikulumNip}
                      onChange={e => setKurikulumNip(e.target.value)}
                      placeholder="85781"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                      No. WhatsApp / HP
                    </label>
                    <input
                      type="text"
                      value={kurikulumPhone}
                      onChange={e => setKurikulumPhone(e.target.value)}
                      placeholder="081234567806"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 outline-none transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. WAKA SARANA & PRASARANA */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2.5 bg-amber-500 text-slate-950 rounded-2xl shadow-sm">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                      Waka Sarana & Prasarana
                    </h3>
                    <p className="text-[11px] text-amber-800 font-bold">
                      Fasilitas & Inventaris Sekolah
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800">
                  SARPRAS
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Pilih dari Daftar Guru:
                </label>
                <select
                  onChange={e => handleSelectTeacherForRole(e.target.value, setSarprasName, setSarprasNip, setSarprasPhone)}
                  defaultValue=""
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="" disabled>-- Pilih Guru untuk Waka Sarpras --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} (NIP: {t.nip})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Lengkap & Gelar
                  </label>
                  <input
                    type="text"
                    value={sarprasName}
                    onChange={e => setSarprasName(e.target.value)}
                    placeholder="Contoh: Sugiyono, S.Pd"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-600 outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                      NIP / NUPTK
                    </label>
                    <input
                      type="text"
                      value={sarprasNip}
                      onChange={e => setSarprasNip(e.target.value)}
                      placeholder="85788"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                      No. WhatsApp / HP
                    </label>
                    <input
                      type="text"
                      value={sarprasPhone}
                      onChange={e => setSarprasPhone(e.target.value)}
                      placeholder="081234567807"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 outline-none transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 5. WAKA HUMAS */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2.5 bg-purple-600 text-white rounded-2xl shadow-sm">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                      Waka Humas / Hubungan Masyarakat
                    </h3>
                    <p className="text-[11px] text-purple-700 font-bold">
                      Kemitraan, Orang Tua & Komunikasi Publik
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-800">
                  HUMAS
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Pilih dari Daftar Guru:
                </label>
                <select
                  onChange={e => handleSelectTeacherForRole(e.target.value, setHumasName, setHumasNip, setHumasPhone)}
                  defaultValue=""
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="" disabled>-- Pilih Guru untuk Waka Humas --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} (NIP: {t.nip})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Lengkap & Gelar
                  </label>
                  <input
                    type="text"
                    value={humasName}
                    onChange={e => setHumasName(e.target.value)}
                    placeholder="Contoh: Erna Ekawati, SH"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-purple-600 outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                      NIP / NUPTK
                    </label>
                    <input
                      type="text"
                      value={humasNip}
                      onChange={e => setHumasNip(e.target.value)}
                      placeholder="85798"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-purple-600 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                      No. WhatsApp / HP
                    </label>
                    <input
                      type="text"
                      value={humasPhone}
                      onChange={e => setHumasPhone(e.target.value)}
                      placeholder="081234567808"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-purple-600 outline-none transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 6. KEPALA TATA USAHA */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2.5 bg-cyan-600 text-white rounded-2xl shadow-sm">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                      Kepala Tata Usaha (Ka. TU)
                    </h3>
                    <p className="text-[11px] text-cyan-700 font-bold">
                      Administrasi Persuratan & Kepegawaian
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-cyan-100 text-cyan-800">
                  TATA USAHA
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Pilih dari Daftar Guru / Staf:
                </label>
                <select
                  onChange={e => handleSelectTeacherForRole(e.target.value, setTuName, setTuNip, setTuPhone)}
                  defaultValue=""
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="" disabled>-- Pilih Staf/Guru untuk Kepala TU --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} (NIP: {t.nip})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Lengkap & Gelar
                  </label>
                  <input
                    type="text"
                    value={tuName}
                    onChange={e => setTuName(e.target.value)}
                    placeholder="Contoh: Akhmad Taufik"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-cyan-600 outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                      NIP / NUPTK
                    </label>
                    <input
                      type="text"
                      value={tuNip}
                      onChange={e => setTuNip(e.target.value)}
                      placeholder="85804"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-cyan-600 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                      No. WhatsApp / HP
                    </label>
                    <input
                      type="text"
                      value={tuPhone}
                      onChange={e => setTuPhone(e.target.value)}
                      placeholder="081234567809"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-cyan-600 outline-none transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 7. KOORDINATOR BK / BP */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2.5 bg-teal-600 text-white rounded-2xl shadow-sm">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                      Koordinator Guru BK / BP
                    </h3>
                    <p className="text-[11px] text-teal-700 font-bold">
                      Bimbingan Konseling & Konsultasi Siswa
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-teal-100 text-teal-800">
                  BK / BP
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Pilih dari Daftar Guru:
                </label>
                <select
                  onChange={e => handleSelectTeacherForRole(e.target.value, setBkName, setBkNip, setBkPhone)}
                  defaultValue=""
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="" disabled>-- Pilih Guru untuk Koordinator BK --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} (NIP: {t.nip})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Lengkap & Gelar
                  </label>
                  <input
                    type="text"
                    value={bkName}
                    onChange={e => setBkName(e.target.value)}
                    placeholder="Contoh: Fahmi, S.Pd"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-teal-600 outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                      NIP / NUPTK
                    </label>
                    <input
                      type="text"
                      value={bkNip}
                      onChange={e => setBkNip(e.target.value)}
                      placeholder="85821"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                      No. WhatsApp / HP
                    </label>
                    <input
                      type="text"
                      value={bkPhone}
                      onChange={e => setBkPhone(e.target.value)}
                      placeholder="081234567810"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 outline-none transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 8. TIM BENDAHARA MADRASAH */}
            <div className="bg-gradient-to-br from-indigo-50 to-slate-50 rounded-3xl p-6 border border-indigo-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2.5 bg-indigo-700 text-white rounded-2xl shadow-sm">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                      Tim Bendahara Madrasah
                    </h3>
                    <p className="text-[11px] text-indigo-700 font-bold">
                      Pengelola Kas & Pembayaran Siswa
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-800">
                  KEUANGAN
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-700">
                <div className="p-3 bg-white rounded-xl border border-indigo-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                      Bendahara Utama
                    </span>
                    <p className="font-bold text-slate-900 mt-1">
                      {schoolOfficials.bendaharaUtama?.name || 'Hj. Siti Mardhiyah, S.E., M.M.'}
                    </p>
                  </div>
                  <span className="text-slate-500 font-mono text-[11px]">
                    {schoolOfficials.bendaharaUtama?.nip || '-'}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-indigo-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-md">
                      Bendahara 1 (SPP/Kas)
                    </span>
                    <p className="font-bold text-slate-900 mt-1">
                      {schoolOfficials.bendahara?.name || 'Siti Rahmawati, S.E.'}
                    </p>
                  </div>
                  <span className="text-slate-500 font-mono text-[11px]">
                    {schoolOfficials.bendahara?.nip || '-'}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                * Manajemen lengkap kode PIN & nama Bendahara 1 s/d 5 dapat dikelola pada menu <strong>Khusus Super Admin</strong> atau <strong>Pembayaran Siswa</strong>.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PRATINJAU KOP SURAT RESMI & PENGATURAN TATA LETAK, WARNA, LOGO */}
      {/* ========================================================================= */}
      {activeTab === 'preview_kop' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Header & Quick Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <div className="flex items-center space-x-2 text-indigo-950 font-black text-sm">
                <Palette className="w-4 h-4 text-indigo-600" />
                <span>Pengaturan Format & Pratinjau Kop Surat Resmi</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Sesuaikan warna fon, tata letak logo, jenis font, dan ukuran logo. Berlaku otomatis ke seluruh surat di sistem.
              </p>
            </div>
            <div className="flex items-center space-x-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  const def = DEFAULT_KOP_CONFIG;
                  setKopFontFamily(def.fontFamily || 'Arial');
                  setKopYayasanColor(def.namaYayasanColor || '#1e293b');
                  setKopYayasanFontSize(def.namaYayasanFontSize || 11);
                  setKopSekolahColor(def.namaSekolahColor || '#047857');
                  setKopSekolahFontSize(def.namaSekolahFontSize || 15);
                  setKopStatusColor(def.statusAkreditasiColor || '#334155');
                  setKopAlamatColor(def.alamatColor || '#475569');
                  setKopKontakColor(def.kontakColor || '#64748b');
                  setKopLayoutAlign(def.layoutAlign || 'center');
                  setKopLogoPosition(def.logoPosition || 'left');
                  setKopSecondaryLogoUrl('');
                  setKopLogoSize(def.logoSize || 75);
                  setKopBorderStyle(def.borderStyle || 'double');
                  setKopBorderColor(def.borderColor || '#000000');
                  setKopBorderThickness(def.borderThickness || 3);
                  showNotification('success', 'Pengaturan Kop berhasil direset ke standar!');
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
                title="Reset pengaturan kop ke format standar default"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Standar</span>
              </button>

              <button
                type="button"
                onClick={handlePrintKopSurat}
                className="px-4 py-2 bg-indigo-900 hover:bg-indigo-800 text-white font-black text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Uji Cetak (A4)</span>
              </button>
            </div>
          </div>

          {/* Quick Theme Presets */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-lg border border-slate-800">
            <div className="flex items-center space-x-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black tracking-wide uppercase text-slate-200">Pilihan Cepat / Preset Tema Warna Kop:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setKopSekolahColor('#047857');
                  setKopYayasanColor('#1e293b');
                  setKopBorderColor('#000000');
                  setKopStatusColor('#334155');
                  setKopAlamatColor('#475569');
                  setKopKontakColor('#64748b');
                  showNotification('success', 'Tema Hijau Kemenag diterapkan');
                }}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  kopSekolahColor === '#047857' ? 'bg-emerald-950/80 border-emerald-400 ring-2 ring-emerald-400/40' : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-600 border border-white/20"></div>
                  <span className="text-xs font-black text-emerald-300">Hijau Kemenag</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1">Standar Madrasah</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setKopSekolahColor('#1e3a8a');
                  setKopYayasanColor('#1e293b');
                  setKopBorderColor('#1e3a8a');
                  setKopStatusColor('#334155');
                  setKopAlamatColor('#475569');
                  setKopKontakColor('#64748b');
                  showNotification('success', 'Tema Biru Kemdikbud diterapkan');
                }}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  kopSekolahColor === '#1e3a8a' ? 'bg-blue-950/80 border-blue-400 ring-2 ring-blue-400/40' : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <div className="w-3 h-3 rounded-full bg-blue-700 border border-white/20"></div>
                  <span className="text-xs font-black text-blue-300">Biru Navy</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1">Standar Sekolah/SMK</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setKopSekolahColor('#000000');
                  setKopYayasanColor('#000000');
                  setKopBorderColor('#000000');
                  setKopStatusColor('#334155');
                  setKopAlamatColor('#475569');
                  setKopKontakColor('#64748b');
                  showNotification('success', 'Tema Hitam Klasik diterapkan');
                }}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  kopSekolahColor === '#000000' && kopYayasanColor === '#000000' ? 'bg-slate-800 border-white ring-2 ring-white/40' : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <div className="w-3 h-3 rounded-full bg-black border border-white/40"></div>
                  <span className="text-xs font-black text-white">Hitam Monokrom</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1">Klasik Kedinasan</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setKopSekolahColor('#991b1b');
                  setKopYayasanColor('#1e293b');
                  setKopBorderColor('#991b1b');
                  setKopStatusColor('#334155');
                  setKopAlamatColor('#475569');
                  setKopKontakColor('#64748b');
                  showNotification('success', 'Tema Marun Formal diterapkan');
                }}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  kopSekolahColor === '#991b1b' ? 'bg-rose-950/80 border-rose-400 ring-2 ring-rose-400/40' : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-700 border border-white/20"></div>
                  <span className="text-xs font-black text-rose-300">Merah Marun</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1">Formal & Berani</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setKopSekolahColor('#b45309');
                  setKopYayasanColor('#3f2e18');
                  setKopBorderColor('#78350f');
                  setKopStatusColor('#334155');
                  setKopAlamatColor('#475569');
                  setKopKontakColor('#64748b');
                  showNotification('success', 'Tema Emas Cokelat diterapkan');
                }}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  kopSekolahColor === '#b45309' ? 'bg-amber-950/80 border-amber-400 ring-2 ring-amber-400/40' : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <div className="w-3 h-3 rounded-full bg-amber-600 border border-white/20"></div>
                  <span className="text-xs font-black text-amber-300">Cokelat Emas</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1">Khidmat & Elegan</span>
              </button>
            </div>
          </div>

          {/* Control Settings Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* Card 1: Pengaturan Warna Fon */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 text-indigo-950 font-black text-xs uppercase tracking-wider border-b pb-2">
                <Palette className="w-4 h-4 text-indigo-600" />
                <span>1. Warna & Ukuran Fon</span>
              </div>

              {/* Warna Nama Sekolah */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Warna Nama Lembaga / Sekolah</span>
                  <span className="text-[10px] font-mono text-slate-500">{kopSekolahColor}</span>
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={kopSekolahColor}
                    onChange={(e) => setKopSekolahColor(e.target.value)}
                    className="w-10 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                  />
                  <div className="flex items-center space-x-1 flex-1">
                    {['#047857', '#1e3a8a', '#000000', '#991b1b', '#b45309', '#4338ca'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setKopSekolahColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-md border border-white/40 shadow-xs cursor-pointer transition ${
                          kopSekolahColor.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-indigo-600 scale-110' : 'hover:scale-105'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Ukuran Fon Nama Sekolah */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Ukuran Fon Nama Sekolah</span>
                  <span className="text-[11px] font-bold text-indigo-600">{kopSekolahFontSize} pt</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="20"
                  step="1"
                  value={kopSekolahFontSize}
                  onChange={(e) => setKopSekolahFontSize(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Warna Nama Yayasan */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Warna Nama Yayasan</span>
                  <span className="text-[10px] font-mono text-slate-500">{kopYayasanColor}</span>
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={kopYayasanColor}
                    onChange={(e) => setKopYayasanColor(e.target.value)}
                    className="w-10 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                  />
                  <div className="flex items-center space-x-1 flex-1">
                    {['#1e293b', '#000000', '#047857', '#1e3a8a', '#475569'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setKopYayasanColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-md border border-white/40 shadow-xs cursor-pointer transition ${
                          kopYayasanColor.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-indigo-600 scale-110' : 'hover:scale-105'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Ukuran Fon Nama Yayasan */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Ukuran Fon Nama Yayasan</span>
                  <span className="text-[11px] font-bold text-indigo-600">{kopYayasanFontSize} pt</span>
                </div>
                <input
                  type="range"
                  min="9"
                  max="14"
                  step="0.5"
                  value={kopYayasanFontSize}
                  onChange={(e) => setKopYayasanFontSize(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Warna Elemen Pendukung */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 block">Warna Status/Akred</label>
                  <input
                    type="color"
                    value={kopStatusColor}
                    onChange={(e) => setKopStatusColor(e.target.value)}
                    className="w-full h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 block">Warna Alamat & Kontak</label>
                  <input
                    type="color"
                    value={kopAlamatColor}
                    onChange={(e) => {
                      setKopAlamatColor(e.target.value);
                      setKopKontakColor(e.target.value);
                    }}
                    className="w-full h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Pengaturan Tata Letak & Tipografi */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 text-indigo-950 font-black text-xs uppercase tracking-wider border-b pb-2">
                <Layout className="w-4 h-4 text-indigo-600" />
                <span>2. Tata Letak & Tipografi</span>
              </div>

              {/* Jenis Font */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Pilihan Jenis Font (Font Family)</label>
                <select
                  value={kopFontFamily}
                  onChange={(e) => setKopFontFamily(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                >
                  <option value="Arial">Arial (Modern & Bersih - Standar)</option>
                  <option value="Times New Roman">Times New Roman (Klasik Kedinasan)</option>
                  <option value="Bookman Old Style">Bookman Old Style (Formal Elegan)</option>
                  <option value="Calibri">Calibri (Standar Modern)</option>
                  <option value="Georgia">Georgia (Serif Elegan)</option>
                </select>
              </div>

              {/* Posisi Logo */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Posisi Penempatan Logo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setKopLogoPosition('left')}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition flex items-center space-x-1.5 cursor-pointer ${
                      kopLogoPosition === 'left' ? 'bg-indigo-50 border-indigo-600 text-indigo-950 ring-1 ring-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>🏢</span>
                    <span>Logo di Kiri (Standar)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setKopLogoPosition('right')}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition flex items-center space-x-1.5 cursor-pointer ${
                      kopLogoPosition === 'right' ? 'bg-indigo-50 border-indigo-600 text-indigo-950 ring-1 ring-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>🏫</span>
                    <span>Logo di Kanan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setKopLogoPosition('both')}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition flex items-center space-x-1.5 cursor-pointer ${
                      kopLogoPosition === 'both' ? 'bg-indigo-50 border-indigo-600 text-indigo-950 ring-1 ring-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>🏛️</span>
                    <span>Logo Ganda (Kiri & Kanan)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setKopLogoPosition('top_center')}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition flex items-center space-x-1.5 cursor-pointer ${
                      kopLogoPosition === 'top_center' ? 'bg-indigo-50 border-indigo-600 text-indigo-950 ring-1 ring-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>📑</span>
                    <span>Logo Atas Tengah</span>
                  </button>
                </div>
              </div>

              {/* Perataan Teks Kop */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Perataan Teks Kop</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setKopLayoutAlign('center')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                      kopLayoutAlign === 'center' ? 'bg-indigo-50 border-indigo-600 text-indigo-950 ring-1 ring-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                    <span>Rata Tengah (Center)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setKopLayoutAlign('left')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                      kopLayoutAlign === 'left' ? 'bg-indigo-50 border-indigo-600 text-indigo-950 ring-1 ring-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                    <span>Rata Kiri (Left)</span>
                  </button>
                </div>
              </div>

              {/* Gaya Garis Pembatas Kop */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-slate-700">Gaya Garis Pembatas Bawah</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setKopBorderStyle('double')}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      kopBorderStyle === 'double' ? 'bg-indigo-50 border-indigo-600 text-indigo-950' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    Garis Ganda (Standar)
                  </button>
                  <button
                    type="button"
                    onClick={() => setKopBorderStyle('solid')}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      kopBorderStyle === 'solid' ? 'bg-indigo-50 border-indigo-600 text-indigo-950' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    Garis Tunggal Tebal
                  </button>
                  <button
                    type="button"
                    onClick={() => setKopBorderStyle('classic_double')}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      kopBorderStyle === 'classic_double' ? 'bg-indigo-50 border-indigo-600 text-indigo-950' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    Garis Klasik Tipis-Tebal
                  </button>
                  <button
                    type="button"
                    onClick={() => setKopBorderStyle('none')}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      kopBorderStyle === 'none' ? 'bg-indigo-50 border-indigo-600 text-indigo-950' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    Tanpa Garis
                  </button>
                </div>
              </div>

              {/* Warna Garis Pembatas */}
              {kopBorderStyle !== 'none' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Warna Garis Pembatas</span>
                    <span className="text-[10px] font-mono text-slate-500">{kopBorderColor}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={kopBorderColor}
                      onChange={(e) => setKopBorderColor(e.target.value)}
                      className="w-10 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                    />
                    <div className="flex items-center space-x-1 flex-1">
                      {['#000000', '#047857', '#1e3a8a', '#991b1b', '#334155'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setKopBorderColor(c)}
                          style={{ backgroundColor: c }}
                          className={`w-6 h-6 rounded-md border border-white/40 cursor-pointer ${
                            kopBorderColor.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-indigo-600' : ''
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Card 3: Pengaturan Ukuran Logo & Logo Sekunder */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 text-indigo-950 font-black text-xs uppercase tracking-wider border-b pb-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>3. Ukuran Logo & Logo Sekunder</span>
              </div>

              {/* Slider Ukuran Logo */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Ukuran Logo Utama (Tinggi/Lebar)</span>
                  <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                    {kopLogoSize} px
                  </span>
                </div>

                <input
                  type="range"
                  min="45"
                  max="120"
                  step="5"
                  value={kopLogoSize}
                  onChange={(e) => setKopLogoSize(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />

                {/* Preset Ukuran Cepat */}
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {[
                    { label: 'Kecil', size: 60 },
                    { label: 'Standar', size: 75 },
                    { label: 'Besar', size: 90 },
                    { label: 'Ekstra', size: 105 }
                  ].map(p => (
                    <button
                      key={p.size}
                      type="button"
                      onClick={() => setKopLogoSize(p.size)}
                      className={`py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                        kopLogoSize === p.size ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {p.label} ({p.size})
                    </button>
                  ))}
                </div>
              </div>

              {/* Logo Preview Info */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center space-x-3">
                <div
                  style={{ width: `${Math.min(50, kopLogoSize)}px`, height: `${Math.min(50, kopLogoSize)}px` }}
                  className="shrink-0 rounded-lg bg-white border border-slate-200 flex items-center justify-center p-1 overflow-hidden"
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800 truncate">
                    {logoUrl ? 'Logo Lembaga Terpasang' : 'Belum Ada Logo'}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {logoUrl ? 'Kelola file logo pada Tab 1 (Profil Lembaga)' : 'Unggah file logo pada Tab 1'}
                  </p>
                </div>
              </div>

              {/* Logo Sekunder (Jika Mode Logo Ganda Aktif) */}
              {kopLogoPosition === 'both' && (
                <div className="space-y-2 pt-2 border-t border-slate-200 animate-in fade-in">
                  <label className="text-xs font-bold text-indigo-950 flex items-center space-x-1.5">
                    <span>🏛️ Logo Sekunder (Kanan)</span>
                  </label>
                  <p className="text-[10px] text-slate-500">
                    Masukkan URL gambar logo ke-2 (misal Logo Kemenag / Yayasan / Tut Wuri Handayani / Pemda):
                  </p>
                  <input
                    type="text"
                    value={kopSecondaryLogoUrl}
                    onChange={(e) => setKopSecondaryLogoUrl(e.target.value)}
                    placeholder="https://... atau data:image/png;base64,..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                  {/* Preset Kemenag / Tut Wuri */}
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setKopSecondaryLogoUrl('https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Logo_Kementerian_Agama_Republik_Indonesia.svg/512px-Logo_Kementerian_Agama_Republik_Indonesia.svg.png')}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-lg border border-emerald-200 transition cursor-pointer"
                    >
                      + Logo Kemenag RI
                    </button>
                    <button
                      type="button"
                      onClick={() => setKopSecondaryLogoUrl('https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg/512px-Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg.png')}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 text-[10px] font-bold rounded-lg border border-blue-200 transition cursor-pointer"
                    >
                      + Logo Kemdikbud
                    </button>
                  </div>
                </div>
              )}

              {/* Status Info */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[11px] flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  Pengaturan ini akan tersimpan permanen dan otomatis disinkronkan ke <strong>Surat Keluar</strong>, <strong>Surat Masuk (Disposisi)</strong>, <strong>Surat Peringatan Siswa</strong>, dan <strong>Surat Perjanjian</strong>.
                </p>
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* LEMBAR SIMULASI KERTAS A4 (INTERACTIVE LIVE PREVIEW) */}
          {/* ========================================================================= */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center space-x-2 text-xs font-black text-slate-700 uppercase tracking-wider">
                <Eye className="w-4 h-4 text-indigo-600" />
                <span>Simulasi Lembar Kertas A4 (Hasil Tampilan Riil)</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Format: A4 Portrait • Skala 100%</span>
            </div>

            <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-2xl border border-slate-300 print:p-0 print:border-none print:shadow-none text-slate-950">
              
              {/* RENDER LIVE KOP SURAT BERDASARKAN STATE */}
              <div
                dangerouslySetInnerHTML={{
                  __html: renderKopSuratHtml(
                    {
                      ...schoolOfficials,
                      namaSekolah,
                      namaYayasan,
                      npsn,
                      nsm,
                      akreditasi,
                      statusSekolah,
                      logoUrl,
                      alamatSekolah,
                      rtRw,
                      kelurahan,
                      kecamatan,
                      kotaSekolah,
                      provinsi,
                      kodePos,
                      teleponSekolah,
                      whatsappSekolah,
                      emailSekolah,
                      website,
                      kopSuratConfig: {
                        fontFamily: kopFontFamily,
                        namaYayasanColor: kopYayasanColor,
                        namaYayasanFontSize: Number(kopYayasanFontSize),
                        namaSekolahColor: kopSekolahColor,
                        namaSekolahFontSize: Number(kopSekolahFontSize),
                        statusAkreditasiColor: kopStatusColor,
                        alamatColor: kopAlamatColor,
                        kontakColor: kopKontakColor,
                        layoutAlign: kopLayoutAlign,
                        logoPosition: kopLogoPosition,
                        secondaryLogoUrl: kopSecondaryLogoUrl.trim(),
                        logoSize: Number(kopLogoSize),
                        borderStyle: kopBorderStyle,
                        borderColor: kopBorderColor,
                        borderThickness: Number(kopBorderThickness)
                      }
                    }
                  )
                }}
              />

              {/* Simulasi Isi Surat */}
              <div className="space-y-4 text-xs leading-relaxed text-slate-800" style={{ fontFamily: kopFontFamily === 'Times New Roman' ? "'Times New Roman', serif" : kopFontFamily === 'Bookman Old Style' ? "'Bookman Old Style', serif" : 'Arial, sans-serif' }}>
                <div className="text-center py-2">
                  <h4 className="font-bold text-sm tracking-wider uppercase underline">
                    SURAT KETERANGAN RESMI LEMBAGA
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 font-mono">
                    Nomor: MTs.MI/PP.00.5/085/{new Date().getFullYear()}
                  </p>
                </div>

                <p className="text-justify">
                  Yang bertanda tangan di bawah ini Kepala <strong>{namaSekolah || "Madrasah Tsanawiyah Manba'ul Islam"}</strong> {kotaSekolah}, menerangkan dengan sebenarnya bahwa lembaga ini berkedudukan di {alamatSekolah}, {kotaSekolah}, {provinsi} di bawah naungan <strong>{namaYayasan}</strong> dengan legalitas NPSN <strong>{npsn}</strong> dan NSM <strong>{nsm}</strong>.
                </p>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-[11px] space-y-1.5 font-sans">
                  <div className="grid grid-cols-3">
                    <span className="font-bold">Nama Madrasah / Sekolah</span>
                    <span className="col-span-2">: {namaSekolah}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="font-bold">Kepala Madrasah</span>
                    <span className="col-span-2">: {kepalaName} (NIP: {kepalaNip || '-'})</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="font-bold">Waka Bidang Kesiswaan</span>
                    <span className="col-span-2">: {kesiswaanName} (NIP: {kesiswaanNip || '-'})</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="font-bold">Waka Bidang Kurikulum</span>
                    <span className="col-span-2">: {kurikulumName} (NIP: {kurikulumNip || '-'})</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="font-bold">Alamat Lembaga</span>
                    <span className="col-span-2">: {alamatSekolah}, {kelurahan}, {kecamatan}, {kotaSekolah}</span>
                  </div>
                </div>

                {/* Tanda Tangan Simulasi */}
                <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
                  <div>
                    <p className="text-[11px]">Mengetahui,</p>
                    <p className="font-bold">Waka Kesiswaan</p>
                    <div className="h-16" />
                    <p className="font-black underline">{kesiswaanName}</p>
                    <p className="text-[10px] text-slate-500 font-mono">NIP. {kesiswaanNip || '-'}</p>
                  </div>

                  <div>
                    <p className="text-[11px]">{kotaSekolah}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p className="font-bold">Kepala Madrasah</p>
                    <div className="h-16" />
                    <p className="font-black underline">{kepalaName}</p>
                    <p className="text-[10px] text-slate-500 font-mono">NIP. {kepalaNip || '-'}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* Floating Bottom Save Action Bar */}
      <div className="sticky bottom-4 z-40 bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-700 max-w-3xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
            <Check className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">
              Simpan Identitas Lembaga & Pejabat
            </p>
            <p className="text-[10px] text-slate-400">
              Otomatis diterapkan ke kop surat, kesiswaan, jadwal & seluruh modul
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          disabled={isSaving}
          className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <RotateCcw className="w-4 h-4 animate-spin text-slate-950" />
          ) : (
            <Save className="w-4 h-4 text-slate-950" />
          )}
          <span>{isSaving ? 'Menyimpan...' : 'Simpan Data'}</span>
        </button>
      </div>

    </div>
  );
};
