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
    clock: "23:40", // время начала — для часов на табло
    title: "Анафилаксия на пэгаспаргазу",
    teaser: "20-я минута инфузии: сыпь, кашель, давление падает.",
    p: {n:"Маша", age:"4 года", sex:"ж", w:W, h:104, look:{age:"kid",sex:"ж",hair:"pony",hc:"#8a5a3b",skin:"pale",mood:"crying",marks:[],bg:"#f2dfe4"}},
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
      ["первые 30 с", "Остановить инфузию пэгаспаргазы, позвать помощь (реаниматолог)."],
      ["до 1,5 мин", "Адреналин в/м в переднебоковую поверхность бедра: 0,01 мг/кг (0,15–0,17 мг = 0,15–0,17 мл 0,1% раствора)."],
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
      {id:"epi", label:"Адреналин…", cost:30, ask:{kind:"dose", title:"Адреналин · ампула 0,1% = 1 мг/мл", unit:"мг", routes:[["im","в/м, в бедро"], ["sc","п/к"], ["iv","в/в струйно"]]}},
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

/* ---------- Септический шок при фебрильной нейтропении ----------
   Время в минутах: speed 20 — 20 игровых секунд за реальную. Тяжесть st.s, как в анафилаксии. */
window.EMERG.push((function(){
  const W = 21;
  const say = (st, who, text) => st.out.push([who, text]);
  const ev = (st, mark, text, note) => st.events.push({t:st.t, mark, text, note:note || ""});
  // антибиотик: [насколько подходит, отметка, подпись, комментарий]
  const ABX = {
    mero2:[1, "ok", "Меропенем + ванкомицин", "В шоке при нейтропении — карбапенем; ванкомицин — при подозрении на катетерную инфекцию и нестабильной гемодинамике"],
    mero:[0.9, "ok", "Меропенем", "Верно; при ознобе после промывания порта и шоке стоит добавить ванкомицин"],
    cefep:[0.7, "warn", "Цефепим", "Антисинегнойный β-лактам подходит стабильному пациенту; в шоке предпочтителен карбапенем"],
    ceftr:[0.2, "bad", "Цефтриаксон", "Нет антисинегнойной активности — при нейтропении не подходит"],
    vanc:[0.2, "bad", "Ванкомицин", "Монотерапия ванкомицином не покрывает грамотрицательную флору"],
    amox:[0.1, "bad", "Амоксициллин/клавуланат внутрь", "Пероральный препарат без антисинегнойной активности при шоке недопустим"]
  };
  // шок «рефрактерный к жидкости» оценивают, когда последний болюс уже подействовал
  const fluidsDone = st => { const f = st.fluids[st.fluids.length - 1]; return !f || st.t - f.t >= 600; };
  const FL = {n20:[20, 1, "ok", "0,9% NaCl 20 мл/кг"], n10:[10, 0.5, "ok", "0,9% NaCl 10 мл/кг"], alb:[5, 0.3, "warn", "Альбумин 20% 5 мл/кг"], glu:[20, 0, "bad", "5% глюкоза 20 мл/кг"]};
  return {
    id:"sepsis-fn", clock:"02:40", title:"Септический шок при фебрильной нейтропении",
    teaser:"02:40. Озноб после промывания порта, 8-й день после курса.",
    p:{n:"Марк", age:"6 лет", sex:"м", w:W, h:118, look:{age:"kid", sex:"м", hair:"bald", hc:"#8a6b55", skin:"pale", mood:"sleepy", marks:["port"], bg:"#e3ebf3"}},
    from:"ОЛЛ, консолидация, 8-й день после курса. Порт-система. Ночная смена.",
    speed:20, waitSec:300, waitLabel:"5 мин",
    sources:[
      "Lehrnbecher T. et al. Guideline for the management of fever and neutropenia in pediatric patients with cancer and hematopoietic cell transplantation recipients: 2023 update. J Clin Oncol. 2023.",
      "Weiss S.L. et al. Surviving Sepsis Campaign international guidelines for the management of septic shock and sepsis-associated organ dysfunction in children. Pediatr Crit Care Med. 2020.",
      "Mermel L.A. et al. Clinical practice guidelines for the diagnosis and management of intravascular catheter-related infection: IDSA update. Clin Infect Dis. 2009."
    ],
    ideal:[
      ["0–5 мин", "Кислород, вызвать реаниматолога. Посевы крови из всех просветов порта и из вены — не задерживая антибиотик."],
      ["до 60 мин", "Меропенем; при подозрении на катетерную инфекцию и нестабильности — плюс ванкомицин."],
      ["первый час", "Болюсы 0,9% NaCl 10–20 мл/кг, после каждого — оценка (хрипы, печень, SpO₂), всего до 40–60 мл/кг."],
      ["шок сохраняется", "Адреналин или норадреналин — в реанимации, после восполнения объёма."],
      ["не делать", "Не ждать посевов, не давать цефтриаксон и глюкозу для восполнения объёма, не перегружать жидкостью."]
    ],
    pearls:[
      "При фебрильной нейтропении с шоком антибиотик — в течение часа: каждый час задержки повышает смертность.",
      "В шоке у нейтропеничного ребёнка — карбапенем; ванкомицин добавляют при подозрении на катетерную инфекцию, инфекции кожи, пневмонии или нестабильности.",
      "Жидкость — болюсами по 10–20 мл/кг с оценкой после каждого. Хрипы и рост печени — сигнал остановиться.",
      "Озноб сразу после промывания порта — признак катетер-ассоциированной бактериемии."
    ],
    post:{q:"Марк стабилен. В посеве крови из порта — Pseudomonas aeruginosa. Что с портом?", o:[
      ["Удалить порт", true, "При бактериемии Pseudomonas, S. aureus, грибами, туннельной инфекции и упорной бактериемии катетер удаляют."],
      ["Оставить порт и продлить курс антибиотика", false, "При Pseudomonas сохранение катетера связано с рецидивами и неудачей лечения."],
      ["Оставить порт с этаноловым замком", false, "Этаноловый замок не заменяет удаление при Pseudomonas."],
      ["Сразу поставить новый порт через ту же вену", false, "Новый катетер ставят после очищения кровотока, а не в разгар бактериемии."]]},
    start(){
      const st = {t:0, s:62, abx:null, abxK:0, cult:null, help:null, icu:null, o2:false, vol:0, fluids:[], vaso:null, glu:false, over:false, vasoEarly:false, harm:[], out:[], events:[], stable:0, end:null, warned:{}};
      say(st, "nurse", "У Марка 38,9, его трясёт. Озноб начался через десять минут после промывания порта.");
      say(st, "exam", "Вялый, конечности холодные, кожа мраморная, наполнение капилляров 4 с. Мукозит 2-й степени. Место порта спокойное.");
      return st;
    },
    cells(st){
      const s = st.s, fl = st.fluids.some(f => st.t - f.t < 900 && f.k > 0) ? 6 : 0;
      const hr = Math.round(100 + s * 0.8), sbp = Math.max(40, Math.round(116 - s * 0.55 + fl)), dbp = Math.round(sbp * 0.55);
      const spo2 = Math.min(100, Math.round(99 - s * 0.07 + (st.o2 ? 3 : 0) - (st.over ? 7 : 0)));
      const crt = s > 55 ? 4 : s > 35 ? 3 : 2;
      return [{n:"ЧСС", val:hr, unit:"уд/мин", crit:hr >= 160}, {n:"АД", val:`${sbp}/${dbp}`, unit:"мм рт. ст.", crit:sbp < 82},
              {n:"SpO₂", val:spo2, unit:"%", crit:spo2 < 92}, {n:"Капилляры", val:crt + " с", unit:"наполнение", crit:crt >= 3}];
    },
    tick(st, dt){
      let ds = 0.010;
      if (st.abx !== null && st.t - st.abx > 900) ds = st.abxK >= 0.7 ? -0.006 * st.abxK : 0.006;
      for (const f of st.fluids){ const a = st.t - f.t; if (a >= 0 && a < 600) ds -= f.k * 0.0167; }
      if (st.vaso !== null && st.s > 25) ds -= 0.02;
      if (st.icu !== null && st.s > 25) ds -= 0.012;
      if (st.o2) ds -= 0.001;
      if (st.over) ds += 0.004;
      st.s = Math.max(0, Math.min(100, st.s + ds * dt));
      if (st.help !== null && st.t >= st.help + 600 && !st.warned.icuIn){
        st.warned.icuIn = true;
        if (st.s > 50 && st.vol >= 40 && fluidsDone(st)){ st.icu = st.t; say(st, "cons", "Реаниматолог: «Шок не отвечает на жидкость — начинаю адреналин, забираем в реанимацию»."); ev(st, "mid", "Реаниматолог начал вазоактивную поддержку", "Шок, рефрактерный к жидкости"); }
        else if (st.s > 50 && st.vol < 40) say(st, "cons", "Реаниматолог: «Пока мало объёма — ещё болюс, и я начну адреналин, если не поможет»." );
        else say(st, "cons", "Реаниматолог: «Вижу, стабилизируете. Я рядом».");
      }
      if (st.warned.icuIn && st.icu === null && st.s > 55 && st.vol >= 40 && fluidsDone(st)){ st.icu = st.t; say(st, "cons", "Реаниматолог: «Начинаю адреналин, забираем в реанимацию»."); ev(st, "mid", "Реаниматолог начал вазоактивную поддержку", "Шок, рефрактерный к жидкости"); }
      if (st.vol > 60 && !st.over){ st.over = true; st.harm.push("over"); say(st, "nurse", "В лёгких хрипы, печень увеличилась, сатурация падает!"); ev(st, "bad", "Перегрузка жидкостью", "Больше 60 мл/кг без оценки после болюсов"); }
      if (st.abx === null && st.t > 3600 && !st.warned.abx){ st.warned.abx = true; say(st, "nurse", "Прошёл час — антибиотика всё ещё нет!"); }
      if (st.s > 85 && !st.warned.bad){ st.warned.bad = true; say(st, "nurse", "Марк не отвечает, давление 60 на 30!"); }
      if (st.s >= 100){ st.end = "dead"; say(st, "nurse", "Пульс не определяется! Начинаем СЛР."); ev(st, "bad", "Остановка кровообращения", ""); return; }
      if (st.t >= 7200){ st.end = "icu"; say(st, "nurse", "Прошло два часа, шок не разрешился — переводим в реанимацию."); return; }
      if (st.s <= 30 && st.abx !== null && st.abxK >= 0.7) st.stable += dt; else st.stable = 0;
      if (st.stable >= 600){ st.end = st.icu !== null ? "icu" : "ok"; say(st, "nurse", "Давление 98/56, руки тёплые, Марк открыл глаза."); }
    },
    actions:[
      {id:"o2", label:"Кислород через маску", cost:30, once:true},
      {id:"help", label:"Позвать реаниматолога", cost:60, once:true},
      {id:"cult", label:"Посевы крови: порт и вена", cost:180, once:true},
      {id:"abx", label:"Антибиотик…", cost:120, once:true, ask:{kind:"choice", title:"Эмпирический антибиотик", options:Object.entries(ABX).map(([k, v]) => [k, v[2]])}},
      {id:"bolus", label:"Болюс жидкости…", cost:300, ask:{kind:"choice", title:"Болюс", options:Object.entries(FL).map(([k, v]) => [k, `${v[3]} — ${v[0] * W} мл`])}},
      {id:"vaso", label:"Начать адреналин инфузией", cost:120, once:true},
      {id:"para", label:"Парацетамол", cost:60, once:true},
      {id:"gcsf", label:"Г-КСФ", cost:60, once:true}
    ],
    act(st, id, arg){
      if (id === "o2"){ st.o2 = true; say(st, "you", "Кислород через маску."); ev(st, "ok", "Кислород", ""); }
      if (id === "help"){ st.help = st.t; say(st, "you", "Срочно реаниматолога!"); ev(st, "ok", "Вызван реаниматолог", ""); }
      if (id === "cult"){ st.cult = st.t; say(st, "you", "Посевы крови из всех просветов порта и из периферической вены.");
        ev(st, st.abx === null ? "ok" : "warn", "Посевы крови", st.abx === null ? "До антибиотика — верно" : "После антибиотика посевы менее информативны"); }
      if (id === "abx"){
        const [k, mark, label, note] = ABX[arg.v];
        st.abx = st.t; st.abxK = k;
        say(st, "you", `${label} в/в.`);
        ev(st, st.t > 3600 && mark === "ok" ? "warn" : mark, label, note + (st.t > 3600 ? ". Позже часа от начала шока" : ""));
      }
      if (id === "bolus"){
        const [ml, k, mark, label] = FL[arg.v];
        st.vol += k > 0 ? ml : 0; st.fluids.push({t:st.t, k});
        if (arg.v === "glu"){ st.glu = true; st.harm.push("glu"); }
        say(st, "you", `${label} — ${ml * W} мл.`);
        ev(st, mark, label, arg.v === "glu" ? "Глюкоза не восполняет объём при шоке" : arg.v === "alb" ? "Для начальной инфузии — кристаллоиды" : `Всего ${st.vol} мл/кг`);
      }
      if (id === "vaso"){ st.vaso = st.t; if (st.vol < 40) st.vasoEarly = true; say(st, "you", "Адреналин инфузией через порт.");
        ev(st, st.vol < 40 ? "warn" : "ok", "Адреналин инфузией", st.vol < 40 ? "Вазоактивные — после 40–60 мл/кг жидкости" : "При шоке, рефрактерном к жидкости"); }
      if (id === "para"){ say(st, "you", "Парацетамол."); ev(st, "mid", "Парацетамол", "Для комфорта; шок не лечит"); }
      if (id === "gcsf"){ say(st, "you", "Г-КСФ."); ev(st, "mid", "Г-КСФ", "Рутинно при фебрильной нейтропении не рекомендуется"); }
    },
    score(st){
      const firstBolus = st.fluids.find(f => f.k > 0);
      const speed = (st.abx === null ? 0 : st.abx <= 3600 ? 60 : st.abx <= 5400 ? 30 : 0) + (!firstBolus ? 0 : firstBolus.t <= 600 ? 40 : firstBolus.t <= 1200 ? 20 : 0);
      const drugs = st.abxK * 60 + (st.vol >= 20 && st.vol <= 60 ? 40 : st.vol > 0 ? 20 : 0);
      const order = (st.cult === null ? 0 : st.abx === null || st.cult <= st.abx ? 40 : 20) + (st.help !== null ? 30 : 0) + (st.o2 ? 30 : 0);
      const safety = 100 - (st.over ? 40 : 0) - (st.glu ? 40 : 0) - (st.vasoEarly ? 20 : 0) - (st.abx !== null && st.abxK < 0.5 ? 20 : 0);
      const outcome = st.end === "ok" ? 100 : st.end === "icu" ? 70 : 0;
      const cats = [["Скорость", speed, 25], ["Препараты и дозы", drugs, 25], ["Порядок действий", order, 15], ["Безопасность", safety, 15], ["Исход", outcome, 20]].map(([n, v, w]) => [n, Math.max(0, Math.min(100, Math.round(v))), w]);
      return {cats, total:Math.round(cats.reduce((a, c) => a + c[1] * c[2], 0) / 100)};
    }
  };
})());

