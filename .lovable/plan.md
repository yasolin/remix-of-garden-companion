# AI, e-posta ve hesap yönetimi düzeltmeleri

## Yapılacaklar
- Kayıt sonrası doğrulama ekranına e-postayı yeniden gönderme seçeneği eklemek; gönderim sonucunu ve bekleme durumunu görünür yapmak.
- Giriş ekranındaki “Şifremi unuttum” akışını tamamlamak ve herkese açık `/reset-password` sayfasında yeni şifre belirlemeyi sağlamak.
- AI asistanın yazılı soru, kamera ve galeri akışlarını aynı güvenilir istek/hata yönetimine bağlamak; fotoğrafları daha küçük boyutta göndermek ve analizin takılı kalmasını önlemek.
- Fotoğraf analizini yapılandırılmış sonuçla çalıştırmak; bitkiyi kullanıcının Bitkilerim kayıtlarıyla ad/bilimsel ad üzerinden eşleştirmek.
- Eşleşmeyen analiz sonucunda “Bitkilerime ekle” seçeneği sunmak. Hastalık analizi mevcut bir bitkiyle eşleşirse sonucu o bitkinin notlarına kaydetme seçeneği sunmak.
- Hesap dondurmayı veritabanı durum kontrolü, hata doğrulaması ve güvenli çıkışla işler hale getirmek.
- Hesap silmede neden ve mevcut şifre isteyen bir onay penceresi göstermek; şifreyi sunucu tarafında doğruladıktan sonra hesabı ve bağlı verileri kalıcı silmek.

## Teknik ayrıntılar
- AI istemcisi gateway hata mesajlarını koruyacak; yalnızca sınırlı ve gecikmeli olarak tekrar denenebilir hatalar ele alınacak.
- Hesap silme işlemi, kullanıcı JWT’sini doğrulayan yeni bir backend fonksiyonunda ve yönetici yetkisi yalnızca sunucuda tutularak yapılacak.
- Mevcut `plants.notes` alanı hastalık kaydı için kullanılacak; yeni hassas veri tablosu açılmayacak.
- Değişiklikler seçili oturumla canlı AI çağrısı, mobil ekran akışları ve derleme kontrolleriyle doğrulanacak.
