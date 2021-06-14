import ErrorMessageWithDetails from './components/common/ErrorMessageWithDetails';
import FadeIn from './components/common/FadeIn';

type InitErrorProps = {
  error: Error;
};

/**
 * InitError
 *
 * An error component that is meant to be used if the <Init /> component
 * could not complete any of its processes to provide the app with vital data.
 *
 * @param {InitErrorProps} props
 */
export default function InitError(props: InitErrorProps) {
  const {error} = props;

  return (
    <FadeIn>
      <div
        style={{
          padding: '2em 1em 1em',
          textAlign: 'center',
        }}>
        <h1 style={{fontSize: '2rem'}}>
          <span
            className="pulse"
            role="img"
            aria-label="Emoji with eyes crossed out."
            style={{display: 'inline-block'}}>
            😵
          </span>{' '}
          Oops, something went wrong.
        </h1>
      </div>

      <div
        style={{
          textAlign: 'center',
          maxWidth: 600,
          display: 'block',
          margin: '0 auto',
        }}>
        <ErrorMessageWithDetails error={error} renderText="" />
      </div>
    </FadeIn>
  );
}
