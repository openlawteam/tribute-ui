import s from '../../assets/scss/modules/loaderwithemoji.module.scss';

export default function LoaderWithEmoji() {
  return (
    <div className={s.hithere}>
      <span role="img" aria-label="hourglass emoji">
        ⏳
      </span>
    </div>
  );
}