/* ---------- Гиперкалиемия при синдроме лизиса опухоли ---------- */
window.EMERG.push((function(){
  const W = 22;
  const say = (st, who, text) => st.out.push([who, text]);
  const ev = (st, mark, text, note) => st.events.push({t:st.t, mark, text, note:note || ""});
  const ECG = ["норма", "высокие T", "широкий QRS", "синусоида", "ФЖ"];
  const stage = st => { const e = st.K - st.prot; return e < 6 ? 0 : e < 7 ? 1 : e < 7.5 ? 2 : e < 8 ? 3 : 4; };
  return {
    id:"hyperk-tls", clock:"03:15", title:"Гиперкалиемия при синдроме лизиса опухоли",
    teaser:"Первые сутки лечения. Мочи мало, на мониторе — высокие зубцы T.",
    p:{n:"Тимур", age:"7 лет", sex:"м", w:W, h:122, look:{age:"child", sex:"м", hair:"short", hc:"#1f1813", skin:"olive", mood:"pain", marks:[], bg:"#f3e2d3"}},
    from:"Лимфома Беркитта, префаза COP, первые сутки. Гипергидратация, расбуриказа введена.",
    speed:20, waitSec:300, waitLabel:"5 мин",
    sources:[
      "Coiffier B. et al. Guidelines for the management of pediatric and adult tumor lysis syndrome: an evidence-based review. J Clin Oncol. 2008.",
      "Cairo M.S. et al. Recommendations for the evaluation of risk and prophylaxis of tumour lysis syndrome (TLS) in adults and children. Br J Haematol. 2010.",
      "Advanced Paediatric Life Support (APLS), 7-е изд.: неотложная помощь при гиперкалиемии."
    ],
    ideal:[
      ["сразу", "Остановить всё, что содержит калий. Монитор ЭКГ."],
      ["до 10 мин", "Кальция глюконат 10% 0,5 мл/кг (до 20 мл) в/в медленно — защищает сердце, но калий не снижает."],
      ["затем", "Инсулин 0,1 ЕД/кг с глюкозой 0,5 г/кг и сальбутамол — переводят калий в клетки на 2–4 часа."],
      ["параллельно", "Нефролог и диализ: при синдроме лизиса с олигурией калий будет расти снова."],
      ["не делать", "Не ощелачивать (осаждение фосфата кальция), не вводить кальций струйно, не давать инсулин без глюкозы."]
    ],
    pearls:[
      "Кальций — первым при изменениях ЭКГ: стабилизирует мембрану кардиомиоцитов за минуты, но калий не снижает.",
      "Инсулин с глюкозой и сальбутамол действуют временно — истинное выведение калия даёт диализ.",
      "При синдроме лизиса бикарбонат вреден: в щелочной среде выпадают кристаллы фосфата кальция в почках.",
      "Калий — никогда в инфузию у ребёнка с высоким риском лизиса."
    ],
    post:{q:"Калий снижается, начат диализ. Что важно в ближайшие сутки?", o:[
      ["Калий, фосфор, кальций, мочевая кислота и креатинин каждые 4–6 часов", true, "Лизис продолжается — нужен частый контроль электролитов и функции почек."],
      ["Вернуть калий в инфузию, раз уровень снизился", false, "Калий в инфузию при продолжающемся лизисе не добавляют."],
      ["Ощелачивать мочу для выведения уратов", false, "После расбуриказы ощелачивание не нужно и вредно."],
      ["Отменить расбуриказу, раз уже идёт диализ", false, "Расбуриказа нужна при гиперурикемии и не мешает диализу."]]},
    start(){
      const st = {t:0, K:6.9, prot:0, kInf:true, ca:[], ins:[], salb:[], bic:null, furo:null, neph:null, dial:null, stopk:null, caFast:false, insNoGlu:false, harm:[], out:[], events:[], stable:0, end:null, warned:{}};
      say(st, "nurse", "Калий 6,9! На мониторе высокие зубцы T. Мочи за 4 часа — 60 мл.");
      say(st, "nurse", "И ещё: в капельнице раствор с калием — по старому назначению из хирургии.");
      return st;
    },
    cells(st){
      const g = stage(st), hr = g >= 2 ? 64 : 118;
      return [{n:"ЧСС", val:hr, unit:"уд/мин", crit:g >= 2}, {n:"АД", val:g >= 3 ? "78/40" : "116/74", unit:"мм рт. ст.", crit:g >= 3},
              {n:"K⁺", val:st.K.toFixed(1).replace(".", ","), unit:"ммоль/л", crit:st.K >= 6.5}, {n:"ЭКГ", val:ECG[g], unit:"ритм", crit:g >= 1}];
    },
    tick(st, dt){
      let dK = 0.0003 + (st.kInf ? 0.0004 : 0);
      for (const i of st.ins){ const a = st.t - i.t; if (a >= 300 && a < 2100) dK -= 1.0 / 1800; }
      for (const s of st.salb){ const a = st.t - s.t; if (a >= 300 && a < 2100) dK -= 0.6 / 1800; }
      if (st.bic !== null && st.t - st.bic < 1200) dK -= 0.2 / 1200;
      if (st.furo !== null && st.t - st.furo < 1800) dK -= 0.1 / 1800;
      if (st.dial !== null && st.t >= st.dial) dK -= 0.04 / 60;
      st.K = Math.max(4.2, st.K + dK * dt);
      st.prot = st.ca.some(c => st.t - c.t >= 120 && st.t - c.t < 2400) ? 1.2 : 0;
      if (st.neph !== null && st.dial === null && st.t >= st.neph + 900){ st.dial = st.t + 1200; say(st, "cons", "Нефролог: «Ставим диализный катетер, через 20 минут начнём диализ»."); ev(st, "ok", "Нефролог: диализ через 20 минут", ""); }
      if (st.dial !== null && Math.abs(st.t - st.dial) < dt / 2 + 0.01) say(st, "cons", "Диализ начат.");
      const g = stage(st);
      if (g >= 2 && !st.warned.qrs){ st.warned.qrs = true; say(st, "nurse", "QRS расширяется! Пульс урежается!"); }
      if (g >= 4){ st.end = "dead"; say(st, "nurse", "Фибрилляция желудочков! Начинаем СЛР, дефибриллятор!"); ev(st, "bad", "Фибрилляция желудочков", ""); return; }
      if (st.t >= 7200){ st.end = "icu"; say(st, "nurse", "Калий так и не удалось удержать — переводим в реанимацию."); return; }
      if (st.K <= 5.8 && st.dial !== null) st.stable += dt; else st.stable = 0;
      if (st.stable >= 600){ st.end = "ok"; say(st, "nurse", "Калий 5,4, ЭКГ нормализовалась."); }
    },
    actions:[
      {id:"stopk", label:"Остановить инфузию с калием", cost:30, once:true},
      {id:"ca", label:"Кальций…", cost:300, ask:{kind:"choice", title:"Кальций", options:[["cg", "Кальция глюконат 10% 11 мл (0,5 мл/кг) в/в за 5–10 мин"], ["cgfast", "Кальция глюконат 10% 50 мл в/в струйно"], ["cacl", "Кальция хлорид 10% 11 мл в периферическую вену"]]}},
      {id:"ins", label:"Инсулин…", cost:300, ask:{kind:"choice", title:"Инсулин", options:[["ig", "Инсулин 0,1 ЕД/кг + глюкоза 0,5 г/кг в/в"], ["i", "Инсулин 0,1 ЕД/кг в/в без глюкозы"]]}},
      {id:"salb", label:"Сальбутамол через небулайзер", cost:300},
      {id:"bic", label:"Натрия гидрокарбонат в/в", cost:120, once:true},
      {id:"furo", label:"Фуросемид в/в", cost:60, once:true},
      {id:"kay", label:"Сорбент калия внутрь", cost:60, once:true},
      {id:"neph", label:"Вызвать нефролога: диализ", cost:60, once:true}
    ],
    act(st, id, arg){
      if (id === "stopk"){ st.kInf = false; st.stopk = st.t; say(st, "you", "Остановить капельницу с калием!"); ev(st, st.t <= 300 ? "ok" : "warn", "Инфузия с калием остановлена", st.t <= 300 ? "" : "Поздно: калий продолжал поступать"); }
      if (id === "ca"){
        st.ca.push({t:st.t});
        if (arg.v === "cg"){ say(st, "you", "Кальция глюконат 10% 11 мл в/в медленно."); ev(st, "ok", "Кальция глюконат 0,5 мл/кг", "Защищает миокард за минуты; калий не снижает"); }
        if (arg.v === "cgfast"){ st.caFast = true; st.harm.push("cafast"); say(st, "you", "Кальция глюконат 50 мл струйно."); ev(st, "bad", "Кальций струйно, большая доза", "Брадикардия, гиперкальциемия; при лизисе — осаждение фосфата кальция"); }
        if (arg.v === "cacl"){ say(st, "you", "Кальция хлорид 11 мл в периферическую вену."); ev(st, "warn", "Кальция хлорид в периферическую вену", "Хлорид — через центральный доступ: при экстравазации некроз тканей"); }
      }
      if (id === "ins"){
        st.ins.push({t:st.t});
        if (arg.v === "i"){ st.insNoGlu = true; st.harm.push("hypo"); say(st, "you", "Инсулин без глюкозы."); say(st, "nurse", "Через 20 минут: глюкоза 2,1, ребёнок вялый и потный!"); ev(st, "bad", "Инсулин без глюкозы", "Гипогликемия"); }
        else { say(st, "you", "Инсулин 0,1 ЕД/кг с глюкозой 0,5 г/кг."); ev(st, "ok", "Инсулин с глюкозой", "Переводит калий в клетки на 2–4 часа"); }
      }
      if (id === "salb"){ st.salb.push({t:st.t}); say(st, "you", "Сальбутамол через небулайзер."); ev(st, "ok", "Сальбутамол", "Дополняет инсулин; действует временно"); }
      if (id === "bic"){ st.bic = st.t; st.harm.push("bic"); say(st, "you", "Натрия гидрокарбонат в/в."); ev(st, "bad", "Гидрокарбонат натрия", "При синдроме лизиса ощелачивание усиливает осаждение фосфата кальция; на калий действует слабо"); }
      if (id === "furo"){ st.furo = st.t; say(st, "you", "Фуросемид в/в."); ev(st, "mid", "Фуросемид", "При олигурии эффект слабый; только при достаточном объёме"); }
      if (id === "kay"){ say(st, "you", "Сорбент калия внутрь."); ev(st, "mid", "Сорбент калия", "Действует часами — неотложку не решает"); }
      if (id === "neph"){ st.neph = st.t; say(st, "you", "Вызовите нефролога, нужен диализ."); ev(st, "ok", "Вызван нефролог", "При лизисе с олигурией медикаменты дают только отсрочку"); }
    },
    score(st){
      const ca = st.ca[0], tr = [st.ins[0], st.salb[0]].filter(Boolean).map(x => x.t);
      const speed = (!ca ? 0 : ca.t <= 600 ? 50 : ca.t <= 1200 ? 25 : 0) + (st.neph === null ? 0 : st.neph <= 1200 ? 30 : st.neph <= 2400 ? 15 : 0) + (st.stopk !== null && st.stopk <= 300 ? 20 : 0);
      const drugs = (!ca ? 0 : st.caFast ? 15 : 40) + (st.ins.length ? (st.insNoGlu ? 0 : 30) : 0) + (st.salb.length ? 15 : 0) + (st.bic === null ? 15 : 0);
      const order = (ca && (!tr.length || ca.t <= Math.min(...tr)) ? 50 : 0) + (st.stopk !== null ? 25 : 0) + (st.neph !== null ? 25 : 0);
      const safety = 100 - (st.caFast ? 40 : 0) - (st.insNoGlu ? 40 : 0) - (st.bic !== null ? 30 : 0);
      const outcome = st.end === "ok" ? 100 : st.end === "icu" ? 60 : 0;
      const cats = [["Скорость", speed, 25], ["Препараты и дозы", drugs, 25], ["Порядок действий", order, 15], ["Безопасность", safety, 15], ["Исход", outcome, 20]].map(([n, v, w]) => [n, Math.max(0, Math.min(100, Math.round(v))), w]);
      return {cats, total:Math.round(cats.reduce((a, c) => a + c[1] * c[2], 0) / 100)};
    }
  };
})());

