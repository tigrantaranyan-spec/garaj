const SHOW_DEMO_CARS = false;

const RATES_FROM_USD = {
    USD: 1,
    AMD: 390,
    EUR: 0.92,
    RUB: 98
};

const CURRENCY_SYMBOLS = {
    USD: '$',
    AMD: '֏',
    EUR: '€',
    RUB: '₽'
};

let currentLang = 'hy';
let currentUser = null;
let currentStep = 1;
const totalSteps = 4;
let selectedLetter = 'ALL';
let selectedPhotoFiles = [];
let uploadedPhotoUrls = [];
let favorites = new Set(JSON.parse(localStorage.getItem('garaj_favorites_v2') || '[]'));
let pendingCars = [];
let serverActiveCars = [];
let myServerCars = [];
let adminUsersCache = [];
let localMessages = JSON.parse(localStorage.getItem('garaj_messages') || '[]');
let nsfwModel = null;
let activeGalleryImages = [];
let activeGalleryIdx = 0;

function applySavedTheme() {
    const saved = localStorage.getItem('garaj_theme') || 'dark';
    setSiteTheme(saved);
}

function setSiteTheme(theme) {
    const isLight = theme === 'light';
    document.body.classList.toggle('light-theme', isLight);
    localStorage.setItem('garaj_theme', isLight ? 'light' : 'dark');

    const darkBtn = document.getElementById('theme-dark-btn');
    const lightBtn = document.getElementById('theme-light-btn');
    if (darkBtn && lightBtn) {
        darkBtn.className = isLight ? 'btn-outline' : 'btn-primary';
        lightBtn.className = isLight ? 'btn-primary' : 'btn-outline';
    }
}

const TRANSLATIONS = {
    hy: {
        nav_home: 'Գլխավոր',
        nav_vin: 'Միայն VIN-ով',
        nav_fav: 'Նշվածները',
        nav_settings: 'Հաշվի կարգավորումներ',
        nav_listings: 'Հայտարարություններ',
        nav_vin_check: 'VIN Ստուգում',
        club_desc: 'Միացիր մեր ավտո հավաքին և ստացիր առավելություններ',
        btn_more: 'Ավելին',
        btn_add: '+ Հայտարարություն',
        btn_settings: 'Կարգավորումներ',
        hero_sub: 'Քո մեքենան. Քո կանոնները։',
        hero_btn: 'Դիտել հայտարարությունները',
        filter_vin: 'Միայն VIN',
        btn_search: 'Որոնել',
        new_listings: 'Նոր հայտարարություններ',
        btn_reset: 'Մաքրել ֆիլտրերը',
        modal_add_title: 'Ավելացնել հայտարարություն',
        google_login: 'Google Մուտք'
    },
    ru: {
        nav_home: 'Главная',
        nav_vin: 'Только с VIN',
        nav_fav: 'Избранное',
        nav_settings: 'Настройки аккаунта',
        nav_listings: 'Объявления',
        nav_vin_check: 'Проверка VIN',
        club_desc: 'Присоединяйся к автосообществу GARAJ в Армении',
        btn_more: 'Подробнее',
        btn_add: '+ Объявление',
        btn_settings: 'Настройки',
        hero_sub: 'Твой автомобиль. Твои правила.',
        hero_btn: 'Смотреть объявления',
        filter_vin: 'Только VIN',
        btn_search: 'Найти',
        new_listings: 'Новые объявления',
        btn_reset: 'Сбросить фильтры',
        modal_add_title: 'Добавить объявление',
        google_login: 'Google Вход'
    },
    en: {
        nav_home: 'Home',
        nav_vin: 'VIN Only',
        nav_fav: 'Favorites',
        nav_settings: 'Account Settings',
        nav_listings: 'Listings',
        nav_vin_check: 'VIN Check',
        club_desc: 'Join the GARAJ car community in Armenia',
        btn_more: 'Learn more',
        btn_add: '+ Add Listing',
        btn_settings: 'Settings',
        hero_sub: 'Your Car. Your Rules.',
        hero_btn: 'Browse Listings',
        filter_vin: 'VIN Only',
        btn_search: 'Search',
        new_listings: 'Latest Listings',
        btn_reset: 'Reset Filters',
        modal_add_title: 'Add New Listing',
        google_login: 'Google Sign In'
    }
};

const FAQ_ITEMS = [
    {
        q: 'Ինչպե՞ս տեղադրել հայտարարություն GARAJ-ում։',
        a: 'Մուտք գործեք Google հաշվով, մուտքագրեք ձեր հեռախոսահամարը, համաձայնեք կայքի կանոններին և սեղմեք «+ Հայտարարություն» կոճակը։ Լրացրեք 4 քայլերը և կցեք մեքենայի լուսանկարները։'
    },
    {
        q: 'Ինչպե՞ս զանգահարել վաճառողին կամ առաջարկել իմ գինը։',
        a: 'Բացեք ցանկացած հայտարարություն և սեղմեք կանաչ «Զանգահարել» կոճակը (ուղիղ զանգ հեռախոսից) կամ օգտագործեք «Առաջարկել իմ գինը» դաշտը՝ վաճառողին սակարկության առաջարկ ուղարկելու համար։'
    },
    {
        q: 'Ինչպե՞ս ստուգել ավտոմեքենայի VIN-կոդը և ԱՄՆ աճուրդի նկարները։',
        a: 'Օգտագործեք գլխավոր էջի «Անվճար VIN-կոդի ստուգում» դաշտը կամ բացեք հայտարարությունը. այնտեղ կան պատրաստի կոճակներ NHTSA, Carfax, BidCars և Poctra բազաների համար։'
    },
    {
        q: 'Որտեղի՞ց կարող եմ կառավարել իմ հայտարարությունները կամ փոխել կայքի գույնը։',
        a: 'Մուտք գործելուց հետո սեղմեք «Կարգավորումներ». այնտեղ կարող եք ընտրել Մուգ (սև) կամ Լուսավոր (սպիտակ) ռեժիմը, պատասխանել գնային առաջարկներին և կառավարել ձեր հայտարարությունները։'
    },
    {
        q: 'Ի՞նչ է տեղի ունենում կանոնները խախտելու դեպքում։',
        a: 'Վիրավորական արտահայտությունները (հայերեն, ռուսերեն, անգլերեն) և 18+ նկարները ավտոմատ արգելափակվում են։ Կանոնները խախտող օգտատերերի հաշիվները արգելափակվում են ադմինիստրացիայի կողմից։'
    }
];

const PROFANITY_PATTERNS = [
    /\b(բոզ|ախպերոջդ|քունեմ|ծոծ|գանդոն|պոռնիկ|հիմար|ապուշ|անասուն|քաք)\b/iu,
    /\b(boz|bozi|qunem|gandon|pornik|qak)\b/iu,
    /\b(ху[йяеёию]|п[ие]зд[аоуыеё]|еб[аоуиыеё]|бл[яеё]|сук[аиу]|мраз[ьи]|шлюх[аи]|урод[ыа]?|дебил[ыа]?|муд[ао]к)\b/iu,
    /\b(f+u+c+k+|s+h+i+t+|b+i+t+c+h+|a+s+s+h+o+l+e+|c+u+n+t+|d+i+c+k+|w+h+o+r+e+|b+a+s+t+a+r+d+)\b/i
];

