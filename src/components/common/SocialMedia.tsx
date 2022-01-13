import DiscordSVG from '../../assets/svg/DiscordSVG';
import GitHubSVG from '../../assets/svg/GitHubSVG';
// import MediumSVG from '../../assets/svg/MediumSVG';

// @todo Add missing URLs when available
enum SocialMediaLinks {
  DISCORD = 'https://discord.gg/tEfP68xnTd',
  /*
   * query params search sepcifically for:
   * openlawteam/tribute-ui
   * openlawteam/tribute-contracts
   * openlawteam/tribute-contracts-cli
   * openlawteam/tribute-subgraph
   */
  GITHUB = 'https://github.com/search?q=org%3Aopenlawteam+tribute-ui+OR+tribute-contracts+OR+tribute-subgraph+in%3Aname&type=repositories',
  // MEDIUM = '#',
}

export default function SocialMedia() {
  return (
    <div className="socialmedia">
      {/* <a
        href={SocialMediaLinks.MEDIUM}
        target="_blank"
        rel="noopener noreferrer">
        <MediumSVG />
      </a> */}
      <a
        href={SocialMediaLinks.DISCORD}
        target="_blank"
        rel="noopener noreferrer">
        <DiscordSVG />
      </a>
      <a
        href={SocialMediaLinks.GITHUB}
        target="_blank"
        rel="noopener noreferrer">
        <GitHubSVG />
      </a>
    </div>
  );
}
