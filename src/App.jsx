import { useEffect, useMemo, useState } from 'react';
import {
  Bell, Bookmark, Camera, ChevronDown, Compass, Home, ImagePlus, LogOut,
  Menu, MessageCircle, MoreHorizontal, Search, Send, Settings, ShieldCheck,
  ThumbsUp, Users, Video, Globe2, Plus, X, Heart, UserRound, LayoutGrid
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from './supabase';

const demoPosts = [
  {
    id: 'demo-1', author: 'Rafi Hasan', handle: '@rafihasan', initials: 'RH',
    time: '12 min ago', audience: 'Public',
    text: 'Welcome to Rafi Book! 🎉 A new place to connect with friends, share your moments, and build communities. What would you like to share today?',
    image: null, likes: 24, comments: 8, liked: false,
  },
  {
    id: 'demo-2', author: 'Nadia Rahman', handle: '@nadiar', initials: 'NR',
    time: '38 min ago', audience: 'Public',
    text: 'A little reminder: every new connection can lead to something wonderful. Say hello to someone new today! 💙',
    image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80',
    likes: 41, comments: 12, liked: false,
  },
];
const stories = [
  { name: 'Your story', initials: '+', color: 'add', caption: 'Add to story' },
  { name: 'Nadia', initials: 'N', color: 'pink', caption: 'Weekend vibes' },
  { name: 'Sakib', initials: 'S', color: 'blue', caption: 'At the lake' },
  { name: 'Maya', initials: 'M', color: 'orange', caption: 'Good morning' },
  { name: 'Tanvir', initials: 'T', color: 'green', caption: 'New memories' },
];

function Avatar({ initials = 'RB', color = '' }) {
  return <div className={`avatar ${color}`}>{initials}</div>;
}

function AuthPanel({ onClose }) {
  const [mode, setMode] = useState('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(e) {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setMessage('Connect your Supabase project first. See README.md for setup steps.');
      return;
    }
    setBusy(true); setMessage('');
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name } }
        });
        if (error) throw error;
        setMessage('Account request sent. Check your email if email confirmation is enabled.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose();
      }
    } catch (err) { setMessage(err.message || 'Something went wrong.'); }
    finally { setBusy(false); }
  }
  return <div className="modal-backdrop" onClick={onClose}>
    <div className="auth-modal" onClick={e => e.stopPropagation()}>
      <button className="icon-btn modal-close" onClick={onClose} aria-label="Close"><X size={20}/></button>
      <div className="brand-mark large">r</div>
      <h2>{mode === 'signup' ? 'Join Rafi Book' : 'Welcome back'}</h2>
      <p className="muted">Connect with people and communities that matter.</p>
      <div className="auth-switch">
        <button className={mode === 'signup' ? 'selected' : ''} onClick={() => {setMode('signup');setMessage('')}}>Create account</button>
        <button className={mode === 'login' ? 'selected' : ''} onClick={() => {setMode('login');setMessage('')}}>Log in</button>
      </div>
      <form onSubmit={submit} className="auth-form">
        {mode === 'signup' && <label>Full name<input value={name} onChange={e=>setName(e.target.value)} required placeholder="Your name"/></label>}
        <label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com"/></label>
        <label>Password<input type="password" minLength="6" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="At least 6 characters"/></label>
        <button className="primary-btn full" disabled={busy}>{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Log in'}</button>
      </form>
      {message && <div className="notice">{message}</div>}
      {!isSupabaseConfigured && <p className="small-note">Preview mode: authentication becomes active after Supabase setup.</p>}
    </div>
  </div>;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState(demoPosts);
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState('');
  const [activeTab, setActiveTab] = useState('Home');
  const [authOpen, setAuthOpen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [posting, setPosting] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});
  const [comments, setComments] = useState({});
  const [likedPosts, setLikedPosts] = useState({});
  const [showComments, setShowComments] = useState({});
  const [groups, setGroups] = useState([
    { name: 'Creators & Designers', members: '2.4k members', icon: '🎨' },
    { name: 'Tech Community', members: '1.8k members', icon: '💻' },
    { name: 'Photography Club', members: '960 members', icon: '📷' },
  ]);
  const [pages, setPages] = useState([
    { name: 'Rafi Book Community', category: 'Community', icon: '📘' },
    { name: 'Daily Inspiration', category: 'Digital creator', icon: '✨' },
  ]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let alive = true;
    supabase.auth.getSession().then(({ data }) => { if (alive) setUser(data.session?.user ?? null); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => { alive = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      .then(({ data }) => { if (data) setProfile(data); });
    loadPosts();
  }, [user]);

  async function loadPosts() {
    if (!isSupabaseConfigured) return;
    const { data, error } = await supabase.from('posts')
      .select('id, content, image_url, created_at, user_id, profiles(full_name, username, avatar_url)')
      .order('created_at', { ascending: false }).limit(50);
    if (!error && data) {
      setPosts(data.map(p => ({
        id: p.id, author: p.profiles?.full_name || p.profiles?.username || 'Rafi Book member',
        handle: p.profiles?.username ? `@${p.profiles.username}` : '@member',
        initials: (p.profiles?.full_name || 'RB').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase(),
        time: new Date(p.created_at).toLocaleString(), audience: 'Public',
        text: p.content, image: p.image_url, likes: 0, comments: 0, liked: false, user_id: p.user_id
      })));
    }
  }

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Rafi Book member';
  const initials = displayName.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase() || 'RB';
  const filteredPosts = useMemo(() => posts.filter(p =>
    !search || `${p.author} ${p.text}`.toLowerCase().includes(search.toLowerCase())
  ), [posts, search]);

  async function publishPost(e) {
    e.preventDefault();
    if (!postText.trim() && !postImage) return;
    if (!user || !isSupabaseConfigured) {
      setNotice('Sign in and connect Supabase to publish posts that persist online.');
      setAuthOpen(true); return;
    }
    setPosting(true);
    const { error } = await supabase.from('posts').insert({
      user_id: user.id, content: postText.trim(), image_url: postImage || null
    });
    setPosting(false);
    if (error) { setNotice(error.message); return; }
    setPostText(''); setPostImage(''); setNotice('Your post was published.'); loadPosts();
  }

  function toggleLike(post) {
    setLikedPosts(prev => ({ ...prev, [post.id]: !prev[post.id] }));
    if (!user || !isSupabaseConfigured) setNotice('Likes in preview mode are temporary. Sign in to use the connected community.');
  }
  function addComment(postId) {
    const value = (commentInputs[postId] || '').trim();
    if (!value) return;
    setComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), value] }));
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    setShowComments(prev => ({ ...prev, [postId]: true }));
  }
  async function logout() {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    setUser(null); setProfile(null); setNotice('You have logged out.');
  }
  function createCommunity(kind) {
    const value = window.prompt(`Enter a name for your new ${kind.toLowerCase()}:`);
    if (!value?.trim()) return;
    if (kind === 'Group') setGroups(prev => [{ name: value.trim(), members: 'You are the first member', icon: '👥' }, ...prev]);
    else setPages(prev => [{ name: value.trim(), category: 'New page', icon: '📘' }, ...prev]);
    setNotice(`${kind} created in this preview. Connect the database to save it permanently.`);
  }

  const navItems = [
    { label: 'Home', icon: Home }, { label: 'Friends', icon: Users },
    { label: 'Groups', icon: LayoutGrid }, { label: 'Pages', icon: Globe2 },
    { label: 'Videos', icon: Video }, { label: 'Saved', icon: Bookmark },
  ];
  return <div className="app-shell">
    <header className="topbar">
      <div className="top-left">
        <button className="icon-btn mobile-only" onClick={()=>setShowMobileMenu(v=>!v)} aria-label="Menu"><Menu/></button>
        <a className="brand" href="#" onClick={e=>{e.preventDefault();setActiveTab('Home')}}><span className="brand-mark">r</span><span>rafi<span className="brand-book">book</span></span></a>
        <div className="search-box"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search Rafi Book"/></div>
      </div>
      <nav className="top-nav">
        <button className={activeTab==='Home'?'top-nav-item active':''} onClick={()=>setActiveTab('Home')} title="Home"><Home/></button>
        <button className={activeTab==='Friends'?'top-nav-item active':''} onClick={()=>setActiveTab('Friends')} title="Friends"><Users/></button>
        <button className={activeTab==='Groups'?'top-nav-item active':''} onClick={()=>setActiveTab('Groups')} title="Groups"><LayoutGrid/></button>
        <button className={activeTab==='Videos'?'top-nav-item active':''} onClick={()=>setActiveTab('Videos')} title="Videos"><Video/></button>
      </nav>
      <div className="top-right">
        <button className="round-action" title="Menu" onClick={()=>setActiveTab('Explore')}><LayoutGrid size={20}/></button>
        <button className="round-action notification" title="Notifications" onClick={()=>setNotice('You are all caught up!')}><Bell size={20}/></button>
        {user ? <button className="user-chip" onClick={logout}><Avatar initials={initials}/><span className="user-chip-name">{displayName.split(' ')[0]}</span><LogOut size={15}/></button> :
          <button className="primary-btn sign-in-top" onClick={()=>setAuthOpen(true)}>Log in</button>}
      </div>
    </header>

    <div className="layout">
      <aside className={`left-sidebar ${showMobileMenu?'mobile-open':''}`}>
        <button className={`side-link ${activeTab==='Home'?'selected':''}`} onClick={()=>setActiveTab('Home')}><Avatar initials={initials}/><span>{user ? displayName : 'Welcome to Rafi Book'}</span></button>
        {navItems.map(({label,icon:Icon})=><button key={label} className={`side-link ${activeTab===label?'selected':''}`} onClick={()=>setActiveTab(label)}><span className="side-icon"><Icon size={21}/></span><span>{label}</span></button>)}
        <div className="sidebar-divider"/>
        <div className="sidebar-heading">Your shortcuts <button className="text-action" onClick={()=>createCommunity('Group')}>Edit</button></div>
        {groups.slice(0,3).map(g=><button className="side-link compact" key={g.name} onClick={()=>setActiveTab('Groups')}><span className="shortcut-icon">{g.icon}</span><span>{g.name}</span></button>)}
        <div className="sidebar-foot">Privacy · Terms · Help · Cookies<br/>Rafi Book © 2026</div>
      </aside>

      <main className="feed">
        {notice && <div className="notice-bar"><span>{notice}</span><button onClick={()=>setNotice('')}><X size={16}/></button></div>}
        {activeTab === 'Home' || activeTab === 'Explore' ? <>
          <section className="stories">
            {stories.map((s,i)=><button className="story-card" key={s.name} onClick={()=>i===0 ? (user ? setNotice('Story upload can be enabled with Storage setup.') : setAuthOpen(true)) : setNotice(`${s.name}'s story preview`)}>
              <div className={`story-art ${s.color}`}>{i===0 ? <Avatar initials={initials}/> : <span>{s.initials}</span>}</div>
              {i===0 && <span className="story-plus"><Plus size={16}/></span>}
              <span className="story-name">{s.name}</span>
            </button>)}
          </section>

          <section className="composer card">
            <div className="composer-top"><Avatar initials={initials}/><button className="composer-input" onClick={()=>!user && setAuthOpen(true)}>{user ? `What's on your mind, ${displayName.split(' ')[0]}?` : "What's on your mind?"}</button></div>
            <form onSubmit={publishPost}>
              <textarea value={postText} onChange={e=>setPostText(e.target.value)} placeholder={user ? `Share something with your community, ${displayName.split(' ')[0]}…` : 'Write a post (sign in to publish)…'} rows="2"/>
              <div className="composer-attachment">
                <button type="button" onClick={()=>{const u=window.prompt('Paste an image URL (file upload can be configured with Supabase Storage):');if(u)setPostImage(u)}}><ImagePlus size={20} className="green"/> <span>Photo</span></button>
                <button type="button" onClick={()=>setNotice('Video uploads can be connected using Supabase Storage.')}><Video size={20} className="red"/> <span>Video</span></button>
                <button type="button" onClick={()=>setNotice('Feeling/activity picker is a future enhancement.')}><Heart size={20} className="orange"/> <span>Feeling</span></button>
                <button className="primary-btn post-btn" disabled={posting}>{posting?'Posting…':'Post'}</button>
              </div>
              {postImage && <div className="image-preview"><img src={postImage} alt="Selected post"/><button type="button" onClick={()=>setPostImage('')}><X size={16}/></button></div>}
            </form>
          </section>

          {!user && <section className="welcome-banner"><div><div className="eyebrow">YOUR PEOPLE. YOUR COMMUNITY.</div><h2>Make room for more connections.</h2><p>Join Rafi Book to share moments, meet friends, and discover groups.</p><button className="primary-btn" onClick={()=>setAuthOpen(true)}>Join Rafi Book <ChevronDown size={16}/></button></div><div className="banner-art"><div className="bubble bubble-one">👋</div><div className="bubble bubble-two">💙</div><div className="banner-orbit"><Users size={52}/></div></div></section>}

          {filteredPosts.map(post=>{
            const liked = likedPosts[post.id] ?? post.liked;
            const postComments = comments[post.id] || [];
            return <article className="post card" key={post.id}>
              <div className="post-header"><Avatar initials={post.initials}/><div className="post-author"><strong>{post.author}</strong><span>{post.time} · <Globe2 size={12}/></span></div><button className="icon-btn post-more" aria-label="More options" onClick={()=>setNotice('Post options: report, save, or hide can be connected to your account.')}><MoreHorizontal/></button></div>
              <p className="post-text">{post.text}</p>
              {post.image && <img className="post-image" src={post.image} alt="Post attachment" loading="lazy"/>}
              <div className="post-stats"><span><span className="like-bubble"><ThumbsUp size={11}/></span> {post.likes + (liked && !post.liked ? 1 : 0)} likes</span><button onClick={()=>setShowComments(p=>({...p,[post.id]:!p[post.id]}))}>{post.comments + postComments.length} comments</button></div>
              <div className="post-actions"><button className={liked?'liked':''} onClick={()=>toggleLike(post)}><ThumbsUp size={19}/><span>Like</span></button><button onClick={()=>setShowComments(p=>({...p,[post.id]:!p[post.id]}))}><MessageCircle size={19}/><span>Comment</span></button><button onClick={()=>{if(navigator.share)navigator.share({title:'Rafi Book',text:post.text}).catch(()=>{});else setNotice('Copy this post link from your browser to share it.')}}><Send size={18}/><span>Share</span></button></div>
              {showComments[post.id] && <div className="comments-area">
                {postComments.map((c,i)=><div className="comment" key={i}><Avatar initials={initials}/><div><strong>{displayName}</strong><p>{c}</p></div></div>)}
                <form className="comment-form" onSubmit={e=>{e.preventDefault();addComment(post.id)}}><Avatar initials={initials}/><input value={commentInputs[post.id]||''} onChange={e=>setCommentInputs(p=>({...p,[post.id]:e.target.value}))} placeholder="Write a comment…"/><button aria-label="Send comment"><Send size={17}/></button></form>
              </div>}
            </article>;
          })}
          {filteredPosts.length===0 && <div className="empty card"><Search size={28}/><h3>No posts found</h3><p>Try a different search term.</p></div>}
        </> : activeTab === 'Groups' ? <section className="section-page card">
          <div className="section-title-row"><div><span className="eyebrow">FIND YOUR PEOPLE</span><h1>Groups</h1><p className="muted">Communities built around the things you love.</p></div><button className="primary-btn" onClick={()=>createCommunity('Group')}><Plus size={17}/> Create group</button></div>
          <div className="community-grid">{groups.map((g,i)=><div className="community-card" key={g.name}><div className={`community-cover cover-${i%3}`}>{g.icon}</div><h3>{g.name}</h3><p>{g.members}</p><button className="secondary-btn" onClick={()=>setNotice(`You selected ${g.name}. Group membership needs a connected database.`)}>View group</button></div>)}</div>
        </section> : activeTab === 'Pages' ? <section className="section-page card">
          <div className="section-title-row"><div><span className="eyebrow">SHARE YOUR PASSION</span><h1>Pages</h1><p className="muted">Follow creators, businesses, and communities.</p></div><button className="primary-btn" onClick={()=>createCommunity('Page')}><Plus size={17}/> Create page</button></div>
          {pages.map(p=><div className="page-row" key={p.name}><div className="page-icon">{p.icon}</div><div className="page-info"><strong>{p.name}</strong><span>{p.category}</span></div><button className="secondary-btn" onClick={()=>setNotice(`You selected ${p.name}. Page following needs a connected database.`)}>View page</button></div>)}
        </section> : activeTab === 'Friends' ? <section className="section-page card"><div className="eyebrow">STAY CONNECTED</div><h1>Friends</h1><p className="muted">Your friend list and friend requests will appear here after you connect the database.</p><div className="empty-state"><Users size={38}/><h3>Find your people</h3><p>Sign in to start building your community.</p><button className="primary-btn" onClick={()=>setAuthOpen(true)}>Get started</button></div></section>
        : activeTab === 'Videos' ? <section className="section-page card"><div className="eyebrow">WATCH & DISCOVER</div><h1>Videos</h1><p className="muted">A space for clips and stories from your community.</p><div className="empty-state"><Video size={38}/><h3>Video feed is ready for integration</h3><p>Connect file storage and video processing to enable uploads.</p></div></section>
        : <section className="section-page card"><h1>{activeTab}</h1><p className="muted">This section is part of the Rafi Book starter interface and can be connected to your database.</p></section>}
        <footer className="mobile-footer">Rafi Book · Connect with your community</footer>
      </main>

      <aside className="right-sidebar">
        <div className="right-heading"><h3>Suggested for you</h3><button className="icon-btn" onClick={()=>setNotice('Suggestions refreshed.')}><MoreHorizontal size={19}/></button></div>
        <div className="suggestion"><Avatar initials="SA" color="blue"/><div className="suggestion-info"><strong>Sami Ahmed</strong><span>12 mutual friends</span><button onClick={()=>setNotice('Sign in to send a friend request.')}>Add friend</button></div></div>
        <div className="suggestion"><Avatar initials="TM" color="pink"/><div className="suggestion-info"><strong>Tasnim Mim</strong><span>8 mutual friends</span><button onClick={()=>setNotice('Sign in to send a friend request.')}>Add friend</button></div></div>
        <div className="sidebar-divider"/>
        <div className="right-heading"><h3>Trending groups</h3><button className="text-action" onClick={()=>setActiveTab('Groups')}>See all</button></div>
        {groups.slice(0,2).map(g=><button className="trending-group" key={g.name} onClick={()=>setActiveTab('Groups')}><span className="trending-emoji">{g.icon}</span><span><strong>{g.name}</strong><small>{g.members}</small></span></button>)}
        <div className="right-promo"><ShieldCheck size={19}/><div><strong>Your community, your rules</strong><p>Use block, report, and privacy tools to help keep Rafi Book welcoming.</p></div></div>
        <div className="sidebar-foot">Privacy · Terms · About · Help<br/>Rafi Book © 2026</div>
      </aside>
    </div>
    {authOpen && <AuthPanel onClose={()=>setAuthOpen(false)}/>}
  </div>;
}