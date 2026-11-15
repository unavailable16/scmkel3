import { useEffect, useState } from "react";
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Pencil,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  Truck,
  Users,
  Warehouse,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import {
  demoEmailForUsername,
  getDemoUsernameFromEmail,
  type DemoUsername,
} from "@/lib/supplyflow-auth";
import { prepareSupplyFlowLogin } from "@/lib/supplyflow-auth.functions";
import { createSeedData, mergeSavedData, type RecordData, type SupplyFlowData } from "./data";
import "./supplyflow.css";

const dataKey = (username: string) => `supplyflow-data-${username}`;

function initials(username: string) {
  return username.slice(0, 2).toUpperCase();
}

function loadUserData(username: string): SupplyFlowData {
  try {
    const saved = localStorage.getItem(dataKey(username)) ?? localStorage.getItem("supplyflow-data");
    return saved ? mergeSavedData(JSON.parse(saved)) : createSeedData();
  } catch {
    return createSeedData();
  }
}

const nav = [
  ["dashboard", "Dashboard", LayoutDashboard],
  ["supplier", "Supplier", Users],
  ["produk", "Produk", Package],
  ["gudang", "Gudang", Warehouse],
  ["pembelian", "Pembelian", ShoppingCart],
  ["penjualan", "Penjualan", ClipboardList],
  ["pengiriman", "Pengiriman", Truck],
  ["pelanggan", "Pelanggan", Users],
  ["laporan", "Laporan", BarChart3],
] as const;

