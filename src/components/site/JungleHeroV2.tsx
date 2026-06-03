// ════════════════════════════════════════════════════════════════
// JungleHeroV2.tsx — Hero V4 « Sortez de la jungle »
// Base Hero V2 (fond arabizi : ghost swarm + 4 cards nettes nommées)
// + mockup dashboard LIVRA à droite avec mini-carte live « EN DIRECT ».
//
// • Tokens marque depuis globals.css ; Inter via next/font.
// • Même nom de composant que V2 — remplace juste le contenu.
// • Pas de "Voir la démo", pas de sous-titre défensif.
// ════════════════════════════════════════════════════════════════
import styles from './JungleHeroV2.module.css';

/* ─── Fond jungle : messages arabizi (darija) ─── */
type Msg = { av: string; color: string; name: string; text: string; time: string };

// Swarm flouté de fond (10) — atmosphère « jungle »
const GHOSTS: Msg[] = [
  { av: 'A', color: '#D97757', name: 'Anis F.',    text: "9olbi yrouh quand ychouf « commande annulée » f 1ère ligne de la matinée.", time: 'il y a 7h' },
  { av: 'W', color: '#D17861', name: 'Walid H.',   text: "Excel f téléphone, screenshots f WA, w cahier f sac. Nakhdem wla nfantasme ?", time: 'il y a 6h' },
  { av: 'S', color: '#C9954D', name: 'Sami O.',    text: "Krahna men colis en instance, w men « rappelez-moi demain ».", time: 'il y a 30 min' },
  { av: 'A', color: '#3a6b54', name: 'Amine S.',   text: "Rani l'aman… 4 colis COD radjou, w l'cahier dssil fih lokhrin.", time: 'hier' },
  { av: 'R', color: '#C9954D', name: 'Ryad B.',    text: "Confirmation par WA, par tel, par DM… w client yqolik « machi ana ».", time: 'hier' },
  { av: 'M', color: '#3a6b54', name: 'Mehdi L.',   text: "Le livreur ma rd-ch l'cash hier, w rani na3ref weh fin houwa.", time: 'il y a 4h' },
  { av: 'N', color: '#9CA3AF', name: 'Nassim K.',  text: "H24 connecté sur Messenger, tgoul rani f central téléphonique.", time: 'à l\u2019instant' },
  { av: 'B', color: '#D17861', name: 'Bilal Z.',   text: "Yalidine, Maystro, Noest… chaque société 7essab fih, w ana en plein milieu.", time: 'hier' },
  { av: 'H', color: '#D97757', name: 'Hocine R.',  text: "Lead Meta b 2$ w yji ydir « just looking ».", time: 'il y a 1h' },
  { av: 'F', color: '#C9954D', name: 'Farouk D.',  text: "Wech ndir b had l'colis ? Client ma yjaweb-ch men 3 jours.", time: 'il y a 5h' },
];
const GHOST_POS = ['g1','g2','g3','g4','g5','g6','g7','g8','g9','g10'] as const;

// 4 cards nettes nommées (le wedge DZ) — Karim, Yacine, Sofiane, Sami
const SHARP: (Msg & { pos: string })[] = [
  { pos: 'sTl', av: 'K', color: '#D97757', name: 'Karim B.',   text: "Sahbi wech rahi commande ta3i ? 3 ayyam w mazal walou.", time: 'il y a 2h' },
  { pos: 'sTr', av: 'Y', color: '#D17861', name: 'Yacine T.',  text: "30% retour hada machi business, hada masse men ness yetlebou w ymchiw.", time: 'il y a 3h' },
  { pos: 'sBl', av: 'S', color: '#C9954D', name: 'Sofiane M.', text: "Wech ndir b had l'colis ? Client ma yjaweb-ch.", time: 'il y a 5h' },
  { pos: 'sMr', av: 'S', color: '#9CA3AF', name: 'Sami O.',    text: "Krahna men colis en instance, w «\u00a0rappelez-moi demain\u00a0».", time: 'il y a 30 min' },
];

/* ─── Mockup dashboard : commandes du jour ─── */
type Order = { ini: string; bg: string; name: string; meta: string; amount: string; status: 'ok' | 'go' | 'wait'; label: string };
const ORDERS: Order[] = [
  { ini: 'K', bg: '#D97757', name: 'Karim Benali',     meta: 'Alger Centre · #LV-2841', amount: '5 400 DA',  status: 'ok',   label: 'Livré' },
  { ini: 'Y', bg: '#C9954D', name: 'Yacine Toumi',     meta: 'Oran · #LV-2840',        amount: '12 900 DA', status: 'go',   label: 'En tournée' },
  { ini: 'A', bg: '#3a6b54', name: 'Amel Saïdi',       meta: 'Constantine · #LV-2839', amount: '3 200 DA',  status: 'ok',   label: 'Livré' },
  { ini: 'S', bg: '#9CA3AF', name: 'Sofiane Mansouri', meta: 'Blida · #LV-2838',       amount: '7 750 DA',  status: 'wait', label: 'À confirmer' },
];
const BADGE: Record<Order['status'], string> = { ok: styles.bOk, go: styles.bGo, wait: styles.bWait };

