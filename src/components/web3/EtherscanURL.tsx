type EtherscanURLProps = {
  url: string;
  isPending?: boolean;
};

export default function EtherscanURL(props: EtherscanURLProps) {
  const {url, isPending = false} = props;

  return (
    <small>
      <a href={url} rel="noopener noreferrer" target="_blank">
        {isPending ? 'view progress' : 'view transaction'}
      </a>
    </small>
  );
}
