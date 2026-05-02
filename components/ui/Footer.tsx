export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="nav-logo">
              <div className="logo-icon">S</div>
              <span className="logo-text">ServeHub</span>
            </div>
            <p>Connecting people with the services they need, every day.</p>
            <div className="social-links">
              <a href="#" className="social-icon">𝕏</a>
              <a href="#" className="social-icon">in</a>
              <a href="#" className="social-icon">f</a>
            </div>
          </div>
          <div className="footer-col">
            <h4>For Customers</h4>
            <a href="#">Browse Services</a>
            <a href="#">How it Works</a>
            <a href="#">Reviews</a>
            <a href="#">Support</a>
          </div>
          <div className="footer-col">
            <h4>For Providers</h4>
            <a href="#">Become a Provider</a>
            <a href="#">Resources</a>
            <a href="#">Pricing</a>
            <a href="#">Success Stories</a>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <a href="#">About Us</a>
            <a href="#">Blog</a>
            <a href="#">Careers</a>
            <a href="#">Contact</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 ServeHub. All rights reserved.</p>
          <div className="footer-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
