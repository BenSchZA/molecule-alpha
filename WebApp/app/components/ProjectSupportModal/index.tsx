import React, { useState, useEffect } from 'react';
import { WithStyles, Modal, Typography, Paper, TextField, InputAdornment, Avatar } from '@material-ui/core';
import { Info, Close } from '@material-ui/icons';
import { IMarket } from "@molecule-protocol/catalyst-contracts";
import { ethers } from 'ethers';
import { Link } from 'react-router-dom';
import Blockies from 'react-blockies';
import MoleculeSpinner from 'components/MoleculeSpinner/Loadable';
import DaiIcon from 'components/DaiIcon/Loadable';
import { getBlockchainObjects } from 'blockchainResources';

import { NegativeButton, PositiveButton } from 'components/custom';
import useDebounce from './useDebounce';
import styles from './styles';
import { withStyles } from '@material-ui/styles';

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
  const [contribution, setContribution] = useState(0);
  const [projectTokenAmount, setProjectTokenAmount] = useState(0);

  const debouncedContribution = useDebounce(contribution, 100);

  useEffect(() => {
    if (debouncedContribution) {
      const fetchData = async () => {
        const { signer } = await getBlockchainObjects();
        const market = new ethers.Contract(marketAddress, IMarket, signer);

        const tokenValue = await market.collateralToTokenBuying(
          ethers.utils.parseUnits(`${debouncedContribution}`, 18)
        );
        setProjectTokenAmount(Number(ethers.utils.formatUnits(tokenValue, 18)))
      };
      debouncedContribution > 0 ? fetchData() : setProjectTokenAmount(0);
    }
  }, [debouncedContribution]);

  const displayPrecision = 2;
  const toResearcher = Number((contribution * contributionRate / 100).toFixed(displayPrecision));
  const toIncentivePool = Number((contribution - (contribution * contributionRate / 100)).toFixed(displayPrecision));
  const maxProjectContribution = Math.min(maxResearchContribution / contributionRate * 100, daiBalance);

  const validateContribution = (value: string) => {
    const newValue = parseFloat(value);
    !isNaN(newValue) && setContribution(newValue);
  }

  return (
    <Modal
      open={modalState}
      onClose={closeModal}
      disableBackdropClick={txInProgress}>
      <Paper square={false} className={classes.modal}>
        <div className={classes.modalTitle}>
          <Typography variant="h2">Support Project</Typography>
        </div>
        <DaiIcon />
        <Typography className={classes.daiBalance}>{daiBalance ? daiBalance.toFixed(displayPrecision) : 0}</Typography>
        <Typography>
          Your Account Balance
        </Typography>
        <TextField
          autoFocus
          error={(daiBalance < contribution) ? true : false}
          helperText={(daiBalance < contribution) && 'You do not have enough DAI'}
          value={contribution}
          onChange={(e) => validateContribution(e.target.value)}
          className={classes.input}
          inputProps={{
            min: 0,
            max: maxProjectContribution,
          }}
          InputProps={{
            endAdornment: <InputAdornment position='end' className={classes.inputAdornment}>DAI</InputAdornment>,
          }} />
        <Typography>
          Enter Contribution Amount
        </Typography>
        <Typography>
          PLEASE NOTE: Your contribution will be split into two portions.
          The first portion will go directly to the project owner.
          The second portion represents your stake in the research project
          and will be added to a communal pool that grows proportionally
          with more project contributions.
        </Typography>
        <section className={classes.fundingSplit}>
          <div>
            <div className={classes.currency}>
              <DaiIcon height={30} />
              <Typography className={classes.daiValues}>{toResearcher.toFixed(displayPrecision)}</Typography>
            </div>
            <Typography>
              Research Funding
            </Typography>
          </div>
          <div>
            <div className={classes.currency}>
              <DaiIcon height={30} />
              <Typography className={classes.daiValues}>
                {toIncentivePool.toFixed(displayPrecision)}
              </Typography>
            </div>
            <Typography>
              Project Stake
            </Typography>
          </div>
        </section>
        <Typography>
          In return for your contribution, you will receive tokens priced according to the project bonding curve.
          These tokens can always be redeemed for their current value.
        </Typography>
        <div className={classes.currency}>

          <Avatar className={classes.blockie}>
            <Blockies seed={marketAddress || '0x'} size={10} />
          </Avatar>
          <Typography className={classes.daiValues}>{projectTokenAmount.toFixed(displayPrecision)}</Typography>
        </div>

        <Typography>Project Tokens</Typography>
        <Typography>You can keep up to date with the value of your project tokens in the <Link to='/myProjects' className={classes.link}>My Projects</Link> tab</Typography>
        <div className={classes.buttons}>
          <NegativeButton disabled={txInProgress} onClick={closeModal}>Cancel</NegativeButton>
          <PositiveButton
            disabled={txInProgress || daiBalance < contribution || contribution >= maxProjectContribution}
            onClick={() => supportProject(contribution)}>
            Support Project
          </PositiveButton>
        </div>
        <Link className={classes.link} to="/">
          <Info />
          <span>
            Need more information?
          </span>
        </Link>
        <div className={classes.closeModal} onClick={closeModal} style={{ display: (!txInProgress) ? "block" : "none" }}>
          <Close style={{ padding: '0px' }} />
        </div>
        <div className={classes.overlay} style={{ display: (txInProgress) ? "block" : "none" }}>
          <div className={classes.spinner}>
            <MoleculeSpinner />
          </div>
        </div>
      </Paper>
    </Modal>
  );
};

export default withStyles(styles, { withTheme: true })(ProjectSupportModal);
