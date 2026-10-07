import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Printer,
  CreditCard,
  Banknote,
  QrCode,
  User,
  GraduationCap,
  Shirt,
  BookOpen,
  Tag,
  Package,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Receipt,
  Check,
  X
} from 'lucide-react';
import {
  InventoryItem,
  InventoryCategory,
  Student,
  PaymentTransaction,
  BendaharaPerson,
  SchoolOfficials
} from '../types';
import { printHtmlString } from '../utils/export';

interface CartItem {
  item: InventoryItem;
  quantity: number;
  customPrice?: number;
}

interface KasirPenjualanPOSProps {
  inventory: InventoryItem[];
  students: Student[];
  classList: string[];
  activeTreasurer: BendaharaPerson;
  schoolOfficials?: SchoolOfficials;
  academicYear: string;
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
  ) => { success: boolean; item?: InventoryItem; log?: any; error?: string };
  onSavePayment: (payment: PaymentTransaction) => Promise<void> | void;
}

function numberToWords(num: number): string {
  if (num === 0) return 'Nol Rupiah';
  const units = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  function convert(n: number): string {
    if (n < 12) return units[n];
    if (n < 20) return convert(n - 10) + ' Belas';
    if (n < 100) return convert(Math.floor(n / 10)) + ' Puluh' + (n % 10 !== 0 ? ' ' + convert(n % 10) : '');
    if (n < 200) return 'Seratus' + (n % 100 !== 0 ? ' ' + convert(n % 100) : '');
    if (n < 1000) return convert(Math.floor(n / 100)) + ' Ratus' + (n % 100 !== 0 ? ' ' + convert(n % 100) : '');
    if (n < 2000) return 'Seribu' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
    if (n < 1000000) return convert(Math.floor(n / 1000)) + ' Ribu' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
    if (n < 1000000000) return convert(Math.floor(n / 1000000)) + ' Juta' + (n % 1000000 !== 0 ? ' ' + convert(n % 1000000) : '');
    return convert(Math.floor(n / 1000000000)) + ' Miliar' + (n % 1000000000 !== 0 ? ' ' + convert(n % 1000000000) : '');
  }
  return convert(Math.floor(num)).trim() + ' Rupiah';
}

