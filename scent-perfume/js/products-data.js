const PRODUCTS_DATA = [
  {
    "id": 1,
    "brand": "Tom Ford",
    "name": "Tobacco Vanille",
    "notes": "Табак · Ваниль · Какао · Специи",
    "category": "unisex",
    "scentType": "oriental",
    "pricePerMl": 1780,
    "fullBottle": {
      "volume": 50,
      "price": 89000
    },
    "badge": "Хит",
    "description": "Теплый, обволакивающий, дымный. Сочетание табачного листа, ванили и сухофруктов создаёт атмосферу роскошного клуба.",
    "image": "assets/images/tobacco-vanille.png"
  },
  {
    "id": 2,
    "brand": "Yves Saint Laurent",
    "name": "Black Opium",
    "notes": "Кофе · Ваниль · Жасмин · Белый чай",
    "category": "women",
    "scentType": "oriental",
    "pricePerMl": 578,
    "fullBottle": {
      "volume": 90,
      "price": 52000
    },
    "badge": "Хит",
    "description": "Чувственный и аддиктивный. Кофейный аккорд на базе белого чая и жасмина — энергия ночного города.",
    "image": "assets/images/black-opium.png"
  },
  {
    "id": 3,
    "brand": "Parfums de Marly",
    "name": "Layton",
    "notes": "Яблоко · Лаванда · Ваниль · Сандал",
    "category": "men",
    "scentType": "oriental",
    "pricePerMl": 784,
    "fullBottle": {
      "volume": 125,
      "price": 98000
    },
    "badge": "Нишевый",
    "description": "Королевский аромат дома Marly. Свежая лаванда встречается с тёплой ванилью и сандалом.",
    "image": "assets/images/layton.png"
  },
  {
    "id": 4,
    "brand": "Kilian",
    "name": "Angels' Share",
    "notes": "Коньяк · Корица · Дубовый мос · Ваниль",
    "category": "unisex",
    "scentType": "oriental",
    "pricePerMl": 2300,
    "fullBottle": {
      "volume": 50,
      "price": 115000
    },
    "badge": "Люкс",
    "description": "«Доля ангелов» — часть коньяка, испаряющаяся при выдержке. Тёплый, пьянящий, обволакивающий.",
    "image": "assets/images/angels-share.png"
  },
  {
    "id": 5,
    "brand": "Giorgio Armani",
    "name": "Armani Code Parfum",
    "notes": "Лайм · Тонка · Ирис · Сандал",
    "category": "men",
    "scentType": "oriental",
    "pricePerMl": 813,
    "fullBottle": {
      "volume": 75,
      "price": 61000
    },
    "badge": null,
    "description": "Код соблазна. Современный ориентальный аромат с цитрусовым открытием и глубокой базой.",
    "image": "assets/images/armani-code.png"
  },
  {
    "id": 6,
    "brand": "Chanel",
    "name": "Chance Eau Tendre",
    "notes": "Грейпфрут · Жасмин · Белый мускус",
    "category": "women",
    "scentType": "floral",
    "pricePerMl": 740,
    "fullBottle": {
      "volume": 100,
      "price": 74000
    },
    "badge": "Хит",
    "description": "Нежный, воздушный, женственный. Розовый грейпфрут и гиацинт на мягкой мускусной базе.",
    "image": "assets/images/chance-eau-tendre.png"
  },
  {
    "id": 7,
    "brand": "Byredo",
    "name": "Inflorescence",
    "notes": "Магнолия · Ландыш · Роза · Фрезия",
    "category": "women",
    "scentType": "floral",
    "pricePerMl": 820,
    "fullBottle": {
      "volume": 100,
      "price": 82000
    },
    "badge": "Нишевый",
    "description": "Букет только что срезанных цветов. Лёгкий, чистый, по-настоящему цветочный.",
    "image": "assets/images/inflorescence.png"
  },
  {
    "id": 8,
    "brand": "Gucci",
    "name": "Bloom",
    "notes": "Жасмин · Туберроза · Ранункулюс",
    "category": "women",
    "scentType": "floral",
    "pricePerMl": 580,
    "fullBottle": {
      "volume": 100,
      "price": 58000
    },
    "badge": null,
    "description": "Густой, живой, роскошный. Цветочный аромат, вдохновлённый безграничным цветущим садом.",
    "image": "assets/images/gucci-bloom.png"
  },
  {
    "id": 9,
    "brand": "Ex Nihilo",
    "name": "Fleur Narcotique",
    "notes": "Личи · Пион · Мускус · Амбра",
    "category": "unisex",
    "scentType": "floral",
    "pricePerMl": 1350,
    "fullBottle": {
      "volume": 100,
      "price": 135000
    },
    "badge": "Нишевый",
    "description": "Опьяняющий, притягательный. Сочный личи и белые цветы на тёплой амбровой базе.",
    "image": "assets/images/fleur-narcotique.png"
  },
  {
    "id": 10,
    "brand": "Tom Ford",
    "name": "Café Rose",
    "notes": "Роза · Кофе · Шафран · Пачули",
    "category": "unisex",
    "scentType": "floral",
    "pricePerMl": 1840,
    "fullBottle": {
      "volume": 50,
      "price": 92000
    },
    "badge": "Новинка",
    "description": "Встреча двух страстей — розы и кофе. Дерзко, чувственно, незабываемо.",
    "image": "assets/images/cafe-rose.png"
  },
  {
    "id": 11,
    "brand": "Tom Ford",
    "name": "Oud Wood",
    "notes": "Уд · Розовый перец · Сандал · Ваниль",
    "category": "unisex",
    "scentType": "woody",
    "pricePerMl": 1920,
    "fullBottle": {
      "volume": 50,
      "price": 96000
    },
    "badge": "Хит",
    "description": "Пионер удового направления в нише. Редкое уд-дерево смягчено кардамоном и сандалом.",
    "image": "assets/images/oud-wood.png"
  },
  {
    "id": 12,
    "brand": "Byredo",
    "name": "Super Cedar",
    "notes": "Кедр · Роза · Ветивер · Мускус",
    "category": "unisex",
    "scentType": "woody",
    "pricePerMl": 790,
    "fullBottle": {
      "volume": 100,
      "price": 79000
    },
    "badge": "Нишевый",
    "description": "Кедровое дерево возведено в абсолют. Чистый, минималистичный, невероятно стойкий.",
    "image": "assets/images/super-cedar.png"
  },
  {
    "id": 13,
    "brand": "Hermès",
    "name": "Terre d'Hermès",
    "notes": "Грейпфрут · Перец · Ветивер · Кремний",
    "category": "men",
    "scentType": "woody",
    "pricePerMl": 670,
    "fullBottle": {
      "volume": 100,
      "price": 67000
    },
    "badge": null,
    "description": "Земля, камень, воздух. Минеральный, сухой, мужественный.",
    "image": "assets/images/terre-dhermes.png"
  },
  {
    "id": 14,
    "brand": "Lalique",
    "name": "Encre Noire",
    "notes": "Ветивер · Кипарис · Кашемир",
    "category": "men",
    "scentType": "woody",
    "pricePerMl": 380,
    "fullBottle": {
      "volume": 100,
      "price": 38000
    },
    "badge": null,
    "description": "Чёрные чернила. Тёмный, смолистый ветивер с кипарисом.",
    "image": "assets/images/encre-noire.png"
  },
  {
    "id": 15,
    "brand": "Creed",
    "name": "Green Irish Tweed",
    "notes": "Фиалковый лист · Ирис · Амбра",
    "category": "men",
    "scentType": "woody",
    "pricePerMl": 1180,
    "fullBottle": {
      "volume": 100,
      "price": 118000
    },
    "badge": "Легенда",
    "description": "Зелёные поля Ирландии. Прохладный, травяной, аристократичный.",
    "image": "assets/images/green-irish-tweed.png"
  },
  {
    "id": 16,
    "brand": "Giorgio Armani",
    "name": "Acqua di Giò Parfum",
    "notes": "Морской аккорд · Розмарин · Лайм · Пачули",
    "category": "men",
    "scentType": "fresh",
    "pricePerMl": 853,
    "fullBottle": {
      "volume": 75,
      "price": 64000
    },
    "badge": "Хит",
    "description": "Абсолютная классика. Морская свежесть средиземноморья с травяными нотами.",
    "image": "assets/images/acqua-di-gio.png"
  },
  {
    "id": 17,
    "brand": "Byredo",
    "name": "Blanche",
    "notes": "Пион · Роза · Белый мускус · Сандал",
    "category": "women",
    "scentType": "fresh",
    "pricePerMl": 770,
    "fullBottle": {
      "volume": 100,
      "price": 77000
    },
    "badge": "Нишевый",
    "description": "Белизна и чистота. Свежий, почти кожный аромат с цветочным сердцем.",
    "image": "assets/images/blanche.png"
  },
  {
    "id": 18,
    "brand": "Tom Ford",
    "name": "Lost Cherry",
    "notes": "Чёрная вишня · Миндаль · Тонка · Ром",
    "category": "unisex",
    "scentType": "gourmand",
    "pricePerMl": 2100,
    "fullBottle": {
      "volume": 50,
      "price": 105000
    },
    "badge": "Люкс",
    "description": "Тёмная, соблазнительная вишня. Пьянящий коктейль из вишни, миндаля и рома.",
    "image": "assets/images/lost-cherry.png"
  }
];
