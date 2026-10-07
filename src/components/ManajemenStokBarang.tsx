import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Trash2,
  Printer,
  FileSpreadsheet,
  Shirt,
  BookOpen,
  Tag,
  Layers,
  History,
  ShoppingBag,
  Info,
  X,
  PlusCircle,
  TrendingDown,
  UserCheck,
  Calendar,
  DollarSign
} from 'lucide-react';
import {
  InventoryItem,
  InventoryMovementLog,
  InventoryCategory,
  UniformType,
  ItemSize,
  Student,
  PaymentTransaction,
  SchoolOfficials,
  BendaharaPerson
} from '../types';

interface ManajemenStokBarangProps {
  inventory: InventoryItem[];
  inventoryLogs: InventoryMovementLog[];
  students: Student[];
  classList: string[];
  activeTreasurer: BendaharaPerson;
  schoolOfficials?: SchoolOfficials;
  academicYear: string;
  onSaveInventoryItem: (item: InventoryItem) => Promise<void> | void;
  onDeleteInventoryItem: (itemId: string) => Promise<void> | void;
  onSaveInventoryLog: (log: InventoryMovementLog) => Promise<void> | void;
  onDeductStock: (
    itemId: string,
    qty: number,
    metadata: {
      studentId?: string;
      studentName?: string;
      studentClass?: string;
      invoiceNumber?: string;
      paymentId?: string;
      treasurerName: string;
      notes?: string;
      date?: string;
    }
  ) => { success: boolean; item?: InventoryItem; log?: InventoryMovementLog; error?: string };
  onRestockItem: (
    itemId: string,
    qty: number,
    metadata: {
      treasurerName: string;
      notes?: string;
      date?: string;
      unitPrice?: number;
    }
  ) => { success: boolean; item?: InventoryItem; log?: InventoryMovementLog };
  onRecordQuickSalePayment?: (payment: PaymentTransaction) => Promise<void> | void;
}

const UNIFORM_OPTIONS: UniformType[] = [
  'Baju Olahraga',
  'Baju Kotak',
  'Rok Kotak',
  'Almamater',
  'Baju Jurusan',
  'Baju Khas',
  'Baju Batik',
  'Baju Muslim'
];

const SIZE_OPTIONS: ItemSize[] = ['S', 'M', 'L', 'XL', 'XXL', '3XL', 'All Size', 'Standar'];

