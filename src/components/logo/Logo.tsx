interface LogoProps {
  size?: 'small' | 'medium' | 'large' | '';
}

export default function Logo(props: LogoProps) {
  return (
    <div className={`logo ${props.size ? `logo--${props.size}` : ''}`}>
      <span className="logo-box-shaddow">
        CineCapsule 3.0
      </span>
    </div>
  );
}
