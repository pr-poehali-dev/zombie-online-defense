import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface Zombie {
  id: number;
  x: number;
  y: number;
  health: number;
  angle: number;
  distance: number;
}

interface Resource {
  scrap: number;
  fuel: number;
  parts: number;
}

interface Weapon {
  id: string;
  name: string;
  damage: number;
  cost: Resource;
  icon: string;
}

const WEAPONS: Weapon[] = [
  { id: 'turret', name: 'Турель', damage: 15, cost: { scrap: 50, fuel: 0, parts: 20 }, icon: 'Target' },
  { id: 'flamethrower', name: 'Огнемёт', damage: 25, cost: { scrap: 30, fuel: 40, parts: 15 }, icon: 'Flame' },
  { id: 'minigun', name: 'Пулемёт', damage: 35, cost: { scrap: 70, fuel: 20, parts: 30 }, icon: 'Zap' },
];

export default function Index() {
  const [gameState, setGameState] = useState<'menu' | 'playing'>('menu');
  const [mode, setMode] = useState<'campaign' | 'multiplayer' | null>(null);
  const [wave, setWave] = useState(1);
  const [carHealth, setCarHealth] = useState(100);
  const [zombies, setZombies] = useState<Zombie[]>([]);
  const [resources, setResources] = useState<Resource>({ scrap: 100, fuel: 50, parts: 30 });
  const [weapons, setWeapons] = useState<string[]>([]);
  const [score, setScore] = useState(0);

  const startGame = (selectedMode: 'campaign' | 'multiplayer') => {
    setMode(selectedMode);
    setGameState('playing');
    setWave(1);
    setCarHealth(100);
    setZombies([]);
    setResources({ scrap: 100, fuel: 50, parts: 30 });
    setWeapons([]);
    setScore(0);
    toast.success(`${selectedMode === 'campaign' ? 'Кампания' : 'Мультиплеер'} началась!`);
  };

  const spawnWave = () => {
    const newZombies: Zombie[] = [];
    const zombieCount = wave * 3 + 2;
    
    for (let i = 0; i < zombieCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 400 + Math.random() * 100;
      newZombies.push({
        id: Date.now() + i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        health: 30 + wave * 5,
        angle,
        distance,
      });
    }
    
    setZombies(newZombies);
    toast.info(`Волна ${wave} началась!`);
  };

  const shootZombie = (zombieId: number) => {
    if (weapons.length === 0) {
      toast.error('Создайте оружие для защиты!');
      return;
    }

    const weapon = WEAPONS.find(w => weapons.includes(w.id));
    if (!weapon) return;

    setZombies(prev => 
      prev.map(z => {
        if (z.id === zombieId) {
          const newHealth = z.health - weapon.damage;
          if (newHealth <= 0) {
            setScore(s => s + 10);
            const resourceGain = Math.floor(Math.random() * 3);
            if (resourceGain === 0) setResources(r => ({ ...r, scrap: r.scrap + 10 }));
            else if (resourceGain === 1) setResources(r => ({ ...r, fuel: r.fuel + 5 }));
            else setResources(r => ({ ...r, parts: r.parts + 3 }));
            toast.success('Зомби уничтожен! +10 очков');
            return null;
          }
          return { ...z, health: newHealth };
        }
        return z;
      }).filter(Boolean) as Zombie[]
    );
  };

  const craftWeapon = (weaponId: string) => {
    const weapon = WEAPONS.find(w => w.id === weaponId);
    if (!weapon) return;

    if (
      resources.scrap >= weapon.cost.scrap &&
      resources.fuel >= weapon.cost.fuel &&
      resources.parts >= weapon.cost.parts
    ) {
      setResources(r => ({
        scrap: r.scrap - weapon.cost.scrap,
        fuel: r.fuel - weapon.cost.fuel,
        parts: r.parts - weapon.cost.parts,
      }));
      setWeapons(prev => [...prev, weaponId]);
      toast.success(`${weapon.name} создано!`);
    } else {
      toast.error('Недостаточно ресурсов!');
    }
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      setZombies(prev => {
        const updated = prev.map(z => {
          const newDistance = z.distance - 5;
          if (newDistance <= 100) {
            setCarHealth(h => Math.max(0, h - 5));
            toast.error('Машина получила урон!');
            return null;
          }
          return {
            ...z,
            distance: newDistance,
            x: Math.cos(z.angle) * newDistance,
            y: Math.sin(z.angle) * newDistance,
          };
        }).filter(Boolean) as Zombie[];

        if (updated.length === 0 && prev.length > 0) {
          setWave(w => w + 1);
        }

        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState]);

  useEffect(() => {
    if (carHealth <= 0) {
      setGameState('menu');
      toast.error(`Игра окончена! Счёт: ${score}`);
    }
  }, [carHealth, score]);

  useEffect(() => {
    if (gameState === 'playing' && zombies.length === 0 && wave > 0) {
      const timeout = setTimeout(() => spawnWave(), 2000);
      return () => clearTimeout(timeout);
    }
  }, [zombies.length, gameState, wave]);

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#2C3539] via-[#3a2e28] to-[#2C3539] flex items-center justify-center p-4">
        <div className="max-w-4xl w-full text-center space-y-8 animate-fade-in">
          <div className="space-y-4">
            <h1 className="text-7xl font-bold text-[#D2B48C] drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] tracking-wider">
              МЁРТВАЯ ЗОНА
            </h1>
            <p className="text-xl text-[#CD7F32] font-medium">Защити машину. Выживи любой ценой.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-12">
            <Card className="bg-[#3a2e28]/90 border-[#CD7F32]/30 p-8 hover:scale-105 transition-transform cursor-pointer backdrop-blur">
              <div className="space-y-4">
                <Icon name="Map" size={48} className="mx-auto text-[#CD7F32]" />
                <h2 className="text-3xl font-bold text-[#D2B48C]">Кампания</h2>
                <p className="text-[#D2B48C]/80">Пройди через волны зомби и спаси выживших</p>
                <Button 
                  onClick={() => startGame('campaign')}
                  className="w-full bg-[#CD7F32] hover:bg-[#B8860B] text-white font-bold text-lg"
                >
                  Начать кампанию
                </Button>
              </div>
            </Card>

            <Card className="bg-[#3a2e28]/90 border-[#CD7F32]/30 p-8 hover:scale-105 transition-transform cursor-pointer backdrop-blur">
              <div className="space-y-4">
                <Icon name="Users" size={48} className="mx-auto text-[#CD7F32]" />
                <h2 className="text-3xl font-bold text-[#D2B48C]">Мультиплеер</h2>
                <p className="text-[#D2B48C]/80">Сражайся вместе с другими игроками</p>
                <Button 
                  onClick={() => startGame('multiplayer')}
                  className="w-full bg-[#CD7F32] hover:bg-[#B8860B] text-white font-bold text-lg"
                >
                  Мультиплеер
                </Button>
              </div>
            </Card>
          </div>

          <div className="flex items-center justify-center gap-4 text-[#D2B48C]/60 text-sm mt-8">
            <Icon name="Skull" size={20} />
            <span>Разработано для выживших</span>
            <Icon name="Skull" size={20} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2C3539] via-[#3a2e28] to-[#2C3539] p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-[#CD7F32]/20 text-[#D2B48C] border-[#CD7F32] px-4 py-2 text-lg">
              <Icon name="Trophy" size={20} className="mr-2" />
              Очки: {score}
            </Badge>
            <Badge variant="outline" className="bg-[#DC2626]/20 text-[#D2B48C] border-[#DC2626] px-4 py-2 text-lg">
              <Icon name="Waves" size={20} className="mr-2" />
              Волна: {wave}
            </Badge>
          </div>
          <Button 
            onClick={() => setGameState('menu')}
            variant="outline"
            className="border-[#CD7F32] text-[#D2B48C] hover:bg-[#CD7F32]/20"
          >
            <Icon name="Home" size={20} className="mr-2" />
            Меню
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Card className="bg-[#3a2e28]/90 border-[#CD7F32]/30 p-6 backdrop-blur">
              <div className="relative aspect-square bg-[#2C3539] rounded-lg overflow-hidden border-2 border-[#CD7F32]/40" style={{ perspective: '1000px' }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative" style={{ transform: 'rotateX(45deg)' }}>
                    <div className="w-24 h-32 bg-gradient-to-b from-[#CD7F32] to-[#8B4513] rounded-lg shadow-2xl border-4 border-[#D2B48C]/50 flex items-center justify-center" style={{ transform: 'rotateX(-45deg)' }}>
                      <Icon name="Truck" size={48} className="text-[#2C3539]" />
                    </div>
                    <div className="absolute -inset-12">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-32 h-32 border border-[#CD7F32]/20 rounded-full"
                          style={{
                            left: '50%',
                            top: '50%',
                            transform: `translate(-50%, -50%) scale(${1 + i * 0.5})`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {zombies.map((zombie) => (
                  <div
                    key={zombie.id}
                    onClick={() => shootZombie(zombie.id)}
                    className="absolute cursor-crosshair hover:scale-125 transition-transform"
                    style={{
                      left: `calc(50% + ${zombie.x * 0.15}px)`,
                      top: `calc(50% + ${zombie.y * 0.15}px)`,
                      transform: `translate(-50%, -50%) scale(${0.6 + (500 - zombie.distance) / 1000})`,
                    }}
                  >
                    <div className="relative">
                      <Icon name="Ghost" size={32} className="text-[#DC2626] animate-pulse" />
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12">
                        <Progress value={(zombie.health / (30 + wave * 5)) * 100} className="h-1 bg-[#2C3539]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-[#D2B48C]">
                  <span className="flex items-center gap-2">
                    <Icon name="Heart" size={20} className="text-[#DC2626]" />
                    Прочность машины
                  </span>
                  <span className="font-bold">{carHealth}%</span>
                </div>
                <Progress value={carHealth} className="h-3 bg-[#2C3539]" />
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="bg-[#3a2e28]/90 border-[#CD7F32]/30 p-6 backdrop-blur">
              <h3 className="text-2xl font-bold text-[#D2B48C] mb-4 flex items-center gap-2">
                <Icon name="Package" size={24} />
                Ресурсы
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-[#2C3539]/50 rounded">
                  <span className="flex items-center gap-2 text-[#D2B48C]">
                    <Icon name="Box" size={20} className="text-[#8B4513]" />
                    Металлолом
                  </span>
                  <Badge className="bg-[#8B4513] text-white">{resources.scrap}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#2C3539]/50 rounded">
                  <span className="flex items-center gap-2 text-[#D2B48C]">
                    <Icon name="Fuel" size={20} className="text-[#B8860B]" />
                    Топливо
                  </span>
                  <Badge className="bg-[#B8860B] text-white">{resources.fuel}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#2C3539]/50 rounded">
                  <span className="flex items-center gap-2 text-[#D2B48C]">
                    <Icon name="Cog" size={20} className="text-[#CD7F32]" />
                    Детали
                  </span>
                  <Badge className="bg-[#CD7F32] text-white">{resources.parts}</Badge>
                </div>
              </div>
            </Card>

            <Card className="bg-[#3a2e28]/90 border-[#CD7F32]/30 p-6 backdrop-blur">
              <h3 className="text-2xl font-bold text-[#D2B48C] mb-4 flex items-center gap-2">
                <Icon name="Wrench" size={24} />
                Крафт оружия
              </h3>
              <div className="space-y-3">
                {WEAPONS.map((weapon) => (
                  <div key={weapon.id} className="p-4 bg-[#2C3539]/50 rounded space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#D2B48C] flex items-center gap-2">
                        <Icon name={weapon.icon as any} size={20} className="text-[#CD7F32]" />
                        {weapon.name}
                      </span>
                      <Badge variant="outline" className="border-[#DC2626] text-[#DC2626]">
                        {weapon.damage} урона
                      </Badge>
                    </div>
                    <div className="flex gap-2 text-xs text-[#D2B48C]/70">
                      <span>{weapon.cost.scrap} 📦</span>
                      <span>{weapon.cost.fuel} ⛽</span>
                      <span>{weapon.cost.parts} ⚙️</span>
                    </div>
                    <Button
                      onClick={() => craftWeapon(weapon.id)}
                      disabled={weapons.includes(weapon.id)}
                      className="w-full bg-[#CD7F32] hover:bg-[#B8860B] disabled:opacity-50 text-white font-bold"
                      size="sm"
                    >
                      {weapons.includes(weapon.id) ? 'Создано' : 'Создать'}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}