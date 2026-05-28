import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <div className="relative min-h-screen flex flex-col justify-between px-6 py-8 md:px-16 md:py-12 bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Decorative Top Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Header */}
      <header className="relative z-10 w-full flex justify-between items-center animate-fade-in">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-widest bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
            HASTAM
          </span>
          <span className="text-xs uppercase tracking-widest text-zinc-500 border-l border-zinc-800 pl-3">
            Motors
          </span>
        </div>
        
        <Link 
          to={isAuthenticated ? "/dashboard" : "/login"} 
          className="text-xs tracking-wider uppercase font-medium text-zinc-400 hover:text-amber-500 transition-colors border border-zinc-800/80 rounded-full px-5 py-2 hover:border-amber-500/30 backdrop-blur-md"
        >
          {isAuthenticated ? "Dashboard" : "Login"}
        </Link>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto flex flex-col items-center text-center my-auto px-4 py-16 animate-slide-up">
        <span className="text-xs uppercase tracking-widest text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full mb-8 font-medium">
          Edição Exclusiva Limitada
        </span>
        
        <h1 className="text-5xl md:text-8xl font-black tracking-tight leading-tight mb-8">
          A pureza do design. <br />
          <span className="bg-gradient-to-r from-zinc-100 via-zinc-300 to-amber-500 bg-clip-text text-transparent">
            A força da eletricidade.
          </span>
        </h1>
        
        <p className="text-zinc-400 text-lg md:text-xl font-light leading-relaxed max-w-2xl mb-12">
          Hastam Motors redefine a experiência automotiva de alto desempenho. Sistemas inteligentes integrados, aerodinâmica refinada e zero emissão.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            to={isAuthenticated ? "/dashboard" : "/login"}
            className="w-full sm:w-auto text-center px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold rounded-xl transition-all hover:scale-105 duration-300 shadow-[0_4px_20px_rgba(245,158,11,0.25)]"
          >
            {isAuthenticated ? "Acessar Painel" : "Entrar no Painel"}
          </Link>
          <a 
            href="#saiba-mais"
            onClick={(e) => {
              e.preventDefault();
              alert("Hastam Motors - Protótipo 100% offline.");
            }}
            className="w-full sm:w-auto text-center px-8 py-4 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 font-medium rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all duration-300"
          >
            Conhecer Modelos
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-600 mt-8 border-t border-zinc-900 pt-8 animate-fade-in">
        <p>© 2026 Hastam Motors. Todos os direitos reservados. Funcionamento 100% Offline.</p>
        <div className="flex gap-6">
          <a href="#termos" className="hover:text-zinc-400 transition-colors">Termos de Uso</a>
          <a href="#privacidade" className="hover:text-zinc-400 transition-colors">Privacidade</a>
        </div>
      </footer>
    </div>
  );
}
