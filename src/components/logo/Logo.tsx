interface LogoProps {
  size?: 'small' | 'medium' | 'large' | '';
}

export default function Logo(props: LogoProps) {
  return (
    <div className={`logo ${props.size ? `logo--${props.size}` : ''}`}>
      <span className="logo-box-shaddow">
        Invest in the films
        <br />
        of tomorrow
      </span>
    </div>
  );
}
