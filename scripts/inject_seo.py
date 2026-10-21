import json
import re

DOM = "https://canyapiantalya.com.tr"
PHONE_TEL = "+905458320190"
PHONE_DISPLAY = "0545 832 01 90"
DEFAULT_IMG = f"{DOM}/images/real/proje-luks-mutfak.jpg"

COMMON_BUSINESS_SCHEMA = {
    "@context": "https://schema.org",
    "@type": ["HomeAndConstructionBusiness", "GeneralContractor"],
    "@id": f"{DOM}/#organization",
    "name": "Can Yapı Antalya",
    "alternateName": "Can Yapı Tadilat ve Prefabrik Çözümleri",
    "url": f"{DOM}/",
    "logo": f"{DOM}/images/real/proje-luks-mutfak.jpg",
    "image": f"{DOM}/images/real/proje-luks-mutfak.jpg",
    "description": "Antalya ve çevresinde 15+ yıllık tecrübeyle anahtar teslim komple ev ve villa tadilatı, modern mutfak ve banyo yenileme, garantili su/ısı yalıtımı ve hafif çelik prefabrik konut imalatı.",
    "telephone": PHONE_TEL,
    "email": "info@canyapiantalya.com",
    "priceRange": "₺₺",
    "address": {
        "@type": "PostalAddress",
        "streetAddress": "Muratpaşa",
        "addressLocality": "Muratpaşa",
        "addressRegion": "Antalya",
        "postalCode": "07000",
        "addressCountry": "TR"
    },
    "geo": {
        "@type": "GeoCoordinates",
        "latitude": 36.8841,
        "longitude": 30.7056
    },
    "openingHoursSpecification": [
        {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            "opens": "08:30",
            "closes": "19:30"
        }
    ],
    "areaServed": [
        {"@type": "AdministrativeArea", "name": "Antalya"},
        {"@type": "AdministrativeArea", "name": "Muratpaşa"},
        {"@type": "AdministrativeArea", "name": "Konyaaltı"},
        {"@type": "AdministrativeArea", "name": "Kepez"},
        {"@type": "AdministrativeArea", "name": "Döşemealtı"},
        {"@type": "AdministrativeArea", "name": "Aksu"},
        {"@type": "AdministrativeArea", "name": "Kemer"},
        {"@type": "AdministrativeArea", "name": "Alanya"},
        {"@type": "AdministrativeArea", "name": "Belek"},
        {"@type": "AdministrativeArea", "name": "Manavgat"}
    ],
    "sameAs": []
}

