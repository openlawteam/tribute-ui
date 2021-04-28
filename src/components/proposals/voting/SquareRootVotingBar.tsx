import CheckSVG from '../../../assets/svg/CheckSVG';

type SquareRootVotingBarProps = {
  /**
   * Allow values to not be set as they may not be ready
   */
  yesUnits: number | undefined;
  /**
   * Allow values to not be set as they may not be ready
   */
  noUnits: number | undefined;
  /**
   * Allow values to not be set as they may not be ready
   */
  totalUnits: number | undefined;
  votingExpired: boolean;
  showPercentages: boolean;
};

function getUnitsPercent(units: number, totalUnits: number) {
  return ((units / totalUnits) * 100).toFixed(0);
}

export function SquareRootVotingBar({
  yesUnits = 0,
  noUnits = 0,
  totalUnits,
  votingExpired,
  showPercentages,
}: SquareRootVotingBarProps) {
  /**
   * Variables
   */

  const percentYes = totalUnits ? getUnitsPercent(yesUnits, totalUnits) : '0';
  const percentNo = totalUnits ? getUnitsPercent(noUnits, totalUnits) : '0';

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
            {votingExpired && yesUnits > noUnits && (
              <span className="yes-check">
                <CheckSVG aria-label="Vote has passed" />
              </span>
            )}
            <span className="yes-percent">{percentYes}%</span>

            {/* NO */}
            <span className="no-percent">{percentNo}%</span>
            {votingExpired && yesUnits <= noUnits && (
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
