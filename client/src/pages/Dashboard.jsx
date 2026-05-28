import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    // Load user information
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Fetch dashboard data
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch('/api/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.status === 401 || response.status === 403) {
          // Token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
          return;
        }

        if (!response.ok) {
          throw new Error('Erro ao carregar dados do painel.');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Helper to format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 gap-4">
        <svg className="animate-spin h-10 w-10 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-sm uppercase tracking-widest text-zinc-500 font-medium">Carregando telemetria...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col pb-12">
      {/* Header */}
      <header className="glass-panel border-b border-zinc-900 px-6 py-4 md:px-12 flex justify-between items-center sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-lg font-black tracking-widest bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
            HASTAM
          </span>
          <span className="text-xs uppercase tracking-widest text-zinc-500 border-l border-zinc-800 pl-3 hidden sm:inline">
            Painel Administrativo
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-zinc-500">Operador conectado</p>
            <p className="text-sm font-semibold text-zinc-200">{user?.username || 'Admin'}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-amber-500">
            {user?.username ? user.username.substring(0, 2).toUpperCase() : 'AD'}
          </div>
          <button 
            onClick={handleLogout}
            className="text-xs uppercase tracking-wider bg-zinc-900 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/20 text-zinc-400 hover:text-red-400 px-4 py-2 rounded-xl transition-all duration-300 cursor-pointer"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Main Dashboard Area */}
      <main className="max-w-7xl mx-auto w-full px-4 md:px-8 mt-8 space-y-8 animate-fade-in">
        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-500/15 border border-red-500/30 text-red-400 rounded-2xl text-sm flex gap-3 items-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Dashboard Title */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-100">Visão Geral de Vendas</h2>
          <p className="text-zinc-500 text-sm mt-1">Dados de performance comercial offline para a Hastam Motors.</p>
        </div>

        {/* Core metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Total Revenue */}
          <GlassCard className="flex flex-col justify-between min-h-[140px] border border-zinc-900 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-amber-500">
              <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500 font-medium">Faturamento Total</p>
              <h3 className="text-2xl md:text-3xl font-extrabold text-amber-500 mt-2 tracking-tight">
                {data ? formatCurrency(data.totalSales) : '€ 0,00'}
              </h3>
            </div>
            <div className="mt-4 text-xs text-emerald-400 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>+12.4% em relação ao mês anterior</span>
            </div>
          </GlassCard>

          {/* Card 2: Cars Sold */}
          <GlassCard className="flex flex-col justify-between min-h-[140px] border border-zinc-900 shadow-xl">
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500 font-medium">Veículos Entregues</p>
              <h3 className="text-2xl md:text-3xl font-extrabold text-zinc-100 mt-2 tracking-tight">
                {data?.carsSold || 0} <span className="text-sm font-light text-zinc-500">unidades</span>
              </h3>
            </div>
            <div className="mt-4 text-xs text-amber-500/80 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
              </svg>
              <span>Meta mensal de 50 carros ativa</span>
            </div>
          </GlassCard>

          {/* Card 3: Average Ticket */}
          <GlassCard className="flex flex-col justify-between min-h-[140px] border border-zinc-900 shadow-xl">
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500 font-medium">Ticket Médio</p>
              <h3 className="text-2xl md:text-3xl font-extrabold text-zinc-100 mt-2 tracking-tight">
                {data ? formatCurrency(data.averagePrice) : '€ 0,00'}
              </h3>
            </div>
            <div className="mt-4 text-xs text-zinc-500">
              Valor médio por modelo Hastam vendido
            </div>
          </GlassCard>

          {/* Card 4: Top Model */}
          <GlassCard className="flex flex-col justify-between min-h-[140px] border border-zinc-900 shadow-xl">
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500 font-medium">Modelo Mais Vendido</p>
              <h3 className="text-lg md:text-xl font-bold text-amber-500 mt-3 truncate">
                {data?.topModel || 'Nenhum'}
              </h3>
            </div>
            <div className="mt-4 text-xs text-emerald-400 flex items-center gap-1">
              <span>Representa 38% das vendas totais</span>
            </div>
          </GlassCard>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Sales Table */}
          <GlassCard hover={false} className="lg:col-span-2 border border-zinc-900 shadow-xl p-0 overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-900 flex justify-between items-center">
              <h4 className="text-sm uppercase tracking-wider font-bold text-zinc-200">Log de Vendas Recentes</h4>
              <span className="text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full">Atualizado em tempo real</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-900/60 bg-zinc-900/20 text-zinc-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-3.5 font-medium">Veículo</th>
                    <th className="px-6 py-3.5 font-medium">Cliente</th>
                    <th className="px-6 py-3.5 font-medium">Data</th>
                    <th className="px-6 py-3.5 font-medium text-right">Valor</th>
                    <th className="px-6 py-3.5 font-medium text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/40">
                  {data?.recentSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-zinc-900/10 transition-colors">
                      <td className="px-6 py-4 font-semibold text-zinc-200">{sale.model}</td>
                      <td className="px-6 py-4 text-zinc-400">{sale.client}</td>
                      <td className="px-6 py-4 text-zinc-500 text-xs">{sale.date}</td>
                      <td className="px-6 py-4 text-right font-mono font-medium text-zinc-300">{formatCurrency(sale.price)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          sale.status === 'Concluída' 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                            : sale.status === 'Pendente'
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                          {sale.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* Target Progress Card */}
          <GlassCard hover={false} className="border border-zinc-900 shadow-xl flex flex-col justify-between">
            <div>
              <h4 className="text-sm uppercase tracking-wider font-bold text-zinc-200 mb-6">Meta Comercial de Vendas</h4>
              
              {/* Radial Progress Visual */}
              <div className="flex flex-col items-center justify-center my-4 relative">
                <svg className="w-36 h-36 transform -rotate-90">
                  {/* Background Circle */}
                  <circle 
                    cx="72" 
                    cy="72" 
                    r="60" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                    fill="transparent" 
                    className="text-zinc-900"
                  />
                  {/* Progress Circle */}
                  <circle 
                    cx="72" 
                    cy="72" 
                    r="60" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                    fill="transparent" 
                    strokeDasharray={2 * Math.PI * 60}
                    strokeDashoffset={2 * Math.PI * 60 * (1 - (data?.monthlyTargetProgress || 0) / 100)}
                    className="text-amber-500"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-black text-zinc-100">{data?.monthlyTargetProgress || 0}%</span>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Atingido</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t border-zinc-900/60 pt-6 mt-6">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Progresso Total</span>
                <span className="font-semibold text-zinc-200">{data?.carsSold} de 50 carros</span>
              </div>
              <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-1.5 rounded-full" 
                  style={{ width: `${data?.monthlyTargetProgress || 0}%` }}
                ></div>
              </div>
              <p className="text-zinc-500 text-xs leading-relaxed text-center">
                Restam 8 veículos vendidos para atingir a meta operacional do trimestre corrente.
              </p>
            </div>
          </GlassCard>
        </div>
      </main>
    </div>
  );
}