/* ---------- Судорожный статус на индукции ОЛЛ ---------- */
window.EMERG.push((function(){
  const W = 17;
  const say = (st, who, text) => st.out.push([who, text]);
  const ev = (st, mark, text, note) => st.events.push({t:st.t, mark, text, note:note || ""});
  const BZ = {
    mid_iv:[1, "ok", "Мидазолам 0,15 мг/кг в/в (2,5 мг)", "Доза верная"],
    dia_iv:[1, "ok", "Диазепам 0,3 мг/кг в/в (5 мг)", "Доза верная"],
    mid_buc:[1, "ok", "Мидазолам 0,3 мг/кг буккально (5 мг)", "Доза верная; удобно, если нет вены"],
    dia_big:[1, "bad", "Диазепам 1 мг/кг в/в (17 мг)", "Передозировка: высокий риск апноэ"],
    mid_small:[0, "bad", "Мидазолам 0,02 мг/кг в/в (0,3 мг)", "Доза в несколько раз ниже нужной"]
  };
  const L2 = {
    lev:["ok", "Леветирацетам 40 мг/кг в/в за 10 мин", "Препарат второй линии; мало взаимодействий с химиотерапией"],
    phen:["ok", "Фенитоин 20 мг/кг в/в за 20 мин", "Препарат второй линии; контроль ЭКГ и давления"],
    vpa:["warn", "Вальпроат 40 мг/кг в/в", "Эффективен, но на фоне аспарагиназы и тромбоцитопении — риск для печени и свёртывания"],
    pb:["warn", "Фенобарбитал 20 мг/кг в/в", "Эффективен, но после бензодиазепинов сильнее угнетает дыхание"]
  };
  return {
    id:"status-all", clock:"04:20", title:"Судорожный статус на индукции ОЛЛ",
    teaser:"10-й день индукции: головная боль, рвота, судороги не прекращаются.",
    p:{n:"Маша", age:"4 года", sex:"ж", w:W, h:104, look:{age:"kid", sex:"ж", hair:"pony", hc:"#8a5a3b", skin:"pale", mood:"sleepy", marks:[], bg:"#f2dfe4"}},
    from:"ОЛЛ, 10-й день индукции (дексаметазон, винкристин, пэгаспаргаза). ЦВК.",
    speed:10, waitSec:120, waitLabel:"2 мин",
    sources:[
      "Glauser T. et al. Evidence-based guideline: treatment of convulsive status epilepticus in children and adults. Epilepsy Curr. 2016.",
      "Advanced Paediatric Life Support (APLS), 7-е изд.: алгоритм судорожного статуса.",
      "Клинические рекомендации МЗ РФ «Острый лимфобластный лейкоз» (дети): осложнения терапии аспарагиназой."
    ],
    ideal:[
      ["0–5 мин", "На бок, защитить голову, кислород. Глюкоза крови. Засечь время."],
      ["5 мин", "Бензодиазепин: мидазолам 0,15 мг/кг в/в (или 0,3 мг/кг буккально) либо диазепам 0,3 мг/кг в/в."],
      ["через 5 мин", "Не прекратились — вторая доза бензодиазепина."],
      ["10–20 мин", "Не прекратились — препарат второй линии: леветирацетам 40 мг/кг или фенитоин 20 мг/кг; позвать реаниматолога."],
      ["после", "МРТ с венографией: тромбоз синусов на фоне аспарагиназы, PRES. Люмбальную пункцию не делать."]
    ],
    pearls:[
      "Больше двух доз бензодиазепинов не вводят: третья не помогает, но угнетает дыхание.",
      "Глюкозу крови проверяют сразу: гипогликемия — устранимая причина судорог.",
      "Судороги на индукции ОЛЛ: тромбоз венозных синусов (аспарагиназа), PRES (гипертензия, ГКС), гипонатриемия (винкристин), нейроинфекция.",
      "Леветирацетам удобен у онкологических пациентов: почти нет взаимодействий с химиотерапией."
    ],
    post:{q:"Судороги купированы, слабость в правой руке. Что дальше?", o:[
      ["МРТ с венографией", true, "Нужно исключить тромбоз венозных синусов (на фоне аспарагиназы) и PRES."],
      ["Люмбальная пункция для исключения нейролейкоза", false, "При подозрении на объёмный процесс или тромбоз сначала визуализация; ЛП опасна."],
      ["Продолжить пэгаспаргазу по графику, ничего не меняя", false, "При тромбозе аспарагиназу приостанавливают до решения о продолжении на фоне антикоагулянтов."],
      ["Навсегда отменить всю химиотерапию", false, "Отмена лечения лейкоза из-за осложнения не нужна; корректируют препараты."]]},
    start(){
      const st = {t:0, sz:true, szStart:0, szEnd:null, bz:[], l2:null, l2v:null, pos:false, glu:null, na:null, help:null, icu:null, apnea:null, lp:false, over:false, harm:[], out:[], events:[], stable:0, end:null, warned:{}};
      say(st, "nurse", "Маша жаловалась на головную боль, дважды вырвало — и начались судороги! Уже две минуты!");
      say(st, "exam", "Генерализованные тонико-клонические судороги, глаза отведены вправо, на окрик не реагирует.");
      return st;
    },
    cells(st){
      const szMin = st.sz ? (st.t - st.szStart) / 60 : 0;
      let spo2 = 97 - Math.min(16, szMin * 1.1) + (st.pos ? 5 : 0);
      if (st.apnea !== null && st.icu === null) spo2 = Math.max(60, 92 - (st.t - st.apnea) / 15);
      spo2 = Math.min(99, Math.round(spo2));
      const hr = st.sz ? 158 : 112;
      return [{n:"ЧСС", val:hr, unit:"уд/мин", crit:hr >= 150}, {n:"SpO₂", val:spo2, unit:"%", crit:spo2 < 92},
              {n:"Глюкоза", val:st.glu === null ? "—" : "5,2", unit:"ммоль/л", crit:false},
              {n:"Судороги", val:st.sz ? Math.floor(szMin + 2) + " мин" : "нет", unit:st.sz ? "продолжаются" : "купированы", crit:st.sz}];
    },
    tick(st, dt){
      if (st.sz){
        const ok = st.bz.filter(b => b.k > 0), last = ok[ok.length - 1], dur = st.t - st.szStart + 120;
        // первая доза уменьшает судороги, вторая через 5 мин купирует, если статус короче 20 минут; иначе нужен препарат второй линии
        if (ok.length >= 2 && st.t - last.t >= 120 && last.t - ok[0].t >= 240 && last.t - st.szStart + 120 < 1200) this._stop(st, "после второй дозы бензодиазепина");
        else if (st.l2 !== null && st.t - st.l2 >= 300) this._stop(st, "после препарата второй линии");
        else if (st.icu !== null && st.t - st.icu >= 600) this._stop(st, "в реанимации на фоне наркоза");
        if (ok.length === 1 && st.t - ok[0].t >= 120 && !st.warned.partial){ st.warned.partial = true; say(st, "nurse", "Подёргивания стали реже, но не прекратились!"); }
        if (dur > 1800 && !st.warned.long){ st.warned.long = true; say(st, "nurse", "Тридцать минут судорог!"); }
      } else st.stable += dt;
      if (st.help !== null && st.icu === null && st.t >= st.help + 300 && (st.apnea !== null || (st.sz && st.t - st.szStart + 120 > 1800))){
        st.icu = st.t; say(st, "cons", "Реаниматолог: «Интубирую, переводим на ИВЛ»."); ev(st, "mid", "Интубация в реанимации", st.apnea !== null ? "Апноэ после бензодиазепинов" : "Рефрактерный статус");
      }
      if (st.apnea !== null && st.icu === null && st.t - st.apnea > 420){ st.end = "dead"; say(st, "nurse", "Сатурация 60, брадикардия! Начинаем СЛР!"); ev(st, "bad", "Остановка дыхания и кровообращения", ""); return; }
      if (st.t >= 5400){ st.end = "icu"; say(st, "nurse", "Переводим в реанимацию."); return; }
      if (st.stable >= 300 && (st.apnea === null || st.icu !== null)) st.end = st.icu !== null ? "icu" : "ok";
    },
    _stop(st, how){ st.sz = false; st.szEnd = st.t; say(st, "nurse", `Судороги прекратились ${how}. Маша спит, правая рука слабее левой.`); },
    actions:[
      {id:"pos", label:"На бок, защитить голову, кислород", cost:30, once:true},
      {id:"glu", label:"Глюкоза крови (глюкометр)", cost:60, once:true},
      {id:"bz", label:"Бензодиазепин…", cost:60, ask:{kind:"choice", title:"Бензодиазепин", options:Object.entries(BZ).map(([k, v]) => [k, v[2]])}},
      {id:"l2", label:"Препарат второй линии…", cost:600, once:true, ask:{kind:"choice", title:"Вторая линия", options:Object.entries(L2).map(([k, v]) => [k, v[1]])}},
      {id:"help", label:"Позвать реаниматолога", cost:60, once:true},
      {id:"na", label:"Натрий, кальций, магний", cost:300, once:true},
      {id:"lp", label:"Люмбальная пункция", cost:600, once:true}
    ],
    act(st, id, arg){
      if (id === "pos"){ st.pos = true; say(st, "you", "На бок, голову защитить, кислород через маску."); ev(st, "ok", "Положение на боку, кислород", ""); }
      if (id === "glu"){ st.glu = st.t; say(st, "you", "Глюкометр."); say(st, "lab", "Глюкоза 5,2 ммоль/л."); ev(st, "ok", "Глюкоза крови", "Норма — гипогликемия исключена"); }
      if (id === "na"){ st.na = st.t; say(st, "you", "Натрий, кальций, магний срочно."); say(st, "lab", "Натрий 131, кальций и магний в норме."); ev(st, "ok", "Электролиты", "Лёгкая гипонатриемия судороги не объясняет"); }
      if (id === "help"){ st.help = st.t; say(st, "you", "Зовите реаниматолога!"); ev(st, "ok", "Вызван реаниматолог", ""); }
      if (id === "bz"){
        const [k, mark, label, note] = BZ[arg.v];
        st.bz.push({t:st.t, k});
        say(st, "you", label + ".");
        const n = st.bz.length;
        if (arg.v === "dia_big") st.over = true;
        if (!st.sz){ ev(st, "bad", label, "Судороги уже прекратились — бензодиазепин не нужен"); st.harm.push("needless"); }
        else ev(st, n >= 3 ? "bad" : mark, label, n >= 3 ? "Третья доза бензодиазепина: не помогает, угнетает дыхание" : note + (n === 2 && st.t - st.bz[0].t < 240 ? ". Повтор раньше 5 минут" : ""));
        if ((n >= 3 || arg.v === "dia_big") && st.apnea === null){ st.apnea = st.t; st.harm.push("apnea"); say(st, "nurse", "Она не дышит! Сатурация падает!"); }
      }
      if (id === "l2"){
        const [mark, label, note] = L2[arg.v];
        st.l2 = st.t; st.l2v = arg.v;
        say(st, "you", label + ".");
        ev(st, st.bz.filter(b => b.k > 0).length === 0 ? "warn" : mark, label, st.bz.filter(b => b.k > 0).length === 0 ? "Сначала бензодиазепин" : note);
        if (arg.v === "pb" && st.bz.length >= 2 && st.apnea === null){ st.apnea = st.t; st.harm.push("apnea"); say(st, "nurse", "Дыхание редкое, сатурация падает!"); }
      }
      if (id === "lp"){ st.lp = true; st.harm.push("lp"); say(st, "you", "Готовим люмбальную пункцию."); ev(st, "bad", "Люмбальная пункция", "Без визуализации при подозрении на тромбоз или отёк мозга — опасно; судороги ею не лечат"); }
    },
    score(st){
      const ok = st.bz.filter(b => b.k > 0), first = ok[0];
      const dur = (st.szEnd !== null ? st.szEnd : st.t) - st.szStart + 120;
      const speed = (!first ? 0 : first.t <= 300 ? 50 : first.t <= 600 ? 25 : 0) + (dur <= 1200 ? 30 : dur <= 1800 ? 15 : 0) + (st.glu !== null && st.glu <= 600 ? 20 : 0);
      const drugs = (ok.length ? 50 : 0) - (st.over ? 30 : 0) + (st.l2v ? (L2[st.l2v][0] === "ok" ? 30 : 15) : (dur <= 1200 ? 30 : 0)) + (st.bz.length <= 2 ? 20 : 0);
      const order = (st.pos ? 30 : 0) + (st.glu !== null ? 30 : 0) + (st.help !== null ? 20 : 0) + (st.lp ? 0 : 20);
      const safety = 100 - (st.apnea !== null ? 40 : 0) - (st.over ? 30 : 0) - (st.lp ? 40 : 0);
      const outcome = st.end === "ok" ? 100 : st.end === "icu" ? 60 : 0;
      const cats = [["Скорость", speed, 25], ["Препараты и дозы", drugs, 25], ["Порядок действий", order, 15], ["Безопасность", safety, 15], ["Исход", outcome, 20]].map(([n, v, w]) => [n, Math.max(0, Math.min(100, Math.round(v))), w]);
      return {cats, total:Math.round(cats.reduce((a, c) => a + c[1] * c[2], 0) / 100)};
    }
  };
})());
