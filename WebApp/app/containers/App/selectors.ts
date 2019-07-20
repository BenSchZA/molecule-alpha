
import { createStructuredSelector } from 'reselect';
import { RootState } from './types';
import { StateProps } from 'containers/App';
import { makeSelectIsLoggedIn, makeSelectWalletUnlocked, makeSelectNetworkName, makeSelectEthAddress } from 'domain/authentication/selectors';
import { makeSelectUserDisplayName } from '../../domain/userProfile/selectors';

/**
 * Direct selector to the user state domain
 */


/**
 * Other specific selectors
 */


/**
 * Default selector used by App
 */

// Root
const selectApp = createStructuredSelector<RootState, StateProps>({
  isLoggedIn: makeSelectIsLoggedIn,
  walletUnlocked: makeSelectWalletUnlocked,
  selectedNetworkName: makeSelectNetworkName,
  userDisplayName: makeSelectUserDisplayName,
  ethAddress: makeSelectEthAddress,
});

export default selectApp;