function containsProfanity(text) {
    if (!text) return false;
    const normalized = String(text).replace(/[*@#$!+\-_]/g, '').replace(/\s+/g, ' ');
    return PROFANITY_PATTERNS.some(rx => rx.test(normalized));
}

const ARMENIA_LOCATIONS = {
    'Երևան': {
        'Կենտրոն': ['Կենտրոն (քաղաք)', 'Կոնդ', 'Այգեստան'],
        'Արաբկիր': ['Արաբկիր (քաղաք)', 'Կոմիտաս', 'Քանաքեռ ՀԷԿ'],
        'Աջափնյակ': ['Աջափնյակ (քաղաք)', 'Լուկաշին', 'Նորաշեն', 'Սիլիկյան'],
        'Ավան': ['Ավան (քաղաք)', 'Ավան-Առինջ'],
        'Դավթաշեն': ['Դավթաշեն 1-4 թաղ.', 'Դավթաշեն գյուղ'],
        'Էրեբունի': ['Էրեբունի (քաղաք)', 'Սարի թաղ', 'Վարդաշեն', 'Մուշավան'],
        'Քանաքեռ-Զեյթուն': ['Զեյթուն', 'Քանաքեռ'],
        'Մալաթիա-Սեբաստիա': ['Բանգլադեշ', 'Հաղթանակ', 'Շահումյան'],
        'Նոր Նորք': ['Նոր Նորք 1-9 զանգված', 'Ջրվեժի հարակից'],
        'Նորք-Մարաշ': ['Նորք', 'Մարաշ'],
        'Նուբարաշեն': ['Նուբարաշեն (քաղաք)'],
        'Շենգավիթ': ['Շենգավիթ', 'Չարբախ', 'Ներքին Շենգավիթ']
    },
    'Արարատ': {
        'Մասիս': ['Մասիս (քաղաք)', 'Նոր Խարբերդ', 'Այնթապ', 'Մարմարաշեն', 'Ջրահովիտ', 'Դարակերտ', 'Ղուկասավան', 'Հովտաշատ'],
        'Արտաշատ': ['Արտաշատ (քաղաք)', 'Մխչյան', 'Դվին', 'Շահումյան', 'Բերքանուշ', 'Դալար'],
        'Արարատ': ['Արարատ (քաղաք)', 'Արարատ գյուղ', 'Ավշար', 'Երասխ', 'Սուրենավան'],
        'Վեդի': ['Վեդի (քաղաք)', 'Ոսկետափ', 'Այգավան', 'Գոռավան', 'Դաշտաքար']
    },
    'Արմավիր': {
        'Վաղարշապատ (Էջմիածին)': ['Էջմիածին (քաղաք)', 'Զվարթնոց', 'Փարաքար', 'Մերձավան', 'Պտղունք', 'Մուսալեռ'],
        'Արմավիր': ['Արմավիր (քաղաք)', 'Նորապատ', 'Մրգաշատ', 'Հոկտեմբեր', 'Սարդարապատ'],
        'Մեծամոր': ['Մեծամոր (քաղաք)', 'Ակնալիճ', 'Տարոնիկ']
    },
    'Կոտայք': {
        'Աբովյան': ['Աբովյան (քաղաք)', 'Առինջ', 'Բալահովիտ', 'Արամուս', 'Մայակովսկի'],
        'Հրազդան': ['Հրազդան (քաղաք)', 'Ջրառատ', 'Քաղսի', 'Սոլակ'],
        'Չարենցավան': ['Չարենցավան (քաղաք)', 'Ալափարս', 'Արզական', 'Բջնի'],
        'Եղվարդ': ['Եղվարդ (քաղաք)', 'Զովունի', 'Պռոշյան', 'Քասախ', 'Նոր Հաճն'],
        'Ծաղկաձոր': ['Ծաղկաձոր (քաղաք)', 'Աղավնաձոր', 'Մարմարիկ']
    },
    'Արագածոտն': {
        'Աշտարակ': ['Աշտարակ (քաղաք)', 'Օշական', 'Կարբի', 'Ուջան', 'Ագարակ'],
        'Ապարան': ['Ապարան (քաղաք)', 'Քուչակ', 'Նիգավան', 'Վարդենիս'],
        'Թալին': ['Թալին (քաղաք)', 'Մաստարա', 'Կաթնաղբյուր']
    },
    'Գեղարքունիք': {
        'Գավառ': ['Գավառ (քաղաք)', 'Նորատուս', 'Սարուխան', 'Կարմիրգյուղ'],
        'Սևան': ['Սևան (քաղաք)', 'Ծովագյուղ', 'Չկալովկա', 'Լճաշեն'],
        'Մարտունի': ['Մարտունի (քաղաք)', 'Զոլաքար', 'Վարդենիկ', 'Երանոս'],
        'Վարդենիս': ['Վարդենիս (քաղաք)', 'Սոթք', 'Ակունք']
    },
    'Լոռի': {
        'Վանաձոր': ['Վանաձոր (քաղաք)', 'Գուգարք', 'Շահումյան', 'Դարպաս'],
        'Սպիտակ': ['Սպիտակ (քաղաք)', 'Սարամեջ', 'Շիրակամուտ'],
        'Ստեփանավան': ['Ստեփանավան (քաղաք)', 'Արմանիս', 'Ուրասար'],
        'Ալավերդի': ['Ալավերդի (քաղաք)', 'Հաղպատ', 'Սանահին', 'Օձուն']
    },
    'Շիրակ': {
        'Գյումրի': ['Գյումրի (քաղաք)', 'Ախուրյան', 'Ազատան', 'Մարմաշեն'],
        'Արթիկ': ['Արթիկ (քաղաք)', 'Պեմզաշեն', 'Հառիճ', 'Փանիկ'],
        'Մարալիկ': ['Մարալիկ (քաղաք)', 'Սառնաղբյուր', 'Անիպեմզա']
    },
    'Սյունիք': {
        'Կապան': ['Կապան (քաղաք)', 'Սյունիք գյուղ', 'Ագարակ', 'Ճակատեն'],
        'Գորիս': ['Գորիս (քաղաք)', 'Խնձորեսկ', 'Վերիշեն', 'Շինուհայր'],
        'Սիսիան': ['Սիսիան (քաղաք)', 'Անգեղակոթ', 'Շաքի'],
        'Մեղրի': ['Մեղրի (քաղաք)', 'Ագարակ (քաղաք)', 'Կարճևան']
    },
    'Տավուշ': {
        'Իջևան': ['Իջևան (քաղաք)', 'Ենոքավան', 'Գետահովիտ', 'Աչաջուր'],
        'Դիլիջան': ['Դիլիջան (քաղաք)', 'Հաղարծին', 'Թեղուտ', 'Գոշ'],
        'Բերդ': ['Բերդ (քաղաք)', 'Նավուր', 'Չինարի'],
        'Նոյեմբերյան': ['Նոյեմբերյան (քաղաք)', 'Կողբ', 'Բագրատաշեն']
    },
    'Վայոց ձոր': {
        'Եղեգնաձոր': ['Եղեգնաձոր (քաղաք)', 'Մալիշկա', 'Արենի', 'Գլաձոր'],
        'Ջերմուկ': ['Ջերմուկ (քաղաք)', 'Գնդեվազ', 'Կեչուտ'],
        'Վայք': ['Վայք (քաղաք)', 'Զառիթափ', 'Ազատեկ']
    }
};

const ALL_BRANDS = [
    'Abarth', 'Acura', 'Alfa Romeo', 'Alpina', 'Alpine', 'Aston Martin', 'Audi', 'Avatr',
    'BAIC', 'Baojun', 'Bentley', 'BMW', 'Borgward', 'Brabus', 'Brilliance', 'Bugatti', 'Buick', 'BYD',
    'Cadillac', 'Caterham', 'Changan', 'Chery', 'Chevrolet', 'Chrysler', 'Citroen', 'Cupra',
    'Dacia', 'Daewoo', 'Daihatsu', 'Datsun', 'Deepal', 'Denza', 'Dodge', 'Dongfeng', 'DS Automobiles',
    'Exeed', 'FAW', 'Ferrari', 'Fiat', 'Fisker', 'Ford', 'Foton',
    'GAC', 'GAZ', 'Geely', 'Genesis', 'GMC', 'Great Wall',
    'Haval', 'Hino', 'Holden', 'Honda', 'Hongqi', 'Hummer', 'Hyundai',
    'Infiniti', 'Iran Khodro', 'Isuzu', 'Iveco',
    'JAC', 'Jaecoo', 'Jaguar', 'Jeep', 'Jetour',
    'Kaiyi', 'Kia', 'Koenigsegg',
    'Lada', 'Lamborghini', 'Lancia', 'Land Rover', 'Leapmotor', 'Lexus', 'Li Auto', 'Lifan', 'Lincoln', 'Lotus', 'Lucid', 'Lynk & Co',
    'Mahindra', 'MAN', 'Maserati', 'Maybach', 'Mazda', 'McLaren', 'Mercedes-Benz', 'Mercury', 'MG', 'Mini', 'Mitsubishi', 'Morgan', 'Moskvich',
    'Neta', 'NIO', 'Nissan', 'Omoda', 'Opel',
    'Pagani', 'Peugeot', 'Polestar', 'Pontiac', 'Porsche', 'Proton',
    'Ram', 'Renault', 'Rimac', 'Rivian', 'Rolls-Royce', 'Rover',
    'Saab', 'Saturn', 'Scion', 'Seat', 'Seres', 'Skoda', 'Smart', 'SsangYong', 'Subaru', 'Suzuki',
    'Tank', 'Tata', 'Tesla', 'Toyota', 'UAZ',
    'Vauxhall', 'VinFast', 'Volkswagen', 'Volvo', 'Voyah',
    'Wey', 'Wuling', 'Xiaomi', 'XPeng', 'Zeekr'
];

const DEMO_CARS = [
    {
        id: 1,
        _source: 'demo',
        vehicleType: 'Մեքենա',
        category: 'Ավտոմեքենաներ արտերկրից',
        mileageState: 'Վազքով մեքենաներ',
        sellerType: 'Անհատ',
        region: 'Երևան',
        city: 'Կենտրոն',
        village: 'Կենտրոն (քաղաք)',
        brand: 'Mercedes-Benz',
        model: 'E-Class',
        year: 2020,
        mileage: 42150,
        damage: 'Չվթարված',
        gas: 'Գազ չկա',
        steering: 'Ձախ',
        customs: 'Այո',
        color: 'Սև',
        tireSize: '245/45 R18',
        headlights: 'Matrix LED / Laser',
        interiorColor: 'Սև',
        interiorType: 'Կաշվե սրահ',
        sunroof: 'Համայնապատկերային լյուկ (Panorama)',
        comfort: ['Կլիմատ-կոնտրոլ', 'Նստատեղերի տաքացում', '360 տեսախցիկ'],
        price: 35000,
        currency: 'USD',
        description: 'Իդեալական վիճակ, մաքսազերծված է։',
        phone: '+374 99 000001',
        whatsapp: '+374 99 000001',
        vinStatus: 'provided',
        vinCode: 'W1KZF8DB5LA784512',
        images: ['https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&w=800&q=80']
    }
];

let carsData = SHOW_DEMO_CARS ? [...DEMO_CARS] : [];

function getCarKey(car) {
    return `${car._source || 'demo'}_${car.id}`;
}

function isAdminUser() {
    return Boolean(currentUser && currentUser.isAdmin === true);
}

function skipIntro() {
    const overlay = document.getElementById('intro-overlay');
    if (overlay) overlay.style.display = 'none';
}

setTimeout(skipIntro, 3000);

function closeAllModals() {
    ['add-modal', 'account-modal', 'google-auth-modal', 'moderation-modal',
     'car-details-modal', 'favorites-modal', 'messages-modal', 'support-modal', 'rules-modal']
        .forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('open');
        });
}

function goHome(e) {
    if (e) e.preventDefault();
    closeAllModals();
    document.getElementById('sidebar').classList.remove('open');
    resetFilters();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleLangMenu() {
    document.getElementById('lang-menu').classList.toggle('open');
}

function setLanguage(lang) {
    currentLang = lang;
    document.getElementById('lang-btn').textContent = lang.toUpperCase();
    document.getElementById('lang-menu').classList.remove('open');

    const dict = TRANSLATIONS[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) el.textContent = dict[key];
    });
    updateAuthUI();
    applyFilters();
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.lang-dropdown-wrap')) {
        const menu = document.getElementById('lang-menu');
        if (menu) menu.classList.remove('open');
    }
});

async function checkServerSession() {
    try {
        const res = await fetch('check_auth.php');
        const data = await res.json();
        if (data.logged_in && data.user) {
            currentUser = data.user;
        } else {
            currentUser = null;
        }
    } catch (e) {
        currentUser = null;
    }
    updateAuthUI();
}

