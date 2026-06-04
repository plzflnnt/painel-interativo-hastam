import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import { formatCentsToBRL } from '../utils/format';

export default function Configuracoes() {
  const [user, setUser] = useState(null);
  const [vendedores, setVendedores] = useState([]);
  const [canais, setCanais] = useState([]);
  
  // Forms states
  const [novoVendedor, setNovoVendedor] = useState('');
  const [novoCanal, setNovoCanal] = useState('');
  
  // Metas states
  const [metaMes, setMetaMes] = useState(new Date().getMonth() + 1);
  const [metaAno, setMetaAno] = useState(new Date().getFullYear());
  const [qtdImportacao, setQtdImportacao] = useState('');
  const [valorEstoque, setValorEstoque] = useState('');

  // Export states
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [tsvOutput, setTsvOutput] = useState('');

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

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch Vendedores
      const resVend = await fetch('/api/vendedores', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resVend.status === 401 || resVend.status === 403) {
        handleAuthError();
        return;
      }
      const dataVend = await resVend.json();

      // Fetch Canais
      const resCan = await fetch('/api/canais-origem', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataCan = await resCan.json();

      if (!resVend.ok || !resCan.ok) {
        throw new Error('Erro ao buscar dados das configurações.');
      }

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

  // Add Vendedor
  const handleAddVendedor = async (e) => {
    e.preventDefault();
    if (!novoVendedor.trim()) return;

    try {
      const res = await fetch('/api/vendedores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nome: novoVendedor.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao cadastrar vendedor.');

      setNovoVendedor('');
      showNotification('Vendedor cadastrado com sucesso!');
      fetchData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  // Delete Vendedor
  const handleDeleteVendedor = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este vendedor?')) return;

    try {
      const res = await fetch(`/api/vendedores/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao excluir vendedor.');

      showNotification('Vendedor excluído com sucesso!');
      fetchData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  // Add Canal
  const handleAddCanal = async (e) => {
    e.preventDefault();
    if (!novoCanal.trim()) return;

    try {
      const res = await fetch('/api/canais-origem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nome: novoCanal.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao cadastrar canal de origem.');

      setNovoCanal('');
      showNotification('Canal de origem cadastrado com sucesso!');
      fetchData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  // Delete Canal
  const handleDeleteCanal = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este canal de origem?')) return;

    try {
      const res = await fetch(`/api/canais-origem/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao excluir canal.');

      showNotification('Canal de origem excluído com sucesso!');
      fetchData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  // Save Metas
  const handleSaveMetas = async (e) => {
    e.preventDefault();
    if (qtdImportacao === '' || valorEstoque === '') {
      showNotification('Preencha os valores das metas.', 'error');
      return;
    }

    // Convert valorEstoque (which is in Reais) to cents
    const valorCentavos = Math.round(parseFloat(valorEstoque) * 100);

    try {
      const res = await fetch('/api/metas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mes: parseInt(metaMes, 10),
          ano: parseInt(metaAno, 10),
          qtd_carros_importacao: parseInt(qtdImportacao, 10),
          valor_meta_estoque: valorCentavos
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao salvar metas.');

      showNotification('Metas configuradas com sucesso!');
      setQtdImportacao('');
      setValorEstoque('');
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };



  // Generate TSV Data for export
  const handleExportData = async () => {
    try {
      const query = new URLSearchParams();
      if (dataInicio) query.append('dataInicio', dataInicio);
      if (dataFim) query.append('dataFim', dataFim);

      const res = await fetch(`/api/vendas/exportar?${query.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao exportar dados.');

      if (data.length === 0) {
        setTsvOutput('Nenhuma venda encontrada para o período selecionado.');
        return;
      }

      // Build TSV output
      const headers = ['ID', 'Categoria', 'Modelo', 'Vendedor', 'Canal Origem', 'Valor BRL', 'Data Venda'];
      const rows = data.map(v => [
        v.id,
        v.categoria === 'importacao' ? 'Importação' : 'Estoque',
        v.modelo_carro,
        v.vendedor_nome,
        v.origem_nome,
        formatCentsToBRL(v.valor),
        v.data_venda
      ]);

      const tsvContent = [
        headers.join('\t'),
        ...rows.map(row => row.join('\t'))
      ].join('\n');

      setTsvOutput(tsvContent);
      showNotification('Dados de exportação TSV gerados!');
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
        <span className="text-sm uppercase tracking-widest text-zinc-500 font-medium">Carregando painel de controle...</span>
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
            Configurações do Sistema
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
      <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
        
        {/* Title */}
        <div className="shrink-0">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Painel de Configuração</h2>
          <p className="text-zinc-500 text-xs mt-1">Gerencie os cadastros do sistema, metas mensais e exportações comerciais.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Col 1: Cadastros (Vendedores & Canais) */}
          <div className="space-y-6">
            
            {/* Vendedores Card */}
            <GlassCard hover={false} className="border border-zinc-900 shadow-xl flex flex-col max-h-[360px] overflow-hidden">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200 mb-4 shrink-0">Vendedores</h3>
              
              {/* Form Add */}
              <form onSubmit={handleAddVendedor} className="flex gap-2 mb-4 shrink-0">
                <input
                  type="text"
                  required
                  placeholder="Nome do vendedor"
                  value={novoVendedor}
                  onChange={(e) => setNovoVendedor(e.target.value)}
                  className="flex-1 px-3 py-2 bg-zinc-900/60 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/80 transition-all text-xs"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Adicionar
                </button>
              </form>

              {/* List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {vendedores.length === 0 ? (
                  <p className="text-xs text-zinc-650 italic text-center py-4">Nenhum vendedor cadastrado.</p>
                ) : (
                  vendedores.map(v => (
                    <div key={v.id} className="flex justify-between items-center p-2.5 bg-zinc-900/30 rounded-xl border border-zinc-900/50 hover:border-zinc-800 transition-colors">
                      <span className="text-xs font-medium text-zinc-300">{v.nome}</span>
                      
                      {/* Action Delete */}
                      <div className="relative group">
                        <button
                          onClick={() => handleDeleteVendedor(v.id)}
                          disabled={v.hasSales}
                          className={`p-1.5 rounded-lg transition-all ${
                            v.hasSales 
                              ? 'text-zinc-700 bg-zinc-900/50 cursor-not-allowed' 
                              : 'text-zinc-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer'
                          }`}
                          title={v.hasSales ? "Não é possível excluir: existem vendas vinculadas a este cadastro" : "Excluir vendedor"}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        {v.hasSales && (
                          <span className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-2 w-48 bg-zinc-950 text-zinc-400 text-[10px] p-2 rounded-lg border border-zinc-800 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 leading-tight">
                            Não é possível excluir: existem vendas vinculadas a este cadastro
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>

            {/* Canais Origem Card */}
            <GlassCard hover={false} className="border border-zinc-900 shadow-xl flex flex-col max-h-[360px] overflow-hidden">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200 mb-4 shrink-0">Canais de Origem</h3>
              
              {/* Form Add */}
              <form onSubmit={handleAddCanal} className="flex gap-2 mb-4 shrink-0">
                <input
                  type="text"
                  required
                  placeholder="Nome do canal (ex: Instagram)"
                  value={novoCanal}
                  onChange={(e) => setNovoCanal(e.target.value)}
                  className="flex-1 px-3 py-2 bg-zinc-900/60 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/80 transition-all text-xs"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Adicionar
                </button>
              </form>

              {/* List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {canais.length === 0 ? (
                  <p className="text-xs text-zinc-650 italic text-center py-4">Nenhum canal cadastrado.</p>
                ) : (
                  canais.map(c => (
                    <div key={c.id} className="flex justify-between items-center p-2.5 bg-zinc-900/30 rounded-xl border border-zinc-900/50 hover:border-zinc-800 transition-colors">
                      <span className="text-xs font-medium text-zinc-300">{c.nome}</span>
                      
                      {/* Action Delete */}
                      <div className="relative group">
                        <button
                          onClick={() => handleDeleteCanal(c.id)}
                          disabled={c.hasSales}
                          className={`p-1.5 rounded-lg transition-all ${
                            c.hasSales 
                              ? 'text-zinc-700 bg-zinc-900/50 cursor-not-allowed' 
                              : 'text-zinc-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer'
                          }`}
                          title={c.hasSales ? "Não é possível excluir: existem vendas vinculadas a este cadastro" : "Excluir canal"}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        {c.hasSales && (
                          <span className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-2 w-48 bg-zinc-950 text-zinc-400 text-[10px] p-2 rounded-lg border border-zinc-800 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 leading-tight">
                            Não é possível excluir: existem vendas vinculadas a este cadastro
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>

          </div>

          {/* Col 2: Definição de Metas & Cadastrar Venda */}
          <div className="space-y-6">
            
            {/* Definir Metas Card */}
            <GlassCard hover={false} className="border border-zinc-900 shadow-xl">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200 mb-6">Definir Metas Mensais</h3>
              
              <form onSubmit={handleSaveMetas} className="space-y-4">
                
                {/* Mes/Ano selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Mês</label>
                    <select
                      value={metaMes}
                      onChange={(e) => setMetaMes(e.target.value)}
                      className="w-full px-3 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500/80 transition-all text-xs"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <option key={m} value={m} className="bg-zinc-950">
                          {String(m).padStart(2, '0')} - {new Date(2000, m - 1, 1).toLocaleString('pt-BR', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Ano</label>
                    <select
                      value={metaAno}
                      onChange={(e) => setMetaAno(e.target.value)}
                      className="w-full px-3 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500/80 transition-all text-xs"
                    >
                      {[2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                        <option key={y} value={y} className="bg-zinc-950">{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Meta Importação */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                    Meta Importação (Qtd de Carros)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Ex: 5"
                    value={qtdImportacao}
                    onChange={(e) => setQtdImportacao(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-amber-500/80 transition-all text-xs"
                  />
                </div>

                {/* Meta Estoque */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                    Meta Estoque (Valor em Reais R$)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="Ex: 2000000.00"
                    value={valorEstoque}
                    onChange={(e) => setValorEstoque(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-amber-500/80 transition-all text-xs"
                  />
                  <p className="text-[10px] text-zinc-650 leading-tight">
                    Insira o valor em Reais. Ele será processado em centavos internamente (Ex: 250000 vira R$ 250.000,00).
                  </p>
                </div>

                {/* Save Button */}
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/10 cursor-pointer"
                >
                  Salvar Meta (Upsert)
                </button>

              </form>
            </GlassCard>


          </div>

          {/* Col 3: Exportação */}
          <GlassCard hover={false} className="border border-zinc-900 shadow-xl flex flex-col h-full overflow-hidden">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200 mb-6 shrink-0">Exportação para Excel</h3>
            
            <div className="space-y-4 shrink-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Data Início</label>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500/80 transition-all text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Data Fim</label>
                  <input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500/80 transition-all text-xs"
                  />
                </div>
              </div>

              <button
                onClick={handleExportData}
                className="w-full py-2.5 bg-zinc-850 hover:bg-zinc-850/80 border border-zinc-700/80 text-zinc-200 hover:text-zinc-100 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Gerar Dados
              </button>
            </div>

            {/* Output Textarea */}
            <div className="flex-1 flex flex-col mt-4 min-h-[180px] overflow-hidden">
              <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-1 shrink-0">
                Copiar Bloco TSV
              </label>
              <textarea
                readOnly
                placeholder="Clique em 'Gerar Dados' acima. Copie (Ctrl+C) todo este campo e cole no Excel (Ctrl+V) para separar as colunas perfeitamente."
                value={tsvOutput}
                onClick={(e) => e.target.select()}
                className="flex-1 w-full p-3 bg-zinc-950 border border-zinc-900 rounded-xl text-[10px] font-mono text-zinc-400 placeholder-zinc-750 focus:outline-none resize-none overflow-auto"
              />
              <span className="text-[9px] text-zinc-600 mt-1 italic shrink-0">
                * Dica: Dê um clique dentro da caixa para selecionar todo o texto automaticamente.
              </span>
            </div>
          </GlassCard>

        </div>
      </main>
    </div>
  );
}