export const KasirPenjualanPOS: React.FC<KasirPenjualanPOSProps> = ({
  inventory,
  students,
  classList,
  activeTreasurer,
  schoolOfficials,
  academicYear,
  onDeductStock,
  onSavePayment
}) => {
  const currentTreasurerName = activeTreasurer?.name || 'Petugas Kasir';

  // Buyer type
  const [buyerType, setBuyerType] = useState<'SISWA' | 'UMUM'>('SISWA');
  const [selectedClass, setSelectedClass] = useState<string>(classList[0] || 'VII A');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [buyerNameUmum, setBuyerNameUmum] = useState<string>('');
  const [buyerPhoneUmum, setBuyerPhoneUmum] = useState<string>('');

  // Search & Filters for Catalog
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | InventoryCategory>('ALL');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'Transfer Bank' | 'QRIS'>('Tunai');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [transactionNotes, setTransactionNotes] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // UI status
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastSavedTransaction, setLastSavedTransaction] = useState<PaymentTransaction | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string>('');

  // Class students
  const classStudents = useMemo(() => {
    return students.filter(s => s.className === selectedClass);
  }, [students, selectedClass]);

  const currentStudent = useMemo(() => {
    return students.find(s => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  // Set default student if none selected
  React.useEffect(() => {
    if (buyerType === 'SISWA' && !selectedStudentId && classStudents.length > 0) {
      setSelectedStudentId(classStudents[0].id);
    }
  }, [buyerType, selectedClass, classStudents, selectedStudentId]);

  // Filtered Catalog Items
  const filteredCatalog = useMemo(() => {
    return inventory.filter(item => {
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
      if (catalogSearch.trim()) {
        const q = catalogSearch.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchCode = item.itemCode.toLowerCase().includes(q);
        const matchVariant = item.variantType?.toLowerCase().includes(q);
        const matchSize = item.size?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchVariant && !matchSize) return false;
      }
      return true;
    });
  }, [inventory, categoryFilter, catalogSearch]);

  // Cart Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.customPrice ?? item.item.unitPrice) * item.quantity, 0);
  }, [cart]);

  const cartTotal = useMemo(() => {
    return Math.max(0, cartSubtotal - discountAmount);
  }, [cartSubtotal, discountAmount]);

  const changeAmount = useMemo(() => {
    if (paymentMethod !== 'Tunai') return 0;
    return Math.max(0, cashReceived - cartTotal);
  }, [cashReceived, cartTotal, paymentMethod]);

  // Cart Actions
  const addToCart = (item: InventoryItem) => {
    if (item.currentStock <= 0) {
      alert(`Stok untuk "${item.name}" saat ini habis (0). Silakan lakukan restok terlebih dahulu.`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) {
        if (existing.quantity >= item.currentStock) {
          alert(`Jumlah pembelian melebihi stok barang yang tersedia (${item.currentStock} pcs).`);
          return prev;
        }
        return prev.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(c => {
          if (c.item.id === itemId) {
            const nextQty = c.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > c.item.currentStock) {
              alert(`Jumlah melebihi stok tersedia (${c.item.currentStock} pcs).`);
              return c;
            }
            return { ...c, quantity: nextQty };
          }
          return c;
        })
        .filter((c): c is CartItem => c !== null);
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(c => c.item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountAmount(0);
    setCashReceived(0);
    setTransactionNotes('');
  };

  // Preset cash buttons
  const applyPresetCash = (amount: number) => {
    setCashReceived(amount);
  };

  // Process Checkout
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Keranjang belanja masih kosong. Silakan pilih minimal satu barang dari katalog.');
      return;
    }

    if (buyerType === 'SISWA' && !selectedStudentId) {
      alert('Silakan pilih data siswa pembeli terlebih dahulu.');
      return;
    }

    if (buyerType === 'UMUM' && !buyerNameUmum.trim()) {
      alert('Silakan masukkan nama pembeli umum / guru / karyawan.');
      return;
    }

    if (paymentMethod === 'Tunai' && cashReceived > 0 && cashReceived < cartTotal) {
      alert(`Uang tunai yang diterima (Rp ${cashReceived.toLocaleString('id-ID')}) kurang dari total tagihan belanja (Rp ${cartTotal.toLocaleString('id-ID')}).`);
      return;
    }

    // Check stock for all items
    for (const c of cart) {
      if (c.quantity > c.item.currentStock) {
        alert(`Stok "${c.item.name}" tidak mencukupi. Tersedia: ${c.item.currentStock}, Diminta: ${c.quantity}.`);
        return;
      }
    }

    setIsProcessing(true);

    try {
      const now = new Date();
      const invoiceNumber = `NOTA/JUAL/${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}/${String(Math.floor(Math.random() * 9000) + 1000)}`;

      const buyerName = buyerType === 'SISWA' ? (currentStudent?.name || 'Siswa') : buyerNameUmum.trim();
      const buyerClass = buyerType === 'SISWA' ? (currentStudent?.className || selectedClass) : 'Umum/Karyawan';
      const buyerNisn = buyerType === 'SISWA' ? (currentStudent?.nisn || '-') : '-';
      const buyerPhone = buyerType === 'SISWA' ? (currentStudent?.phone || '-') : (buyerPhoneUmum.trim() || '-');

      // Deduct stock for all items in cart
      for (const c of cart) {
        onDeductStock(c.item.id, c.quantity, {
          studentId: buyerType === 'SISWA' ? currentStudent?.id : undefined,
          studentName: buyerName,
          studentClass: buyerClass,
          invoiceNumber,
          treasurerName: currentTreasurerName,
          date: transactionDate,
          notes: `Penjualan POS Kasir (${c.item.name} x${c.quantity})`
        });
      }

      // Build primary category
      const hasSeragam = cart.some(c => c.item.category === 'SERAGAM');
      const hasLks = cart.some(c => c.item.category === 'LKS');
      const primaryCategory = hasSeragam ? 'SERAGAM' : hasLks ? 'BUKU' : 'LAINNYA';

      // Item summary label
      const itemSummaries = cart.map(c => `${c.item.name} (${c.quantity} pcs)`).join(', ');
      const categoryLabel = `Penjualan: ${itemSummaries}`;

      const itemsPurchased = cart.map(c => ({
        itemId: c.item.id,
        itemCode: c.item.itemCode,
        itemName: c.item.name,
        variantType: c.item.variantType,
        size: c.item.size,
        quantity: c.quantity,
        unitPrice: c.customPrice ?? c.item.unitPrice,
        subtotal: (c.customPrice ?? c.item.unitPrice) * c.quantity
      }));

      const newTx: PaymentTransaction = {
        id: `tx-sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        invoiceNumber,
        studentId: buyerType === 'SISWA' ? (currentStudent?.id || 'siswa-pos') : `umum-${Date.now()}`,
        studentName: buyerName,
        className: buyerClass,
        nisn: buyerNisn,
        parentPhone: buyerPhone,
        category: primaryCategory,
        categoryLabel,
        academicYear,
        amount: cartTotal,
        totalBillAmount: cartSubtotal,
        paymentMethod,
        paymentDate: transactionDate,
        status: 'Lunas',
        receivedBy: currentTreasurerName,
        notes: transactionNotes.trim() ? `${transactionNotes.trim()}` : `Penjualan Koperasi / Toko (${cart.length} item)`,
        inventoryItemIds: cart.map(c => c.item.id),
        inventoryItemsPurchased: itemsPurchased,
        inventoryDetails: `Kembalian: Rp ${changeAmount.toLocaleString('id-ID')}. Uang Diterima: Rp ${(cashReceived || cartTotal).toLocaleString('id-ID')}`,
        createdAt: new Date().toISOString()
      };

      await onSavePayment(newTx);

      setLastSavedTransaction(newTx);
      setShowReceiptModal(true);
      setSuccessToast(`Transaksi penjualan berhasil disimpan! Nota: ${invoiceNumber}`);
      clearCart();
    } catch (err: any) {
      alert(`Terjadi kendala saat menyimpan transaksi: ${err?.message || 'Error tidak diketahui'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Print Receipt
  const handlePrintReceipt = (tx: PaymentTransaction) => {
    const schoolName = schoolOfficials?.namaSekolah || 'MADRASAH / SEKOLAH';
    const schoolAddress = schoolOfficials?.alamatSekolah || 'Jl. Pendidikan No. 1';
    const dateFormatted = new Date(tx.paymentDate).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const itemsRows = (tx.inventoryItemsPurchased || []).map((item, idx) => `
      <tr>
        <td style="padding: 6px 8px; border-bottom: 1px dashed #cbd5e1; font-size: 11px;">${idx + 1}. ${item.itemName} ${item.size ? `(${item.size})` : ''}</td>
        <td style="padding: 6px 8px; border-bottom: 1px dashed #cbd5e1; text-align: center; font-size: 11px;">${item.quantity}</td>
        <td style="padding: 6px 8px; border-bottom: 1px dashed #cbd5e1; text-align: right; font-size: 11px;">Rp ${item.unitPrice.toLocaleString('id-ID')}</td>
        <td style="padding: 6px 8px; border-bottom: 1px dashed #cbd5e1; text-align: right; font-weight: bold; font-size: 11px;">Rp ${item.subtotal.toLocaleString('id-ID')}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Nota Penjualan - ${tx.invoiceNumber}</title>
        <style>
          @page { size: 80mm auto; margin: 4mm; }
          body { font-family: 'Courier New', Courier, monospace; font-size: 12px; color: #000; margin: 0; padding: 6px; }
          .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
          .title { font-size: 14px; font-weight: bold; text-transform: uppercase; }
          .sub { font-size: 10px; margin-top: 2px; }
          .meta { margin-bottom: 8px; font-size: 11px; }
          .meta-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
          th { border-bottom: 1px solid #000; padding: 4px; font-size: 11px; text-align: left; }
          .total-box { border-top: 1px dashed #000; border-bottom: 2px solid #000; padding: 6px 0; margin-bottom: 10px; }
          .footer { text-align: center; font-size: 10px; margin-top: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${schoolName}</div>
          <div class="sub">UNIT PENJUALAN & KOPERASI MADRASAH</div>
          <div class="sub">${schoolAddress}</div>
        </div>

        <div class="meta">
          <div class="meta-row"><span>No. Nota:</span><strong>${tx.invoiceNumber}</strong></div>
          <div class="meta-row"><span>Tanggal:</span><span>${dateFormatted}</span></div>
          <div class="meta-row"><span>Pembeli:</span><strong>${tx.studentName} (${tx.className})</strong></div>
          <div class="meta-row"><span>Kasir:</span><span>${tx.receivedBy}</span></div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Harga</th>
              <th style="text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows || `<tr><td colspan="4">${tx.categoryLabel}</td></tr>`}
          </tbody>
        </table>

        <div class="total-box">
          <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: bold;">
            <span>TOTAL BELANJA:</span>
            <span>Rp ${tx.amount.toLocaleString('id-ID')}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 3px;">
            <span>Metode Bayar:</span>
            <span>${tx.paymentMethod}</span>
          </div>
          ${tx.inventoryDetails ? `<div style="font-size: 10px; color: #333; margin-top: 3px;">${tx.inventoryDetails}</div>` : ''}
        </div>

        <div style="font-size: 10px; font-style: italic; margin-bottom: 8px;">
          Terbilang: ${numberToWords(tx.amount)}
        </div>

        <div class="footer">
          <div>*** TERIMA KASIH ***</div>
          <div>Barang yang sudah dibeli dapat ditukar jika cacat dengan membawa nota ini.</div>
        </div>
      </body>
      </html>
    `;

    printHtmlString(`Nota Penjualan ${tx.invoiceNumber}`, htmlContent);
  };

  return (
    <div className="space-y-5">
      {/* Toast Feedback */}
      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold">{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast('')}
            className="text-emerald-700 hover:text-emerald-900 p-1 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Catalog vs Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT / TOP: Catalog Items (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            
            {/* Header & Category Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center space-x-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-600" />
                  <span>Katalog Barang Penjualan & Koperasi</span>
                </h2>
                <p className="text-xs text-slate-500">Pilih item untuk ditambahkan ke keranjang kasir</p>
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-1">
                {[
                  { key: 'ALL', label: 'Semua' },
                  { key: 'SERAGAM', label: 'Seragam', icon: Shirt },
                  { key: 'LKS', label: 'Buku/LKS', icon: BookOpen },
                  { key: 'ATRIBUT', label: 'Atribut', icon: Tag }
                ].map(cat => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setCategoryFilter(cat.key as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                      categoryFilter === cat.key
                        ? 'bg-emerald-700 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.icon && <cat.icon className="w-3 h-3" />}
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari kode barang, nama seragam, buku, topi, atribut..."
                value={catalogSearch}
                onChange={e => setCatalogSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {catalogSearch && (
                <button
                  type="button"
                  onClick={() => setCatalogSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1">
              {filteredCatalog.map(item => {
                const inCart = cart.find(c => c.item.id === item.id);
                const isOutOfStock = item.currentStock <= 0;
                const isLowStock = item.currentStock > 0 && item.currentStock <= (item.minStockAlert || 5);

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                      inCart
                        ? 'border-emerald-500 bg-emerald-50/40 shadow-2xs'
                        : isOutOfStock
                        ? 'border-slate-200 bg-slate-50 opacity-60'
                        : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {item.itemCode || item.category}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-1 ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-800'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isOutOfStock ? (
                            <span>Stok Habis</span>
                          ) : (
                            <span>Stok: {item.currentStock} pcs</span>
                          )}
                        </span>
                      </div>

                      <h4 className="text-xs font-black text-slate-900 line-clamp-2 leading-tight">
                        {item.name}
                      </h4>

                      <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-1">
                        {item.size && (
                          <span className="font-semibold bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                            Ukuran {item.size}
                          </span>
                        )}
                        {item.gradeLevel && item.gradeLevel !== 'SEMUA' && (
                          <span className="font-semibold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
                            Tk {item.gradeLevel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Harga Jual</span>
                        <span className="text-xs font-black text-emerald-800">
                          Rp {item.unitPrice.toLocaleString('id-ID')}
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => addToCart(item)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                          isOutOfStock
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : inCart
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{inCart ? `+ (${inCart.quantity})` : 'Pilih'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredCatalog.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold">Tidak ada barang sesuai filter.</p>
                  <p className="text-[11px] text-slate-400">Silakan tambahkan item di tab "Katalog & Stok Barang".</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Cart & Checkout Form (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <form onSubmit={handleCheckout} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            
            {/* Header Cart */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-black text-slate-900">Keranjang Kasir ({cart.length} Item)</h3>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-[11px] text-rose-600 hover:text-rose-800 font-bold transition flex items-center space-x-0.5 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Kosongkan</span>
                </button>
              )}
            </div>

            {/* Step 1: Buyer Data */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800">1. Data Pembeli</label>
                <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setBuyerType('SISWA')}
                    className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                      buyerType === 'SISWA' ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-600'
                    }`}
                  >
                    Siswa Madrasah
                  </button>
                  <button
                    type="button"
                    onClick={() => setBuyerType('UMUM')}
                    className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                      buyerType === 'UMUM' ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-600'
                    }`}
                  >
                    Umum / Guru
                  </button>
                </div>
              </div>

              {buyerType === 'SISWA' ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Kelas</label>
                    <select
                      value={selectedClass}
                      onChange={e => {
                        setSelectedClass(e.target.value);
                        setSelectedStudentId('');
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {classList.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Nama Siswa</label>
                    <select
                      value={selectedStudentId}
                      onChange={e => setSelectedStudentId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {classStudents.map(st => (
                        <option key={st.id} value={st.id}>{st.name}</option>
                      ))}
                      {classStudents.length === 0 && <option value="">Tidak ada siswa</option>}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    required
                    placeholder="Nama Lengkap Pembeli (Guru/Wali/Umum)"
                    value={buyerNameUmum}
                    onChange={e => setBuyerNameUmum(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="No. WhatsApp / HP (Opsional)"
                    value={buyerPhoneUmum}
                    onChange={e => setBuyerPhoneUmum(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              )}
            </div>

            {/* Step 2: Cart Items Table */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-800">2. Rincian Belanjaan</label>
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 bg-slate-50">
                    <ShoppingBag className="w-6 h-6 mx-auto text-slate-300 mb-1" />
                    <p className="text-xs font-medium">Keranjang masih kosong</p>
                    <p className="text-[10px] text-slate-400">Pilih barang di sebelah kiri</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-500 border-b border-slate-200 uppercase">
                      <tr>
                        <th className="p-2">Item</th>
                        <th className="p-2 text-center">Qty</th>
                        <th className="p-2 text-right">Subtotal</th>
                        <th className="p-2 text-center w-8">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cart.map(c => {
                        const price = c.customPrice ?? c.item.unitPrice;
                        const sub = price * c.quantity;
                        return (
                          <tr key={c.item.id} className="hover:bg-slate-50/50">
                            <td className="p-2">
                              <div className="font-bold text-slate-900 truncate max-w-[130px]" title={c.item.name}>
                                {c.item.name}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                @Rp {price.toLocaleString('id-ID')}
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="flex items-center justify-center space-x-1">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(c.item.id, -1)}
                                  className="w-5 h-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded flex items-center justify-center font-bold text-xs cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="font-black text-xs w-5 text-center">{c.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(c.item.id, 1)}
                                  className="w-5 h-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded flex items-center justify-center font-bold text-xs cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="p-2 text-right font-black text-slate-900">
                              Rp {sub.toLocaleString('id-ID')}
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeFromCart(c.item.id)}
                                className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                                title="Hapus dari keranjang"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Step 3: Payment & Summary */}
            <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">Subtotal Barang:</span>
                <span className="font-bold text-slate-900">Rp {cartSubtotal.toLocaleString('id-ID')}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">Potongan / Diskon (Rp):</span>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={discountAmount || ''}
                  onChange={e => setDiscountAmount(Number(e.target.value))}
                  placeholder="0"
                  className="w-24 px-2 py-0.5 bg-white border border-slate-300 rounded text-right text-xs font-bold text-slate-800"
                />
              </div>

              <div className="pt-2 border-t border-emerald-200 flex justify-between items-center">
                <span className="text-xs font-black text-emerald-950">TOTAL HARUS BAYAR:</span>
                <span className="text-base font-black text-emerald-700">
                  Rp {cartTotal.toLocaleString('id-ID')}
                </span>
              </div>

              {/* Payment Method */}
              <div className="space-y-1 pt-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Metode Pembayaran:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { key: 'Tunai', icon: Banknote },
                    { key: 'Transfer Bank', icon: CreditCard },
                    { key: 'QRIS', icon: QrCode }
                  ].map(m => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setPaymentMethod(m.key as any)}
                      className={`py-1 px-1 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer ${
                        paymentMethod === m.key
                          ? 'bg-emerald-700 text-white shadow-2xs'
                          : 'bg-white border border-emerald-200 text-slate-700 hover:bg-emerald-100/50'
                      }`}
                    >
                      <m.icon className="w-3 h-3" />
                      <span className="truncate">{m.key}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash Paid & Change */}
              {paymentMethod === 'Tunai' && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Uang Tunai Diterima (Rp):</label>
                    <button
                      type="button"
                      onClick={() => setCashReceived(cartTotal)}
                      className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                    >
                      [Uang Pas]
                    </button>
                  </div>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={cashReceived || ''}
                    onChange={e => setCashReceived(Number(e.target.value))}
                    placeholder={`Contoh: ${cartTotal}`}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />

                  {/* Preset Buttons */}
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {[50000, 100000, 150000, 200000, 500000].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => applyPresetCash(val)}
                        className="px-2 py-0.5 bg-white border border-emerald-200 hover:bg-emerald-100 rounded text-[10px] font-bold text-slate-700 cursor-pointer"
                      >
                        Rp {(val / 1000).toLocaleString('id-ID')}k
                      </button>
                    ))}
                  </div>

                  <div className="p-2 bg-white rounded-lg border border-emerald-200 flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-600">Kembalian:</span>
                    <span className={`font-black text-sm ${changeAmount > 0 ? 'text-amber-800' : 'text-slate-800'}`}>
                      Rp {changeAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Date & Note */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Tanggal Transaksi</label>
                <input
                  type="date"
                  value={transactionDate}
                  onChange={e => setTransactionDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Petugas Kasir</label>
                <input
                  type="text"
                  disabled
                  value={currentTreasurerName}
                  className="w-full px-2.5 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-600"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isProcessing || cart.length === 0}
              className={`w-full py-3 rounded-xl font-black text-xs transition flex items-center justify-center space-x-2 shadow-xs cursor-pointer ${
                isProcessing || cart.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{isProcessing ? 'Memproses Transaksi...' : 'Selesaikan Transaksi & Cetak Nota'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Modal Cetak Nota / Struk Penjualan */}
      {showReceiptModal && lastSavedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Transaksi Berhasil!</h3>
                  <p className="text-[11px] text-slate-500">Nota: {lastSavedTransaction.invoiceNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Receipt Preview */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2 font-mono">
              <div className="text-center font-bold pb-2 border-b border-dashed border-slate-300">
                <div className="text-xs uppercase">{schoolOfficials?.namaSekolah || 'MADRASAH'}</div>
                <div className="text-[10px] text-slate-500">UNIT PENJUALAN & KOPERASI</div>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>No: {lastSavedTransaction.invoiceNumber}</span>
                <span>{lastSavedTransaction.paymentDate}</span>
              </div>
              <div className="text-[11px]">
                Pembeli: <strong>{lastSavedTransaction.studentName} ({lastSavedTransaction.className})</strong>
              </div>
              
              <div className="pt-2 border-t border-dashed border-slate-300 space-y-1">
                {(lastSavedTransaction.inventoryItemsPurchased || []).map((it, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span className="truncate max-w-[170px]">{it.itemName} x{it.quantity}</span>
                    <span>Rp {it.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-300 flex justify-between font-black text-sm text-emerald-800">
                <span>TOTAL:</span>
                <span>Rp {lastSavedTransaction.amount.toLocaleString('id-ID')}</span>
              </div>
              <div className="text-[10px] text-slate-500">
                Metode: {lastSavedTransaction.paymentMethod} | Kasir: {lastSavedTransaction.receivedBy}
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => handlePrintReceipt(lastSavedTransaction)}
                className="py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Nota Kasir</span>
              </button>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>Tutup & Lanjut Kasir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