async function loadCarsFromServer() {
    try {
        const res = await fetch('get_cars.php');
        const data = await res.json();
        if (data.success) {
            serverActiveCars = (data.cars || []).map(c => ({ ...c, _source: 'server' }));
            myServerCars = data.my_cars || [];
            carsData = SHOW_DEMO_CARS ? [...serverActiveCars, ...DEMO_CARS] : [...serverActiveCars];
            pendingCars = isAdminUser() ? (data.pending || []) : [];
            updatePendingCounts();
            applyFilters();
            if (document.getElementById('account-modal')?.classList.contains('open')) {
                renderMyCarsList();
            }
        }
    } catch (e) {
        renderCars(carsData);
    }
}

function updatePendingCounts() {
    const count = isAdminUser() ? pendingCars.length : 0;
    const topEl = document.getElementById('pending-count-top');
    const sideEl = document.getElementById('pending-count-side');
    if (topEl) topEl.textContent = count;
    if (sideEl) sideEl.textContent = count;
}

// FAQ
function renderFaq() {
    const container = document.getElementById('faq-list');
    if (!container) return;
    container.innerHTML = '';

    FAQ_ITEMS.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'garaj-faq-item' + (index === 0 ? ' is-open' : '');

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'garaj-faq-btn';
        btn.innerHTML = `<span>${item.q}</span><span class="garaj-faq-plus">+</span>`;

        const body = document.createElement('div');
        body.className = 'garaj-faq-body';
        body.textContent = item.a;

        btn.onclick = () => {
            div.classList.toggle('is-open');
        };

        div.appendChild(btn);
        div.appendChild(body);
        container.appendChild(div);
    });
}

// Калькулятор растаможки и оформления в Армении
function calculateArmeniaCustoms() {
    const out = document.getElementById('calc-customs-result');
    if (!out) return;

    const priceUsd = Math.max(0, Number(document.getElementById('calc-car-usd')?.value || 0));
    const ageType = document.getElementById('calc-car-age')?.value || 'mid';
    const engineCc = Math.max(0, Number(document.getElementById('calc-engine-cc')?.value || 0));

    let dutyUsd = 0;
    if (ageType === 'ev') {
        dutyUsd = 0;
    } else if (ageType === 'new') {
        dutyUsd = priceUsd * 0.15;
    } else if (ageType === 'mid') {
        dutyUsd = priceUsd * 0.20;
    } else {
        dutyUsd = engineCc * 0.45;
    }

    const vatUsd = ageType === 'ev' ? 0 : (priceUsd + dutyUsd) * 0.20;
    const regAmd = 45000;
    const totalCustomsUsd = dutyUsd + vatUsd;
    const totalCustomsAmd = Math.round(totalCustomsUsd * RATES_FROM_USD.AMD) + regAmd;

    out.innerHTML = `
        <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;">
            <div>
                <div style="font-size:11px;color:#9ca3af;">Մաքսատուրք + ԱԱՀ + Հաշվառում (մոտավոր)</div>
                <div style="font-size:16px;font-weight:800;color:#16a34a;">$${Math.round(totalCustomsUsd).toLocaleString('en-US')} • ${totalCustomsAmd.toLocaleString('en-US')} ֏</div>
            </div>
            <div style="font-size:12px;">
                <div>Մաքսատուրք՝ $${Math.round(dutyUsd).toLocaleString('en-US')}</div>
                <div>ԱԱՀ (20%)՝ $${Math.round(vatUsd).toLocaleString('en-US')} • ՊԵԿ/ՃՈ՝ 45,000 ֏</div>
            </div>
        </div>
    `;
}

// VIN-проверка + ссылки на аукционы США
async function fetchVinDecodedInfo(vin) {
    const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`);
    const data = await res.json();
    return (data.Results && data.Results[0]) ? data.Results[0] : null;
}

function buildVinLinksHtml(vin) {
    const carfaxUrl = `https://www.carfax.com/VehicleHistory/p/Report.cfx?partner=DVW_1&vin=${vin}`;
    const bidcarsUrl = `https://bid.cars/en/search/results?search-type=typing&query=${vin}`;
    const poctraUrl = `https://poctra.com/search/${vin}`;
    const googleUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(vin)}`;

    return `
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
            <a href="${carfaxUrl}" target="_blank" class="btn-primary" style="text-decoration:none;font-size:12px;">Carfax</a>
            <a href="${bidcarsUrl}" target="_blank" class="btn-outline" style="text-decoration:none;font-size:12px;">BidCars (Աճուրդ)</a>
            <a href="${poctraUrl}" target="_blank" class="btn-outline" style="text-decoration:none;font-size:12px;">Poctra (Copart/IAAI)</a>
            <a href="${googleUrl}" target="_blank" class="btn-outline" style="text-decoration:none;font-size:12px;">Google Նկարներ</a>
        </div>
    `;
}

async function checkPublicVin() {
    const input = document.getElementById('public-vin-input');
    const out = document.getElementById('public-vin-result');
    const vin = (input ? input.value : '').trim().toUpperCase();

    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
        out.innerHTML = '<span style="color:#dc2626;">Սխալ VIN-կոդ։ Անհրաժեշտ է 17 նիշ (առանց I, O, Q տառերի)։</span>';
        return;
    }

    out.innerHTML = '<span style="color:#d97706;">Ստուգվում է VIN-ը NHTSA միջազգային բազայում...</span>';
    try {
        const info = await fetchVinDecodedInfo(vin);
        const linksHtml = buildVinLinksHtml(vin);

        if (info && info.Make) {
            const specs = [
                info.BodyClass ? `Թափք՝ ${info.BodyClass}` : '',
                info.DisplacementL ? `Շարժիչ՝ ${info.DisplacementL}L` : '',
                info.FuelTypePrimary ? `Վառելիք՝ ${info.FuelTypePrimary}` : '',
                info.DriveType ? `Քարշակ՝ ${info.DriveType}` : '',
                info.PlantCountry ? `Երկիր՝ ${info.PlantCountry}` : ''
            ].filter(Boolean).join(' • ');

            out.innerHTML = `
                <div class="block-box" style="margin:0;">
                    <div style="color:#16a34a;font-weight:700;font-size:14px;">
                        ${info.Make} ${info.Model || ''} ${info.ModelYear ? `(${info.ModelYear})` : ''}
                    </div>
                    <div style="font-size:12px;margin-top:4px;">${specs || 'Հիմնական գործարանային տվյալները հաստատված են'}</div>
                    ${linksHtml}
                </div>
            `;
        } else {
            out.innerHTML = `
                <div class="block-box" style="margin:0;">
                    <div style="color:#d97706;">VIN ձևաչափը ճիշտ է, տվյալները կարող եք ստուգել ստորև նշված բազաներում․</div>
                    ${linksHtml}
                </div>
            `;
        }
    } catch (e) {
        out.innerHTML = '<span style="color:#dc2626;">Չհաջողվեց կապվել VIN բազայի հետ, փորձեք կրկին։</span>';
    }
}

// Правила
function openRulesModal() {
    document.getElementById('rules-modal').classList.add('open');
}

function closeRulesModal() {
    document.getElementById('rules-modal').classList.remove('open');
}

// Избранное (выделяет строго 1 публикацию)
function updateFavCounters() {
    const c = favorites.size;
    const topFav = document.getElementById('fav-count');
    const botFav = document.getElementById('fav-count-bottom');
    if (topFav) topFav.textContent = c;
    if (botFav) botFav.textContent = c;
    localStorage.setItem('garaj_favorites_v2', JSON.stringify(Array.from(favorites)));
}

function toggleFav(carKey, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
    }
    const key = String(carKey);
    if (favorites.has(key)) {
        favorites.delete(key);
    } else {
        favorites.add(key);
    }
    updateFavCounters();

    const isSaved = favorites.has(key);
    document.querySelectorAll(`.fav-btn[data-car-key="${key}"]`).forEach(btn => {
        btn.classList.toggle('active', isSaved);
        btn.textContent = isSaved ? 'Նշված է' : 'Պահել';
    });

    if (document.getElementById('favorites-modal').classList.contains('open')) {
        renderFavoritesModal();
    }
}

function openFavoritesModal() {
    renderFavoritesModal();
    document.getElementById('favorites-modal').classList.add('open');
}

function closeFavoritesModal() {
    document.getElementById('favorites-modal').classList.remove('open');
}

function renderFavoritesModal() {
    const listEl = document.getElementById('favorites-list');
    const favCars = carsData.filter(car => favorites.has(getCarKey(car)));
    if (!favCars.length) {
        listEl.innerHTML = '<div style="grid-column:1/-1;padding:24px;text-align:center;color:#9ca3af;font-size:13px;">Նշված հայտարարություններ դեռ չկան։ Սեղմեք «Պահել» ցանկացած մեքենայի վրա։</div>';
        return;
    }
    listEl.innerHTML = '';
    favCars.forEach(car => {
        const key = getCarKey(car);
        const imgSrc = (car.images && car.images[0]) || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80';
        const card = document.createElement('div');
        card.className = 'car-card';
        card.onclick = () => {
            closeFavoritesModal();
            openCarDetails(car);
        };
        card.innerHTML = `
            <div class="car-img-wrap">
                <button type="button" class="fav-btn active" data-car-key="${key}" onclick="toggleFav('${key}', event)">Հեռացնել</button>
                <img src="${imgSrc}" alt="${car.brand} ${car.model}">
            </div>
            <div class="car-body">
                <div class="car-title">${car.brand} ${car.model} (${car.year})</div>
                <div class="car-meta">${formatMoney(car.price, car.currency)}</div>
            </div>
        `;
        listEl.appendChild(card);
    });
}

// Сообщения
async function sendMessageToSeller(car) {
    const inputEl = document.getElementById('seller-msg-input');
    const text = (inputEl ? inputEl.value : '').trim();
    if (!text) {
        alert('Խնդրում ենք գրել հաղորդագրությունը');
        return;
    }
    if (containsProfanity(text)) {
        alert('Արգելվում են վիրավորական արտահայտությունները։');
        return;
    }

    const payload = {
        car_id: car.id,
        car_title: `${car.brand} ${car.model} (${car.year})`,
        receiver_phone: car.phone || '',
        sender_name: currentUser ? currentUser.name : 'Հաճախորդ',
        sender_email: currentUser ? currentUser.email : 'guest@garaj.am',
        message_text: text,
        created_at: new Date().toLocaleString()
    };

    try {
        await fetch('messages.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (e) {}

    localMessages.unshift(payload);
    localStorage.setItem('garaj_messages', JSON.stringify(localMessages));
    if (inputEl) inputEl.value = '';
    alert('Հաղորդագրությունը ուղարկվեց վաճառողին։');
}

async function openMessagesModal() {
    let msgs = [...localMessages];
    try {
        const res = await fetch('messages.php');
        const data = await res.json();
        if (data.success && Array.isArray(data.messages) && data.messages.length) {
            msgs = data.messages;
        }
    } catch (e) {}

    const container = document.getElementById('messages-list');
    if (!msgs.length) {
        container.innerHTML = '<div style="padding:20px;text-align:center;color:#9ca3af;font-size:13px;">Հաղորդագրություններ դեռ չկան։ Բացեք ցանկացած մեքենա և գրեք վաճառողին։</div>';
    } else {
        container.innerHTML = '';
        msgs.forEach(m => {
            const box = document.createElement('div');
            box.className = 'block-box';
            box.innerHTML = `
                <div style="font-size:12px;color:#e51926;font-weight:700;">${m.car_title || 'Ընդհանուր նամակ'} • ${m.sender_name || ''}</div>
                <div style="font-size:13px;margin-top:6px;">${m.message_text}</div>
                <div style="font-size:11px;color:#9ca3af;margin-top:4px;">${m.receiver_phone ? 'Հեռ.՝ ' + m.receiver_phone + ' • ' : ''}${m.created_at || ''}</div>
            `;
            container.appendChild(box);
        });
    }
    document.getElementById('messages-modal').classList.add('open');
}

function closeMessagesModal() {
    document.getElementById('messages-modal').classList.remove('open');
}

// Поддержка
function openSupportModal() {
    document.getElementById('support-modal').classList.add('open');
}

function closeSupportModal() {
    document.getElementById('support-modal').classList.remove('open');
}

async function handleSupportSubmit(e) {
    e.preventDefault();
    const text = document.getElementById('support-message-text').value.trim();
    if (!text) return;
    if (containsProfanity(text)) {
        alert('Արգելվում են վիրավորական արտահայտությունները։');
        return;
    }

    const payload = {
        car_id: null,
        car_title: 'Սպասարկում (Աջակցություն)',
        receiver_phone: '',
        sender_name: currentUser ? currentUser.name : 'Հաճախորդ',
        sender_email: currentUser ? currentUser.email : 'guest@garaj.am',
        message_text: text,
        created_at: new Date().toLocaleString()
    };

    try {
        await fetch('messages.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (err) {}

    localMessages.unshift(payload);
    localStorage.setItem('garaj_messages', JSON.stringify(localMessages));
    document.getElementById('support-message-text').value = '';
    closeSupportModal();
    alert('Ձեր հարցումն ուղարկվեց սպասարկման բաժին։');
}

// Предложить свою цену
async function submitPriceOffer(car) {
    if (car._source !== 'server') {
        alert('Գնային առաջարկ կարելի է ուղարկել միայն հրապարակված հայտարարություններին։');
        return;
    }
    const priceInput = document.getElementById('offer-price-input');
    const phoneInput = document.getElementById('offer-phone-input');
    const offered = Number(priceInput?.value || 0);
    const phone = (phoneInput?.value || (currentUser ? currentUser.phone : '')).trim();
    const buyerName = currentUser ? currentUser.name : 'Գնորդ';

    if (offered <= 0 || phone.length < 6) {
        alert('Մուտքագրեք ձեր առաջարկած գինը և հեռախոսահամարը։');
        return;
    }

    try {
        const res = await fetch('price_offers.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'create',
                car_id: car.id,
                buyer_name: buyerName,
                buyer_phone: phone,
                offered_price: offered,
                currency: car.currency
            })
        });
        const data = await res.json();
        alert(data.message || 'Առաջարկը ուղարկվեց։');
        if (data.success && priceInput) priceInput.value = '';
    } catch (e) {
        alert('Սխալ սերվերի հետ կապվելիս');
    }
}

async function loadIncomingPriceOffers() {
    const box = document.getElementById('incoming-offers-list');
    if (!box || !currentUser) return;
    try {
        const res = await fetch('price_offers.php');
        const data = await res.json();
        const offers = data.offers || [];
        if (!offers.length) {
            box.innerHTML = '<div style="font-size:12px;color:#9ca3af;">Նոր գնային առաջարկներ դեռ չկան։</div>';
            return;
        }
        box.innerHTML = '';
        offers.forEach(o => {
            const st = o.status === 'accepted'
                ? '<span style="color:#16a34a;">Ընդունված է</span>'
                : o.status === 'rejected'
                    ? '<span style="color:#dc2626;">Մերժված է</span>'
                    : '<span style="color:#d97706;">Նոր առաջարկ</span>';

            const row = document.createElement('div');
            row.className = 'block-box';
            row.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
                    <div>
                        <div style="font-size:13px;font-weight:700;">${o.brand} ${o.model} (${o.year})</div>
                        <div style="font-size:12px;">Առաջարկ՝ <strong>${formatMoney(o.offered_price, o.currency)}</strong> (Ձեր գինը՝ ${formatMoney(o.original_price, o.original_currency)})</div>
                        <div style="font-size:11px;color:#9ca3af;">${o.buyer_name} • <a href="tel:${normalizePhoneForTel(o.buyer_phone)}" style="color:#16a34a;">${o.buyer_phone}</a> • ${st}</div>
                    </div>
                    ${o.status === 'pending' ? `
                        <div style="display:flex;gap:8px;">
                            <button type="button" class="btn-primary" style="background:#16a34a;" onclick="respondPriceOffer(${o.id}, 'accepted')">Ընդունել</button>
                            <button type="button" class="btn-outline" onclick="respondPriceOffer(${o.id}, 'rejected')">Մերժել</button>
                        </div>
                    ` : ''}
                </div>
            `;
            box.appendChild(row);
        });
    } catch (e) {}
}

