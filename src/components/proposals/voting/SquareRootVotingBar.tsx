import CheckSVG from '../../../assets/svg/CheckSVG';

type SquareRootVotingBarProps = {
  yesShares: number;
  noShares: number;
  totalShares: number;
  votingExpired: boolean;
  showPercentages: boolean;
};

export function SquareRootVotingBar({
  yesShares = 0,
  noShares = 0,
  totalShares,
  votingExpired,
  showPercentages,
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
        {/* YES */}
        <div
          className="votingbar__segment--yes"
          aria-label={`${percentYes}% yes votes`}
          style={{
            width: `${percentYes}%`,
          }}
        />

        {/* NO */}
        <div
          className="votingbar__segment--no"
          aria-label={`${percentNo}% no votes`}
          style={{
            width: `${percentNo}%`,
          }}
        />
      </div>

      <div className="votingbar__percentages">
        {showPercentages && (
          <>
            {/* YES */}
            {votingExpired && yesShares > noShares && (
              <span className="yes-check">
                <CheckSVG />
              </span>
            )}
            <span className="yes-percent">{percentYes}%</span>

            {/* NO */}
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
