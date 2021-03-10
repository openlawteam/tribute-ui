import DiscordSVG from '../../assets/svg/DiscordSVG';
import GitHubSVG from '../../assets/svg/GitHubSVG';
import MediumSVG from '../../assets/svg/MediumSVG';

// @todo Add missing URLs when available
enum SocialMediaLinks {
  DISCORD = '#',
  // query params search sepcifically for openlawteam/molochv3-ui and
  // openlawteam/molochv3-contracts
  GITHUB = 'https://github.com/search?q=org%3Aopenlawteam+molochv3-ui+OR+molochv3-contracts+in%3Aname&type=repositories',
  MEDIUM = '#',
}

export default function SocialMedia() {
  return (
    <div className="socialmedia">
      <a
        href={SocialMediaLinks.MEDIUM}
        target="_blank"
        rel="noopener noreferrer">
        <MediumSVG />
      </a>
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
