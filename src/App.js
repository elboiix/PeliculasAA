import React, { useState, useEffect, useRef, useCallback } from "react";
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  deleteDoc,
  doc,
} from "firebase/firestore";
import {
  Search,
  Plus,
  CheckCircle,
  XCircle,
  Star,
  Trash2,
  Film,
  Play,
  X,
  SlidersHorizontal,
} from "lucide-react";

// ─── Firebase ────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBRJ8vOWMBsAH7eHrhwtOxtaV-FbCXsgig",
  authDomain: "peliculasaa-b2b11.firebaseapp.com",
  projectId: "peliculasaa-b2b11",
  storageBucket: "peliculasaa-b2b11.firebasestorage.app",
  messagingSenderId: "669967101232",
  appId: "1:669967101232:web:e9dcc3d1192e9345f1ecf5",
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

const appId = typeof __app_id !== "undefined" ? __app_id : "movie-tracker-app";
const TMDB_API_KEY = "6cdf90295efe0b46dab69de0e13f1762";

// ─── Config ──────────────────────────────────────────────────────────────────
const platforms = [
  { id: "netflix", name: "Netflix", color: "#E50914", text: "#fff" },
  { id: "prime", name: "Prime Video", color: "#00A8E1", text: "#fff" },
  { id: "disney", name: "Disney+", color: "#1133A6", text: "#fff" },
  { id: "hbo", name: "HBO Max", color: "#5822B4", text: "#fff" },
  { id: "cinema", name: "Cine", color: "#00D2FF", text: "#060814" },
  { id: "other", name: "Otros", color: "#4A4860", text: "#fff" },
];

const statusConfig = {
  completed: { label: "Completada", color: "#4ade80", icon: CheckCircle },
  watching: { label: "A medias", color: "#facc15", icon: Play },
  dropped: { label: "Abandonada", color: "#f87171", icon: XCircle },
};

