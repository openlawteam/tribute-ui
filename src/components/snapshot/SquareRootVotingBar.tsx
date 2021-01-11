import CheckSVG from '../../assets/svg/CheckSVG';

type SquareRootVotingBarProps = {
  yesShares: number;
  noShares: number;
  totalShares: number;
  votingExpired: boolean;
  showPercentages?: boolean;
};

export default function SquareRootVotingBar({
  yesShares = 0,
  noShares = 0,
  totalShares,
  votingExpired,
  showPercentages = true,
}: SquareRootVotingBarProps) {
  /**
   * Variables
   */

  const percentYes = ((yesShares / totalShares) * 100).toFixed(0) || '0';
  const percentNo = ((noShares / totalShares) * 100).toFixed(0) || '0';

  /**
   * Render
   */

  return (
    <div className="votingbar-container">
      <div className="votingbar">
        <div
          className="votingbar__segment--yes"
          style={{
            width: `${percentYes}%`,
          }}
        />
        <div
          className="votingbar__segment--no"
          style={{
            width: `${percentNo}%`,
          }}
        />
      </div>

      <div className="votingbar__percentages">
        {showPercentages && (
          <>
            {votingExpired && yesShares > noShares && (
              <span className="yes-check">
                <CheckSVG />
              </span>
            )}
            <span className="yes-percent">{percentYes}%</span>
            <span className="no-percent">{percentNo}%</span>
            {votingExpired && yesShares <= noShares && (
              <span className="no-check">
                <CheckSVG />
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