function Bubble({ m, posClass }: { m: Msg; posClass: string }) {
  return (
    <div className={`${styles.card} ${posClass}`}>
      <div className={styles.cHead}>
        <span className={styles.cAv} style={{ ['--av' as string]: m.color }}>{m.av}</span>
        <span className={styles.cName}>{m.name}</span>
      </div>
      <p className={styles.cText}>{m.text}</p>
      <span className={styles.cTime}>{m.time}</span>
    </div>
  );
}

export default function JungleHeroV2() {
  return (
    <section className={styles.hero} data-screen-label="Hero — Sortez de la jungle">

      {/* Nav */}
      <nav className={styles.nav}>
        <span className={styles.brand}>LIVRA</span>
        <div className={styles.navLinks}>
          <a href="#">Produit</a><a href="#">Tarifs</a><a href="#">Wilayas</a>
          <a href="#" className={styles.navLogin}>Se connecter</a>
        </div>
        <div className={styles.navBurger} aria-label="Menu"><span /><span /><span /></div>
      </nav>

      {/* Fond jungle arabizi */}
      <div className={styles.bg} aria-hidden="true">
        <div className={styles.ghosts}>
          {GHOSTS.map((m, i) => <Bubble key={i} m={m} posClass={styles[GHOST_POS[i]]} />)}
        </div>
        <div className={styles.sharp}>
          {SHARP.map((m, i) => <Bubble key={i} m={m} posClass={styles[m.pos]} />)}
        </div>
      </div>

      {/* Avant-plan 2 colonnes */}
      <div className={styles.fg}>
        {/* gauche : copy */}
        <div className={styles.copy}>
          <p className={`${styles.kicker} ${styles.an}`} style={{ ['--d' as string]: '120ms' }}>
            <span className={styles.pip} />L&rsquo;OS de votre e-commerce
          </p>
          <h1 className={`${styles.h1} ${styles.an}`} style={{ ['--d' as string]: '220ms' }}>
            <span className={styles.hl1}>Sortez de la</span>
            <span className={styles.hl2}><span className={styles.accent}>jungle.</span></span>
          </h1>
          <p className={`${styles.subtitle} ${styles.an}`} style={{ ['--d' as string]: '360ms' }}>
            <strong>Commandes en auto, confirmations, Tracking Uber style, Suivi COD.</strong> Une seule app pour tout piloter.
          </p>
          <div className={`${styles.cta} ${styles.an}`} style={{ ['--d' as string]: '500ms' }}>
            <button className={styles.btn} type="button">Commencer gratuitement</button>
          </div>
          <p className={`${styles.micro} ${styles.an}`} style={{ ['--d' as string]: '640ms' }}>
            Rejoignez les vendeurs qui ont quitté la jungle.
          </p>
        </div>

        {/* droite : mockup dashboard + mini-carte live */}
        <div className={`${styles.product} ${styles.an}`} style={{ ['--d' as string]: '420ms' }}>
          <div className={styles.panel}>
            <div className={styles.pTop}>
              <div>
                <div className={styles.pTitle}>Commandes <b>·</b> aujourd&rsquo;hui</div>
                <div className={styles.pSub}>42 confirmées · 6 en tournée</div>
              </div>
              <div className={styles.pTabs}>
                <span className={`${styles.pTab} ${styles.pTabOn}`}>Toutes</span>
                <span className={styles.pTab}>COD</span>
                <span className={styles.pTab}>Statut</span>
              </div>
            </div>
            <div className={styles.rows}>
              {ORDERS.map((o, i) => (
                <div className={styles.row} key={i}>
                  <span className={styles.ini} style={{ background: o.bg }}>{o.ini}</span>
                  <div>
                    <div className={styles.rName}>{o.name}</div>
                    <div className={styles.rMeta}>{o.meta}</div>
                  </div>
                  <div className={styles.rRight}>
                    <div className={styles.rAmt}>{o.amount}</div>
                    <span className={`${styles.badge} ${BADGE[o.status]}`}><span className={styles.bDot} />{o.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.livemap}>
            <div className={styles.map}>
              <div className={styles.streets} />
              <div className={styles.vignette} />
              <svg className={styles.routeSvg} viewBox="0 0 288 146" preserveAspectRatio="none" aria-hidden="true">
                <path className={styles.routeBg} d="M 24 124 C 70 118, 58 78, 120 78 S 210 68, 248 25" />
                <path className={styles.routeFg} d="M 24 124 C 70 118, 58 78, 120 78 S 210 68, 248 25" pathLength={100} strokeDasharray="66 100" />
              </svg>
              <span className={styles.dest} />
              <span className={styles.courier} />
              <span className={styles.mapBadge}><span className={styles.live} />En direct</span>
            </div>
            <div className={styles.mapFoot}>
              <div className={styles.mfTop}>
                <span className={styles.mfName}>Colis #LV-2840</span>
                <span className={styles.mfEta}>ETA 22 min</span>
              </div>
              <div className={styles.mfSub}>Yacine T. · en route vers Oran · livreur Bilal</div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.scrollHint}><span className={styles.line} />Découvrir</div>
    </section>
  );
}