export default function SupplyFlow() {
  const prepareLogin = useServerFn(prepareSupplyFlowLogin);
  const [username, setUsername] = useState<DemoUsername | null>(null);
  const [dataState, setDataState] = useState<{ owner: string; value: SupplyFlowData } | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loginName, setLoginName] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [edit, setEdit] = useState<number | null>(null);
  const [form, setForm] = useState<RecordData | null>(null);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    let active = true;

    const restoreSignedInUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      const allowedUsername = getDemoUsernameFromEmail(data.user?.email);
      if (allowedUsername) {
        setUsername(allowedUsername);
        setDataState({ owner: allowedUsername, value: loadUserData(allowedUsername) });
      } else {
        setUsername(null);
        setDataState(null);
        if (data.user) await supabase.auth.signOut();
      }
      setAuthReady(true);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setUsername(null);
        setDataState(null);
        setAuthReady(true);
      } else if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        window.setTimeout(() => void restoreSignedInUser(), 0);
      }
    });

    void restoreSignedInUser();
    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!dataState) return;
    try {
      localStorage.setItem(dataKey(dataState.owner), JSON.stringify(dataState.value));
    } catch {
      // Keep the current screen usable if browser storage is unavailable.
    }
  }, [dataState]);

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    const normalizedUsername = loginName.trim().toLowerCase();
    const result = await prepareLogin({
      data: { username: normalizedUsername, password },
    }).catch(() => ({ ready: false }));

    if (!result.ready) {
      setLoginError("Username atau password tidak sesuai.");
      setLoginLoading(false);
      return;
    }

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: demoEmailForUsername(normalizedUsername),
      password,
    });

    if (error || !authData.user) {
      setLoginError("Username atau password tidak sesuai.");
      setLoginLoading(false);
      return;
    }

    const signedInUsername = getDemoUsernameFromEmail(authData.user.email);
    if (!signedInUsername) {
      await supabase.auth.signOut();
      setLoginError("Akun ini tidak dapat digunakan.");
      setLoginLoading(false);
      return;
    }

    setUsername(signedInUsername);
    setDataState({ owner: signedInUsername, value: loadUserData(signedInUsername) });
    setPage("dashboard");
    setLoginName("");
    setPassword("");
    setAuthReady(true);
    setLoginLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  if (!authReady) {
    return <div className="login-screen" aria-busy="true"><div className="login-loading">SupplyFlow</div></div>;
  }

  if (!username || !dataState || dataState.owner !== username) {
    return (
      <div className="login-screen">
        <section className="login-panel" aria-labelledby="login-title">
          <div className="login-brand"><span className="logo">S</span><div>SupplyFlow<small>SCM MANAGEMENT</small></div></div>
          <div className="login-copy">
            <span className="welcome-kicker">SUPPLY CHAIN MANAGEMENT</span>
            <h1 id="login-title">Masuk ke SupplyFlow</h1>
            <p>Kelola operasional rantai pasok Anda.</p>
          </div>
          <form className="login-form" onSubmit={signIn}>
            <label htmlFor="supplyflow-username">Username</label>
            <input
              id="supplyflow-username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={loginName}
              onChange={(event) => setLoginName(event.target.value)}
              placeholder="Masukkan username"
            />
            <label htmlFor="supplyflow-password">Password</label>
            <input
              id="supplyflow-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Masukkan password"
            />
            {loginError && <p className="login-error" role="alert">{loginError}</p>}
            <Button className="primary login-submit" type="submit" disabled={loginLoading}>
              {loginLoading ? "Memeriksa…" : "Masuk"}
            </Button>
          </form>
        </section>
      </div>
    );
  }

  const data = dataState.value;
  const mod = data[page];
  const products = data.produk.rows;
  const low = products.filter((product) => Number(product.stok) <= Number(product.minimum));
  const count = (key: string) => data[key]?.rows.length ?? 0;

  function save() {
    if (!mod || !form) return;
    setDataState((current) => {
      if (!current || current.owner !== username) return current;
      const rows = current.value[page].rows;
      return {
        ...current,
        value: {
          ...current.value,
          [page]: {
            ...current.value[page],
            rows: edit === null ? [...rows, form] : rows.map((row, index) => index === edit ? form : row),
          },
        },
      };
    });
    setForm(null);
  }

  function remove(index: number) {
    if (!window.confirm("Hapus data ini?")) return;
    setDataState((current) => {
      if (!current || current.owner !== username) return current;
      return {
        ...current,
        value: {
          ...current.value,
          [page]: {
            ...current.value[page],
            rows: current.value[page].rows.filter((_, rowIndex) => rowIndex !== index),
          },
        },
      };
    });
  }

  function openForm(index: number | null) {
    if (!mod) return;
    setEdit(index);
    setForm(index === null ? Object.fromEntries(mod.fields.map((field) => [field, ""])) : { ...mod.rows[index] });
  }

  function actionPurchase(index: number) {
    const order = data.pembelian.rows[index];
    if (!order || order.status === "Diterima") return;
    const productIndex = products.findIndex((product) => product.nama === order.produk);
    if (productIndex < 0) {
      window.alert("Produk tidak ditemukan.");
      return;
    }
    setDataState((current) => {
      if (!current || current.owner !== username) return current;
      return {
        ...current,
        value: {
          ...current.value,
          produk: {
            ...current.value.produk,
            rows: current.value.produk.rows.map((product, rowIndex) =>
              rowIndex === productIndex ? { ...product, stok: Number(product.stok) + Number(order.jumlah) } : product,
            ),
          },
          pembelian: {
            ...current.value.pembelian,
            rows: current.value.pembelian.rows.map((row, rowIndex) =>
              rowIndex === index ? { ...row, status: "Diterima" } : row,
            ),
          },
        },
      };
    });
  }

  function actionSale(index: number) {
    const order = data.penjualan.rows[index];
    if (!order || order.status === "Selesai") return;
    const productIndex = products.findIndex((product) => product.nama === order.produk);
    if (productIndex < 0) {
      window.alert("Produk tidak ditemukan.");
      return;
    }
    if (Number(products[productIndex]?.stok) < Number(order.jumlah)) {
      window.alert("Stok tidak cukup.");
      return;
    }
    setDataState((current) => {
      if (!current || current.owner !== username) return current;
      return {
        ...current,
        value: {
          ...current.value,
          produk: {
            ...current.value.produk,
            rows: current.value.produk.rows.map((product, rowIndex) =>
              rowIndex === productIndex ? { ...product, stok: Number(product.stok) - Number(order.jumlah) } : product,
            ),
          },
          penjualan: {
            ...current.value.penjualan,
            rows: current.value.penjualan.rows.map((row, rowIndex) =>
              rowIndex === index ? { ...row, status: "Selesai" } : row,
            ),
          },
        },
      };
    });
  }

  return (
    <div className="app">
      <aside className={mobile ? "sidebar show" : "sidebar"}>
        <div className="brand">
          <span className="logo">S</span>
          <div>SupplyFlow<small>SCM MANAGEMENT</small></div>
          <Button variant="ghost" size="icon" className="mobile-close" onClick={() => setMobile(false)} aria-label="Tutup menu">
            <X size={18} />
          </Button>
        </div>
        <div className="nav-label">MENU UTAMA</div>
        <nav>
          {nav.map(([id, label, Icon]) => (
            <Button
              variant="ghost"
              key={id}
              className={page === id ? "active" : ""}
              onClick={() => { setPage(id); setSearch(""); setMobile(false); }}
            >
              <Icon size={18} />{label}
            </Button>
          ))}
        </nav>
        <div className="sidebar-bottom">SupplyFlow v1.0<br />Contoh data siap dikelola</div>
      </aside>

      <main>
        <header>
          <Button variant="ghost" size="icon" className="hamburger" onClick={() => setMobile(true)} aria-label="Buka menu">
            <Menu />
          </Button>
          <div className="header-title">
            <div className="eyebrow">SUPPLY CHAIN MANAGEMENT</div>
            <h1>{page === "dashboard" ? "Dashboard Overview" : page === "laporan" ? "Laporan & Analitik" : `Manajemen ${mod.title}`}</h1>
          </div>
          <div className="account-menu">
            <span className="account-name">{username}</span>
            <div className="avatar" aria-label={`Inisial ${initials(username)}`}>{initials(username)}</div>
            <Button variant="ghost" size="sm" className="signout-button" onClick={signOut} aria-label="Keluar">
              <LogOut size={16} /><span>Keluar</span>
            </Button>
          </div>
        </header>

        <div className="content">
          {page === "dashboard" ? (
            <>
              <div className="welcome">
                <div>
                  <span className="welcome-kicker">OPERASIONAL RANTAI PASOK</span>
                  <h2>Selamat datang, {username}!</h2>
                  <p>Pantau seluruh proses supply chain dari supplier hingga pengiriman dalam satu sistem.</p>
                </div>
                <Warehouse size={78} opacity={0.3} />
              </div>
              <div className="stats">
                {[["Total Produk", count("produk"), Package], ["Supplier Aktif", count("supplier"), Users], ["Pesanan Pembelian", count("pembelian"), ShoppingCart], ["Pengiriman", count("pengiriman"), Truck]].map(([label, value, Icon]) => (
                  <div className="stat" key={String(label)}>
                    <div className="stat-icon"><Icon size={21} /></div>
                    <div className="stat-value">{String(value)}</div>
                    <div className="stat-label">{String(label)}</div>
                  </div>
                ))}
              </div>
              <div className="panels">
                <section className="panel">
                  <h3>Stok Produk</h3>
                  <p className="muted">Ringkasan persediaan saat ini</p>
                  {products.slice(0, 8).map((product, index) => (
                    <div className="stock" key={`${product.nama}-${index}`}>
                      <div><strong>{product.nama}</strong><small>{product.kategori}</small></div>
                      <div className={Number(product.stok) <= Number(product.minimum) ? "pill danger" : "pill success"}>{product.stok} unit</div>
                    </div>
                  ))}
                </section>
                <section className="panel">
                  <h3>Perhatian Stok</h3>
                  <p className="muted">Produk yang mencapai batas minimum</p>
                  {low.length ? low.slice(0, 6).map((product, index) => (
                    <div className="alert" key={`${product.nama}-${index}`}><strong>{product.nama}</strong><span>Sisa {product.stok} / Min. {product.minimum}</span></div>
                  )) : <p>Semua stok dalam kondisi aman.</p>}
                  <Button className="secondary" onClick={() => setPage("produk")}>Kelola inventaris →</Button>
                </section>
              </div>
            </>
          ) : page === "laporan" ? (
            <>
              <div className="stats">
                {[["Total Unit Stok", products.reduce((sum, product) => sum + Number(product.stok), 0)], ["Nilai Inventaris", `Rp ${products.reduce((sum, product) => sum + Number(product.stok) * Number(product.harga), 0).toLocaleString("id-ID")}`], ["Stok Menipis", low.length], ["Penjualan Selesai", data.penjualan.rows.filter((row) => row.status === "Selesai").length]].map(([label, value]) => (
                  <div className="stat" key={String(label)}><div className="stat-label">{String(label)}</div><div className="stat-value">{String(value)}</div></div>
                ))}
              </div>
              <section className="panel">
                <h3>Ringkasan Operasional</h3>
                <p>Laporan dihitung otomatis berdasarkan data yang tersimpan pada browser ini.</p>
                <div className="stock"><strong>Pembelian diterima</strong>{data.pembelian.rows.filter((row) => row.status === "Diterima").length}</div>
                <div className="stock"><strong>Pesanan penjualan</strong>{count("penjualan")}</div>
                <div className="stock"><strong>Total pelanggan</strong>{count("pelanggan")}</div>
              </section>
            </>
          ) : (
            <section className="panel table-panel">
              <div className="table-heading">
                <div><h3>Daftar {mod.title}</h3><p className="muted">Tambah, ubah, dan kelola data {mod.title.toLowerCase()}</p></div>
                <Button className="primary" onClick={() => openForm(null)}><Plus size={17} /> Tambah {mod.title}</Button>
              </div>
              <div className="search"><Search size={18} /><input aria-label={`Cari data ${mod.title.toLowerCase()}`} placeholder={`Cari data ${mod.title.toLowerCase()}...`} value={search} onChange={(event) => setSearch(event.target.value)} /></div>
              <div className="table-scroll">
                <table>
                  <thead><tr><th>No</th>{mod.fields.map((field) => <th key={field}>{field.replace(/^./, (character) => character.toUpperCase())}</th>)}{(page === "pembelian" || page === "penjualan") && <th>Proses</th>}<th>Aksi</th></tr></thead>
                  <tbody>
                    {mod.rows.map((row, index) => ({ ...row, _index: index })).filter((row) => Object.values(row).some((value) => String(value).toLowerCase().includes(search.toLowerCase()))).map((row) => (
                      <tr key={row._index}>
                        <td>{Number(row._index) + 1}</td>
                        {mod.fields.map((field) => <td key={field}>{field === "harga" ? `Rp ${Number(row[field]).toLocaleString("id-ID")}` : String(row[field] ?? "")}</td>)}
                        {page === "pembelian" && <td><Button variant="secondary" size="sm" className="tiny" disabled={row.status === "Diterima"} onClick={() => actionPurchase(Number(row._index))}>Terima Barang</Button></td>}
                        {page === "penjualan" && <td><Button variant="secondary" size="sm" className="tiny" disabled={row.status === "Selesai"} onClick={() => actionSale(Number(row._index))}>Selesaikan</Button></td>}
                        <td><div className="actions"><Button variant="ghost" size="icon" title="Edit" aria-label="Edit" onClick={() => openForm(Number(row._index))}><Pencil size={16} /></Button><Button variant="ghost" size="icon" title="Hapus" aria-label="Hapus" onClick={() => remove(Number(row._index))}><Trash2 size={16} /></Button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {mod.rows.length === 0 && <div className="empty">Belum ada data.</div>}
              </div>
            </section>
          )}
        </div>
      </main>

      {form && mod && (
        <div className="overlay" onClick={() => setForm(null)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="form-title" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header"><h3 id="form-title">{edit === null ? "Tambah" : "Edit"} {mod.title}</h3><Button variant="ghost" size="icon" onClick={() => setForm(null)} aria-label="Tutup"><X size={20} /></Button></div>
            <form onSubmit={(event) => { event.preventDefault(); save(); }}>
              {mod.fields.map((field) => (
                <label key={field}>{field.replace(/^./, (character) => character.toUpperCase())}
                  {field === "status" ? (
                    <select value={form[field] ?? ""} onChange={(event) => setForm({ ...form, [field]: event.target.value })}>{["Baru", "Dipesan", "Diproses", "Dikirim", "Selesai", "Diterima"].map((status) => <option key={status}>{status}</option>)}</select>
                  ) : (
                    <input required type={["harga", "stok", "minimum", "jumlah", "kapasitas"].includes(field) ? "number" : "text"} min={["harga", "stok", "minimum", "jumlah", "kapasitas"].includes(field) ? 0 : undefined} value={form[field] ?? ""} onChange={(event) => setForm({ ...form, [field]: ["harga", "stok", "minimum", "jumlah", "kapasitas"].includes(field) ? Number(event.target.value) : event.target.value })} />
                  )}
                </label>
              ))}
              <div className="modal-actions"><Button type="button" variant="secondary" className="secondary" onClick={() => setForm(null)}>Batal</Button><Button className="primary" type="submit">Simpan Data</Button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}