export const ManajemenStokBarang: React.FC<ManajemenStokBarangProps> = ({
  inventory,
  inventoryLogs,
  students,
  classList,
  activeTreasurer,
  schoolOfficials,
  academicYear,
  onSaveInventoryItem,
  onDeleteInventoryItem,
  onSaveInventoryLog,
  onDeductStock,
  onRestockItem,
  onRecordQuickSalePayment
}) => {
  // Tabs & Views
  const [activeTab, setActiveTab] = useState<'katalog' | 'mutasi'>('katalog');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | InventoryCategory>('ALL');
  const [uniformTypeFilter, setUniformTypeFilter] = useState<'ALL' | UniformType | string>('ALL');
  const [sizeFilter, setSizeFilter] = useState<string>('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState<'ALL' | 'CRITICAL' | 'AVAILABLE' | 'OUT_OF_STOCK'>('ALL');

  // Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedRestockItem, setSelectedRestockItem] = useState<InventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState<number>(10);
  const [restockNotes, setRestockNotes] = useState<string>('');
  const [restockDate, setRestockDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const [showQuickSaleModal, setShowQuickSaleModal] = useState(false);
  const [selectedSaleStudentClass, setSelectedSaleStudentClass] = useState<string>(classList[0] || 'VII A');
  const [selectedSaleStudentId, setSelectedSaleStudentId] = useState<string>('');
  const [selectedSaleItemId, setSelectedSaleItemId] = useState<string>('');
  const [saleQuantity, setSaleQuantity] = useState<number>(1);
  const [salePaymentMethod, setSalePaymentMethod] = useState<'Tunai' | 'Transfer Bank' | 'QRIS'>('Tunai');
  const [saleNotes, setSaleNotes] = useState<string>('');
  const [saleDate, setSaleDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Form State for Add / Edit Item
  const [formCategory, setFormCategory] = useState<InventoryCategory>('SERAGAM');
  const [formVariantType, setFormVariantType] = useState<UniformType | string>('Baju Olahraga');
  const [formName, setFormName] = useState<string>('');
  const [formItemCode, setFormItemCode] = useState<string>('');
  const [formSize, setFormSize] = useState<ItemSize | string>('M');
  const [formGradeLevel, setFormGradeLevel] = useState<string>('SEMUA');
  const [formUnitPrice, setFormUnitPrice] = useState<number>(120000);
  const [formCurrentStock, setFormCurrentStock] = useState<number>(20);
  const [formMinStockAlert, setFormMinStockAlert] = useState<number>(5);
  const [formDescription, setFormDescription] = useState<string>('');

  // Delete Confirmation
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  // Success Feedback Alert
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>('');

  const triggerSuccessMsg = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  // Open Add Item Modal
  const handleOpenAddModal = (presetCategory: InventoryCategory = 'SERAGAM', presetUniform?: UniformType) => {
    setEditingItem(null);
    setFormCategory(presetCategory);
    setFormVariantType(presetUniform || 'Baju Olahraga');
    const defaultName = presetCategory === 'SERAGAM'
      ? `${presetUniform || 'Baju Olahraga'} (Ukuran M)`
      : presetCategory === 'LKS'
      ? 'Paket LKS Lengkap'
      : 'Topi Upacara';
    setFormName(defaultName);
    setFormItemCode('');
    setFormSize(presetCategory === 'SERAGAM' ? 'M' : 'Standar');
    setFormGradeLevel('SEMUA');
    setFormUnitPrice(presetCategory === 'SERAGAM' ? 120000 : presetCategory === 'LKS' ? 150000 : 25000);
    setFormCurrentStock(20);
    setFormMinStockAlert(5);
    setFormDescription('');
    setShowItemModal(true);
  };

  // Open Edit Item Modal
  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormCategory(item.category);
    setFormVariantType(item.variantType || 'Baju Olahraga');
    setFormName(item.name);
    setFormItemCode(item.itemCode);
    setFormSize(item.size || 'Standar');
    setFormGradeLevel(item.gradeLevel || 'SEMUA');
    setFormUnitPrice(item.unitPrice);
    setFormCurrentStock(item.currentStock);
    setFormMinStockAlert(item.minStockAlert);
    setFormDescription(item.description || '');
    setShowItemModal(true);
  };

  // Auto Generate Item Code if empty
  const generateSuggestedCode = (cat: InventoryCategory, variant?: string, size?: string) => {
    const catPrefix = cat === 'SERAGAM' ? 'SRG' : cat === 'LKS' ? 'LKS' : 'ATB';
    const subPrefix = variant ? variant.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase() : 'ITM';
    const sizeSuffix = size && size !== 'Standar' && size !== 'All Size' ? `-${size}` : '';
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `${catPrefix}-${subPrefix}${sizeSuffix}-${randomNum}`;
  };

  // Handle Save Item (Add or Edit)
  const handleSaveItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Nama barang wajib diisi');
      return;
    }

    const itemCode = formItemCode.trim() || generateSuggestedCode(formCategory, formVariantType, formSize);

    if (editingItem) {
      // Edit mode
      const updatedItem: InventoryItem = {
        ...editingItem,
        category: formCategory,
        variantType: formCategory === 'SERAGAM' ? formVariantType : undefined,
        name: formName.trim(),
        itemCode: itemCode,
        size: formSize,
        gradeLevel: formGradeLevel,
        unitPrice: formUnitPrice,
        currentStock: Number(formCurrentStock),
        minStockAlert: Number(formMinStockAlert),
        description: formDescription.trim(),
        updatedAt: new Date().toISOString()
      };
      await onSaveInventoryItem(updatedItem);
      triggerSuccessMsg(`Data barang "${updatedItem.name}" berhasil diperbarui!`);
    } else {
      // Create new
      const newItem: InventoryItem = {
        id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        itemCode: itemCode,
        category: formCategory,
        variantType: formCategory === 'SERAGAM' ? formVariantType : undefined,
        name: formName.trim(),
        size: formSize,
        gradeLevel: formGradeLevel,
        unitPrice: formUnitPrice,
        currentStock: Number(formCurrentStock),
        minStockAlert: Number(formMinStockAlert),
        totalSold: 0,
        totalRestocked: Number(formCurrentStock),
        description: formDescription.trim(),
        createdAt: new Date().toISOString()
      };
      await onSaveInventoryItem(newItem);
      triggerSuccessMsg(`Barang baru "${newItem.name}" (${newItem.itemCode}) berhasil ditambahkan!`);
    }

    setShowItemModal(false);
  };

  // Handle Restock Submit
  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestockItem || restockQty <= 0) return;

    const res = onRestockItem(selectedRestockItem.id, restockQty, {
      treasurerName: activeTreasurer.name,
      notes: restockNotes || `Restock pengadaan barang ${selectedRestockItem.name}`,
      date: restockDate
    });

    if (res.success && res.item) {
      await onSaveInventoryItem(res.item);
      if (res.log) {
        await onSaveInventoryLog(res.log);
      }
      triggerSuccessMsg(`Berhasil menambah +${restockQty} unit untuk "${res.item.name}". Sisa stok sekarang: ${res.item.currentStock} unit.`);
    }

    setShowRestockModal(false);
    setSelectedRestockItem(null);
    setRestockQty(10);
    setRestockNotes('');
  };

  // Handle Quick Sale / POS Submit
  const handleQuickSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSaleItemId || saleQuantity <= 0) {
      alert('Pilih barang dan jumlah pembelian terlebih dahulu');
      return;
    }

    const item = inventory.find(i => i.id === selectedSaleItemId);
    if (!item) {
      alert('Barang tidak ditemukan');
      return;
    }

    if (item.currentStock < saleQuantity) {
      const confirmCont = window.confirm(
        `Perhatian: Stok tersedia hanya ${item.currentStock} unit, sedangkan pesanan adalah ${saleQuantity} unit. Lanjutkan transaksi?`
      );
      if (!confirmCont) return;
    }

    const student = students.find(s => s.id === selectedSaleStudentId);
    const studentName = student ? student.name : 'Penjualan Langsung / Siswa Umum';
    const studentClass = student ? student.className : selectedSaleStudentClass;
    const totalPrice = item.unitPrice * saleQuantity;
    const invNumber = `KW-STK/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(100 + Math.random() * 900)}`;

    // 1. Potong Stok & Buat Log Mutasi
    const deductRes = onDeductStock(item.id, saleQuantity, {
      studentId: student?.id,
      studentName: studentName,
      studentClass: studentClass,
      invoiceNumber: invNumber,
      treasurerName: activeTreasurer.name,
      notes: saleNotes || `Penjualan ${saleQuantity}x ${item.name} (${salePaymentMethod})`,
      date: saleDate
    });

    if (deductRes.success && deductRes.item) {
      await onSaveInventoryItem(deductRes.item);
      if (deductRes.log) {
        await onSaveInventoryLog(deductRes.log);
      }

      // 2. Buat PaymentTransaction otomatis agar tercatat di Laporan Kas & Riwayat Pembayaran Siswa
      if (onRecordQuickSalePayment) {
        const paymentCat = item.category === 'SERAGAM' ? 'SERAGAM' : item.category === 'LKS' ? 'BUKU' : 'LAINNYA';
        const newPayment: PaymentTransaction = {
          id: `pay-stk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          invoiceNumber: invNumber,
          studentId: student?.id || `stu-guest-${Date.now()}`,
          studentName: studentName,
          className: studentClass,
          nisn: student?.nisn || '-',
          category: paymentCat,
          categoryLabel: `Pembelian Stok ${item.name} (${saleQuantity} unit)`,
          amount: totalPrice,
          totalBillAmount: totalPrice,
          paymentMethod: salePaymentMethod,
          paymentDate: saleDate,
          status: 'Lunas',
          receivedBy: activeTreasurer.name,
          notes: `[Kasir Stok] ${saleQuantity}x ${item.name} @ Rp ${item.unitPrice.toLocaleString('id-ID')}. ${saleNotes}`.trim(),
          inventoryItemIds: [item.id],
          inventoryItemsPurchased: [
            {
              itemId: item.id,
              itemCode: item.itemCode,
              itemName: item.name,
              variantType: item.variantType,
              size: item.size,
              quantity: saleQuantity,
              unitPrice: item.unitPrice,
              subtotal: totalPrice
            }
          ],
          inventoryDetails: `${item.name} (${item.size || 'Standar'}) x ${saleQuantity}`,
          createdAt: new Date().toISOString()
        };

        await onRecordQuickSalePayment(newPayment);
      }

      triggerSuccessMsg(
        `Penjualan "${item.name}" sebanyak ${saleQuantity} unit (${formatRupiah(totalPrice)}) berhasil diproses! Stok otomatis berkurang menjadi ${deductRes.item.currentStock} unit.`
      );
    } else {
      alert(`Gagal memotong stok: ${deductRes.error || 'Terjadi kesalahan'}`);
    }

    setShowQuickSaleModal(false);
    setSelectedSaleItemId('');
    setSaleQuantity(1);
    setSaleNotes('');
  };

  // Handle Delete Item
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    await onDeleteInventoryItem(itemToDelete.id);
    triggerSuccessMsg(`Barang "${itemToDelete.name}" berhasil dihapus.`);
    setItemToDelete(null);
  };

  // Filtered Students for Quick Sale
  const filteredStudentsForSale = useMemo(() => {
    if (!selectedSaleStudentClass || selectedSaleStudentClass === 'ALL') return students;
    return students.filter(s => s.className === selectedSaleStudentClass);
  }, [students, selectedSaleStudentClass]);

  // Statistics Calculations
  const stats = useMemo(() => {
    const totalSKU = inventory.length;
    const totalPhysicalStock = inventory.reduce((acc, curr) => acc + (curr.currentStock || 0), 0);
    const totalAssetValue = inventory.reduce((acc, curr) => acc + (curr.currentStock || 0) * (curr.unitPrice || 0), 0);
    const totalSoldUnits = inventory.reduce((acc, curr) => acc + (curr.totalSold || 0), 0);
    const outOfStockCount = inventory.filter(i => (i.currentStock || 0) <= 0).length;
    const lowStockCount = inventory.filter(i => (i.currentStock || 0) > 0 && (i.currentStock || 0) <= (i.minStockAlert || 5)).length;

    const seragamCount = inventory.filter(i => i.category === 'SERAGAM').reduce((acc, curr) => acc + curr.currentStock, 0);
    const lksCount = inventory.filter(i => i.category === 'LKS').reduce((acc, curr) => acc + curr.currentStock, 0);
    const atributCount = inventory.filter(i => i.category === 'ATRIBUT').reduce((acc, curr) => acc + curr.currentStock, 0);

    return {
      totalSKU,
      totalPhysicalStock,
      totalAssetValue,
      totalSoldUnits,
      outOfStockCount,
      lowStockCount,
      seragamCount,
      lksCount,
      atributCount
    };
  }, [inventory]);

  // Filtered Inventory List
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      // 1. Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchCode = item.itemCode.toLowerCase().includes(q);
        const matchVariant = item.variantType?.toLowerCase().includes(q);
        const matchSize = item.size?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchVariant && !matchSize) return false;
      }

      // 2. Category
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
        return false;
      }

      // 3. Uniform Type
      if (uniformTypeFilter !== 'ALL' && item.variantType !== uniformTypeFilter) {
        return false;
      }

      // 4. Size
      if (sizeFilter !== 'ALL' && item.size !== sizeFilter) {
        return false;
      }

      // 5. Stock status
      if (stockStatusFilter === 'OUT_OF_STOCK' && item.currentStock > 0) return false;
      if (stockStatusFilter === 'CRITICAL' && (item.currentStock <= 0 || item.currentStock > (item.minStockAlert || 5))) return false;
      if (stockStatusFilter === 'AVAILABLE' && item.currentStock <= (item.minStockAlert || 5)) return false;

      return true;
    });
  }, [inventory, searchQuery, categoryFilter, uniformTypeFilter, sizeFilter, stockStatusFilter]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return inventoryLogs.filter(log => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchItem = log.itemName.toLowerCase().includes(q);
        const matchCode = log.itemCode.toLowerCase().includes(q);
        const matchStudent = log.studentName?.toLowerCase().includes(q);
        const matchInvoice = log.invoiceNumber?.toLowerCase().includes(q);
        if (!matchItem && !matchCode && !matchStudent && !matchInvoice) return false;
      }
      if (categoryFilter !== 'ALL' && log.category !== categoryFilter) {
        return false;
      }
      return true;
    });
  }, [inventoryLogs, searchQuery, categoryFilter]);

  // Helper format rupiah
  const formatRupiah = (val: number) => {
    return `Rp ${(val || 0).toLocaleString('id-ID')}`;
  };

  // Print Stock Report
  const handlePrintStockReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Izinkan pop-up untuk mencetak rekapitulasi stok.');
      return;
    }

    const rowsHtml = filteredInventory.map((item, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <td style="padding: 8px 6px; text-align: center;">${idx + 1}</td>
        <td style="padding: 8px 6px; font-family: monospace; font-weight: bold;">${item.itemCode}</td>
        <td style="padding: 8px 6px; font-weight: bold;">${item.name}</td>
        <td style="padding: 8px 6px; text-align: center;">${item.category}</td>
        <td style="padding: 8px 6px; text-align: center;">${item.variantType || '-'}</td>
        <td style="padding: 8px 6px; text-align: center; font-weight: bold;">${item.size || 'Standar'}</td>
        <td style="padding: 8px 6px; text-align: right;">${formatRupiah(item.unitPrice)}</td>
        <td style="padding: 8px 6px; text-align: center; font-weight: bold; color: ${item.currentStock <= 0 ? 'red' : item.currentStock <= item.minStockAlert ? '#d97706' : '#16a34a'};">
          ${item.currentStock} unit
        </td>
        <td style="padding: 8px 6px; text-align: center;">${item.totalSold || 0}</td>
        <td style="padding: 8px 6px; text-align: right; font-weight: bold;">${formatRupiah(item.currentStock * item.unitPrice)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Laporan Rekapitulasi Stok Barang - ${academicYear}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #1e293b; }
            .kop { text-align: center; border-bottom: 3px double #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
            .kop h2 { margin: 0; font-size: 16pt; color: #064e3b; text-transform: uppercase; }
            .kop h3 { margin: 2px 0; font-size: 13pt; color: #0f172a; }
            .kop p { margin: 2px 0; font-size: 9pt; color: #475569; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px; font-size: 10px; text-transform: uppercase; }
            td { border: 1px solid #cbd5e1; }
            .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 10pt; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="kop">
            <h2>YAYASAN PENDIDIKAN MANBAUL ISLAM</h2>
            <h3>LAPORAN INVENTARIS & STOK BARANG (LKS, ATRIBUT & SERAGAM)</h3>
            <p>Tahun Pelajaran: ${academicYear} • Dicetak Tanggal: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
          </div>

          <div style="margin-bottom: 12px; font-size: 10pt; display: flex; justify-content: space-between; background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
            <div><strong>Total Macam Barang:</strong> ${filteredInventory.length} Item</div>
            <div><strong>Total Fisik Stok:</strong> ${stats.totalPhysicalStock} Unit</div>
            <div><strong>Total Nilai Aset Stok:</strong> ${formatRupiah(stats.totalAssetValue)}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 30px;">No</th>
                <th>Kode</th>
                <th>Nama Barang</th>
                <th>Kategori</th>
                <th>Jenis Seragam</th>
                <th>Ukuran</th>
                <th>Harga Satuan</th>
                <th>Sisa Stok</th>
                <th>Terjual</th>
                <th>Total Nilai</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer">
            <div style="text-align: center; width: 220px;">
              <p>Mengetahui,<br><strong>Kepala Madrasah</strong></p>
              <br><br><br>
              <p><strong>${schoolOfficials?.kepalaMadrasah?.name || 'M. Sholihin, SE'}</strong><br>NIP: ${schoolOfficials?.kepalaMadrasah?.nip || '85780'}</p>
            </div>
            <div style="text-align: center; width: 220px;">
              <p>Pengelola Stok / Kasir,<br><strong>${activeTreasurer.roleTitle || 'Bendahara'}</strong></p>
              <br><br><br>
              <p><strong>${activeTreasurer.name}</strong><br>NIP: ${activeTreasurer.nip || '-'}</p>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {actionSuccessMsg && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between text-xs font-bold animate-fade-in border border-emerald-500">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            onClick={() => setActionSuccessMsg('')}
            className="text-emerald-200 hover:text-white transition p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner Info & Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Total SKU & Fisik */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Jenis Barang</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{stats.totalSKU}</span>
            <span className="text-xs text-slate-500 font-semibold">SKU Produk</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium flex items-center space-x-1.5">
            <span>Fisik Tersedia:</span>
            <strong className="text-indigo-700 font-bold">{stats.totalPhysicalStock} Unit</strong>
          </div>
        </div>

        {/* Card 2: Total Nilai Aset Stok */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nilai Aset Stok</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-700">{formatRupiah(stats.totalAssetValue)}</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 font-medium">
            Nilai nominal inventaris aktif
          </div>
        </div>

        {/* Card 3: Total Unit Terjual */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Terjual</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-blue-700">{stats.totalSoldUnits}</span>
            <span className="text-xs text-slate-500 font-semibold">Unit Tersalurkan</span>
          </div>
          <div className="mt-1 text-[11px] text-blue-600 font-medium">
            Terpotong otomatis dari pembayaran
          </div>
        </div>

        {/* Card 4: Status Peringatan Stok */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Peringatan Stok</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="text-xs font-extrabold text-rose-700">{stats.outOfStockCount} Habis</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-xs font-extrabold text-amber-700">{stats.lowStockCount} Menipis</span>
            </div>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">
            Segera lakukan restock pengadaan
          </div>
        </div>

      </div>

      {/* Main Stock Interface Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Navigation & Actions Top Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Main Tab Switches */}
          <div className="flex items-center space-x-2 bg-slate-200/70 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('katalog')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center space-x-2 transition cursor-pointer ${
                activeTab === 'katalog'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Katalog & Stok Fisik ({inventory.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('mutasi')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center space-x-2 transition cursor-pointer ${
                activeTab === 'mutasi'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Riwayat Mutasi & Penjualan ({inventoryLogs.length})</span>
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            
            {/* Quick POS / Direct Sale Button */}
            <button
              onClick={() => setShowQuickSaleModal(true)}
              className="px-3.5 py-2 bg-linear-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-extrabold shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>+ Penjualan Cepat (Kasir)</span>
            </button>

            {/* Restock Button */}
            <button
              onClick={() => {
                if (inventory.length > 0) {
                  setSelectedRestockItem(inventory[0]);
                }
                setShowRestockModal(true);
              }}
              className="px-3.5 py-2 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>+ Tambah Stok Masuk</span>
            </button>

            {/* Add New Item Button */}
            <button
              onClick={() => handleOpenAddModal('SERAGAM', 'Baju Olahraga')}
              className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-extrabold shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Master Barang</span>
            </button>

            {/* Print / Export Report */}
            <button
              onClick={handlePrintStockReport}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
              title="Cetak Rekapitulasi Stok"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Cetak Rekap</span>
            </button>

          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="p-4 bg-white border-b border-slate-100 space-y-3">
          
          {/* Category Pills */}
          <div className="flex items-center flex-wrap gap-1.5">
            <span className="text-[11px] font-extrabold text-slate-400 mr-1 uppercase">Kategori:</span>
            <button
              onClick={() => {
                setCategoryFilter('ALL');
                setUniformTypeFilter('ALL');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                categoryFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Kategori ({inventory.length})
            </button>
            <button
              onClick={() => setCategoryFilter('SERAGAM')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center space-x-1.5 ${
                categoryFilter === 'SERAGAM'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              <Shirt className="w-3.5 h-3.5" />
              <span>👕 Seragam ({inventory.filter(i => i.category === 'SERAGAM').length})</span>
            </button>
            <button
              onClick={() => {
                setCategoryFilter('LKS');
                setUniformTypeFilter('ALL');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center space-x-1.5 ${
                categoryFilter === 'LKS'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>📚 LKS ({inventory.filter(i => i.category === 'LKS').length})</span>
            </button>
            <button
              onClick={() => {
                setCategoryFilter('ATRIBUT');
                setUniformTypeFilter('ALL');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center space-x-1.5 ${
                categoryFilter === 'ATRIBUT'
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>🏷️ Atribut ({inventory.filter(i => i.category === 'ATRIBUT').length})</span>
            </button>
          </div>

          {/* Sub-Pills for Uniform Types (When SERAGAM or ALL is selected) */}
          {(categoryFilter === 'SERAGAM' || categoryFilter === 'ALL') && (
            <div className="flex items-center flex-wrap gap-1.5 pt-1 border-t border-slate-100">
              <span className="text-[11px] font-extrabold text-indigo-700 mr-1 flex items-center space-x-1">
                <Shirt className="w-3 h-3" />
                <span>Pilihan Seragam:</span>
              </span>
              <button
                onClick={() => setUniformTypeFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  uniformTypeFilter === 'ALL'
                    ? 'bg-indigo-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua Seragam
              </button>
              {UNIFORM_OPTIONS.map(opt => {
                const count = inventory.filter(i => i.variantType === opt).length;
                return (
                  <button
                    key={opt}
                    onClick={() => {
                      setCategoryFilter('SERAGAM');
                      setUniformTypeFilter(opt);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      uniformTypeFilter === opt
                        ? 'bg-indigo-600 text-white font-black shadow-2xs'
                        : 'bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100 border border-indigo-100'
                    }`}
                  >
                    {opt} {count > 0 && <span className="opacity-75">({count})</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* Search and Secondary Filter Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
            
            {/* Search Input */}
            <div className="relative col-span-1 sm:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari nama barang, kode item (misal: SRG-OLR, LKS, Topi)..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Size Filter */}
            <div>
              <select
                value={sizeFilter}
                onChange={e => setSizeFilter(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Semua Ukuran (Size)</option>
                {SIZE_OPTIONS.map(sz => (
                  <option key={sz} value={sz}>Ukuran: {sz}</option>
                ))}
              </select>
            </div>

            {/* Stock Alert Filter */}
            <div>
              <select
                value={stockStatusFilter}
                onChange={e => setStockStatusFilter(e.target.value as any)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Semua Status Stok</option>
                <option value="AVAILABLE">Stok Aman (&gt; 5 unit)</option>
                <option value="CRITICAL">⚠️ Stok Menipis (≤ 5 unit)</option>
                <option value="OUT_OF_STOCK">❌ Stok Habis (0 unit)</option>
              </select>
            </div>

          </div>

        </div>

        {/* View 1: Katalog & Tabel Stok Barang */}
        {activeTab === 'katalog' && (
          <div>
            {filteredInventory.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <Package className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
                <p className="text-sm font-bold text-slate-600">Tidak ada data stok barang yang sesuai filter.</p>
                <p className="text-xs text-slate-400">Silakan ubah kata kunci pencarian atau tambah master barang baru.</p>
                <button
                  onClick={() => handleOpenAddModal('SERAGAM', 'Baju Olahraga')}
                  className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-extrabold hover:bg-indigo-700 transition cursor-pointer"
                >
                  + Tambah Barang Baru
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-3.5 text-center w-12">No</th>
                      <th className="py-3 px-3.5">Kode & Nama Barang</th>
                      <th className="py-3 px-3.5">Kategori / Varian</th>
                      <th className="py-3 px-3.5 text-center">Ukuran / Tingkat</th>
                      <th className="py-3 px-3.5 text-right">Harga Satuan</th>
                      <th className="py-3 px-3.5 text-center">Sisa Stok Fisik</th>
                      <th className="py-3 px-3.5 text-center">Terjual</th>
                      <th className="py-3 px-3.5 text-right">Total Nilai</th>
                      <th className="py-3 px-3.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredInventory.map((item, idx) => {
                      const isOutOfStock = item.currentStock <= 0;
                      const isLowStock = item.currentStock > 0 && item.currentStock <= item.minStockAlert;
                      const totalValue = item.currentStock * item.unitPrice;

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50/80 transition ${
                            isOutOfStock ? 'bg-rose-50/30' : isLowStock ? 'bg-amber-50/30' : ''
                          }`}
                        >
                          {/* No */}
                          <td className="py-3 px-3.5 text-center font-bold text-slate-400">
                            {idx + 1}
                          </td>

                          {/* Kode & Nama */}
                          <td className="py-3 px-3.5">
                            <div className="flex items-start space-x-2.5">
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                  item.category === 'SERAGAM'
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : item.category === 'LKS'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-teal-100 text-teal-700'
                                }`}
                              >
                                {item.category === 'SERAGAM' ? (
                                  <Shirt className="w-4 h-4" />
                                ) : item.category === 'LKS' ? (
                                  <BookOpen className="w-4 h-4" />
                                ) : (
                                  <Tag className="w-4 h-4" />
                                )}
                              </div>
                              <div>
                                <span className="font-mono text-[10px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                  {item.itemCode}
                                </span>
                                <h4 className="font-extrabold text-slate-900 text-xs mt-0.5">
                                  {item.name}
                                </h4>
                                {item.description && (
                                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Kategori / Varian */}
                          <td className="py-3 px-3.5">
                            <div className="space-y-1">
                              <span
                                className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                  item.category === 'SERAGAM'
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                    : item.category === 'LKS'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-teal-50 text-teal-800 border-teal-200'
                                }`}
                              >
                                {item.category}
                              </span>
                              {item.variantType && (
                                <div className="text-[11px] font-bold text-slate-600">
                                  {item.variantType}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Ukuran & Tingkat */}
                          <td className="py-3 px-3.5 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className="text-xs font-black text-indigo-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                                {item.size || 'Standar'}
                              </span>
                              {item.gradeLevel && item.gradeLevel !== 'SEMUA' && (
                                <span className="text-[10px] text-slate-400 font-bold mt-0.5">
                                  Kelas {item.gradeLevel}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Harga Satuan */}
                          <td className="py-3 px-3.5 text-right font-extrabold text-slate-800">
                            {formatRupiah(item.unitPrice)}
                          </td>

                          {/* Sisa Stok & Status Badge */}
                          <td className="py-3 px-3.5 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-black border flex items-center space-x-1 ${
                                  isOutOfStock
                                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                                    : isLowStock
                                    ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                }`}
                              >
                                <span>{item.currentStock} Unit</span>
                              </span>
                              <span className="text-[10px] text-slate-400 mt-0.5 font-medium">
                                {isOutOfStock
                                  ? '❌ Stok Habis'
                                  : isLowStock
                                  ? `⚠️ Menipis (Min: ${item.minStockAlert})`
                                  : '✓ Stok Tersedia'}
                              </span>
                            </div>
                          </td>

                          {/* Total Terjual */}
                          <td className="py-3 px-3.5 text-center">
                            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                              {item.totalSold || 0} unit
                            </span>
                          </td>

                          {/* Total Nilai Aset */}
                          <td className="py-3 px-3.5 text-right font-black text-slate-900">
                            {formatRupiah(totalValue)}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3 px-3.5 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              
                              {/* Quick Sell / Distribute Button */}
                              <button
                                onClick={() => {
                                  setSelectedSaleItemId(item.id);
                                  setSaleQuantity(1);
                                  setShowQuickSaleModal(true);
                                }}
                                title="Catat Penjualan / Distribusi Barang"
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg transition cursor-pointer border border-emerald-200"
                              >
                                <ShoppingBag className="w-3.5 h-3.5" />
                              </button>

                              {/* Restock Button */}
                              <button
                                onClick={() => {
                                  setSelectedRestockItem(item);
                                  setRestockQty(10);
                                  setShowRestockModal(true);
                                }}
                                title="Tambah Stok Masuk (Restock)"
                                className="p-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg transition cursor-pointer border border-blue-200"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit Button */}
                              <button
                                onClick={() => handleOpenEditModal(item)}
                                title="Edit Data Barang"
                                className="p-1.5 bg-slate-100 hover:bg-slate-700 text-slate-600 hover:text-white rounded-lg transition cursor-pointer border border-slate-200"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => setItemToDelete(item)}
                                title="Hapus Barang"
                                className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded-lg transition cursor-pointer border border-rose-200"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* View 2: Riwayat Mutasi & Penjualan Stok */}
        {activeTab === 'mutasi' && (
          <div>
            {filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <History className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
                <p className="text-sm font-bold text-slate-600">Belum ada riwayat mutasi stok.</p>
                <p className="text-xs text-slate-400">Riwayat otomatis tercatat saat stok masuk (restock) atau saat ada siswa yang membeli seragam/LKS/atribut.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-3.5 text-center w-12">No</th>
                      <th className="py-3 px-3.5">Tanggal & Waktu</th>
                      <th className="py-3 px-3.5">Barang / Item</th>
                      <th className="py-3 px-3.5 text-center">Tipe Mutasi</th>
                      <th className="py-3 px-3.5 text-center">Perubahan Qty</th>
                      <th className="py-3 px-3.5 text-center">Stok Akhir</th>
                      <th className="py-3 px-3.5 text-right">Nilai Total</th>
                      <th className="py-3 px-3.5">Penerima / Keterangan</th>
                      <th className="py-3 px-3.5">Petugas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredLogs.map((log, idx) => {
                      const isOut = log.movementType === 'OUT';
                      const isIn = log.movementType === 'IN';

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-3.5 text-center font-bold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3.5 font-medium text-slate-600">
                            <div>{log.date}</div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(log.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                            </div>
                          </td>
                          <td className="py-3 px-3.5">
                            <div className="font-extrabold text-slate-900">{log.itemName}</div>
                            <div className="text-[10px] font-mono text-slate-500">
                              {log.itemCode} • Ukuran: {log.size || 'Standar'}
                            </div>
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            <span
                              className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                                isOut
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : isIn
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {isOut ? (
                                <ArrowUpRight className="w-3 h-3 text-rose-600" />
                              ) : (
                                <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                              )}
                              <span>{isOut ? 'Keluar / Terjual' : isIn ? 'Masuk / Restock' : 'Penyesuaian'}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-center font-black">
                            <span className={isOut ? 'text-rose-600' : 'text-emerald-600'}>
                              {isOut ? `-${log.quantity}` : `+${log.quantity}`} unit
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-center font-bold text-slate-700">
                            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {log.newStock} unit
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-right font-extrabold text-slate-900">
                            {formatRupiah(log.totalPrice)}
                          </td>
                          <td className="py-3 px-3.5">
                            {log.studentName ? (
                              <div>
                                <span className="font-bold text-indigo-900">{log.studentName}</span>
                                <span className="text-[10px] text-slate-500 ml-1.5 font-semibold bg-slate-100 px-1.5 py-0.2 rounded">
                                  {log.studentClass}
                                </span>
                                {log.invoiceNumber && (
                                  <div className="text-[10px] font-mono text-indigo-600">
                                    No: {log.invoiceNumber}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-slate-600">{log.notes || '-'}</div>
                            )}
                          </td>
                          <td className="py-3 px-3.5 font-medium text-slate-600">
                            {log.treasurerName}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ========================================== */}
      {/* MODAL 1: TAMBAH / EDIT MASTER BARANG       */}
      {/* ========================================== */}
      {showItemModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 bg-linear-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight">
                    {editingItem ? 'Edit Data Barang Stok' : 'Tambah Master Barang Baru'}
                  </h3>
                  <p className="text-[11px] text-indigo-200/80">
                    Inventaris Seragam, LKS, dan Atribut Madrasah
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowItemModal(false)}
                className="text-slate-400 hover:text-white transition p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItemSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              
              {/* Kategori */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kategori Barang *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormCategory('SERAGAM');
                      if (!formVariantType) setFormVariantType('Baju Olahraga');
                    }}
                    className={`py-2 px-3 rounded-xl font-bold border transition text-center flex items-center justify-center space-x-1.5 cursor-pointer ${
                      formCategory === 'SERAGAM'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Shirt className="w-3.5 h-3.5" />
                    <span>Seragam</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormCategory('LKS')}
                    className={`py-2 px-3 rounded-xl font-bold border transition text-center flex items-center justify-center space-x-1.5 cursor-pointer ${
                      formCategory === 'LKS'
                        ? 'bg-amber-50 border-amber-600 text-amber-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Buku / LKS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormCategory('ATRIBUT')}
                    className={`py-2 px-3 rounded-xl font-bold border transition text-center flex items-center justify-center space-x-1.5 cursor-pointer ${
                      formCategory === 'ATRIBUT'
                        ? 'bg-teal-50 border-teal-600 text-teal-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>Atribut</span>
                  </button>
                </div>
              </div>

              {/* Pilihan Jenis Seragam (Khusus Seragam) */}
              {formCategory === 'SERAGAM' && (
                <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2">
                  <label className="block font-bold text-indigo-950">
                    Pilihan Jenis Seragam *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {UNIFORM_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setFormVariantType(opt);
                          if (!editingItem) {
                            setFormName(`${opt} (Ukuran ${formSize})`);
                          }
                        }}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-extrabold border transition text-center cursor-pointer ${
                          formVariantType === opt
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Nama Barang */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Barang *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Contoh: Baju Olahraga (Ukuran M), LKS Paket Kelas VII..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Kode Barang & Ukuran (Row) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kode Barang / SKU
                    <span className="text-[10px] text-slate-400 font-normal ml-1">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={formItemCode}
                    onChange={e => setFormItemCode(e.target.value)}
                    placeholder="Otomatis digenerate jika kosong"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ukuran (Size) *</label>
                  <select
                    value={formSize}
                    onChange={e => {
                      setFormSize(e.target.value);
                      if (formCategory === 'SERAGAM' && !editingItem) {
                        setFormName(`${formVariantType} (Ukuran ${e.target.value})`);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {SIZE_OPTIONS.map(sz => (
                      <option key={sz} value={sz}>{sz}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tingkat Kelas & Harga Satuan */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tingkat Kelas</label>
                  <select
                    value={formGradeLevel}
                    onChange={e => setFormGradeLevel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="SEMUA">Semua Tingkat</option>
                    <option value="VII">Khusus Kelas VII</option>
                    <option value="VIII">Khusus Kelas VIII</option>
                    <option value="IX">Khusus Kelas IX</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Harga Satuan (Rp) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1000"
                    value={formUnitPrice}
                    onChange={e => setFormUnitPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-extrabold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                  />
                </div>
              </div>

              {/* Stok Awal & Peringatan Stok Min */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {editingItem ? 'Sisa Stok Saat Ini *' : 'Jumlah Stok Awal *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formCurrentStock}
                    onChange={e => setFormCurrentStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-black text-indigo-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Peringatan Stok Minimum</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formMinStockAlert}
                    onChange={e => setFormMinStockAlert(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-amber-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-center"
                  />
                </div>
              </div>

              {/* Keterangan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Keterangan / Spesifikasi</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Bahan kain, vendor pengadaan, atau catatan lainnya..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-md transition cursor-pointer flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingItem ? 'Simpan Perubahan' : 'Simpan Barang Baru'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 2: TAMBAH STOK MASUK (RESTOCK)       */}
      {/* ========================================== */}
      {showRestockModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            
            <div className="px-6 py-4 bg-linear-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ArrowDownLeft className="w-5 h-5 text-blue-200" />
                <h3 className="text-sm font-black">Tambah Stok Masuk (Restock)</h3>
              </div>
              <button
                onClick={() => setShowRestockModal(false)}
                className="text-blue-200 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="p-6 space-y-4 text-xs">
              
              {/* Pilih Barang */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Barang yang Masuk *</label>
                <select
                  value={selectedRestockItem?.id || ''}
                  onChange={e => {
                    const item = inventory.find(i => i.id === e.target.value);
                    if (item) setSelectedRestockItem(item);
                  }}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {inventory.map(item => (
                    <option key={item.id} value={item.id}>
                      [{item.itemCode}] {item.name} (Sisa: {item.currentStock} unit)
                    </option>
                  ))}
                </select>
              </div>

              {selectedRestockItem && (
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-blue-700 uppercase">Stok Saat Ini</span>
                    <div className="text-lg font-black text-blue-950">{selectedRestockItem.currentStock} Unit</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-blue-700 uppercase">Harga Satuan</span>
                    <div className="text-sm font-extrabold text-blue-950">{formatRupiah(selectedRestockItem.unitPrice)}</div>
                  </div>
                </div>
              )}

              {/* Jumlah Unit Masuk & Tanggal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah Unit Masuk *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={restockQty}
                    onChange={e => setRestockQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-black text-blue-700 text-center focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Masuk</label>
                  <input
                    type="date"
                    required
                    value={restockDate}
                    onChange={e => setRestockDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Keterangan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Keterangan / Catatan Pemasok</label>
                <input
                  type="text"
                  value={restockNotes}
                  onChange={e => setRestockNotes(e.target.value)}
                  placeholder="Contoh: Pengadaan 50 pcs dari Konveksi Berkah Mandiri..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRestockModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-md transition cursor-pointer flex items-center space-x-1.5"
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>Tambah +{restockQty} Unit</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 3: PENJUALAN / DISTRIBUSI CEPAT (POS)*/}
      {/* ========================================== */}
      {showQuickSaleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 bg-linear-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black">Kasir Penjualan / Penyerahan Stok</h3>
                  <p className="text-[11px] text-emerald-200/80">
                    Otomatis Potong Stok & Catat Kwitansi Pembayaran
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowQuickSaleModal(false)}
                className="text-emerald-200 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickSaleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              
              {/* Filter Kelas & Siswa Pembeli */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-800 flex items-center space-x-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Identitas Siswa Pembeli</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">Pilih Siswa / Umum</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Kelas Siswa</label>
                    <select
                      value={selectedSaleStudentClass}
                      onChange={e => {
                        setSelectedSaleStudentClass(e.target.value);
                        setSelectedSaleStudentId('');
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                    >
                      <option value="ALL">Semua Kelas</option>
                      {classList.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Siswa</label>
                    <select
                      value={selectedSaleStudentId}
                      onChange={e => setSelectedSaleStudentId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                    >
                      <option value="">-- Pembeli Umum / Luar --</option>
                      {filteredStudentsForSale.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.className})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Pilih Barang yang Dibeli */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Item Stok *</label>
                <select
                  required
                  value={selectedSaleItemId}
                  onChange={e => setSelectedSaleItemId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Pilih Barang (Seragam / LKS / Atribut) --</option>
                  {inventory.map(item => {
                    const isZero = item.currentStock <= 0;
                    return (
                      <option key={item.id} value={item.id}>
                        [{item.category}] {item.name} (Ukuran: {item.size || 'Standar'}) - Sisa: {item.currentStock} unit - Rp {item.unitPrice.toLocaleString('id-ID')}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Quantity & Summary Box */}
              {selectedSaleItemId && (
                (() => {
                  const targetItem = inventory.find(i => i.id === selectedSaleItemId);
                  if (!targetItem) return null;
                  const totalSale = targetItem.unitPrice * saleQuantity;

                  return (
                    <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Item Terpilih</span>
                          <h4 className="font-black text-emerald-950 text-sm">{targetItem.name}</h4>
                          <p className="text-[11px] text-emerald-700">
                            Ukuran: <strong>{targetItem.size || 'Standar'}</strong> • Sisa Stok Fisik: <strong className={targetItem.currentStock <= 0 ? 'text-rose-600' : 'text-emerald-900'}>{targetItem.currentStock} unit</strong>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Harga Satuan</span>
                          <div className="text-sm font-extrabold text-emerald-950">{formatRupiah(targetItem.unitPrice)}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-emerald-200/60">
                        <div>
                          <label className="block text-[11px] font-bold text-emerald-900 mb-1">Jumlah Unit (Qty) *</label>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => setSaleQuantity(Math.max(1, saleQuantity - 1))}
                              className="w-8 h-8 rounded-lg bg-emerald-200/80 hover:bg-emerald-300 font-black text-emerald-900 flex items-center justify-center cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={saleQuantity}
                              onChange={e => setSaleQuantity(Math.max(1, Number(e.target.value)))}
                              className="w-16 py-1 bg-white border border-emerald-300 rounded-lg text-center font-black text-emerald-950"
                            />
                            <button
                              type="button"
                              onClick={() => setSaleQuantity(saleQuantity + 1)}
                              className="w-8 h-8 rounded-lg bg-emerald-200/80 hover:bg-emerald-300 font-black text-emerald-900 flex items-center justify-center cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="text-right flex flex-col justify-end">
                          <span className="text-[10px] font-bold text-emerald-800 uppercase">Total Tagihan Kasir</span>
                          <span className="text-xl font-black text-emerald-950">{formatRupiah(totalSale)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* Metode Pembayaran & Tanggal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Metode Bayar *</label>
                  <select
                    value={salePaymentMethod}
                    onChange={e => setSalePaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Tunai">💵 Tunai (Cash)</option>
                    <option value="Transfer Bank">🏦 Transfer Bank</option>
                    <option value="QRIS">📱 QRIS / Dompet Digital</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Transaksi</label>
                  <input
                    type="date"
                    required
                    value={saleDate}
                    onChange={e => setSaleDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Catatan Penjualan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  value={saleNotes}
                  onChange={e => setSaleNotes(e.target.value)}
                  placeholder="Keterangan tambahan atau catatan penerimaan..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Info Auto-Deduct */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 flex items-start space-x-2 text-[11px]">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Setelah tombol <strong>Proses & Potong Stok</strong> diklik, jumlah stok fisik akan langsung berkurang secara otomatis dan tercatat pada Laporan Keuangan Madrasah.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowQuickSaleModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl font-black shadow-md transition cursor-pointer flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Proses &amp; Potong Stok Otomatis</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 4: KONFIRMASI HAPUS BARANG          */}
      {/* ========================================== */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-slate-900">Hapus Barang Stok?</h3>
            <p className="text-xs text-slate-500">
              Apakah Anda yakin ingin menghapus <strong>"{itemToDelete.name}"</strong> ({itemToDelete.itemCode})? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-center space-x-2 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-md"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
