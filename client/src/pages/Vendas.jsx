import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import { formatCentsToBRL } from '../utils/format';

export default function Vendas() {
  const [user, setUser] = useState(null);
  const [vendas, setVendas] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [canais, setCanais] = useState([]);

  // Modal open/close and edit mode states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null); // null for create, ID for edit

  // Form states
  const [categoria, setCategoria] = useState('importacao');
  const [modeloCarro, setModeloCarro] = useState('');
  const [vendedorId, setVendedorId] = useState('');
  const [origemId, setOrigemId] = useState('');
  const [valor, setValor] = useState('');
  const [dataVenda, setDataVenda] = useState(new Date().toISOString().substring(0, 10));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    fetchData();
  }, [token, navigate]);

  // Enforce dynamic pre-selection of dropdown values once options are loaded
  useEffect(() => {
    if (vendedores.length > 0 && !vendedorId) {
      setVendedorId(vendedores[0].id);
    }
  }, [vendedores, vendedorId]);

  useEffect(() => {
    if (canais.length > 0 && !origemId) {
      setOrigemId(canais[0].id);
    }
  }, [canais, origemId]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch Sales List
      const resVendas = await fetch('/api/vendas', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resVendas.status === 401 || resVendas.status === 403) {
        handleAuthError();
        return;
      }
      const dataVendas = await resVendas.json();

      // 2. Fetch Vendedores for dropdowns
      const resVend = await fetch('/api/vendedores', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataVend = await resVend.json();

      // 3. Fetch Canais for dropdowns
      const resCan = await fetch('/api/canais-origem', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataCan = await resCan.json();

      if (!resVendas.ok || !resVend.ok || !resCan.ok) {
        throw new Error('Erro ao carregar dados do painel de vendas.');
      }

      setVendas(dataVendas);
      setVendedores(dataVend);
      setCanais(dataCan);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthError = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const showNotification = (msg, type = 'success') => {
    if (type === 'success') {
      setSuccess(msg);
      setTimeout(() => setSuccess(''), 4000);
    } else {
      setError(msg);
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleValorChange = (e) => {
    const clean = e.target.value.replace(/\D/g, '');
    if (!clean) {
      setValor('');
      return;
    }
    const formatted = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(parseFloat(clean) / 100);
    setValor(formatted);
  };

  // Open modal for adding new sale
  const handleOpenAddModal = () => {
    setEditId(null);
    setCategoria('importacao');
    setModeloCarro('');
    setValor('');
    setDataVenda(new Date().toISOString().substring(0, 10));
    
    if (vendedores.length > 0) setVendedorId(vendedores[0].id);
    if (canais.length > 0) setOrigemId(canais[0].id);
    
    setIsModalOpen(true);
  };

  // Open modal for editing existing sale
  const handleOpenEditModal = (sale) => {
    setEditId(sale.id);
    setCategoria(sale.categoria);
    setModeloCarro(sale.modelo_carro);
    setVendedorId(sale.vendedor_id);
    setOrigemId(sale.origem_id);
    setDataVenda(sale.data_venda.substring(0, 10));

    // Format cents to BRL visual mask string
    const formatted = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(sale.valor / 100);
    setValor(formatted);

    setIsModalOpen(true);
  };

  // Save Sale Form submission (POST / PUT)
  const handleSaveSale = async (e) => {
    e.preventDefault();

    if (!categoria || !modeloCarro.trim() || !vendedorId || !origemId || !valor || !dataVenda) {
      showNotification('Preencha todos os campos obrigatórios da venda.', 'error');
      return;
    }

    const valorReais = parseFloat(valor.replace(/\./g, '').replace(',', '.'));
    if (isNaN(valorReais) || valorReais <= 0) {
      showNotification('Valor da venda inválido.', 'error');
      return;
    }

    const payload = {
      categoria,
      modelo_carro: modeloCarro.trim(),
      vendedor_id: parseInt(vendedorId, 10),
      origem_id: parseInt(origemId, 10),
      valor: valorReais,
      data_venda: `${dataVenda} 12:00:00` // standard timestamp format
    };

    const isEdit = editId !== null;
    const url = isEdit ? `/api/vendas/${editId}` : '/api/vendas';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao registrar venda.');

      showNotification(isEdit ? 'Venda atualizada com sucesso!' : 'Venda cadastrada com sucesso!');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  // Delete sale
  const handleDeleteSale = async (id) => {
    if (!window.confirm('Tem certeza que deseja apagar esta venda?')) return;

    try {
      const res = await fetch(`/api/vendas/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao apagar venda.');

      showNotification('Venda excluída com sucesso!');
      fetchData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 gap-4">
        <svg className="animate-spin h-10 w-10 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-sm uppercase tracking-widest text-zinc-500 font-medium">Carregando painel de vendas...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col h-screen overflow-hidden">
      
      {/* Header */}
      <header className="glass-panel border-b border-zinc-900 px-6 py-4 md:px-12 flex justify-between items-center z-50 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-lg font-black tracking-widest bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
            HASTAM
          </span>
          <span className="text-xs uppercase tracking-widest text-zinc-500 border-l border-zinc-800 pl-3 hidden sm:inline">
            Gerenciamento Comercial
          </span>
          <nav className="flex gap-4 ml-6 pl-6 border-l border-zinc-800">
            <Link 
              to="/dashboard" 
              className={`text-xs uppercase tracking-wider font-semibold transition-colors ${
                location.pathname === '/dashboard' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Dashboard
            </Link>
            <Link 
              to="/vendas" 
              className={`text-xs uppercase tracking-wider font-semibold transition-colors ${
                location.pathname === '/vendas' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Vendas
            </Link>
            <Link 
              to="/configuracoes" 
              className={`text-xs uppercase tracking-wider font-semibold transition-colors ${
                location.pathname === '/configuracoes' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Configurações
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-zinc-500">Operador conectado</p>
            <p className="text-sm font-semibold text-zinc-200">{user?.username || 'Admin'}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="text-xs uppercase tracking-wider bg-zinc-900 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/20 text-zinc-400 hover:text-red-400 px-4 py-2 rounded-xl transition-all duration-300 cursor-pointer"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Form Feedback banners */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex gap-2 items-center animate-fade-in shrink-0">
          <span>⚠️ {error}</span>
        </div>
      )}
      {success && (
        <div className="mx-6 mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm flex gap-2 items-center animate-fade-in shrink-0">
          <span>✅ {success}</span>
        </div>
      )}

      {/* Main Body */}
      <main className="flex-1 overflow-hidden p-6 md:p-8 flex flex-col space-y-6">
        
        {/* Top Header Row */}
        <div className="flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Gerenciamento de Vendas</h2>
            <p className="text-zinc-500 text-xs mt-1">Lista completa de veículos faturados e opções de controle comercial.</p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black text-xs font-bold rounded-xl shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transition-all duration-300 cursor-pointer flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Adicionar Venda
          </button>
        </div>

        {/* Sales Table Inside GlassCard */}
        <GlassCard hover={false} className="flex-1 border border-zinc-900 shadow-xl p-0 overflow-hidden flex flex-col min-h-0">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-md">
                <tr className="border-b border-zinc-900 bg-zinc-900/40 text-zinc-500 text-[10px] md:text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Data</th>
                  <th className="px-6 py-4 font-semibold">Categoria</th>
                  <th className="px-6 py-4 font-semibold">Modelo do Carro</th>
                  <th className="px-6 py-4 font-semibold">Vendedor</th>
                  <th className="px-6 py-4 font-semibold">Origem</th>
                  <th className="px-6 py-4 font-semibold text-right">Valor</th>
                  <th className="px-6 py-4 font-semibold text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/50">
                {vendas.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-xs text-zinc-650 italic">
                      Nenhuma venda registrada no sistema. Clique em "+ Adicionar Venda" para começar.
                    </td>
                  </tr>
                ) : (
                  vendas.map((sale) => (
                    <tr key={sale.id} className="hover:bg-zinc-900/10 transition-colors">
                      <td className="px-6 py-4 text-zinc-400 font-mono text-xs">{sale.data_venda.substring(0, 16)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          sale.categoria === 'importacao' 
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                            : 'bg-zinc-400/10 border-zinc-400/20 text-zinc-300'
                        }`}>
                          {sale.categoria === 'importacao' ? 'Importação' : 'Estoque'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-zinc-200">{sale.modelo_carro}</td>
                      <td className="px-6 py-4 text-zinc-300 font-medium">{sale.vendedor_nome}</td>
                      <td className="px-6 py-4 text-zinc-400">{sale.origem_nome}</td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-zinc-100">{formatCentsToBRL(sale.valor)}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex gap-2 justify-center">
                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEditModal(sale)}
                            className="p-1.5 bg-zinc-900 hover:bg-amber-500/10 text-zinc-400 hover:text-amber-500 border border-zinc-800 rounded-lg transition-all cursor-pointer"
                            title="Editar venda"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteSale(sale.id)}
                            className="p-1.5 bg-zinc-900 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 border border-zinc-800 rounded-lg transition-all cursor-pointer"
                            title="Excluir venda"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </main>

      {/* Modal Dialog for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <GlassCard hover={false} className="w-full max-w-md border border-zinc-800 shadow-2xl relative p-6 animate-slide-up flex flex-col max-h-[90vh] overflow-y-auto">
            
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-550 hover:text-zinc-300 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-base font-bold uppercase tracking-wider text-zinc-200 mb-6">
              {editId ? 'Editar Registro de Venda' : 'Cadastrar Nova Venda'}
            </h3>

            <form onSubmit={handleSaveSale} className="space-y-4">
              
              {/* Category */}
              <div className="space-y-1">
                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Categoria</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500/80 transition-all text-xs"
                >
                  <option value="importacao" className="bg-zinc-950">Importação</option>
                  <option value="estoque" className="bg-zinc-950">Estoque da Loja</option>
                </select>
              </div>

              {/* Modelo */}
              <div className="space-y-1">
                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Modelo do Carro</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Porsche 911 GT3"
                  value={modeloCarro}
                  onChange={(e) => setModeloCarro(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-amber-500/80 transition-all text-xs"
                />
              </div>

              {/* Vendedor */}
              <div className="space-y-1">
                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Vendedor</label>
                <select
                  value={vendedorId}
                  onChange={(e) => setVendedorId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500/80 transition-all text-xs"
                >
                  {vendedores.length === 0 ? (
                    <option value="" className="bg-zinc-950">Nenhum vendedor cadastrado</option>
                  ) : (
                    vendedores.map(v => (
                      <option key={v.id} value={v.id} className="bg-zinc-950">{v.nome}</option>
                    ))
                  )}
                </select>
              </div>

              {/* Canal de Origem */}
              <div className="space-y-1">
                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Canal de Origem</label>
                <select
                  value={origemId}
                  onChange={(e) => setOrigemId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500/80 transition-all text-xs"
                >
                  {canais.length === 0 ? (
                    <option value="" className="bg-zinc-950">Nenhum canal cadastrado</option>
                  ) : (
                    canais.map(c => (
                      <option key={c.id} value={c.id} className="bg-zinc-950">{c.nome}</option>
                    ))
                  )}
                </select>
              </div>

              {/* Valor */}
              <div className="space-y-1">
                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Valor da Venda (R$)</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 150.000,00"
                  value={valor}
                  onChange={handleValorChange}
                  className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-amber-500/80 transition-all text-xs"
                />
              </div>

              {/* Data */}
              <div className="space-y-1">
                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Data da Venda</label>
                <input
                  type="date"
                  required
                  value={dataVenda}
                  onChange={(e) => setDataVenda(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500/80 transition-all text-xs"
                />
              </div>

              {/* Actions Footer */}
              <div className="flex gap-3 pt-4 border-t border-zinc-900 mt-6 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 text-zinc-400 hover:text-zinc-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={vendedores.length === 0 || canais.length === 0}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/10 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Salvar Venda
                </button>
              </div>

            </form>
          </GlassCard>
        </div>
      )}

    </div>
  );
}
