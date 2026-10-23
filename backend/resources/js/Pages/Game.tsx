import { router } from '@inertiajs/react';
import { ArrowRight, Coins, Copy, Dice5, Landmark, LogOut, MapPin, ShieldCheck, Sparkles, Trophy, Users } from 'lucide-react';
import { useEffect } from 'react';
import { useMemo, useState } from 'react';

interface RoomPlayer {
    id: number;
    name: string;
    token: string;
    cash: number;
    position: number;
    seat: number;
}

interface Room {
    code: string;
    name: string;
    status: string;
    state: {
        turn: number;
        properties: Record<number, number>;
        dice: [number, number] | null;
    } | null;
    players: RoomPlayer[];
}

interface Props {
    room: Room;
    playerId: number | null;
}

type Space = { name: string; type: 'start' | 'property' | 'tax' | 'chance' | 'jail' | 'rail' | 'utility' | 'free' | 'gotojail'; price?: number; color?: string; group?: string };

const spaces: Space[] = [
    { name: 'GO • Collect ৳200', type: 'start' }, { name: 'Old Dhaka', type: 'property', price: 600, color: '#b87952', group: 'Heritage' }, { name: 'Community Chest', type: 'chance' }, { name: 'Lalbagh Fort', type: 'property', price: 600, color: '#b87952', group: 'Heritage' }, { name: 'Income Tax', type: 'tax', price: 200 }, { name: 'Dhaka Metro', type: 'rail', price: 200 }, { name: 'Sylhet Tea Gardens', type: 'property', price: 1000, color: '#8aa96b', group: 'Nature' }, { name: 'Chance', type: 'chance' }, { name: 'Jaflong', type: 'property', price: 1000, color: '#8aa96b', group: 'Nature' }, { name: 'Ratargul Swamp Forest', type: 'property', price: 1200, color: '#8aa96b', group: 'Nature' },
    { name: 'Jail / Just Visiting', type: 'jail' }, { name: 'Rajshahi Silk', type: 'property', price: 1400, color: '#b98bd1', group: 'Tradition' }, { name: 'Power Utility', type: 'utility', price: 150 }, { name: 'Paharpur', type: 'property', price: 1400, color: '#b98bd1', group: 'Tradition' }, { name: 'Mahasthangarh', type: 'property', price: 1600, color: '#b98bd1', group: 'Tradition' }, { name: 'Chattogram Port', type: 'rail', price: 200 }, { name: "Cox's Bazar", type: 'property', price: 1800, color: '#e6a34a', group: 'Coastal' }, { name: 'Community Chest', type: 'chance' }, { name: "Saint Martin's Island", type: 'property', price: 1800, color: '#e6a34a', group: 'Coastal' }, { name: 'Inani Beach', type: 'property', price: 2000, color: '#e6a34a', group: 'Coastal' },
    { name: 'Free Parking', type: 'free' }, { name: 'Sundarbans', type: 'property', price: 2200, color: '#4f9b84', group: 'Wild Bangladesh' }, { name: 'Chance', type: 'chance' }, { name: 'Kuakata', type: 'property', price: 2200, color: '#4f9b84', group: 'Wild Bangladesh' }, { name: 'Padma Bridge', type: 'property', price: 2400, color: '#4f9b84', group: 'Wild Bangladesh' }, { name: 'Padma Rail Link', type: 'rail', price: 200 }, { name: 'National Parliament', type: 'property', price: 2600, color: '#6e8ed6', group: 'Capital' }, { name: 'Jamuna Bridge', type: 'property', price: 2600, color: '#6e8ed6', group: 'Capital' }, { name: 'Water Utility', type: 'utility', price: 150 }, { name: 'National Museum', type: 'property', price: 2800, color: '#6e8ed6', group: 'Capital' },
    { name: 'Go to Jail', type: 'gotojail' }, { name: 'Kaptai Lake', type: 'property', price: 3000, color: '#7b91a6', group: 'Hill Tracts' }, { name: 'Bandarban Hills', type: 'property', price: 3000, color: '#7b91a6', group: 'Hill Tracts' }, { name: 'Community Chest', type: 'chance' }, { name: 'Rangamati', type: 'property', price: 3200, color: '#7b91a6', group: 'Hill Tracts' }, { name: 'Mongla Port', type: 'rail', price: 200 }, { name: 'Bashundhara City', type: 'property', price: 3500, color: '#d66d84', group: 'Commerce' }, { name: 'Luxury Tax', type: 'tax', price: 100 }, { name: 'Jamuna Future Park', type: 'property', price: 4000, color: '#d66d84', group: 'Commerce' }, { name: 'Finish • Collect ৳200', type: 'start' },
];

