import SocialMedia from './common/SocialMedia';

export default function Footer() {
  return (
    <div className="footer_wrap__1La5y org-footer-wrap grid--fluid">
      <div className="grid__row">
        <div className="footer_left__6CGtF grid__col-lg-6 grid__col-12">
          <span className="footer_item__PztHD org-footer-item">
            <span className="undefined org-copyright-symbol">
              2022 @CineCapsule DAO
            </span>
          </span>
          <a
            className="footer_item__PztHD org-footer-item"
            href="https://cinecapsule-docs.vercel.app/"
            target="_blank"
            rel="noopener noreferrer">
            DOCS
          </a>
          <a
            className="footer_item__PztHD org-footer-item"
            href="https://www.cinecapsule.com/"
            target="_blank"
            rel="noopener noreferrer">
            CineCapsule
          </a>
          <a
            className="footer_item__PztHD org-footer-item"
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer">
            Privacy
          </a>

          {/* <a
            className="footer_item__PztHD org-footer-item"
            href=""
            target="_blank"
            rel="noopener noreferrer">
            Our Team
          </a> */}
          <a
            className="footer_item__PztHD org-footer-item"
            href="mailto:hello@cinecapsule.com"
            target="_blank"
            rel="noopener noreferrer">
            Contact Us
          </a>
        </div>
      </div>

      <SocialMedia />
    </div>
  );
}
