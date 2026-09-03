import steam from './witcher-steam.json';
export type Locale='ru'|'uk'|'en';
export type Text=Record<Locale,string>;
export const L=(ru:string,uk:string,en:string):Text=>({ru,uk,en});
export const checkedAt='2026-09-02';
export const catalogVersion=2;
export const sources={
 steam:{name:'Steam · 292030',url:'https://steamcommunity.com/stats/292030/achievements'},
 crew:{name:'Gamer Guides · Full Crew',url:'https://www.gamerguides.com/the-witcher-3-wild-hunt/guide/walkthrough/the-wild-hunt/gather-allies'},
 gwent:{name:'Gamer Guides · Gwent',url:'https://www.gamerguides.com/the-witcher-3-wild-hunt/guide/gameplay/advanced-tips/ultimate-gwent-witcher-3-guide'},
 masquerade:{name:'Gamer Guides · A Matter of Life and Death',url:'https://www.gamerguides.com/the-witcher-3-wild-hunt/guide/secondary-quests/novigrad/a-matter-of-life-and-death'},
 difficulty:{name:'Gamer Guides · Difficulty',url:'https://www.gamerguides.com/the-witcher-3-wild-hunt/guide/walkthrough/tutorial/difficulty-options-differences'},
 spirit:{name:'Witcher Wiki · Woodland Spirit',url:'https://witcher.fandom.com/wiki/Woodland_Spirit_(achievement)'},
 guide:{name:'XboxAchievements · справочные условия',url:'https://www.xboxachievements.com/game/the-witcher-3-wild-hunt/guide/'},
};
export type Source=keyof typeof sources;
export const campaigns={base:L('Дикая Охота','Дике Полювання','Wild Hunt'),hos:L('Каменные сердца','Кам’яні серця','Hearts of Stone'),baw:L('Кровь и вино','Кров і вино','Blood and Wine')};
export type Campaign=keyof typeof campaigns;
export const stages=[
 {id:'orchard',campaign:'base',name:L('Белый Сад','Білий Сад','White Orchard'),hint:L('Начало пути и первые приготовления','Початок шляху та перші приготування','First steps and early preparations')},
 {id:'velen',campaign:'base',name:L('Велен','Велен','Velen'),hint:L('Заказы, история барона и помощь чародейке','Замовлення, історія барона та допомога чарівниці','Contracts, the Baron and a sorceress')},
 {id:'novigrad',campaign:'base',name:L('Новиград','Новіград','Novigrad'),hint:L('Союзники, гвинт и политические интриги','Союзники, ґвінт і політичні інтриги','Allies, Gwent and political intrigue')},
 {id:'skellige',campaign:'base',name:L('Скеллиге','Скелліґе','Skellige'),hint:L('Острова, наследие и старые обычаи','Острови, спадщина та старі звичаї','Islands, succession and old traditions')},
 {id:'allies',campaign:'base',name:L('Сбор союзников','Збір союзників','Gathering allies'),hint:L('Проверка перед Островом Туманов','Перевірка перед Островом Туманів','Checklist before the Isle of Mists')},
 {id:'kaer',campaign:'base',name:L('Каэр Морхен','Каер Морен','Kaer Morhen'),hint:L('События после Острова Туманов','Події після Острова Туманів','Events after the Isle of Mists')},
 {id:'finale',campaign:'base',name:L('Последние приготовления','Останні приготування','Final preparations'),hint:L('Развязка основной истории','Розв’язка основної історії','The end of the main story')},
 {id:'free',campaign:'base',name:L('Свободное исследование','Вільне дослідження','Free exploration'),hint:L('Возвращение к оставшимся задачам','Повернення до решти завдань','Return to unfinished business')},
 {id:'hos',campaign:'hos',name:campaigns.hos,hint:L('Новая история в землях Новиграда','Нова історія в землях Новіграда','A new story in the Novigrad countryside')},
 {id:'baw',campaign:'baw',name:L('Туссент','Туссент','Toussaint'),hint:L('Последнее большое приключение','Остання велика пригода','One last great adventure')},
] as const;
export type Stage=(typeof stages)[number]['id'];
const hos=new Set(['i-m-not-kissing-that','pacta-sunt-servanda','curator-of-nightmares','shopaholic','let-the-good-times-roll','wild-rose-dethorned','can-quit-anytime-i-want','return-to-sender','i-wore-ofieri-before-it-was-cool','when-it-s-many-against-one','moo-rderer','rad-steez-bro','killed-it']);
const baw=new Set(['the-witcher-s-gone-south','weapon-w','playing-house','last-action-hero','embodiment-of-the-five-virtues','a-knight-to-remember','the-grapes-of-wrath-stomped','dressed-to-kill','turned-every-stone','i-have-a-gwent-problem','david-and-golyat','kling-of-the-clink','hasta-la-vista']);
const secretConditions:Record<string,Text>={
 'lilac-and-gooseberries':L('Найди Йеннифэр.','Знайди Єннефер.','Find Yennefer.'),
 'family-counselor':L('Заверши историю барона: разыщи его семью.','Заверши історію барона: розшукай його родину.','Resolve the search for the Baron’s family.'),
 'friends-with-benefits':L('Заверши цепочку заданий Кейры Мец.','Заверши ланцюжок завдань Кейри Мец.','Finish Keira Metz’s quest line.'),
 'triple-threat':L('В одном бою добей трёх врагов тремя способами: мечом, бомбой и арбалетом.','В одному бою добий трьох ворогів трьома способами: мечем, бомбою та арбалетом.','In one fight, score a kill with a sword, a bomb and a crossbow.'),
 'a-friend-in-need':L('Найди и освободи Лютика.','Знайди та звільни Любистка.','Find and free Dandelion.'),
 'necromancer':L('Помоги Йеннифэр получить сведения от погибшего Скьялля.','Допоможи Єннефер отримати відомості від загиблого Ск’ялля.','Help Yennefer learn what the deceased Skjall knows.'),
 'kingmaker':L('Заверши цепочку, определяющую нового правителя Скеллиге.','Заверши ланцюжок, що визначає нового правителя Скелліґе.','Complete the Skellige succession quest line.'),
 'something-more':L('Воссоединись с Цири на Острове Туманов.','Возз’єднайся з Цірі на Острові Туманів.','Reunite with Ciri on the Isle of Mists.'),
 'xenonaut':L('Пройди с Аваллак’хом между мирами.','Пройди з Аваллак’гом між світами.','Travel between worlds with Avallac’h.'),
 'the-king-is-dead':L('Победи Эредина в основной истории.','Переможи Ередіна в основній історії.','Defeat Eredin in the main story.'),
 'full-crew':L('Собери необходимых союзников для битвы в Каэр Морхене.','Збери необхідних союзників для битви в Каер Морені.','Recruit the required allies for the battle at Kaer Morhen.'),
 'i-m-not-kissing-that':L('Победи жабьего принца.','Переможи жаб’ячого принца.','Defeat the Toad Prince.'),
 'pacta-sunt-servanda':L('Доведи историю Ольгерда до конца.','Заверши історію Ольґерда.','Conclude Olgierd’s story.'),
 'assassin-of-kings':L('Прими участие в покушении на Радовида.','Візьми участь у замаху на Радовіда.','Take part in the plot against Radovid.'),
 'rad-steez-bro':L('Скользи вниз по склону не менее 10 секунд без остановки.','Ковзай униз схилом щонайменше 10 секунд без зупинки.','Slide continuously down a slope for at least 10 seconds.'),
 'curator-of-nightmares':L('Восстанови все воспоминания в нарисованном мире Ирис.','Віднови всі спогади в намальованому світі Ірис.','Restore every memory in Iris’s painted world.'),
 'geralt-the-professional':L('Выполни все ведьмачьи заказы основной игры.','Виконай усі відьмацькі замовлення основної гри.','Finish every witcher contract in the base game.'),
 'shopaholic':L('Выкупи все три лота на аукционе Борсоди.','Придбай усі три лоти на аукціоні Борсоді.','Buy all three lots at the Borsodi auction.'),
 'the-grapes-of-wrath-stomped':L('Разреши спор виноделов так, чтобы новое вино назвали в твою честь.','Розв’яжи суперечку виноробів так, щоб нове вино назвали на твою честь.','Resolve the vineyard dispute so a wine is named after Geralt.'),
 'let-the-good-times-roll':L('Попробуй все развлечения на свадьбе в «И я там был».','Спробуй всі розваги на весіллі в «І я там був».','Try every wedding activity during Dead Man’s Party.'),
 'wild-rose-dethorned':L('Зачисти и обыщи все лагеря падших рыцарей Пылающей Розы.','Зачисти та обшукай усі табори занепалих лицарів Палаючої Троянди.','Clear and loot every Fallen Knights camp.'),
 'david-and-golyat':L('Победи Голиафа, попав из арбалета в глаз.','Переможи Голіафа, влучивши з арбалета в око.','Defeat Golyat with a crossbow shot to the eye.'),
 'what-was-that':L('За 4 секунды проведи атаку, контратаку, примени Знак и брось бомбу.','За 4 секунди виконай атаку, контратаку, застосуй Знак і кинь бомбу.','Within 4 seconds, attack, counterattack, cast a Sign and throw a bomb.'),
 'moo-rderer':L('Убей 20 коров.','Убий 20 корів.','Kill 20 cows.'),
 'when-it-s-many-against-one':L('Разбуди сразу все кошмары Ирис и победи их в одном бою.','Розбуди одразу всі кошмари Ірис і переможи їх в одному бою.','Wake all of Iris’s nightmares before defeating them in the same fight.'),
 'hasta-la-vista':L('Убей замороженного противника выстрелом из арбалета.','Убий замороженого противника пострілом з арбалета.','Finish a frozen opponent with a crossbow bolt.'),
};
// Steam currently falls back to English for Ukrainian. These are tracker-authored translations.
const ukrainian:Record<string,[string,string]>={
 'butcher-of-blaviken':['М’ясник із Блавікена','Убий щонайменше 5 супротивників менш ніж за 10 секунд.'],
 'fist-of-the-south-star':['Невразливий','Переможи в кулачному бою, не зазнавши шкоди.'],
 'let-s-cook':['Варімо!','Вивчи 12 рецептів еліксирів.'],
 'can-t-touch-this':['Спритність','В одному бою вбий 5 ворогів без Квену та без шкоди, крім токсичності.'],
 'bookworm':['Книжковий хробак','Прочитай 30 книг, щоденників або документів.'],
 'bombardier':['Бомбардир','Збери рецепти шести різних типів бомб.'],
 'shrieker':['Крикун','Виконай замовлення на крикуна.'],
 'environmentally-unfriendly':['Небезпечне довкілля','Убий 50 ворогів за допомогою газу, комах чи інших об’єктів довкілля.'],
 'mutant':['Мутант','Заповни всі комірки мутагенів.'],
 'fire-in-the-hole':['Підривник','Знищ бомбами 10 гнізд чудовиськ.'],
 'globetrotter':['Мандрівник','Відкрий 100 пунктів швидкої подорожі.'],
 'munchkin':['Манчкін','Досягни 35 рівня.'],
 'the-doppler-effect':['Ефект доплера','Розв’яжи проблему з доплером у Новіграді.'],
 'fearless-vampire-slayer':['Безстрашний мисливець','Виконай замовлення на Сарасті.'],
 'passed-the-trial':['Дитя-Несподіванка','Заверши основну гру на будь-якій складності.'],
 'ashes-to-ashes':['На порох обернешся','Виконай замовлення на Теразана.'],
 'fiend-or-foe':['Друг чи ворог?','Виконай замовлення на Морвудда.'],
 'armed-and-dangerous':['Озброєний і небезпечний','Збери та одягни повний комплект спорядження однієї відьмацької школи.'],
 'geralt-and-friends':['Ґеральт і друзі','Виграй раунд ґвінту лише нейтральними картами.'],
 'brawler':['Забіяка','Переможи Олафа, чемпіона Скелліґе з кулачного бою.'],
 'all-in':['Хет-трик','Зіграй трьома героями в одному раунді та виграй партію ґвінту.'],
 'weapon-w':['Зброя «В»','Розвинь мутацію.'],
 'brawl-master':['Абсолютний чемпіон','Заверши всі кулачні турніри Велена, Новіграда та Скелліґе.'],
 'playing-house':['Удома найкраще','Придбай усі поліпшення Корво Б’янко.'],
 'last-action-hero':['Герой Туссента','Отримай орден Vitis Vinifera.'],
 'woodland-spirit':['Дух Лісу','Виконай замовлення на Духа Лісу.'],
 'embodiment-of-the-five-virtues':['П’ять чеснот','Отримай Арондит від Володарки Озера.'],
 'a-knight-to-remember':['Справжній лицар','Переможи в усіх змаганнях лицарського турніру.'],
 'gwent-master':['Чемпіон із ґвінту','Переможи Тібальта та виграй турнір у «Пасифлорі».'],
 'fast-and-furious':['Форсаж','Виграй усі кінні перегони основної гри.'],
 'dressed-to-kill':['Повна синергія','Активуй бонус повного комплекту спорядження однієї відьмацької школи.'],
 'even-odds':['Рівні шанси','Убий 2 чудовиськ за замовленнями без Знаків, еліксирів, мутагенів, олій та бомб.'],
 'pest-control':['Винищувач','Знищ усі гнізда в регіоні Велен / Новіград або на Скелліґе.'],
 'turned-every-stone':['Мисливець за кресленнями','Знайди всі гросмейстерські креслення відьмацьких шкіл.'],
 'dendrologist':['Дендролог','Отримай всі вміння однієї гілки.'],
 'i-have-a-gwent-problem':['Спогад про Скелліґе','Збери всю колоду Скелліґе.'],
 'ran-the-gauntlet':['Випробування','Заверши гру на «Кров і зламані кістки!» або «Марш смерті!».'],
 'killed-it':['Тотальна війна','Виграй у ґвінт, набравши щонайменше 187 очок.'],
 'power-overwhelming':['Велика Сила','Одночасно активуй бонуси всіх п’яти Знаків у місцях Сили.'],
 'card-collector':['Збирач карт','Збери всі карти ґвінту базової гри.'],
 'kaer-morhen-trained':['Контратака','Виконай 10 контратак поспіль без блокування та отримання шкоди.'],
 'can-quit-anytime-i-want':['Сім ліків','Одночасно перебувай під дією семи еліксирів чи відварів.'],
 'walked-the-path':['Відьмак на шляху','Заверши гру на складності «Марш смерті!».'],
 'return-to-sender':['Повернення відправнику','Убий трьох ворогів їхніми власними стрілами.'],
 'that-is-the-evilest-thing':['Живий запал','10 разів підпали газ «Сну дракона» за допомогою палаючого ворога.'],
 'overkill':['Загадка для коронера','10 разів спричини одночасні кровотечу, отруєння та горіння.'],
 'kling-of-the-clink':['В’язень Туссента','Потрап до в’язниці в Туссенті.'],
 'i-wore-ofieri-before-it-was-cool':['Нова мода','Збери офірські обладунки, кінське спорядження та щонайменше один меч.'],
 'the-enemy-of-my-enemy':['Ворог мого ворога','20 разів змусь ворога вбити іншого за допомогою Аксію.'],
 'humpty-dumpty':['Шалтай-Болтай','Убий 10 ворогів, скинувши їх із висоти Аардом.'],
 'master-marksman':['Влучний стрілець','Убий 50 гуманоїдів пострілом з арбалета в голову.'],
 'the-witcher-s-gone-south':['Ласкаво просимо до Туссента!','Прибудь до князівства Туссент.'],
};
const ukSecretNames:Record<string,string>={'lilac-and-gooseberries':'Бузок і аґрус','family-counselor':'Друг родини','friends-with-benefits':'Мор, чарівниця та стара вежа','triple-threat':'Потрійна загроза','a-friend-in-need':'Друг у біді','necromancer':'Некромантія','kingmaker':'Творець королів','something-more':'Щось більше','xenonaut':'Ксенонавт','the-king-is-dead':'Король мертвий','full-crew':'У повному складі','i-m-not-kissing-that':'Треба було поцілувати','pacta-sunt-servanda':'Геть, зникни!','assassin-of-kings':'Убивця королів','rad-steez-bro':'Екстремальний спорт','curator-of-nightmares':'Утілений кошмар','geralt-the-professional':'Майстер-відьмак','shopaholic':'Шопоголік','the-grapes-of-wrath-stomped':'Вино з грон гніву','let-the-good-times-roll':'Гуляй, душе!','wild-rose-dethorned':'Бич божий','david-and-golyat':'Давид і Голіаф','what-was-that':'Що це було?','moo-rderer':'Винищувач корів','when-it-s-many-against-one':'Коли ворогів безліч…','hasta-la-vista':'Hasta la Vista'};
const stageMap:Record<string,Stage[]>={
 'lilac-and-gooseberries':['orchard'],'family-counselor':['velen'],'friends-with-benefits':['velen'],'a-friend-in-need':['novigrad'],'necromancer':['skellige'],'kingmaker':['skellige'],'something-more':['allies'],'xenonaut':['finale'],'the-king-is-dead':['finale'],'full-crew':['allies','kaer'],'assassin-of-kings':['finale'],'shrieker':['velen','free'],'the-doppler-effect':['novigrad','free'],'fearless-vampire-slayer':['velen','free'],'ashes-to-ashes':['novigrad','free'],'fiend-or-foe':['skellige','free'],'woodland-spirit':['skellige','free'],'gwent-master':['novigrad','free'],'brawler':['skellige','free'],'power-overwhelming':['orchard','free'],'walked-the-path':['finale'],'ran-the-gauntlet':['finale'],'passed-the-trial':['finale'],
};
const missable=new Set(['friends-with-benefits','full-crew','kingmaker','assassin-of-kings','woodland-spirit','card-collector','gwent-master','walked-the-path','ran-the-gauntlet','curator-of-nightmares','shopaholic','let-the-good-times-roll','when-it-s-many-against-one','david-and-golyat','a-knight-to-remember','last-action-hero','kling-of-the-clink','the-grapes-of-wrath-stomped','i-wore-ofieri-before-it-was-cool']);
export type Achievement={id:string;name:Text;description:Text;icon:string;secret:boolean;campaign:Campaign;stages:Stage[];missable:boolean;category:'story'|'gwent'|'combat'|'explore';source:Source};
export const achievements:Achievement[]=steam.map(a=>({ ...a,name:{...a.name,uk:ukrainian[a.id]?.[0]??ukSecretNames[a.id]??a.name.en},description:secretConditions[a.id]??{...a.description,uk:ukrainian[a.id]?.[1]??a.description.en},campaign:hos.has(a.id)?'hos':baw.has(a.id)?'baw':'base',stages:hos.has(a.id)?['hos']:baw.has(a.id)?['baw']:stageMap[a.id]??['orchard','velen','novigrad','skellige','free'],missable:missable.has(a.id),category:/gwent|card-collector|all-in|killed-it|geralt-and-friends/.test(a.id)?'gwent':a.secret?'story':/kill|butcher|fist|brawl|odds|marksman|enemy|humpty|trained|touch|threat/.test(a.id)?'combat':'explore',source:a.secret?'guide':'steam'}));
export type Step={id:string;title:Text;detail:Text;stages:Stage[];goals:string[];kind:'prepare'|'action';secret?:boolean;before?:string;source:Source};
const S=(id:string,title:Text,detail:Text,stages:Stage[],goals:string[],source:Source='guide',before?:string,secret=false):Step=>({id,title,detail,stages,goals,kind:'prepare',source,before,secret});
const preparationRecords:Step[]=[
 S('check-difficulty',L('Проверь сложность с начала игры','Перевір складність від початку гри','Check your difficulty history'),L('Для «Ведьмак на тракте» нужна «На смерть!» с начала до финала. Отметь историю сложности справа; отсутствие записи не означает, что условие соблюдено.','Для найвищого досягнення потрібен «Марш смерті!» від початку до фіналу. Познач історію складності праворуч.','For Walked the Path, maintain Death March from the start to the ending. Record your difficulty history; an empty record is not confirmation.'),['orchard','velen','novigrad','skellige','allies','finale'],['walked-the-path','ran-the-gauntlet'],'difficulty'),
 S('first-gwent',L('Сыграй первую партию в гвинт','Зіграй першу партію в ґвінт','Play your first game of Gwent'),L('В трактире Белого Сада поговори с учёным. Победа даёт карту Золтана. Это подготовка, а не весь набор карт.','У корчмі Білого Саду поговори з ученим. Перемога дає карту Золтана. Це лише підготовка.','Challenge the scholar at the White Orchard inn for Zoltan’s card. This is preparation, not a complete collection.'),['orchard'],['card-collector'],'gwent'),
 S('buy-orchard-cards',L('Проверь карты у трактирщицы','Перевір карти в корчмарки','Check the innkeeper’s Gwent cards'),L('Купи доступные карты у Эльзы. Если уже уехал, проверь ассортимент Брама: смена локации сама по себе не означает потерю карт.','Придбай доступні карти в Ельзи. Якщо вже поїхав, перевір асортимент Брама: зміна локації не означає втрату карт.','Buy Elsa’s available cards. If you have left, check Bram’s stock; simply leaving the region does not prove the cards are lost.'),['orchard'],['card-collector'],'gwent'),
 S('power-circuit',L('Запланируй круг по местам Силы','Сплануй коло місцями Сили','Plan a circuit of Places of Power'),L('Нужны одновременные бонусы Аарда, Игни, Ирденa, Квена и Аксия. Отметки посещений сами по себе не подтверждают одновременность.','Потрібні одночасні бонуси Аарда, Іґні, Ірдену, Квену та Аксію. Позначки відвідин не підтверджують одночасність.','Activate the Aard, Igni, Yrden, Quen and Axii bonuses together. Visiting five locations alone does not confirm simultaneous bonuses.'),['orchard'],['power-overwhelming'],'steam'),
 S('keira-quests',L('Заверши задания чародейки','Заверши завдання чарівниці','Finish the sorceress’s quests'),L('Пройди побочные задания Кейры Мец. Перед финальным разговором сделай отдельное сохранение.','Виконай побічні завдання Кейри Мец. Перед останньою розмовою збережи гру.','Complete Keira Metz’s side quests and save before the final conversation.'),['velen','allies'],['friends-with-benefits','full-crew'],'crew','isle',true),
 S('keira-invite',L('Пригласи союзницу в крепость','Запроси союзницю до фортеці','Invite your ally to the fortress'),L('Убеди Кейру отправиться в Каэр Морхен. Другие исходы закрывают её участие в этой ветке. Решение запиши отдельно.','Переконай Кейру вирушити до Каер Морена. Інші наслідки закривають її участь у цій гілці. Рішення запиши окремо.','Persuade Keira to go to Kaer Morhen. Other outcomes lose this required ally in the current branch. Record the choice separately.'),['velen','allies'],['full-crew'],'crew','isle',true),
 S('ves-rescue',L('Помоги темерским союзникам','Допоможи темерським союзникам','Help the Temerian allies'),L('Выполни «Око за око», сохрани жизнь Бьянке, затем пригласи Роше в рамках «Братьев по оружию».','Виконай «Око за око», врятуй Вес, а потім запроси Роше в «Братах по зброї».','Complete An Eye for an Eye with Ves alive, then recruit Roche during Brothers in Arms.'),['novigrad','allies'],['full-crew','assassin-of-kings'],'crew','isle',true),
 S('masquerade-save',L('Сохранись перед турниром на маскараде','Збережися перед турніром на маскараді','Save before the masquerade tournament'),L('В «Вопросе жизни и смерти» выиграй все три партии до ухода с приёма. В коллекции отдельно отметь Мильву, бруксу и Лютика.','У «Питанні життя і смерті» виграй усі три партії до завершення прийому. Окремо познач Мільву, бруксу та Любистка.','During A Matter of Life and Death, win all three matches before leaving the party. Track Milva, Vampire: Bruxa and Dandelion individually.'),['novigrad'],['card-collector'],'masquerade','masquerade',true),
 S('zoltan-reward',L('Проверь награду за «Опасную игру»','Перевір нагороду за «Небезпечну гру»','Check A Dangerous Game’s reward'),L('Помоги Золтану и выбери карты вместо денег. Поздние запасные способы получения зависят от версии — трекер не считает их гарантированными.','Допоможи Золтану та обери карти замість грошей. Пізні альтернативи залежать від версії й не гарантовані трекером.','Help Zoltan and choose the cards rather than money. Later fallback locations are version-dependent and not guaranteed here.'),['novigrad','allies'],['card-collector'],'gwent','isle',true),
 S('high-stakes-save',L('Подготовь колоду к «Высоким ставкам»','Підготуй колоду до «Високих ставок»','Prepare for High Stakes'),L('Отложи 1000 крон, усили колоду и сохранись перед турниром. Для четырёх карт лидеров нужно выиграть все партии.','Відклади 1000 крон, посиль колоду та збережися. Для чотирьох карт лідерів треба виграти всі партії.','Set aside 1,000 crowns, strengthen your deck and save before entering. Win every match to earn all four leader cards.'),['novigrad','free'],['card-collector','gwent-master'],'gwent','tournament'),
 S('skellige-succession',L('Помоги определить правителя островов','Допоможи визначити правителя островів','Help settle the islands’ succession'),L('Заверши «Владыку Ундвика» и «Избранника богов». В «Королевском гамбите» помоги Керис или Хьялмару, а затем пригласи Хьялмара.','Заверши «Володаря Ундвіка» та «Обранця богів». У «Королівському гамбіті» допоможи Керіс або Ялмару, потім запроси Ялмара.','Finish The Lord of Undvik and Possession, help Cerys or Hjalmar in King’s Gambit, then recruit Hjalmar.'),['skellige','allies'],['kingmaker','full-crew'],'crew','isle',true),
 S('allies-checklist',L('Сверь список союзников','Звір список союзників','Review your allies'),L('Нужны Кейра, Трисс, Роше, Бьянка, Золтан, Мышовур и Хьялмар. Лето не обязателен. Проверь приглашения до Острова Туманов.','Потрібні Кейра, Трісс, Роше, Вес, Золтан, Мишовур та Ялмар. Лето не обов’язковий. Перевір запрошення до Острова Туманів.','Required allies: Keira, Triss, Roche, Ves, Zoltan, Ermion and Hjalmar. Letho is optional. Check recruitment before the Isle of Mists.'),['allies'],['full-crew'],'crew','isle',true),
 S('political-prep',L('Закрой подготовку политической цепочки','Заверши підготовку політичного ланцюжка','Finish the political prerequisites'),L('До Острова Туманов заверши «Око за око», «Враг народа» и «Смертельный заговор». Позже в «Темней всего под фонарём» не применяй силу к Дийкстре.','До Острова Туманів заверши «Око за око», «Ворог народу» та «Смертельну змову». Пізніше не застосовуй силу до Дійкстри.','Before the Isle of Mists, finish An Eye for an Eye, Redania’s Most Wanted and A Deadly Plot. Later, do not use force on Dijkstra in Blindingly Obvious.'),['novigrad','allies'],['assassin-of-kings'],'guide','isle',true),
 S('spirit-save',L('Сохранись перед выбором в лесной деревне','Збережися перед вибором у лісовому селі','Save before the woodland choice'),L('В «Сердце леса» путь Свена с убийством лешего даёт достижение «Дух Леса». Ритуал Харальда — другой исход, который его не даёт.','У «Серці лісу» шлях Свена з убивством лісовика дає досягнення. Ритуал Гаральда його не дає.','In In the Heart of the Woods, Sven’s path requires killing the leshen for Woodland Spirit. Harald’s ritual does not award it.'),['skellige','free'],['woodland-spirit'],'spirit',undefined,true),
 S('hos-auction',L('Отложи деньги на аукцион','Відклади гроші на аукціон','Set money aside for the auction'),L('До аукциона в «Сезаме, откройся!» сохрани игру и подготовь деньги для покупки всех трёх лотов.','До аукціону у «Сезаме, відчинися!» збережи гру та підготуй гроші на всі три лоти.','Before the Open Sesame auction, save and bring enough money to purchase all three lots.'),['hos'],['shopaholic'],'guide','auction',true),
 S('hos-wedding',L('Не спеши уходить с праздника','Не поспішай іти зі свята','Explore every wedding activity'),L('В «И я там был» попробуй все развлечения до завершения свадьбы. Перечень активностей пока не размечен поштучно.','В «І я там був» спробуй всі розваги до завершення весілля. Окремий список активностей ще не розмічений.','During Dead Man’s Party, try every activity before the wedding ends. A per-activity checklist is not yet included.'),['hos'],['let-the-good-times-roll'],'guide','wedding',true),
 S('hos-painting',L('Сохранись перед нарисованным миром','Збережися перед намальованим світом','Save before entering the painted world'),L('Восстанови все воспоминания Ирис. Перед последним боем разбуди все кошмары, если выбрана цель «Коли врагов пропасть…».','Віднови всі спогади Ірис. Перед останнім боєм розбуди всі кошмари, якщо обрана відповідна ціль.','Restore every memory. For When It’s Many Against One, wake every nightmare before killing any of them.'),['hos'],['curator-of-nightmares','when-it-s-many-against-one'],'guide','painting',true),
 S('baw-golyat',L('Подготовь арбалет к первой схватке','Підготуй арбалет до першої сутички','Ready your crossbow for the first fight'),L('В начале дополнения попади Голиафу в глаз из арбалета. Сохранись до схватки — после обычной победы понадобится откат.','На початку доповнення влуч Голіафу в око з арбалета. Збережися до бою: після звичайної перемоги потрібен відкат.','At the start of the expansion, shoot Golyat in the eye. Save before the encounter; a normal kill requires reloading for this achievement.'),['baw'],['david-and-golyat'],'guide','golyat',true),
 S('baw-branch',L('Сделай отдельное сохранение перед финалом','Зроби окреме збереження перед фіналом','Keep a separate save before the ending'),L('«Туссентский герой» и «Туссентский заключённый» относятся к разным исходам. Сохранись до «Долгой ночи»; подробная цепочка финальных выборов ещё не полностью проверена.','«Герой Туссента» та «В’язень Туссента» належать до різних наслідків. Збережися до «Довгої ночі»; повний ланцюжок виборів ще не перевірений.','Last Action Hero and Kling of the Clink belong to different outcomes. Save before The Night of Long Fangs; the complete ending decision tree is not yet verified.'),['baw'],['last-action-hero','kling-of-the-clink'],'guide',undefined,true),
];
// Only concrete parts of complex goals are checkable; the rest are optional guidance.
const livePreparationIds = new Set(["first-gwent","buy-orchard-cards","keira-invite","ves-rescue","zoltan-reward","skellige-succession"]);
export type Advice=Omit<Step,'kind'>;
export const advice:Advice[]=preparationRecords.filter(s=>!livePreparationIds.has(s.id)&&s.id!=='political-prep').map(({kind,...tip})=>tip);
export const steps:Step[]=[
 ...preparationRecords.filter(s=>livePreparationIds.has(s.id)).map(s=>({...s,goals:s.id==='skellige-succession'||s.id==='ves-rescue'?['full-crew']:s.goals})),
 S('politics-eye-for-eye',L('Заверши «Око за око»','Заверши «Око за око»','Finish An Eye for an Eye'),L('Выполни задание Роше до Острова Туманов.','Виконай завдання Роше до Острова Туманів.','Finish Roche’s quest before the Isle of Mists.'),['novigrad','allies'],['assassin-of-kings'],'guide','isle',true),
 S('politics-redania-wanted',L('Заверши «Враг народа»','Заверши «Ворог народу»','Finish Redania’s Most Wanted'),L('Заверши расследование до Острова Туманов.','Заверши розслідування до Острова Туманів.','Finish the investigation before the Isle of Mists.'),['novigrad','allies'],['assassin-of-kings'],'guide','isle',true),
 S('politics-deadly-plot',L('Заверши «Смертельный заговор»','Заверши «Смертельну змову»','Finish A Deadly Plot'),L('Заверши это побочное задание до Острова Туманов.','Заверши це побічне завдання до Острова Туманів.','Finish this side quest before the Isle of Mists.'),['novigrad','allies'],['assassin-of-kings'],'guide','isle',true),
 S('politics-dijkstra-talk',L('Договорись с Дийкстрой без силы','Домовся з Дійкстрою без сили','Negotiate with Dijkstra without force'),L('В «Темней всего под фонарём» выбери мирный разговор с Дийкстрой. Этот выбор происходит позже ранних приготовлений.','У «Найтемніше під ліхтарем» обери мирну розмову з Дійкстрою. Цей вибір відбувається після ранніх приготувань.','During Blindingly Obvious, resolve the conversation with Dijkstra without force. This choice comes after the earlier preparations.'),['finale'],['assassin-of-kings'],'guide',undefined,true),
];
export function achievementGuidance(id:string){
 const actions=steps.filter(s=>s.goals.includes(id));
 return {actions,tips:advice.filter(s=>s.goals.includes(id)),partial:actions.length>0};
}
export type Item={id:string;name:Text;region:Stage;location:Text;collection:'gwent';goals:string[];event?:string;secret?:boolean;source:Source};
const card=(id:string,name:Text,location:Text,event?:string,region:Stage='novigrad',source:Source='gwent'):Item=>({id,name,location,event,region,collection:'gwent',goals:['card-collector'],secret:!!event,source});
export const items:Item[]=[
 card('zoltan',L('Золтан Хивай','Золтан Хівай','Zoltan Chivay'),L('Награда учёного в трактире. Если пропущена — проверь запасное место у Дерева висельников.','Нагорода вченого в корчмі. Якщо пропущена — перевір запасне місце біля Дерева повішених.','Win from the inn’s scholar; if missed, check the fallback near Hanged Man’s Tree.'),undefined,'orchard'),
 card('milva',L('Мильва','Мільва','Milva'),L('Первая победа на турнире у Вегельбудов в «Вопросе жизни и смерти».','Перша перемога на турнірі Веґельбудів у «Питанні життя і смерті».','First victory at the Vegelbud masquerade tournament.'),'masquerade','novigrad','masquerade'),
 card('vampire-bruxa',L('Вампир: брукса','Вампір: брукса','Vampire: Bruxa'),L('Вторая победа на том же турнире. Возможные DLC-альтернативы здесь не проверены.','Друга перемога на тому самому турнірі. Можливі DLC-альтернативи тут не перевірено.','Second victory at the same tournament. DLC fallback availability has not been verified here.'),'masquerade','novigrad','masquerade'),
 card('dandelion',L('Лютик','Любисток','Dandelion'),L('Третья победа на турнире у Вегельбудов. Забери до завершения приёма.','Третя перемога на турнірі Веґельбудів. Забери до завершення прийому.','Third victory at the Vegelbud tournament; obtain before leaving the party.'),'masquerade','novigrad','masquerade'),
 card('isengrim',L('Изенгрим Фаоильтиарна','Ізенґрім Фаоільтіарна','Isengrim Faoiltiarna'),L('«Опасная игра»: выбери карты в качестве награды Золтана.','«Небезпечна гра»: обери карти як нагороду Золтана.','A Dangerous Game: choose Zoltan’s card reward.'),'isle'),
 card('john-natalis',L('Ян Наталис','Ян Наталіс','John Natalis'),L('«Опасная игра»: выбери карты в качестве награды Золтана.','«Небезпечна гра»: обери карти як нагороду Золтана.','A Dangerous Game: choose Zoltan’s card reward.'),'isle'),
 card('fringilla',L('Фрингилья Виго','Фрінґілья Віґо','Fringilla Vigo'),L('«Опасная игра»: выбери карты в качестве награды Золтана.','«Небезпечна гра»: обери карти як нагороду Золтана.','A Dangerous Game: choose Zoltan’s card reward.'),'isle'),
 card('foltest-steel',L('Фольтест: Железный Владыка','Фольтест: Сталевий Владика','Foltest: The Steel-Forged'),L('«Высокие ставки»: выиграй первую партию.','«Високі ставки»: виграй першу партію.','High Stakes: win the first match.'),'tournament'),
 card('emhyr-relentless',L('Эмгыр: Безжалостный','Емгир: Невблаганний','Emhyr: The Relentless'),L('«Высокие ставки»: выиграй вторую партию.','«Високі ставки»: виграй другу партію.','High Stakes: win the second match.'),'tournament'),
 card('francesca-queen',L('Францеска: Королева Дол Блатанны','Францеска: Королева Дол Блатанни','Francesca: Queen of Dol Blathanna'),L('«Высокие ставки»: выиграй третью партию.','«Високі ставки»: виграй третю партію.','High Stakes: win the third match.'),'tournament'),
 card('eredin-destroyer',L('Эредин: Убийца миров','Ередін: Руйнівник світів','Eredin: Destroyer of Worlds'),L('«Высокие ставки»: выиграй финальную партию.','«Високі ставки»: виграй фінальну партію.','High Stakes: win the final match.'),'tournament'),
];
export const events=[
 {id:'isle',stage:'allies',title:L('Войти на Остров Туманов','Увійти на Острів Туманів','Enter the Isle of Mists'),warning:L('Ряд побочных заданий закроется. Сверь союзников, политическую подготовку и награду Золтана. Это подтверждение события в игре, а не выбор локации.','Низка побічних завдань закриється. Перевір союзників, політичну підготовку та нагороду Золтана. Це підтвердження ігрової події, а не вибір локації.','Several side quests will close. Review allies, political prerequisites and Zoltan’s reward. This confirms an in-game event, not merely a location change.')},
 {id:'masquerade',stage:'novigrad',title:L('Закончить приём у Вегельбудов','Завершити прийом у Веґельбудів','Leave the Vegelbud party'),warning:L('Проверь три выигранные карты. Для Мильвы и Лютика пропущенный турнир означает необходимость раннего сохранения. Альтернативы бруксы требуют отдельной проверки.','Перевір три виграні карти. Пропущені Мільва та Любисток потребують раннього збереження. Альтернативи брукси треба перевірити окремо.','Check all three prize cards. Missing Milva or Dandelion requires an earlier save. Bruxa fallback options need a separate check.')},
 {id:'tournament',stage:'novigrad',title:L('Завершить «Высокие ставки»','Завершити «Високі ставки»','Finish High Stakes'),warning:L('Проверь четыре карты лидеров. Поражение нельзя исправить простым возвращением на турнир.','Перевір чотири карти лідерів. Поразку не виправити простим поверненням на турнір.','Check the four leader cards. Returning later does not undo a lost match.')},
 {id:'auction',stage:'hos',title:L('Закончить аукцион','Завершити аукціон','Finish the auction'),warning:L('Убедись, что куплены все три лота.','Переконайся, що придбано всі три лоти.','Make sure all three lots were purchased.')},
 {id:'wedding',stage:'hos',title:L('Завершить свадьбу','Завершити весілля','Finish the wedding'),warning:L('Сверь все развлечения до ухода.','Перевір усі розваги до відходу.','Check every activity before leaving.')},
 {id:'painting',stage:'hos',title:L('Покинуть нарисованный мир','Покинути намальований світ','Leave the painted world'),warning:L('Проверь воспоминания и условие битвы с кошмарами.','Перевір спогади та умову битви з кошмарами.','Check memories and the nightmare combat condition.')},
 {id:'golyat',stage:'baw',title:L('Первая битва завершена','Першу битву завершено','First battle completed'),warning:L('Если специальное условие не выполнено, потребуется раннее сохранение.','Якщо спеціальну умову не виконано, потрібне раннє збереження.','If the special condition was missed, you need an earlier save.')},
] as const;
export const decisionDefinitions=[
 {id:'keira',label:L('Приглашение союзницы','Запрошення союзниці','Sorceress recruitment'),stages:['velen','allies'],source:'crew',options:[['kaer',L('Отправилась в крепость','Вирушила до фортеці','Sent to the fortress')],['other',L('Другой исход','Інший наслідок','Another outcome')]],effect:L('Другой исход закрывает «В полном составе». Можно загрузить игру и точку трекера до разговора.','Інший наслідок закриває «У повному складі». Можна завантажити гру та точку трекера до розмови.','Another outcome blocks Full Crew in this branch. Reload both the game and tracker before the conversation.')},
 {id:'ves',label:L('Исход помощи темерцам','Наслідок допомоги темерцям','Temerian rescue outcome'),stages:['novigrad','allies'],source:'crew',options:[['alive',L('Союзница спасена','Союзницю врятовано','Ally survived')],['dead',L('Союзница погибла','Союзниця загинула','Ally died')]],effect:L('Гибель закрывает участие нужных союзников. Спасение ещё не заменяет приглашение.','Загибель закриває участь потрібних союзників. Порятунок ще не замінює запрошення.','Death loses required allies. Survival alone does not confirm recruitment.')},
 {id:'ruler',label:L('Поддержка наследников островов','Підтримка спадкоємців островів','Island succession'),stages:['skellige','allies'],source:'crew',options:[['supported',L('Помог одному из наследников','Допоміг одному зі спадкоємців','Supported a sibling')],['ignored',L('Отказался помогать','Відмовився допомагати','Declined to help')]],effect:L('Отказ закрывает нужную цепочку для «Творца королей» и союзника.','Відмова закриває потрібний ланцюжок для «Творця королів» та союзника.','Declining blocks the relevant Kingmaker path and an ally.')},
 {id:'spirit',label:L('Решение в лесной деревне','Рішення в лісовому селі','Woodland decision'),stages:['skellige','free'],source:'spirit',options:[['kill',L('Охота на духа','Полювання на духа','Hunt the spirit')],['ritual',L('Мирный ритуал','Мирний ритуал','Peaceful ritual')]],effect:L('Только охота позволяет получить «Дух Леса». Ритуал не блокирует весь список ведьмачьих заказов.','Лише полювання дає «Дух Лісу». Ритуал не блокує весь список відьмацьких замовлень.','Only the hunt awards Woodland Spirit. The ritual does not block the entire witcher-contract achievement.')},
 {id:'ending',label:L('Подтверждённый исход Туссента','Підтверджений наслідок Туссента','Confirmed Toussaint outcome'),stages:['baw'],source:'guide',options:[['medal',L('Награда','Нагорода','Decoration')],['prison',L('Тюрьма','В’язниця','Prison')]],effect:L('Два достижения относятся к разным исходам одной ветки. Уже полученное остаётся в архиве.','Два досягнення належать до різних наслідків однієї гілки. Уже отримане залишається в архіві.','The two achievements require different branch outcomes. Earned achievements remain in the archive.')},
] as const;
export const defaultGoals=['walked-the-path','card-collector','full-crew'];