PAGES = {
    "index.html": {
        "title": "Antalya Tadilat & Anahtar Teslim Ev Yenileme | Can Yapı (15+ Yıl)",
        "desc": "Antalya'da anahtar teslim ev tadilatı, modern mutfak ve banyo yenileme, çatı izolasyonu ve prefabrik konut. 15+ yıllık tecrübeyle ücretsiz keşif alın!",
        "canon": f"{DOM}/",
        "image": DEFAULT_IMG,
        "type": "website",
        "keywords": "antalya tadilat, antalya ev tadilatı, antalya anahtar teslim tadilat, antalya mutfak dolabı, antalya banyo yenileme, antalya prefabrik ev, can yapı antalya",
        "schemas": [
            COMMON_BUSINESS_SCHEMA,
            {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "@id": f"{DOM}/#website",
                "url": f"{DOM}/",
                "name": "Can Yapı Antalya",
                "publisher": {"@id": f"{DOM}/#organization"},
                "inLanguage": "tr-TR"
            },
            {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": "Antalya'da ev tadilatı ortalama ne kadar sürer?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Standart 3+1 bir dairenin komple anahtar teslim tadilatı ortalama 20 ila 30 iş günü içerisinde tamamlanır. Sözleşmede belirtilen teslim tarihine sadık kalınır."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "Tadilat öncesi keşif ücretli midir?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Hayır, Can Yapı Antalya olarak Antalya merkez ve tüm ilçelerde keşif ve projelendirme hizmetimiz tamamen ücretsizdir."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "Yapılan işçilik ve malzemeler garanti kapsamında mıdır?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Evet, tüm tadilat, izolasyon ve montaj uygulamalarımız resmi sözleşme ve 2 ila 5 yıl arası işçilik garantisi altındadır."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "Mutfak ve banyo dolaplarını kendiniz mi üretiyorsunuz?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Evet, kendi marangoz ve mobilya atölyemizde kişiye özel ölçü ve tasarımda MDFLam gövde, akrilik ve lake kapaklar üretiyoruz."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "Prefabrik yapılar kışın soğuk, yazın sıcak olur mu?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Hayır. Can Yapı hafif çelik prefabrik konutlarımızda taşyünü ve EPS mantolama teknolojisi kullanılmakta olup A+ ısı yalıtım sertifikalıdır; yazın serin kışın sıcaktır."
                        }
                    }
                ]
            }
        ]
    },
    "hakkimizda.html": {
        "title": "Hakkımızda | Can Yapı Antalya - 15+ Yıllık Tecrübe & Hizmet Anlayışı",
        "desc": "Can Yapı Antalya; 15 yılı aşkın tecrübesiyle Antalya genelinde anahtar teslim komple ev tadilatı, banyo & mutfak ve hafif çelik prefabrik yapılar inşa eder.",
        "canon": f"{DOM}/hakkimizda",
        "image": DEFAULT_IMG,
        "type": "website",
        "keywords": "can yapı antalya hakkında, antalya tadilat firmaları, antalya inşaat taahhüt, muratpaşa tadilat ustası",
        "schemas": [
            {
                "@context": "https://schema.org",
                "@type": "AboutPage",
                "@id": f"{DOM}/hakkimizda#webpage",
                "url": f"{DOM}/hakkimizda",
                "name": "Hakkımızda | Can Yapı Antalya",
                "isPartOf": {"@id": f"{DOM}/#website"},
                "breadcrumb": {"@id": f"{DOM}/hakkimizda#breadcrumb"}
            },
            {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "@id": f"{DOM}/hakkimizda#breadcrumb",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": f"{DOM}/"},
                    {"@type": "ListItem", "position": 2, "name": "Hakkımızda", "item": f"{DOM}/hakkimizda"}
                ]
            }
        ]
    },
    "hizmetler.html": {
        "title": "Antalya Tadilat & İnşaat Hizmetleri | Can Yapı Antalya",
        "desc": "Antalya anahtar teslim ev tadilatı, banyo & mutfak yenileme, seramik döşeme, boya badana, mantolama, çatı izolasyonu ve prefabrik konut hizmetlerimiz.",
        "canon": f"{DOM}/hizmetler",
        "image": DEFAULT_IMG,
        "type": "website",
        "keywords": "antalya tadilat hizmetleri, antalya anahtar teslim inşaat, ev yenileme antalya, banyo mutfak tadilatı",
        "schemas": [
            {
                "@context": "https://schema.org",
                "@type": "CollectionPage",
                "@id": f"{DOM}/hizmetler#webpage",
                "url": f"{DOM}/hizmetler",
                "name": "Antalya Tadilat & İnşaat Hizmetleri | Can Yapı",
                "breadcrumb": {"@id": f"{DOM}/hizmetler#breadcrumb"}
            },
            {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "@id": f"{DOM}/hizmetler#breadcrumb",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": f"{DOM}/"},
                    {"@type": "ListItem", "position": 2, "name": "Hizmetlerimiz", "item": f"{DOM}/hizmetler"}
                ]
            }
        ]
    },
    "hizmet-tadilat.html": {
        "title": "Antalya Komple Ev Tadilatı | Anahtar Teslim Daire & Villa Yenileme",
        "desc": "Antalya'da komple ev, daire ve villa tadilatı. İç mimari projelendirme, kırım, sıhhi ve elektrik tesisatı, zemin ve tavan anahtar teslim çözümler. Ücretsiz keşif!",
        "canon": f"{DOM}/hizmet-tadilat",
        "image": f"{DOM}/images/real/proje-tadilat-oncesi-sonrasi.jpg",
        "type": "website",
        "keywords": "antalya komple ev tadilatı, antalya daire tadilatı, antalya villa yenileme, anahtar teslim tadilat antalya",
        "schemas": [
            {
                "@context": "https://schema.org",
                "@type": "Service",
                "name": "Antalya Komple Ev ve Villa Tadilatı",
                "serviceType": "Ev Tadilatı ve Yenileme",
                "provider": {"@id": f"{DOM}/#organization"},
                "areaServed": {"@type": "AdministrativeArea", "name": "Antalya"},
                "description": "Antalya ve ilçelerinde A'dan Z'ye anahtar teslim ev, daire ve villa tadilatı hizmeti. Tek sözleşme, tek muhatap, garantili teslimat.",
                "url": f"{DOM}/hizmet-tadilat"
            },
            {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": f"{DOM}/"},
                    {"@type": "ListItem", "position": 2, "name": "Hizmetler", "item": f"{DOM}/hizmetler"},
                    {"@type": "ListItem", "position": 3, "name": "Komple Ev Tadilatı", "item": f"{DOM}/hizmet-tadilat"}
                ]
            }
        ]
    },
    "hizmet-mutfak.html": {
        "title": "Antalya Mutfak Tadilatı & Özel Dolap Tasarımı | Can Yapı",
        "desc": "Antalya'da özel ölçü lake ve akrilik mutfak dolabı imalatı, kuvars/porselen tezgah, ada mutfak ve anahtar teslim mutfak tadilatı. Ücretsiz 3D keşif alın!",
        "canon": f"{DOM}/hizmet-mutfak",
        "image": f"{DOM}/images/real/proje-luks-mutfak.jpg",
        "type": "website",
        "keywords": "antalya mutfak tadilatı, antalya mutfak dolabı imalatı, antalya ada mutfak, lüks mutfak tasarımı antalya",
        "schemas": [
            {
                "@context": "https://schema.org",
                "@type": "Service",
                "name": "Antalya Mutfak Tadilatı ve Özel Dolap İmalatı",
                "serviceType": "Mutfak Yenileme",
                "provider": {"@id": f"{DOM}/#organization"},
                "areaServed": {"@type": "AdministrativeArea", "name": "Antalya"},
                "description": "Özel tasarım lake/akrilik mutfak dolapları, kuvars tezgahlar ve komple mutfak tesisat yenileme.",
                "url": f"{DOM}/hizmet-mutfak"
            },
            {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": f"{DOM}/"},
                    {"@type": "ListItem", "position": 2, "name": "Hizmetler", "item": f"{DOM}/hizmetler"},
                    {"@type": "ListItem", "position": 3, "name": "Mutfak Tadilatı", "item": f"{DOM}/hizmet-mutfak"}
                ]
            }
        ]
    },
    "hizmet-banyo.html": {
        "title": "Antalya Banyo Tadilatı & Islak Zemin Yenileme | Can Yapı",
        "desc": "Antalya banyo tadilatı: Çift katmanlı su yalıtımı, modern duşakabin, gömme rezervuar, porselen seramik döşeme ve neme dayanıklı lake banyo dolapları.",
        "canon": f"{DOM}/hizmet-banyo",
        "image": f"{DOM}/images/real/proje-banyo-yenileme.jpg",
        "type": "website",
        "keywords": "antalya banyo tadilatı, banyo yenileme antalya, su izolasyonu banyo, duşakabin ve banyo dolabı antalya",
        "schemas": [
            {
                "@context": "https://schema.org",
                "@type": "Service",
                "name": "Antalya Banyo Tadilatı ve Islak Zemin Yenileme",
                "serviceType": "Banyo Tadilatı",
                "provider": {"@id": f"{DOM}/#organization"},
                "areaServed": {"@type": "AdministrativeArea", "name": "Antalya"},
                "description": "Garantili su yalıtımı, modern banyo dolapları, duşakabin ve porselen seramik uygulamaları.",
                "url": f"{DOM}/hizmet-banyo"
            },
            {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": f"{DOM}/"},
                    {"@type": "ListItem", "position": 2, "name": "Hizmetler", "item": f"{DOM}/hizmetler"},
                    {"@type": "ListItem", "position": 3, "name": "Banyo Tadilatı", "item": f"{DOM}/hizmet-banyo"}
                ]
            }
        ]
    },
    "hizmet-seramik-fayans.html": {
        "title": "Antalya Seramik, Granit & Fayans Döşeme Ustası | Can Yapı",
        "desc": "Antalya'da 60x120 porselen seramik, granit ve dekoratif fayans döşeme. Lazer nivo ile sıfır kod farkı, epoksi derz dolgu ve garantili zemin kaplama işçiliği.",
        "canon": f"{DOM}/hizmet-seramik-fayans",
        "image": f"{DOM}/images/real/proje-seramik-doseme.jpg",
        "type": "website",
        "keywords": "antalya seramik ustası, antalya fayans ustası, 60x120 granit döşeme antalya, zemin seramik kaplama",
        "schemas": [
            {
                "@context": "https://schema.org",
                "@type": "Service",
                "name": "Antalya Seramik, Fayans ve Granit Döşeme Hizmeti",
                "serviceType": "Seramik ve Fayans Döşeme",
                "provider": {"@id": f"{DOM}/#organization"},
                "areaServed": {"@type": "AdministrativeArea", "name": "Antalya"},
                "description": "Lazer terazili profesyonel seramik ve granit döşeme, epoksi derz uygulamaları.",
                "url": f"{DOM}/hizmet-seramik-fayans"
            },
            {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": f"{DOM}/"},
                    {"@type": "ListItem", "position": 2, "name": "Hizmetler", "item": f"{DOM}/hizmetler"},
                    {"@type": "ListItem", "position": 3, "name": "Seramik & Fayans", "item": f"{DOM}/hizmet-seramik-fayans"}
                ]
            }
        ]
    },
    "hizmet-boya.html": {
        "title": "Antalya Boya Badana & Alçıpan Asma Tavan | Can Yapı",
        "desc": "Antalya boya badana ustası, tozsuz zımpara ile silinebilir silikonlu boya, İtalyan dekoratif efekt boya ve LED gizli ışıklı asma tavan alçıpan uygulamaları.",
        "canon": f"{DOM}/hizmet-boya",
        "image": f"{DOM}/images/real/proje-boya-badana.jpg",
        "type": "website",
        "keywords": "antalya boya badana ustası, antalya alçıpan asma tavan, dekoratif italyan boya antalya, daire boyama",
        "schemas": [
            {
                "@context": "https://schema.org",
                "@type": "Service",
                "name": "Antalya Boya Badana ve Alçıpan Asma Tavan Hizmeti",
                "serviceType": "Boya Badana ve Alçıpan",
                "provider": {"@id": f"{DOM}/#organization"},
                "areaServed": {"@type": "AdministrativeArea", "name": "Antalya"},
                "description": "Tozsuz zımparalı silinebilir boya badana, gizli ışıklı asma tavan ve İtalyan efekt boya uygulamaları.",
                "url": f"{DOM}/hizmet-boya"
            },
            {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": f"{DOM}/"},
                    {"@type": "ListItem", "position": 2, "name": "Hizmetler", "item": f"{DOM}/hizmetler"},
                    {"@type": "ListItem", "position": 3, "name": "Boya & Alçı", "item": f"{DOM}/hizmet-boya"}
                ]
            }
        ]
    },
    "hizmet-mantolama.html": {
        "title": "Antalya Dış Cephe Mantolama & Isı Yalıtımı | Can Yapı",
        "desc": "Antalya bina ve villa dış cephe mantolama. Taşyünü ve karbonlu EPS ile %50 enerji tasarrufu, sıcağa ve neme karşı 5 yıl işçilik garantili izolasyon.",
        "canon": f"{DOM}/hizmet-mantolama",
        "image": f"{DOM}/images/real/proje-mantolama-yalitim.jpg",
        "type": "website",
        "keywords": "antalya mantolama, antalya dış cephe ısı yalıtımı, taşyünü mantolama antalya, bina cephe kaplama",
        "schemas": [
            {
                "@context": "https://schema.org",
                "@type": "Service",
                "name": "Antalya Dış Cephe Mantolama ve Isı Yalıtımı",
                "serviceType": "Mantolama ve Yalıtım",
                "provider": {"@id": f"{DOM}/#organization"},
                "areaServed": {"@type": "AdministrativeArea", "name": "Antalya"},
                "description": "Antalya iklimine özel karbonlu EPS ve taşyünü dış cephe mantolama ile %50 enerji tasarrufu.",
                "url": f"{DOM}/hizmet-mantolama"
            },
            {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": f"{DOM}/"},
                    {"@type": "ListItem", "position": 2, "name": "Hizmetler", "item": f"{DOM}/hizmetler"},
                    {"@type": "ListItem", "position": 3, "name": "Dış Cephe Mantolama", "item": f"{DOM}/hizmet-mantolama"}
                ]
            }
        ]
    },
    "hizmet-cati.html": {
        "title": "Antalya Çatı Tamiri, Aktarma & Su İzolasyonu | Can Yapı",
        "desc": "Antalya çatı tamiri, kiremit aktarma, şalümo alevli polyester membran su yalıtımı, eksiz çinko oluk ve rüzgara dayanıklı çatı onarımı. Garantili işçilik!",
        "canon": f"{DOM}/hizmet-cati",
        "image": f"{DOM}/images/real/proje-cati-tamiri.jpg",
        "type": "website",
        "keywords": "antalya çatı tamiri, antalya çatı aktarma, antalya çatı su izolasyonu, membran kaplama antalya",
        "schemas": [
            {
                "@context": "https://schema.org",
                "@type": "Service",
                "name": "Antalya Çatı Tamiri, Aktarma ve Su Yalıtımı",
                "serviceType": "Çatı Tamiri ve İzolasyon",
                "provider": {"@id": f"{DOM}/#organization"},
                "areaServed": {"@type": "AdministrativeArea", "name": "Antalya"},
                "description": "Kiremit aktarma, şalümo alevli polyester membran su yalıtımı ve eksiz yağmur olukları onarımı.",
                "url": f"{DOM}/hizmet-cati"
            },
            {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": f"{DOM}/"},
                    {"@type": "ListItem", "position": 2, "name": "Hizmetler", "item": f"{DOM}/hizmetler"},
                    {"@type": "ListItem", "position": 3, "name": "Çatı Onarımı", "item": f"{DOM}/hizmet-cati"}
                ]
            }
        ]
    },
    "hizmet-prefabrik.html": {
        "title": "Antalya Prefabrik Ev & Çelik Yapı İmalatı | Can Yapı",
        "desc": "Antalya'da depreme dayanıklı hafif çelik villa ve prefabrik ev imalatı. A+ yalıtımlı, modern mimari ve 35 günde anahtar teslim kurulum. Hemen arayın!",
        "canon": f"{DOM}/hizmet-prefabrik",
        "image": f"{DOM}/images/real/proje-prefabrik-celik-ev.jpg",
        "type": "website",
        "keywords": "antalya prefabrik ev, antalya hafif çelik villa, prefabrik konut antalya, anahtar teslim çelik ev",
        "schemas": [
            {
                "@context": "https://schema.org",
                "@type": "Service",
                "name": "Antalya Hafif Çelik ve Prefabrik Villa İmalatı",
                "serviceType": "Prefabrik Yapı İmalatı",
                "provider": {"@id": f"{DOM}/#organization"},
                "areaServed": {"@type": "AdministrativeArea", "name": "Antalya"},
                "description": "Depreme dayanıklı 1. sınıf galvaniz çelik konstrüksiyon, yüksek yalıtımlı ve hızlı montajlı modern villalar.",
                "url": f"{DOM}/hizmet-prefabrik"
            },
            {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": f"{DOM}/"},
                    {"@type": "ListItem", "position": 2, "name": "Hizmetler", "item": f"{DOM}/hizmetler"},
                    {"@type": "ListItem", "position": 3, "name": "Prefabrik Yapı", "item": f"{DOM}/hizmet-prefabrik"}
                ]
            }
        ]
    },
    "projeler.html": {
        "title": "Antalya Tadilat & Prefabrik Projeleri | Can Yapı Referansları",
        "desc": "Can Yapı Antalya'nın tamamladığı anahtar teslim villa tadilatı, modern mutfak & banyo yenileme ve prefabrik çelik ev referans projeleri galerisi.",
        "canon": f"{DOM}/projeler",
        "image": DEFAULT_IMG,
        "type": "website",
        "keywords": "antalya tadilat projeleri, antalya villa tadilatı referansları, mutfak tadilatı örnekleri antalya",
        "schemas": [
            {
                "@context": "https://schema.org",
                "@type": "CollectionPage",
                "@id": f"{DOM}/projeler#webpage",
                "url": f"{DOM}/projeler",
                "name": "Tamamlanan Projelerimiz | Can Yapı Antalya",
                "breadcrumb": {"@id": f"{DOM}/projeler#breadcrumb"}
            },
            {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "@id": f"{DOM}/projeler#breadcrumb",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": f"{DOM}/"},
                    {"@type": "ListItem", "position": 2, "name": "Projelerimiz", "item": f"{DOM}/projeler"}
                ]
            }
        ]
    },
    "blog.html": {
        "title": "Antalya Tadilat & Yapı Rehberi | Blog - Can Yapı Antalya",
        "desc": "Antalya iklimine uygun ev tadilatı, banyo yenileme maliyetleri, çatı su izolasyonu ve prefabrik konut hakkında güncel mimari ipuçları ve rehberler.",
        "canon": f"{DOM}/blog",
        "image": DEFAULT_IMG,
        "type": "website",
        "keywords": "antalya tadilat blogu, ev tadilatı rehberi, banyo tadilatı maliyeti antalya, çatı izolasyonu tavsiyeleri",
        "schemas": [
            {
                "@context": "https://schema.org",
                "@type": "Blog",
                "@id": f"{DOM}/blog#blog",
                "url": f"{DOM}/blog",
                "name": "Can Yapı Antalya Tadilat & Mimari Rehberi",
                "description": "Antalya ev ve villa tadilatı hakkında güncel tavsiyeler ve maliyet rehberleri.",
                "publisher": {"@id": f"{DOM}/#organization"}
            },
            {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": f"{DOM}/"},
                    {"@type": "ListItem", "position": 2, "name": "Blog", "item": f"{DOM}/blog"}
                ]
            }
        ]
    },
    "blog-detay.html": {
        "title": "Tadilat Rehberi & Makaleleri | Can Yapı Antalya",
        "desc": "Antalya'da ev tadilatı, çatı izolasyonu ve mimari yenileme hakkında uzman ipuçları, maliyet hesapları ve dikkat edilmesi gerekenler rehberi.",
        "canon": f"{DOM}/blog-detay",
        "image": DEFAULT_IMG,
        "type": "article",
        "keywords": "antalya ev tadilatı ipuçları, tadilat sözleşmesi, banyo yenileme püf noktaları",
        "schemas": [
            {
                "@context": "https://schema.org",
                "@type": "BlogPosting",
                "headline": "Can Yapı Antalya Tadilat ve Mimari Rehberi",
                "image": DEFAULT_IMG,
                "publisher": {"@id": f"{DOM}/#organization"},
                "url": f"{DOM}/blog-detay",
                "inLanguage": "tr-TR"
            },
            {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": f"{DOM}/"},
                    {"@type": "ListItem", "position": 2, "name": "Blog", "item": f"{DOM}/blog"},
                    {"@type": "ListItem", "position": 3, "name": "Makale Detayı", "item": f"{DOM}/blog-detay"}
                ]
            }
        ]
    },
    "ucretsiz-kesif.html": {
        "title": "Ücretsiz Keşif & Projelendirme Talebi | Can Yapı Antalya",
        "desc": "Antalya genelinde ev, villa ve iş yeri tadilatı için ücretsiz yerinde keşif talebi oluşturun. 24 saat içinde net fiyat ve projelendirme ile dönüş yapalım.",
        "canon": f"{DOM}/ucretsiz-kesif",
        "image": DEFAULT_IMG,
        "type": "website",
        "keywords": "antalya ücretsiz keşif, tadilat fiyat teklifi antalya, yerinde keşif inşaat antalya",
        "schemas": [
            {
                "@context": "https://schema.org",
                "@type": "ContactPage",
                "url": f"{DOM}/ucretsiz-kesif",
                "name": "Ücretsiz Keşif Talebi | Can Yapı Antalya",
                "description": "Antalya'da ücretsiz keşif ve 3D tasarım talebi.",
                "provider": {"@id": f"{DOM}/#organization"}
            },
            {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": f"{DOM}/"},
                    {"@type": "ListItem", "position": 2, "name": "Ücretsiz Keşif", "item": f"{DOM}/ucretsiz-kesif"}
                ]
            }
        ]
    },
    "iletisim.html": {
        "title": "İletişim & Randevu Alın | Can Yapı Antalya Muratpaşa",
        "desc": "Can Yapı Antalya iletişim bilgileri, telefon: 0545 832 01 90, WhatsApp destek hattı, adres ve harita konumu. Hemen arayın, hayalinizdeki evi inşa edelim.",
        "canon": f"{DOM}/iletisim",
        "image": DEFAULT_IMG,
        "type": "website",
        "keywords": "can yapı antalya iletişim, muratpaşa tadilat firması telefon, can yapı whatsapp",
        "schemas": [
            {
                "@context": "https://schema.org",
                "@type": "ContactPage",
                "url": f"{DOM}/iletisim",
                "name": "İletişim | Can Yapı Antalya",
                "provider": {"@id": f"{DOM}/#organization"}
            },
            {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": f"{DOM}/"},
                    {"@type": "ListItem", "position": 2, "name": "İletişim", "item": f"{DOM}/iletisim"}
                ]
            }
        ]
    }
}

