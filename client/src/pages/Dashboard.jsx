import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import { formatCentsToBRL } from '../utils/format';

// Custom SVG Line Chart Component for premium rendering
function SVGLineChart({ yValues, goal, maxVal, isCurrency, color }) {
  const width = 500;
  const height = 150;
  const paddingX = 35;
  const paddingY = 20;
  
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Safe scale calculations
  const maxScale = Math.max(maxVal, goal, 1);

  // Generate coordinates
  const coords = yValues.map((val, idx) => {
    const x = paddingX + (idx / (yValues.length - 1 || 1)) * chartWidth;
    const y = paddingY + chartHeight - (val / maxScale) * chartHeight;
    return { x, y, val };
  });

  // SVG Path strings
  const pathData = coords.length > 0 
    ? coords.map((p, idx) => `${idx === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
    : '';

  const areaData = coords.length > 0
    ? `${pathData} L${width - paddingX},${height - paddingY} L${paddingX},${height - paddingY} Z`
    : '';

  // Calculate Goal Y position
  const yGoal = paddingY + chartHeight - (goal / maxScale) * chartHeight;

  // Format tick labels
  const formatTickVal = (v) => {
    if (isCurrency) {
      if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`;
      if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}k`;
      return `R$ ${v}`;
    }
    return Math.round(v);
  };

  const strokeColor = color === 'orange' ? '#f97316' : '#a1a1aa';
  const gradientId = `grad-${color}-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="relative w-full h-[150px]">
      <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color === 'orange' ? '#ea580c' : '#71717a'} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color === 'orange' ? '#ea580c' : '#71717a'} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid Lines */}
        {[0, 0.5, 1].map((ratio, idx) => {
          const y = paddingY + chartHeight * ratio;
          const val = maxScale * (1 - ratio);
          return (
            <g key={idx} className="opacity-10">
              <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#ffffff" strokeWidth="0.5" />
              <text x={4} y={y + 3} fill="#ffffff" fontSize="8" className="font-mono">
                {formatTickVal(val)}
              </text>
            </g>
          );
        })}

        {/* Goal Line (Meta) */}
        {goal > 0 && yGoal >= paddingY && yGoal <= height - paddingY && (
          <g>
            <line 
              x1={paddingX} 
              y1={yGoal} 
              x2={width - paddingX} 
              y2={yGoal} 
              stroke="#ea580c" 
              strokeDasharray="4 3" 
              strokeWidth="1.2" 
              className="opacity-70"
            />
            <text x={width - paddingX - 45} y={yGoal - 4} fill="#ea580c" fontSize="8" fontWeight="bold" className="opacity-80">
              META: {isCurrency ? formatTickVal(goal) : goal}
            </text>
          </g>
        )}

        {/* Area and Line Path */}
        {coords.length > 0 && (
          <>
            <path d={areaData} fill={`url(#${gradientId})`} />
            <path d={pathData} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
            
            {/* Glowing Last Dot */}
            {coords.length > 0 && (
              <circle 
                cx={coords[coords.length - 1].x} 
                cy={coords[coords.length - 1].y} 
                r="4.5" 
                fill={strokeColor} 
                className="animate-pulse"
              />
            )}
          </>
        )}

        {/* X Axis Labels */}
        <g className="opacity-30">
          <text x={paddingX} y={height - 4} fill="#ffffff" fontSize="7" textAnchor="middle">Dia 1</text>
          <text x={width / 2} y={height - 4} fill="#ffffff" fontSize="7" textAnchor="middle">Dia 15</text>
          <text x={width - paddingX} y={height - 4} fill="#ffffff" fontSize="7" textAnchor="middle">Dia {yValues.length}</text>
        </g>
      </svg>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [user, setUser] = useState(null);
  
  // Month & Year state defaults to current date
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem('token');

  // Load user info once
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Fetch data on parameters change & set up 5s interval polling
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    fetchDashboardData();

    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, [selectedMonth, selectedYear, token, navigate]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`/api/dashboard?mes=${selectedMonth}&ano=${selectedYear}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
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
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
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

  // Pre-calculate data variables
  const imp = data?.importacao || { total_carros: 0, modelos: [], ranking_vendedores: [], meta_qtd: 0, progresso_percentual: 0, restante: 0 };
  const est = data?.estoque || { valor_total: 0, ranking_vendedores: [], meta_valor: 0, progresso_percentual: 0, restante: 0 };
  
  // Extract daily points for chart
  const evolution = data?.evolution || [];
  const daysInMonth = evolution.length;
  const importacaoDailyValues = evolution.map(d => d.importacao);
  // For currency values in chart, convert cents to real values in BRL
  const estoqueDailyValues = evolution.map(d => d.estoque / 100);

  // Compute maximum values for chart scales
  const maxImportacaoVal = Math.max(...importacaoDailyValues, 0);
  const maxEstoqueVal = Math.max(...estoqueDailyValues, 0);

  // Average ticket calculations (estoque)
  const estoqueSalesCount = data?.vendas ? data.vendas.filter(v => v.categoria === 'estoque').length : 0;
  const averageTicket = estoqueSalesCount > 0 ? (est.valor_total / estoqueSalesCount) : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col h-screen overflow-hidden">
      
      {/* Header */}
      <header className="glass-panel border-b border-zinc-900 px-6 py-4 md:px-12 flex justify-between items-center sticky top-0 z-50 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-lg font-black tracking-widest bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
            HASTAM
          </span>
          <span className="text-xs uppercase tracking-widest text-zinc-500 border-l border-zinc-800 pl-3 hidden sm:inline">
            Motors
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
              to="/configuracoes" 
              className={`text-xs uppercase tracking-wider font-semibold transition-colors ${
                location.pathname === '/configuracoes' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Configurações
            </Link>
          </nav>
        </div>

        {/* Date Selectors & User details */}
        <div className="flex items-center gap-6">
          
          {/* selectors */}
          <div className="flex gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              className="px-2 py-1.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m} className="bg-zinc-950">
                  {String(m).padStart(2, '0')}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="px-2 py-1.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-zinc-200 text-xs focus:outline-none focus:border-amber-500/50"
            >
              {[2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                <option key={y} value={y} className="bg-zinc-950">{y}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
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
        </div>
      </header>

      {/* Main Split Screen Area (exactly 50% / 50%) */}
      <main className="flex-1 grid grid-cols-2 gap-4 p-4 md:p-6 overflow-hidden min-h-0 bg-zinc-950">
        
        {/* LEFT COLUMN: Importação (50%) */}
        <section className="flex flex-col h-full min-h-0">
          <GlassCard hover={false} className="flex-1 flex flex-col justify-between p-5 border border-zinc-900 shadow-2xl relative overflow-hidden h-full">
            {/* Top background accent */}
            <div className="absolute top-0 left-0 w-24 h-24 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
            
            {/* Title */}
            <div className="flex justify-between items-center border-b border-zinc-900/80 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-3 bg-amber-500 rounded-full"></span>
                <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Categoria Importação</h2>
              </div>
              <span className="text-[10px] text-zinc-500 font-medium font-mono uppercase bg-zinc-900/60 border border-zinc-850 px-2.5 py-0.5 rounded-full">
                Foco em Unidades
              </span>
            </div>

            {/* Content body split to fit screen */}
            <div className="flex-1 flex flex-col justify-between my-3 min-h-0 space-y-4">
              
              {/* Progresso de Metas & Qtd */}
              <div className="grid grid-cols-2 gap-4 shrink-0">
                <div className="bg-zinc-900/20 border border-zinc-900/60 p-3 rounded-2xl">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-medium">Veículos Vendidos</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-zinc-100">{imp.total_carros}</span>
                    <span className="text-xs text-zinc-500 font-light">carros</span>
                  </div>
                </div>

                <div className="bg-zinc-900/20 border border-zinc-900/60 p-3 rounded-2xl flex flex-col justify-between">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-medium">Meta do Mês</span>
                    <span className="text-xs font-black text-amber-500 font-mono">{imp.progresso_percentual}%</span>
                  </div>
                  <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden my-1">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${imp.progresso_percentual}%` }}
                    ></div>
                  </div>
                  <span className="text-[9px] text-zinc-500">
                    {imp.restante > 0 ? `Faltam ${imp.restante} carros para atingir ${imp.meta_qtd}` : 'Meta atingida!'}
                  </span>
                </div>
              </div>

              {/* Models List */}
              <div className="shrink-0">
                <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-medium block mb-1.5">Modelos Entregues</span>
                <div className="flex flex-wrap gap-1.5 max-h-[44px] overflow-y-auto pr-1">
                  {imp.modelos.length === 0 ? (
                    <span className="text-[10px] text-zinc-650 italic">Nenhum veículo importado neste período.</span>
                  ) : (
                    imp.modelos.map((m, idx) => (
                      <span 
                        key={idx} 
                        className="text-[9px] font-semibold text-zinc-300 bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded-md"
                      >
                        {m}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Ranking Vendedores */}
              <div className="flex-1 flex flex-col min-h-0">
                <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-medium block mb-2 shrink-0">Performance de Vendedores</span>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[90px]">
                  {imp.ranking_vendedores.length === 0 ? (
                    <p className="text-[10px] text-zinc-650 italic py-2">Sem vendas registradas no ranking.</p>
                  ) : (
                    imp.ranking_vendedores.map((v, idx) => {
                      const totalSalesImp = imp.ranking_vendedores[0]?.qtd || 1;
                      const percentOfTop = Math.round((v.qtd * 100) / totalSalesImp);
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-zinc-300">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-zinc-500 font-mono">#{idx+1}</span>
                              <span>{v.nome}</span>
                            </div>
                            <span className="text-zinc-400 font-mono">{v.qtd} {v.qtd === 1 ? 'carro' : 'carros'}</span>
                          </div>
                          <div className="w-full bg-zinc-900/60 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-amber-500/80 h-full rounded-full transition-all" 
                              style={{ width: `${percentOfTop}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* SVG Line Chart */}
              <div className="bg-zinc-900/10 border border-zinc-900/50 p-2.5 rounded-2xl shrink-0">
                <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-medium block mb-2">Evolução de Qtd Acumulada</span>
                <SVGLineChart 
                  yValues={importacaoDailyValues} 
                  goal={imp.meta_qtd} 
                  maxVal={maxImportacaoVal} 
                  isCurrency={false} 
                  color="orange"
                />
              </div>

            </div>
          </GlassCard>
        </section>

        {/* RIGHT COLUMN: Estoque (50%) */}
        <section className="flex flex-col h-full min-h-0">
          <GlassCard hover={false} className="flex-1 flex flex-col justify-between p-5 border border-zinc-900 shadow-2xl relative overflow-hidden h-full">
            {/* Top background accent */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-zinc-500/5 rounded-full blur-3xl pointer-events-none"></div>
            
            {/* Title */}
            <div className="flex justify-between items-center border-b border-zinc-900/80 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-3 bg-zinc-400 rounded-full"></span>
                <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Categoria Estoque</h2>
              </div>
              <span className="text-[10px] text-zinc-500 font-medium font-mono uppercase bg-zinc-900/60 border border-zinc-850 px-2.5 py-0.5 rounded-full">
                Foco em Faturamento
              </span>
            </div>

            {/* Content body split to fit screen */}
            <div className="flex-1 flex flex-col justify-between my-3 min-h-0 space-y-4">
              
              {/* Progresso de Metas & Faturamento */}
              <div className="grid grid-cols-2 gap-4 shrink-0">
                <div className="bg-zinc-900/20 border border-zinc-900/60 p-3 rounded-2xl">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-medium">Valor Acumulado</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl md:text-2xl font-black text-amber-500 tracking-tight leading-none break-all">
                      {formatCentsToBRL(est.valor_total)}
                    </span>
                  </div>
                </div>

                <div className="bg-zinc-900/20 border border-zinc-900/60 p-3 rounded-2xl flex flex-col justify-between">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-medium">Meta do Mês</span>
                    <span className="text-xs font-black text-zinc-300 font-mono">{est.progresso_percentual}%</span>
                  </div>
                  <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden my-1">
                    <div 
                      className="bg-zinc-400 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${est.progresso_percentual}%` }}
                    ></div>
                  </div>
                  <span className="text-[9px] text-zinc-500 truncate">
                    {est.restante > 0 ? `Restam ${formatCentsToBRL(est.restante)} de ${formatCentsToBRL(est.meta_valor)}` : 'Meta de faturamento atingida!'}
                  </span>
                </div>
              </div>

              {/* Ticket Médio */}
              <div className="bg-zinc-900/20 border border-zinc-900/40 px-3.5 py-2.5 rounded-2xl shrink-0 flex justify-between items-center">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-medium block">Ticket Médio (Estoque)</span>
                  <span className="text-xs text-zinc-400 font-light mt-0.5">Média ponderada por veículo faturado</span>
                </div>
                <span className="text-sm font-bold text-zinc-200 font-mono">
                  {formatCentsToBRL(averageTicket)}
                </span>
              </div>

              {/* Ranking Vendedores */}
              <div className="flex-1 flex flex-col min-h-0">
                <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-medium block mb-2 shrink-0">Faturamento por Vendedor</span>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[90px]">
                  {est.ranking_vendedores.length === 0 ? (
                    <p className="text-[10px] text-zinc-650 italic py-2">Sem vendas registradas no ranking.</p>
                  ) : (
                    est.ranking_vendedores.map((v, idx) => {
                      const totalSalesEst = est.ranking_vendedores[0]?.valor || 1;
                      const percentOfTop = Math.round((v.valor * 100) / totalSalesEst);
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-zinc-300">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-zinc-500 font-mono">#{idx+1}</span>
                              <span>{v.nome}</span>
                            </div>
                            <span className="text-zinc-400 font-mono">{formatCentsToBRL(v.valor)}</span>
                          </div>
                          <div className="w-full bg-zinc-900/60 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-zinc-400/80 h-full rounded-full transition-all" 
                              style={{ width: `${percentOfTop}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* SVG Line Chart */}
              <div className="bg-zinc-900/10 border border-zinc-900/50 p-2.5 rounded-2xl shrink-0">
                <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-medium block mb-2">Faturamento Acumulado (R$)</span>
                <SVGLineChart 
                  yValues={estoqueDailyValues} 
                  goal={est.meta_valor / 100} 
                  maxVal={maxEstoqueVal} 
                  isCurrency={true} 
                  color="zinc"
                />
              </div>

            </div>
          </GlassCard>
        </section>

      </main>
      
      {/* Error alert wrapper absolute if error happens */}
      {error && (
        <div className="absolute bottom-4 right-4 p-4 bg-red-500/90 border border-red-600 text-white rounded-2xl text-xs z-50 animate-bounce flex items-center gap-2">
          <span>⚠️ Erro de Telemetria: {error}</span>
        </div>
      )}

    </div>
  );
}