async function respondPriceOffer(offerId, decision) {
    try {
        const res = await fetch('price_offers.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'respond', offer_id: offerId, decision })
        });
        const data = await res.json();
        if (data.success) await loadIncomingPriceOffers();
    } catch (e) {}
}

// Жалоба
async function reportCar(car) {
    const reason = prompt(`Նշեք բողոքի պատճառը (${car.brand} ${car.model}):`);
    if (!reason || reason.trim().length < 3) return;
    if (containsProfanity(reason)) {
        alert('Արգելվում են վիրավորական արտահայտությունները։');
        return;
    }
    try {
        await fetch('admin_users.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'report',
                car_id: car._source === 'server' ? car.id : null,
                reason: `${car.brand} ${car.model}: ${reason.trim()}`
            })
        });
    } catch (e) {}
    alert('Բողոքը ուղարկվեց ադմինիստրացիային։');
}

// Админ-панель
function openModerationModal() {
    if (!isAdminUser()) {
        alert('Մուտքն արգելված է։ Այս բաժինը միայն ադմինիստրատորի համար է։');
        return;
    }
    switchAdminTab('cars');
    renderModerationList();
    loadAdminData();
    document.getElementById('moderation-modal').classList.add('open');
}

function closeModerationModal() {
    document.getElementById('moderation-modal').classList.remove('open');
}

function switchAdminTab(tab) {
    ['cars', 'users', 'reports'].forEach(t => {
        const panel = document.getElementById(`admin-tab-${t}`);
        const btn = document.getElementById(`tab-btn-${t}`);
        if (panel) panel.style.display = t === tab ? 'block' : 'none';
        if (btn) btn.className = t === tab ? 'btn-primary' : 'btn-outline';
    });
    if (tab === 'users' || tab === 'reports') {
        loadAdminData();
    }
}

async function loadAdminData() {
    if (!isAdminUser()) return;
    try {
        const res = await fetch('admin_users.php');
        const data = await res.json();
        if (!data.success) return;

        const statsBox = document.getElementById('admin-stats-grid');
        if (statsBox && data.stats) {
            statsBox.innerHTML = `
                <div class="admin-stat-box"><div style="font-size:11px;color:#9ca3af;">Ակտիվ հայտ.</div><div style="font-size:18px;font-weight:800;">${data.stats.active_cars}</div></div>
                <div class="admin-stat-box"><div style="font-size:11px;color:#9ca3af;">Սպասող</div><div style="font-size:18px;font-weight:800;color:#d97706;">${data.stats.pending_cars}</div></div>
                <div class="admin-stat-box"><div style="font-size:11px;color:#9ca3af;">Օգտատերեր</div><div style="font-size:18px;font-weight:800;">${data.stats.total_users}</div></div>
                <div class="admin-stat-box"><div style="font-size:11px;color:#9ca3af;">Արգելափակված</div><div style="font-size:18px;font-weight:800;color:#dc2626;">${data.stats.banned_users}</div></div>
                <div class="admin-stat-box"><div style="font-size:11px;color:#9ca3af;">Բողոքներ</div><div style="font-size:18px;font-weight:800;">${data.stats.total_reports}</div></div>
            `;
        }

        adminUsersCache = data.users || [];
        renderAdminUsersList();

        const repEl = document.getElementById('admin-reports-list');
        if (repEl) {
            repEl.innerHTML = (data.reports || []).length
                ? data.reports.map(r => `
                    <div class="block-box" style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;font-size:12px;">
                        <div><strong>#${r.id}</strong> ${r.reason} <span style="color:#9ca3af;">(${r.reporter_email || ''} • ${r.created_at})</span></div>
                        <button type="button" class="btn-outline" onclick="deleteAdminReport(${r.id})">Փակել</button>
                    </div>
                `).join('')
                : '<div style="color:#9ca3af;font-size:12px;">Բողոքներ չկան։</div>';
        }

        const logEl = document.getElementById('admin-logs-list');
        if (logEl) {
            logEl.innerHTML = (data.logs || []).length
                ? data.logs.map(l => `<div class="block-box" style="font-size:12px;">${l.admin_email} — <strong>${l.action_text}</strong> <span style="color:#9ca3af;">(${l.created_at})</span></div>`).join('')
                : '<div style="color:#9ca3af;font-size:12px;">Լոգեր դեռ չկան։</div>';
        }
    } catch (e) {}
}

