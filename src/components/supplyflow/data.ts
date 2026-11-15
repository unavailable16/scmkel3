export type RecordData = Record<string, string | number>;

export type DataModule = {
  title: string;
  fields: string[];
  rows: RecordData[];
};

export type SupplyFlowData = Record<string, DataModule>;

const sampleCount = 35;
const customerNames = [
  "Budi Santoso",
  "Siti Rahmawati",
  "Andi Pratama",
  "Dewi Lestari",
  "Rizky Saputra",
  "Maya Putri",
  "Fajar Nugraha",
  "Nadia Permata",
  "Rendi Kurniawan",
  "Ayu Wulandari",
  "Dimas Firmansyah",
  "Intan Puspita",
  "Raka Hidayat",
  "Lina Marlina",
  "Yoga Prasetyo",
  "Nina Kartika",
  "Teguh Setiawan",
  "Vina Oktaviani",
  "Arif Maulana",
  "Citra Anggraini",
  "Bagas Ramadhan",
  "Tari Amelia",
  "Ilham Fauzi",
  "Rani Safitri",
  "Aditia Permana",
  "Putri Maharani",
  "Reza Akbar",
  "Dinda Febriani",
  "Farhan Hakim",
  "Nisa Amalia",
  "Bayu Pamungkas",
  "Salsa Nabila",
  "Gilang Prakoso",
  "Wulan Sari",
  "Hendra Gunawan",
];

const cities = [
  "Jakarta",
  "Bandung",
  "Surabaya",
  "Tangerang",
  "Bekasi",
  "Bogor",
  "Semarang",
  "Yogyakarta",
  "Serang",
  "Depok",
  "Malang",
  "Cirebon",
  "Solo",
  "Medan",
  "Makassar",
];

const supplierNames = [
  "PT Sumber Makmur",
  "CV Mitra Logistik",
  ...Array.from({ length: sampleCount - 2 }, (_, index) => `PT Logistik Nusantara ${index + 3}`),
];

const productNames = [
  "Laptop Office",
  "Mouse Wireless",
  "Monitor 24 inci",
  ...Array.from({ length: sampleCount - 3 }, (_, index) => `Perangkat Kantor ${index + 4}`),
];

export function createSeedData(): SupplyFlowData {
  const suppliers = supplierNames.map((nama, index) => ({
    nama,
    kontak: `08${String(1234567890 + index * 137).slice(0, 10)}`,
    kota: cities[index % cities.length],
  }));

  const products = productNames.map((nama, index) => ({
    nama,
    kategori: index % 3 === 0 ? "Elektronik" : index % 3 === 1 ? "Aksesoris" : "Perlengkapan",
    harga: index === 0 ? 7500000 : index === 1 ? 150000 : index === 2 ? 1800000 : 95000 + index * 87500,
    stok: index === 1 ? 8 : 18 + ((index * 7) % 42),
    minimum: index === 1 ? 15 : 8 + (index % 8),
  }));

  const customers = customerNames.map((nama, index) => ({
    nama,
    email: `${nama.toLowerCase().replaceAll(" ", ".")}@example.com`,
    kota: cities[(index + 8) % cities.length],
  }));

  return {
    supplier: { title: "Supplier", fields: ["nama", "kontak", "kota"], rows: suppliers },
    produk: {
      title: "Produk",
      fields: ["nama", "kategori", "harga", "stok", "minimum"],
      rows: products,
    },
    gudang: {
      title: "Gudang",
      fields: ["nama", "lokasi", "kapasitas"],
      rows: Array.from({ length: sampleCount }, (_, index) => ({
        nama: index === 0 ? "Gudang Utama" : index === 1 ? "Gudang Cabang" : `Gudang ${index + 1}`,
        lokasi: cities[(index + 3) % cities.length],
        kapasitas: index === 0 ? 500 : index === 1 ? 250 : 150 + ((index * 47) % 600),
      })),
    },
    pembelian: {
      title: "Pembelian",
      fields: ["produk", "supplier", "jumlah", "status"],
      rows: Array.from({ length: sampleCount }, (_, index) => ({
        produk: products[index % products.length].nama,
        supplier: suppliers[index % suppliers.length].nama,
        jumlah: index === 0 ? 15 : 5 + ((index * 3) % 24),
        status: index % 5 === 0 ? "Diterima" : index % 2 === 0 ? "Dipesan" : "Diproses",
      })),
    },
    penjualan: {
      title: "Penjualan",
      fields: ["pelanggan", "produk", "jumlah", "status"],
      rows: Array.from({ length: sampleCount }, (_, index) => ({
        pelanggan: customers[index].nama,
        produk: products[(index + 1) % products.length].nama,
        jumlah: index === 0 ? 2 : 1 + (index % 8),
        status: index % 7 === 0 ? "Selesai" : index % 3 === 0 ? "Diproses" : "Baru",
      })),
    },
    pengiriman: {
      title: "Pengiriman",
      fields: ["pelanggan", "kurir", "resi", "status"],
      rows: Array.from({ length: sampleCount }, (_, index) => ({
        pelanggan: customers[index].nama,
        kurir: ["JNE", "J&T", "SiCepat", "Pos Indonesia", "Anteraja"][index % 5],
        resi: `SCM${String(index + 1).padStart(3, "0")}`,
        status: index % 4 === 0 ? "Dikirim" : index % 3 === 0 ? "Selesai" : "Diproses",
      })),
    },
    pelanggan: { title: "Pelanggan", fields: ["nama", "email", "kota"], rows: customers },
  };
}

function isRecordData(value: unknown): value is RecordData {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function mergeSavedData(savedValue: unknown): SupplyFlowData {
  const seededData = createSeedData();
  if (typeof savedValue !== "object" || savedValue === null || Array.isArray(savedValue)) {
    return seededData;
  }

  const savedData = savedValue as Record<string, unknown>;
  for (const [key, module] of Object.entries(seededData)) {
    const savedModule = savedData[key];
    if (typeof savedModule !== "object" || savedModule === null || Array.isArray(savedModule)) continue;

    const savedRowsValue = (savedModule as { rows?: unknown }).rows;
    const savedRows = Array.isArray(savedRowsValue) ? savedRowsValue.filter(isRecordData) : [];
    const primaryField = module.fields[0];
    const existingNames = new Set(savedRows.map((row) => String(row[primaryField] ?? "").toLowerCase()));
    module.rows = [
      ...savedRows,
      ...module.rows.filter((row) => !existingNames.has(String(row[primaryField]).toLowerCase())),
    ];
  }

  return seededData;
}