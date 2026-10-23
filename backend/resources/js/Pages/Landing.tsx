import { useForm } from '@inertiajs/react';
import { ArrowRight, Landmark, Plus, ShieldCheck, Users } from 'lucide-react';
import { useState } from 'react';

type Step = 'name' | 'mode' | 'host' | 'join';

interface RoomForm {
    name: string;
    player_name: string;
}

interface JoinForm {
    code: string;
    player_name: string;
}

export default function Landing() {
    const [step, setStep] = useState<Step>('name');
    const [playerName, setPlayerName] = useState('');
    const roomForm = useForm<RoomForm>({ name: '', player_name: '' });
    const joinForm = useForm<JoinForm>({ code: '', player_name: '' });
    const processing = roomForm.processing || joinForm.processing;

    const goToMode = (): void => {
        if (playerName.trim().length < 2) {
            roomForm.setError('player_name', 'Enter a name with at least two characters.');

            return;
        }

        roomForm.clearErrors();
        setStep('mode');
    };

    const createRoom = (): void => {
        roomForm.transform((data) => ({
            ...data,
            name: data.name.trim() || `${playerName.trim()}'s Table`,
            player_name: playerName.trim(),
        }));
        roomForm.post('/rooms');
    };

    const joinRoom = (): void => {
        joinForm.transform((data) => ({
            ...data,
            code: data.code.trim().toUpperCase(),
            player_name: playerName.trim(),
        }));
        joinForm.post('/rooms/join');
    };

    return (
        <main className="app landing-app">
            <header className="landing-header">
                <div className="brand">
                    <div className="brandmark"><Landmark size={24} /></div>
                    <div>
                        <strong>MONOPOLY <span>BANGLADESH</span></strong>
                        <small>Own the places. Shape the nation.</small>
                    </div>
                </div>
            </header>

            <section className="landing-container">
                {step === 'name' && (
                    <div className="landing-card name-card">
                        <div className="card-icon"><Users size={32} /></div>
                        <h1>Welcome to Monopoly Bangladesh</h1>
                        <p>Build your property empire across iconic Bangladesh landmarks</p>
                        <div className="form-group">
                            <label htmlFor="player-name">What&apos;s your name?</label>
                            <input
                                id="player-name"
                                value={playerName}
                                onChange={(event) => setPlayerName(event.target.value)}
                                onKeyDown={(event) => event.key === 'Enter' && goToMode()}
                                placeholder="Enter your name"
                                maxLength={24}
                                autoFocus
                            />
                        </div>
                        {roomForm.errors.player_name && <p className="error-message">{roomForm.errors.player_name}</p>}
                        <button className="btn btn-primary" onClick={goToMode} disabled={processing}>
                            Continue <ArrowRight size={16} />
                        </button>
                        <p className="landing-note"><ShieldCheck size={14} /><span>Private game for friends. No sign-up required.</span></p>
                    </div>
                )}

                {step === 'mode' && (
                    <div className="landing-card mode-card">
                        <div className="card-header"><h2>Ready to play, <strong>{playerName}</strong>?</h2><p>Choose how you want to join</p></div>
                        <div className="mode-options">
                            <button className="mode-option host-option" onClick={() => setStep('host')}><span className="option-icon"><Plus size={24} /></span><strong>Host a game</strong><span>Create a private room and invite friends</span><span className="option-arrow"><ArrowRight size={18} /></span></button>
                            <button className="mode-option join-option" onClick={() => setStep('join')}><span className="option-icon"><Users size={24} /></span><strong>Join a game</strong><span>Enter a room code from your friend</span><span className="option-arrow"><ArrowRight size={18} /></span></button>
                        </div>
                        <button className="btn btn-secondary" onClick={() => setStep('name')}>Back</button>
                    </div>
                )}

                {step === 'host' && (
                    <div className="landing-card host-card">
                        <div className="card-header"><h2>Create your table</h2><p>{playerName}&apos;s gaming room</p></div>
                        <div className="form-group">
                            <label htmlFor="room-name">Room name (optional)</label>
                            <input id="room-name" value={roomForm.data.name} onChange={(event) => roomForm.setData('name', event.target.value)} onKeyDown={(event) => event.key === 'Enter' && createRoom()} placeholder="e.g. Friday Night Game" maxLength={50} />
                        </div>
                        {roomForm.errors.name && <p className="error-message">{roomForm.errors.name}</p>}
                        <button className="btn btn-primary" onClick={createRoom} disabled={processing}>Create room <ArrowRight size={16} /></button>
                        <button className="btn btn-secondary" onClick={() => setStep('mode')}>Cancel</button>
                    </div>
                )}

                {step === 'join' && (
                    <div className="landing-card join-card">
                        <div className="card-header"><h2>Join a game</h2><p>Enter your friend&apos;s room code</p></div>
                        <div className="form-group">
                            <label htmlFor="room-code">Room code</label>
                            <input id="room-code" value={joinForm.data.code} onChange={(event) => joinForm.setData('code', event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))} onKeyDown={(event) => event.key === 'Enter' && joinRoom()} placeholder="e.g. DHAKA7" maxLength={6} autoFocus />
                        </div>
                        {joinForm.errors.code && <p className="error-message">{joinForm.errors.code}</p>}
                        <button className="btn btn-primary" onClick={joinRoom} disabled={processing || joinForm.data.code.length !== 6}>Join room <ArrowRight size={16} /></button>
                        <button className="btn btn-secondary" onClick={() => setStep('mode')}>Cancel</button>
                    </div>
                )}
            </section>

            <footer className="landing-footer"><span>© 2026 Monopoly Bangladesh · Fan-made prototype</span><span>Not affiliated with Hasbro</span></footer>
        </main>
    );
}
