# Original User Request

## Initial Request — 2026-06-13T19:00:00Z

Kapsamlı Hata Ayıklama ve Geliştirme (Comprehensive Bug Squashing & Enhancement)
NFL Manager projesindeki (React frontend + Supabase backend) tüm mevcut hataları, eksiklikleri ve TypeScript uyarılarını tespit edip düzeltmek.

Working directory: c:/Users/mustafa/Desktop/rtrt/nfl-manager
Integrity mode: demo

## Requirements

### R1. Kapsamlı Hata Tespiti ve Çözümü
Frontend bileşenlerindeki UI/UX hatalarını, Supabase Edge Functions tarafındaki mantık ve tip hatalarını, ayrıca veritabanı RLS (Row Level Security) politikalarındaki eksiklikleri tespit et ve çöz.

### R2. Mimariyi Koruma
Mevcut proje klasör yapısını ve temel mimariyi değiştirmek kesinlikle yasaktır. Çözümler mevcut yapıya entegre edilmelidir. Yeni paket veya kütüphane eklenmesine izin vardır ancak çekirdek sistem baştan yazılamaz.

## Acceptance Criteria

### Derleme ve Doğrulama
- [ ] Proje dizininde çalıştırılan `npm run build` komutu hiçbir hata (0 error) vermeden başarıyla tamamlanmalıdır.
- [ ] Frontend ve Backend tarafında kritik bir mantık hatası veya console error bulunmamalıdır. (Agent-as-judge ile verify edilecek).
