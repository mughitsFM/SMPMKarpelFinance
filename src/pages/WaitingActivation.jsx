import { useLocation, useNavigate } from 'react-router-dom';
import { KONTAK_PENGEMBANG, logoutUser } from '../../auth-firebase.js';
import '../styles/WaitingActivation.css';

function WaitingActivation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, username } = location.state || {};

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error logout:', error);
    }
  };

  const handleWhatsApp = () => {
    const message = `Halo, saya ${username || 'user'} dengan email ${email || '-'}. Saya baru saja mendaftar dan ingin meminta aktivasi akun.`;
    const waUrl = `https://wa.me/${KONTAK_PENGEMBANG.whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="waiting-container">
      <div className="waiting-background">
        <div className="bg-circle circle-1"></div>
        <div className="bg-circle circle-2"></div>
        <div className="bg-circle circle-3"></div>
      </div>

      <div className="waiting-card">
        {/* Icon Section */}
        <div className="waiting-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="url(#gradient)" strokeWidth="2" />
            <path d="M12 6v6l4 2" stroke="url(#gradient)" strokeWidth="2" strokeLinecap="round" />
            <defs>
              <linearGradient id="gradient" x1="2" y1="2" x2="22" y2="22">
                <stop offset="0%" stopColor="#667eea" />
                <stop offset="100%" stopColor="#764ba2" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Content Section */}
        <div className="waiting-content">
          <h1 className="waiting-title">⏳ Menunggu Aktivasi</h1>
          
          <div className="info-box">
            <p className="info-text">
              Akun Anda telah berhasil didaftarkan, namun masih perlu diaktifkan oleh administrator.
            </p>
            
            {username && (
              <div className="user-info">
                <div className="info-row">
                  <span className="info-label">Nama:</span>
                  <span className="info-value">{username}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{email}</span>
                </div>
              </div>
            )}
          </div>

          <div className="steps-section">
            <h3 className="steps-title">Langkah Selanjutnya:</h3>
            <ol className="steps-list">
              <li>Hubungi administrator untuk meminta aktivasi akun</li>
              <li>Setelah akun diaktifkan, Anda akan menerima notifikasi</li>
              <li>Login kembali menggunakan email dan password Anda</li>
            </ol>
          </div>

          {/* Contact Section */}
          <div className="contact-section">
            <h3 className="contact-title">Hubungi Administrator</h3>
            
            <div className="contact-cards">
              {/* WhatsApp Card */}
              <button onClick={handleWhatsApp} className="contact-card whatsapp-card">
                <div className="contact-icon whatsapp-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </div>
                <div className="contact-info">
                  <span className="contact-label">WhatsApp</span>
                  <span className="contact-value">{KONTAK_PENGEMBANG.telepon}</span>
                </div>
              </button>

              {/* Email Card */}
              <a href={`mailto:${KONTAK_PENGEMBANG.email}`} className="contact-card email-card">
                <div className="contact-icon email-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                </div>
                <div className="contact-info">
                  <span className="contact-label">Email</span>
                  <span className="contact-value">{KONTAK_PENGEMBANG.email}</span>
                </div>
              </a>

              {/* Phone Card */}
              <a href={`tel:${KONTAK_PENGEMBANG.telepon}`} className="contact-card phone-card">
                <div className="contact-icon phone-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                  </svg>
                </div>
                <div className="contact-info">
                  <span className="contact-label">Telepon</span>
                  <span className="contact-value">{KONTAK_PENGEMBANG.telepon}</span>
                </div>
              </a>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button onClick={handleLogout} className="btn-logout">
              Kembali ke Login
            </button>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="waiting-copyright">
        <p>© 2026 SMP Muhammadiyah Karangampel</p>
      </div>
    </div>
  );
}

export default WaitingActivation;