function renderAdminUsersList() {
    const box = document.getElementById('admin-users-list');
    if (!box) return;
    const q = (document.getElementById('admin-user-search')?.value || '').trim().toLowerCase();
    const list = adminUsersCache.filter(u =>
        !q || `${u.name} ${u.google_email} ${u.phone}`.toLowerCase().includes(q)
    );

    if (!list.length) {
        box.innerHTML = '<div style="color:#9ca3af;font-size:12px;">Օգտատերեր չեն գտնվել։</div>';
        return;
    }

    box.innerHTML = '';
    list.forEach(u => {
        const banned = Number(u.is_banned) === 1;
        const isRootAdmin = Number(u.is_admin) === 1;
        const row = document.createElement('div');
        row.className = 'block-box';
        row.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
                <div>
                    <div style="font-size:13px;font-weight:700;">${u.name} ${isRootAdmin ? '<span style="color:#d97706;">(ADMIN)</span>' : ''}</div>
                    <div style="font-size:12px;color:#9ca3af;">${u.google_email} • Հեռ.՝ ${u.phone}</div>
                    <div style="font-size:11px;margin-top:3px;color:${banned ? '#dc2626' : '#16a34a'};">
                        ${banned ? 'Արգելափակված է (BANNED)' : 'Ակտիվ հաշիվ'}
                    </div>
                </div>
                ${isRootAdmin ? '' : `
                    <button type="button" class="btn-primary" style="background:${banned ? '#16a34a' : '#dc2626'};"
                        onclick="toggleUserBan(${u.id}, ${banned ? 0 : 1})">
                        ${banned ? 'Ապաբանել' : 'Բանել օգտատիրոջը'}
                    </button>
                `}
            </div>
        `;
        box.appendChild(row);
    });
}

async function toggleUserBan(userId, banState) {
    if (!isAdminUser()) return;
    const res = await fetch('admin_users.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ban', user_id: userId, is_banned: banState })
    });
    const data = await res.json();
    if (data.success) await loadAdminData();
}

async function deleteAdminReport(reportId) {
    if (!isAdminUser()) return;
    const res = await fetch('admin_users.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_report', report_id: reportId })
    });
    const data = await res.json();
    if (data.success) await loadAdminData();
}

function renderModerationList() {
    if (!isAdminUser()) return;

    const pendingContainer = document.getElementById('moderation-pending-list');
    const activeContainer = document.getElementById('moderation-active-list');

    if (!pendingCars.length) {
        pendingContainer.innerHTML = '<div style="padding:14px;color:#9ca3af;font-size:12px;">Ստուգման սպասող հայտարարություններ չկան։</div>';
    } else {
        pendingContainer.innerHTML = '';
        pendingCars.forEach(car => {
            const imgSrc = (car.images && car.images[0]) || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80';
            const loc = [car.region, car.city, car.village].filter(Boolean).join(', ');
            const mainPrice = formatMoney(car.price, car.currency);

            const item = document.createElement('div');
            item.className = 'block-box';
            item.innerHTML = `
                <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap;">
                    <img src="${imgSrc}" style="width:120px;height:84px;object-fit:cover;border-radius:10px;">
                    <div style="flex:1;min-width:200px;">
                        <div style="font-size:14px;font-weight:700;">${car.brand} ${car.model} (${car.year}) — ${mainPrice}</div>
                        <div style="font-size:12px;color:#9ca3af;margin-top:4px;">${loc} • Վազք՝ ${Number(car.mileage).toLocaleString('en-US')} կմ • ${car.sellerType}</div>
                        <div style="font-size:12px;margin-top:4px;">VIN՝ ${car.vinCode || car.vinStatus} • Հեռախոս՝ ${car.phone}</div>
                    </div>
                    <div style="display:flex;gap:8px;">
                        <button type="button" class="btn-primary" style="background:#16a34a;" onclick="moderateCar(${car.id}, 'approve')">Հրապարակել</button>
                        <button type="button" class="btn-primary" onclick="moderateCar(${car.id}, 'reject')">Մերժել</button>
                    </div>
                </div>
            `;
            pendingContainer.appendChild(item);
        });
    }

    if (!serverActiveCars.length) {
        activeContainer.innerHTML = '<div style="padding:14px;color:#9ca3af;font-size:12px;">Բազայում հրապարակված հայտարարություններ չկան։</div>';
    } else {
        activeContainer.innerHTML = '';
        serverActiveCars.forEach(car => {
            const imgSrc = (car.images && car.images[0]) || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80';
            const mainPrice = formatMoney(car.price, car.currency);
            const item = document.createElement('div');
            item.className = 'block-box';
            item.innerHTML = `
                <div style="display:flex;gap:14px;align-items:center;justify-content:space-between;flex-wrap:wrap;">
                    <div style="display:flex;gap:12px;align-items:center;">
                        <img src="${imgSrc}" style="width:90px;height:64px;object-fit:cover;border-radius:8px;">
                        <div>
                            <div style="font-size:13px;font-weight:700;">${car.isVip ? '[VIP] ' : ''}${car.brand} ${car.model} (${car.year}) — ${mainPrice}</div>
                            <div style="font-size:11px;color:#9ca3af;">${car.region}${car.city ? ', ' + car.city : ''} • Հեռ.՝ ${car.phone}</div>
                        </div>
                    </div>
                    <div style="display:flex;gap:8px;">
                        <button type="button" class="btn-outline" onclick="moderateCar(${car.id}, 'toggle_vip')">${car.isVip ? 'Հանել VIP-ից' : 'Դարձնել VIP'}</button>
                        <button type="button" class="btn-primary" onclick="moderateCar(${car.id}, 'delete')">Ջնջել</button>
                    </div>
                </div>
            `;
            activeContainer.appendChild(item);
        });
    }
}

async function moderateCar(carId, decision) {
    if (!isAdminUser()) return;
    try {
        const res = await fetch('moderate_car.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ car_id: carId, decision })
        });
        const data = await res.json();
        if (data.success) {
            await loadCarsFromServer();
            renderModerationList();
            loadAdminData();
        } else {
            alert(data.message || 'Սխալ');
        }
    } catch (e) {
        alert('Չհաջողվեց կապվել սերվերի հետ');
    }
}

// Google Auth и личный кабинет
function openGoogleAuthModal() {
    if (currentUser) {
        openAccountModal();
        return;
    }
    document.getElementById('google-auth-modal').classList.add('open');
}

function closeGoogleAuthModal() {
    document.getElementById('google-auth-modal').classList.remove('open');
}

async function handleGoogleAuthSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('google-email').value.trim();
    const name = document.getElementById('google-name').value.trim();
    const phone = document.getElementById('google-phone').value.trim();
    const agreed = document.getElementById('google-rules-agree').checked;

    if (!agreed) {
        alert('Խնդրում ենք հաստատել համաձայնությունը կայքի կանոններին։');
        return;
    }
    if (containsProfanity(name)) {
        alert('Անունը պարունակում է արգելված բառեր։');
        return;
    }
    if (!email || !name || phone.length < 6) {
        alert('Խնդրում ենք լրացնել Google հաշիվը, անունը և պարտադիր հեռախոսահամարը:');
        return;
    }

    try {
        const res = await fetch('google_auth.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'login', email, name, phone, agreed })
        });
        const data = await res.json();
        if (data.success) {
            currentUser = data.user;
            if (!isAdminUser()) {
                pendingCars = [];
                closeModerationModal();
            }
            closeGoogleAuthModal();
            updateAuthUI();
            await loadCarsFromServer();
            return;
        } else if (data.message) {
            alert(data.message);
            return;
        }
    } catch (err) {
        alert('Սխալ սերվերի հետ կապվելիս');
    }
}

function openAccountModal() {
    if (!currentUser) {
        openGoogleAuthModal();
        return;
    }
    document.getElementById('account-email-label').textContent = `Google: ${currentUser.email}`;
    document.getElementById('acc-name').value = currentUser.name;
    document.getElementById('acc-phone').value = currentUser.phone;
    document.getElementById('acc-whatsapp').value = currentUser.whatsapp || '';
    document.getElementById('acc-seller-type').value = currentUser.sellerType || 'Անհատ';
    renderMyCarsList();
    loadIncomingPriceOffers();
    document.getElementById('account-modal').classList.add('open');
}

function closeAccountModal() {
    document.getElementById('account-modal').classList.remove('open');
}

function renderMyCarsList() {
    const box = document.getElementById('my-cars-list');
    if (!box) return;
    if (!myServerCars.length) {
        box.innerHTML = '<div style="font-size:12px;color:#9ca3af;">Դուք դեռ չունեք ավելացված հայտարարություններ։</div>';
        return;
    }

    const statusLabels = {
        pending: '<span style="color:#d97706;">Սպասում է ստուգման</span>',
        active: '<span style="color:#16a34a;">Հրապարակված է</span>',
        rejected: '<span style="color:#dc2626;">Մերժված է</span>',
        sold: '<span style="color:#6b7280;">Վաճառված է</span>'
    };

    box.innerHTML = '';
    myServerCars.forEach(car => {
        const div = document.createElement('div');
        div.className = 'block-box';
        div.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
                <div>
                    <div style="font-size:13px;font-weight:700;">${car.brand} ${car.model} (${car.year}) — ${formatMoney(car.price, car.currency)}</div>
                    <div style="font-size:11px;margin-top:3px;">Կարգավիճակ՝ ${statusLabels[car.status] || car.status} • Դիտումներ՝ ${car.viewsCount || 0}</div>
                </div>
                <div style="display:flex;gap:8px;">
                    ${car.status === 'active' ? `<button type="button" class="btn-outline" onclick="manageMyCar(${car.id}, 'mark_sold')">Վաճառված է</button>` : ''}
                    <button type="button" class="btn-primary" onclick="manageMyCar(${car.id}, 'delete')">Ջնջել</button>
                </div>
            </div>
        `;
        box.appendChild(div);
    });
}

