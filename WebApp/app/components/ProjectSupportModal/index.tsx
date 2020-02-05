import React, { useState, useEffect } from 'react';
import { WithStyles, Typography, Paper, TextField, InputAdornment, Avatar, Dialog, Link } from '@material-ui/core';
import { Info, Close } from '@material-ui/icons';
import { IMarket } from "@molecule-protocol/catalyst-contracts";
import { withStyles } from '@material-ui/styles';
import { ethers } from 'ethers';
import { Link as RouterLink } from 'react-router-dom';
import Blockies from 'react-blockies';
import MoleculeSpinner from 'components/MoleculeSpinner/Loadable';
import { getBlockchainObjects } from 'blockchainResources';
import { NegativeButton, PositiveButton } from 'components/custom';
import DaiIcon from 'components/DaiIcon/Loadable';
import ProjectDisclaimer from 'components/ProjectDisclaimer';

import styles from './styles';
import UniswapExpansionPanel from 'components/UniswapExpansionPanel';

interface Props extends WithStyles<typeof styles> {
  modalState: boolean,
  daiBalance: number,
  contributionRate: number,
  txInProgress: boolean,
  marketAddress: string,
  maxResearchContribution: number,
  closeModal(): void,
  supportProject(contributionAmount: number): void;
}

const ProjectSupportModal: React.FunctionComponent<Props> = ({
  classes,
  daiBalance,
  modalState,
  closeModal,
  contributionRate,
  txInProgress,
  supportProject,
  marketAddress,
  maxResearchContribution,
}: Props) => {
  const minProjectContribution = 0.5;
  const [contribution, setContribution] = useState<number|null>(minProjectContribution);
  const [projectTokenAmount, setProjectTokenAmount] = useState(minProjectContribution);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      const { signer } = await getBlockchainObjects();
      const market = new ethers.Contract(marketAddress, IMarket, signer);

      const tokenValue = (contribution && contribution > 0) ?
        await market.collateralToTokenBuying(ethers.utils.parseEther(`${contribution}`))
        : 0;
      if (!cancelled) {
        setProjectTokenAmount(Number(ethers.utils.formatUnits(tokenValue, 18)))
      }
    };
    fetchData();
    return () => { cancelled = true }
  }, [contribution]);

  const displayPrecision = 2;
  const toResearcher = contribution ? Number((contribution * contributionRate / 100).toFixed(displayPrecision)) : 0;
  const toIncentivePool = contribution ? Number((contribution - (contribution * contributionRate / 100)).toFixed(displayPrecision)) : 0;
  const maxProjectContribution = (maxResearchContribution / contributionRate * 100) + minProjectContribution;
  const maxContribution = Math.min(maxProjectContribution, daiBalance);

  const validateContribution = (value: string) => {
    if (value === '') {
      setContribution(null);
      setProjectTokenAmount(0);
      return;
    }
    const newValue = Math.min(maxContribution, parseFloat(value));
    !isNaN(newValue) && setContribution(newValue);
  }

  const resetModalState = () => {
    setContribution(0);
    setProjectTokenAmount(0);
    closeModal();
  }
  return (
    <Dialog
      open={modalState}
      onClose={resetModalState}
      disableBackdropClick={txInProgress}
      scroll='body'
      PaperProps={{
        className: classes.modalSurface
      }}>
      <Paper square={false} className={classes.modal}>
        <div className={classes.modalTitle}>
          <Typography variant="h2">Support Project</Typography>
        </div>
        <hr className={classes.divider} />
        <DaiIcon />
        <Typography className={classes.daiBalance} onClick={() => setContribution(maxContribution)}>
          {daiBalance ? daiBalance.toLocaleString(undefined, { maximumFractionDigits: 2 }) : 0}
        </Typography>
        <Typography className={classes.modalText}>
          Your Account Balance
        </Typography>
        <ProjectDisclaimer />
        <UniswapExpansionPanel />
        <TextField
          autoFocus
          type='number'
          helperText={
            !contribution && 'Please enter a valid numeric value' ||
            contribution && (
              daiBalance < minProjectContribution && `You need to get DAI, try Uniswap. The minimum contribution is ${minProjectContribution} DAI.` ||
              contribution < minProjectContribution && `Minimum contribution is ${minProjectContribution} DAI` ||
              contribution >= maxProjectContribution && `Contribution was larger than remaining funding goal of ${maxProjectContribution.toFixed(displayPrecision)} DAI` ||
              contribution > maxContribution && `Contribution was larger than DAI balance of ${maxContribution}`
            )
          }
          value={contribution === 0 || contribution ? contribution : ''}
          onChange={(e) => validateContribution(e.target.value)}
          className={classes.input}
          inputProps={{
            min: minProjectContribution,
            max: maxContribution,
            step: 0.01
          }}
          InputProps={{
            endAdornment: <InputAdornment position='end' className={classes.inputAdornment}>DAI</InputAdornment>,
          }}
          FormHelperTextProps={{
            className: classes.formHelperText
          }} />
        <Typography className={classes.modalText}>
          Enter Contribution Amount
        </Typography>
        <hr className={classes.divider} />
        <Typography className={classes.modalText}>
          PLEASE NOTE: Your contribution will be split into two portions.
          The first portion will go directly to the research funding vault that is controlled by the research lead.
          The second portion will be added to the project stake reserve that determines the project token price.
        </Typography>
        <section className={classes.fundingSplit}>
          <div>
            <div className={classes.currency}>
              <DaiIcon height={30} />
              <Typography className={classes.daiValues}>
                {toResearcher.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
              </Typography>
            </div>
            <Typography className={classes.modalText}>
              Research Funding
            </Typography>
          </div>
          <hr className={classes.verticalDivider} />
          <div>
            <div className={classes.currency}>
              <DaiIcon height={30} />
              <Typography className={classes.daiValues}>
                {toIncentivePool.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
              </Typography>
            </div>
            <Typography className={classes.modalText}>
              Project Stake
            </Typography>
          </div>
        </section>
        <Typography className={classes.modalText}>
          As a reward for your contribution, you will receive a number of unique project tokens that represent your project stake. The value for these tokens changes but they can always be redeemed at their current price.
        </Typography>
        <section className={classes.projectTokens}>
          <div className={classes.currency}>
            <Avatar className={classes.blockie}>
              <Blockies seed={marketAddress || '0x'} size={10} />
            </Avatar>
            <Typography className={classes.daiValues}>{projectTokenAmount.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</Typography>
          </div>
          <Typography className={classes.modalText}>
            Project Tokens
          </Typography>
        </section>
        <Typography className={classes.modalText}>
          You can keep up to date with the value of your project tokens in the <RouterLink to='/myProjects' className={classes.link}>My Projects</RouterLink> tab
        </Typography>
        <div className={classes.buttons}>
          <PositiveButton
            disabled={txInProgress}
            onClick={resetModalState}>
            Cancel
          </PositiveButton>
          <NegativeButton
            disabled={txInProgress || !contribution || contribution > maxContribution || contribution < minProjectContribution}
            onClick={() => contribution ? supportProject(contribution) : undefined}>
            Support Project
          </NegativeButton>
        </div>
        <div className={classes.moreInfo}>
          <Link
            className={classes.link}
            href="https://catalyst.molecule.to/learn"
            target="_blank"
            rel="noreferrer">
            <Info />
            <span>
              Need more information?
          </span>
          </Link>
        </div>
        <div
          className={classes.closeModal}
          onClick={resetModalState}
          style={{ display: (!txInProgress) ? "block" : "none" }}>
          <Close style={{ padding: '0px' }} />
        </div>
        <div className={classes.overlay} style={{ display: (txInProgress) ? "block" : "none" }}>
          <div className={classes.spinner}>
            <MoleculeSpinner />
          </div>
        </div>
      </Paper>
    </Dialog>
  );
};

export default withStyles(styles, { withTheme: true })(ProjectSupportModal);
