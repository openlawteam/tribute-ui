import SocialMedia from './common/SocialMedia';

export default function Footer() {
  return (
    <div className="footer">
      <div className="grid__row">
        <div>
          <span className="footer_item__PztHD org-footer-item">
            <span className="undefined org-copyright-symbol">
              2022 @ProdCapsule DAO
            </span>
          </span>
          <a
            className="footer_item__PztHD org-footer-item"
            href=""
            target="_blank"
            rel="noopener noreferrer">
            DOC
          </a>
          <a
            className="footer_item__PztHD org-footer-item"
            href=""
            target="_blank"
            rel="noopener noreferrer">
            Privacy
          </a>
          <a
            className="footer_item__PztHD org-footer-item"
            href=""
            target="_blank"
            rel="noopener noreferrer">
            Our Team
          </a>
          <a
            className="footer_item__PztHD org-footer-item"
            href=""
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