const colors = ['#65d6a5', '#f2b35e', '#83a7ff', '#d68ee8', '#f08080', '#73c7d9'];
const money = (amount: number): string => `৳${amount.toLocaleString('en-BD')}`;

export default function Game({ room, playerId }: Props) {
    const [copied, setCopied] = useState(false);
    const state = room.state ?? { turn: 0, properties: {}, dice: null };

    useEffect(() => {
        if (!window.Echo) {
            return;
        }

        const channel = window.Echo.join(`game-room.${room.code}`)
            .here((players: RoomPlayer[]) => {
                console.log('Players in room:', players);
            })
            .joining((player: RoomPlayer) => {
                console.log('Player joining:', player.name);
            })
            .leaving((player: RoomPlayer) => {
                console.log('Player leaving:', player.name);
            });

        const handleUpdate = () => {
            router.reload({ only: ['room'], preserveScroll: true });
        };

        channel.listen('.game.state.updated', handleUpdate);

        return () => {
            channel.stopListening('.game.state.updated');
            window.Echo.leave(`game-room.${room.code}`);
        };
    }, [room.code]);
    const players = useMemo(() => [...room.players].sort((a, b) => a.seat - b.seat), [room.players]);
    const active = players[state.turn % Math.max(players.length, 1)] ?? { id: 0, name: 'Waiting for player', token: '🎲', cash: 0, position: 0, seat: 0 };
    const current = spaces[active.position];
    const you = players.find((player) => player.id === playerId);
    const rolled = state.dice !== null;
    const owned = state.properties ?? {};

    const sendAction = (type: 'roll' | 'buy' | 'end_turn' | 'leave'): void => {
        router.post(`/rooms/${room.code}/actions`, type === 'buy' ? { type, space_id: active.position } : { type }, { preserveScroll: true });
    };

    const copyCode = async (): Promise<void> => {
        await navigator.clipboard?.writeText(room.code);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
    };

    return <main className="app">
        <header className="topbar"><div className="brand"><div className="brandmark"><Landmark size={22} /></div><div><strong>MONOPOLY <span>BANGLADESH</span></strong><small>Own the places. Shape the nation.</small></div></div><div className="top-actions"><span className="online"><i /> Online room</span><button className="ghost" onClick={() => sendAction('leave')}><LogOut size={16} /> Leave Game</button></div></header>
        <section className="hero"><div><div className="eyebrow"><Sparkles size={14} /> A LOCAL TWIST ON A CLASSIC</div><h1>Build your <em>Bangladesh</em><br />property empire.</h1><p>From the streets of Old Dhaka to the shores of Cox&apos;s Bazar, every roll is a new opportunity.</p></div><div className="hero-stat"><div className="stat-icon"><Trophy size={20} /></div><div><small>YOUR BALANCE</small><strong>{money(you?.cash ?? 0)}</strong><span>Starting capital: ৳1,500</span></div></div></section>
        <div className="layout"><aside className="left-rail"><div className="rail-brand"><div className="brandmark"><Landmark size={21} /></div><div><strong>MONOPOLY <span>BANGLADESH</span></strong><small>Own the places. Shape the nation.</small></div></div><section className="side-card room-card"><div className="side-title"><h3><Users size={17} /> Game room</h3><span className="room-live"><i /> LIVE</span></div><strong className="rail-room-name">{room.name}</strong><button className="share rail-share" onClick={() => void copyCode()}><Copy size={14} />{copied ? 'Copied!' : `Room code: ${room.code}`}</button></section><section className="side-card rail-tip"><Sparkles size={17} /><div><strong>Build your empire</strong><p>Roll, invest in Bangladesh&apos;s landmarks, and collect rent from your rivals.</p></div></section><section className="side-card leave-card"><button className="btn-leave" onClick={() => sendAction('leave')}><LogOut size={14} /> Leave game</button><small>Return to lobby</small></section></aside>
        <section className="game-panel"><div className="panel-head"><div><span className="eyebrow">PRIVATE TABLE</span><h2>{room.name}</h2></div><button className="share" onClick={() => void copyCode()}><Copy size={15} />{copied ? 'Copied!' : room.code}</button></div><div className="board-wrap"><div className="board">{spaces.map((space, index) => <div key={index} className={`space pos-${index} ${space.type} ${you?.position === index ? 'is-you-here' : ''} ${active.position === index ? 'is-turn-location' : ''}`} style={{ '--group': space.color ?? '#b8c2d1' } as React.CSSProperties}><div className="space-color" /><span className="space-icon">{space.type === 'start' ? '✦' : space.type === 'rail' ? '🚆' : space.type === 'tax' ? '৳' : space.type === 'chance' ? '?' : space.type === 'jail' ? '🔒' : space.type === 'free' ? '🅿' : space.type === 'gotojail' ? '🚔' : space.type === 'utility' ? '⚡' : '◆'}</span><span className="space-name">{space.name}</span>{space.price && <b>{money(space.price)}</b>}{owned[index] && <span className="owner-dot" style={{ background: colors[players.find((player) => player.id === owned[index])?.seat ?? 0] }} />}{players.filter((player) => player.position === index).length > 0 && <div className="space-tokens">{players.filter((player) => player.position === index).map((player) => <span className={`token ${player.id === playerId ? 'token-you' : ''} ${player.id === active.id ? 'token-turn' : ''}`} key={player.id} style={{ '--token-color': colors[player.seat] } as React.CSSProperties}>{player.token}</span>)}</div>}</div>)}<div className="board-center"><div className="center-topline"><span className="bd-mark">🇧🇩</span><span>PRIVATE GAME</span><span className="center-live"><i /> LIVE</span></div><div className="center-heading"><strong>PROPERTY</strong><b>EXCHANGE</b><small>BANGLADESH EDITION</small></div><div className="center-location"><MapPin size={12} /><span>{current.name}</span><b>{rolled ? 'MOVE COMPLETE' : 'YOUR NEXT MOVE'}</b></div><div className="game-controls board-controls"><div className="dice-area"><div className="dice-pair"><div className="die">{state.dice?.[0] ?? 1}</div><div className="die">{state.dice?.[1] ?? 1}</div></div><div><strong>{(state.dice?.[0] ?? 1) + (state.dice?.[1] ?? 1)} <small>total</small></strong><span>{rolled ? 'Move complete' : 'Roll to move'}</span></div></div><div className="control-buttons"><button className="secondary" onClick={() => sendAction('roll')} disabled={players.length < 2 || rolled || active.id !== playerId}><Dice5 size={17} /> Roll dice</button><button className="primary" onClick={() => sendAction('buy')} disabled={players.length < 2 || !rolled || active.id !== playerId || !['property', 'rail', 'utility'].includes(current.type) || Boolean(owned[active.position]) || active.cash < (current.price ?? 0)}><Coins size={17} /> Buy property</button><button className="dark" onClick={() => sendAction('end_turn')} disabled={players.length < 2 || !rolled || active.id !== playerId}>End turn <ArrowRight size={16} /></button></div></div><div className="landed-card info-landed-card"><div className="landed-symbol" style={{ background: current.color ?? '#dbe6f4' }}><MapPin size={22} /></div><div className="landed-info"><small>LANDED ON</small><strong>{current.name}</strong><span>{current.group ?? current.type}</span></div><div className="landed-price"><small>{current.price ? 'PRICE' : 'SPACE TYPE'}</small><strong>{current.price ? money(current.price) : current.type.toUpperCase()}</strong></div></div></div></div></div></section>
        <aside className="sidebar"><section className="side-card players-card"><div className="side-title"><h3><Users size={17} /> Players</h3><span>{players.length}/6</span></div>{players.map((player, index) => { const properties = Object.entries(owned).filter(([, ownerId]) => Number(ownerId) === player.id); return <div className={`player-group ${state.turn === index ? 'active-player' : ''}`} key={player.id}><div className="player-row"><div className="avatar" style={{ background: colors[player.seat] }}>{player.token}</div><div className="player-detail"><strong>{player.name} {player.id === playerId && <small>YOU</small>}</strong><span>{properties.length} {properties.length === 1 ? 'property' : 'properties'}</span></div><strong className="cash">{money(player.cash)}</strong></div></div>; })}</section><section className="side-card"><div className="side-title"><h3><ShieldCheck size={17} /> Turn overview</h3><span className="turn-pill">TURN {state.turn + 1}</span></div><div className="turn-box"><div className="turn-avatar" style={{ background: colors[active.seat] }}>{active.token}</div><div><small>IT&apos;S {active.name.toUpperCase()}&apos;S TURN</small><strong>{rolled ? 'Choose an action' : 'Roll the dice to begin'}</strong><span>{players.length < 2 ? 'Waiting for another player to join this room.' : rolled ? 'Buy the space or finish your turn.' : 'The dice decide your next move.'}</span></div></div></section></aside></div>
        <footer><span>© 2026 Monopoly Bangladesh · Fan-made prototype</span><span>Not affiliated with Hasbro or Richup.io</span></footer>
    </main>;
}
