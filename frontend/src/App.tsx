import { useEffect, useMemo, useState } from 'react';
import { Dice5, Plus, Users, Copy, ArrowRight, Landmark, Sparkles, RotateCcw, Coins, Trophy, MapPin, ShieldCheck, LogOut } from 'lucide-react';

type Space = { name:string; type:'start'|'property'|'tax'|'chance'|'jail'|'rail'|'utility'|'free'|'gotojail'; price?:number; rent?:number; group?:string; color?:string; detail?:string };
type Player = { id:number; name:string; token:string; cash:number; pos:number; color:string; out?:boolean };

const spaces:Space[] = [
{name:'GO • Collect ৳200',type:'start',detail:'Start your business journey'},
{name:'Old Dhaka',type:'property',price:600,rent:40,group:'Heritage',color:'#b87952'},
{name:'Community Chest',type:'chance'},
{name:'Lalbagh Fort',type:'property',price:600,rent:50,group:'Heritage',color:'#b87952'},
{name:'Income Tax',type:'tax',price:200},
{name:'Dhaka Metro',type:'rail',price:200,rent:50},
{name:'Sylhet Tea Gardens',type:'property',price:1000,rent:80,group:'Nature',color:'#8aa96b'},
{name:'Chance',type:'chance'},
{name:'Jaflong',type:'property',price:1000,rent:80,group:'Nature',color:'#8aa96b'},
{name:'Ratargul Swamp Forest',type:'property',price:1200,rent:100,group:'Nature',color:'#8aa96b'},
{name:'Jail / Just Visiting',type:'jail'},
{name:'Rajshahi Silk',type:'property',price:1400,rent:120,group:'Tradition',color:'#b98bd1'},
{name:'Power Utility',type:'utility',price:150,rent:40},
{name:'Paharpur',type:'property',price:1400,rent:120,group:'Tradition',color:'#b98bd1'},
{name:'Mahasthangarh',type:'property',price:1600,rent:140,group:'Tradition',color:'#b98bd1'},
{name:'Chattogram Port',type:'rail',price:200,rent:50},
{name:"Cox's Bazar",type:'property',price:1800,rent:160,group:'Coastal',color:'#e6a34a'},
{name:'Community Chest',type:'chance'},
{name:"Saint Martin's Island",type:'property',price:1800,rent:160,group:'Coastal',color:'#e6a34a'},
{name:'Inani Beach',type:'property',price:2000,rent:180,group:'Coastal',color:'#e6a34a'},
{name:'Free Parking',type:'free'},
{name:'Sundarbans',type:'property',price:2200,rent:200,group:'Wild Bangladesh',color:'#4f9b84'},
{name:'Chance',type:'chance'},
{name:'Kuakata',type:'property',price:2200,rent:200,group:'Wild Bangladesh',color:'#4f9b84'},
{name:'Padma Bridge',type:'property',price:2400,rent:220,group:'Wild Bangladesh',color:'#4f9b84'},
{name:'Padma Rail Link',type:'rail',price:200,rent:50},
{name:'National Parliament',type:'property',price:2600,rent:240,group:'Capital',color:'#6e8ed6'},
{name:'Jamuna Bridge',type:'property',price:2600,rent:240,group:'Capital',color:'#6e8ed6'},
{name:'Water Utility',type:'utility',price:150,rent:40},
{name:'National Museum',type:'property',price:2800,rent:260,group:'Capital',color:'#6e8ed6'},
{name:'Go to Jail',type:'gotojail'},
{name:'Kaptai Lake',type:'property',price:3000,rent:280,group:'Hill Tracts',color:'#7b91a6'},
{name:'Bandarban Hills',type:'property',price:3000,rent:280,group:'Hill Tracts',color:'#7b91a6'},
{name:'Community Chest',type:'chance'},
{name:'Rangamati',type:'property',price:3200,rent:300,group:'Hill Tracts',color:'#7b91a6'},
{name:'Mongla Port',type:'rail',price:200,rent:50},
{name:'Bashundhara City',type:'property',price:3500,rent:350,group:'Commerce',color:'#d66d84'},
{name:'Luxury Tax',type:'tax',price:100},
{name:'Jamuna Future Park',type:'property',price:4000,rent:400,group:'Commerce',color:'#d66d84'},
{name:'Finish • Collect ৳200',type:'start',detail:'Complete a lap'}
];

