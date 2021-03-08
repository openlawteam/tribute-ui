import Markdown from 'markdown-to-jsx';

type PreviewInputMarkdownProps = {
  value: string;
};

export default function PreviewInputMarkdown(props: PreviewInputMarkdownProps) {
  const {value} = props;

  if (!value) return null;

  return (
    <details>
      <summary style={{cursor: 'pointer', outline: 'none'}}>
        <small>Preview Markdown</small>
      </summary>

      <div style={{marginTop: '1em'}}>
        <Markdown>{value}</Markdown>
      </div>
    </details>
  );
}