def generate_head_tags(page_name, cfg):
    lines = []
    lines.append(f'  <title>{cfg["title"]}</title>')
    lines.append(f'  <meta name="description" content="{cfg["desc"]}">')
    lines.append(f'  <meta name="keywords" content="{cfg["keywords"]}">')
    lines.append(f'  <meta name="author" content="Can Yapı Antalya">')
    lines.append(f'  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">')
    lines.append(f'  <link rel="canonical" href="{cfg["canon"]}">')
    lines.append('')
    lines.append(f'  <!-- Geo Tags / Yerel SEO (Antalya) -->')
    lines.append(f'  <meta name="geo.region" content="TR-07">')
    lines.append(f'  <meta name="geo.placename" content="Antalya">')
    lines.append(f'  <meta name="geo.position" content="36.8841;30.7056">')
    lines.append(f'  <meta name="ICBM" content="36.8841, 30.7056">')
    lines.append('')
    lines.append(f'  <!-- Open Graph / Facebook -->')
    lines.append(f'  <meta property="og:locale" content="tr_TR">')
    lines.append(f'  <meta property="og:type" content="{cfg["type"]}">')
    lines.append(f'  <meta property="og:title" content="{cfg["title"]}">')
    lines.append(f'  <meta property="og:description" content="{cfg["desc"]}">')
    lines.append(f'  <meta property="og:url" content="{cfg["canon"]}">')
    lines.append(f'  <meta property="og:site_name" content="Can Yapı Antalya">')
    lines.append(f'  <meta property="og:image" content="{cfg["image"]}">')
    lines.append(f'  <meta property="og:image:width" content="1200">')
    lines.append(f'  <meta property="og:image:height" content="630">')
    lines.append(f'  <meta property="og:image:alt" content="{cfg["title"]}">')
    lines.append('')
    lines.append(f'  <!-- Twitter Card -->')
    lines.append(f'  <meta name="twitter:card" content="summary_large_image">')
    lines.append(f'  <meta name="twitter:title" content="{cfg["title"]}">')
    lines.append(f'  <meta name="twitter:description" content="{cfg["desc"]}">')
    lines.append(f'  <meta name="twitter:image" content="{cfg["image"]}">')
    lines.append('')
    lines.append(f'  <!-- Schema.org Yapısal Veri (JSON-LD) -->')
    for sc in cfg["schemas"]:
        json_str = json.dumps(sc, ensure_ascii=False, indent=2)
        indented = "\n".join("  " + l for l in json_str.splitlines())
        lines.append('  <script type="application/ld+json">')
        lines.append(indented)
        lines.append('  </script>')
    
    return "\n".join(lines)

