import { Crosshair, Navigation, Users, Heart, RefreshCw } from 'lucide-react';
import { useGameStore } from './store';
import { useEffect, useState } from 'react';

// 5. Interfaz de Usuario (HTML/CSS Overlay)
export function UI() {
  const { health, ammo, maxAmmo, otherPlayers, isLocked, isReloading, zone, myPosition, myRotation, objectives } = useGameStore();

  const mapScale = 1.0;
  const mapCenter = { x: 96, y: 96 }; // w-48 h-48 = 192px / 2 = 96
  
  const healthPercentage = Math.max(0, Math.floor(health));
  const healthColor = healthPercentage > 60 
    ? 'bg-gradient-to-r from-[#00ff41] to-[#a8ff78]' 
    : healthPercentage > 30 
      ? 'bg-gradient-to-r from-yellow-400 to-yellow-200' 
      : 'bg-gradient-to-r from-red-600 to-red-400';

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden font-mono text-[#e0e0e0]">
      
      {/* Crosshair (Centro de pantalla) */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isReloading ? (
          <div className="flex flex-col items-center justify-center translate-y-8">
            <RefreshCw className="text-[#00d2ff] w-8 h-8 animate-spin mb-2" />
            <span className="text-xs tracking-widest text-[#00d2ff] uppercase font-bold animate-pulse">Reloading</span>
          </div>
        ) : (
          <Crosshair className="text-[#00ff41]/80 w-10 h-10 stroke-[1.5px]" />
        )}
      </div>

      {/* Instrucciones de Bloqueo */}
      {!isLocked && (
        <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm z-50 pointer-events-auto bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] text-[#e0e0e0]">
          <div className="text-center space-y-4 bg-black/80 border-l-4 border-[#00ff41] p-8 shadow-[0_0_50px_rgba(0,255,65,0.1)] relative">
            <div className="absolute opacity-20 pointer-events-none inset-0" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, #444 1px, transparent 0)", backgroundSize: "32px 32px" }}></div>
            <div className="text-[10px] uppercase tracking-[0.2em] opacity-60 mb-2 relative z-10 text-left">System Status: Interrupted</div>
            <h1 className="text-5xl font-black italic tracking-widest relative z-10 whitespace-nowrap">BATTLE ROYALE WEBGL</h1>
            <p className="text-sm opacity-60 tracking-wider relative z-10 text-left pt-4">Haz clic para entrar. Usa W,A,S,D para moverte y Click Izq para disparar.</p>
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col items-center gap-4 relative z-10 w-full">
              <p className="text-[10px] text-[#00ff41] font-bold uppercase tracking-[0.3em] border border-[#00ff41]/50 bg-[#00ff41]/10 px-4 py-2 mt-2 text-center w-full">
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
        <div className="absolute inset-0 border-[1px] border-dashed border-white/10 m-2 pointer-events-none"></div>
        
        {/* Safe Zone Circle */}
        <div 
          className="absolute border-[1.5px] border-[#00ff41]/70 rounded-full bg-[#00ff41]/10 transition-all duration-1000 pointer-events-none shadow-[0_0_15px_rgba(0,255,65,0.4)]"
          style={{
            width: `${zone.radius * 2 * mapScale}px`,
            height: `${zone.radius * 2 * mapScale}px`,
            left: `${mapCenter.x + (zone.center[0] - myPosition[0]) * mapScale - zone.radius * mapScale}px`,
            top: `${mapCenter.y + (zone.center[1] - myPosition[2]) * mapScale - zone.radius * mapScale}px`,
          }}
        />

        {/* POIs / Objectives */}
        {objectives.map(obj => (
          <div key={obj.id} className={`absolute w-3 h-3 ${obj.type === 'BOMB_SITE' ? 'bg-[#ff4b2b]' : 'bg-[#00d2ff]'} rotate-45 transform -translate-x-1/2 -translate-y-1/2 shadow-lg z-10 border border-white/50`}
            style={{
              left: `${mapCenter.x + (obj.position[0] - myPosition[0]) * mapScale}px`,
              top: `${mapCenter.y + (obj.position[2] - myPosition[2]) * mapScale}px`,
            }}
          />
        ))}

        {/* Enemy Players */}
        {Array.from(otherPlayers.values()).map(p => (
           <div key={`map_${p.id}`} className="absolute w-2 h-2 bg-[#ff4b2b] rounded-full transform -translate-x-1/2 -translate-y-1/2 box-content border-[1.5px] border-black z-20"
            style={{
              left: `${mapCenter.x + (p.position[0] - myPosition[0]) * mapScale}px`,
              top: `${mapCenter.y + (p.position[2] - myPosition[2]) * mapScale}px`,
            }}
          />
        ))}

        {/* Me (Center) */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
            <Navigation className="text-white w-5 h-5 drop-shadow-[0_0_3px_black] fill-white" style={{ transform: `rotate(${(myRotation * -1) - Math.PI / 4}rad)` }} />
        </div>

        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-tighter bg-black/60 px-2 font-bold text-[#e0e0e0] z-40 whitespace-nowrap">
          Sector Alpha [{Math.round(myPosition[0])}, {Math.round(myPosition[2])}]
        </div>
      </div>

      {/* HUD - Inferior (Estado de Jugador) */}
      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 text-[#e0e0e0] flex flex-col items-center gap-2 w-96 transform -skew-x-12 z-50">
        {/* Barra de Vida - Prominently Displayed */}
        <div className="w-full bg-black/80 border-2 border-white/20 p-2 shadow-[0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-md relative overflow-hidden">
          <div className="flex justify-between items-baseline mb-2 px-1 text-white relative z-10">
             <div className="flex items-center gap-2">
                 <Heart className={`w-5 h-5 ${healthPercentage < 30 ? 'text-red-500 animate-bounce' : 'text-white'}`} style={{ fill: healthPercentage < 30 ? 'currentColor' : 'none' }}/>
                 <span className="font-black italic tracking-widest text-lg">SALUD</span>
             </div>
             <span className="font-black italic text-3xl drop-shadow-md">{healthPercentage}%</span>
          </div>
          <div className="w-full h-8 bg-black/50 border border-white/10 relative z-10">
             <div 
               className={`h-full transition-all duration-300 ${healthColor}`}
               style={{ width: `${healthPercentage}%` }}
             />
             {/* Tick marks */}
             <div className="absolute inset-0 flex justify-between px-[10%] opacity-20 pointer-events-none">
                <div className="w-px h-full bg-white bg-opacity-50"></div>
                <div className="w-px h-full bg-white bg-opacity-50"></div>
                <div className="w-px h-full bg-white bg-opacity-50"></div>
                <div className="w-px h-full bg-white bg-opacity-50"></div>
                <div className="w-px h-full bg-white bg-opacity-50"></div>
                <div className="w-px h-full bg-white bg-opacity-50"></div>
                <div className="w-px h-full bg-white bg-opacity-50"></div>
                <div className="w-px h-full bg-white bg-opacity-50"></div>
                <div className="w-px h-full bg-white bg-opacity-50"></div>
             </div>
          </div>
          {/* Decorative scanline overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] z-20"></div>
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
