import { FC, useEffect, useState } from "react";
import { BigNumber, ethers } from "ethers";

import { ReactComponent as ArrowDown } from "src/assets/icons/arrow-down.svg";
import { ReactComponent as CaretDown } from "src/assets/icons/caret-down.svg";
import useTransactionFormStyles from "src/views/home/components/transaction-form/transaction-form.styles";
import Typography from "src/views/shared/typography/typography.view";
import Card from "src/views/shared/card/card.view";
import Error from "src/views/shared/error/error.view";
import Icon from "src/views/shared/icon/icon.view";
import List from "src/views/home/components/list/list.view";
import Button from "src/views/shared/button/button.view";
import AmountInput from "src/views/home/components/amount-input/amount-input.view";
import { getChainName, Chain, Token, TransactionData } from "src/domain";
import { useEnvContext } from "src/contexts/env.context";
import {
  AsyncTask,
  isAsyncTaskDataAvailable,
  isEthersInsufficientFundsError,
} from "src/utils/types";
import { useBridgeContext } from "src/contexts/bridge.context";
import { parseError } from "src/adapters/error";
import { useUIContext } from "src/contexts/ui.context";

interface TransactionFormProps {
  onSubmit: (transactionData: TransactionData) => void;
  transaction?: TransactionData;
  account: string;
}

interface FormChains {
  from: Chain;
  to: Chain;
}

const TransactionForm: FC<TransactionFormProps> = ({ onSubmit, transaction, account }) => {
  const classes = useTransactionFormStyles();
  const env = useEnvContext();
  const { openSnackbar } = useUIContext();
  const { estimateBridgeGasPrice } = useBridgeContext();
  const [list, setList] = useState<List>();
  const [balanceFrom, setBalanceFrom] = useState<BigNumber>();
  const [balanceTo, setBalanceTo] = useState<BigNumber>();
  const [inputError, setInputError] = useState<string>();

  const [chains, setChains] = useState<FormChains>();
  const [token, setToken] = useState<Token>();
  const [amount, setAmount] = useState<BigNumber>();
  const [estimatedFee, setEstimatedFee] = useState<AsyncTask<BigNumber, string>>({
    status: "pending",
  });

  const onChainFromButtonClick = (from: Chain) => {
    if (env && chains) {
      const to = env.chains.find((chain) => chain.key !== from.key);

      if (to) {
        setChains({ from, to });
        setList(undefined);
        setAmount(undefined);
      }
    }
  };

  const onInputChange = ({ amount, error }: { amount?: BigNumber; error?: string }) => {
    setAmount(amount);
    setInputError(error);
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chains && token && amount && estimatedFee.status === "successful") {
      onSubmit({
        token: token,
        from: chains.from,
        to: chains.to,
        amount: amount,
        estimatedFee: estimatedFee.data,
      });
    }
  };

  useEffect(() => {
    if (transaction !== undefined) {
      setChains({ from: transaction.from, to: transaction.to });
      setToken(transaction.token);
      setAmount(transaction.amount);
    } else if (env !== undefined) {
      setChains({ from: env.chains[0], to: env.chains[1] });
      setToken(env.tokens.ETH);
    }
  }, [env, transaction]);

  useEffect(() => {
    if (chains) {
      void chains.from.provider.getBalance(account).then(setBalanceFrom);
      void chains.to.provider.getBalance(account).then(setBalanceTo);
    }
  }, [chains, account]);

  useEffect(() => {
    if (chains && token) {
      estimateBridgeGasPrice({
        from: chains.from,
        to: chains.to,
        token,
        destinationAddress: account,
      })
        .then((estimatedFee) => {
          setEstimatedFee({ status: "successful", data: estimatedFee });
        })
        .catch((error) => {
          if (isEthersInsufficientFundsError(error)) {
            setEstimatedFee({
              status: "failed",
              error: "You don't have enough ETH to pay for the fees",
            });
          } else {
            void parseError(error).then((errorMessage) => {
              openSnackbar({ type: "error-msg", text: errorMessage });
            });
          }
        });
    }
  }, [account, chains, token, estimateBridgeGasPrice, openSnackbar]);

  if (!env || !chains || !token) {
    return null;
  }

  return (
    <form className={classes.form} onSubmit={onFormSubmit}>
      <Card className={classes.card}>
        <div className={classes.row}>
          <div className={classes.box}>
            <Typography type="body2">From</Typography>
            <button
              className={`${classes.chainSelector} ${classes.chainSelectorButton}`}
              onClick={() =>
                setList({
                  type: "chain",
                  items: env.chains,
                  onClick: onChainFromButtonClick,
                })
              }
              type="button"
            >
              <chains.from.Icon />
              <Typography type="body1">{getChainName(chains.from)}</Typography>
              <CaretDown />
            </button>
          </div>
          <div className={`${classes.box} ${classes.alignRight}`}>
            <Typography type="body2">Balance</Typography>
            <Typography type="body1">
              {balanceFrom ? ethers.utils.formatEther(balanceFrom) : "--"} ETH
            </Typography>
          </div>
        </div>
        <div className={`${classes.row} ${classes.middleRow}`}>
          <div className={classes.tokenSelector}>
            <Icon url={token.logoURI} size={24} />
            <Typography type="h2">{token.symbol}</Typography>
          </div>
          <AmountInput
            value={amount}
            token={token}
            balance={balanceFrom || BigNumber.from(0)}
            fee={isAsyncTaskDataAvailable(estimatedFee) ? estimatedFee.data : undefined}
            onChange={onInputChange}
          />
        </div>
      </Card>
      <div className={classes.arrowRow}>
        <div className={classes.arrowDownIcon}>
          <ArrowDown />
        </div>
      </div>
      <Card className={classes.card}>
        <div className={classes.row}>
          <div className={classes.box}>
            <Typography type="body2">To</Typography>
            <div className={classes.chainSelector}>
              <chains.to.Icon />
              <Typography type="body1">{getChainName(chains.to)}</Typography>
            </div>
          </div>
          <div className={`${classes.box} ${classes.alignRight}`}>
            <Typography type="body2">Balance</Typography>
            <Typography type="body1">
              {balanceTo ? ethers.utils.formatEther(balanceTo) : "--"} ETH
            </Typography>
          </div>
        </div>
      </Card>
      <div className={classes.button}>
        <Button
          type="submit"
          disabled={
            !amount ||
            amount.isZero() ||
            inputError !== undefined ||
            estimatedFee.status === "failed"
          }
        >
          Continue
        </Button>
        {amount && inputError && estimatedFee.status !== "failed" && <Error error={inputError} />}
        {estimatedFee.status === "failed" && <Error error={estimatedFee.error} />}
      </div>
      {list && (
        <List
          placeholder={list.type === "chain" ? "Search network" : "Search token"}
          list={list}
          onClose={() => setList(undefined)}
        />
      )}
    </form>
  );
};

export default TransactionForm;