def process_file(fname):
    if fname not in PAGES:
        return
    cfg = PAGES[fname]
    with open(fname, "r", encoding="utf-8") as f:
        content = f.read()

    head_m = re.search(r'(<head[^>]*>)(.*?)(</head>)', content, re.DOTALL | re.IGNORECASE)
    if not head_m:
        print(f"Skipping {fname}: No head found")
        return
    
    head_start, head_body, head_end = head_m.groups()

    preserved_lines = []
    in_script_ld = False
    for line in head_body.splitlines():
        trimmed = line.strip()
        if '<script type="application/ld+json"' in trimmed:
            in_script_ld = True
            continue
        if in_script_ld:
            if '</script>' in trimmed:
                in_script_ld = False
            continue
        
        if re.match(r'<title>.*?</title>', trimmed, re.I):
            continue
        if re.match(r'<meta\s+name=["\'](description|keywords|author|robots|twitter:[^"\']+)["\']', trimmed, re.I):
            continue
        if re.match(r'<meta\s+property=["\']og:[^"\']+["\']', trimmed, re.I):
            continue
        if re.match(r'<meta\s+name=["\'](geo\.[^"\']+|ICBM)["\']', trimmed, re.I):
            continue
        if re.match(r'<link\s+rel=["\']canonical["\']', trimmed, re.I):
            continue
        
        preserved_lines.append(line)
    
    new_head_parts = []
    new_head_parts.append('  <meta charset="UTF-8">')
    new_head_parts.append('  <meta name="viewport" content="width=device-width, initial-scale=1.0">')
    new_head_parts.append(generate_head_tags(fname, cfg))
    
    clean_preserved = []
    for l in preserved_lines:
        t = l.strip()
        if not t:
            continue
        if '<meta charset=' in t or '<meta name="viewport"' in t or "<meta name='viewport'" in t:
            continue
        clean_preserved.append(l)
        
    new_head_body = "\n" + "\n".join(new_head_parts) + "\n" + "\n".join(clean_preserved) + "\n"
    new_content = content[:head_m.start()] + head_start + new_head_body + head_end + content[head_m.end():]

    with open(fname, "w", encoding="utf-8") as f:
        f.write(new_content)
    print(f"Successfully updated SEO for {fname}")

def update_admin():
    fname = "admin.html"
    try:
        with open(fname, "r", encoding="utf-8") as f:
            c = f.read()
        if '<meta name="robots" content="noindex, nofollow">' not in c:
            c = c.replace('<meta name="viewport" content="width=device-width, initial-scale=1.0">',
                          '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <meta name="robots" content="noindex, nofollow">')
            with open(fname, "w", encoding="utf-8") as f:
                f.write(c)
            print("Added noindex, nofollow to admin.html")
    except Exception as e:
        print("admin.html update error:", e)

if __name__ == "__main__":
    for p in PAGES:
        process_file(p)
    update_admin()
