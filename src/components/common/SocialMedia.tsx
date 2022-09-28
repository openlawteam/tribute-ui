// import DiscordSVG from '../../assets/svg/DiscordSVG';
import GitHubSVG from '../../assets/svg/GitHubSVG';
import TwitterSVG from '../../assets/svg/TwitterSVG';
// import MediumSVG from '../../assets/svg/MediumSVG';
import DiscordSVG from '../../assets/svg/DiscordSVG';

// @todo Add missing URLs when available
enum SocialMediaLinks {
  TWITTER = 'https://twitter.com/cine_capsule',
  //DISCORD = '',
  /*
   * query params search sepcifically for:
   * openlawteam/tribute-ui
   * openlawteam/tribute-contracts
   * openlawteam/tribute-contracts-cli
   * openlawteam/tribute-subgraph
   */
  GITHUB = 'https://github.com/CineCapsule',
  // MEDIUM = 'https://medium.com/',
  DISCORD= 'https://discord.com/'
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
      {/*<a
        href={SocialMediaLinks.DISCORD}
        target="_blank"
        rel="noopener noreferrer">
        <DiscordSVG />
      </a> */}
      <a
        href={SocialMediaLinks.TWITTER}
        target="_blank"
        rel="noopener noreferrer">
        <TwitterSVG />
      </a>
      <a
        href={SocialMediaLinks.GITHUB}
        target="_blank"
        rel="noopener noreferrer">
        <GitHubSVG />
      </a>
      <a href={SocialMediaLinks.DISCORD}
        target="_blank"
        rel="noopener noreferrer">
        <DiscordSVG />
      </a>
    </div>
  );
}