async function manageMyCar(carId, action) {
    try {
        const res = await fetch('user_car_action.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ car_id: carId, action })
        });
        const data = await res.json();
        if (data.success) {
            await loadCarsFromServer();
        }
    } catch (e) {}
}

async function handleSaveAccount(e) {
    e.preventDefault();
    const name = document.getElementById('acc-name').value.trim();
    const phone = document.getElementById('acc-phone').value.trim();
    const whatsapp = document.getElementById('acc-whatsapp').value.trim();
    const sellerType = document.getElementById('acc-seller-type').value;

    if (containsProfanity(name)) {
        alert('Անունը պարունակում է արգելված բառեր։');
        return;
    }
    if (phone.length < 6) {
        alert('Հեռախոսահամարը պարտադիր է:');
        return;
    }

    try {
        const res = await fetch('google_auth.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update', name, phone, whatsapp, sellerType })
        });
        const data = await res.json();
        if (data.success) {
            currentUser = data.user;
            closeAccountModal();
            updateAuthUI();
            return;
        }
    } catch (err) {}

    currentUser.name = name;
    currentUser.phone = phone;
    currentUser.whatsapp = whatsapp;
    currentUser.sellerType = sellerType;
    closeAccountModal();
    updateAuthUI();
}

async function logoutAccount() {
    try {
        await fetch('logout.php');
    } catch (e) {}
    currentUser = null;
    pendingCars = [];
    myServerCars = [];
    closeAccountModal();
    closeModerationModal();
    updateAuthUI();
    updatePendingCounts();
}

function handleAddClick() {
    if (!currentUser) {
        openGoogleAuthModal();
        return;
    }
    openAddModal();
}

function updateAuthUI() {
    const authBtn = document.getElementById('auth-btn');
    const addBtn = document.getElementById('add-listing-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const sidebarSettings = document.getElementById('sidebar-settings-link');
    const modBtn = document.getElementById('moderation-btn');
    const sideModLink = document.getElementById('sidebar-moderation-link');
    const dict = TRANSLATIONS[currentLang];

    if (currentUser) {
        authBtn.textContent = currentUser.name;
        addBtn.style.display = 'inline-block';
        settingsBtn.style.display = 'inline-block';
        sidebarSettings.style.display = 'block';

        const showAdmin = isAdminUser();
        modBtn.style.display = showAdmin ? 'inline-block' : 'none';
        sideModLink.style.display = showAdmin ? 'block' : 'none';
        if (!showAdmin) closeModerationModal();
    } else {
        authBtn.textContent = dict.google_login;
        addBtn.style.display = 'none';
        settingsBtn.style.display = 'none';
        sidebarSettings.style.display = 'none';
        modBtn.style.display = 'none';
        sideModLink.style.display = 'none';
        closeModerationModal();
    }
    updatePendingCounts();
}

function toggleMobileMenu() {
    document.getElementById('sidebar').classList.toggle('open');
}

function toUsd(amount, currency) {
    return amount / (RATES_FROM_USD[currency] || 1);
}

function formatMoney(amount, currency) {
    const rounded = Math.round(amount).toLocaleString('en-US');
    const sym = CURRENCY_SYMBOLS[currency] || currency;
    return currency === 'USD' || currency === 'EUR' ? `${sym}${rounded}` : `${rounded} ${sym}`;
}

function buildConversionLine(price, currency) {
    const usd = toUsd(price, currency);
    const others = ['USD', 'AMD', 'EUR', 'RUB'].filter(c => c !== currency);
    return others.map(c => formatMoney(usd * RATES_FROM_USD[c], c)).join(' • ');
}

function populateTopBrandFilter() {
    const sel = document.getElementById('brand-filter');
    ALL_BRANDS.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b;
        opt.textContent = b;
        sel.appendChild(opt);
    });
}

function populateRegions() {
    const regionSel = document.getElementById('region-select');
    regionSel.innerHTML = '<option value="">Ընտրեք մարզը...</option>';
    Object.keys(ARMENIA_LOCATIONS).forEach(region => {
        const opt = document.createElement('option');
        opt.value = region;
        opt.textContent = region;
        regionSel.appendChild(opt);
    });
}

function updateCities() {
    const region = document.getElementById('region-select').value;
    const citySel = document.getElementById('city-select');
    const villageSel = document.getElementById('village-select');
    citySel.innerHTML = '<option value="">Ընտրեք քաղաքը / շրջանը</option>';
    villageSel.innerHTML = '<option value="">Նախ ընտրեք քաղաքը</option>';

    if (ARMENIA_LOCATIONS[region]) {
        Object.keys(ARMENIA_LOCATIONS[region]).forEach(city => {
            const opt = document.createElement('option');
            opt.value = city;
            opt.textContent = city;
            citySel.appendChild(opt);
        });
    }
}

function updateVillages() {
    const region = document.getElementById('region-select').value;
    const city = document.getElementById('city-select').value;
    const villageSel = document.getElementById('village-select');
    villageSel.innerHTML = '<option value="">Ընտրեք բնակավայրը / գյուղը</option>';

    if (ARMENIA_LOCATIONS[region] && ARMENIA_LOCATIONS[region][city]) {
        ARMENIA_LOCATIONS[region][city].forEach(village => {
            const opt = document.createElement('option');
            opt.value = village;
            opt.textContent = village;
            villageSel.appendChild(opt);
        });
    }
}

