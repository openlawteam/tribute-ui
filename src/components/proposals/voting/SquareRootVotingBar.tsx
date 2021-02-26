import CheckSVG from '../../../assets/svg/CheckSVG';

type SquareRootVotingBarProps = {
  /**
   * Allow values to not be set as they may not be ready
   */
  yesShares: number | undefined;
  /**
   * Allow values to not be set as they may not be ready
   */
  noShares: number | undefined;
  /**
   * Allow values to not be set as they may not be ready
   */
  totalShares: number | undefined;
  votingExpired: boolean;
  showPercentages: boolean;
};

function getSharesPercent(shares: number, totalShares: number) {
  return ((shares / totalShares) * 100).toFixed(0);
}

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

  const percentYes = totalShares
    ? getSharesPercent(yesShares, totalShares)
    : '0';
  const percentNo = totalShares ? getSharesPercent(noShares, totalShares) : '0';

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
                <CheckSVG aria-label="Vote has passed" />
              </span>
            )}
            <span className="yes-percent">{percentYes}%</span>

            {/* NO */}
            <span className="no-percent">{percentNo}%</span>
            {votingExpired && yesShares <= noShares && (
              <span className="no-check">
                <CheckSVG aria-label="Vote has failed" />
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