const initialPlayers:Player[]=[];
const SESSION_KEY='monopoly-bangladesh-session-v1';
type SavedSession={players:Player[];turn:number;owned:Record<number,number>;dice:[number,number];rolled:boolean;feed:string[];room:string;joined:boolean;roomName:string;page:'landing'|'game';playerId:number};
const API_BASE=(import.meta.env.VITE_API_BASE_URL||'http://127.0.0.1:8000/api/v1').replace(/\/$/,'');

async function api(path:string, options:RequestInit={}){
  const res=await fetch(`${API_BASE}${path}`,{...options,headers:{'Content-Type':'application/json',Accept:'application/json',...(options.headers||{})}});
  const body=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(body.message||Object.values(body.errors||{}).flat().join(' ')||`API request failed (${res.status})`);
  return body.data;
}

function readSession():Partial<SavedSession>{
  try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'{}') as Partial<SavedSession>}catch{return {}}
}

const money=(n:number)=>'৳'+n.toLocaleString('en-BD');

function LandingPage({playerName,setPlayerName,joinCode,setJoinCode,error,setError,apiBusy,onHost,onJoin,step,setStep}:any){
  return <main className="app landing-app">
    <header className="landing-header">
      <div className="brand">
        <div className="brandmark"><Landmark size={24}/></div>
        <div>
          <strong>MONOPOLY <span>BANGLADESH</span></strong>
          <small>Own the places. Shape the nation.</small>
        </div>
      </div>
    </header>

    <section className="landing-container">
      {step==='name' && (
        <div className="landing-card name-card">
          <div className="card-icon"><Users size={32}/></div>
          <h1>Welcome to Monopoly Bangladesh</h1>
          <p>Build your property empire across iconic Bangladesh landmarks</p>

          <div className="form-group">
            <label>What's your name?</label>
            <input
              type="text"
              value={playerName}
              onChange={e=>{setPlayerName(e.target.value);setError('')}}
              placeholder="Enter your name"
              maxLength={24}
              autoFocus
              onKeyPress={(e)=>e.key==='Enter'&&playerName.trim()&&setStep('mode')}
            />
          </div>

          {error&&<p className="error-message">{error}</p>}

          <button
            className="btn btn-primary"
            onClick={()=>{
              if(!playerName.trim()){setError('Please enter your name');return;}
              setStep('mode');
            }}
            disabled={!playerName.trim()||apiBusy}
          >
            Continue <ArrowRight size={16}/>
          </button>

          <p className="landing-note">
            <ShieldCheck size={14}/>
            <span>Private game for friends. No sign-up required.</span>
          </p>
        </div>
      )}

      {step==='mode' && (
        <div className="landing-card mode-card">
          <div className="card-header">
            <button className="back-btn" onClick={()=>setStep('name')}><ArrowRight size={16}/></button>
            <h2>Ready to play, <strong>{playerName}</strong>?</h2>
            <p>Choose how you want to join</p>
          </div>

          <div className="mode-options">
            <div className="mode-option host-option" onClick={()=>setStep('host')}>
              <div className="option-icon"><Plus size={24}/></div>
              <strong>Host a game</strong>
              <span>Create a private room and invite friends</span>
              <div className="option-arrow"><ArrowRight size={18}/></div>
            </div>

            <div className="mode-option join-option" onClick={()=>setStep('join')}>
              <div className="option-icon"><Users size={24}/></div>
              <strong>Join a game</strong>
              <span>Enter a room code from your friend</span>
              <div className="option-arrow"><ArrowRight size={18}/></div>
            </div>
          </div>

          <button className="btn btn-secondary" onClick={()=>setStep('name')}>
            <ArrowRight size={14}/> Back
          </button>
        </div>
      )}

      {step==='host' && (
        <div className="landing-card host-card">
          <div className="card-header">
            <button className="back-btn" onClick={()=>setStep('mode')}><ArrowRight size={16}/></button>
            <h2>Create your table</h2>
            <p>{playerName}'s gaming room</p>
          </div>

          <div className="form-group">
            <label>Room name (optional)</label>
            <input
              type="text"
              placeholder="e.g. Friday Night Game"
              maxLength={50}
              onKeyPress={(e)=>e.key==='Enter'&&onHost()}
            />
          </div>

          {error&&<p className="error-message">{error}</p>}

          <button
            className="btn btn-primary"
            onClick={onHost}
            disabled={apiBusy}
          >
            {apiBusy?'Creating...':'Create room'} <ArrowRight size={16}/>
          </button>

          <button className="btn btn-secondary" onClick={()=>setStep('mode')}>
            Cancel
          </button>
        </div>
      )}

      {step==='join' && (
        <div className="landing-card join-card">
          <div className="card-header">
            <button className="back-btn" onClick={()=>setStep('mode')}><ArrowRight size={16}/></button>
            <h2>Join a game</h2>
            <p>Enter your friend's room code</p>
          </div>

          <div className="form-group">
            <label>Room code</label>
            <input
              type="text"
              value={joinCode}
              onChange={e=>{setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8));setError('')}}
              placeholder="e.g. DHAKA7"
              maxLength={8}
              autoFocus
              onKeyPress={(e)=>e.key==='Enter'&&joinCode.length>=4&&onJoin()}
            />
            <small>Your friend will share this code after creating a room</small>
          </div>

          {error&&<p className="error-message">{error}</p>}

          <button
            className="btn btn-primary"
            onClick={onJoin}
            disabled={apiBusy||joinCode.length<4}
          >
            {apiBusy?'Joining...':'Join room'} <ArrowRight size={16}/>
          </button>

          <button className="btn btn-secondary" onClick={()=>setStep('mode')}>
            Cancel
          </button>
        </div>
      )}
    </section>

    <footer className="landing-footer">
      <span>© 2026 Monopoly Bangladesh · Fan-made prototype</span>
      <span>Not affiliated with Hasbro</span>
    </footer>
  </main>;
}

