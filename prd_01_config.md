# PRD Bölüm 1: Kök Dizin ve Konfigürasyon Dosyaları

Bu belge, NFL Manager projesindeki altyapı, derleme ve ortam yapılandırmalarını sağlayan kök dizin dosyalarının **içeriklerini ve ne işe yaradıklarını** detaylandırır.

### `package.json` & `package-lock.json`
- **İçerik:** Projenin Node.js bağımlılık ağacını tutar. `dependencies` kısmında React, React-Router, Supabase-js, Zustand, SWR, TailwindCSS, Framer-Motion gibi temel kütüphaneler yer alır. `devDependencies` kısmında ise Vite, TypeScript, ESLint ve PostCSS bulunur.
- **İşlev:** `npm run dev`, `npm run build` gibi komutların tanımlandığı, projenin hangi kütüphane sürümleriyle çalışacağını belirleyen ana manifestosudur.

### `vite.config.ts`
- **İçerik:** Vite derleyicisinin yapılandırma dosyasıdır. İçerisinde `@vitejs/plugin-react` tanımlıdır. Ayrıca dizin kısayolları (alias) barındırır (örneğin `@/` yolunun `src/` klasörüne işaret etmesi gibi).
- **İşlev:** Geliştirme ortamında (localhost) hızlı HMR (Hot Module Replacement) sağlar ve production için kodları minify/bundle (paketleme) yapar.

### `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json`
- **İçerik:** TypeScript kurallarını içerir. `strict: true` modundadır, JSX ayarları `react-jsx` olarak belirlenmiştir.
- **İşlev:** Projedeki `.ts` ve `.tsx` dosyalarının hangi standartlara göre derleneceğini ve hata vereceğini belirler. `node.json` backend/script tarafı için, `app.json` frontend için ayrı kurallar koyar.

### `tailwind.config.ts` & `postcss.config.js`
- **İçerik:** TailwindCSS'in 4.x/3.x yapılandırması. Tema renkleri (NFL'e uygun özel renk paleti), özel font boyutları, animasyonlar (keyframes) ve ekran kırılım noktaları (breakpoints) içerir. PostCSS ise bu Tailwind kodlarını standart CSS'e çeviren eklentileri (autoprefixer) barındırır.
- **İşlev:** Projenin genel tasarım sistemini ve stil değişkenlerini tek bir merkezden yönetir.

### `eslint.config.js`
- **İçerik:** Kod yazım standartlarını kontrol eden kurallar bütünü. React Hooks kuralları (`exhaustive-deps`), kullanılmayan değişken uyarıları gibi kurallar aktiftir.
- **İşlev:** Takım halinde geliştirme yaparken kod kalitesini yüksek tutmayı ve olası bug'ları daha yazım aşamasındayken yakalamayı sağlar.

### `.env`
- **İçerik:** `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` gibi API anahtarlarını barındırır.
- **İşlev:** Hassas bilgilerin ve ortama (development/production) göre değişen linklerin koda gömülmek yerine dışarıdan okunmasını sağlar.

### `vercel.json`
- **İçerik:** `{"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]}` benzeri bir routing ayarı barındırır.
- **İşlev:** Vercel üzerine deploy edildiğinde, React Router'ın (Single Page Application) sorunsuz çalışması için tüm URL isteklerini `index.html`'e yönlendirir.

### `index.html`
- **İçerik:** Temel HTML5 iskeletidir. `<div id="root"></div>` etiketini ve `main.tsx` dosyasını import eden bir `<script type="module">` barındırır.
- **İşlev:** Tarayıcının projeyi yüklerken okuduğu ilk dosyadır, React uygulaması bu dosyanın içine entegre olur.

### Dokümantasyon Dosyaları (`README.md`, `task.md`, `walkthrough.md`, `implementation_plan.md`)
- **İçerik:** Projenin nasıl kurulacağı, mimari kararlar (örneğin Taktik matrisi entegrasyonu) ve tamamlanan/kalan görevlerin markdown formatında listeleridir.
- **İşlev:** Geliştiricilerin projeyi anlaması, sistem tasarımını okuması ve yapılacak işleri (TODO) takip etmesi içindir.
