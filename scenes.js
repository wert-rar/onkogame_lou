/* Схематичные срезы и мазки для мини-игр «найди» и «игла».
   window.SCENES[id]() → {mod, items}. items рисуются по порядку; что нарисовано позже — лежит «сверху».
   Попадание определяет самая верхняя структура в точке: так анатомия задаётся порядком отрисовки.
   item: {id, name, tone, pts:[[x,y]…], lab?:подписать в разборе, nohit?:декор, as?:считать как другую структуру}.
   Срезы — в радиологической ориентации: левая сторона пациента справа на экране, спереди — сверху.
   window.SCAN — общая проверка (страница и tools/check.js): find(), needle(). */
(function(){
  const PAL = {
    ct:   {bg:"#000", air:"#060606", lung:"#101010", fat:"#3d3d3d", muscle:"#6b6b6b", soft:"#767676", organ:"#808080", liver:"#8e8e8e", spleen:"#858585", kidney:"#a8a8a8", vessel:"#dcdcdc", bone:"#eeeeee", marrow:"#8d8d8d", fluid:"#545454", tumor:"#717171", tumorLow:"#5a5a5a", tumorHi:"#868686", calc:"#ffffff", brain:"#7b7b7b", csf:"#383838", skin:"#585858", lens:"#c8c8c8"},
    mri:  {bg:"#000", air:"#000", lens:"#3a3a3a", fat:"#d4d4d4", muscle:"#575757", soft:"#666", organ:"#777", vessel:"#0f0f0f", bone:"#141414", marrow:"#c6c6c6", fluid:"#383838", tumor:"#ababab", tumorLow:"#8a8a8a", tumorHi:"#cfcfcf", calc:"#111", brain:"#8a8a8a", csf:"#2b2b2b", skin:"#9c9c9c", nerve:"#4b4b4b"},
    t2:   {bg:"#000", air:"#000", fat:"#b9b9b9", muscle:"#3d3d3d", bone:"#141414", marrow:"#9b9b9b", fluid:"#f0f0f0", tumor:"#4e4e4e", tumorLow:"#3a3a3a", tumorHi:"#666", calc:"#0b0b0b", brain:"#7a7a7a", csf:"#eeeeee", skin:"#8e8e8e", vitreous:"#ececec", lens:"#2b2b2b", nerve:"#555", soft:"#5c5c5c"},
    xray: {bg:"#0a0a0a", soft:"#343434", bone:"#cfcfcf", boneHi:"#ececec", lucent:"#3d3d3d", air:"#0a0a0a", dense:"#e2e2e2"},
    us:   {bg:"#000", soft:"#4f4f4f", organ:"#6a6a6a", fluid:"#060606", tumor:"#8d8d8d", tumorLow:"#5c5c5c", calc:"#efefef", skin:"#a5a5a5"},
    smear:{bg:"#f3ece6", rbc:"#e59d97", rbcPale:"#f3cbc6", nuc:"#4a2377", nucLight:"#7448a6", cyto:"#a8bbe9", cytoDeep:"#7b94dc", neut:"#efd5dc", plt:"#7a46aa", macro:"#cbbcdc", nucleolus:"#9a7cc4"},
    diag: {bg:"#f6f2ec", skin:"#efc3a6", fat:"#f5e2b6", muscle:"#d68b82", bone:"#ece4d3", boneEdge:"#cbbd9f", metal:"#98a4b2", septum:"#4f6175", fluid:"#cfe5f7", vessel:"#c63d2f", vein:"#3d5fa8", nerve:"#f0c94e", lung:"#f6d7d7", pleura:"#df9f9f", cord:"#f0c94e", csf:"#d4eafb", disc:"#b9c8da", lig:"#e6d6c3", air:"#ffffff"}
  };

  // детерминированный «шум», чтобы формы были живыми, но одинаковыми при каждом запуске
  const rnd = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  function blob(cx, cy, rx, ry, o){
    o = o || {};
    const n = o.n || 36, rot = (o.rot || 0) * Math.PI / 180, wob = o.wob || 0, r = rnd(o.seed || 7), ph = [r() * 6, r() * 6, r() * 6];
    const pts = [];
    for (let i = 0; i < n; i++){
      const t = i / n * Math.PI * 2;
      const k = 1 + wob * (Math.sin(3 * t + ph[0]) * 0.5 + Math.sin(5 * t + ph[1]) * 0.3 + Math.sin(7 * t + ph[2]) * 0.2);
      const x = Math.cos(t) * rx * k, y = Math.sin(t) * ry * k;
      pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
    }
    return pts;
  }
  const E = (id, name, tone, cx, cy, rx, ry, o) => Object.assign({id, name, tone, pts:blob(cx, cy, rx, ry, o)}, o && o.f);
  const P = (id, name, tone, pts, f) => Object.assign({id, name, tone, pts}, f);
  const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  // россыпь мелких пятен внутри опухоли (неоднородность, кальцинаты) — считаются частью опухоли
  function specks(id, tone, cx, cy, rx, ry, n, size, seed, as){
    const r = rnd(seed), out = [];
    for (let i = 0; i < n; i++){
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.75;
      out.push(E(id + i, "", tone, cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, size * (0.6 + r() * 0.7), size * (0.5 + r() * 0.6), {n:12, rot:r() * 180, f:{as:as || id, nohit:false, deco:true}}));
    }
    return out;
  }
  function ribsRing(cx, cy, rx, ry, angles, size){
    return angles.map((a, i) => { const t = a * Math.PI / 180; return E("rib" + i, "Ребро", "bone", cx + Math.cos(t) * rx, cy + Math.sin(t) * ry, size, size * 0.7, {n:14, rot:a, f:{as:"rib"}}); });
  }
  // поясничный позвонок в аксиальном срезе: тело, канал, дуга с остистым отростком, мышцы спины
  function vertebra(cx, cy, s){
    s = s || 1;
    return [
      E("paraR", "Мышцы спины", "muscle", cx - 30 * s, cy + 34 * s, 24 * s, 17 * s, {f:{as:"muscle"}}),
      E("paraL", "Мышцы спины", "muscle", cx + 30 * s, cy + 34 * s, 24 * s, 17 * s, {f:{as:"muscle"}}),
      P("arch", "Дуга позвонка", "bone", [[cx - 16 * s, cy + 14 * s], [cx + 16 * s, cy + 14 * s], [cx + 6 * s, cy + 52 * s], [cx - 6 * s, cy + 52 * s]], {as:"spine"}),
      E("vb", "Тело позвонка", "bone", cx, cy - 4 * s, 22 * s, 19 * s, {f:{as:"spine", lab:true}}),
      E("canal", "Позвоночный канал", "csf", cx, cy + 22 * s, 8 * s, 7 * s, {f:{as:"spine"}})
    ];
  }

  const S = {};

  /* ---------- живот, верхний этаж (КТ с контрастом) ---------- */
  function abdUpper(o){
    const it = [
      E("body", "Подкожная клетчатка", "fat", 200, 150, 168, 118, {wob:.02, f:{}}),
      E("wall", "Мышцы брюшной стенки", "muscle", 200, 150, 158, 108, {wob:.02}),
      E("cav", "Забрюшинная клетчатка", "fat", 200, 150, 150, 100, {wob:.02}),
      E("rectR", "Прямая мышца живота", "muscle", 177, 44, 18, 7), E("rectL", "Прямая мышца живота", "muscle", 223, 44, 18, 7),
      ...vertebra(200, 214),
      E("liver", "Печень", "liver", o.liver ? o.liver[0] : 112, o.liver ? o.liver[1] : 132, 78, 72, {rot:-12, wob:.03, seed:3, f:{lab:true}}),
      E("stomach", "Желудок", "soft", 258, 104, 44, 28, {rot:-18, wob:.05, seed:5, f:{lab:true}}),
      E("stomachAir", "Желудок", "air", 262, 92, 20, 8, {f:{as:"stomach"}}),
      E("spleen", "Селезёнка", "spleen", 304, 172, 28, 44, {rot:-22, wob:.03, seed:9, f:{lab:true}}),
      E("panc", "Поджелудочная железа", "organ", 218, 152, 40, 9, {rot:-12, wob:.05, f:{lab:true}}),
      E("colon", "Кишка", "soft", 168, 96, 18, 12, {wob:.06}), E("colonAir", "Кишка", "air", 168, 93, 8, 5, {f:{as:"colon"}}),
      E("rk", "Правая почка", "kidney", ...(o.rk || [128, 206, 20, 30]), {rot:o.rkRot != null ? o.rkRot : 25, f:{lab:true}}),
      E("lk", "Левая почка", "kidney", 272, 206, 20, 30, {rot:-25, f:{lab:true}}),
      ...ribsRing(200, 150, 158, 108, [150, 165, 200, 215, 330, 345, 15, 30], 7)
    ];
    return it;
  }

  // Нейробластома правого надпочечника: переходит среднюю линию, охватывает аорту и чревный ствол
  S.nb = () => {
    const it = abdUpper({rk:[100, 214, 18, 27], rkRot:35});
    it.push(E("mass", "Опухоль (нейробластома)", "tumor", 176, 172, 56, 42, {wob:.09, seed:21, f:{lab:true}}));
    it.push(...specks("ms", "tumorLow", 176, 172, 56, 42, 9, 6, 4, "mass"), ...specks("mc", "calc", 176, 172, 56, 42, 8, 2.4, 11, "mass"));
    it.push(E("ivc", "Нижняя полая вена", "vessel", 160, 126, 10, 7, {f:{lab:true}}));
    it.push(E("aorta", "Аорта", "vessel", 212, 192, 9, 9, {f:{lab:true}}), E("celiac", "Чревный ствол", "vessel", 214, 168, 5, 5, {f:{lab:true}}));
    return {mod:"ct", items:it, orient:"axial"};
  };
  // Нефробластома верхнего полюса правой почки: «симптом когтя»
  S.wilms = () => {
    const it = abdUpper({rk:[116, 214, 32, 38], rkRot:20, liver:[96, 110]});
    it.push(E("mass", "Опухоль (нефробластома)", "tumor", 132, 170, 58, 52, {wob:.04, seed:31, f:{lab:true}}), ...specks("ms", "tumorLow", 132, 170, 58, 52, 6, 9, 5, "mass"));
    it.push(E("ivc", "Нижняя полая вена", "vessel", 184, 182, 10, 8), E("aorta", "Аорта", "vessel", 212, 194, 9, 9));
    return {mod:"ct", items:it, orient:"axial"};
  };
  // Гепатобластома правой доли (сегменты 5–8): биопсия через полоску здоровой печени
  S.hb = () => {
    const it = abdUpper({});
    it.push(E("lungR", "Лёгкое (задний синус)", "lung", 92, 232, 26, 11, {rot:-30, f:{lab:true}}));
    it.push(E("gb", "Желчный пузырь", "fluid", 150, 118, 13, 9, {rot:30, f:{lab:true}}));
    it.push(E("portal", "Воротная вена", "vessel", 168, 142, 11, 7, {rot:-20, f:{lab:true}}), E("ivc", "Нижняя полая вена", "vessel", 180, 182, 10, 8, {f:{lab:true}}), E("aorta", "Аорта", "vessel", 212, 194, 9, 9));
    it.push(E("mass", "Опухоль (гепатобластома)", "tumorLow", 80, 126, 38, 32, {wob:.06, seed:41, f:{lab:true}}), ...specks("ms", "tumor", 80, 126, 38, 32, 7, 5, 6, "mass"));
    return {mod:"ct", items:it, orient:"axial"};
  };

  /* ---------- живот, нижний этаж: асцит, опухоль илеоцекального угла ---------- */
  S.burkitt = () => {
    const it = [
      E("body", "Подкожная клетчатка", "fat", 200, 150, 168, 116, {wob:.02}),
      E("wall", "Мышцы брюшной стенки", "muscle", 200, 150, 158, 106, {wob:.02}),
      E("ascites", "Асцит", "fluid", 200, 140, 150, 92, {wob:.02, f:{lab:true}}),
      E("rectR", "Прямая мышца живота", "muscle", 176, 46, 19, 8), E("rectL", "Прямая мышца живота", "muscle", 224, 46, 19, 8),
      E("epiR", "Нижняя надчревная артерия", "vessel", 182, 56, 3, 3, {f:{lab:true}}), E("epiL", "Нижняя надчревная артерия", "vessel", 218, 56, 3, 3, {f:{lab:true}}),
      E("psoasR", "Поясничная мышца", "muscle", 168, 205, 18, 16), E("psoasL", "Поясничная мышца", "muscle", 232, 205, 18, 16),
      ...vertebra(200, 222),
      E("iliacR", "Подвздошная кость", "bone", 92, 214, 16, 34, {rot:35, f:{as:"iliac", lab:true}}), E("iliacL", "Подвздошная кость", "bone", 308, 214, 16, 34, {rot:-35, f:{as:"iliac"}}),
      E("aorta", "Аорта", "vessel", 210, 190, 7, 7), E("ivc", "Нижняя полая вена", "vessel", 188, 192, 8, 6)
    ];
    const loops = [[178, 100, 22, 16], [210, 128, 24, 17], [182, 150, 20, 15], [235, 98, 19, 14], [205, 170, 18, 12], [160, 122, 15, 13]];
    loops.forEach((l, i) => { it.push(E("loop" + i, "Петля кишки", "soft", ...l, {wob:.08, seed:50 + i, f:{as:"bowel", lab:i === 1}})); it.push(E("la" + i, "Петля кишки", "air", l[0] + 2, l[1] - 2, l[2] * 0.4, l[3] * 0.35, {f:{as:"bowel"}})); });
    it.push(E("mass", "Опухоль илеоцекального угла", "tumor", 106, 150, 40, 36, {wob:.12, seed:61, f:{lab:true}}), ...specks("ms", "tumorLow", 106, 150, 40, 36, 6, 6, 8, "mass"));
    return {mod:"ct", items:it, orient:"axial"};
  };

  /* ---------- грудная клетка, уровень дуги аорты: масса переднего средостения ---------- */
  S.hl = () => {
    const it = [
      E("body", "Мягкие ткани", "fat", 200, 150, 176, 112, {wob:.02}),
      E("wall", "Мышцы грудной стенки", "muscle", 200, 150, 166, 102, {wob:.02}),
      E("lungR", "Правое лёгкое", "lung", 118, 150, 70, 88, {wob:.03, seed:2, f:{lab:true}}),
      E("lungL", "Левое лёгкое", "lung", 282, 150, 70, 88, {wob:.03, seed:4, f:{lab:true}}),
      E("med", "Средостение", "fat", 200, 140, 42, 82, {wob:.03}),
      ...vertebra(200, 218),
      E("stern", "Грудина", "bone", 200, 42, 18, 7, {f:{lab:true}}),
      E("svc", "Верхняя полая вена", "vessel", 178, 122, 9, 9, {f:{lab:true}}),
      E("arch", "Дуга аорты", "vessel", 214, 128, 30, 11, {rot:40, f:{lab:true}}),
      E("trachea", "Трахея", "air", 200, 160, 11, 11, {f:{lab:true}}),
      E("eso", "Пищевод", "soft", 208, 184, 6, 5),
      E("mass", "Конгломерат лимфоузлов переднего средостения", "tumor", 198, 82, 54, 28, {wob:.1, seed:71, f:{lab:true}}),
      ...ribsRing(200, 150, 166, 102, [140, 165, 195, 215, 325, 345, 15, 40], 8)
    ];
    for (let i = 0; i < 14; i++){ const r = rnd(80 + i); const side = i % 2 ? 282 : 118; it.push(E("lv" + i, "Сосуд лёгкого", "vessel", side + (r() - 0.5) * 90, 150 + (r() - 0.5) * 120, 2, 2, {f:{as:i % 2 ? "lungL" : "lungR", deco:true}})); }
    return {mod:"ct", items:it, orient:"axial"};
  };

  /* ---------- межрёберный промежуток (схема, разрез сверху вниз): плевральная пункция ---------- */
  S.tlbl = () => {
    const it = [
      P("skin", "Кожа", "skin", rect(0, 0, 40, 300)),
      P("fat", "Подкожная клетчатка", "fat", rect(40, 0, 40, 300), {lab:true}),
      P("ic", "Межрёберные мышцы", "muscle", rect(80, 0, 52, 300), {lab:true}),
      P("pleura", "Плевра", "pleura", rect(132, 0, 5, 300)),
      P("eff", "Плевральный выпот", "fluid", rect(137, 0, 110, 300), {lab:true}),
      E("lung", "Поджатое лёгкое", "lung", 320, 150, 80, 170, {wob:.04, f:{lab:true}})
    ];
    [40, 160, 280].forEach((y, i) => {
      it.push(E("rib" + i, "Ребро", "bone", 106, y, 24, 22, {f:{as:"rib", lab:i === 1}}));
      it.push(E("v" + i, "Межрёберная вена", "vein", 98, y + 27, 4, 3, {f:{as:"nvb"}}), E("a" + i, "Межрёберная артерия", "vessel", 107, y + 28, 3.5, 3, {f:{as:"nvb", lab:i === 0}}), E("n" + i, "Межрёберный нерв", "nerve", 116, y + 28, 3, 3, {f:{as:"nvb"}}));
    });
    return {mod:"diag", items:it, orient:"wall", body:"skin"};
  };

  /* ---------- задняя черепная ямка, МРТ Т1 с контрастом ---------- */
  S.mb = () => {
    const it = [
      E("scalp", "Мягкие ткани головы", "fat", 200, 150, 150, 136, {wob:.01}),
      E("skull", "Кости черепа", "bone", 200, 150, 142, 128, {wob:.01}),
      E("brain", "Мозг", "brain", 200, 150, 134, 120, {wob:.02}),
      E("tempR", "Височная доля", "brain", 108, 108, 46, 42, {f:{as:"brain"}}), E("tempL", "Височная доля", "brain", 292, 108, 46, 42, {f:{as:"brain"}}),
      E("hornR", "Расширенный височный рог", "csf", 120, 116, 13, 9, {rot:30, f:{lab:true, as:"vent"}}), E("hornL", "Расширенный височный рог", "csf", 280, 116, 13, 9, {rot:-30, f:{as:"vent"}}),
      E("clivus", "Скат", "bone", 200, 78, 30, 12),
      E("pons", "Мост", "brain", 200, 120, 36, 26, {f:{lab:true}}),
      E("basilar", "Базилярная артерия", "vessel", 200, 96, 4, 4),
      E("cbR", "Полушарие мозжечка", "brain", 148, 200, 52, 44, {wob:.03, f:{lab:true}}), E("cbL", "Полушарие мозжечка", "brain", 252, 200, 52, 44, {wob:.03}),
      E("v4", "IV желудочек", "csf", 200, 160, 10, 6),
      E("mass", "Опухоль червя мозжечка", "tumor", 200, 196, 34, 31, {wob:.07, seed:91, f:{lab:true}}), ...specks("ms", "tumorHi", 200, 196, 34, 31, 7, 5, 9, "mass"),
      E("sinus", "Венозный синус", "vessel", 200, 268, 18, 5)
    ];
    return {mod:"mri", items:it, orient:"axial"};
  };

  /* ---------- рентген черепа сбоку: «штампованные» литические очаги ---------- */
  S.lch = () => {
    const it = [
      E("soft", "Мягкие ткани", "soft", 200, 140, 168, 130, {wob:.01}),
      E("vault", "Свод черепа", "bone", 205, 120, 150, 105, {wob:.01, f:{lab:true}}),
      E("inner", "Полость черепа", "soft", 205, 124, 138, 93, {wob:.01, f:{as:"brainShadow"}}),
      E("face", "Лицевой череп", "bone", 96, 212, 60, 48, {rot:-15}),
      E("orbit", "Глазница", "soft", 84, 186, 20, 16),
      E("sella", "Турецкое седло", "soft", 170, 196, 14, 9, {f:{lab:true}}),
      E("mand", "Нижняя челюсть", "bone", 130, 268, 62, 18, {rot:-12}),
      E("mastoid", "Сосцевидный отросток", "bone", 262, 236, 18, 22, {f:{lab:true}}),
      E("lys1", "Литический очаг", "lucent", 236, 54, 14, 12, {wob:.04, f:{as:"lesion", lab:true}}),
      E("lys2", "Литический очаг", "lucent", 312, 106, 10, 9, {wob:.04, f:{as:"lesion"}}),
      E("lys3", "Деструкция сосцевидного отростка", "lucent", 264, 232, 9, 11, {wob:.08, f:{as:"lesion"}})
    ];
    return {mod:"xray", items:it, orient:"lat"};
  };

  /* ---------- орбиты, аксиальный срез ---------- */
  function orbits(mod, o){
    o = o || {};
    const gR = o.gR || [132, 92], gL = o.gL || [268, 92];
    return [
      E("head", "Мягкие ткани", "fat", 200, 160, 176, 150, {wob:.01}),
      E("base", "Кости основания черепа", "bone", 200, 170, 168, 132, {wob:.01}),
      E("brain", "Мозг", "brain", 200, 236, 120, 62),
      E("orbR", "Клетчатка орбиты", "fat", 140, 118, 46, 58, {rot:-12}), E("orbL", "Клетчатка орбиты", "fat", 260, 118, 46, 58, {rot:12}),
      E("ethm", "Решётчатый лабиринт", "air", 200, 122, 18, 44),
      E("nerveR", "Зрительный нерв", "nerve", 160, 152, 5, 26, {rot:-25}), E("nerveL", "Зрительный нерв", "nerve", 240, 152, 5, 26, {rot:25}),
      E("mrR", "Медиальная прямая мышца", "muscle", 170, 120, 5, 24, {rot:-8}), E("lrR", "Латеральная прямая мышца", "muscle", 106, 124, 5, 26, {rot:12}),
      E("mrL", "Медиальная прямая мышца", "muscle", 230, 120, 5, 24, {rot:8}), E("lrL", "Латеральная прямая мышца", "muscle", 294, 124, 5, 26, {rot:-12}),
      E("globeR", "Правый глаз", mod === "t2" ? "vitreous" : "soft", gR[0], gR[1], 30, 30, {f:{lab:true}}), E("lensR", "Хрусталик", "lens", gR[0], gR[1] - 25, 10, 4),
      E("globeL", "Левый глаз", mod === "t2" ? "vitreous" : "soft", gL[0], gL[1], 30, 30, {f:{lab:true}}), E("lensL", "Хрусталик", "lens", gL[0], gL[1] - 25, 10, 4)
    ];
  }
  // Эмбриональная РМС левой орбиты, верхне-внутренние отделы: глаз смещён кнаружи и вперёд
  S.rms = () => {
    const it = orbits("mri", {gL:[282, 82]});
    it.push(E("mass", "Опухоль орбиты (рабдомиосаркома)", "tumor", 238, 128, 22, 30, {rot:10, wob:.06, seed:101, f:{lab:true}}));
    return {mod:"mri", items:it, orient:"axial"};
  };
  // Двусторонняя ретинобластома, МРТ Т2: справа большая опухоль (группа E), слева небольшой очаг (группа B)
  S.rb = () => {
    const it = orbits("t2");
    it.push(E("massR", "Опухоль правого глаза (группа E)", "tumor", 136, 100, 22, 19, {wob:.12, seed:111, f:{as:"massR", lab:true}}), ...specks("crR", "calc", 136, 100, 22, 19, 6, 2.5, 12, "massR"));
    it.push(E("massL", "Опухоль левого глаза (группа B)", "tumor", 270, 112, 8, 6, {wob:.1, seed:113, f:{lab:true}}));
    return {mod:"t2", items:it, orient:"axial"};
  };

  /* ---------- УЗИ мошонки, поперечно: опухоль правого яичка ---------- */
  S.yst = () => {
    const it = [
      E("scr", "Мошонка", "skin", 200, 150, 176, 112, {wob:.02}),
      E("sub", "Оболочки", "soft", 200, 150, 166, 102, {wob:.02}),
      E("tR", "Правое яичко", "organ", 124, 150, 60, 48, {wob:.03, f:{lab:true}}),
      E("tL", "Левое яичко (норма)", "organ", 280, 150, 40, 30, {wob:.02, f:{lab:true}}),
      E("epiL", "Придаток", "soft", 300, 120, 14, 9),
      E("septum", "Перегородка мошонки", "soft", 200, 150, 4, 90),
      E("mass", "Опухоль правого яичка", "tumor", 122, 152, 44, 37, {wob:.08, seed:121, f:{lab:true}}), ...specks("ms", "tumorLow", 122, 152, 44, 37, 7, 7, 13, "mass")
    ];
    return {mod:"us", items:it, orient:"us"};
  };

  /* ---------- бедро, аксиальная МРТ (правое бедро: медиальная сторона — справа на экране) ---------- */
  function thigh(o){
    const f = o.femur;
    return [
      E("skin", "Кожа и подкожная клетчатка", "fat", 200, 150, 172, 122, {wob:.02}),
      E("vl", "Латеральная широкая мышца", "muscle", 92, 135, 52, 62, {rot:-15, wob:.03, f:{lab:true}}),
      E("rf", "Прямая мышца бедра", "muscle", 196, 58, 36, 26, {wob:.03}),
      E("vi", "Промежуточная широкая мышца", "muscle", 182, 110, 48, 28),
      E("vm", "Медиальная широкая мышца", "muscle", 278, 110, 46, 40, {rot:20}),
      E("add", "Приводящие мышцы", "muscle", 300, 196, 50, 48, {rot:-10}),
      E("ham", "Задняя группа мышц", "muscle", 196, 236, 70, 36),
      E("cortex", "Кортикальный слой", "bone", f[0], f[1], f[2], f[3], {f:{as:"femur", lab:true}}),
      E("marrow", "Костный мозг", "marrow", f[0], f[1], f[2] * 0.62, f[3] * 0.62, {f:{as:"femur"}})
    ];
  }
  // Остеосаркома дистального метафиза: мягкотканный компонент кпереди и латерально; рядом — заворот коленного сустава и подколенный пучок
  S.os = () => {
    const it = thigh({femur:[206, 166, 44, 38]});
    it.push(E("recess", "Верхний заворот коленного сустава", "fluid", 214, 108, 50, 11, {rot:5, f:{lab:true}}));
    it.push(E("mass", "Опухоль: мягкотканный компонент", "tumor", 150, 142, 48, 40, {wob:.1, seed:131, f:{lab:true}}), E("tumbone", "Опухоль в кости", "tumor", 196, 164, 26, 22, {wob:.08, f:{as:"mass"}}));
    it.push(E("popA", "Подколенная артерия", "vessel", 214, 214, 7, 7, {f:{as:"nvb", lab:true}}), E("popV", "Подколенная вена", "vessel", 230, 218, 7, 6, {f:{as:"nvb"}}),
            E("tibN", "Седалищный нерв (большеберцовый)", "nerve", 200, 232, 6, 6, {f:{as:"nvb", lab:true}}), E("perN", "Малоберцовый нерв", "nerve", 158, 226, 5, 5, {f:{as:"nvb"}}));
    return {mod:"mri", items:it, orient:"axial"};
  };
  // Саркома Юинга диафиза: большой мягкотканный компонент вокруг кости
  S.ewing = () => {
    const it = thigh({femur:[206, 158, 28, 28]});
    it.push(E("mass", "Опухоль: мягкотканный компонент", "tumor", 168, 168, 74, 60, {wob:.08, seed:141, f:{lab:true}}), ...specks("ms", "tumorLow", 168, 168, 74, 60, 6, 9, 14, "mass"));
    it.push(E("cortex2", "Кортикальный слой", "bone", 206, 158, 28, 28, {f:{as:"femur"}}), E("marrow2", "Костный мозг (опухоль)", "tumorLow", 206, 158, 17, 17, {f:{as:"femur"}}));
    it.push(E("sfa", "Поверхностная бедренная артерия", "vessel", 292, 136, 7, 7, {f:{as:"nvb", lab:true}}), E("sfv", "Бедренная вена", "vessel", 302, 148, 7, 6, {f:{as:"nvb"}}),
            E("sci", "Седалищный нерв", "nerve", 206, 250, 8, 7, {f:{as:"nvb", lab:true}}));
    return {mod:"mri", items:it, orient:"axial"};
  };

  /* ---------- голень, КТ (костное окно): гнездо остеоидной остеомы ---------- */
  S.oo = () => {
    const it = [
      E("skin", "Кожа и подкожная клетчатка", "fat", 200, 150, 150, 118, {wob:.02}),
      E("ant", "Передняя группа мышц", "muscle", 150, 108, 40, 36, {rot:20}),
      E("post", "Задняя группа мышц", "muscle", 196, 214, 92, 52),
      E("deep", "Глубокие мышцы", "muscle", 186, 168, 46, 26),
      P("tibia", "Большеберцовая кость", "bone", [[196, 56], [262, 92], [252, 154], [204, 166], [168, 126]], {lab:true}),
      E("tmar", "Костномозговой канал", "marrow", 218, 116, 18, 22, {rot:20, f:{as:"tibia"}}),
      E("nidus", "Гнездо остеоидной остеомы", "fluid", 240, 88, 7, 7, {f:{lab:true}}), E("nidC", "Гнездо", "calc", 240, 88, 2.4, 2.4, {f:{as:"nidus"}}),
      E("fibula", "Малоберцовая кость", "bone", 104, 176, 13, 13, {f:{lab:true}}),
      E("ata", "Передние большеберцовые сосуды и глубокий малоберцовый нерв", "vessel", 148, 150, 7, 5, {f:{as:"nvbA", lab:true}}),
      E("pta", "Задние большеберцовые сосуды и большеберцовый нерв", "vessel", 214, 192, 8, 6, {f:{as:"nvbP", lab:true}}),
      E("gsv", "Большая подкожная вена", "vessel", 300, 164, 5, 5, {f:{lab:true}})
    ];
    return {mod:"ct", items:it, orient:"axial"};
  };

  /* ---------- коленный сустав, аксиально над надколенником: выпот в верхнем завороте ---------- */
  S.jia = () => {
    const it = [
      E("skin", "Кожа и подкожная клетчатка", "fat", 200, 150, 164, 118, {wob:.02}),
      E("vl", "Латеральная широкая мышца", "muscle", 84, 140, 38, 52, {rot:-15}),
      E("vm", "Медиальная широкая мышца", "muscle", 316, 140, 38, 52, {rot:15}),
      E("ham", "Мышцы задней поверхности", "muscle", 200, 238, 90, 34),
      E("eff", "Выпот в верхнем завороте", "fluid", 200, 112, 86, 26, {wob:.03, f:{lab:true}}),
      E("quad", "Сухожилие четырёхглавой мышцы", "soft", 200, 70, 46, 10, {f:{lab:true}}),
      E("femur", "Бедренная кость", "bone", 200, 172, 58, 40, {f:{lab:true}}),
      E("fmar", "Бедренная кость", "marrow", 200, 172, 50, 33, {f:{as:"femur"}}),
      E("pop", "Подколенные сосуды", "vessel", 206, 218, 8, 7, {f:{lab:true}})
    ];
    return {mod:"t2", items:it, orient:"axial"};
  };

  /* ---------- поясничный отдел, сагиттально (схема): люмбальная пункция ---------- */
  S.all_lp = () => {
    const it = [P("soft", "Мягкие ткани спины", "fat", rect(0, 0, 400, 300))];
    const lv = ["L1", "L2", "L3", "L4", "L5"], top = 18, h = 36, gap = 8;
    lv.forEach((n, i) => {
      const y = top + i * (h + gap);
      it.push(P("vb" + i, "Тело позвонка " + n, "bone", rect(70, y, 78, h), {as:"bone", lab:i === 2 || i === 3}));
      it.push(P("disc" + i, "Межпозвонковый диск", "disc", rect(70, y + h, 78, gap), {as:"disc"}));
      it.push(P("sp" + i, "Остистый отросток " + n, "bone", [[214, y + 4], [282, y + 16], [282, y + 32], [214, y + 30]], {as:"bone", lab:i === 3}));
    });
    it.push(P("s1", "Крестец", "bone", [[70, 238], [148, 238], [160, 300], [70, 300]], {as:"bone"}));
    it.push(P("lig", "Межостистые связки", "lig", rect(212, 0, 72, 300), {nohit:true}));
    lv.forEach((n, i) => { const y = top + i * (h + gap); it.push(P("sp2" + i, "Остистый отросток " + n, "bone", [[214, y + 4], [282, y + 16], [282, y + 32], [214, y + 30]], {as:"bone"})); });
    it.push(P("sac", "Дуральный мешок (ликвор)", "csf", rect(156, 0, 50, 276), {lab:true}));
    it.push(P("cord", "Спинной мозг и конус", "cord", [[170, 0], [192, 0], [192, 50], [181, 74], [170, 50]], {lab:true}));
    for (let k = 0; k < 5; k++) it.push(P("cau" + k, "Конский хвост", "cord", rect(172 + k * 4, 70, 1.4, 200), {nohit:true}));
    it.push(P("skin", "Кожа", "skin", rect(330, 0, 70, 300)));
    return {mod:"diag", items:it, orient:"sag", body:"skin", labels:{L3:[109, top + 2 * (h + gap) + 22], L4:[109, top + 3 * (h + gap) + 22], L5:[109, top + 4 * (h + gap) + 22], L1:[109, top + 22], L2:[109, top + (h + gap) + 22]}};
  };

  /* ---------- порт под кожей (схема): доступ иглой Губера ---------- */
  S.fn = () => {
    const it = [
      P("air", "Воздух", "air", rect(0, 0, 400, 50), {nohit:true}),
      P("skinL", "Кожа", "skin", rect(0, 50, 400, 12)),
      P("fat", "Подкожная клетчатка", "fat", rect(0, 62, 400, 118)),
      P("musc", "Большая грудная мышца", "muscle", rect(0, 180, 400, 120)),
      P("house", "Корпус порта", "metal", [[128, 104], [272, 104], [286, 178], [114, 178]], {lab:true}),
      P("res", "Камера порта", "fluid", rect(160, 120, 80, 46), {lab:true}),
      P("sept", "Силиконовая мембрана", "septum", rect(156, 98, 88, 22), {lab:true}),
      P("cath", "Катетер", "metal", rect(30, 140, 98, 8))
    ];
    return {mod:"diag", items:it, orient:"port", body:"skinL"};
  };

  /* ---------- мазки (поле зрения микроскопа) ---------- */
  function rbc(id, x, y, r){ return [E(id, "Эритроцит", "rbc", x, y, r, r * 0.96, {n:20, f:{as:"rbc"}}), E(id + "c", "Эритроцит", "rbcPale", x, y, r * 0.42, r * 0.4, {n:14, f:{as:"rbc"}})]; }
  function field(seed, cells, nRbc){
    const r = rnd(seed), it = [E("bg", "Фон", "bg", 200, 150, 150, 150, {n:48, f:{nohit:true}})], occ = cells.map(c => [c.x, c.y, c.r + 6]);
    let tries = 0, n = 0;
    while (n < nRbc && tries++ < 3000){
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 138, x = 200 + Math.cos(a) * d, y = 150 + Math.sin(a) * d, rr = 10 + r() * 2.2;
      if (occ.some(([cx, cy, cr]) => Math.hypot(cx - x, cy - y) < cr + rr - 3)) continue;
      occ.push([x, y, rr]); it.push(...rbc("r" + n, x, y, rr)); n++;
    }
    cells.forEach(c => it.push(...c.draw()));
    return it;
  }
  const blast = (id, x, y, r, as) => ({x, y, r, draw:() => [E(id, "Бласт", "cyto", x, y, r, r * 0.95, {seed:x, wob:.03, f:{as, lab:true}}), E(id + "n", "Бласт", "nucLight", x + 1, y, r * 0.84, r * 0.8, {seed:y, wob:.04, f:{as}}), E(id + "o", "Ядрышко", "nucleolus", x + r * 0.25, y - r * 0.2, r * 0.17, r * 0.15, {f:{as}})]});
  const lymph = (id, x, y, r) => ({x, y, r, draw:() => [E(id, "Малый лимфоцит", "cyto", x, y, r, r, {f:{as:"lymph", lab:true}}), E(id + "n", "Малый лимфоцит", "nuc", x - 0.5, y, r * 0.86, r * 0.84, {seed:x, f:{as:"lymph"}})]});
  const neut = (id, x, y, r) => ({x, y, r, draw:() => [E(id, "Нейтрофил", "neut", x, y, r, r, {f:{as:"neut", lab:true}}), ...[[-5, -3], [1, -5], [5, 2], [-2, 4]].map(([dx, dy], i) => E(id + "l" + i, "Нейтрофил", "nuc", x + dx, y + dy, 3.6, 2.8, {rot:i * 50, f:{as:"neut"}}))]});
  const atyp = (id, x, y) => ({x, y, r:22, draw:() => [E(id, "Атипичный мононуклеар (реактивный лимфоцит)", "cytoDeep", x, y, 23, 19, {wob:.14, seed:x, f:{as:"atyp", lab:true}}), E(id + "n", "Атипичный мононуклеар", "nuc", x - 6, y - 2, 9, 8, {seed:y, f:{as:"atyp"}})]});
  const plt = (id, x, y, r, as, name) => ({x, y, r, draw:() => [E(id, name || "Тромбоцит", "plt", x, y, r, r * 0.8, {wob:.12, seed:x + y, f:{as, lab:r > 5}})]});

  S.all_smear = () => ({mod:"smear", orient:"micro", items:field(201, [blast("b1", 150, 120, 17, "blast"), blast("b2", 262, 186, 16, "blast"), lymph("l1", 236, 92, 10), lymph("l2", 120, 214, 10), blast("b3", 300, 120, 15, "blast")], 46)});
  S.ebv = () => ({mod:"smear", orient:"micro", items:field(211, [atyp("a1", 168, 128), lymph("l1", 250, 100, 10), neut("n1", 262, 196, 13), atyp("a2", 300, 150), lymph("l2", 128, 220, 10)], 44)});
  S.itp = () => ({mod:"smear", orient:"micro", items:field(221, [plt("p1", 180, 150, 8, "giant", "Крупный тромбоцит"), lymph("l1", 260, 110, 10), neut("n1", 130, 220, 13), plt("p2", 286, 214, 7.5, "giant", "Крупный тромбоцит")], 50)});
  S.hlh = () => {
    const mac = {x:196, y:150, r:44, draw:() => [
      E("mac", "Макрофаг с фагоцитированными клетками (гемофагоцит)", "macro", 196, 150, 44, 38, {wob:.08, seed:5, f:{as:"hpc", lab:true}}),
      E("macn", "Ядро макрофага", "nucLight", 178, 168, 14, 11, {f:{as:"hpc"}}),
      ...rbc("in1", 210, 135, 8).map(x => Object.assign(x, {as:"hpc"})), ...rbc("in2", 222, 160, 8).map(x => Object.assign(x, {as:"hpc"})),
      E("innc", "Поглощённая клетка", "nuc", 196, 128, 6, 6, {f:{as:"hpc"}})]};
    const prec = (id, x, y) => ({x, y, r:12, draw:() => [E(id, "Предшественник кроветворения", "cyto", x, y, 12, 11, {f:{as:"prec"}}), E(id + "n", "Предшественник кроветворения", "nuc", x, y, 9, 8, {f:{as:"prec"}})]});
    return {mod:"smear", orient:"micro", items:field(231, [mac, prec("p1", 290, 100), prec("p2", 110, 110), neut("n1", 286, 210, 13), prec("p3", 140, 230)], 34)};
  };

  window.SCENES = S;

  /* ---------- проверка попадания (общая для страницы и tools/check.js) ---------- */
  function inPoly(pts, x, y){
    let ins = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++){
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins;
    }
    return ins;
  }
  function edgeDist(pts, x, y){
    let m = Infinity;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++){
      const [ax, ay] = pts[j], [bx, by] = pts[i], dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l));
      m = Math.min(m, Math.hypot(x - ax - t * dx, y - ay - t * dy));
    }
    return m;
  }
  function top(sc, x, y){
    for (let i = sc.items.length - 1; i >= 0; i--){ const it = sc.items[i]; if (!it.nohit && inPoly(it.pts, x, y)) return it; }
    return null;
  }
  const key = it => it ? (it.as || it.id) : "outside";
  function find(sc, step, p){
    const at = top(sc, p[0], p[1]);
    return {ok:step.target.includes(key(at)), at};
  }
  // игла: a — точка входа, b — кончик. Правила шага: target, forbid, through (ткань, через которую надо пройти до цели),
  // entryZone (где можно входить). Возвращает {ok, probs, tip}.
  function needle(sc, step, a, b){
    const probs = [], hits = [];
    const ta = top(sc, a[0], a[1]);
    let onSkin;
    if (sc.body) onSkin = !ta || ta.id === sc.body;
    else { const body = sc.items.find(it => it.id === "body" || it.id === "skin"); onSkin = !inPoly(body.pts, a[0], a[1]) || edgeDist(body.pts, a[0], a[1]) <= 14; }
    if (!onSkin) probs.push("Начните с кожи: точка входа должна быть на поверхности тела.");
    // entryZone — один многоугольник или список многоугольников
    const zones = step.entryZone ? (Array.isArray(step.entryZone[0][0]) ? step.entryZone : [step.entryZone]) : null;
    if (zones && !zones.some(z => inPoly(z, a[0], a[1]))) probs.push(step.entryMsg || "Неудачная точка входа.");
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(2, Math.ceil(len / 1.5)), d = len / n;
    let reached = false, through = 0;
    for (let i = 0; i <= n; i++){
      const x = a[0] + (b[0] - a[0]) * i / n, y = a[1] + (b[1] - a[1]) * i / n, it = top(sc, x, y), k = key(it);
      if (step.target.includes(k)) reached = true;
      else if (!reached && step.through === k) through += d;
      if (step.forbid.includes(k) && !hits.find(h => h.k === k)) hits.push({k, name:it.name});
    }
    const tip = top(sc, b[0], b[1]), tipOk = step.target.includes(key(tip));
    if (!tipOk) probs.push(`Кончик иглы не в цели, а в структуре «${tip ? tip.name : "вне тела"}».`);
    hits.forEach(h => probs.push(`Игла прошла через «${h.name}».`));
    if (tipOk && step.through && through < (step.throughMin || 10)) probs.push(step.throughMsg || "Путь не прошёл через нужную ткань.");
    return {ok:!probs.length, probs, tip};
  }
  /* ---------- отрисовка ---------- */
  const f1 = v => Math.round(v * 10) / 10;
  function pathD(pts){
    if (pts.length < 8) return "M" + pts.map(p => f1(p[0]) + " " + f1(p[1])).join("L") + "Z";
    const n = pts.length, P = i => pts[(i + n) % n];
    let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
    for (let i = 0; i < n; i++){
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`;
    }
    return d + "Z";
  }
  const centroid = pts => { let x = 0, y = 0; pts.forEach(p => { x += p[0]; y += p[1]; }); return [x / pts.length, y / pts.length]; };
  const ORIENT = {
    axial:[["Пр", 8, 150, "start"], ["Лев", 392, 150, "end"], ["спереди", 200, 14, "middle"]],
    sag:[["голова ↑", 8, 16, "start"], ["спина →", 392, 292, "end"]],
    wall:[["голова ↑", 392, 16, "end"], ["кожа", 8, 292, "start"], ["лёгкое", 392, 292, "end"]],
    us:[["правое", 60, 22, "middle"], ["левое", 340, 22, "middle"]],
    lat:[["лицо ←", 8, 16, "start"]], port:[["кожа сверху", 392, 16, "end"]], micro:[]
  };
  function svg(sc){
    const pal = PAL[sc.mod], dark = !["smear", "diag"].includes(sc.mod);
    let s = `<svg class="scan scan-${sc.mod}" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">`;
    s += sc.mod === "smear" ? `<rect width="400" height="300" fill="#1d1a20"/><clipPath id="mf"><circle cx="200" cy="150" r="148"/></clipPath><g clip-path="url(#mf)"><rect width="400" height="300" fill="${pal.bg}"/>` : `<rect width="400" height="300" fill="${pal.bg}"/><g>`;
    sc.items.forEach(it => { if (it.id !== "bg") s += `<path d="${pathD(it.pts)}" fill="${pal[it.tone] || "#f0f"}"${sc.mod === "diag" ? ` stroke="rgba(0,0,0,.18)" stroke-width=".8"` : ""}/>`; });
    s += `</g>`;
    if (sc.labels) for (const [t, [x, y]] of Object.entries(sc.labels)) s += `<text x="${x}" y="${y}" class="sl" text-anchor="middle">${t}</text>`;
    (ORIENT[sc.orient] || []).forEach(([t, x, y, a]) => s += `<text x="${x}" y="${y}" class="so${dark ? "" : " so-l"}" text-anchor="${a}">${t}</text>`);
    s += `<g class="labs">`;
    const seen = new Set();
    sc.items.forEach(it => { if (!it.lab || seen.has(it.name)) return; seen.add(it.name); const [x, y] = centroid(it.pts); s += `<text x="${f1(x)}" y="${f1(y)}" text-anchor="middle" class="lb">${it.name}</text>`; });
    s += `</g><g class="marks"></g></svg>`;
    return s;
  }
  window.SCAN = {PAL, top, find, needle, inPoly, key, svg, pathD};
})();