export default function App(){
 const [restored] = useState<Partial<SavedSession>>(()=>readSession());
 const [playerId,setPlayerId]=useState<number>(restored.playerId||0);
 const [apiBusy,setApiBusy]=useState(false);
 const [players,setPlayers]=useState<Player[]>(restored.players ?? initialPlayers);
 const [turn,setTurn]=useState(restored.turn ?? 0);
 const [owned,setOwned]=useState<Record<number,number>>(restored.owned ?? {});
 const [dice,setDice]=useState<[number,number]>(restored.dice ?? [1,1]);
 const [rolled,setRolled]=useState(restored.rolled ?? false);
 const [feed,setFeed]=useState<string[]>(restored.feed ?? ['Welcome to Monopoly Bangladesh!','Waiting for real players to join.']);
 const [room,setRoom]=useState(restored.room ?? '');
 const [joined,setJoined]=useState(restored.joined ?? false);
 const [roomName,setRoomName]=useState(restored.roomName ?? '');
 const [copied,setCopied]=useState(false);
 const [page,setPage]=useState<'landing'|'game'>(restored.page ?? 'landing');
 const [playerName,setPlayerName]=useState('');
 const [joinCode,setJoinCode]=useState('');
 const [error,setError]=useState('');
 const [landingStep,setLandingStep]=useState<'name'|'mode'|'host'|'join'>('name');

 useEffect(()=>{const snapshot:SavedSession={players,turn,owned,dice,rolled,feed,room,joined,roomName,page,playerId};try{localStorage.setItem(SESSION_KEY,JSON.stringify(snapshot))}catch{/* storage may be unavailable */}},[players,turn,owned,dice,rolled,feed,room,joined,roomName,page,playerId]);

 const active=players[turn%Math.max(players.length,1)] ?? {id:0,name:'Waiting for player',token:'🎲',cash:0,pos:0,color:'#65d6a5'};
 const current=spaces[active.pos];
 const yourPlayer=players.find(p=>p.id===playerId) ?? players[0];
 const push=(s:string)=>setFeed(f=>[s,...f].slice(0,6));

 function applyRoom(data:any){
   const r=data.room||data;
   const state=r.state||{};
   const mapped=(r.players||[]).map((p:any,i:number)=>({id:Number(p.id),name:p.name,token:p.token||'🎲',cash:Number(p.cash),pos:Number(p.position??p.pos??0),color:['#65d6a5','#f2b35e','#83a7ff','#d68ee8','#f08080','#73c7d9'][Number(p.seat??i)%6]} as Player));
   setPlayers(mapped);
   setRoom(r.code||room);
   setRoomName(r.name||'Friends Table');
   setTurn(Number(state.turn||0));
   setOwned(state.properties||{});
   setDice(state.dice||[1,1]);
   setRolled(!!state.dice);
   setJoined(true);
   setPage('game');
 }

 useEffect(()=>{if(!joined||!room||!playerId)return;let alive=true;const sync=()=>api(`/rooms/${encodeURIComponent(room)}`).then((r:any)=>{if(alive)applyRoom(r)}).catch(()=>{});sync();const id=window.setInterval(sync,1800);return()=>{alive=false;window.clearInterval(id)}},[joined,room,playerId]);

 async function sendAction(type:'start'|'roll'|'buy'|'end_turn'){
   if(!playerId||!room)return;
   setApiBusy(true);
   try{
     const data=await api(`/rooms/${encodeURIComponent(room)}/actions`,{method:'POST',body:JSON.stringify({player_id:playerId,type,space_id:active.pos})});
     applyRoom(data);
     setError('')
   }catch(e){
     setError(e instanceof Error?e.message:'Could not update the game.')
   }finally{
     setApiBusy(false)
   }
 }

 function roll(){if(players.length<2||rolled||apiBusy)return;void sendAction('roll')}
 function buy(){if(players.length<2||!rolled||apiBusy)return;void sendAction('buy')}
 function endTurn(){if(players.length<2||apiBusy)return;void sendAction('end_turn')}
 const board=useMemo(()=>spaces.map((s,i)=>({s,i})),[]);

 async function hostGame(){
   const name=playerName.trim();
   if(!name){setError('Enter your name before hosting a game.');return;}
   setApiBusy(true);
   try{
     const data=await api('/rooms',{method:'POST',body:JSON.stringify({name:`${name}'s Table`,player_name:name})});
     const r=data.room||data;
     const me=(r.players||[])[0];
     if(!me)throw new Error('The API created a room but returned no host player.');
     setPlayerId(Number(me.id));
     applyRoom(r);
     setFeed([`${name} created room ${r.code}.`,'Waiting for another human player.']);
     setError('')
   }catch(e){
     setError(`${e instanceof Error?e.message:'Could not create room'}. Check that Laravel is running and VITE_API_BASE_URL points to its API.`)
   }finally{
     setApiBusy(false)
   }
 }

 async function joinGame(){
   const name=playerName.trim();
   const code=joinCode.trim().toUpperCase();
   if(!name){setError('Enter your name before joining a game.');return;}
   if(code.length<4){setError('Enter a valid room code.');return;}
   setApiBusy(true);
   try{
     const data=await api('/rooms/join',{method:'POST',body:JSON.stringify({code,player_name:name})});
     const r=data.room||data;
     const me=data.player||(r.players||[]).find((p:any)=>p.name===name);
     if(!me)throw new Error('Joined room but could not identify your player.');
     setPlayerId(Number(me.id));
     applyRoom(r);
     setFeed([`Joined room ${r.code}.`]);
     setError('')
   }catch(e){
     setError(e instanceof Error?e.message:'Could not join room. Check the code and backend.')
   }finally{
     setApiBusy(false)
   }
 }

 function leaveGame(){
   if(!playerId||!room)return;
   setApiBusy(true);
   api(`/rooms/${encodeURIComponent(room)}/actions`,{method:'POST',body:JSON.stringify({player_id:playerId,type:'leave'})}).then(()=>{
     localStorage.removeItem(SESSION_KEY);
     setPage('landing');
     setPlayerId(0);
     setJoined(false);
     setRoom('');
     setRoomName('');
     setJoinCode('');
     setLandingStep('name');
     setPlayers([]);
     setTurn(0);
     setOwned({});
     setDice([1,1]);
     setRolled(false);
     setFeed(['Welcome to Monopoly Bangladesh!','Waiting for real players to join.']);
     setError('');
     setApiBusy(false);
   }).catch((e)=>{
     setError(e instanceof Error?e.message:'Could not leave game.');
     setApiBusy(false);
   });
 }

 if(page==='landing') return <LandingPage playerName={playerName} setPlayerName={setPlayerName} joinCode={joinCode} setJoinCode={setJoinCode} error={error} setError={setError} apiBusy={apiBusy} onHost={hostGame} onJoin={joinGame} step={landingStep} setStep={setLandingStep}/>;

 return <main className="app"><header className="topbar"><div className="brand"><div className="brandmark"><Landmark size={22}/></div><div><strong>MONOPOLY <span>BANGLADESH</span></strong><small>Own the places. Shape the nation.</small></div></div><div className="top-actions"><span className="online"><i/> Online room</span><button className="ghost" onClick={leaveGame}><LogOut size={16}/> Leave Game</button></div></header>
 <section className="hero"><div><div className="eyebrow"><Sparkles size={14}/> A LOCAL TWIST ON A CLASSIC</div><h1>Build your <em>Bangladesh</em><br/>property empire.</h1><p>From the streets of Old Dhaka to the shores of Cox's Bazar, every roll is a new opportunity.</p></div><div className="hero-stat"><div className="stat-icon"><Trophy size={20}/></div><div><small>YOUR BALANCE</small><strong>{money(yourPlayer?.cash||0)}</strong><span>Starting capital: ৳1,500</span></div></div></section>
 <div className="layout"><aside className="left-rail">
  <div className="rail-brand"><div className="brandmark"><Landmark size={21}/></div><div><strong>MONOPOLY <span>BANGLADESH</span></strong><small>Own the places. Shape the nation.</small></div></div>
  <section className="side-card room-card"><div className="side-title"><h3><Users size={17}/> Game room</h3><span className="room-live"><i/> LIVE</span></div><strong className="rail-room-name">{roomName}</strong><button className="share rail-share" onClick={()=>{navigator.clipboard?.writeText(room);setCopied(true);setTimeout(()=>setCopied(false),1800)}}><Copy size={14}/>{copied?'Copied!':`Room code: ${room}`}</button></section>
  <section className="side-card rail-tip"><Sparkles size={17}/><div><strong>Build your empire</strong><p>Roll, invest in Bangladesh's landmarks, and collect rent from your rivals.</p></div></section>
 </aside><section className="game-panel"><div className="panel-head"><div><span className="eyebrow">PRIVATE TABLE</span><h2>{roomName}</h2></div><button className="share" onClick={()=>{navigator.clipboard?.writeText(room);setCopied(true);setTimeout(()=>setCopied(false),1800)}}><Copy size={15}/>{copied?'Copied!':room}</button></div>
 <div className="board-wrap"><div className="board">
 {board.map(({s,i})=><div key={i} className={`space pos-${i} ${i>=1&&i<=9?'side-bottom':i>=11&&i<=19?'side-left':i>=21&&i<=29?'side-top':i>=31&&i<=39?'side-right':'corner'} ${s.type} ${yourPlayer?.pos===i?'is-you-here':''} ${active.pos===i?'is-turn-location':''}`} style={{'--group':s.color||'#b8c2d1'} as React.CSSProperties} title={s.name} aria-label={`${s.name}${players.some(p=>p.pos===i)?'; players: '+players.filter(p=>p.pos===i).map(p=>p.name).join(', '):''}${yourPlayer?.pos===i?'; your location':''}`}><div className="space-color"/><span className="space-icon">{s.type==='start'?'✦':s.type==='rail'?'🚆':s.type==='tax'?'৳':s.type==='chance'?'?':s.type==='jail'?'🔒':s.type==='free'?'🅿':s.type==='gotojail'?'🚔':s.type==='utility'?'⚡':'◆'}</span><span className="space-name">{s.name}</span>{s.price&&<b>{money(s.price)}</b>}{Object.entries(owned).some(([k])=>Number(k)===i)&&<span className="owner-dot" style={{background:players.find(p=>p.id===owned[i])?.color}}/>}{players.some(p=>p.pos===i)&&<div className="space-tokens">{players.filter(p=>p.pos===i).map(p=><span className={`token ${p.id===playerId?'token-you':''} ${p.id===active.id?'token-turn':''}`} key={p.id} style={{'--token-color':p.color} as React.CSSProperties} title={`${p.name}${p.id===playerId?' (you)':''}${p.id===active.id?' — current turn':''}`}><span className="token-glyph">{p.token}</span></span>)}</div>}</div>)}
 <div className="board-center">
   <div className="center-topline"><span className="bd-mark">🇧🇩</span><span>PRIVATE GAME</span><span className="center-live"><i/> LIVE</span></div>
   <div className="center-heading"><strong>PROPERTY</strong><b>EXCHANGE</b><small>BANGLADESH EDITION</small></div>
   <div className="center-location"><MapPin size={12}/><span>{current.name}</span><b>{rolled?'MOVE COMPLETE':'YOUR NEXT MOVE'}</b></div>
   <div className="game-controls board-controls">
    <div className="dice-area"><div className="dice-pair"><div className="die">{dice[0]}</div><div className="die">{dice[1]}</div></div><div><strong>{dice[0]+dice[1]} <small>total</small></strong><span>{rolled?'Move complete':'Roll to move'}</span></div></div>
    <div className="control-buttons"><button className="secondary" onClick={roll} disabled={players.length<2||rolled||apiBusy}><Dice5 size={17}/> Roll dice</button><button className="primary" onClick={buy} disabled={players.length<2||!rolled||apiBusy||!['property','rail','utility'].includes(current.type)||!!owned[active.pos]||active.cash<(current.price||0)}><Coins size={17}/> Buy property</button><button className="dark" onClick={endTurn} disabled={players.length<2||!rolled||apiBusy}>End turn <ArrowRight size={16}/></button></div>
   </div>
 <div className="landed-card info-landed-card"><div className="landed-symbol" style={{background:current.color||'#dbe6f4'}}><MapPin size={22}/></div><div className="landed-info"><small>LANDED ON</small><strong>{current.name}</strong><span>{current.detail||current.group||({tax:'Pay the listed tax',chance:'Draw a surprise card',rail:'Transport network',utility:'Public utility',free:'Take a breather',jail:'Just visiting',gotojail:'Go directly to jail'} as Record<string,string>)[current.type]||'A place to invest'}</span></div><div className="landed-price">{current.price?<><small>PRICE</small><strong>{money(current.price)}</strong></>:<><small>SPACE TYPE</small><strong>{current.type.toUpperCase()}</strong></>}</div></div>
  </div>
 </div></div>
 </section>
 <aside className="sidebar"><section className="side-card players-card"><div className="side-title"><h3><Users size={17}/> Players</h3><span>{players.length}/6</span></div>{players.map((p,i)=>{const playerProperties=Object.entries(owned).filter(([,ownerId])=>ownerId===p.id).map(([position])=>({space:spaces[Number(position)],position:Number(position)}));return <div className={`player-group ${turn===i?'active-player':''}`} key={p.id}><div className="player-row"><div className="avatar" style={{background:p.color}}>{p.token}</div><div className="player-detail"><strong>{p.name} {p.id===1&&<small>YOU</small>}</strong><span>{playerProperties.length} {playerProperties.length===1?'property':'properties'}</span></div><strong className="cash">{money(p.cash)}</strong></div><div className="owned-property-list">{playerProperties.length?playerProperties.map(({space,position})=><div className="owned-property" key={position}><span className="owned-color" style={{background:space.color||(space.type==='rail'?'#9aaabd':space.type==='utility'?'#4e9ca7':'#8996a8')}}/><span className="owned-name">{space.name}</span><strong>{money(space.price||0)}</strong></div>):<div className="no-properties">No properties owned yet</div>}</div></div>})}</section>
 <section className="side-card"><div className="side-title"><h3><ShieldCheck size={17}/> Turn overview</h3><span className="turn-pill">TURN {turn+1}</span></div><div className="turn-box"><div className="turn-avatar" style={{background:active.color}}>{active.token}</div><div><small>IT'S {active.name.toUpperCase()}'S TURN</small><strong>{rolled?'Choose an action':'Roll the dice to begin'}</strong><span>{players.length<2?'Waiting for another human player to join this room.':rolled?'Buy the space or finish your turn.':'The dice decide your next move.'}</span></div></div><div className="turn-steps"><span className={rolled?'done':''}>1. Roll dice</span><span className={rolled?'current-step':''}>2. Buy or pay rent</span><span>3. End turn</span></div></section>
 <section className="side-card activity"><div className="side-title"><h3><RotateCcw size={17}/> Game activity</h3><span>LIVE FEED</span></div>{feed.map((f,i)=><div className="feed-item" key={i}><i className={i===0?'feed-dot gold':'feed-dot'}/><span>{f}</span></div>)}</section>
 <section className="side-card leave-card"><button className="btn-leave" onClick={leaveGame}><LogOut size={16}/> Leave Game</button><small>Abandon this room and return to lobby</small></section>

 </aside></div>
 <footer><span>© 2026 Monopoly Bangladesh · Fan-made prototype</span><span>Not affiliated with Hasbro or Richup.io</span></footer>
 </main>
}