// ─── Styles (Nueva paleta basada en tu logo) ──────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&family=Cormorant+Garamond:ital,wght@0,300;1,300;1,400&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .aa-app {
    --accent:#00D2FF; --gold:#A855F7; --bg:#060814; --bg-2:#0B0E1F; --bg-3:#121731;
    --border:rgba(255,255,255,0.06); --border-h:rgba(0,210,255,0.25);
    --txt-1:#F1F5F9; --txt-2:#94A3B8; --txt-3:#475569;
    --r-sm:8px; --r-md:14px; --r-lg:22px;
    font-family:'Outfit',sans-serif; background:var(--bg); color:var(--txt-1);
    min-height:100vh; overflow-x:hidden;
  }
  .aa-app ::-webkit-scrollbar{width:3px}
  .aa-app ::-webkit-scrollbar-thumb{background:var(--accent);border-radius:2px}

  .aa-grain{pointer-events:none;position:fixed;inset:0;z-index:9999;opacity:.02;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E");
    background-repeat:repeat;}

  /* ── Hero ── */
  .aa-hero {
    position:relative; min-height:64vh;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    padding:5rem 1.5rem 5rem;
  }
  .aa-hero-bg {
    position:absolute; inset:0; overflow:hidden; pointer-events:none; z-index:0;
  }
  .aa-hero-orb {
    position:absolute; border-radius:50%; filter:blur(90px);
    will-change:transform; transition:transform .15s ease-out;
  }
  .aa-hero-orb-1{width:600px;height:600px;background:radial-gradient(circle,rgba(0,210,255,.14) 0%,transparent 70%);top:-100px;left:-100px;}
  .aa-hero-orb-2{width:500px;height:500px;background:radial-gradient(circle,rgba(168,85,247,.12) 0%,transparent 70%);top:0;right:-100px;}
  .aa-hero-orb-3{width:350px;height:350px;background:radial-gradient(circle,rgba(99,102,241,.08) 0%,transparent 70%);bottom:-80px;left:30%;}
  .aa-filmstrip{position:absolute;top:0;bottom:0;width:28px;display:flex;flex-direction:column;gap:8px;padding:10px 0;opacity:.05;}
  .aa-filmstrip-hole{width:16px;height:12px;border-radius:3px;background:white;margin:0 auto;}
  .aa-hero-monogram{
    font-family:'Bebas Neue',sans-serif;
    font-size:clamp(10rem,28vw,22rem); line-height:.8; letter-spacing:-.02em;
    position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
    color:transparent; -webkit-text-stroke:1px rgba(255,255,255,.03);
    user-select:none; white-space:nowrap; will-change:transform;
    transition:transform .12s ease-out;
  }

  .aa-hero-content{position:relative;z-index:2;text-align:center;}
  .aa-hero-eyebrow{
    font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:300;
    font-size:clamp(.9rem,2.5vw,1.15rem);letter-spacing:.55em;color:var(--accent);
    text-transform:uppercase;margin-bottom:1.2rem;
    opacity:0;animation:aa-up .9s .1s cubic-bezier(.23,1,.32,1) forwards;
  }
  .aa-hero-title{
    font-family:'Bebas Neue',sans-serif;font-size:clamp(4rem,12vw,9.5rem);
    letter-spacing:.1em;line-height:.88;
    background:linear-gradient(135deg,#FFFFFF 20%,#A855F7 55%,#00D2FF 100%);
    -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
    will-change:transform;transition:transform .1s ease-out;
    opacity:0;animation:aa-up .9s .25s cubic-bezier(.23,1,.32,1) forwards;
  }
  .aa-hero-subtitle{
    font-family:'Cormorant Garamond',serif;font-style:italic;
    font-size:clamp(1rem,2.8vw,1.3rem);letter-spacing:.3em;color:rgba(241,245,249,.45);
    margin-top:1.4rem;opacity:0;animation:aa-up .9s .4s cubic-bezier(.23,1,.32,1) forwards;
  }
  .aa-hero-stats{
    display:flex;gap:3rem;margin-top:2.5rem; justify-content:center;
    opacity:0;animation:aa-up .9s .55s cubic-bezier(.23,1,.32,1) forwards;
  }
  .aa-hero-stat-num{font-family:'Bebas Neue',sans-serif;font-size:2.2rem;letter-spacing:.05em;line-height:1; color:var(--txt-1);}
  .aa-hero-stat-lbl{font-size:.65rem;letter-spacing:.3em;text-transform:uppercase;color:var(--txt-3);margin-top:.2rem;}
  .aa-stat-div{width:1px;background:rgba(255,255,255,.08);}

  /* ── Search ── */
  .aa-search-wrap{
    position:relative;width:100%;max-width:620px;padding:0 1.5rem;
    margin-top:2.5rem;z-index:900;
    opacity:0;animation:aa-up .9s .7s cubic-bezier(.23,1,.32,1) forwards;
  }
  .aa-search-input{
    width:100%;background:rgba(255,255,255,.03);border:1px solid var(--border);
    border-radius:100px;padding:1.05rem 1.5rem 1.05rem 3.2rem;
    color:var(--txt-1);font-family:'Outfit',sans-serif;font-size:1rem;outline:none;
    transition:all .35s cubic-bezier(.23,1,.32,1);backdrop-filter:blur(12px);
  }
  .aa-search-input::placeholder{color:var(--txt-3);}
  .aa-search-input:focus{
    border-color:rgba(0,210,255,.5);background:rgba(0,210,255,.02);
    box-shadow:0 0 0 4px rgba(0,210,255,.06),0 20px 40px rgba(0,0,0,.4);
  }
  .aa-search-icon{position:absolute;left:2.6rem;top:28px;transform:translateY(-50%);color:var(--txt-3);width:18px;height:18px;pointer-events:none;}
  .aa-spinner{position:absolute;right:2.6rem;top:28px;transform:translateY(-50%);width:18px;height:18px;border:2px solid rgba(0,210,255,.15);border-top-color:var(--accent);border-radius:50%;animation:aa-spin .7s linear infinite;}

  .aa-search-results{
    position:absolute;
    top: calc(100% + 8px);
    left: 1.5rem;
    right: 1.5rem;
    background:var(--bg-2);border:1px solid var(--border);border-radius:var(--r-md);
    overflow:hidden;box-shadow:0 30px 60px rgba(0,0,0,.8),0 0 0 1px rgba(0,210,255,.1);
    backdrop-filter:blur(24px);animation:aa-drop .25s cubic-bezier(.23,1,.32,1) forwards;
    z-index:500;max-height:360px;overflow-y:auto;
  }
  @keyframes aa-drop{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}

  .aa-result-item{display:flex;align-items:center;gap:1rem;padding:.85rem 1.2rem;cursor:pointer;border-bottom:1px solid var(--border);transition:background .2s;}
  .aa-result-item:last-child{border-bottom:none;}
  .aa-result-item:hover{background:rgba(255,255,255,.03);}
  .aa-result-poster{width:40px;height:56px;border-radius:6px;background:var(--bg-3);overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;}
  .aa-result-poster img{width:100%;height:100%;object-fit:cover;}
  .aa-result-title{font-weight:500;font-size:.95rem;color:var(--txt-1);}
  .aa-result-meta{font-size:.75rem;color:var(--txt-2);margin-top:2px;display:flex;gap:.5rem;align-items:center;}
  .aa-type-badge{font-size:.6rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;padding:2px 8px;border-radius:100px;background:rgba(0,210,255,.1);color:var(--accent);border:1px solid rgba(0,210,255,.25);}

  /* ── Rule ── */
  .aa-rule{display:flex;align-items:center;gap:1.2rem;color:var(--txt-3);font-size:.6rem;letter-spacing:.35em;text-transform:uppercase;padding:0 1.5rem;max-width:1300px;margin:0 auto;}
  .aa-rule::before,.aa-rule::after{content:'';flex:1;height:1px;background:linear-gradient(to right,transparent,var(--border),transparent);}

  /* ── Filters ── */
  .aa-filters{
    max-width:1300px;margin:2rem auto 1rem;padding:0 1.5rem;
    display:flex;align-items:center;gap:1rem;flex-wrap:wrap;
    opacity:0;animation:aa-up .8s .9s cubic-bezier(.23,1,.32,1) forwards;
    position:relative;z-index:400;
  }
  .aa-filter-label{font-size:.7rem;letter-spacing:.25em;text-transform:uppercase;color:var(--txt-3);display:flex;align-items:center;gap:6px;margin-right:.5rem;}
  .aa-count-badge{margin-left:auto;font-size:.7rem;letter-spacing:.15em;color:var(--txt-3);}
  .aa-count-badge span{color:var(--txt-1);font-weight:600;}

  /* ── Grid ── */
  .aa-grid{max-width:1300px;margin:0 auto;padding:1rem 1.5rem 5rem;display:grid;grid-template-columns:repeat(auto-fill,minmax(175px,1fr));gap:1.25rem;position:relative;z-index:1;}

  /* ── Card ── */
  .aa-card{
    position:relative;border-radius:var(--r-md);overflow:hidden;
    background:var(--bg-3);cursor:pointer;transform-style:preserve-3d;
    will-change:transform;transition:box-shadow .4s ease;
    aspect-ratio:2/3;border:1px solid var(--border);
    opacity:0;animation:aa-card-in .6s cubic-bezier(.23,1,.32,1) both;
    display:flex;flex-direction:column;
  }
  .aa-card:hover{border-color:rgba(0,210,255,.3);box-shadow:0 30px 60px rgba(0,0,0,.6),0 0 0 1px rgba(0,210,255,.2);}
  .aa-card-img-wrap{flex:1;overflow:hidden;position:relative;}
  .aa-card-img-wrap img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .5s cubic-bezier(.23,1,.32,1);}
  .aa-card:hover .aa-card-img-wrap img{transform:scale(1.04);}
  .aa-card-no-poster{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.75rem;color:var(--txt-3);padding:1.5rem;text-align:center;font-size:.8rem;background:linear-gradient(135deg,var(--bg-3) 0%,var(--bg-2) 100%);}

  .aa-card-shine{position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.04) 0%,transparent 50%,rgba(255,255,255,.01) 100%);opacity:0;transition:opacity .3s;pointer-events:none;z-index:2;}
  .aa-card:hover .aa-card-shine{opacity:1;}

  /* Top badges */
  .aa-platform-badge{position:absolute;top:.6rem;right:.6rem;font-size:.55rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:.25rem .55rem;border-radius:100px;backdrop-filter:blur(8px);z-index:4;border:1px solid rgba(255,255,255,.1);}
  .aa-status-badge{position:absolute;top:.6rem;left:.6rem;width:28px;height:28px;border-radius:50%;background:rgba(6,8,20,.8);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:4;border:1px solid rgba(255,255,255,.06);}

  /* Hover overlay */
  .aa-card-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(6,8,20,.98) 0%,rgba(6,8,20,.6) 45%,transparent 75%);opacity:0;transition:opacity .35s ease;z-index:3;display:flex;flex-direction:column;justify-content:flex-end;padding:.9rem;}
  .aa-card:hover .aa-card-overlay{opacity:1;}
  .aa-card-title{font-weight:600;font-size:.85rem;line-height:1.3;color:var(--txt-1);margin-bottom:.3rem;}
  .aa-card-meta{font-size:.68rem;color:var(--txt-2);display:flex;align-items:center;gap:.35rem;margin-bottom:.55rem;}
  .aa-dot{display:inline-block;width:3px;height:3px;border-radius:50%;background:var(--txt-3);vertical-align:middle;}

  .aa-card-ratings{display:flex;flex-direction:column;gap:4px;}
  .aa-card-rating-row{display:flex;align-items:center;gap:5px;font-size:.68rem;}
  .aa-card-rating-who{color:var(--txt-2);width:42px;font-size:.6rem;letter-spacing:.05em;}
  .aa-card-rating-stars{display:flex;gap:2px;}

  .aa-card-delete{
    position:absolute;bottom:.6rem;right:.6rem;
    width:26px;height:26px;border-radius:50%;
    background:rgba(6,8,20,.8);border:1px solid rgba(0,210,255,.25);
    color:rgba(0,210,255,.6);display:flex;align-items:center;justify-content:center;
    cursor:pointer;z-index:6;transition:all .2s;backdrop-filter:blur(6px);
  }
  .aa-card-delete:hover{background:var(--accent);color:#060814;border-color:var(--accent);transform:scale(1.1);}

  /* ── Empty ── */
  .aa-empty{grid-column:1/-1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;padding:6rem 2rem;color:var(--txt-3);text-align:center;border:1px dashed rgba(255,255,255,.05);border-radius:var(--r-lg);}
  .aa-empty h3{font-size:1.1rem;color:var(--txt-2);font-weight:500;}

  /* ── Modal ── */
  .aa-modal-backdrop{
    position:fixed;inset:0;background:rgba(2,3,6,.92);backdrop-filter:blur(24px);
    -webkit-backdrop-filter:blur(24px); z-index:1000;
    display:flex;align-items:center;justify-content:center;padding:1.5rem;animation:aa-fade .3s ease;
  }
  .aa-modal{background:var(--bg-2);border:1px solid var(--border);border-radius:24px;width:100%;max-width:780px;max-height:90vh;overflow:hidden;display:flex;animation:aa-modal-in .45s cubic-bezier(.23,1,.32,1);box-shadow:0 60px 120px rgba(0,0,0,.9),0 0 0 1px rgba(0,210,255,.1);position:relative;}
  .aa-modal-poster{width:240px;flex-shrink:0;position:relative;overflow:hidden;display:none;}
  @media(min-width:600px){.aa-modal-poster{display:block;}}
  .aa-modal-poster img{width:100%;height:100%;object-fit:cover;}
  .aa-modal-poster-overlay{position:absolute;inset:0;background:linear-gradient(to right,transparent 60%,var(--bg-2) 100%),linear-gradient(to top,rgba(6,8,20,.6) 0%,transparent 40%);}
  .aa-modal-body{flex:1;padding:2rem;overflow-y:auto;display:flex;flex-direction:column;}
  .aa-modal-title{font-family:'Bebas Neue',sans-serif;font-size:2rem;letter-spacing:.06em;line-height:1;color:var(--txt-1);margin-bottom:.35rem;}
  .aa-modal-year{font-size:.8rem;color:var(--txt-3);letter-spacing:.2em;margin-bottom:1.8rem;}
  .aa-modal-section{margin-bottom:1.5rem;}
  .aa-modal-lbl{font-size:.65rem;letter-spacing:.3em;text-transform:uppercase;color:var(--txt-3);margin-bottom:.7rem;}

  .aa-platform-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;}
  .aa-platform-btn{display:inline-flex !important;align-items:center;justify-content:center;gap:6px;padding:.55rem .5rem;border-radius:12px !important;border:1px solid var(--border);background:transparent;color:var(--txt-2);font-family:'Outfit',sans-serif;font-size:.75rem;font-weight:500;cursor:pointer;transition:all .2s;text-align:center;}
  .aa-platform-btn:hover{border-color:var(--border-h);color:var(--txt-1);}
  .aa-platform-btn.active{border-color:transparent!important;font-weight:600;}

  .aa-status-grid{display:flex;gap:.5rem;}
  .aa-status-btn{flex:1;padding:.6rem .5rem;border-radius:12px !important;border:1px solid var(--border);background:transparent;color:var(--txt-2);font-family:'Outfit',sans-serif;font-size:.75rem;font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;transition:all .2s;}
  .aa-status-btn.active-completed{background:rgba(74,222,128,.08);border-color:rgba(74,222,128,.3);color:#4ade80;}
  .aa-status-btn.active-watching{background:rgba(250,204,21,.08);border-color:rgba(250,204,21,.3);color:#facc15;}
  .aa-status-btn.active-dropped{background:rgba(248,113,113,.08);border-color:rgba(248,113,113,.3);color:#f87171;}

  .aa-rating-row{display:flex;align-items:center;gap:.75rem;margin-bottom:.6rem;}
  .aa-rating-who{font-size:.72rem;letter-spacing:.08em;color:var(--txt-2);width:52px;flex-shrink:0;}
  .aa-stars{display:flex;gap:5px;}
  .aa-star-btn{background:none;border:none;cursor:pointer;padding:2px;transition:transform .2s cubic-bezier(.23,1,.32,1);color:var(--txt-3);}
  .aa-star-btn:hover{transform:scale(1.35);}
  .aa-star-btn.filled{filter:drop-shadow(0 0 6px currentColor);}

  .aa-modal-footer{margin-top:auto;padding-top:1.5rem;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:.75rem;}
  .aa-btn-ghost{background:none;border:1px solid var(--border);color:var(--txt-2);font-family:'Outfit',sans-serif;font-size:.9rem;padding:.65rem 1.4rem;border-radius:100px;cursor:pointer;transition:all .2s;}
  .aa-btn-ghost:hover{border-color:var(--border-h);color:var(--txt-1);}
  .aa-btn-primary{background:var(--accent);border:none;color:#060814;font-family:'Outfit',sans-serif;font-size:.9rem;font-weight:600;padding:.65rem 1.6rem;border-radius:100px;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all .2s cubic-bezier(.23,1,.32,1);box-shadow:0 8px 24px rgba(0,210,255,.3);}
  .aa-btn-primary:hover{background:#33dfff;transform:translateY(-1px);box-shadow:0 12px 32px rgba(0,210,255,.45);}
  .aa-modal-close{position:absolute;top:1rem;right:1rem;width:32px;height:32px;border-radius:50%;border:1px solid var(--border);background:rgba(255,255,255,.03);color:var(--txt-2);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;z-index:10;}
  .aa-modal-close:hover{background:rgba(255,255,255,.06);color:var(--txt-1);}

  .aa-loading{display:flex;align-items:center;justify-content:center;height:50vh;grid-column:1/-1;}
  .aa-loading-ring{width:48px;height:48px;border:3px solid rgba(0,210,255,.1);border-top-color:var(--accent);border-radius:50%;animation:aa-spin .8s linear infinite;}

  /* ── Desplegables Premium Personalizados ── */
  .aa-custom-dropdown {
    position: relative;
    min-width: 195px;
    user-select: none;
  }
  .aa-dropdown-trigger {
    width: 100%;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border);
    border-radius: 100px;
    color: var(--txt-2);
    font-family: 'Outfit', sans-serif;
    font-size: .8rem;
    padding: .5rem 1.1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    outline: none;
    transition: all .2s ease;
    backdrop-filter: blur(12px);
  }
  .aa-dropdown-trigger:hover, .aa-dropdown-trigger.open {
    border-color: var(--border-h);
    color: var(--txt-1);
    background: rgba(255, 255, 255, 0.06);
  }
  .aa-dropdown-trigger-content {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .aa-dropdown-chevron {
    font-size: .55rem;
    color: var(--txt-3);
    transition: transform 0.2s ease;
  }
  .aa-dropdown-menu {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    background: var(--bg-2);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0,0,0,.7), 0 0 0 1px rgba(255, 255, 255, 0.01);
    backdrop-filter: blur(20px);
    z-index: 1000;
    padding: 5px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .aa-dropdown-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: .55rem .8rem;
    font-size: .8rem;
    color: var(--txt-2);
    cursor: pointer;
    border-radius: 10px;
    transition: all .2s ease;
  }
  .aa-dropdown-item:hover {
    background: rgba(255, 255, 255, 0.04);
    color: var(--txt-1);
  }
  .aa-dropdown-item.selected {
    background: rgba(0, 210, 255, 0.08);
    color: var(--accent);
    font-weight: 600;
  }
  .aa-mini-logo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    font-size: 10px;
    font-weight: 900;
    flex-shrink: 0;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  }
  .aa-mini-logo.all-platforms {
    background: rgba(255, 255, 255, 0.06);
    color: var(--txt-2);
  }

  /* ── FIX MÓVIL ── */
  @media (max-width: 480px) {
    .aa-hero-stats { gap: 1.2rem; }
    .aa-hero-stat-num { font-size: 1.5rem; }
    .aa-hero-stat-lbl { font-size: .55rem; letter-spacing: .15em; }
    .aa-filters { gap: .6rem; }
    .aa-custom-dropdown { min-width: 0; flex: 1 1 calc(50% - .3rem); }
  }

  @keyframes aa-up{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
  @keyframes aa-card-in{from{opacity:0;transform:translateY(32px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
  @keyframes aa-modal-in{from{opacity:0;transform:scale(.93) translateY(24px)}to{opacity:1;transform:scale(1) translateY(0)}}
  @keyframes aa-fade{from{opacity:0}to{opacity:1}}
  @keyframes aa-spin{to{transform:rotate(360deg)}}
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getPosterUrl = (p) => {
  if (!p) return null;
  if (p.startsWith("http")) return p;
  return `https://image.tmdb.org/t/p/w500${p}`;
};
const getPlatform = (id) => platforms.find((p) => p.id === id) || platforms[5];

function StyleInjector() {
  useEffect(() => {
    const el = document.createElement("style");
    el.id = "aa-styles";
    el.textContent = STYLES;
    if (!document.getElementById("aa-styles")) document.head.appendChild(el);
    return () => el.remove();
  }, []);
  return null;
}

function FilmStrip({ side }) {
  return (
    <div className="aa-filmstrip" style={{ [side]: 0 }}>
      {Array.from({ length: 30 }).map((_, i) => (
        <div key={i} className="aa-filmstrip-hole" />
      ))}
    </div>
  );
}

function StarRow({ value, color }) {
  return (
    <div className="aa-card-rating-stars">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={10}
          fill={s <= value ? color : "none"}
          color={s <= value ? color : "var(--txt-3)"}
        />
      ))}
    </div>
  );
}

function StarPicker({ value, onChange, color }) {
  return (
    <div className="aa-stars" style={{ color: color }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          className={`aa-star-btn ${s <= value ? "filled" : ""}`}
          onClick={() => onChange(s)}
          style={{ color: s <= value ? color : "var(--txt-3)" }}
        >
          <Star
            size={24}
            fill={s <= value ? color : "none"}
            color={s <= value ? color : "var(--txt-3)"}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Componente Desplegable Personalizado ────────────────────────────────────
function CustomDropdown({ value, onChange, options, type = "generic" }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const selectedOption = options.find((opt) => opt.id === value);

  const renderIcon = (opt) => {
    if (type === "platform") {
      if (opt.id === "all")
        return (
          <span className="aa-mini-logo all-platforms">
            <Film size={11} />
          </span>
        );
      const initial =
        opt.id === "netflix"
          ? "N"
          : opt.id === "prime"
          ? "P"
          : opt.id === "disney"
          ? "D"
          : opt.id === "hbo"
          ? "H"
          : opt.id === "cinema"
          ? "C"
          : "O";
      return (
        <span
          className="aa-mini-logo"
          style={{ background: opt.color, color: opt.text }}
        >
          {initial}
        </span>
      );
    }
    if (type === "status") {
      if (opt.icon) {
        const Icon = opt.icon;
        return <Icon size={13} color={opt.color || "var(--txt-2)"} />;
      }
    }
    return null;
  };
  return (
    <div className="aa-custom-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className={`aa-dropdown-trigger ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="aa-dropdown-trigger-content">
          {selectedOption && (
            <>
              {renderIcon(selectedOption)}
              <span>{selectedOption.name || selectedOption.label}</span>
            </>
          )}
        </div>
        <span
          className="aa-dropdown-chevron"
          style={{ transform: isOpen ? "rotate(180deg)" : "none" }}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="aa-dropdown-menu">
          {options.map((opt) => (
            <div
              key={opt.id}
              className={`aa-dropdown-item ${
                value === opt.id ? "selected" : ""
              }`}
              onClick={() => {
                onChange(opt.id);
                setIsOpen(false);
              }}
            >
              {renderIcon(opt)}
              <span>{opt.name || opt.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Movie Card ───────────────────────────────────────────────────────────────
function MovieCard({ entry, onDelete, index }) {
  const cardRef = useRef(null);
  const platform = getPlatform(entry.platform);
  const status = statusConfig[entry.status] || statusConfig.completed;
  const StatusIcon = status.icon;
  const handleMouseMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(900px) rotateY(${x * 14}deg) rotateX(${
      -y * 14
    }deg) scale(1.03)`;
  }, []);
  const handleMouseLeave = useCallback(() => {
    if (cardRef.current) {
      cardRef.current.style.transition =
        "transform .5s cubic-bezier(.23,1,.32,1)";
      cardRef.current.style.transform =
        "perspective(900px) rotateY(0deg) rotateX(0deg) scale(1)";
    }
  }, []);
  const handleMouseEnter = useCallback(() => {
    if (cardRef.current)
      cardRef.current.style.transition = "transform .1s ease-out";
  }, []);
  const rA = entry.ratingAdrian || 0;
  const rB = entry.ratingAndrea || 0;
  return (
    <div
      ref={cardRef}
      className="aa-card"
      style={{ animationDelay: `${Math.min(index * 0.06, 1.2)}s` }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
    >
      <div
        className="aa-card-img-wrap"
        style={{ position: "relative", flex: 1 }}
      >
        {entry.posterPath ? (
          <img
            src={getPosterUrl(entry.posterPath)}
            alt={entry.title}
            loading="lazy"
          />
        ) : (
          <div className="aa-card-no-poster">
            <Film size={28} />
            <span>{entry.title}</span>
          </div>
        )}
      </div>

      <div className="aa-card-shine" />

      <div
        className="aa-platform-badge"
        style={{ background: platform.color, color: platform.text }}
      >
        {platform.name}
      </div>

      <div className="aa-status-badge">
        <StatusIcon size={13} color={status.color} />
      </div>

      <div className="aa-card-overlay">
        <div className="aa-card-title">{entry.title}</div>
        <div className="aa-card-meta">
          <span>{entry.type === "movie" ? "Película" : "Serie"}</span>
          {entry.releaseDate && (
            <>
              <span className="aa-dot" />
              <span>{entry.releaseDate.split("-")[0]}</span>
            </>
          )}
        </div>
        {(rA > 0 || rB > 0) && (
          <div className="aa-card-ratings">
            {rA > 0 && (
              <div className="aa-card-rating-row">
                <span className="aa-card-rating-who">Adrián</span>
                <StarRow value={rA} color="#00D2FF" />
              </div>
            )}
            {rB > 0 && (
              <div className="aa-card-rating-row">
                <span className="aa-card-rating-who">Andrea</span>
                <StarRow value={rB} color="#A855F7" />
              </div>
            )}
          </div>
        )}
      </div>

      <button
        className="aa-card-delete"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(entry.id);
        }}
        title="Eliminar"
      >
        <Trash2 size={11} />
      </button>
    </div>
  );
}

// ─── Add Modal ────────────────────────────────────────────────────────────────
function AddModal({ movie, onClose, onSave, user }) {
  const [platform, setPlatform] = useState("netflix");
  const [status, setStatus] = useState("completed");
  const [ratingAdrian, setRatingAdrian] = useState(0);
  const [ratingAndrea, setRatingAndrea] = useState(0);
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);
  const handleSave = async () => {
    if (!user || !movie) return;
    await addDoc(
      collection(db, "artifacts", appId, "public", "data", "movies"),
      {
        tmdbId: movie.id,
        title: movie.title || movie.name,
        type: movie.media_type,
        posterPath: movie.poster_path,
        releaseDate: movie.release_date || movie.first_air_date,
        platform,
        status,
        ratingAdrian,
        ratingAndrea,
        notes: "",
        addedAt: Date.now(),
        addedBy: user.uid,
      }
    );
    onSave();
  };

  const posterUrl = getPosterUrl(movie.poster_path);
  const year = (movie.release_date || movie.first_air_date || "").split("-")[0];
  return (
    <div
      className="aa-modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="aa-modal">
        {posterUrl && (
          <div className="aa-modal-poster">
            <img src={posterUrl} alt={movie.title || movie.name} />
            <div className="aa-modal-poster-overlay" />
          </div>
        )}
        <button className="aa-modal-close" onClick={onClose}>
          <X size={14} />
        </button>
        <div className="aa-modal-body">
          <div className="aa-modal-title">{movie.title || movie.name}</div>
          <div className="aa-modal-year">
            {movie.media_type === "movie" ? "Película" : "Serie"}
            {year && ` · ${year}`}
          </div>

          <div className="aa-modal-section">
            <div className="aa-modal-lbl">¿Dónde la visteis?</div>
            <div className="aa-platform-grid">
              {platforms.map((p) => (
                <button
                  key={p.id}
                  className={`aa-platform-btn ${
                    platform === p.id ? "active" : ""
                  }`}
                  style={
                    platform === p.id
                      ? {
                          background: p.color,
                          color: p.text,
                          borderColor: p.color,
                        }
                      : {}
                  }
                  onClick={() => setPlatform(p.id)}
                >
                  <span
                    className="aa-mini-logo"
                    style={{
                      background:
                        platform === p.id ? "rgba(255,255,255,0.25)" : p.color,
                      color: p.text,
                      width: "16px",
                      height: "16px",
                      fontSize: "9px",
                    }}
                  >
                    {p.id === "netflix"
                      ? "N"
                      : p.id === "prime"
                      ? "P"
                      : p.id === "disney"
                      ? "D"
                      : p.id === "hbo"
                      ? "H"
                      : p.id === "cinema"
                      ? "C"
                      : "O"}
                  </span>
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="aa-modal-section">
            <div className="aa-modal-lbl">Estado</div>
            <div className="aa-status-grid">
              {Object.entries(statusConfig).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button
                    key={key}
                    className={`aa-status-btn ${
                      status === key ? `active-${key}` : ""
                    }`}
                    onClick={() => setStatus(key)}
                  >
                    <Icon size={13} /> {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="aa-modal-section">
            <div className="aa-modal-lbl">Valoración</div>
            <div className="aa-rating-row">
              <span className="aa-rating-who">Adrián</span>
              <StarPicker
                value={ratingAdrian}
                onChange={setRatingAdrian}
                color="#00D2FF"
              />
            </div>
            <div className="aa-rating-row">
              <span className="aa-rating-who">Andrea</span>
              <StarPicker
                value={ratingAndrea}
                onChange={setRatingAndrea}
                color="#A855F7"
              />
            </div>
          </div>

          <div className="aa-modal-footer">
            <button className="aa-btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button className="aa-btn-primary" onClick={handleSave}>
              <Plus size={16} /> Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);

  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");

  const heroRef = useRef(null);
  const orb1Ref = useRef(null);
  const orb2Ref = useRef(null);
  const orb3Ref = useRef(null);
  const monogramRef = useRef(null);
  const titleRef = useRef(null);
  const searchRef = useRef(null);

  // Mouse parallax
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const fn = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      if (orb1Ref.current)
        orb1Ref.current.style.transform = `translate(${x * 30}px,${y * 20}px)`;
      if (orb2Ref.current)
        orb2Ref.current.style.transform = `translate(${-x * 20}px,${
          -y * 15
        }px)`;
      if (orb3Ref.current)
        orb3Ref.current.style.transform = `translate(${x * 15}px,${-y * 10}px)`;
      if (monogramRef.current)
        monogramRef.current.style.transform = `translate(-50%,-50%) translate(${
          x * 18
        }px,${y * 10}px)`;
      if (titleRef.current)
        titleRef.current.style.transform = `translate(${x * -6}px,${y * -4}px)`;
    };
    window.addEventListener("mousemove", fn);
    return () => window.removeEventListener("mousemove", fn);
  }, []);

  // Auth
  useEffect(() => {
    const init = async () => {
      try {
        if (
          typeof __initial_auth_token !== "undefined" &&
          __initial_auth_token
        ) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error(e);
      }
    };
    init();
    return onAuthStateChanged(auth, setUser);
  }, []);

  // Firestore
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "artifacts", appId, "public", "data", "movies")
    );
    return onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setEntries(docs);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        setLoading(false);
      }
    );
  }, [user]);

  // Search
  useEffect(() => {
    const t = setTimeout(async () => {
      if (searchTerm.trim().length < 3) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const r = await fetch(
          `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&language=es-ES&query=${encodeURIComponent(
            searchTerm
          )}&page=1`
        );
        const d = await r.json();
        const results = (d.results || [])
          .filter((i) => i.media_type === "movie" || i.media_type === "tv")
          .slice(0, 6);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const handleSelectMovie = (movie) => {
    setSelectedMovie(movie);
    setShowModal(true);
    setSearchTerm("");
    setSearchResults([]);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(
        doc(db, "artifacts", appId, "public", "data", "movies", id)
      );
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = entries
    .filter((e) => {
      if (filterPlatform !== "all" && e.platform !== filterPlatform)
        return false;
      if (filterStatus !== "all" && e.status !== filterStatus) return false;
      return true;
    })
    .sort((a, b) =>
      sortOrder === "desc" ? b.addedAt - a.addedAt : a.addedAt - b.addedAt
    );

  const statsCompleted = entries.filter((e) => e.status === "completed").length;
  const statsWatching = entries.filter((e) => e.status === "watching").length;
  const statsDropped = entries.filter((e) => e.status === "dropped").length;

  return (
    <div className="aa-app">
      <StyleInjector />
      <div className="aa-grain" />

      {/* ── HERO ── */}
      <section className="aa-hero" ref={heroRef}>
        <div className="aa-hero-bg">
          <FilmStrip side="left" />
          <FilmStrip side="right" />
          <div ref={orb1Ref} className="aa-hero-orb aa-hero-orb-1" />
          <div ref={orb2Ref} className="aa-hero-orb aa-hero-orb-2" />
          <div ref={orb3Ref} className="aa-hero-orb aa-hero-orb-3" />
          <div ref={monogramRef} className="aa-hero-monogram">
            A&amp;A
          </div>
        </div>

        <div className="aa-hero-content">
          <div className="aa-hero-eyebrow">Nuestra colección</div>
          <div ref={titleRef} className="aa-hero-title">
            Adrián
            <br />
            &amp; Andrea
          </div>
          <div className="aa-hero-subtitle">Películas · Series · Momentos</div>

          <div className="aa-hero-stats">
            <div style={{ textAlign: "center" }}>
              <div className="aa-hero-stat-num">{statsCompleted}</div>
              <div className="aa-hero-stat-lbl">Completadas</div>
            </div>
            <div className="aa-stat-div" />
            <div style={{ textAlign: "center" }}>
              <div className="aa-hero-stat-num">{statsWatching}</div>
              <div className="aa-hero-stat-lbl">A medias</div>
            </div>
            <div className="aa-stat-div" />
            <div style={{ textAlign: "center" }}>
              <div className="aa-hero-stat-num">{statsDropped}</div>
              <div className="aa-hero-stat-lbl">Abandonadas</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="aa-search-wrap">
          <Search className="aa-search-icon" />
          <input
            ref={searchRef}
            className="aa-search-input"
            placeholder="Buscar película o serie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {isSearching && <div className="aa-spinner" />}

          {searchResults.length > 0 && (
            <div className="aa-search-results">
              {searchResults.map((r) => (
                <div
                  key={r.id}
                  className="aa-result-item"
                  onClick={() => handleSelectMovie(r)}
                >
                  <div className="aa-result-poster">
                    {r.poster_path ? (
                      <img
                        src={getPosterUrl(r.poster_path)}
                        alt={r.title || r.name}
                      />
                    ) : (
                      <Film size={16} color="var(--txt-3)" />
                    )}
                  </div>
                  <div>
                    <div className="aa-result-title">{r.title || r.name}</div>
                    <div className="aa-result-meta">
                      <span className="aa-type-badge">
                        {r.media_type === "movie" ? "Peli" : "Serie"}
                      </span>
                      {(r.release_date || r.first_air_date) && (
                        <span>
                          {(r.release_date || r.first_air_date).split("-")[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── FILTERS ── */}
      <div className="aa-rule" style={{ marginTop: "2.5rem" }}>
        Colección
      </div>
      <div className="aa-filters">
        <span className="aa-filter-label">
          <SlidersHorizontal size={13} />
          Filtrar por
        </span>

        <CustomDropdown
          value={filterPlatform}
          onChange={setFilterPlatform}
          type="platform"
          options={[{ id: "all", name: "Todas las plataformas" }, ...platforms]}
        />

        <CustomDropdown
          value={filterStatus}
          onChange={setFilterStatus}
          type="status"
          options={[
            {
              id: "all",
              label: "Cualquier estado",
              color: "var(--txt-2)",
              icon: SlidersHorizontal,
            },
            ...Object.entries(statusConfig).map(([id, cfg]) => ({
              id,
              ...cfg,
            })),
          ]}
        />

        <CustomDropdown
          value={sortOrder}
          onChange={setSortOrder}
          type="generic"
          options={[
            { id: "desc", name: "Más recientes" },
            { id: "asc", name: "Más antiguas" },
          ]}
        />

        <div className="aa-count-badge">
          <span>{filtered.length}</span>{" "}
          {filtered.length === 1 ? "título" : "títulos"}
        </div>
      </div>

      {/* ── GRID ── */}
      <div className="aa-grid">
        {loading ? (
          <div className="aa-loading">
            <div className="aa-loading-ring" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="aa-empty">
            <Film size={40} strokeWidth={1} />
            <h3>Sin resultados</h3>
            <p>Busca arriba o cambia los filtros.</p>
          </div>
        ) : (
          filtered.map((entry, i) => (
            <MovieCard
              key={entry.id}
              entry={entry}
              onDelete={handleDelete}
              index={i}
            />
          ))
        )}
      </div>

      {/* ── MODAL ── */}
      {showModal && selectedMovie && (
        <AddModal
          movie={selectedMovie}
          user={user}
          onClose={() => {
            setShowModal(false);
            setSelectedMovie(null);
          }}
          onSave={() => {
            setShowModal(false);
            setSelectedMovie(null);
          }}
        />
      )}
    </div>
  );
}
