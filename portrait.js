/* Рисованные портреты пациентов (SVG, без внешних картинок).
   window.PORTRAIT(look) → строка <svg>. look = {age:"baby"|"kid"|"child"|"teen", sex:"м"|"ж",
   hair:"short"|"bob"|"long"|"pony"|"baby"|"bald", hc:цвет волос, skin:"fair"|"light"|"medium"|"olive"|"pale"|"jaundice",
   mood:"calm"|"happy"|"sad"|"worried"|"sleepy"|"pain"|"crying"|"sullen", marks:[…], bg:цвет фона, gown:цвет рубашки}.
   marks — клинические признаки, которые видны на лице: raccoon (синяки вокруг глаз), proptosis-l (левый глаз
   выпячен и смещён книзу-кнаружи), leuko-r (белый зрачок справа + сходящееся косоглазие), neck-l (конгломерат
   над левой ключицей), puffy (отёк и плетора лица, набухшие вены шеи), flushed (лихорадочный румянец), rash (сыпь),
   scalp (корочки на волосистой части головы), port (порт под ключицей).
   Портрет смотрит на зрителя: левая сторона пациента — справа на рисунке. */
window.PORTRAIT = (function(){
  const SKIN = {fair:"#f9e0cf", light:"#f3cfb3", medium:"#dcae88", olive:"#c99773", pale:"#f3e7df", jaundice:"#efd79c"};
  const SHADE = {fair:"#e9c3aa", light:"#e0b393", medium:"#c4926c", olive:"#b07d5b", pale:"#e2d2c7", jaundice:"#dcc07a"};
  const GEO = {
    baby: {cx:50, cy:50, rx:27, ry:26, ey:52, ex:11, er:3.4, my:65, neck:7},
    kid:  {cx:50, cy:48, rx:24, ry:27, ey:50, ex:10.5, er:3, my:64, neck:8},
    child:{cx:50, cy:46, rx:22, ry:27.5, ey:47.5, ex:10, er:2.7, my:61.5, neck:8.5},
    teen: {cx:50, cy:44, rx:20.5, ry:28.5, ey:45, ex:9.5, er:2.4, my:60, neck:9}
  };

  function hairBack(g, L){
    const c = L.hc, {cx, cy, rx, ry} = g;
    if (L.hair === "long") return `<path d="M${cx - rx - 4} ${cy - 4} C${cx - rx - 6} ${cy + 30} ${cx - rx + 2} ${cy + 40} ${cx - rx + 6} ${cy + 42} L${cx + rx - 6} ${cy + 42} C${cx + rx - 2} ${cy + 40} ${cx + rx + 6} ${cy + 30} ${cx + rx + 4} ${cy - 4} Z" fill="${c}"/>`;
    if (L.hair === "bob") return `<path d="M${cx - rx - 4} ${cy - 2} C${cx - rx - 5} ${cy + 18} ${cx - rx} ${cy + 22} ${cx - rx + 3} ${cy + 22} L${cx + rx - 3} ${cy + 22} C${cx + rx} ${cy + 22} ${cx + rx + 5} ${cy + 18} ${cx + rx + 4} ${cy - 2} Z" fill="${c}"/>`;
    if (L.hair === "pony") return `<ellipse cx="${cx + rx + 3}" cy="${cy - ry * 0.35}" rx="6" ry="9" transform="rotate(25 ${cx + rx + 3} ${cy - ry * 0.35})" fill="${c}"/><circle cx="${cx + rx - 1}" cy="${cy - ry * 0.55}" r="2.6" fill="#e05a7a"/>`;
    return "";
  }
  function hairFront(g, L){
    const c = L.hc, {cx, cy, rx, ry} = g;
    if (L.hair === "bald") return "";
    if (L.hair === "baby") return `<path d="M${cx - 8} ${cy - ry + 3} q3 -7 7 -1 q2 -7 7 0 q4 -5 5 2" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round"/>`;
    const fr = L.hair === "short" ? 0.42 : 0.38;
    const cap = `<path d="M${cx - rx - 1.5} ${cy + 2} C${cx - rx - 2} ${cy - ry * 1.32} ${cx + rx + 2} ${cy - ry * 1.32} ${cx + rx + 1.5} ${cy + 2} L${cx + rx - 1} ${cy - ry * 0.18} Q${cx + rx * 0.35} ${cy - ry * fr} ${cx - 2} ${cy - ry * (fr + 0.05)} Q${cx - rx * 0.6} ${cy - ry * (fr - 0.05)} ${cx - rx + 1} ${cy - ry * 0.12} Z" fill="${c}"/>`;
    return cap;
  }
  function eye(x, y, r, L, side, marks){
    const mood = L.mood, skin = SKIN[L.skin] || SKIN.light;
    if (mood === "pain") return `<path d="M${x - r * 1.3} ${y} q${r * 1.3} ${-r * 1.4} ${r * 2.6} 0" fill="none" stroke="#3a2a22" stroke-width="1.5" stroke-linecap="round"/>`;
    if (mood === "happy") return `<path d="M${x - r * 1.2} ${y + r * 0.3} q${r * 1.2} ${-r * 1.6} ${r * 2.4} 0" fill="none" stroke="#3a2a22" stroke-width="1.5" stroke-linecap="round"/>`;
    let ix = x, iy = y, rr = r, white = "", pupil = "#2c211c";
    if (marks.includes("proptosis-l") && side === "l"){ ix += 1.6; iy += 2.2; rr = r * 1.25; white = `<ellipse cx="${x + 1.6}" cy="${y + 2.2}" rx="${rr * 1.75}" ry="${rr * 1.45}" fill="#fff" stroke="#c9a08a" stroke-width=".6"/>`; }
    if (marks.includes("leuko-r") && side === "r"){ ix += 1.6; white = `<ellipse cx="${x}" cy="${y}" rx="${r * 1.7}" ry="${r * 1.3}" fill="#fff" stroke="#c9a08a" stroke-width=".5"/>`; pupil = "#5a4a40"; }
    let s = white + `<circle cx="${ix}" cy="${iy}" r="${rr}" fill="${pupil}"/>`;
    if (marks.includes("leuko-r") && side === "r") s += `<circle cx="${ix}" cy="${iy}" r="${rr * 0.62}" fill="#f4f1ea"/>`;
    else s += `<circle cx="${ix + rr * 0.35}" cy="${iy - rr * 0.35}" r="${rr * 0.32}" fill="#fff"/>`;
    if (mood === "sullen") s = white + `<circle cx="${ix + (side === "l" ? 1 : 1)}" cy="${iy + 0.4}" r="${rr}" fill="${pupil}"/>`;
    if (mood === "sleepy" || mood === "sullen") s += `<path d="M${x - r * 1.9} ${y - r * 1.9} h${r * 3.8} v${r * 1.9} h${-r * 3.8} Z" fill="${skin}"/><path d="M${x - r * 1.5} ${y + 0.1} h${r * 3}" stroke="#3a2a22" stroke-width="1.1" stroke-linecap="round"/>`;
    if (marks.includes("proptosis-l") && side === "l") s += `<path d="M${x - r * 1.6} ${y - r * 0.2} q${r * 1.8} ${-r * 0.8} ${r * 3.6 + 2} ${r * 0.6}" fill="${skin}" stroke="#3a2a22" stroke-width=".9"/>`;
    if (mood === "crying") s += `<path d="M${x + (side === "l" ? r : -r)} ${y + r * 1.3} q-1.2 3 0 4.6 q1.2 -1.6 0 -4.6" fill="#8cc6ee"/>`;
    return s;
  }
  function brows(g, L){
    const {cx, ey, ex, er} = g, y = ey - er * 2.6, w = er * 2.2, c = L.hair === "bald" ? "#b79a88" : L.hc;
    const tilt = {sad:-2.2, worried:-2.2, crying:-2.6, pain:-2.4, sullen:1.4, calm:0, happy:-0.5, sleepy:0}[L.mood] || 0;
    // tilt < 0 — внутренние концы бровей подняты (грусть, тревога)
    return [-1, 1].map(k => { const x0 = cx + k * ex - w / 2, x1 = cx + k * ex + w / 2;
      const yin = y + (k < 0 ? 0 : 0) + tilt * 0.5, yout = y - tilt * 0.5;
      const yl = k < 0 ? yout : yin, yr = k < 0 ? yin : yout;
      return `<path d="M${x0} ${yl} L${x1} ${yr}" stroke="${c}" stroke-width="1.8" stroke-linecap="round" opacity=".9"/>`; }).join("");
  }
  function mouth(g, L){
    const {cx, my} = g, m = L.mood, k = "#8c3b35";
    if (m === "happy") return `<path d="M${cx - 6} ${my - 1} q6 6 12 0" fill="#a4433b" stroke="${k}" stroke-width="1.2" stroke-linejoin="round"/>`;
    if (m === "calm") return `<path d="M${cx - 4} ${my} q4 2.5 8 0" fill="none" stroke="${k}" stroke-width="1.5" stroke-linecap="round"/>`;
    if (m === "sad" || m === "sullen") return `<path d="M${cx - 4.5} ${my + 1.2} q4.5 ${m === "sad" ? -3 : -1} 9 0" fill="none" stroke="${k}" stroke-width="1.5" stroke-linecap="round"/>`;
    if (m === "worried") return `<path d="M${cx - 4.5} ${my} q2.2 -1.6 4.5 0 q2.2 1.6 4.5 0" fill="none" stroke="${k}" stroke-width="1.4" stroke-linecap="round"/>`;
    if (m === "sleepy") return `<ellipse cx="${cx}" cy="${my}" rx="2" ry="1.5" fill="${k}"/>`;
    if (m === "pain") return `<path d="M${cx - 5} ${my + 1} h10" stroke="${k}" stroke-width="2.6" stroke-linecap="round"/><path d="M${cx - 3.5} ${my + 1} h7" stroke="#fff" stroke-width="1" opacity=".8"/>`;
    if (m === "crying") return `<path d="M${cx - 5} ${my + 2.5} q5 -6 10 0 q-5 2 -10 0" fill="#6e2b26"/>`;
    return "";
  }

  return function(L, size){
    const g = Object.assign({}, GEO[L.age] || GEO.kid), marks = L.marks || [];
    if (marks.includes("puffy")){ g.rx += 2.2; g.ry += 0.5; }
    const skin = SKIN[L.skin] || SKIN.light, shade = SHADE[L.skin] || SHADE.light, {cx, cy, rx, ry, ey, ex, er, my} = g;
    const gown = L.gown || "#a9cbe8", bg = L.bg || "#dfe8f1";
    const blush = L.skin === "pale" ? 0 : marks.includes("flushed") || marks.includes("puffy") ? 0.55 : 0.28;
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size || 56}" height="${size || 56}" role="img" aria-hidden="true">
      <defs><clipPath id="pc"><circle cx="50" cy="50" r="50"/></clipPath></defs><g clip-path="url(#pc)">
      <rect width="100" height="100" fill="${bg}"/>`;
    s += hairBack(g, L);
    // плечи в больничной рубашке, шея
    s += `<path d="M10 100 C12 ${cy + ry + 14} ${cx - 12} ${cy + ry + 6} ${cx} ${cy + ry + 6} C${cx + 12} ${cy + ry + 6} 88 ${cy + ry + 14} 90 100 Z" fill="${gown}"/>`;
    s += `<rect x="${cx - g.neck}" y="${cy + ry - 8}" width="${g.neck * 2}" height="14" rx="4" fill="${shade}"/>`;
    s += `<path d="M${cx - g.neck - 3} ${cy + ry + 6} q${g.neck + 3} 7 ${g.neck * 2 + 6} 0" fill="none" stroke="#7fa7cc" stroke-width="1.6"/>`;
    if (marks.includes("neck-l")) s += `<ellipse cx="${cx + g.neck + 2}" cy="${cy + ry + 3}" rx="6.5" ry="5" fill="${skin}" stroke="${shade}" stroke-width="1.2"/>`;
    if (marks.includes("puffy")) s += `<path d="M${cx - 5} ${cy + ry - 6} q-1 6 0 11 M${cx + 5} ${cy + ry - 6} q1 6 0 11" stroke="#8a6fb0" stroke-width="1.2" fill="none" opacity=".7"/>`;
    if (marks.includes("port")) s += `<circle cx="${cx - 18}" cy="${cy + ry + 13}" r="3.2" fill="${gown}" stroke="#7fa7cc" stroke-width="1"/>`;
    // уши и голова
    s += `<ellipse cx="${cx - rx}" cy="${ey + 2}" rx="3.6" ry="5.2" fill="${shade}"/><ellipse cx="${cx + rx}" cy="${ey + 2}" rx="3.6" ry="5.2" fill="${shade}"/>`;
    s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${skin}"/>`;
    if (marks.includes("scalp")) s += `<g fill="#c9a24c" opacity=".9"><circle cx="${cx - 9}" cy="${cy - ry + 6}" r="1.8"/><circle cx="${cx + 4}" cy="${cy - ry + 4}" r="1.5"/><circle cx="${cx + 11}" cy="${cy - ry + 8}" r="1.7"/></g>`;
    if (marks.includes("raccoon")) s += [-1, 1].map(k => `<ellipse cx="${cx + k * ex}" cy="${ey + 0.5}" rx="${er * 2.6}" ry="${er * 2.2}" fill="#7a4f86" opacity=".55"/>`).join("");
    s += hairFront(g, L);
    s += brows(g, L);
    s += eye(cx - ex, ey, er, L, "r", marks) + eye(cx + ex, ey, er, L, "l", marks);
    // нос, щёки, рот
    s += `<path d="M${cx - 1.2} ${(ey + my) / 2 - 1} q1.2 2.4 2.4 0" fill="none" stroke="${shade}" stroke-width="1.4" stroke-linecap="round"/>`;
    if (blush) s += `<ellipse cx="${cx - ex - 2}" cy="${my - 4}" rx="4.6" ry="2.8" fill="#ef7d7d" opacity="${blush}"/><ellipse cx="${cx + ex + 2}" cy="${my - 4}" rx="4.6" ry="2.8" fill="#ef7d7d" opacity="${blush}"/>`;
    if (marks.includes("rash")) s += `<g fill="#d9534f" opacity=".6">${[[-13, -2], [-9, 2], [-15, 4], [12, -1], [9, 3], [15, 5], [-3, 12], [4, 13]].map(([dx, dy]) => `<circle cx="${cx + dx}" cy="${my - 6 + dy}" r="1.1"/>`).join("")}</g>`;
    s += mouth(g, L);
    s += `</g></svg>`;
    return s;
  };
})();
