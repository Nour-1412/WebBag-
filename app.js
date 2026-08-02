// ===============================
// Navbar
// ===============================

const navbar = document.getElementById("navbar");

navbar.innerHTML = `
<div class="nav-container">

    <div class="nav-logo">
        WebBag
    </div>

    <nav class="nav-links">
        <a href="#">الرئيسية</a>
        <a href="#">الأدوات</a>
        <a href="#">المميزات</a>
        <a href="#">تواصل معنا</a>
    </nav>

    <button class="pro-btn">
        WebBag Pro
    </button>

</div>
`;


// ===============================
// Hero
// ===============================

const hero = document.getElementById("hero");

hero.innerHTML = `
<div class="hero-container">

    <h1 class="hero-logo">
        WebBag
    </h1>

    <h2 class="hero-title">
        منصة أدوات الذكاء الاصطناعي
    </h2>

    <p class="hero-text">
        جميع أدوات الذكاء الاصطناعي التي تحتاجها
        في مكان واحد...
        بسرعة، وأناقة، وذكاء.
    </p>

    <div class="hero-buttons">

        <button class="start">
            ابدأ الآن
        </button>

        <button class="explore">
            استكشف الأدوات
        </button>

    </div>

</div>
`;
