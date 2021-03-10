import DiscordSVG from '../../assets/svg/DiscordSVG';
import GitHubSVG from '../../assets/svg/GitHubSVG';
import MediumSVG from '../../assets/svg/MediumSVG';

// @todo Add missing URLs when available
enum SocialMediaLinks {
  DISCORD = '#',
  GITHUB_CONTRACTS = 'https://github.com/openlawteam/molochv3-contracts',
  GITHUB_UI = 'https://github.com/openlawteam/molochv3-ui',
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
        href={SocialMediaLinks.GITHUB_UI}
        target="_blank"
        rel="noopener noreferrer">
        <GitHubSVG />
      </a>
      <a
        href={SocialMediaLinks.GITHUB_CONTRACTS}
        target="_blank"
        rel="noopener noreferrer">
        <GitHubSVG />
      </a>
    </div>
  );
}
