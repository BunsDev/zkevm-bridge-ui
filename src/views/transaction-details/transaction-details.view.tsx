import { FC } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

import useTransactionDetailsStyles from "src/views/transaction-details/transaction-details.styles";
import Card from "src/views/shared/card/card.view";
import Header from "src/views/shared/header/header.view";
import { ReactComponent as NewWindowIcon } from "src/assets/icons/new-window.svg";
import { ReactComponent as SpinnerIcon } from "src/assets/icons/spinner.svg";
import Typography from "src/views/shared/typography/typography.view";
import { StatusText } from "src/views/activity/components/transaction-card/transaction-card.view";
import { demoData } from "src/views/activity/demo-data";
import { getTimeFromNow } from "src/utils/time";
import { convertTokenAmountToFiat } from "src/utils/amounts";
import TokenIcon from "src/views/shared/token-icon/token-icon";
import ChainRow from "src/views/transaction-details/components/chain-row/chain-row";

const TransactionDetails: FC = () => {
  const { transactionId } = useParams();
  const data = demoData.find((demo) => demo.id.toString() === transactionId);
  const classes = useTransactionDetailsStyles({ status: data?.status || "initiated" });

  if (!data) {
    Navigate({ to: "/activity", replace: true });
    return null;
  }

  const { amount, token, timestamp, type, status } = data;
  return (
    <>
      <Header title="Transaction Details" />
      <Card className={classes.card}>
        <div className={classes.balance}>
          <TokenIcon token={token} className={classes.tokenIcon} />
          <Typography type="h2">{`${amount} ${token.toUpperCase()}`}</Typography>
          <Typography type="body2">{convertTokenAmountToFiat({ amount, token })}</Typography>
        </div>
        <div className={classes.row}>
          <Typography type="body2" className={classes.alignRow}>
            Status
          </Typography>
          <Typography type="body1" className={classes.alignRow}>
            <span className={classes.dot} />
            {StatusText[status]}
          </Typography>
        </div>
        <div className={classes.row}>
          <Typography type="body2" className={classes.alignRow}>
            {status === "initiated" ? "Confirmation expected in" : "Date"}
          </Typography>
          <Typography type="body1" className={classes.alignRow}>
            {status === "initiated" ? (
              <>
                Estimating Time <SpinnerIcon />
              </>
            ) : (
              <>{getTimeFromNow({ timestamp })} ago</>
            )}
          </Typography>
        </div>
        <div className={classes.row}>
          <Typography type="body2" className={classes.alignRow}>
            From
          </Typography>
          <Typography type="body1" className={classes.alignRow}>
            <ChainRow type={type} side="from" />
          </Typography>
        </div>
        <div className={classes.row}>
          <Typography type="body2" className={classes.alignRow}>
            To
          </Typography>
          <Typography type="body1" className={classes.alignRow}>
            <ChainRow type={type} side="to" />
          </Typography>
        </div>
        <div className={classes.row}>
          <Typography type="body2" className={classes.alignRow}>
            L2 Fee
          </Typography>
          <Typography type="body1" className={classes.alignRow}>
            <TokenIcon token="eth" />
            {`0.01ETH ~ ${convertTokenAmountToFiat({ amount: 0.01, token: "eth" })}`}
          </Typography>
        </div>
        <div className={classes.row}>
          <Typography type="body2" className={classes.alignRow}>
            L1 gas fee
          </Typography>
          <Typography type="body1" className={classes.alignRow}>
            <TokenIcon token="eth" />
            {`0.10ETH ~ ${convertTokenAmountToFiat({ amount: 0.1, token: "eth" })}`}
          </Typography>
        </div>
        <div className={`${classes.row} ${classes.lastRow}`}>
          <Typography type="body2" className={classes.alignRow}>
            Track transaction
          </Typography>
          <Link to="#" target="_blank" className={classes.explorerButton}>
            <NewWindowIcon /> <Typography type="body1">View on explorer</Typography>
          </Link>
        </div>
      </Card>
      {(status === "initiated" || status === "on-hold") && (
        <div className={classes.finaliseRow}>
          <button className={classes.finaliseButton} disabled={status === "initiated"}>
            <Typography type="body1" className={classes.finaliseButtonText}>
              Finalise
            </Typography>
            {status === "initiated" && <SpinnerIcon className={classes.finaliseSpinner} />}
          </button>
        </div>
      )}
    </>
  );
};

export default TransactionDetails;
