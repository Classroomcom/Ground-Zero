import { Crosshair, Navigation, Users, Heart } from 'lucide-react';
import { useGameStore } from './store';

// 5. Interfaz de Usuario (HTML/CSS Overlay)
export function UI() {
  const { health, ammo, maxAmmo, otherPlayers, isLocked } = useGameStore();

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden font-mono text-[#e0e0e0]">
      
      {/* Crosshair (Centro de pantalla) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Crosshair className="text-[#00ff41]/80 w-10 h-10 stroke-[1.5px]" />
      </div>

      {/* Instrucciones de Bloqueo */}
      {!isLocked && (
        <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm z-50 pointer-events-auto bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] text-[#e0e0e0]">
          <div className="text-center space-y-4 bg-black/80 border-l-4 border-[#00ff41] p-8 shadow-[0_0_50px_rgba(0,255,65,0.1)] relative">
            <div className="absolute opacity-20 pointer-events-none inset-0" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, #444 1px, transparent 0)", backgroundSize: "32px 32px" }}></div>
            <div className="text-[10px] uppercase tracking-[0.2em] opacity-60 mb-2 relative z-10 text-left">System Status: Interrupted</div>
            <h1 className="text-5xl font-black italic tracking-widest relative z-10 whitespace-nowrap">BATTLE ROYALE WEBGL</h1>
            <p className="text-sm opacity-60 tracking-wider relative z-10 text-left pt-4">Haz clic para entrar. Usa W,A,S,D para moverte y Click Izq para disparar.</p>
            <div className="mt-6 flex justify-start relative z-10">
              <p className="text-[10px] text-[#00ff41] font-bold uppercase tracking-[0.3em] border border-[#00ff41]/50 bg-[#00ff41]/10 px-4 py-2">
                Arquitectura Base: Three.js + Rapier + Socket.io + Zustand
              </p>
            </div>
          </div>
        </div>
      )}

      {/* HUD - Superior Derecho (Contador de Jugadores) */}
      <div className="absolute top-8 right-8 bg-black/60 border border-white/10 p-4 flex gap-8 backdrop-blur-sm text-[#e0e0e0]">
        <div className="text-center">
          <div className="text-[10px] opacity-50 uppercase">Jugadores Vivos</div>
          <div className="text-2xl font-bold flex items-center justify-center gap-2">
            {otherPlayers.size + 1}
            <Users className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* HUD - Superior Izquierdo (Minimapa Mock) */}
      <div className="absolute top-8 left-8 w-48 h-48 bg-black/80 border-2 border-white/20 relative rounded-sm overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-[#1a2b1a] opacity-40"></div>
        <div className="absolute inset-0 border-[1px] border-dashed border-white/10 m-2"></div>
        <div className="absolute top-1/4 left-1/4 w-12 h-12 bg-[#00ff41]/20 border border-[#00ff41]/50"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <Navigation className="text-[#00ff41] w-6 h-6 rotate-45" />
        </div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-tighter bg-black/60 px-2 font-bold text-[#e0e0e0]">Sector Alpha</div>
      </div>

      {/* HUD - Inferior (Estado de Jugador) */}
      <div className="absolute bottom-8 left-8 text-[#e0e0e0] flex flex-col gap-4 w-80">
        {/* Barra de Vida */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-bold items-center">
            <div className="flex items-center gap-1">
                <Heart className={`w-3 h-3 ${health < 30 ? 'text-[#ff4b2b] animate-pulse' : 'text-gray-400'}`} />
                <span className="tracking-widest">SALUD</span>
            </div>
            <span>{Math.max(0, Math.floor(health))}%</span>
          </div>
          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
            <div 
              className={`h-full transition-all duration-300 ${health > 30 ? 'bg-gradient-to-r from-[#00ff41] to-[#a8ff78]' : 'bg-[#ff4b2b]'}`}
              style={{ width: `${Math.max(0, health)}%` }}
            />
          </div>
        </div>
      </div>

      {/* HUD - Inferior Derecho (Munición) */}
      <div className="absolute bottom-8 right-8 text-[#e0e0e0]">
        <div className="bg-black/80 border-t-4 border-[#00ff41] p-6 pr-12 backdrop-blur-md relative shadow-lg">
          <div className="flex items-baseline gap-4">
            <div className={`text-5xl font-black italic tracking-tighter ${ammo < 10 ? 'text-[#ff4b2b]' : 'text-[#e0e0e0]'}`}>
              {ammo}
            </div>
            <div className="text-xl opacity-40">/ {maxAmmo}</div>
          </div>
          <div className="mt-1">
            <div className="text-sm uppercase tracking-[0.3em] font-bold">FUSIL DE ASALTO</div>
            <div className="text-[9px] text-[#00ff41] mt-1">SEMI-AUTO | CALIBER 5.56</div>
          </div>
          <div className="absolute bottom-0 right-0 w-2 h-full bg-[#00ff41]"></div>
        </div>
      </div>

    </div>
  );
}
