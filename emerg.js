/* Неотложные состояния — мини-игры на время.
   Сценарий — модуль: start() даёт состояние, tick(st, dt) двигает физиологию на dt игровых секунд,
   act(st, id, arg) применяет действие, vitals(st) — монитор, score(st) — оценка по категориям.
   Сообщения сценарий кладёт в st.out ([кто, текст]); движок и интерфейс — в onkodezhurstvo.html.
   Тяжесть состояния — одно число st.s (0 — норма, 100 — остановка кровообращения). */
window.EMERG = window.EMERG || [];

window.EMERG.push((function(){
  const W = 17; // кг: Маша, 4 года (та же пациентка, что в случае «ОЛЛ»)
  const EPI_OK = [0.13, 0.2];   // мг: 0,01 мг/кг = 0,17 мг; по возрасту (6 мес — 6 лет) — 0,15 мг
  const EPI_LOW = 0.08, EPI_MAX = 0.3;

  const say = (st, who, text) => st.out.push([who, text]);
  const ev = (st, mark, text, note) => st.events.push({t:st.t, mark, text, note:note || ""});
  const epiGiven = st => st.epi.some(e => e.k > 0);

  return {
    id: "anaph-peg",
    title: "Анафилаксия на пэгаспаргазу",
    teaser: "20-я минута инфузии: сыпь, кашель, давление падает.",
    p: {n:"Маша", age:"4 года", sex:"ж", w:W, h:104},
    crit: {hr:170, sbp:78, spo2:92, rr:40}, // границы тревоги монитора для 4 лет (САД < 70 + 2 × возраст)
    from: "Консолидация ОЛЛ, пэгаспаргаза в/в капельно через порт.",
    sources: [
      "Клинические рекомендации МЗ РФ «Анафилактический шок», 2020.",
      "Resuscitation Council UK. Emergency treatment of anaphylaxis: guidelines for healthcare providers, 2021.",
      "Cardona V. et al. World Allergy Organization Anaphylaxis Guidance 2020. World Allergy Organ J. 2020.",
      "Инструкция по медицинскому применению препарата Онкаспар (пэгаспаргаза).",
      "Клинические рекомендации МЗ РФ «Острый лимфобластный лейкоз» (дети); протокол ALL-MB 2015."
    ],
    ideal: [
      ["0:00–0:30", "Остановить инфузию пэгаспаргазы, позвать помощь (реаниматолог)."],
      ["до 1:30", "Адреналин в/м в переднебоковую поверхность бедра: 0,01 мг/кг (0,15–0,17 мг = 0,15–0,17 мл 0,1% раствора)."],
      ["сразу", "Уложить, приподнять ноги (при гипотензии не сажать); кислород высоким потоком."],
      ["при гипотензии", "Болюс 0,9% NaCl: 20 мл/кг по КР МЗ РФ (RCUK — 10 мл/кг, с повторной оценкой)."],
      ["через 5 мин", "Нет эффекта — повторить адреналин в/м; после двух доз — инфузия адреналина под контролем реаниматолога."],
      ["после стабилизации", "Антигистаминные — только против кожных симптомов; ГКС — по решению врача, не вместо адреналина. Сальбутамол — при сохраняющемся бронхоспазме."]
    ],
    pearls: [
      "Адреналин в/м — первый и главный препарат. Антигистаминные и ГКС не устраняют шок и бронхоспазм; начать с них — потерять время.",
      "Ампула 0,1% = 1 мг/мл: для ребёнка 17 кг это 0,15–0,17 мл. Ошибка в 10 раз — классика, проговаривайте дозу вслух.",
      "Адреналин в/в струйно 1 мг — только при остановке кровообращения. У ребёнка с пульсом это провоцирует желудочковую тахикардию и гипертонический криз.",
      "При гипотензии ребёнка не сажают и не ставят: внезапная смерть от «пустого желудочка».",
      "После анафилаксии на пэгаспаргазу повторно её не вводят: нужен переход на аспарагиназу Erwinia (в РФ не зарегистрирована) и контроль активности аспарагиназы."
    ],
    post: {
      q: "Маша стабильна. Что дальше с аспарагиназой?",
      o: [
        ["Больше не вводить, перейти на аспарагиназу Erwinia", true,
         "Анафилаксия — противопоказание к повторному введению; дальше — контроль активности аспарагиназы. Erwinia — другой белок, перекрёстной реакции с E. coli нет. В РФ препарат не зарегистрирован: ввоз для конкретного пациента по решению консилиума и федерального центра."],
        ["Продолжить пэгаспаргазу на фоне премедикации", false,
         "После анафилаксии препарат не вводят. Премедикация к тому же может скрыть реакцию и «тихую инактивацию» — без контроля активности её не применяют."],
        ["Перейти на нативную L-аспарагиназу E. coli", false,
         "Это тот же белок E. coli: высокий риск перекрёстной аллергии и инактивации антителами."],
        ["Отменить аспарагиназу до конца лечения", false,
         "Аспарагиназа — один из ключевых препаратов при ОЛЛ; отказ без замены снижает эффективность протокола. Сначала ищут замену."]
      ]
    },

    start(){
      const st = {t:0, s:60, trigger:true, pos:null, o2:false, help:null, icu:null, fluids:[], epi:[], salb:null,
                  ah:null, gcs:null, vt:0, harm:[], out:[], events:[], stable:0, end:null, warned:{}};
      say(st, "nurse", "Маша, 20-я минута инфузии пэгаспаргазы. Покраснела, чешется, кашляет и говорит, что «тяжело дышать»!");
      say(st, "exam", "Генерализованная крапивница, отёк губ. Свистящие хрипы с обеих сторон. Бледная, вялая, на вопросы отвечает односложно. Конечности прохладные.");
      return st;
    },

    vitals(st){
      const s = st.s, fl = st.fluids.some(f => f.ok && st.t - f.t < 600) ? 8 : 0;
      let hr = Math.round(105 + s * 0.75), sbp = Math.round(108 - s * 0.6 + fl);
      const sp = Math.min(100, Math.round(99 - s * 0.13 + (st.o2 ? 5 : 0) + (st.salb !== null && st.t - st.salb < 600 ? 1 : 0)));
      const rr = Math.round(22 + s * 0.3 - (st.salb !== null && st.t - st.salb < 600 ? 4 : 0));
      if (st.epi.some(e => e.hi && st.t - e.t < 180)) hr += 30;
      const vt = st.vt > st.t;
      return {hr: vt ? 230 : Math.min(hr, 190), rhythm: vt ? "ЖТ" : "", sbp: Math.max(sbp, 40), dbp: Math.max(Math.round(sbp * 0.55), 20), spo2: sp, rr};
    },

    tick(st, dt){
      // после остановки введения и эффективной дозы адреналина реакция постепенно стихает, без адреналина — нарастает
      let ds = st.trigger ? 0.22 : st.epi.some(e => e.k >= 0.6 && !e.iv) ? -0.02 : 0.07;
      if (st.pos === "supine") ds -= 0.02;
      if (st.pos === "sit") ds += 0.05;
      if (st.o2) ds -= 0.01;
      for (const e of st.epi){ const a = st.t - e.t; if (a >= 20 && a < 140) ds -= 0.4 * e.k; }
      for (const f of st.fluids){ const a = st.t - f.t; if (f.ok && a >= 0 && a < 300) ds -= 0.05; }
      if (st.salb !== null && st.t - st.salb < 120) ds -= 0.02;
      if (st.icu !== null && st.t >= st.icu) ds -= 0.3;
      st.s = Math.max(0, Math.min(100, st.s + ds * dt));

      // реаниматолог приходит через 2 минуты после вызова и, если нужно, начинает инфузию адреналина
      if (st.help !== null && st.icu === null && st.t >= st.help + 120 && !st.warned.icuIn){
        st.warned.icuIn = true;
        if (st.s > 45 && st.epi.length >= 1){
          st.icu = st.t;
          say(st, "cons", "Реаниматолог на месте: «Ответ на адреналин недостаточный — начинаю инфузию адреналина через порт, забираем под наблюдение»."); ev(st, "mid", "Реаниматолог начал инфузию адреналина", "Рефрактерная анафилаксия");
        } else say(st, "cons", "Реаниматолог на месте: «Вижу, адреналин сделан. Продолжайте, я рядом».");
      }
      if (st.warned.icuIn && st.icu === null && st.s > 60 && st.epi.length){
        st.icu = st.t;
        say(st, "cons", "Реаниматолог: «Снова ухудшается — начинаю инфузию адреналина, забираем в реанимацию»."); ev(st, "mid", "Реаниматолог начал инфузию адреналина", "Повторное ухудшение");
      }
      if (st.s > 80 && !st.warned.bad){ st.warned.bad = true; say(st, "nurse", "Она почти не отвечает! Губы синеют!"); }
      if (st.s > 70 && st.help === null && !st.warned.help){ st.warned.help = true; say(st, "nurse", "Может, позвать реаниматолога?"); }
      const eff = st.epi.find(e => e.k > 0 && st.t - e.t >= 40 && !e.said);
      if (eff){ eff.said = true; say(st, "nurse", st.s < 50 ? "Сыпь бледнеет, дышит легче, давление поднимается." : "После адреналина чуть лучше, но давление всё ещё низкое."); }
      const last = st.epi[st.epi.length - 1];
      if (last && last.k > 0 && st.t - last.t >= 300 && st.s > 45 && !last.nudged){ last.nudged = true; say(st, "nurse", "Прошло 5 минут после адреналина, а лучше почти не стало."); }

      if (st.s >= 100){ st.end = "dead"; say(st, "nurse", "Пульс не определяется! Остановка кровообращения — реанимационная бригада начинает СЛР."); ev(st, "bad", "Остановка кровообращения", ""); return; }
      if (st.s <= 20 && !st.trigger) st.stable += dt; else st.stable = 0;
      if (st.t >= 1800 && !st.end){ st.end = "icu"; say(st, "nurse", "Прошло 30 минут, состояние так и не стабилизировалось — переводим в реанимацию."); ev(st, "warn", "Перевод в реанимацию по времени", "За 30 минут не удалось стабилизировать"); return; }
      if (st.stable >= 90){ st.end = st.icu !== null ? "icu" : "ok"; say(st, "nurse", "Маша порозовела, отвечает, давление в норме. Перевожу на мониторное наблюдение."); }
    },

    // cost — сколько игровых секунд занимает действие; once — можно сделать один раз
    actions: [
      {id:"stop", label:"Остановить инфузию", cost:5, once:true},
      {id:"help", label:"Позвать реаниматолога", cost:5, once:true},
      {id:"epi", label:"Адреналин…", cost:30, ask:"epi"},
      {id:"supine", label:"Уложить, приподнять ноги", cost:10, once:true, group:"pos"},
      {id:"sit", label:"Усадить", cost:10, once:true, group:"pos"},
      {id:"o2", label:"Кислород через маску", cost:15, once:true},
      {id:"nacl20", label:"Болюс 0,9% NaCl 20 мл/кг", cost:30, group:"fl"},
      {id:"nacl10", label:"Болюс 0,9% NaCl 10 мл/кг", cost:30, group:"fl"},
      {id:"glu", label:"Болюс 5% глюкозы 20 мл/кг", cost:30, group:"fl"},
      {id:"salb", label:"Сальбутамол через небулайзер", cost:30, once:true},
      {id:"ah", label:"Хлоропирамин в/в", cost:30, once:true},
      {id:"gcs", label:"Преднизолон в/в", cost:30, once:true}
    ],
    epiRoutes: [["im","в/м, в бедро"], ["sc","п/к"], ["iv","в/в струйно"]],

    act(st, id, arg){
      const before = !epiGiven(st);
      switch (id){
        case "stop":
          st.trigger = false; say(st, "you", "Останавливаю инфузию пэгаспаргазы.");
          ev(st, st.t <= 30 ? "ok" : "warn", "Инфузия остановлена", st.t <= 30 ? "" : "Поздно: каждая минута инфузии усиливает реакцию"); break;
        case "help":
          st.help = st.t; say(st, "you", "Зовите реаниматолога, срочно!"); say(st, "nurse", "Вызвала, будет через пару минут.");
          ev(st, "ok", "Вызван реаниматолог", ""); break;
        case "supine":
          st.pos = "supine"; say(st, "you", "Укладываем, ноги приподнять."); ev(st, "ok", "Уложили, приподняли ноги", ""); break;
        case "sit":
          st.pos = "sit"; say(st, "you", "Усадите её, так легче дышать."); say(st, "nurse", "Посадила… она бледнеет ещё сильнее.");
          ev(st, "bad", "Усадили при гипотензии", "При шоке не сажают: падает венозный возврат, риск остановки"); break;
        case "o2":
          st.o2 = true; say(st, "you", "Кислород через маску, высокий поток."); ev(st, "ok", "Кислород", ""); break;
        case "nacl20": case "nacl10": {
          const v = id === "nacl20" ? 20 : 10;
          st.fluids.push({t:st.t, ok:true}); say(st, "you", `0,9% NaCl ${v} мл/кг — ${v * W} мл струйно через порт.`);
          ev(st, "ok", `Болюс 0,9% NaCl ${v} мл/кг`, v === 20 ? "Так по КР МЗ РФ" : "Так по RCUK 2021; при сохранении гипотензии — повторить"); break; }
        case "glu":
          st.fluids.push({t:st.t, ok:false}); say(st, "you", `5% глюкоза 20 мл/кг — ${20 * W} мл.`);
          ev(st, "bad", "Болюс 5% глюкозы", "Глюкоза не восполняет объём: для шока — кристаллоиды (0,9% NaCl)"); break;
        case "salb":
          st.salb = st.t; say(st, "you", "Сальбутамол через небулайзер.");
          ev(st, before ? "warn" : "ok", "Сальбутамол", before ? "Бронхоспазм при анафилаксии сначала лечат адреналином" : "Уместно при сохраняющемся бронхоспазме"); break;
        case "ah":
          st.ah = st.t; say(st, "you", "Хлоропирамин в/в.");
          ev(st, before ? "bad" : "mid", "Антигистаминный препарат", before ? "До адреналина — потеря времени: шок и бронхоспазм он не снимает" : "Только против кожных симптомов, после стабилизации"); break;
        case "gcs":
          st.gcs = st.t; say(st, "you", "Преднизолон в/в.");
          ev(st, before ? "bad" : "mid", "Глюкокортикостероид", before ? "До адреналина — потеря времени: действует через часы" : "Не вместо адреналина; по решению врача"); break;
        case "epi": {
          const mg = arg.mg, route = arg.route, kg = mg / W;
          const txt = `Адреналин ${String(mg).replace(".", ",")} мг ${route === "im" ? "в/м в бедро" : route === "sc" ? "п/к" : "в/в струйно"}`;
          say(st, "you", `${txt} (${String(+mg.toFixed(3)).replace(".", ",")} мл 0,1% раствора).`);
          const prev = st.epi[st.epi.length - 1];
          const early = prev && prev.k > 0 && st.t - prev.t < 240;
          if (route === "iv"){
            st.epi.push({t:st.t, k:0.5, iv:true}); st.s = Math.min(100, st.s + 25); st.vt = st.t + 60; st.harm.push("iv");
            say(st, "nurse", "На мониторе широкие комплексы, ЧСС 230! Давление скачет!");
            ev(st, "bad", txt, "Струйно в/в — только при остановке кровообращения. У ребёнка с пульсом — желудочковая тахикардия"); break;
          }
          let k = 1, mark = "ok", note = "0,01 мг/кг — верно";
          if (mg > EPI_MAX){ k = 1; mark = "bad"; note = `${(kg).toFixed(3).replace(".", ",")} мг/кг — передозировка (норма 0,01 мг/кг, у детей до 6 лет 0,15 мг)`; st.harm.push("over"); }
          else if (mg > EPI_OK[1]){ mark = "warn"; note = "Доза выше 0,01 мг/кг — тахикардия; для 17 кг — 0,15–0,17 мг"; }
          else if (mg < EPI_LOW){ k = 0.3; mark = "bad"; note = "Слишком мало — эффекта почти нет"; }
          else if (mg < EPI_OK[0]){ k = 0.6; mark = "warn"; note = "Ниже 0,01 мг/кг — эффект слабее"; }
          if (route === "sc"){ k *= 0.5; mark = mark === "ok" ? "warn" : mark; note = "П/к всасывается медленнее — нужен в/м в бедро"; }
          st.epi.push({t:st.t, k, hi: mg > EPI_OK[1]});
          if (early) note += (note ? ". " : "") + "Повтор раньше 5 минут";
          ev(st, mark, txt, note); break;
        }
      }
    },

    // оценка по категориям, как на олимпиаде: каждая 0–100, итог — взвешенная сумма
    score(st){
      const at = text => { const e = st.events.find(x => x.text.startsWith(text)); return e ? e.t : null; };
      const firstEpi = st.epi.find(e => e.k >= 0.6 && !e.iv);
      const tStop = at("Инфузия остановлена");
      const speed = (tStop === null ? 0 : tStop <= 30 ? 50 : tStop <= 90 ? 25 : 10) +
                    (!firstEpi ? 0 : firstEpi.t <= 90 ? 50 : firstEpi.t <= 180 ? 30 : firstEpi.t <= 300 ? 10 : 0);
      const e0 = st.epi[0];
      const drugs = (!e0 ? 0 : e0.iv ? 0 : e0.k === 1 && !e0.hi ? 50 : 25) +
                    (st.fluids.some(f => f.ok) ? 30 : 0) + (st.o2 ? 20 : 0) - (st.fluids.some(f => !f.ok) ? 15 : 0);
      const fe = st.epi.length ? st.epi[0].t : Infinity;
      const order = 100 - (st.ah !== null && st.ah < fe ? 40 : 0) - (st.gcs !== null && st.gcs < fe ? 30 : 0) -
                    (st.pos === "sit" ? 30 : 0) - (st.pos === null ? 15 : 0) - (st.help === null ? 15 : 0);
      const safety = 100 - st.harm.filter(h => h === "iv").length * 60 - st.harm.filter(h => h === "over").length * 30;
      const outcome = st.end === "ok" ? 100 : st.end === "icu" ? 70 : 0;
      const cats = [
        ["Скорость", speed, 25], ["Препараты и дозы", drugs, 25], ["Порядок действий", order, 15],
        ["Безопасность", safety, 15], ["Исход", outcome, 20]
      ].map(([n, v, w]) => [n, Math.max(0, Math.min(100, v)), w]);
      return {cats, total: Math.round(cats.reduce((a, c) => a + c[1] * c[2], 0) / 100)};
    }
  };
})());