function renderCars(list) {
    const grid = document.getElementById('cars-grid');
    document.getElementById('cars-count').textContent = list.length;
    grid.innerHTML = '';

    if (!list.length) {
        const emptyLabel = currentLang === 'ru'
            ? 'Пока что нет объявлений.'
            : currentLang === 'en'
                ? 'No listings yet.'
                : 'Առայժմ հայտարարություններ չկան (Пока что нет объявлений)։';

        grid.innerHTML = `<div class="garaj-empty-state">${emptyLabel}</div>`;
        return;
    }

    list.forEach(car => {
        const key = getCarKey(car);
        const mainPrice = formatMoney(car.price, car.currency);
        const convLine = buildConversionLine(car.price, car.currency);

        const vinBadge = car.vinStatus === 'provided'
            ? `<span class="badge-vin">ԹԱՓԱՆՑԻԿ VIN</span>`
            : `<span class="badge-novin">${car.vinStatus === 'hidden' ? 'VIN ԹԱՔՑՎԱԾ' : 'ԱՌԱՆՑ VIN'}</span>`;

        const vipBadge = car.isVip ? `<span class="vip-badge">VIP</span>` : '';
        const saved = favorites.has(key);
        const favLabel = saved ? 'Նշված է' : 'Պահել';
        const imgSrc = (car.images && car.images[0]) || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80';
        const locParts = [car.region, car.city, car.village].filter(Boolean);

        const card = document.createElement('div');
        card.className = 'car-card';
        card.onclick = (e) => {
            if (!e.target.closest('.fav-btn')) openCarDetails(car);
        };

        card.innerHTML = `
            <div class="car-img-wrap">
                ${vinBadge}
                ${vipBadge}
                <button type="button" class="fav-btn ${saved ? 'active' : ''}" data-car-key="${key}" onclick="toggleFav('${key}', event)">${favLabel}</button>
                <img src="${imgSrc}" alt="${car.brand} ${car.model}">
            </div>
            <div class="car-body">
                <div class="car-title">${car.brand} ${car.model}</div>
                <div class="car-meta">${car.year} թ. • ${Number(car.mileage).toLocaleString('en-US')} կմ • ${locParts.slice(0, 2).join(', ')}</div>
                <div class="car-price-row">
                    <div>
                        <div class="price-main">${mainPrice}</div>
                        <div class="price-conversions">${convLine}</div>
                    </div>
                    <div class="open-badge">Դիտել</div>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function applyFilters() {
    const search = document.getElementById('search-input').value.toLowerCase();
    const region = document.getElementById('city-filter').value;
    const brand = document.getElementById('brand-filter').value;
    const priceMin = Number(document.getElementById('price-min').value) || 0;
    const priceMax = Number(document.getElementById('price-max').value) || Infinity;
    const yearMin = Number(document.getElementById('year-min').value) || 0;
    const yearMax = Number(document.getElementById('year-max').value) || Infinity;
    const vinOnly = document.getElementById('vin-only-check').checked;
    const customsOnly = document.getElementById('customs-only-check')?.checked;
    const undamagedOnly = document.getElementById('undamaged-only-check')?.checked;

    const filtered = carsData.filter(car => {
        const fullTitle = `${car.brand} ${car.model}`.toLowerCase();
        const priceInUsd = toUsd(car.price, car.currency);
        if (search && !fullTitle.includes(search)) return false;
        if (region && car.region !== region) return false;
        if (brand && car.brand !== brand) return false;
        if (priceInUsd < priceMin || priceInUsd > priceMax) return false;
        if (car.year < yearMin || car.year > yearMax) return false;
        if (vinOnly && car.vinStatus !== 'provided') return false;
        if (customsOnly && car.customs !== 'Այո') return false;
        if (undamagedOnly && car.damage !== 'Չվթարված') return false;
        return true;
    });

    renderCars(filtered);
}

function filterOnlyVin(state) {
    document.getElementById('vin-only-check').checked = state;
    applyFilters();
}

function resetFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('city-filter').value = '';
    document.getElementById('brand-filter').value = '';
    document.getElementById('price-min').value = '';
    document.getElementById('price-max').value = '';
    document.getElementById('year-min').value = '';
    document.getElementById('year-max').value = '';
    document.getElementById('vin-only-check').checked = false;
    if (document.getElementById('customs-only-check')) document.getElementById('customs-only-check').checked = false;
    if (document.getElementById('undamaged-only-check')) document.getElementById('undamaged-only-check').checked = false;
    renderCars(carsData);
}

function openAddModal() {
    if (!currentUser) {
        openGoogleAuthModal();
        return;
    }
    if (currentUser.phone) document.getElementById('contact-phone').value = currentUser.phone;
    if (currentUser.whatsapp) document.getElementById('contact-whatsapp').value = currentUser.whatsapp;
    currentStep = 1;
    updateStepView();
    document.getElementById('add-modal').classList.add('open');
}

function closeAddModal() {
    document.getElementById('add-modal').classList.remove('open');
}

function updateStepView() {
    document.querySelectorAll('.wizard-step').forEach(el => {
        el.classList.toggle('active', Number(el.dataset.step) === currentStep);
    });
    document.getElementById('step-indicator').textContent = `Քայլ ${currentStep} / ${totalSteps}`;
    document.getElementById('prev-step-btn').style.display = currentStep > 1 ? 'inline-block' : 'none';
    document.getElementById('next-step-btn').style.display = currentStep < totalSteps ? 'inline-block' : 'none';
    document.getElementById('submit-car-btn').style.display = currentStep === totalSteps ? 'inline-block' : 'none';
}

function nextStep() {
    if (currentStep < totalSteps) { currentStep++; updateStepView(); }
}

function prevStep() {
    if (currentStep > 1) { currentStep--; updateStepView(); }
}

function renderAlphabetBar() {
    const letters = ['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];
    const bar = document.getElementById('alpha-bar');
    bar.innerHTML = '';

    letters.forEach(letter => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'alpha-btn' + (selectedLetter === letter ? ' active' : '');
        btn.textContent = letter === 'ALL' ? 'ԲՈԼՈՐԸ' : letter;
        btn.onclick = () => {
            selectedLetter = letter;
            renderAlphabetBar();
            renderBrandDirectory();
        };
        bar.appendChild(btn);
    });
}

function renderBrandDirectory() {
    const query = (document.getElementById('brand-search-input').value || '').trim().toLowerCase();
    const chosenBrand = document.getElementById('car-brand').value;
    const container = document.getElementById('brand-directory');
    container.innerHTML = '';

    const filteredBrands = ALL_BRANDS.filter(b => {
        const matchQuery = !query || b.toLowerCase().includes(query);
        const matchLetter = selectedLetter === 'ALL' || b.toUpperCase().startsWith(selectedLetter);
        return matchQuery && matchLetter;
    });

    if (filteredBrands.length === 0) {
        container.innerHTML = '<div style="font-size:12px;color:#9ca3af;">Մակնիշ չի գտնվել։</div>';
        return;
    }

    const grouped = {};
    filteredBrands.forEach(brand => {
        const firstLetter = brand[0].toUpperCase();
        if (!grouped[firstLetter]) grouped[firstLetter] = [];
        grouped[firstLetter].push(brand);
    });

    Object.keys(grouped).sort().forEach(letter => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'brand-group';

        const heading = document.createElement('div');
        heading.className = 'brand-letter-heading';
        heading.textContent = letter;
        groupDiv.appendChild(heading);

        const chipsDiv = document.createElement('div');
        chipsDiv.className = 'brand-chips';

        grouped[letter].forEach(brand => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'brand-chip' + (chosenBrand === brand ? ' selected' : '');
            chip.textContent = brand;
            chip.onclick = () => {
                document.getElementById('car-brand').value = brand;
                renderBrandDirectory();
            };
            chipsDiv.appendChild(chip);
        });

        groupDiv.appendChild(chipsDiv);
        container.appendChild(groupDiv);
    });
}

function toggleVinInput() {
    const status = document.querySelector('input[name="vin_status"]:checked').value;
    const wrapper = document.getElementById('vin-input-wrapper');
    const hint = document.getElementById('vin-hint');

    if (status === 'provided') {
        wrapper.style.display = 'flex';
        hint.textContent = 'VIN նշելու դեպքում հայտարարությունը ստանում է Carfax և աճուրդների ստուգման հղումը։';
        hint.style.color = '#16a34a';
    } else if (status === 'hidden') {
        wrapper.style.display = 'none';
        hint.textContent = 'VIN-կոդը կտրամադրվի գնորդի հարցմամբ։';
        hint.style.color = '#9ca3af';
    } else {
        wrapper.style.display = 'none';
        hint.textContent = 'Նշված է, որ տրանսպորտային միջոցը չունի 17-նիշ VIN-կոդ։';
        hint.style.color = '#9ca3af';
    }
}

async function decodeVin() {
    const vin = document.getElementById('vin-code').value.trim().toUpperCase();
    const hint = document.getElementById('vin-hint');

    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
        hint.textContent = 'Սխալ VIN-կոդ (պետք է լինի 17 նիշ, առանց I, O, Q տառերի)';
        hint.style.color = '#dc2626';
        return;
    }

    hint.textContent = 'Ստուգվում է VIN-ը...';
    try {
        const info = await fetchVinDecodedInfo(vin);
        if (info && info.Make) {
            document.getElementById('car-brand').value = info.Make;
            document.getElementById('car-model').value = info.Model || '';
            if (info.ModelYear) document.getElementById('car-year').value = info.ModelYear;
            hint.textContent = `Հաստատված է՝ ${info.Make} ${info.Model || ''} (${info.ModelYear || ''})`;
            hint.style.color = '#16a34a';
        } else {
            hint.textContent = 'VIN-ը ձևաչափով ճիշտ է, տվյալները կարող եք լրացնել ձեռքով։';
            hint.style.color = '#d97706';
        }
    } catch (err) {
        hint.textContent = 'Չհաջողվեց կապվել բազային, լրացրեք տվյալները ձեռքով։';
    }
}

// Сжатие фото + нейросетевой фильтр 18+
async function compressImageFile(file, maxWidth = 1280, quality = 0.82) {
    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            let width = img.width;
            let height = img.height;
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
                URL.revokeObjectURL(url);
                if (!blob) {
                    resolve(file);
                    return;
                }
                const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                    type: 'image/jpeg',
                    lastModified: Date.now()
                });
                resolve(compressed);
            }, 'image/jpeg', quality);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(file);
        };
        img.src = url;
    });
}

async function getNsfwModel() {
    if (!nsfwModel && typeof nsfwjs !== 'undefined') {
        try {
            nsfwModel = await nsfwjs.load();
        } catch (e) {
            nsfwModel = null;
        }
    }
    return nsfwModel;
}

async function handlePhotoFiles(event) {
    const rawFiles = Array.from(event.target.files || []);
    selectedPhotoFiles = [];
    uploadedPhotoUrls = [];
    const previewContainer = document.getElementById('photo-preview-list');
    previewContainer.innerHTML = '';

    const model = await getNsfwModel();

    for (const rawFile of rawFiles) {
        const compressedFile = await compressImageFile(rawFile);
        const url = URL.createObjectURL(compressedFile);
        const img = document.createElement('img');
        img.src = url;
        img.className = 'photo-thumb';

        if (model) {
            await new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve;
            });
            try {
                const predictions = await model.classify(img);
                const adultProbability = predictions
                    .filter(p => ['Porn', 'Hentai', 'Sexy'].includes(p.className))
                    .reduce((sum, p) => sum + p.probability, 0);

                if (adultProbability > 0.65) {
                    URL.revokeObjectURL(url);
                    alert(`«${rawFile.name}» նկարը մերժվել է՝ 18+ բովանդակություն պարունակելու պատճառով։`);
                    continue;
                }
            } catch (e) {}
        }

        selectedPhotoFiles.push(compressedFile);
        uploadedPhotoUrls.push(url);
        previewContainer.appendChild(img);
    }
}

async function handleAddCar(e) {
    e.preventDefault();
    const brandVal = document.getElementById('car-brand').value.trim();
    const modelVal = document.getElementById('car-model').value.trim();
    const descVal = document.getElementById('car-desc').value.trim();

    if (containsProfanity(`${brandVal} ${modelVal} ${descVal}`)) {
        alert('Հայտարարությունը պարունակում է արգելված կամ վիրավորական արտահայտություններ։');
        return;
    }

    if (!brandVal) {
        alert('Խնդրում ենք ընտրել մակնիշը։');
        return;
    }

    if (selectedPhotoFiles.length === 0) {
        alert('Խնդրում ենք ավելացնել առնվազն մեկ թույլատրելի նկար։');
        return;
    }

    const phoneVal = document.getElementById('contact-phone').value.trim();
    if (!phoneVal) {
        alert('Հեռախոսահամարը պարտադիր է։');
        return;
    }

    const vinStatus = document.querySelector('input[name="vin_status"]:checked').value;
    const vinCode = vinStatus === 'provided' ? document.getElementById('vin-code').value.trim().toUpperCase() : null;

    if (vinStatus === 'provided' && (!vinCode || vinCode.length !== 17)) {
        alert('Խնդրում ենք մուտքագրել 17-նիշ VIN-կոդ կամ ընտրել այլ տարբերակ։');
        return;
    }

    const comfortSelected = Array.from(document.querySelectorAll('input[name="comfort"]:checked')).map(cb => cb.value);

    const formData = new FormData();
    formData.append('vehicle_type', document.querySelector('input[name="vehicle_type"]:checked').value);
    formData.append('car_category', document.querySelector('input[name="car_category"]:checked').value);
    formData.append('mileage_state', document.querySelector('input[name="mileage_state"]:checked').value);
    formData.append('seller_type', document.querySelector('input[name="seller_type"]:checked').value);
    formData.append('region', document.getElementById('region-select').value || 'Երևան');
    formData.append('city', document.getElementById('city-select').value || '');
    formData.append('village', document.getElementById('village-select').value || '');
    formData.append('vin_status', vinStatus);
    if (vinCode) formData.append('vin_code', vinCode);
    formData.append('brand', brandVal);
    formData.append('model', modelVal);
    formData.append('year', document.getElementById('car-year').value);
    formData.append('mileage', document.getElementById('car-mileage').value);
    formData.append('damage', document.getElementById('car-damage').value);
    formData.append('gas', document.getElementById('car-gas').value);
    formData.append('steering', document.getElementById('car-steering').value);
    formData.append('customs', document.getElementById('car-customs').value);
    formData.append('color', document.getElementById('car-color').value);
    formData.append('tire_size', document.getElementById('car-tire-size')?.value || '');
    formData.append('headlights', document.getElementById('car-headlights')?.value || '');
    formData.append('interior_color', document.getElementById('car-interior-color')?.value || '');
    formData.append('interior_type', document.getElementById('car-interior-type')?.value || '');
    formData.append('sunroof', document.getElementById('car-sunroof')?.value || '');
    formData.append('comfort', JSON.stringify(comfortSelected));
    formData.append('price', document.getElementById('car-price').value);
    formData.append('currency', document.getElementById('car-currency').value);
    formData.append('description', descVal);
    formData.append('contact_phone', phoneVal);
    formData.append('contact_whatsapp', document.getElementById('contact-whatsapp').value.trim());

    selectedPhotoFiles.forEach(file => {
        formData.append('photos[]', file);
    });

    try {
        const res = await fetch('add_car.php', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success) {
            alert(data.message || 'Հայտարարությունը ուղարկվել է ստուգման։');
            closeAddModal();
            document.getElementById('add-car-form').reset();
            document.getElementById('photo-preview-list').innerHTML = '';
            selectedPhotoFiles = [];
            uploadedPhotoUrls = [];
            currentStep = 1;
            updateStepView();
            toggleVinInput();
            await loadCarsFromServer();
            return;
        } else if (data.message) {
            alert(data.message);
            return;
        }
    } catch (err) {
        alert('Սխալ սերվերի հետ կապվելիս');
    }
}

function normalizePhoneForTel(raw) {
    if (!raw) return '';
    return raw.replace(/[^\d+]/g, '');
}

function normalizePhoneForWa(raw) {
    if (!raw) return '';
    return raw.replace(/\D/g, '');
}

function setGalleryPhoto(idx) {
    if (!activeGalleryImages.length) return;
    activeGalleryIdx = (idx + activeGalleryImages.length) % activeGalleryImages.length;
    const mainImg = document.getElementById('detail-main-photo');
    const counter = document.getElementById('detail-photo-counter');
    if (mainImg) mainImg.src = activeGalleryImages[activeGalleryIdx];
    if (counter) counter.textContent = `${activeGalleryIdx + 1} / ${activeGalleryImages.length}`;
}

function openCarDetails(car) {
    if (car._source === 'server') {
        fetch('user_car_action.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ car_id: car.id, action: 'view' })
        }).catch(() => {});
    }

    const modal = document.getElementById('car-details-modal');
    const content = document.getElementById('car-details-content');
    const mainPrice = formatMoney(car.price, car.currency);
    const convLine = buildConversionLine(car.price, car.currency);

    activeGalleryImages = (car.images && car.images.length)
        ? car.images
        : ['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80'];
    activeGalleryIdx = 0;

    const fullLocation = [car.region, car.city, car.village].filter(Boolean).join(', ');

    let vinSectionHtml = '';
    if (car.vinStatus === 'provided' && car.vinCode) {
        vinSectionHtml = `
            <div class="block-box" style="margin-top:14px;">
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
                    <div>
                        <span class="sub-label">VIN-կոդ</span>
                        <strong style="font-size:15px;color:#16a34a;">${car.vinCode}</strong>
                    </div>
                    <button type="button" class="btn-outline" id="detail-vin-decode-btn">Ստուգել գործարանային տվյալները</button>
                </div>
                ${buildVinLinksHtml(car.vinCode)}
                <div id="detail-vin-decode-out" style="margin-top:8px;font-size:12px;"></div>
            </div>
        `;
    } else {
        vinSectionHtml = `
            <div class="block-box" style="margin-top:14px;">
                <span style="font-size:13px;color:#9ca3af;">
                    ${car.vinStatus === 'hidden' ? 'Վաճառողը թաքցրել է VIN-կոդը' : 'Այս տրանսպորտային միջոցը չունի VIN-կոդ'}
                </span>
            </div>
        `;
    }

    const comfortText = car.comfort && car.comfort.length ? car.comfort.join(', ') : 'Նշված չէ';
    const telHref = normalizePhoneForTel(car.phone);
    const waDigits = normalizePhoneForWa(car.whatsapp || car.phone);

    content.innerHTML = `
        <div class="modal-header">
            <div>
                <h3>${car.brand} ${car.model} (${car.year})</h3>
                <div class="step-indicator">${car.vehicleType} • ${car.category} • ${car.sellerType}</div>
            </div>
            <button type="button" class="close-btn" onclick="document.getElementById('car-details-modal').classList.remove('open')">X</button>
        </div>

        <div>
            <img id="detail-main-photo" src="${activeGalleryImages[0]}" style="width:100%;height:260px;object-fit:cover;border-radius:12px;">
            ${activeGalleryImages.length > 1 ? `
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">
                    <button type="button" class="btn-outline" onclick="setGalleryPhoto(activeGalleryIdx - 1)">← Նախորդ</button>
                    <span id="detail-photo-counter" style="font-size:12px;color:#9ca3af;">1 / ${activeGalleryImages.length}</span>
                    <button type="button" class="btn-outline" onclick="setGalleryPhoto(activeGalleryIdx + 1)">Հաջորդ →</button>
                </div>
            ` : ''}
        </div>

        <div style="margin-top:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
            <div>
                <div style="font-size:24px;font-weight:800;">${mainPrice}</div>
                <div style="color:#9ca3af;font-size:11px;margin-top:2px;">${convLine}</div>
                <div style="font-size:12px;margin-top:4px;">${fullLocation}</div>
            </div>
            <div style="font-size:12px;">
                <div>Վազք՝ ${Number(car.mileage).toLocaleString('en-US')} կմ (${car.mileageState})</div>
                <div>Վիճակ՝ ${car.damage} • Ղեկ՝ ${car.steering} • Գազ՝ ${car.gas}</div>
                <div>Մաքսազերծված է՝ ${car.customs}</div>
            </div>
        </div>

        <!-- Прямые кнопки звонка владельцу и WhatsApp -->
        <div class="block-box" style="margin-top:14px;">
            <div class="sub-label">Կապ վաճառողի հետ</div>
            <div class="call-actions-row">
                ${telHref ? `<a href="tel:${telHref}" class="btn-call">Զանգահարել (${car.phone})</a>` : ''}
                ${waDigits ? `<a href="https://wa.me/${waDigits}" target="_blank" class="btn-whatsapp">WhatsApp</a>` : ''}
                ${car.phone ? `<button type="button" class="btn-outline" id="reveal-phone-btn">Ցուցադրել համարը</button>` : ''}
            </div>
            <div id="revealed-phone-box" style="display:none;margin-top:8px;font-size:14px;font-weight:700;">${car.phone || ''}</div>
        </div>

        <!-- Предложить свою цену -->
        <div class="block-box" style="margin-top:12px;">
            <label class="sub-label">Առաջարկել իմ գինը վաճառողին (${car.currency})</label>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <input type="number" id="offer-price-input" placeholder="Օրինակ՝ ${Math.round(car.price * 0.93)}" style="width:150px;">
                <input type="tel" id="offer-phone-input" value="${currentUser ? currentUser.phone : ''}" placeholder="Ձեր հեռախոսը (+374...)" style="flex:1;min-width:150px;">
                <button type="button" class="btn-primary" id="send-offer-btn">Առաջարկել գին</button>
            </div>
        </div>

        ${vinSectionHtml}

        <div class="block-box" style="margin-top:12px;font-size:12px;line-height:1.6;">
            <div><strong>Գույն / Անվադողեր՝</strong> ${car.color || '—'} / ${car.tireSize || '—'}</div>
            <div><strong>Լուսարձակներ՝</strong> ${car.headlights || '—'}</div>
            <div><strong>Սրահ՝</strong> ${car.interiorType || '—'}, ${car.interiorColor || '—'}</div>
            <div><strong>Լյուկ՝</strong> ${car.sunroof || '—'}</div>
            <div><strong>Կոմֆորտ՝</strong> ${comfortText}</div>
            ${car.description ? `<div style="margin-top:6px;"><strong>Նկարագրություն՝</strong> ${car.description}</div>` : ''}
        </div>

        <div class="block-box" style="margin-top:12px;">
            <label class="sub-label">Գրել հաղորդագրություն վաճառողին</label>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <input type="text" id="seller-msg-input" placeholder="Հարցրեք մեքենայի վիճակի կամ գնի մասին..." style="flex:1;min-width:200px;">
                <button type="button" class="btn-primary" id="send-seller-msg-btn">Ուղարկել</button>
            </div>
        </div>

        <div style="margin-top:10px;text-align:right;">
            <button type="button" class="btn-text" id="report-car-btn" style="color:#dc2626;font-size:12px;">Բողոքել հայտարարության դեմ</button>
        </div>
    `;

    const revealBtn = document.getElementById('reveal-phone-btn');
    if (revealBtn) {
        revealBtn.onclick = () => {
            const box = document.getElementById('revealed-phone-box');
            if (box) box.style.display = 'block';
            revealBtn.style.display = 'none';
        };
    }

    const decodeBtn = document.getElementById('detail-vin-decode-btn');
    if (decodeBtn && car.vinCode) {
        decodeBtn.onclick = async () => {
            const out = document.getElementById('detail-vin-decode-out');
            out.textContent = 'Ստուգվում է...';
            try {
                const info = await fetchVinDecodedInfo(car.vinCode);
                if (info && info.Make) {
                    out.innerHTML = `<span style="color:#16a34a;">NHTSA՝ ${info.Make} ${info.Model || ''} (${info.ModelYear || ''}) • ${info.BodyClass || ''} • ${info.PlantCountry || ''}</span>`;
                } else {
                    out.textContent = 'Տվյալները բազայում չեն գտնվել։';
                }
            } catch (e) {
                out.textContent = 'Սխալ VIN ստուգման ժամանակ։';
            }
        };
    }

    document.getElementById('send-offer-btn').onclick = () => submitPriceOffer(car);
    document.getElementById('send-seller-msg-btn').onclick = () => sendMessageToSeller(car);
    document.getElementById('report-car-btn').onclick = () => reportCar(car);
    modal.classList.add('open');
}

applySavedTheme();
updateFavCounters();
populateTopBrandFilter();
populateRegions();
renderAlphabetBar();
renderBrandDirectory();
renderFaq();
calculateArmeniaCustoms();
renderCars(carsData);
checkServerSession().then(() => loadCarsFromServer());